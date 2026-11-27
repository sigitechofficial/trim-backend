/**
 * "My barber didn't arrive" on a home visit, decided automatically where the
 * barber's location gives an answer, so Trim's team is needed only rarely.
 *
 * The client reports:
 *  - "No" to "Is your barber here?" after the barber tapped I've arrived, or
 *  - "My barber didn't arrive" once the visit is REPORT_AFTER_MINUTES late and
 *    the barber has not tapped I've arrived.
 *
 * Outcome:
 *  - over MONTHLY_LIMIT reports in 30 days: Trim's team reviews (admin_review);
 *  - barber checked in at the door (no fake-GPS / speed flag): barber_won
 *    (the client can still ask Trim to review);
 *  - check-in flagged ('mock' / 'suspicious'): full refund at once;
 *  - no check-in: the barber gets REPLY_MINUTES to tap "I'm here" at the door;
 *    otherwise (5-minute job) a full refund.
 * A refund cancels the booking as if the shop cancelled it and is a strike on
 * the barber; STRIKE_ALERT strikes in 90 days show on the admin page.
 */

const { DateTime } = require('luxon')
const { Op } = require('sequelize')
const db = require('../models')
const AppError = require('../utils/appError')
const { appointmentStart } = require('./bookingApproval')
const visit = require('./mobileVisitStatus')

const REPLY_MINUTES = 15
const REPORT_AFTER_MINUTES = 30
const REPORT_UNTIL_HOURS = 24 // after the visit's end
const MONTHLY_LIMIT = 2
const STRIKE_ALERT = 3
const OPEN = ['waiting_barber', 'admin_review']

/**
 * Email Trim's admins when a report waits for their decision (VISIT_REPORT_ALERT_EMAILS,
 * comma separated, or else every active admin account). Never throws.
 */
async function alertAdmins(r, why) {
  try {
    const Email = require('../utils/Email')
    const list = String(process.env.VISIT_REPORT_ALERT_EMAILS || '').split(',').map((e) => e.trim()).filter(Boolean)
    const admins = list.length
      ? list.map((email) => ({ email, firstName: 'Trim', lastName: 'team' }))
      : await db.user.findAll({ where: { userTypeId: 4, status: true }, attributes: ['email', 'firstName', 'lastName'] })
    const shop = await db.salonDetail.findByPk(r.salonDetailId, { attributes: ['salonName'] })
    const html = `<p>A client's home visit report needs your decision (${why}).</p>
<p><b>Booking #${r.bookingId}</b> · ${shop?.salonName || 'Shop'}<br/>
Reason: ${r.reason === 'not_here' ? 'client said the barber was not at the door' : 'barber never checked in'}</p>
<p>Open the admin panel → Shops → <b>Visit Reports</b> to see the check-in location and decide. The client was told we reply within 24 hours.</p>`
    for (const a of admins) {
      if (!a.email) continue
      await new Email(a).send(html, `Visit report #${r.id} needs a decision (booking #${r.bookingId})`)
    }
  } catch (err) {
    console.error('[visitReports] admin alert failed:', err.message)
  }
}

function startOf(b) {
  return appointmentStart(b.on, b.startTime)
}

function plain(r) {
  if (!r) return null
  return {
    id: r.id,
    reason: r.reason,
    state: r.state,
    deadlineAt: r.deadlineAt || null,
    deadlineTime: r.deadlineAt ? DateTime.fromJSDate(new Date(r.deadlineAt)).setZone('Europe/London').toFormat('h:mm a') : null,
    outcome: r.outcome || null,
    refundAmount: r.refundAmount === null || r.refundAmount === undefined ? null : Number(r.refundAmount),
    createdAt: r.createdAt,
  }
}

async function latestFor(bookingId) {
  return db.visitReport.findOne({ where: { bookingId }, order: [['id', 'DESC']] })
}

/** Can the client report this visit now? */
function canReport(b, report, now = DateTime.now()) {
  if (!b?.isMobileVisit || report) return false
  if (!['book', 'pending'].includes(b.status)) return false
  const start = startOf(b)
  const end = appointmentStart(b.on, b.endTime || b.startTime)
  if (now > end.plus({ hours: REPORT_UNTIL_HOURS })) return false
  if (b.arrivedAt) return b.clientConfirm === null || b.clientConfirm === undefined || b.clientConfirm === 'auto_yes'
  return now >= start.plus({ minutes: REPORT_AFTER_MINUTES })
}

/** Report fields for the apps' booking detail and the client home bar. */
async function reportFields(b, now = DateTime.now()) {
  if (!b?.isMobileVisit) return {}
  const report = await latestFor(b.id)
  return {
    visitReport: plain(report),
    canReportNotArrived: canReport(b, report, now) && !b.arrivedAt,
    reportAfterTime: b.arrivedAt ? null : startOf(b).plus({ minutes: REPORT_AFTER_MINUTES }).toFormat('h:mm a'),
  }
}

/**
 * Full refund of what the client paid; the booking is cancelled as by the shop.
 * Returns the amount refunded.
 */
async function refundVisit(b, why) {
  const Stripe = require('../controllers/stripe')
  const appointment = await db.booking.findByPk(b.id)
  const paid = (parseFloat(appointment.actualCapturedAmount) || 0) + (parseFloat(appointment.tip) || 0)
  const update = { status: 'cancel', tip: 0, total: paid, subTotal: appointment.total, initialPayment: paid }
  if (paid > 0 && appointment.stripeCardId && appointment.initialPaymentIntend) {
    const shop = await db.salonDetail.findByPk(appointment.salonDetailId, { attributes: ['connectAccountId', 'salonName'] })
    const refund = await Stripe.refundFullPayment(appointment.initialPaymentIntend, shop?.connectAccountId || null, {
      salonName: shop?.salonName || '',
      salonDetailId: String(appointment.salonDetailId),
      bookingId: String(appointment.id),
      case: 'visit_report',
      refundAmount: String(paid),
      description: `Barber didn't arrive: refund for booking #${appointment.id}`,
    })
    if (refund?.id) {
      update.finalPayment = 'paid'
      update.refundAmount = paid
      update.refundPaymentIntend = refund.id
    }
  }
  await appointment.update(update)
  await db.jobs.update({ status: 'cancel' }, { where: { bookingId: appointment.id } })
  await db.cancelledBooking.create({ bookingId: appointment.id, userId: appointment.customerId, reasonId: null, reasonText: why })
  return paid
}

async function settle(report, b, state, outcome, resolvedBy = 'auto') {
  const patch = { state, outcome, resolvedBy, resolvedAt: new Date() }
  if (state === 'refunded') patch.refundAmount = await refundVisit(b, `Barber didn't arrive (${outcome})`)
  await report.update(patch)
  const { shop, emp } = await visit.barberOf(b)
  if (state === 'refunded') {
    await visit.push([b.customerId], {
      title: "We're sorry your barber didn't arrive",
      body: 'Your booking is cancelled and you get a full refund.',
    }, { bookingId: b.id, visitStatus: 'reported' })
    await visit.push([emp?.userId, shop?.userId], {
      title: 'Home visit refunded',
      body: `Your client got a full refund: ${outcome}.`,
    }, { bookingId: b.id, visitStatus: 'reported' })
  } else if (state === 'barber_won' || state === 'closed') {
    await visit.push([b.customerId], {
      title: 'About your report',
      body: outcome,
    }, { bookingId: b.id, visitStatus: 'reported' })
  }
  return report
}

/** Client: "My barber didn't arrive" (or "No" to "Is your barber here?"). */
async function report({ customerId, bookingId, now = DateTime.now() }) {
  const b = await db.booking.findByPk(bookingId)
  if (!b || !b.isMobileVisit || b.customerId !== customerId) throw new AppError('Home visit not found.', 200)
  const existing = await latestFor(b.id)
  if (existing) return plain(existing)
  if (!canReport(b, null, now)) {
    if (!b.arrivedAt) {
      throw new AppError(`You can report this from ${startOf(b).plus({ minutes: REPORT_AFTER_MINUTES }).toFormat('h:mm a')}, if your barber hasn't arrived.`, 200)
    }
    throw new AppError('This visit can no longer be reported.', 200)
  }
  if (b.arrivedAt) await b.update({ clientConfirm: 'no', clientConfirmAt: new Date() })
  const job = await db.jobs.findOne({ where: { bookingId: b.id }, attributes: ['employeeId'] })
  const row = await db.visitReport.create({
    bookingId: b.id,
    customerId,
    salonDetailId: b.salonDetailId,
    employeeId: job?.employeeId || null,
    reason: b.arrivedAt ? 'not_here' : 'not_arrived',
    state: 'waiting_barber',
  })

  const since = now.minus({ days: 30 }).toJSDate()
  const recent = await db.visitReport.count({ where: { customerId, createdAt: { [Op.gte]: since } } })
  if (recent > MONTHLY_LIMIT) {
    await row.update({ state: 'admin_review', outcome: 'Our team will look at this and reply within 24 hours.' })
    await alertAdmins(row, `the client reported more than ${MONTHLY_LIMIT} visits this month`)
    return plain(row)
  }

  if (b.arrivedAt) {
    if (b.arrivalFlag) {
      await settle(row, b, 'refunded', b.arrivalFlag === 'mock'
        ? 'the check-in came from a phone using fake location'
        : 'the check-in location was not trusted')
      return plain(row)
    }
    if (b.arrivedDistanceM !== null && b.arrivedDistanceM !== undefined) {
      const at = DateTime.fromJSDate(new Date(b.arrivedAt)).setZone('Europe/London').toFormat('h:mm a')
      await settle(row, b, 'barber_won',
        `Your barber checked in at your address at ${at} (${visit.howFar(b.arrivedDistanceM)} from it). If you still think this is wrong, tap "Ask Trim to review".`)
      return plain(row)
    }
  }

  // No proof yet: the barber has REPLY_MINUTES to show they are at the door.
  const deadline = now.plus({ minutes: REPLY_MINUTES })
  await row.update({ deadlineAt: deadline.toJSDate() })
  const { shop, emp } = await visit.barberOf(b)
  await visit.push([emp?.userId, shop?.userId], {
    title: "Your client says you haven't arrived",
    body: `Tap "I'm here" at the client's address by ${deadline.setZone('Europe/London').toFormat('h:mm a')}, or they get a full refund.`,
  }, { bookingId: b.id, visitStatus: 'reported' })
  return plain(row)
}

/** Client: send a barber_won report to Trim's team. */
async function askReview({ customerId, bookingId }) {
  const r = await latestFor(bookingId)
  if (!r || r.customerId !== customerId) throw new AppError('Report not found.', 200)
  if (r.state !== 'barber_won') throw new AppError('This report is already being handled.', 200)
  await r.update({ state: 'admin_review', outcome: 'Our team will look at this and reply within 24 hours.', resolvedBy: null, resolvedAt: null })
  await alertAdmins(r, 'the client asked Trim to review it')
  return plain(r)
}

/** Barber (or owner): "I'm here" while a report waits; the phone must be at the door. */
async function barberReply({ userId, bookingId, lat, lng, accuracy, mocked }) {
  const b = await visit.ownVisit(userId, bookingId)
  const r = await latestFor(b.id)
  if (!r || r.state !== 'waiting_barber') throw new AppError('There is no open report on this visit.', 200)
  const { point, distance } = await visit.checkAtDoor(b, { lat, lng, accuracy, mocked })
  const now = new Date()
  if (!b.arrivedAt) {
    await b.update({
      arrivedAt: now, onTheWayAt: b.onTheWayAt || now, arrivedDistanceM: distance,
      arrivedLat: point.lat, arrivedLng: point.lng, arrivedAccuracyM: point.accuracy,
      arrivalFlag: visit.arrivalFlagFor(b, point, now), clientConfirm: 'yes', clientConfirmAt: now,
    })
  }
  await r.update({ barberReplyAt: now, barberReplyDistanceM: distance })
  // Fake GPS was seen on this visit, or the check-in was impossibly fast: not trusted.
  if (b.arrivalFlag || b.mockAttempts > 0) {
    await settle(r, b, 'refunded', b.mockAttempts > 0
      ? 'fake location was used on this visit'
      : 'the check-in location was not trusted')
    return { ...visit.statusFields(b), visitReport: plain(r) }
  }
  await settle(r, b, 'barber_won',
    `Your barber checked in at your address (${distance === null ? 'location confirmed' : `${visit.howFar(distance)} from it`}). If you still think this is wrong, tap "Ask Trim to review".`)
  return { ...visit.statusFields(b), visitReport: plain(r) }
}

/** 5-minute job: refund reports the barber did not answer in time. */
async function runReportDeadlines(now = DateTime.now()) {
  const due = await db.visitReport.findAll({ where: { state: 'waiting_barber', deadlineAt: { [Op.lte]: now.toJSDate() } } })
  let refunded = 0
  for (const r of due) {
    if (!r.deadlineAt || new Date(r.deadlineAt) > now.toJSDate()) continue
    const b = await db.booking.findByPk(r.bookingId)
    if (!b) continue
    await settle(r, b, 'refunded', `the barber didn't check in within ${REPLY_MINUTES} minutes`)
    refunded += 1
  }
  return { refunded }
}

/** Strikes (refunded reports) per barber in the last 90 days. */
async function strikesByEmployee(employeeIds, now = DateTime.now()) {
  const rows = await db.visitReport.findAll({
    where: { employeeId: employeeIds, state: 'refunded', createdAt: { [Op.gte]: now.minus({ days: 90 }).toJSDate() } },
    attributes: ['employeeId'],
  })
  const map = new Map()
  for (const r of rows) map.set(r.employeeId, (map.get(r.employeeId) || 0) + 1)
  return map
}

/** Admin: reports, newest first; 'open' = waiting or needing review. */
async function adminList({ filter = 'open' } = {}) {
  const where = filter === 'open' ? { state: OPEN } : {}
  const rows = await db.visitReport.findAll({ where, order: [['id', 'DESC']], limit: 200 })
  const bookings = await db.booking.findAll({
    where: { id: rows.map((r) => r.bookingId) },
    attributes: ['id', 'on', 'startTime', 'total', 'travelFee', 'onTheWayAt', 'arrivedAt', 'arrivedDistanceM', 'arrivedAccuracyM', 'arrivalFlag', 'mockAttempts', 'clientConfirm', 'status'],
  })
  const byId = new Map(bookings.map((b) => [b.id, b]))
  const shops = await db.salonDetail.findAll({ where: { id: [...new Set(rows.map((r) => r.salonDetailId))] }, attributes: ['id', 'salonName'] })
  const shopName = new Map(shops.map((s) => [s.id, s.salonName]))
  const people = await db.user.findAll({ where: { id: [...new Set(rows.map((r) => r.customerId))] }, attributes: ['id', 'firstName', 'lastName'] })
  const name = new Map(people.map((p) => [p.id, [p.firstName, p.lastName].filter(Boolean).join(' ')]))
  const strikes = await strikesByEmployee([...new Set(rows.map((r) => r.employeeId).filter(Boolean))])
  return rows.map((r) => {
    const b = byId.get(r.bookingId)
    return {
      ...plain(r),
      bookingId: r.bookingId,
      shopName: shopName.get(r.salonDetailId) || '',
      clientName: name.get(r.customerId) || '',
      employeeId: r.employeeId,
      barberStrikes: strikes.get(r.employeeId) || 0,
      strikeAlert: (strikes.get(r.employeeId) || 0) >= STRIKE_ALERT,
      resolvedBy: r.resolvedBy,
      visit: b ? {
        on: b.on, startTime: b.startTime, status: b.status, total: Number(b.total),
        onTheWayAt: b.onTheWayAt, arrivedAt: b.arrivedAt, arrivedDistanceM: b.arrivedDistanceM,
        arrivedAccuracyM: b.arrivedAccuracyM, arrivalFlag: b.arrivalFlag, mockAttempts: b.mockAttempts, clientConfirm: b.clientConfirm,
      } : null,
    }
  })
}

/** Admin: decide a report in review: 'refund' (client) or 'barber'. */
async function adminDecide({ reportId, decision }) {
  const r = await db.visitReport.findByPk(reportId)
  if (!r) throw new AppError('Report not found.', 200)
  if (!OPEN.includes(r.state)) throw new AppError('This report is already decided.', 200)
  const b = await db.booking.findByPk(r.bookingId)
  if (decision === 'refund') {
    await settle(r, b, 'refunded', 'Trim reviewed it and refunded the client', 'admin')
  } else if (decision === 'barber') {
    await settle(r, b, 'closed', 'Trim reviewed your report and found the barber was at your address.', 'admin')
  } else {
    throw new AppError('Choose refund or barber.', 200)
  }
  return plain(r)
}

/** Is a report open on this booking? (no-show and checkout wait for it) */
async function hasOpenReport(bookingId) {
  return (await db.visitReport.count({ where: { bookingId, state: OPEN } })) > 0
}

module.exports = {
  REPLY_MINUTES,
  REPORT_AFTER_MINUTES,
  MONTHLY_LIMIT,
  STRIKE_ALERT,
  canReport,
  reportFields,
  report,
  askReview,
  barberReply,
  runReportDeadlines,
  strikesByEmployee,
  adminList,
  adminDecide,
  hasOpenReport,
  alertAdmins,
}
