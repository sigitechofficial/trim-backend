const cron = require('node-cron')
const bookingRequestService = require('../services/bookingRequestService')

// Set BOOKING_REQUEST_TIMER=off to stop this timer (for example when an
// outside scheduler calls POST /internal/run-booking-requests instead).
const enabled = process.env.BOOKING_REQUEST_TIMER !== 'off'

let running = false

// Runs every 5 minutes
if (enabled) {
  cron.schedule('*/5 * * * *', async () => {
    if (running) return // the previous run is still going
    running = true
    try {
      const summary = await bookingRequestService.run()
      if (summary.expired || summary.reminded) {
        console.log('[BookingRequests] run summary:', summary)
      }
    } catch (err) {
      console.error('[BookingRequests] run failed:', err.message)
    } finally {
      running = false
    }
  })
}

console.log(
  enabled
    ? '[BookingRequests] Expiry and reminder cron registered (runs every 5 minutes)'
    : '[BookingRequests] Expiry and reminder cron is off (BOOKING_REQUEST_TIMER=off)',
)
