// Step C: branch access for a period starts and ends on its own. Run hourly
// (jobs/accessPeriodCron.js). Switching the row on or off is what the rest of
// Trim already understands: an inactive row can't open the branch (branchScope)
// and isn't offered to clients.
const { Op } = require('sequelize')
const db = require('../models')
const activity = require('./activityLog')

async function log(row, action, now) {
  const u = await db.user.findByPk(row.userId, { attributes: ['firstName', 'lastName'] })
  const name = `${u?.firstName || ''} ${u?.lastName || ''}`.trim()
  await activity.record({
    salonDetailId: row.salonDetailId,
    actorUserId: null,
    actorName: 'Trim (automatic)',
    actorRole: null,
    category: 'people',
    action,
    details: { person: name, until: row.accessUntil, at: now },
    result: 'ok',
  })
}

const { DateTime } = require('luxon')
const UK = 'Europe/London'
const ukDay = (t) => (t ? DateTime.fromJSDate(new Date(t)).setZone(UK).toISODate() : null)
const OPEN = ['pending', 'book', 'requested', 'save-unpaid']

/**
 * Can this employee row be booked on this shop day (YYYY-MM-DD)? A row with a
 * period only on the days of that period; other rows always. Returns null when
 * it can, else a message for the person booking.
 */
function periodRefusal(row, on) {
  if (!row || !on) return null
  const first = ukDay(row.accessFrom)
  const last = ukDay(row.accessUntil)
  if (last && on > last) return `This team member works at this branch only until ${DateTime.fromISO(last).toFormat('d LLL')}. Please choose another day or team member.`
  if (first && on < first && row.accessState === 'scheduled') return `This team member starts at this branch on ${DateTime.fromISO(first).toFormat('d LLL')}. Please choose another day or team member.`
  return null
}

/** periodRefusal for employee ids (a booking can have several); the first refusal or null. */
async function periodRefusalFor(employeeIds, on) {
  const ids = [...new Set((Array.isArray(employeeIds) ? employeeIds : [employeeIds]).map(Number).filter((n) => n > 0))]
  if (!ids.length || !on) return null
  const rows = await db.employee.findAll({ where: { id: ids, accessUntil: { [Op.ne]: null } }, attributes: ['id', 'accessFrom', 'accessUntil', 'accessState'] })
  for (const r of rows) {
    const msg = periodRefusal(r, String(on).slice(0, 10))
    if (msg) return msg
  }
  return null
}

/** Open bookings this row has at its branch after its last day. */
async function bookingsAfterPeriod(row) {
  const last = ukDay(row.accessUntil)
  if (!last) return []
  const jobs = await db.jobs.findAll({
    where: { employeeId: row.id, status: 'assign', on: { [Op.gt]: last } },
    attributes: ['bookingId', 'on', 'startTime'],
    include: { model: db.booking, where: { status: OPEN, salonDetailId: row.salonDetailId }, attributes: ['id'], required: true },
    order: [['on', 'ASC'], ['startTime', 'ASC']],
  })
  const seen = new Set()
  return jobs.filter((j) => !seen.has(j.bookingId) && seen.add(j.bookingId)).map((j) => ({ bookingId: j.bookingId, on: j.on, startTime: String(j.startTime || '').slice(0, 5) }))
}

/**
 * Tell the owner about bookings after the last day (they move or cancel them;
 * nothing is cancelled for them). Never throws. Returns the bookings found.
 */
async function warnOwnerOfLateBookings(row, why = 'ends') {
  try {
    const list = await bookingsAfterPeriod(row)
    if (!list.length) return []
    const [shop, u] = await Promise.all([
      db.salonDetail.findByPk(row.salonDetailId, { attributes: ['id', 'userId', 'salonName'] }),
      db.user.findByPk(row.userId, { attributes: ['firstName', 'lastName'] }),
    ])
    if (!shop?.userId) return list
    const name = `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || 'A team member'
    const last = DateTime.fromISO(ukDay(row.accessUntil)).toFormat('d LLL')
    const days = list.slice(0, 3).map((b) => `${DateTime.fromISO(String(b.on)).toFormat('d LLL')} ${b.startTime}`).join(', ')
    const more = list.length > 3 ? ` and ${list.length - 3} more` : ''
    const title = `${name} has bookings after their last day`
    const body = `${name}'s access to ${shop.salonName} ${why === 'ends' ? 'ended' : 'now ends'} on ${last}, but ${list.length} booking${list.length > 1 ? 's are' : ' is'} still with them: ${days}${more}. Please move ${list.length > 1 ? 'them' : 'it'} to someone else or cancel.`
    const tokens = await require('./staffDevices').ownDeviceTokens([shop.userId])
    if (tokens.length) require('../utils/throwNotification')(tokens, { title, body }, { type: 'accessPeriod', salonId: String(shop.id) }, shop.userId)
    await activity.record({
      salonDetailId: row.salonDetailId, actorUserId: null, actorName: 'Trim (automatic)', actorRole: null,
      category: 'people', action: 'team.access_late_bookings', result: 'ok', message: body.slice(0, 255),
      details: { person: name, bookings: list.map((b) => b.bookingId) },
    })
    return list
  } catch (err) {
    console.error('[accessPeriods] late bookings warning failed:', err.message)
    return []
  }
}

async function runAccessPeriods(now = new Date()) {
  const summary = { started: 0, ended: 0 }
  const starting = await db.employee.findAll({
    where: { accessState: 'scheduled', deleted: false, accessFrom: { [Op.lte]: now }, accessUntil: { [Op.gt]: now } },
  })
  for (const r of starting) {
    const [n] = await db.employee.update({ status: true, accessState: 'active' }, { where: { id: r.id, accessState: 'scheduled' } })
    if (n) { summary.started++; await log(r, 'team.access_started', now) }
  }
  const ending = await db.employee.findAll({
    where: { accessState: { [Op.in]: ['scheduled', 'active'] }, deleted: false, accessUntil: { [Op.lte]: now } },
  })
  for (const r of ending) {
    const [n] = await db.employee.update({ status: false, accessState: 'ended' }, { where: { id: r.id, accessState: r.accessState } })
    if (n) {
      summary.ended++
      await log(r, 'team.access_ended', now)
      summary.lateBookings = (summary.lateBookings || 0) + (await warnOwnerOfLateBookings(r, 'ends')).length
    }
  }
  return summary
}

module.exports = { runAccessPeriods, periodRefusal, periodRefusalFor, bookingsAfterPeriod, warnOwnerOfLateBookings }
