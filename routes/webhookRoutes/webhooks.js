const express = require('express')
const router = express.Router()
const Controller = require('../../controllers/salonControllers/webhookController')
const protect = require('../../middlewares/accessCheck')

const catchAsync = require('../../middlewares/catchAync')
router.post('/email-testing', catchAsync(Controller.emailtesting))

router.post(
  '/stripe-subcription',
  catchAsync(Controller.stripeSubscriptionWebhookEventHandler),
)


router.post(
  '/stripe-connect',
  catchAsync(Controller.stripeConnectWebhookEventHandler),
)

module.exports = router
