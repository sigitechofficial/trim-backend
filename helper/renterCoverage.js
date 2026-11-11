/**
 * A chair renter's Trim plan can be covered by their shop instead of their own
 * £6.99 plan. A covered renter uses one of the shop's team seats.
 *
 * While covered, the renter's row mirrors the shop's plan (same expiry date,
 * status 'shop_covered'), so every "is this shop active" query keeps working
 * unchanged. Their own plan is kept in renterOwnExpiry / renterOwnStatus.
 *
 * Coverage ends when the shop's plan lapses, the shop is blocked, the shop no
 * longer has a free seat, the owner switches it off, or the renter leaves the
 * shop. The renter then gets back their own plan, or GRACE_DAYS free days to
 * start one, so they are never switched off overnight.
 */
const { Op } = require('sequelize')
const { DateTime } = require('luxon')
const { salonDetail, employee, user, deviceToken, pushNotification, chairOffer } = require('../models')
const AppError = require('../utils/appError')
const Throw = require('../utils/throwNotification')
const { isSalonRowActive } = require('./salonSubscriptionRule')

// Boss, 2026-11-05: free days to start their own plan when coverage ends:
// 7 the first time, 3 every time after. Buying in those days starts the plan
// that day (the days are not added on). With no plan after them, clients
// stop seeing the renter.
const FIRST_GRACE_DAYS = 7
const NEXT_GRACE_DAYS = 3
const GRACE_DAYS = FIRST_GRACE_DAYS
const graceDaysFor = (renter) => (Number(renter?.renterGraceCount || 0) > 0 ? NEXT_GRACE_DAYS : FIRST_GRACE_DAYS)

// Gives the renter their free days and counts them.
async function giveGrace(renter, extra = {}) {
  const days = graceDaysFor(renter)
  const until = DateTime.now().setZone('Europe/London').plus({ days }).toISODate()
  await renter.update({
    ...extra,
    registrationExpiryDate: until,
    subscriptionLatestPaymentStatus: 'renter_switch',
    renterPlanReminderDays: null,
    renterGraceCount: Number(renter.renterGraceCount || 0) + 1,
  })
  return until
}
const COVERED = 'shop_covered'
const UNLIMITED_TEAM_SIZE = 999

const today = () => DateTime.now().setZone('Europe/London').toISODate()
const pretty = (d) => DateTime.fromISO(String(d).slice(0, 10)).toFormat('d LLL yyyy')

async function push(userId, title, body, data = { type: 'renterPlan' }) {
  try {
    const rows = await deviceToken.findAll({ where: { userId }, attributes: ['tokenId'] })
    const tokens = rows.map((r) => r.tokenId).filter(Boolean)
    if (tokens.length) Throw(tokens, { title, body }, data, userId)
    else await pushNotification.create({ at: new Date(), title, body, data, userId })
  } catch (err) {
    console.error('[renterCoverage] push failed:', err.message)
  }
}

const HOST_ATTRS = ['id', 'userId', 'salonName', 'teamSize', 'status', 'deleted', 'registrationExpiryDate', 'subscriptionLatestPaymentStatus']

// Team seats a shop has left: its plan's team size minus active staff and covered renters.
async function seatsLeft(host) {
  const size = Number(host.teamSize || 0)
  if (size >= UNLIMITED_TEAM_SIZE) return Infinity
  const [staff, covered] = await Promise.all([
    employee.count({ where: { salonDetailId: host.id, isOwner: false, status: true, deleted: false, isExternalEmployee: false } }),
    salonDetail.count({ where: { renterCoveredBy: host.id, parentSalonId: host.id, deleted: false } }),
  ])
  return size - staff - covered
}

// Covered renters at a shop (they use team seats too).
const coveredCount = (hostId) => salonDetail.count({ where: { renterCoveredBy: hostId, parentSalonId: hostId, deleted: false } })

async function startCover(hostId, renterSalonId, { notify = true } = {}) {
  const host = await salonDetail.findByPk(hostId, { attributes: HOST_ATTRS })
  const renter = await salonDetail.findOne({ where: { id: renterSalonId, isExternalEmployee: true, deleted: false } })
  if (!host || !renter || renter.parentSalonId !== host.id) throw new AppError('This chair renter is not at your shop.', 200)
  if (renter.renterCoveredBy === host.id) return renter
  if (!isSalonRowActive(host, today())) throw new AppError('Your Trim plan is not active, so it cannot cover a chair renter.', 200)
  if ((await seatsLeft(host)) < 1) throw new AppError('Your plan has no free team seat. Upgrade your plan to cover this chair renter.', 200)
  await renter.update({
    renterOwnExpiry: renter.registrationExpiryDate,
    renterOwnStatus: renter.subscriptionLatestPaymentStatus,
    renterCoveredBy: host.id,
    renterUncoveredBy: null,
    registrationExpiryDate: host.registrationExpiryDate,
    subscriptionLatestPaymentStatus: COVERED,
  })
  if (notify) {
    await push(renter.userId, 'Your Trim plan is covered',
      `${host.salonName} now covers your Trim plan. If you pay for your own chair renter plan, you can cancel it in the App Store or Google Play.`)
  }
  return renter
}

/**
 * Ends coverage. The renter gets their own plan back if it is still running,
 * otherwise GRACE_DAYS free days to start one. reason is for the message.
 */
async function endCover(renter, reason, { notify = true } = {}) {
  if (!renter?.renterCoveredBy) return renter
  const host = await salonDetail.findByPk(renter.renterCoveredBy, { attributes: ['salonName'] })
  const own = { registrationExpiryDate: renter.renterOwnExpiry, subscriptionLatestPaymentStatus: renter.renterOwnStatus }
  const ownActive = isSalonRowActive(own, today())
  const cleared = { renterCoveredBy: null, renterOwnExpiry: null, renterOwnStatus: null }
  let graceUntil = null
  if (ownActive) await renter.update({ ...cleared, ...own })
  else graceUntil = await giveGrace(renter, cleared)
  if (notify && !ownActive) {
    const who = host?.salonName || 'Your shop'
    const why = {
      plan: `${who}’s Trim plan has ended`,
      seat: `${who} no longer has a free team seat`,
      owner: `${who} no longer covers your Trim plan`,
      left: `You have left ${who}`,
      blocked: `${who} is not on Trim right now`,
    }[reason] || `${who} no longer covers your Trim plan`
    await push(renter.userId, 'Choose your Trim plan',
      `${why}. Choose your own chair renter plan by ${pretty(graceUntil)} to keep taking bookings.`)
  }
  return renter
}

// The shop agreed to cover a renter's plan but could not (no free seat, plan
// ended): the renter falls back to their own plan / free days and both are told.
async function coverFailed(hostId, renterSalonId, reason) {
  try {
    const host = await salonDetail.findByPk(hostId, { attributes: ['id', 'userId', 'salonName'] })
    const renter = await salonDetail.findByPk(renterSalonId)
    if (!host || !renter) return
    if (!isSalonRowActive(renter, today())) await giveGrace(renter)
    await push(host.userId, 'Could not cover a chair renter’s plan',
      `${renter.salonName} joined your shop, but your plan could not cover their Trim plan (${reason}). Free a team seat or upgrade, then turn on "Cover with my plan" on their profile.`)
    await push(renter.userId, 'Choose your Trim plan',
      `${host.salonName} could not cover your Trim plan yet. Until they do, choose your own chair renter plan by ${pretty(renter.registrationExpiryDate)} to keep taking bookings.`)
  } catch (err) {
    console.error('[renterCoverage] coverFailed failed:', err.message)
  }
}

// The owner switches coverage for one of their renters on or off.
async function setCover(ownerUserId, renterSalonId, cover) {
  const host = await salonDetail.findOne({ where: { userId: ownerUserId, isExternalEmployee: false, deleted: false }, attributes: ['id'] })
  if (!host) throw new AppError('Only a shop owner can do this.', 200)
  const renter = await salonDetail.findOne({ where: { id: Number(renterSalonId), parentSalonId: host.id, isExternalEmployee: true, deleted: false } })
  if (!renter) throw new AppError('This chair renter is not at your shop.', 200)
  if (cover) await startCover(host.id, renter.id)
  let graceDays = null
  if (!cover && renter.renterCoveredBy === host.id) {
    const before = Number(renter.renterGraceCount || 0)
    graceDays = graceDaysFor(renter)
    await endCover(renter, 'owner')
    // No free days were given when their own plan came back.
    if (Number(renter.renterGraceCount || 0) === before) graceDays = 0
  }
  return { renterSalonId: renter.id, covered: !!cover, graceDays }
}

/**
 * Called by the 5-minute job. Keeps every covered renter in step with their
 * shop: refreshes the mirrored plan date, keeps any own-plan purchase the
 * store wrote meanwhile, and ends coverage that no longer holds.
 */
async function syncCoverage() {
  const covered = await salonDetail.findAll({ where: { renterCoveredBy: { [Op.ne]: null }, deleted: false } })
  const summary = { refreshed: 0, ended: 0, ownersTold: 0, ownersAsked: 0 }
  const byHost = new Map()
  // Renters each shop lost because of the shop's own plan or seats, to tell the owner once.
  const lostBy = new Map()
  for (const r of covered) {
    if (!byHost.has(r.renterCoveredBy)) byHost.set(r.renterCoveredBy, [])
    byHost.get(r.renterCoveredBy).push(r)
  }
  for (const [hostId, renters] of byHost) {
    const host = await salonDetail.findByPk(hostId, { attributes: HOST_ATTRS })
    const hostOk = host && !host.deleted && host.status !== false && isSalonRowActive(host, today())
    // Seats: staff first, then covered renters in the order they were covered.
    let free = hostOk ? Number(host.teamSize || 0) >= UNLIMITED_TEAM_SIZE ? Infinity
      : Number(host.teamSize || 0) - await employee.count({ where: { salonDetailId: host.id, isOwner: false, status: true, deleted: false, isExternalEmployee: false } })
      : 0
    for (const r of renters.sort((a, b) => a.id - b.id)) {
      try {
        // The store wrote the renter's own plan while covered: keep it as their own plan.
        if (r.subscriptionLatestPaymentStatus !== COVERED) {
          r.renterOwnExpiry = r.registrationExpiryDate
          r.renterOwnStatus = r.subscriptionLatestPaymentStatus
        }
        const reason = !host || host.deleted || host.status === false ? 'blocked'
          : r.parentSalonId !== hostId ? 'left'
            : !hostOk ? 'plan'
              : free < 1 ? 'seat' : null
        if (reason) {
          await endCover(r, reason)
          summary.ended++
          if (host && (reason === 'plan' || reason === 'seat')) {
            await r.update({ renterUncoveredBy: host.id })
            if (!lostBy.has(host.id)) lostBy.set(host.id, { host, reason, names: [] })
            lostBy.get(host.id).names.push(r.salonName)
          }
          continue
        }
        free--
        await r.update({
          renterOwnExpiry: r.renterOwnExpiry,
          renterOwnStatus: r.renterOwnStatus,
          registrationExpiryDate: host.registrationExpiryDate,
          subscriptionLatestPaymentStatus: COVERED,
        })
        summary.refreshed++
      } catch (err) {
        console.error(`[renterCoverage] sync for renter ${r.id} failed:`, err.message)
      }
    }
  }

  // Tell each owner which renters their plan stopped covering.
  for (const { host, reason, names } of lostBy.values()) {
    const who = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
    await push(host.userId, 'Your chair renters are no longer covered',
      reason === 'plan'
        ? `Your Trim plan has ended, so it no longer covers ${who}. Renew your plan, then turn "Cover with my plan" back on to keep covering them.`
        : `Your plan has no free team seat, so it no longer covers ${who}. Free a seat or upgrade, then turn "Cover with my plan" back on.`,
      { type: 'renterCover' })
    summary.ownersTold++
  }

  // A shop whose plan is active again: ask the owner once to cover them again.
  const waiting = await salonDetail.findAll({
    where: { renterUncoveredBy: { [Op.ne]: null }, deleted: false },
    attributes: ['id', 'salonName', 'parentSalonId', 'renterUncoveredBy', 'renterCoveredBy'],
  })
  const askBy = new Map()
  for (const r of waiting) {
    // Moved away or already covered again: nothing to ask.
    if (r.parentSalonId !== r.renterUncoveredBy || r.renterCoveredBy) {
      await r.update({ renterUncoveredBy: null })
      continue
    }
    if (!askBy.has(r.renterUncoveredBy)) askBy.set(r.renterUncoveredBy, [])
    askBy.get(r.renterUncoveredBy).push(r)
  }
  for (const [hostId, renters] of askBy) {
    const host = await salonDetail.findByPk(hostId, { attributes: HOST_ATTRS })
    if (!host || host.deleted || host.status === false || !isSalonRowActive(host, today())) continue
    if ((await seatsLeft(host)) < 1) continue
    const names = renters.map((r) => r.salonName)
    const who = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
    await push(host.userId, 'Cover your chair renters again?',
      `Your Trim plan is active again. Turn on "Cover with my plan" for ${who} in Rent-a-chair staff, so they don't pay for their own plan.`,
      { type: 'renterCover' })
    for (const r of renters) await r.update({ renterUncoveredBy: null })
    summary.ownersAsked++
  }
  return summary
}

// The renter behind one of the owner's team rows (Rent-a-chair staff).
async function renterOfTeamRow(ownerUserId, employeeId) {
  const host = await salonDetail.findOne({ where: { userId: ownerUserId, isExternalEmployee: false, deleted: false }, attributes: ['id', 'teamSize'] })
  if (!host) throw new AppError('Only a shop owner can do this.', 200)
  const row = await employee.findOne({ where: { id: Number(employeeId), salonDetailId: host.id, isExternalEmployee: true, deleted: false } })
  const renter = row && await salonDetail.findOne({ where: { userId: row.userId, isExternalEmployee: true, deleted: false, parentSalonId: host.id } })
  if (!renter) throw new AppError('This chair renter is not at your shop.', 200)
  return { host, renter }
}

// Did the shop agree to cover this renter's plan in an offer they accepted?
// Client app applicants get a new business account when they start, so their
// offer is matched by the email they applied with.
async function coverPromised(hostId, renter) {
  const offers = await chairOffer.findAll({
    where: { shopSalonId: hostId, kind: 'chair', status: 'accepted', coversPlan: true },
    attributes: ['id', 'renterSalonId', 'renterUserId', 'source', 'applicantInfo'],
  })
  if (!offers.length) return false
  const u = await user.findByPk(renter.userId, { attributes: ['email'] })
  const email = String(u?.email || '').trim().toLowerCase()
  return offers.some((o) => {
    if (o.renterSalonId === renter.id || o.renterUserId === renter.userId) return true
    if (o.source !== 'client' || !email) return false
    try {
      return String(JSON.parse(o.applicantInfo || '{}').email || '').trim().toLowerCase() === email
    } catch (_) {
      return false
    }
  })
}

// { covered, seatsLeft, promised } for the switch on a chair renter's team profile.
async function teamRowCover(ownerUserId, employeeId) {
  const { host, renter } = await renterOfTeamRow(ownerUserId, employeeId)
  const left = await seatsLeft(host)
  return {
    renterSalonId: renter.id,
    covered: renter.renterCoveredBy === host.id,
    seatsLeft: left === Infinity ? null : left,
    // "Trim plan included" was part of the agreed offer: warn before turning it off.
    promised: await coverPromised(host.id, renter),
  }
}

async function setTeamRowCover(ownerUserId, employeeId, cover) {
  const { renter } = await renterOfTeamRow(ownerUserId, employeeId)
  return setCover(ownerUserId, renter.id, cover)
}

// For the renter's own plan screen.
async function coverageFor(renterSalon) {
  if (!renterSalon?.renterCoveredBy) return null
  const host = await salonDetail.findByPk(renterSalon.renterCoveredBy, { attributes: ['id', 'salonName'] })
  return host ? { shopSalonId: host.id, shopName: host.salonName } : null
}

module.exports = { graceDaysFor, FIRST_GRACE_DAYS, NEXT_GRACE_DAYS, coverFailed, teamRowCover, setTeamRowCover, startCover, endCover, setCover, syncCoverage, seatsLeft, coveredCount, coverageFor, GRACE_DAYS, COVERED }
