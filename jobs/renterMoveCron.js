const cron = require('node-cron')
const renterMove = require('../helper/renterMove')
const chairMarket = require('../helper/chairMarket')

// Set RENTER_MOVE_TIMER=off to stop this timer.
const enabled = process.env.RENTER_MOVE_TIMER !== 'off'

let running = false

// Runs every 5 minutes, so a move runs soon after its date starts or its rent is
// settled, and chair market offers past their expiry close.
if (enabled) {
  cron.schedule('*/5 * * * *', async () => {
    if (running) return // the previous run is still going
    running = true
    try {
      const summary = await renterMove.runDue()
      summary.offersExpired = await chairMarket.expireOffers()
      if (summary.completed || summary.failed || summary.graceReminders || summary.graceEnded || summary.planReminders || summary.offersExpired) {
        console.log('[RenterMoves] run summary:', summary)
      }
    } catch (err) {
      console.error('[RenterMoves] run failed:', err.message)
    } finally {
      running = false
    }
  })
}

console.log(
  enabled
    ? '[RenterMoves] Move cron registered (runs every 5 minutes)'
    : '[RenterMoves] Move cron is off (RENTER_MOVE_TIMER=off)',
)
