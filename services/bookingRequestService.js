const { Op } = require('sequelize')
const { booking } = require('../models')
const { requestReminder } = require('../controllers/eventDrivenCommunication/appointmentRequest')
const { expireOverdueRequests } = require('../helper/expireBookingRequests')

const REMINDER_MINUTES = Number(process.env.BOOKING_REQUEST_REMINDER_MINUTES) || 120
const BATCH = 200

// Expires unanswered booking requests (releasing held deposits) and reminds
// shops before a deadline. Called by the in-server timer and by the secured
// /internal endpoint. Every row is claimed before it is handled, so two runs
// at the same moment can't expire or remind the same request twice.
// dryRun reports what would happen and changes nothing.
async function run({ dryRun = false } = {}) {
  const now = new Date()

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
    const overdue = await booking.findAll({
      where: { status: 'requested', requestExpiresAt: { [Op.lte]: now } },
      attributes: ['id'],
      limit: BATCH,
    })
    return { wouldExpire: overdue.map((b) => b.id), wouldRemind: dueSoon.map((b) => b.id) }
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

  return { expired, reminded }
}

module.exports = { run }
