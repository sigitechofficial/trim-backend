// Mobile barbers (see helper/mobileBarber.js): business app settings, the
// customer app's travel-fee quote, and the admin panel list.
const mobileBarber = require('../helper/mobileBarber')
const mobileVisitStatus = require('../helper/mobileVisitStatus')
const visitReports = require('../helper/visitReports')
const { response } = require('../utils/response')

const ok = (res, message, data) => res.json(response({ message, data }))

// ---- Business app ----

exports.getMine = async (req, res) => ok(res, 'Success.', await mobileBarber.getMySettings(req.user.id))

// { enabled, radiusMiles, feeType, fixedFee, perMileFee, minFee, bufferMinutes, serviceIds }
// Turning home visits off with visits still booked returns { needsConfirm, count,
// next, message } without saving; send again with { confirm: true } to go ahead.
const asked = (res, data, done) => (data?.needsConfirm ? ok(res, data.message, data) : done())
const yes = (v) => v === true || v === 'true'

exports.saveMine = async (req, res) => {
  const data = await mobileBarber.saveMySettings(req.user.id, req.body)
  return asked(res, data, () => ok(res, 'Mobile visits saved.', data))
}

// { workMode: 'shop' | 'mobile' | 'both', confirm }
exports.setWorkMode = async (req, res) => {
  const data = await mobileBarber.setWorkMode(req.user.id, req.body?.workMode, yes(req.body?.confirm))
  return asked(res, data, () => ok(res, 'Saved.', data))
}

exports.team = async (req, res) => ok(res, 'Success.', { team: await mobileBarber.teamSettings(req.user.id) })

// { allowed: true | false }
exports.setStaffAllowed = async (req, res) => {
  const allowed = req.body?.allowed === true || req.body?.allowed === 'true'
  const team = await mobileBarber.setStaffAllowed(req.user.id, req.params.employee, allowed, yes(req.body?.confirm))
  if (team?.needsConfirm) return ok(res, team.message, team)
  return ok(res, allowed ? 'Mobile visits allowed.' : 'Mobile visits stopped.', { team })
}

// Home visit day: { etaMinutes } (10, 15, 20, 30, 45 or 60)
// The phone's position: { lat, lng, accuracy (metres), mocked (Android fake-GPS flag) }.
const phone = (body = {}) => ({ lat: body.lat, lng: body.lng, accuracy: body.accuracy, mocked: body.mocked })

exports.onTheWay = async (req, res) =>
  ok(res, 'Your client knows you are on the way.', await mobileVisitStatus.onTheWay({ userId: req.user.id, bookingId: req.params.booking, etaMinutes: req.body?.etaMinutes, ...phone(req.body) }))

// The phone must be within 100 m of the client's pin, and not on fake GPS.
exports.arrived = async (req, res) =>
  ok(res, 'Your client knows you have arrived.', await mobileVisitStatus.arrived({ userId: req.user.id, bookingId: req.params.booking, ...phone(req.body) }))

// Business makes a home visit: { employeeId (0 = any mobile barber), lat, lng,
// serviceIds, on, startTime, endTime } -> the travel fee for its own shop.
exports.businessQuote = async (req, res) => {
  const { shop } = await mobileBarber.callerOf(req.user.id)
  const body = { ...(req.body || {}), salonDetailId: shop.id }
  const result = Number(body.employeeId) > 0 ? await mobileBarber.quote(body) : await mobileBarber.pickMobileBarber(body)
  return ok(res, 'Success.', result)
}

// "I'm here" while the client's report waits (same location checks).
exports.reportReply = async (req, res) =>
  ok(res, 'Thanks. Your client can see you are at their address.', await visitReports.barberReply({ userId: req.user.id, bookingId: req.params.booking, ...phone(req.body) }))

// ---- Customer app ----

// Home screen bar: today's home visit and how far the barber is.
exports.activeVisit = async (req, res) => {
  const active = await mobileVisitStatus.activeVisitFor(req.user.id)
  if (active) Object.assign(active, await visitReports.reportFields(await require('../models').booking.findByPk(active.bookingId)))
  return ok(res, 'Success.', active)
}

// "Is your barber here?" { answer: 'yes' | 'no' }; No opens a report.
exports.answerHere = async (req, res) => {
  const answer = req.body?.answer
  if (answer === 'no') {
    return ok(res, 'Thanks for telling us.', { visitReport: await visitReports.report({ customerId: req.user.id, bookingId: req.params.booking }) })
  }
  const b = await mobileVisitStatus.answerHere({ customerId: req.user.id, bookingId: req.params.booking, answer })
  return ok(res, 'Thanks. Enjoy your visit.', mobileVisitStatus.statusFields(b))
}

// "My barber didn't arrive"
exports.report = async (req, res) =>
  ok(res, 'Thanks for telling us.', { visitReport: await visitReports.report({ customerId: req.user.id, bookingId: req.params.booking }) })

exports.askReview = async (req, res) =>
  ok(res, 'Our team will look at this and reply within 24 hours.', { visitReport: await visitReports.askReview({ customerId: req.user.id, bookingId: Number(req.params.booking) }) })

// ---- Admin: visit reports ----

exports.adminReports = async (req, res) => ok(res, 'Success.', await visitReports.adminList({ filter: req.query?.filter }))

// { decision: 'refund' | 'barber' }
exports.adminDecide = async (req, res) =>
  ok(res, 'Saved.', await visitReports.adminDecide({ reportId: req.params.id, decision: req.body?.decision }))

// { salonDetailId, employeeId, lat, lng, serviceIds }
// No barber chosen ("any barber"): the server picks one who travels there.
exports.quote = async (req, res) => {
  const body = req.body || {}
  const result = body.employeeId ? await mobileBarber.quote(body) : await mobileBarber.pickMobileBarber(body)
  return ok(res, 'Success.', result)
}

// ---- Admin panel ----

exports.adminList = async (req, res) => ok(res, 'Success.', await mobileBarber.adminOverview())
