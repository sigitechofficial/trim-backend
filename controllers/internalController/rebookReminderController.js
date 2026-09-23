const rebookReminderService = require('../../services/rebookReminderService')

// POST /internal/run-rebook-reminders
//
// Triggered by AWS EventBridge Scheduler (not by app users). Protected by a
// shared secret sent in the `x-cron-secret` header, matched against
// process.env.REBOOK_CRON_SECRET. Pass ?dryRun=true to calculate without
// sending any push or writing log rows.
exports.runRebookReminders = async (req, res) => {
  const expected = process.env.REBOOK_CRON_SECRET
  const provided = req.headers['x-cron-secret']

  if (!expected) {
    console.error('[RebookReminder] REBOOK_CRON_SECRET is not configured.')
    return res
      .status(500)
      .json({ status: '0', message: 'Reminder trigger not configured' })
  }

  if (!provided || provided !== expected) {
    return res.status(401).json({ status: '0', message: 'Unauthorized' })
  }

  const dryRun = req.query.dryRun === 'true' || req.query.dryRun === '1'

  try {
    const summary = await rebookReminderService.run({ dryRun })
    console.log('[RebookReminder] run summary:', summary)
    return res.status(200).json({ status: '1', message: 'Done', data: summary })
  } catch (err) {
    console.error('[RebookReminder] run failed:', err)
    return res
      .status(500)
      .json({ status: '0', message: 'Reminder run failed', error: err.message })
  }
}
