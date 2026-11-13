/**
 * The one "is this shop subscribed" rule used by Home, search, booking and
 * rebook reminders. Keep every caller on these helpers so the rule cannot drift.
 *
 * Every shop row, a normal shop or a chair renter's own shop
 * (isExternalEmployee=1), is active on its OWN subscription:
 *   registrationExpiryDate >= today AND
 *   subscriptionLatestPaymentStatus NOT IN ('expired','paused','refunded').
 * A failed renewal ('payment_failed') does not switch a shop off: the store
 * keeps it going for its billing grace period, and the webhook moves
 * registrationExpiryDate to the end of that grace period.
 * A chair renter pays for their own plan, so the host shop's subscription no
 * longer decides whether the renter can be found and booked.
 * Step A: a closed branch (closedAt) or a paused one (pausedReason, e.g. the
 * brand plan covers fewer branches) is not active either.
 *
 * `dateSql` is a SQL date expression: a quoted 'YYYY-MM-DD' literal or a
 * named replacement such as ':dateOnly'.
 */

const { Op } = require('sequelize')
const { DateTime } = require('luxon')

const BLOCKED_STATUSES = ['expired', 'paused', 'refunded']
const BLOCKED_STATUSES_SQL = `(${BLOCKED_STATUSES.map((s) => `'${s}'`).join(',')})`

const quoteDate = (dateOnly) => `'${String(dateOnly).replace(/[^0-9-]/g, '')}'`

// Sequelize `where` fragment for salonDetails queries (put inside an Op.and).
const activeSalonWhere = (dateOnly) => ({
  registrationExpiryDate: { [Op.gte]: dateOnly },
  subscriptionLatestPaymentStatus: { [Op.notIn]: BLOCKED_STATUSES },
  closedAt: null,
  pausedReason: null,
})

// SQL CASE that is 1 when the salon row under `alias` is active, else 0.
// `alias` is already quoted for the caller's dialect, e.g. '`salonDetail`' or 's'.
const activeSalonCaseSql = (alias, dateSql) => `(CASE
  WHEN ${alias}.registrationExpiryDate >= ${dateSql}
    AND ${alias}.subscriptionLatestPaymentStatus IS NOT NULL
    AND ${alias}.subscriptionLatestPaymentStatus NOT IN ${BLOCKED_STATUSES_SQL}
    AND ${alias}.closedAt IS NULL
    AND ${alias}.pausedReason IS NULL
  THEN 1 ELSE 0 END)`

// The same rule for a salonDetails row already loaded in JS (needs
// registrationExpiryDate and subscriptionLatestPaymentStatus).
const isSalonRowActive = (row, dateOnly) => {
  const expiry = row?.registrationExpiryDate ? String(row.registrationExpiryDate).slice(0, 10) : null
  const status = row?.subscriptionLatestPaymentStatus
  const open = !row?.closedAt && !row?.pausedReason // fields not loaded = open
  return !!expiry && expiry >= dateOnly && !!status && !BLOCKED_STATUSES.includes(status) && open
}

// Home and search list only barbers a client can book now: a chair renter who
// left their shop drops out once their days between shops are over (their
// page and the chair market still show them).
const bookableNowWhere = (dateOnly) => ({
  [Op.or]: [
    { isExternalEmployee: false },
    { isExternalEmployee: null },
    { parentSalonId: { [Op.ne]: null } },
    { renterGraceUntil: { [Op.gte]: dateOnly } },
  ],
})

// A new chair renter starts with free days on their own plan (status
// 'renter_switch'), then buys the £6.99 Chair Renter plan in the app.
// helper/renterMove.js sends the reminders before the free days end.
const RENTER_FREE_DAYS = 30
const renterFreeDays = () => ({
  registrationExpiryDate: DateTime.now().setZone('Europe/London').plus({ days: RENTER_FREE_DAYS }).toISODate(),
  subscriptionLatestPaymentStatus: 'renter_switch',
  renterPlanReminderDays: null,
})

module.exports = { activeSalonWhere, activeSalonCaseSql, bookableNowWhere, isSalonRowActive, renterFreeDays, RENTER_FREE_DAYS, quoteDate, BLOCKED_STATUSES }
