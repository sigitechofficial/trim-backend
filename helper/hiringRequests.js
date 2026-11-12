/**
 * Hiring requests: one list for a shop of every offer from people who want to
 * work there, whichever app they came from. Each one is an offer with terms
 * (Accept / Counter / Decline):
 *
 *   - chair renters in the business app                  (kind chair, source business)
 *   - people applying for a chair in the client app       (kind chair, source client)
 *   - people applying for a staff job in the client app   (kind staff, source client)
 *
 * Also keeps the shop's adverts in step with hiring: accepting an offer
 * reserves one chair or position, and the advert turns off when none are
 * left (the other open offers for it close). If a deal falls through, the
 * chair or position opens again.
 */
const { Op, col } = require('sequelize')
const { DateTime } = require('luxon')
const {
  salonDetail,
  user,
  chairOffer,
  shopChairListing,
  pushNotification,
  deviceToken,
} = require('../models')
const AppError = require('../utils/appError')
const Throw = require('../utils/throwNotification')

const digits = (v) => String(v || '').replace(/\D/g, '')
// Last 9 digits, so "+44 7911 123456" and "07911123456" match.
const phoneKey = (v) => digits(v).slice(-9)
const emailKey = (v) => String(v || '').trim().toLowerCase()
const today = () => DateTime.now().setZone('Europe/London').toISODate()
const pretty = (d) => DateTime.fromISO(String(d).slice(0, 10)).toFormat('d LLL yyyy')

const SHOP_ATTRS = ['id', 'userId', 'salonName', 'isExternalEmployee', 'staffAdvertisementCount', 'staffAdvertisementStatus',
  'rentChairAdvertisementStatus', 'rentChairAdvertisementChairCount']

async function ownShopOf(userId) {
  const shop = await salonDetail.findOne({ where: { userId, deleted: false, isExternalEmployee: false }, attributes: SHOP_ATTRS })
  if (!shop) throw new AppError('Only a shop owner can do this.', 200)
  return shop
}

async function push(userIds, title, body, data) {
  for (const id of [...new Set(userIds.filter(Boolean))]) {
    try {
      const rows = await deviceToken.findAll({ where: { userId: id }, attributes: ['tokenId'] })
      const tokens = rows.map((r) => r.tokenId).filter(Boolean)
      if (tokens.length) Throw(tokens, { title, body }, data, id)
      else await pushNotification.create({ at: new Date(), title, body, data, userId: id })
    } catch (err) {
      console.error('[hiringRequests] push failed:', err.message)
    }
  }
}

function applicantOf(o) {
  try {
    return JSON.parse(o.applicantInfo || '{}') || {}
  } catch (_) {
    return {}
  }
}

function money(v) {
  const n = Number(v)
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function payLine(o) {
  if (o.rentAmount == null) return o.kind === 'staff' ? 'Pay to agree' : 'Rent to agree'
  if (o.kind === 'staff' && o.payType === 'commission') return `${money(o.rentAmount)}% commission`
  return `£${money(o.rentAmount)} ${String(o.rentCycle || '').toLowerCase()}`.trim()
}

// What the owner needs to do with an offer, in one word for the card.
function statusOf(o) {
  if (o.status === 'open') {
    if (o.expiresAt && new Date(o.expiresAt) < new Date()) return 'closed'
    return o.lastBy === 'shop' ? 'waiting' : 'new'
  }
  if (o.status === 'accepted') {
    if (o.stage === 'starting') return String(o.startDate) <= today() ? 'confirm' : 'starting'
    return 'hired'
  }
  return 'closed'
}

function itemOf(o) {
  const a = applicantOf(o)
  const name = o.renterSalonId
    ? `${o.renter?.firstName || ''} ${o.renter?.lastName || ''}`.trim() || o.renterSalon?.salonName || 'A chair renter'
    : `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Someone'
  const details = o.renterSalonId ? [] : [
    a.experience != null && a.experience !== '' ? `${a.experience} ${Number(a.experience) === 1 ? 'year' : 'years'} experience` : null,
    a.location || null,
  ].filter(Boolean)
  return {
    key: `offer-${o.id}`,
    offerId: o.id,
    kind: o.kind || 'chair',
    source: o.source || 'business',
    name,
    // For the "Started" form (client app applicants only).
    firstName: a.firstName || '',
    lastName: a.lastName || '',
    email: a.email || '',
    phone: a.phone || '',
    summary: [payLine(o), `starts ${pretty(o.startDate)}`, ...details].join(' · '),
    note: (o.renterSalonId ? o.renterTerms : a.note) || '',
    at: o.updatedAt || o.createdAt,
    startDate: o.startDate,
    rentAmount: o.rentAmount != null ? Number(o.rentAmount) : null,
    rentCycle: o.rentCycle || null,
    coversPlan: !!o.coversPlan,
    planWish: o.planWish || null,
    status: statusOf(o),
  }
}

async function list(userId) {
  const shop = await ownShopOf(userId)
  // Offers started by the person (the shop's own offers live in Hire chair renters).
  const offers = await chairOffer.findAll({
    where: { shopSalonId: shop.id, createdBy: { [Op.eq]: col('chairOffer.renterUserId') } },
    include: [
      { model: user, as: 'renter', attributes: ['firstName', 'lastName'] },
      { model: salonDetail, as: 'renterSalon', attributes: ['id', 'salonName'] },
    ],
    order: [['updatedAt', 'DESC']],
    limit: 200,
  })
  const items = offers.map(itemOf)
  // What needs the owner first, newest first within each group.
  const rank = { confirm: 0, new: 1, waiting: 2, starting: 3, hired: 4, closed: 5 }
  items.sort((a, b) => (rank[a.status] - rank[b.status]) || (new Date(b.at) - new Date(a.at)))
  const listing = await shopChairListing.findOne({ where: { shopSalonId: shop.id } })
  return {
    items,
    newCount: items.filter((i) => i.status === 'new' || i.status === 'confirm').length,
    adverts: advertsOf(shop, listing),
  }
}

function advertsOf(shop, listing) {
  const chairOn = listing ? !!listing.isHiring : !!shop.rentChairAdvertisementStatus
  return {
    chair: { on: chairOn, open: chairOn ? (listing ? listing.chairs : shop.rentChairAdvertisementChairCount || 0) : 0 },
    staff: { on: !!shop.staffAdvertisementStatus, open: shop.staffAdvertisementStatus ? shop.staffAdvertisementCount || 0 : 0 },
  }
}

async function newCount(userId) {
  const r = await list(userId)
  return { newCount: r.newCount }
}

// How many chairs or positions the shop's advert has open now.
async function openCount(shop, kind) {
  if (kind === 'staff') return shop.staffAdvertisementStatus ? Number(shop.staffAdvertisementCount || 0) : 0
  const listing = await shopChairListing.findOne({ where: { shopSalonId: shop.id } })
  if (listing) return listing.isHiring ? Number(listing.chairs || 0) : 0
  return shop.rentChairAdvertisementStatus ? Number(shop.rentChairAdvertisementChairCount || 0) : 0
}

// Sets the advert's open count; 0 turns the advert off.
async function setOpen(shop, kind, n) {
  if (kind === 'staff') {
    await shop.update({ staffAdvertisementCount: n, staffAdvertisementStatus: n > 0 })
    return
  }
  const listing = await shopChairListing.findOne({ where: { shopSalonId: shop.id } })
  if (listing) await listing.update(n > 0 ? { chairs: n, isHiring: true } : { isHiring: false })
  await shop.update({ rentChairAdvertisementChairCount: n, rentChairAdvertisementStatus: n > 0 })
}

/**
 * One chair or position is taken (an offer was accepted, or someone was hired
 * outside the chair market). When none are left the advert turns off and the
 * other open offers for it close.
 */
async function reserve(shopSalonId, kind, exceptOfferId = null) {
  try {
    const shop = await salonDetail.findByPk(shopSalonId, { attributes: SHOP_ATTRS })
    if (!shop || shop.isExternalEmployee) return null
    const open = await openCount(shop, kind)
    if (open < 1) return { left: 0 }
    const left = open - 1
    await setOpen(shop, kind, left)
    const word = kind === 'staff' ? 'position' : 'chair'
    await push([shop.userId], left > 0 ? `${kind === 'staff' ? 'Staff' : 'Chair'} advert updated` : `All ${word}s filled`,
      left > 0
        ? `Your advert now shows ${left} ${word}${left === 1 ? '' : 's'} open.`
        : `Every ${word} is taken, so your ${kind === 'staff' ? 'Staff advert' : 'Hiring chair renters advert'} is now off.`,
      { type: 'hiringAdvert' })
    if (left === 0) {
      // Nothing left to offer: close the other open offers for it.
      const others = await chairOffer.findAll({
        where: { shopSalonId: shop.id, kind, status: 'open', ...(exceptOfferId ? { id: { [Op.ne]: exceptOfferId } } : {}) },
      })
      for (const o of others) {
        await o.update({ status: 'closed', closedAt: new Date() })
        await push([o.renterUserId], `${kind === 'staff' ? 'Job' : 'Chair'} offer closed`,
          `${shop.salonName} has filled every ${word}, so your offer has closed.`, { type: 'chairOffer', offerId: o.id })
      }
    }
    return { left }
  } catch (err) {
    console.error('[hiringRequests] reserve failed:', err.message)
    return null
  }
}

// A deal fell through: the chair or position is open again.
async function release(shopSalonId, kind) {
  try {
    const shop = await salonDetail.findByPk(shopSalonId, { attributes: SHOP_ATTRS })
    if (!shop || shop.isExternalEmployee) return null
    const left = (await openCount(shop, kind)) + 1
    await setOpen(shop, kind, left)
    return { left }
  } catch (err) {
    console.error('[hiringRequests] release failed:', err.message)
    return null
  }
}

/**
 * Someone was added to the shop (Add team member / Add chair renter).
 * If they came through an accepted client app offer, that offer is now
 * "joined" (its chair or position was reserved on accept). Otherwise it is a
 * hire from outside the chair market and fills one advertised place.
 * Returns the offer that was joined, if any.
 */
async function onHired({ shopSalonId, kind, email, phone, offerId }) {
  try {
    const waiting = await chairOffer.findAll({
      where: { shopSalonId, kind, source: 'client', status: 'accepted', stage: 'starting' },
    })
    // Added from Hiring requests → "Started": the offer is known, even if the
    // owner changed the email or phone in the form.
    const byId = Number(offerId) > 0 && waiting.find((o) => o.id === Number(offerId))
    const match = byId || waiting.find((o) => {
      const a = applicantOf(o)
      return (emailKey(email) && emailKey(a.email) === emailKey(email))
        || (phoneKey(phone).length >= 9 && phoneKey(a.phone) === phoneKey(phone))
    })
    if (match) {
      await match.update({ stage: 'joined' })
      return match
    }
    await reserve(shopSalonId, kind)
    return null
  } catch (err) {
    console.error('[hiringRequests] onHired failed:', err.message)
    return null
  }
}

/**
 * The days a client-app applicant said they want to work, for the offer the
 * owner is adding them from (Hiring requests → Started). Empty when unknown,
 * so the caller keeps the shop's own hours.
 */
async function applicantDays({ shopSalonId, offerId }) {
  if (!(Number(offerId) > 0)) return []
  const offer = await chairOffer.findOne({
    where: { id: Number(offerId), shopSalonId, source: 'client', status: 'accepted', stage: 'starting' },
    attributes: ['id', 'applicantInfo'],
  })
  const days = offer ? applicantOf(offer).days : null
  return Array.isArray(days) ? days.filter((d) => typeof d === 'string') : []
}

module.exports = { list, newCount, reserve, release, onHired, openCount, push, applicantOf, applicantDays }
