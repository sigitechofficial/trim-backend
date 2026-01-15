const express = require('express');
const router = express.Router();
const appleSubscriptionController = require('../../controllers/appleSubscriptions/appleSubscriptionController');
const appleWebhookController = require('../../controllers/appleSubscriptions/appleWebhookController');
const publicProtected = require('../../middlewares/publicProtected');
const catchAsync = require('../../middlewares/catchAync');

// Test endpoint (no auth - for debugging API credentials)
router.get('/test-credentials', catchAsync(appleSubscriptionController.testAppleCredentials));

// Webhook endpoint (no auth required - Apple will call this)
// Note: This should use raw body parser in main app file
router.post('/webhook', catchAsync(appleWebhookController.handleAppleWebhook));

// Protected routes
router.get('/products', catchAsync(appleSubscriptionController.getAppleSubscriptionProducts));
router.post('/validate-product', publicProtected, catchAsync(appleSubscriptionController.validateProduct));
router.post('/create-subscription', publicProtected, catchAsync(appleSubscriptionController.createAppleSubscription));
router.post('/verify-subscription', publicProtected, catchAsync(appleSubscriptionController.verifyAppleSubscription));

module.exports = router;

