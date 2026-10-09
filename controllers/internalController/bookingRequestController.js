const { Op } = require('sequelize')
const { booking } = require('../../models')
const { requestReminder } = require('../eventDrivenCommunication/appointmentRequest')
const { expireOverdueRequests } = require('../../helper/expireBookingRequests')

const REMINDER_MINUTES = Number(process.env.BOOKING_REQUEST_REMINDER_MINUTES) || 120
const BATCH = 200

// POST /internal/run-booking-requests — every 15 min from AWS EventBridge.
// Expires unanswered requests (releasing held deposits) and reminds shops before
// a deadline. Same shared-secret header as the rebooking reminder; ?dryRun=true reports only.
exports.runBookingRequestJob = async (req, res) => {
  const expected = process.env.BOOKING_REQUEST_CRON_SECRET || process.env.REBOOK_CRON_SECRET
  if (!expected) {
    return res.status(500).json({ status: '0', message: 'Trigger not configured' })
  }
  if (req.headers['x-cron-secret'] !== expected) {
    return res.status(401).json({ status: '0', message: 'Unauthorized' })
  }
  const dryRun = req.query.dryRun === 'true' || req.query.dryRun === '1'
  const now = new Date()

  const overdue = await booking.findAll({
    where: { status: 'requested', requestExpiresAt: { [Op.lte]: now } },
    attributes: ['id'],
    limit: BATCH,
  })

  const reminderCutoff = new Date(now.getTime() + REMINDER_MINUTES * 60000)
  const recentlyCreated = new Date(now.getTime() - 30 * 60000) // just got the "new request" push
  const dueSoon = await booking.findAll({
    where: {
      status: 'requested',
      requestReminderSent: false,
      requestExpiresAt: { [Op.gt]: now, [Op.lte]: reminderCutoff },
      // Shop reminders only: skip requests waiting for the client to confirm a new time.
      [Op.or]: [{ requestOutcome: null }, { requestOutcome: { [Op.ne]: 'proposed' } }],
      createdAt: { [Op.lte]: recentlyCreated },
    },
    attributes: ['id', 'requestExpiresAt'],
    limit: BATCH,
  })

  if (dryRun) {
    return res.json({
      status: '1',
      message: 'Dry run',
      data: { wouldExpire: overdue.map((b) => b.id), wouldRemind: dueSoon.map((b) => b.id) },
    })
  }

  const { expired } = await expireOverdueRequests({}, BATCH)

  let reminded = 0
  for (const b of dueSoon) {
    const [claimed] = await booking.update(
      { requestReminderSent: true },
      { where: { id: b.id, status: 'requested', requestReminderSent: false } },
    )
    if (!claimed) continue
    requestReminder(b.id, b.requestExpiresAt)
    reminded++
  }

  const summary = { expired, reminded }
  console.log('[BookingRequests] run summary:', summary)
  return res.json({ status: '1', message: 'Done', data: summary })
}
