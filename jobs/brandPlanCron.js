const cron = require('node-cron')
const { checkBrandPlans } = require('../helper/brandPlan')

// Set BRAND_PLAN_TIMER=off to stop this timer.
const enabled = process.env.BRAND_PLAN_TIMER !== 'off'

let running = false

// Every night at 03:15 UK time: make sure every branch on a brand plan still
// matches the brand (Step A), in case a RevenueCat webhook was missed.
if (enabled) {
  cron.schedule(
    '15 3 * * *',
    async () => {
      if (running) return
      running = true
      try {
        const summary = await checkBrandPlans()
        if (summary.remirrored || summary.expired || summary.paused || summary.unpaused) {
          console.log('[BrandPlan] nightly check:', summary)
        }
      } catch (err) {
        console.error('[BrandPlan] nightly check failed:', err.message)
      } finally {
        running = false
      }
    },
    { timezone: 'Europe/London' },
  )
}

console.log(
  enabled
    ? '[BrandPlan] Nightly brand plan check registered (03:15 UK)'
    : '[BrandPlan] Nightly brand plan check is off (BRAND_PLAN_TIMER=off)',
)
