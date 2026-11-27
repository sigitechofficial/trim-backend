const cron = require('node-cron')
const costs = require('../helper/runningCosts')

// Set RUNNING_COST_TIMER=off to stop this timer. AWS updates cost numbers up to
// three times a day and each Cost Explorer request costs $0.01, so twice a day.
const enabled = process.env.RUNNING_COST_TIMER !== 'off'

if (enabled) {
  cron.schedule(
    '15 6,18 * * *',
    async () => {
      try {
        await costs.refresh({ force: true })
      } catch (err) {
        console.error('[RunningCosts] refresh failed:', err.message)
      }
    },
    { timezone: 'Europe/London' },
  )
}

console.log(enabled ? '[RunningCosts] AWS cost refresh registered (06:15 and 18:15 UK)' : '[RunningCosts] Timer is off (RUNNING_COST_TIMER=off)')
