const cron = require('node-cron')
const { runAccessPeriods } = require('../helper/accessPeriods')

// Set ACCESS_PERIOD_TIMER=off to stop this timer.
const enabled = process.env.ACCESS_PERIOD_TIMER !== 'off'
let running = false

// Every hour, on the hour: branch access for a period starts and ends (Step C).
if (enabled) {
  cron.schedule(
    '0 * * * *',
    async () => {
      if (running) return
      running = true
      try {
        const s = await runAccessPeriods()
        if (s.started || s.ended) console.log('[AccessPeriods] hourly run:', s)
      } catch (err) {
        console.error('[AccessPeriods] hourly run failed:', err.message)
      } finally {
        running = false
      }
    },
    { timezone: 'Europe/London' },
  )
}

console.log(enabled ? '[AccessPeriods] Hourly access period check registered' : '[AccessPeriods] Hourly check is off (ACCESS_PERIOD_TIMER=off)')
