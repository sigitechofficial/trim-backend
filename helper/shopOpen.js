// Can clients book this shop right now? The same rule search uses to list a
// shop: plan active (not expired, paused or refunded), branch not closed or
// paused, approved by Trim, not blocked, not deleted. A closed or blocked
// branch disappears from search and the brand page, but an old favourite,
// "rebook" or shared link still reaches it, so the booking paths check too.
const db = require('../models')
const CustomDate = require('../utils/currentDay')
const { isSalonRowActive } = require('./salonSubscriptionRule')

const CLOSED_MESSAGE = "This shop isn't taking bookings right now."

async function isShopOpen(salonId) {
  const id = Number(salonId)
  if (!(id > 0)) return true // nothing to check: the handler answers as usual
  const s = await db.salonDetail.findByPk(id, {
    attributes: ['id', 'registrationExpiryDate', 'subscriptionLatestPaymentStatus', 'closedAt', 'pausedReason', 'approvedByAdmin', 'status', 'deleted'],
  })
  if (!s) return true // unknown id: the handler says not found
  return !!s.approvedByAdmin && !!s.status && !s.deleted && isSalonRowActive(s, CustomDate.currentDay().currentDateOnly)
}

const refuse = (res) => res.json({ status: '0', message: CLOSED_MESSAGE, data: { code: 'SHOP_NOT_TAKING_BOOKINGS' }, error: '' })

/** Express guard; salonIdOf(req) returns the shop id the request is about. */
function requireOpenShop(salonIdOf) {
  return async (req, res, next) => {
    try {
      const salonId = await salonIdOf(req)
      if (salonId && !(await isShopOpen(salonId))) return refuse(res)
      return next()
    } catch (err) {
      return next(err)
    }
  }
}

// Where each client route finds its shop.
const fromSalonParam = (req) => req.params.salon
async function fromEmployeeParam(req) {
  const p = req.params.employee
  const e = (await db.employee.findByPk(p, { attributes: ['salonDetailId'] })) ||
    (await db.employee.findOne({ where: { userId: p, deleted: false, status: true }, attributes: ['salonDetailId'] }))
  return e?.salonDetailId
}
async function fromBooking(req) {
  const id = parseInt(req.params?.bookingId ?? req.body?.bookingId, 10)
  if (!(id > 0)) return null
  const b = await db.booking.findByPk(id, { attributes: ['salonDetailId'] })
  return b?.salonDetailId
}

module.exports = { isShopOpen, requireOpenShop, fromSalonParam, fromEmployeeParam, fromBooking, CLOSED_MESSAGE }
