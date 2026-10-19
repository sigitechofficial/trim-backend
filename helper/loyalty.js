/**
 * Loyalty discount: "after Y completed visits, X% off the next booking".
 *
 * Agreed rules (client, 2026-10-19):
 * - Only completed bookings of a logged-in client count, from the day the shop
 *   first switched the offer on, and only if the booking reaches the shop's
 *   optional minimum value. Excluded services still count as a visit.
 * - The reward is used on the next booking, on non-excluded services only, and
 *   is worked out here, never trusted from the app.
 * - A booking holding the reward: completed -> card back to 0 (that visit does
 *   not count); cancelled / declined / expired -> reward free again;
 *   no-show -> reward lost.
 * - A coupon may be used too only if the shop allows it; loyalty comes first.
 * - Every shop row is separate, so a chair renter's card never mixes with the
 *   parent shop's card.
 * - Earned rewards stay usable after the shop changes or switches off the offer.
 */
const { Op } = require('sequelize')
const { DateTime } = require('luxon')
const {
  sequelize,
  loyaltyProgram,
  loyaltyExcludedService,
  loyaltyCard,
  loyaltyEvent,
  booking,
  jobs,
  service,
  salonDetail,
  user,
  deviceToken,
} = require('../models')
const ThrowNotification = require('../utils/throwNotification')
const { SHOP_ZONE } = require('./bookingApproval')
const rules = require('./loyaltyRules')

const { round2, HOLDING_STATUSES } = rules

async function getProgram(salonDetailId) {
  if (!salonDetailId) return null
  return loyaltyProgram.findOne({
    where: { salonDetailId },
    include: { model: loyaltyExcludedService, attributes: ['serviceId'] },
  })
}

const excludedIdsOf = (program) =>
  (program?.loyaltyExcludedServices || []).map((e) => Number(e.serviceId))

async function getCard(salonDetailId, customerId) {
  if (!salonDetailId || !customerId) return null
  return loyaltyCard.findOne({ where: { salonDetailId, customerId } })
}

// The open booking that holds this card's reward (ignoring `exceptBookingId`).
async function holdingBooking(cardId, exceptBookingId = null) {
  if (!cardId) return null
  const where = {
    loyaltyCardId: cardId,
    loyaltyDiscount: { [Op.gt]: 0 },
    status: { [Op.in]: HOLDING_STATUSES },
  }
  if (exceptBookingId) where.id = { [Op.ne]: exceptBookingId }
  return booking.findOne({ where, attributes: ['id', 'on', 'startTime'] })
}

async function cardStatus(card, exceptBookingId = null) {
  if (!card?.rewardEarnedAt) return rules.rewardStatus(card)
  const held = await holdingBooking(card.id, exceptBookingId)
  return rules.rewardStatus(card, { held: !!held })
}

// Services a shop can book: its own, plus the parent shop's for a chair renter
// who uses the parent's menu.
async function shopServiceIds(salonDetailId) {
  const shop = await salonDetail.findByPk(salonDetailId, { attributes: ['id', 'parentSalonId'] })
  return [salonDetailId, shop?.parentSalonId].filter(Boolean)
}

/**
 * What the reward would take off these services, for this client, now.
 * Returns { eligible, status, percentage, loyaltyDiscount, lines, combineWithCoupon, reason }.
 */
async function quote({ salonDetailId, customerId, serviceIds = [], exceptBookingId = null }) {
  const program = await getProgram(salonDetailId)
  const result = {
    eligible: false,
    status: 'none',
    percentage: 0,
    loyaltyDiscount: 0,
    lines: [],
    combineWithCoupon: !!program?.combineWithCoupon,
    cardId: null,
    reason: null,
  }
  if (!program) return { ...result, reason: 'no_offer' }
  if (!customerId) return { ...result, reason: 'not_logged_in' }

  const card = await getCard(salonDetailId, customerId)
  result.status = await cardStatus(card, exceptBookingId)
  result.cardId = card?.id || null
  if (result.status !== 'ready') return { ...result, reason: `reward_${result.status}` }

  const ids = serviceIds.map(Number).filter((id) => id > 0)
  if (!ids.length) return { ...result, reason: 'no_services' }
  const rows = await service.findAll({
    where: { id: [...new Set(ids)], salonDetailId: await shopServiceIds(salonDetailId) },
    attributes: ['id', 'price', 'discount'],
  })
  const byId = new Map(rows.map((r) => [Number(r.id), r]))
  if (ids.some((id) => !byId.has(id))) return { ...result, reason: 'unknown_service' }

  const percentage = Number(card.rewardPercentage ?? program.discountPercentage)
  const { lines, loyaltyDiscount } = rules.computeLines(
    ids.map((id) => ({ serviceId: id, price: rules.servicePrice(byId.get(id)) })),
    percentage,
    excludedIdsOf(program),
  )
  return {
    ...result,
    eligible: loyaltyDiscount > 0,
    percentage,
    loyaltyDiscount,
    lines,
    reason: loyaltyDiscount > 0 ? null : 'all_services_excluded',
  }
}

// Discount for one service line of a booking that used the reward (business
// edits a service). 0 when the booking has no reward or the service is excluded.
async function lineDiscount(bookingRow, serviceId, price) {
  const pct = Number(bookingRow?.loyaltyPercentage) || 0
  if (!pct || !(Number(bookingRow?.loyaltyDiscount) > 0 || bookingRow?.loyaltyCardId)) return 0
  const program = await getProgram(bookingRow.salonDetailId)
  if (excludedIdsOf(program).includes(Number(serviceId))) return 0
  const p = Number(price) || 0
  return Math.min(round2((p * pct) / 100), p)
}

const shopDate = (d) => DateTime.fromJSDate(new Date(d)).setZone(SHOP_ZONE).toISODate()

async function bookingValue(bookingId, transaction) {
  const lines = await jobs.findAll({
    where: { bookingId, status: { [Op.ne]: 'cancel' } },
    attributes: ['total', 'loyaltyDiscount'],
    transaction,
  })
  return round2(lines.reduce((s, j) => s + Number(j.total || 0) + Number(j.loyaltyDiscount || 0), 0))
}

// Locks (or creates) the card inside the transaction.
async function lockedCard(salonDetailId, customerId, transaction) {
  await loyaltyCard.findOrCreate({
    where: { salonDetailId, customerId },
    defaults: { visitCount: 0 },
    transaction,
  })
  return loyaltyCard.findOne({
    where: { salonDetailId, customerId },
    lock: transaction.LOCK.UPDATE,
    transaction,
  })
}

async function alreadyLogged(bookingId, types, transaction) {
  return loyaltyEvent.findOne({ where: { bookingId, type: types }, attributes: ['id'], transaction })
}

/**
 * Call after a booking is checked out. Uses the reward (card back to 0) or
 * counts a visit (and may earn the reward). Never throws.
 */
async function onBookingCompleted(bookingId) {
  try {
    const b = await booking.findByPk(bookingId, {
      attributes: ['id', 'salonDetailId', 'customerId', 'status', 'on', 'loyaltyDiscount', 'loyaltyCardId'],
    })
    if (!b || b.status !== 'complete' || !(Number(b.customerId) > 0)) return

    if (b.loyaltyCardId && Number(b.loyaltyDiscount) > 0) {
      await closeReward(b, 'redeemed')
      return
    }

    const program = await getProgram(b.salonDetailId)
    if (!program?.isActive) return
    if (program.startedAt && b.on && b.on < shopDate(program.startedAt)) return

    let earned = null
    await sequelize.transaction(async (t) => {
      if (program.minBookingValue && (await bookingValue(b.id, t)) < Number(program.minBookingValue)) return
      const card = await lockedCard(b.salonDetailId, b.customerId, t)
      if (await alreadyLogged(b.id, ['visit', 'redeemed'], t)) return
      const next = rules.addVisit(card.get({ plain: true }), program)
      if (next.expired) {
        await loyaltyEvent.create({ loyaltyCardId: card.id, type: 'expired', visitCount: card.visitCount }, { transaction: t })
      }
      await card.update(
        {
          visitCount: next.card.visitCount,
          lastVisitAt: next.card.lastVisitAt,
          rewardEarnedAt: next.card.rewardEarnedAt,
          rewardExpiresAt: next.card.rewardExpiresAt,
          rewardPercentage: next.card.rewardPercentage,
        },
        { transaction: t },
      )
      await loyaltyEvent.create(
        { loyaltyCardId: card.id, bookingId: b.id, type: 'visit', visitCount: next.card.visitCount },
        { transaction: t },
      )
      if (next.earned) {
        await loyaltyEvent.create(
          { loyaltyCardId: card.id, bookingId: b.id, type: 'earned', visitCount: next.card.visitCount },
          { transaction: t },
        )
        earned = next.card
      }
    })
    if (earned) notifyRewardEarned(b.salonDetailId, b.customerId, earned)
  } catch (err) {
    console.error(`[loyalty] onBookingCompleted(${bookingId}) failed:`, err.message)
  }
}

/** Call after a booking is marked no-show: a reward it held is lost. Never throws. */
async function onBookingNoShow(bookingId) {
  try {
    const b = await booking.findByPk(bookingId, {
      attributes: ['id', 'salonDetailId', 'customerId', 'loyaltyDiscount', 'loyaltyCardId'],
    })
    if (b?.loyaltyCardId && Number(b.loyaltyDiscount) > 0) await closeReward(b, 'forfeited')
  } catch (err) {
    console.error(`[loyalty] onBookingNoShow(${bookingId}) failed:`, err.message)
  }
}

async function closeReward(b, type) {
  await sequelize.transaction(async (t) => {
    const card = await loyaltyCard.findByPk(b.loyaltyCardId, { lock: t.LOCK.UPDATE, transaction: t })
    if (!card) return
    if (await alreadyLogged(b.id, ['redeemed', 'forfeited'], t)) return
    await card.update(rules.clearedReward(), { transaction: t })
    await loyaltyEvent.create(
      { loyaltyCardId: card.id, bookingId: b.id, type, visitCount: 0, amount: b.loyaltyDiscount },
      { transaction: t },
    )
  })
}

async function notifyRewardEarned(salonDetailId, customerId, card) {
  try {
    const [shop, client] = await Promise.all([
      salonDetail.findByPk(salonDetailId, { attributes: ['id', 'salonName'] }),
      user.findByPk(customerId, { attributes: ['id'], include: { model: deviceToken, attributes: ['tokenId'] } }),
    ])
    const tokens = (client?.deviceTokens || []).map((d) => d.tokenId).filter(Boolean)
    if (!tokens.length) return
    const pct = Number(card.rewardPercentage)
    ThrowNotification(
      tokens,
      {
        title: 'You have earned a reward',
        body: `${shop?.salonName || 'Your barber'}: ${pct}% off your next booking.`,
      },
      { type: 'loyaltyReward', salonId: String(salonDetailId), percentage: String(pct) },
      customerId,
    )
  } catch (err) {
    console.error('[loyalty] reward push failed:', err.message)
  }
}

async function excludedServices(program) {
  const ids = excludedIdsOf(program)
  if (!ids.length) return []
  const rows = await service.findAll({ where: { id: ids }, attributes: ['id', 'serviceName'] })
  return rows.map((r) => ({ id: r.id, serviceName: r.serviceName }))
}

/**
 * The offer and this client's card, for the shop page and "My rewards".
 * null when the shop has no offer and the client no reward to use.
 */
async function summaryForClient(salonDetailId, customerId, program = undefined) {
  const prog = program === undefined ? await getProgram(salonDetailId) : program
  if (!prog) return null
  const card = customerId ? await getCard(salonDetailId, customerId) : null
  const status = await cardStatus(card)
  const hasReward = status === 'ready' || status === 'reserved'
  if (!prog.isActive && !hasReward) return null
  return {
    active: !!prog.isActive,
    visitsRequired: prog.visitsRequired,
    percentage: Number(prog.discountPercentage),
    combineWithCoupon: !!prog.combineWithCoupon,
    minBookingValue: prog.minBookingValue == null ? null : Number(prog.minBookingValue),
    rewardExpiryDays: prog.rewardExpiryDays,
    excludedServices: await excludedServices(prog),
    myVisits: card?.visitCount || 0,
    status,
    rewardPercentage: card?.rewardPercentage == null ? null : Number(card.rewardPercentage),
    rewardExpiresAt: status === 'expired' ? null : card?.rewardExpiresAt || null,
  }
}

/**
 * Short offer summary for shop lists (home, search, favourites), in three
 * queries for the whole list. Returns Map(shopId -> { percentage,
 * visitsRequired, myVisits, status }) for shops with an active offer or a
 * reward this client can still use.
 */
async function offersForShops(shopIds, customerId) {
  const ids = [...new Set((shopIds || []).map(Number).filter(Boolean))]
  const out = new Map()
  if (!ids.length) return out
  const [programs, cards] = await Promise.all([
    loyaltyProgram.findAll({
      where: { salonDetailId: ids },
      attributes: ['salonDetailId', 'isActive', 'visitsRequired', 'discountPercentage'],
    }),
    customerId
      ? loyaltyCard.findAll({ where: { salonDetailId: ids, customerId } })
      : [],
  ])
  const cardByShop = new Map(cards.map((c) => [c.salonDetailId, c]))
  const earnedIds = cards.filter((c) => c.rewardEarnedAt).map((c) => c.id)
  const held = earnedIds.length
    ? await booking.findAll({
        where: { loyaltyCardId: earnedIds, loyaltyDiscount: { [Op.gt]: 0 }, status: { [Op.in]: HOLDING_STATUSES } },
        attributes: ['loyaltyCardId'],
      })
    : []
  const heldIds = new Set(held.map((b) => b.loyaltyCardId))
  for (const p of programs) {
    const card = cardByShop.get(p.salonDetailId)
    const status = rules.rewardStatus(card, { held: card ? heldIds.has(card.id) : false })
    const hasReward = status === 'ready' || status === 'reserved'
    if (!p.isActive && !hasReward) continue
    out.set(p.salonDetailId, {
      active: !!p.isActive,
      percentage: Number(hasReward ? card.rewardPercentage : p.discountPercentage),
      visitsRequired: p.visitsRequired,
      myVisits: card?.visitCount || 0,
      status,
    })
  }
  return out
}

// All of a client's cards, rewards to use first.
async function cardsForCustomer(customerId) {
  const cards = await loyaltyCard.findAll({
    where: { customerId },
    include: { model: salonDetail, attributes: ['id', 'salonName', 'coverImage', 'isExternalEmployee'] },
    order: [['updatedAt', 'DESC']],
  })
  const out = []
  for (const card of cards) {
    const summary = await summaryForClient(card.salonDetailId, customerId)
    if (!summary || !card.salonDetail) continue
    out.push({ salon: card.salonDetail, ...summary })
  }
  const rank = { ready: 0, reserved: 1, progress: 2, expired: 3, none: 4 }
  return out.sort((a, b) => rank[a.status] - rank[b.status])
}

// Settings and simple numbers for the business app / admin.
async function settingsForShop(salonDetailId) {
  const program = await getProgram(salonDetailId)
  const [clients, rewardsReady, rewardsUsed, discountGiven] = await Promise.all([
    loyaltyCard.count({ where: { salonDetailId } }),
    loyaltyCard.count({ where: { salonDetailId, rewardEarnedAt: { [Op.ne]: null } } }),
    booking.count({ where: { salonDetailId, status: 'complete', loyaltyDiscount: { [Op.gt]: 0 } } }),
    booking.sum('loyaltyDiscount', { where: { salonDetailId, status: 'complete' } }),
  ])
  return {
    configured: !!program,
    isActive: !!program?.isActive,
    visitsRequired: program?.visitsRequired ?? 5,
    discountPercentage: Number(program?.discountPercentage ?? 10),
    combineWithCoupon: !!program?.combineWithCoupon,
    minBookingValue: program?.minBookingValue == null ? null : Number(program.minBookingValue),
    rewardExpiryDays: program?.rewardExpiryDays ?? null,
    excludedServiceIds: excludedIdsOf(program),
    excludedServices: await excludedServices(program),
    startedAt: program?.startedAt || null,
    limits: rules.LIMITS,
    stats: { clients, rewardsReady, rewardsUsed, discountGiven: round2(discountGiven || 0) },
  }
}

/** Saves the shop's settings. Returns { settings } or { error }. */
async function saveSettings(salonDetailId, input) {
  const { values, error } = rules.validateSettings(input)
  if (error) return { error }
  const { excludedServiceIds, ...fields } = values

  if (excludedServiceIds?.length) {
    const found = await service.count({
      where: { id: excludedServiceIds, salonDetailId: await shopServiceIds(salonDetailId) },
    })
    if (found !== excludedServiceIds.length) return { error: 'Some excluded services do not belong to this shop.' }
  }

  await sequelize.transaction(async (t) => {
    const [program] = await loyaltyProgram.findOrCreate({
      where: { salonDetailId },
      defaults: { salonDetailId },
      transaction: t,
    })
    if (fields.isActive && !program.startedAt) fields.startedAt = new Date()
    await program.update(fields, { transaction: t })
    if (excludedServiceIds) {
      await loyaltyExcludedService.destroy({ where: { loyaltyProgramId: program.id }, transaction: t })
      if (excludedServiceIds.length) {
        await loyaltyExcludedService.bulkCreate(
          excludedServiceIds.map((serviceId) => ({ loyaltyProgramId: program.id, serviceId })),
          { transaction: t },
        )
      }
    }
  })
  return { settings: await settingsForShop(salonDetailId) }
}

module.exports = {
  rules,
  getProgram,
  quote,
  applyToJobs: rules.applyToJobs,
  lineDiscount,
  onBookingCompleted,
  onBookingNoShow,
  summaryForClient,
  offersForShops,
  cardsForCustomer,
  settingsForShop,
  saveSettings,
}
