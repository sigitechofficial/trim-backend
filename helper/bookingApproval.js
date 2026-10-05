const { DateTime } = require('luxon')
const { Op } = require('sequelize')
const { salonDetail, booking } = require('../models')

const SHOP_ZONE = 'Europe/London'
const WINDOW_HOURS = Number(process.env.BOOKING_REQUEST_WINDOW_HOURS) || 24
const CUTOFF_HOURS = Number(process.env.BOOKING_REQUEST_CUTOFF_HOURS) || 2
const MIN_RESPONSE_MINUTES = 30

/** Does this online booking need the shop to accept it? (walk-ins never do) */
async function requiresApproval(salonDetailId, customerId) {
  const salon = await salonDetail.findByPk(salonDetailId, {
    attributes: ['autoAcceptBookings', 'approvalScope'],
  })
  if (!salon || salon.autoAcceptBookings !== false) return false
  if (salon.approvalScope !== 'new') return true
  const knownClient = await booking.count({
    where: {
      salonDetailId,
      customerId,
      status: { [Op.in]: ['book', 'pending', 'complete'] },
    },
  })
  return knownClient === 0
}

/** Appointment start as an absolute time (bookings store UK shop-local date + time). */
function appointmentStart(on, startTime) {
  const date = String(on).slice(0, 10)
  const time = String(startTime || '00:00:00').slice(0, 8).padEnd(8, ':00')
  return DateTime.fromISO(`${date}T${time}`, { zone: SHOP_ZONE })
}

/**
 * Deadline for the shop: WINDOW_HOURS from now, but CUTOFF_HOURS before the
 * appointment; never less than MIN_RESPONSE_MINUTES, never after the start.
 */
function requestExpiresAt(on, startTime, now = DateTime.now()) {
  const start = appointmentStart(on, startTime)
  let deadline = DateTime.min(now.plus({ hours: WINDOW_HOURS }), start.minus({ hours: CUTOFF_HOURS }))
  const floor = now.plus({ minutes: MIN_RESPONSE_MINUTES })
  if (deadline < floor) deadline = start > now ? DateTime.min(start, floor) : floor
  return deadline.toJSDate()
}

module.exports = { requiresApproval, requestExpiresAt, appointmentStart }
