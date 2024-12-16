const express = require('express')
const router = express.Router()
const Controller = require('../../controllers/salonControllers/webhookController')
const protect = require('../../middlewares/accessCheck')

const catchAsync = require('../../middlewares/catchAync')

router.post(
  '/stripe-subcription',
  catchAsync(Controller.stripeSubscriptionWebhookEventHandler),
)

module.exports = router
