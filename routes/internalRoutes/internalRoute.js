const express = require('express')

const router = express.Router()
const catchAsync = require('../../middlewares/catchAync')
const rebookReminderController = require('../../controllers/internalController/rebookReminderController')

// Machine-to-machine endpoints triggered by schedulers (AWS EventBridge),
// authenticated by a shared secret header rather than a user JWT.
router.post(
  '/run-rebook-reminders',
  catchAsync(rebookReminderController.runRebookReminders),
)

module.exports = router
