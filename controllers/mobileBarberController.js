// Mobile barbers (see helper/mobileBarber.js): business app settings, the
// customer app's travel-fee quote, and the admin panel list.
const mobileBarber = require('../helper/mobileBarber')
const mobileVisitStatus = require('../helper/mobileVisitStatus')
const { response } = require('../utils/response')

const ok = (res, message, data) => res.json(response({ message, data }))

// ---- Business app ----

exports.getMine = async (req, res) => ok(res, 'Success.', await mobileBarber.getMySettings(req.user.id))

// { enabled, radiusMiles, feeType, fixedFee, perMileFee, minFee, bufferMinutes, serviceIds }
exports.saveMine = async (req, res) => ok(res, 'Mobile visits saved.', await mobileBarber.saveMySettings(req.user.id, req.body))

// { workMode: 'shop' | 'mobile' | 'both' }
exports.setWorkMode = async (req, res) => ok(res, 'Saved.', await mobileBarber.setWorkMode(req.user.id, req.body?.workMode))

exports.team = async (req, res) => ok(res, 'Success.', { team: await mobileBarber.teamSettings(req.user.id) })

// { allowed: true | false }
exports.setStaffAllowed = async (req, res) => {
  const allowed = req.body?.allowed === true || req.body?.allowed === 'true'
  const team = await mobileBarber.setStaffAllowed(req.user.id, req.params.employee, allowed)
  return ok(res, allowed ? 'Mobile visits allowed.' : 'Mobile visits stopped.', { team })
}

// Home visit day: { etaMinutes } (10, 15, 20, 30, 45 or 60)
exports.onTheWay = async (req, res) =>
  ok(res, 'Your client knows you are on the way.', await mobileVisitStatus.onTheWay({ userId: req.user.id, bookingId: req.params.booking, etaMinutes: req.body?.etaMinutes }))

// { lat, lng }: the barber's phone, must be within 100 m of the client's pin.
exports.arrived = async (req, res) =>
  ok(res, 'Your client knows you have arrived.', await mobileVisitStatus.arrived({ userId: req.user.id, bookingId: req.params.booking, lat: req.body?.lat, lng: req.body?.lng }))

// ---- Customer app ----

// Home screen bar: today's home visit and how far the barber is.
exports.activeVisit = async (req, res) => ok(res, 'Success.', await mobileVisitStatus.activeVisitFor(req.user.id))

// { salonDetailId, employeeId, lat, lng, serviceIds }
// No barber chosen ("any barber"): the server picks one who travels there.
exports.quote = async (req, res) => {
  const body = req.body || {}
  const result = body.employeeId ? await mobileBarber.quote(body) : await mobileBarber.pickMobileBarber(body)
  return ok(res, 'Success.', result)
}

// ---- Admin panel ----

exports.adminList = async (req, res) => ok(res, 'Success.', await mobileBarber.adminOverview())
