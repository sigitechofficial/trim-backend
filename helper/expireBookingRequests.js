// Expire booking requests whose response deadline has passed: release the
// held deposit, cancel the booking and its jobs, update calendars and notify.
// Used by the scheduled job and on the spot when a shop or client loads their
// bookings, so expiry doesn't depend on the schedule running.
const { Op } = require('sequelize')
const { booking, jobs, salonDetail } = require('../models')
const Stripe = require('../controllers/stripe')
const { socketForCalendar } = require('../controllers/eventDrivenCommunication/calendarView')
const { requestExpired } = require('../controllers/eventDrivenCommunication/appointmentRequest')

async function expireOverdueRequests(scope = {}, limit = 200) {
  const now = new Date()
  const overdue = await booking.findAll({
    where: { ...scope, status: 'requested', requestExpiresAt: { [Op.lte]: now } },
    attributes: ['id', 'initialPaymentIntend', 'requestOutcome'],
    include: [{ model: salonDetail, attributes: ['connectAccountId'] }],
    limit,
  })

  let expired = 0
  for (const b of overdue) {
    try {
      // Claim it first so a concurrent run or a late accept can't double-handle it.
      const [claimed] = await booking.update(
        {
          status: 'cancel',
          requestOutcome: 'expired',
          respondedAt: now,
          actualCapturedAmount: 0,
          cancellationCharges: 0,
          total: 0,
          tip: 0,
        },
        { where: { id: b.id, status: 'requested' } },
      )
      if (!claimed) continue
      if (b.initialPaymentIntend) {
        await Stripe.releaseHeldPayment(b.initialPaymentIntend, b.salonDetail?.connectAccountId)
      }
      await jobs.update({ status: 'cancel' }, { where: { bookingId: b.id } })
      socketForCalendar({ appointmentId: b.id, type: 'finish', status: 'cancel' })
      requestExpired(b.id, b.requestOutcome === 'proposed')
      expired++
    } catch (err) {
      console.error(`[BookingRequests] expiring #${b.id} failed:`, err.message)
    }
  }
  return { expired, overdueIds: overdue.map((b) => b.id) }
}

// Fire-and-forget-safe wrapper for request handlers: never throws.
async function expireOverdueRequestsSafely(scope) {
  try {
    return await expireOverdueRequests(scope, 50)
  } catch (err) {
    console.error('[BookingRequests] on-the-spot expiry failed:', err.message)
    return { expired: 0, overdueIds: [] }
  }
}

module.exports = { expireOverdueRequests, expireOverdueRequestsSafely }
