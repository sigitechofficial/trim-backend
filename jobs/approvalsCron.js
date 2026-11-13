const cron = require('node-cron')
const { remindAndExpire } = require('../helper/approvals')

// Set APPROVALS_TIMER=off to stop this timer.
const enabled = process.env.APPROVALS_TIMER !== 'off'

let running = false

// Every hour: remind owners of requests waiting over a day, and expire
// requests older than 7 days (Step C).
if (enabled) {
  cron.schedule(
    '7 * * * *',
    async () => {
      if (running) return
      running = true
      try {
        const summary = await remindAndExpire()
        if (summary.reminded || summary.expired) console.log('[Approvals] hourly check:', summary)
      } catch (err) {
        console.error('[Approvals] hourly check failed:', err.message)
      } finally {
        running = false
      }
    },
    { timezone: 'Europe/London' },
  )
}

console.log(enabled ? '[Approvals] Hourly reminder/expiry check registered' : '[Approvals] Hourly check is off (APPROVALS_TIMER=off)')
