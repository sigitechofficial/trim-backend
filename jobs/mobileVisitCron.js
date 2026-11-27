const cron = require('node-cron')
const mobileVisitStatus = require('../helper/mobileVisitStatus')
const visitReports = require('../helper/visitReports')

// Set MOBILE_VISIT_TIMER=off to stop this timer.
const enabled = process.env.MOBILE_VISIT_TIMER !== 'off'

let running = false

// Every 5 minutes: remind barbers whose home visit has started but who have
// not set off, tell clients when their barber is running late, count no answer to
// "Is your barber here?" as yes, and refund reports the barber didn't answer in time.
if (enabled) {
  cron.schedule('*/5 * * * *', async () => {
    if (running) return // the previous run is still going
    running = true
    try {
      const summary = { ...(await mobileVisitStatus.runVisitNotices()), ...(await visitReports.runReportDeadlines()) }
      if (summary.barberReminders || summary.lateNotices || summary.autoYes || summary.refunded) console.log('[MobileVisits] run summary:', summary)
    } catch (err) {
      console.error('[MobileVisits] run failed:', err.message)
    } finally {
      running = false
    }
  })
}

console.log(
  enabled
    ? '[MobileVisits] Visit cron registered (runs every 5 minutes)'
    : '[MobileVisits] Visit cron is off (MOBILE_VISIT_TIMER=off)',
)
