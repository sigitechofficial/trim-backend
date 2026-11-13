const express = require('express')
const router = express.Router()
const {
  subscriptionPlan,
  category,
  serviceType,
  service,
  socialLink,
  jobs,
} = require('../../models')
const salonController = require('../../controllers/salonControllers/salonController')
const customerController = require('../../controllers/userControllers/customerController')
const appleSubscriptionController = require('../../controllers/appleSubscriptions/appleSubscriptionController')
const revenueCatWebhookController = require('../../controllers/revenueCatControllers/revenueCatWebhookController')
const {
  fetchFAQs,
} = require('../../controllers/adminController/adminController')
const {
  fetchReasons,
} = require('../../controllers/adminController/adminController')
const factory = require('../../controllers/handlerFactory')
const loyaltyController = require('../../controllers/loyaltyController')
const validateToken = require('../../middlewares/accessCheck')
const { ownerOnly, needLevel } = require('../../middlewares/shopRole')
const multer = require('multer')
const catchAsync = require('../../middlewares/catchAync')
const requireCronSecret = require('../../middlewares/requireCronSecret')
const authController = require('../../controllers/salonControllers/authController')
const path = require('path')

// !Module:1 Auth
router.get(
  '/salon-feedback/:salon',
  catchAsync(salonController.clientFeedBackSalon),
)

// RevenueCat webhook endpoint (must be before validateToken - webhooks don't need auth)
router.post(
  '/webhooks/revenuecat',
  catchAsync(revenueCatWebhookController.revenueCatWebhookHandler),
)

// Ops: Stripe Connect status backfill (cron secret; no emails/push)
router.get(
  '/stripe-connect-status-backfill',
  requireCronSecret,
  catchAsync(authController.backfillStripeConnectStatus),
)

router.use(validateToken)
// Step A: the branch this request acts on (x-salon-id), checked once here.
router.use(require('../../middlewares/branchScope'))
// Owner-only: account, subscription, billing and bank. Staff are refused.
router.use(
  [
    '/account-delete',
    '/branches',
    '/registration',
    '/salonTiming',
    '/AddCard',
    '/addAnotherCard',
    '/choosePlan',
    '/iap/apple/verify',
    '/cancelSubscription',
    '/updateSubscription',
    '/update-subscriptions-price-id',
    '/for-subcription-payment',
    '/complete-subscription-after-payment',
    '/init-subscription-with-setup-intent',
    '/complete-subscription-with-setup-intent',
    '/change-payment-method-for-subscription',
    '/attach-payment-method-for-subscription',
    '/billingDetail',
    '/fetch-invoice',
    '/createOnboardingLink',
    '/accountAdded',
    '/online-payments',
    '/salonVatUpdate',
  ],
  ownerOnly,
)
// Staff permissions, checked on the server (the app only hid the buttons).
router.use('/active-block-customer', needLevel('appointments', 'high'))
router.use(['/new-allergy', '/remove-allergy', '/add-update-client-note'], needLevel('client', 'low'))
router.use(
  ['/addService', '/addServiceImages', '/updateService', '/addCategory', '/updateCategory', '/change-category-status'],
  needLevel('services', 'high'),
)
router.use('/feedback-reply', needLevel('feedback', 'high'))
router.use(['/add-coupon', '/update-coupon', '/delete-coupon'], needLevel('manageDeals', 'high'))
router.use('/send-custom-notifications', needLevel('sendNotification', 'low'))
router.use(
  [
    '/updateSalonDetail', '/addGalleryImages', '/updateGalleryImages', '/deleteGalleryImages',
    '/updateSalonTimings', '/save-working-hour', '/updateCancellationPolicies', '/updateDepositPolicies',
    '/updateNoShowPolicies', '/updatereschedulePolicy', '/updateSalonAddress', '/addSocialLinks',
    '/updateSocialLinks', '/online-offline',
  ],
  needLevel('updateProfile', 'high'),
)
// for taking profile picture of customer
const uploadSalonImgs = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `./Public/Images`)
  },
  filename: (req, file, cb) => {
    cb(
      null,
      'Service-' +
        req.body.serviceId +
        '-' +
        Date.now() +
        path.extname(file.originalname),
    )
  },
})
const uploadImage = multer({
  storage: uploadSalonImgs,
})

//2. Register salon
router.post('/registration', catchAsync(salonController.addSalonDetail))
// 2.SubsCription Plan
router.get('/subscriptionPlans', catchAsync(salonController.SubscriptionPlans))
router.post('/AddCard', catchAsync(salonController.addCard))
router.post('/choosePlan', catchAsync(salonController.choosePlan))
// Apple In-App Purchase verification (Modern App Store Server API)
router.post('/iap/apple/verify', catchAsync(appleSubscriptionController.verifyApplePurchase))
router.post('/salonTiming', catchAsync(salonController.salonTiming))
//get Salon Timing
router.get('/getSalonTiming', catchAsync(salonController.getSalonTiming))
// 2.Add Category
router.post('/addCategory', catchAsync(salonController.addCategory))
router.post(
  '/add-multiple-categories',
  catchAsync(salonController.addMultipleCategories),
)
// Get All ServiceTypes
router.post('/getServiceTypes', catchAsync(salonController.Types))
// Add Services of Salon
router.post('/addService', catchAsync(salonController.addServices))
// Add Images of Salon
router.post(
  '/addServiceImages',
  uploadImage.array('serviceImges', 10),
  catchAsync(salonController.addImages),
)
// Add Social Links of Salon
router.post('/addSocialLinks', catchAsync(salonController.addSocialLinks))
router.patch(
  '/updateSocialLinks',
  catchAsync(salonController.updateSocialLinks),
)
// Get All ServiceTypes
router.post('/getAllServices', catchAsync(salonController.getAllServices))

//! Salon profile Edit /Location, Services and social links
// Add Social Links of Salon
router.get('/salonProfile', catchAsync(salonController.salonProfile))
//Update VAT Details
router.patch('/salonVatUpdate',catchAsync(salonController.updateSalonVATDetails))
//  Add Salon Gallery Images
const uploadGalleryImgs = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `./Public/Gallery`)
  },
  filename: (req, file, cb) => {
    cb(
      null,
      'GalleryImg-' +
        req.body.salonDetailId +
        '-' +
        Date.now() +
        path.extname(file.originalname),
    )
  },
})
const uploadGallery = multer({
  storage: uploadGalleryImgs,
})
router.post(
  '/addGalleryImages',
  uploadGallery.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'portfolioImages' },
  ]),
  catchAsync(salonController.addGalleryImages),
)
// Delete Gallery Images
router.post(
  '/deleteGalleryImages',
  catchAsync(salonController.deleteGalleryImages),
)
// Get All ServiceTypes
router.get('/getGalleryImages', catchAsync(salonController.getGalleryImages))
// Update Gallery Images
router.post(
  '/updateGalleryImages',
  uploadGallery.array('galleryImages', 5),
  catchAsync(salonController.updateGalleryImages),
)
// Update Timings
router.patch(
  '/updateSalonTimings',
  catchAsync(salonController.updateSalonTimings),
)
router.post('/breaks', catchAsync(salonController.saveBreaks))
router.get(
  '/breaks/salon/:salonDetailId',
  catchAsync(salonController.getSalonBreaks),
)
router.get(
  '/breaks/:employeeId',
  catchAsync(salonController.getEmployeeBreaks),
)
router.delete('/breaks/:id', catchAsync(salonController.deleteBreak))
// Update Address
router.patch(
  '/updateSalonAddress',
  catchAsync(salonController.updateSalonAddress),
)
// Update Address
router.patch('/updateService', catchAsync(salonController.updateService))
// Update salonDetail
router.patch(
  '/updateSalonDetail',
  catchAsync(salonController.updateSalonDetail),
)
// Update Category
router.patch('/updateCategory', catchAsync(salonController.updateCategory))
// Get Categories
router.get('/getCategories', catchAsync(salonController.getCategories))
router.get('/default-categories', catchAsync(salonController.defaultCategories))

router.post('/add-coupon', catchAsync(salonController.addCoupons))
router.get('/coupons', catchAsync(salonController.fetchCoupons))
router.patch('/update-coupon/:couponId', catchAsync(salonController.updateCoupon))
router.post('/delete-coupon/:couponId', catchAsync(salonController.deleteCoupon))
router.get(
  '/customerSubscription',
  catchAsync(salonController.customerSubscription),
)
router.post(
  '/cancelSubscription',
  catchAsync(salonController.cancelActiveSubscription),
)
router.post('/addAnotherCard', catchAsync(salonController.addAnotherCard))
router.post(
  '/updateSubscription',
  catchAsync(salonController.updateSubscription),
)
router.get('/billingDetail', catchAsync(salonController.billingDetail))
//! Cancelation Policy
router.get(
  '/getCancellationPolicies',
  catchAsync(salonController.getCancellationPolicies),
)
router.get(
  '/cancellation-policies-on-versions/:version',
  catchAsync(salonController.getCancellationPolicies),
)
router.post(
  '/updateCancellationPolicies',
  catchAsync(salonController.updateCancellationPolicies),
)
//! Deposit Policy
router.get(
  '/getDepositPolicies',
  catchAsync(salonController.getDepositPolicies),
)
router.get(
  '/deposit-Policy-history',
  catchAsync(salonController.depositPolicyHistory),
)
router.post(
  '/updateDepositPolicies',
  catchAsync(salonController.updateDepositPolicies),
)
//! No Show Policy
router.get('/getNoShowPolicies', catchAsync(salonController.getNoShowPolicies))
router.get(
  '/noshow-policies-history',
  catchAsync(salonController.noShowPolicyHistory),
)
router.post(
  '/updateNoShowPolicies',
  catchAsync(salonController.updateNoShowPolicies),
)
//! Reschedule Policy
router.get(
  '/getreschedulePolicy',
  catchAsync(salonController.getreschedulePolicy),
)
router.get(
  '/reschedule-policy-history',
  catchAsync(salonController.reschedulePolicyHistory),
)
router.post(
  '/updatereschedulePolicy',
  catchAsync(salonController.updatereschedulePolicy),
)
//! Salon History
router.post('/getSalonHistory', catchAsync(salonController.salonHistory))
//! get Booking Details
router.post('/saleDetails', catchAsync(salonController.saleDetails))
//! get Booking Details
router.post(
  '/createOnboardingLink',
  catchAsync(salonController.createOnboardingLink),
)
router.post('/accountAdded', catchAsync(salonController.accountAdded))
router.get('/salonWallet', catchAsync(salonController.salonWallet))

//!fornt end payment
router.post(
  '/for-subcription-payment',
  catchAsync(customerController.forSubcriptionPurchase),
)
router.post(
  '/complete-subscription-after-payment',
  catchAsync(customerController.completeSubscriptionAfterPayment),
)

// Setup Intent flow for subscriptions
router.post(
  '/init-subscription-with-setup-intent',
  catchAsync(customerController.initSubscriptionWithSetupIntent),
)

router.post(
  '/complete-subscription-with-setup-intent',
  catchAsync(customerController.completeSubscriptionWithSetupIntent),
)

//! Salon time History
router.post('/save-working-hour', catchAsync(salonController.savingTimeHistory))

//! Salon online Offline
router.post('/online-offline', catchAsync(salonController.salonOnlineOffline))
router.get(
  '/online-offline-status',
  catchAsync(salonController.salonLiveStatus),
)

router.get(
  '/rent-chair-advertisement-status',
  catchAsync(salonController.getRentChairAdvertisementStatus),
)
router.post(
  '/rent-chair-advertisement',
  catchAsync(salonController.updateRentChairAdvertisement),
)

//! Salon online Offline
router.post(
  '/active-block-customer',
  catchAsync(salonController.activeBlockCustomer),
)
//! Salon online Offline
router.post('/announcement', catchAsync(salonController.makeAnnouncement))
router.patch(
  '/announcement/:id',
  catchAsync(salonController.updateAnnouncement),
)
router.patch(
  '/cancel-announcement/:id',
  catchAsync(salonController.updateAnnouncement),
)
router.get('/announcements', catchAsync(salonController.fetchAnnouncements))

//! Client Feed Back
router.get('/notifications', catchAsync(salonController.fetchNotifications))
//! Staff advertisement (owner side)
router.get(
  '/staff-advertisement-status',
  catchAsync(salonController.getStaffAdvertisementStatus),
)
router.post(
  '/staff-advertisement',
  catchAsync(salonController.updateStaffAdvertisement),
)
router.get(
  '/client-feedback/salon/:salon',
  catchAsync(customerController.clientFeedBack),
)
router.get(
  '/client-feedback/employee/:employee',
  catchAsync(customerController.clientFeedBack),
)

router.get(
  '/client-feedback/customer/:client',
  catchAsync(customerController.clientFeedBack),
)

router.get(
  '/client-feedback/appointment/:booking',
  catchAsync(customerController.clientFeedBack),
)

router.get(
  '/subscription-price',
  catchAsync(salonController.fetchSubscriptionPrice),
)

router.patch(
  '/update-cover-image',
  catchAsync(salonController.updateCoverImage),
)

router.get('/cancellation-reasons-for/:type', catchAsync(fetchReasons))
router.post('/feedback-reply', catchAsync(salonController.reviewReply))
router.post(
  '/send-custom-notifications/:audienceType',
  catchAsync(salonController.customPermotionalNotificaiton),
)

router.post('/new-allergy', catchAsync(salonController.addAllergies))

router.get(
  '/allergies-list-of-customer/:id',
  catchAsync(salonController.fetchAllergies),
)

router.patch('/remove-allergy/:id', catchAsync(salonController.removeAllergies))

router.patch(
  '/add-update-client-note/:id',
  catchAsync(salonController.addUpdateClientNote),
)

router.patch('/online-payments', catchAsync(salonController.onlinePayments))
router.patch('/booking-approval', catchAsync(salonController.bookingApprovalSettings))
// Loyalty discount (visit card)
router.get('/loyalty', catchAsync(loyaltyController.getShopLoyalty))
router.put('/loyalty', catchAsync(loyaltyController.saveShopLoyalty))
router.get('/loyalty/client/:customerId', catchAsync(loyaltyController.getClientCard))

router.get('/fetch-faqs/:accessFrom/:type?', catchAsync(fetchFAQs))

router.get(
  '/change-payment-method-for-subscription',
  catchAsync(salonController.changePaymentMethodsForSubscription),
)

router.patch(
  '/attach-payment-method-for-subscription',
  catchAsync(salonController.attachPaymentMethodsForSubscription),
)

router.post('/account-delete', catchAsync(salonController.accountDelete))
// Branches (Step A), owner only.
router.get('/branches', catchAsync(salonController.myBranches))
router.post('/branches', catchAsync(salonController.addBranch))
router.patch('/branches/brand', catchAsync(salonController.renameBrand))
router.post('/branches/:salonId/close', catchAsync(salonController.closeBranch))
router.get('/branches/members/:employeeId', catchAsync(salonController.memberBranches))
router.post('/branches/:salonId/members', catchAsync(salonController.addMemberToBranch))
router.patch('/branches/members/:employeeId/all-branches', catchAsync(salonController.setMemberAllBranches))
router.post('/branches/:salonId/reopen', catchAsync(salonController.reopenBranch))

router.patch(
  '/change-category-status/:id',
  catchAsync(salonController.changeCategoryStatus),
)

router.post('/update-subscriptions-price-id', catchAsync(salonController.updateSubscriptionsPriceId))

router.get('/fetch-invoice/:invoiceId', catchAsync(salonController.fetchInvoice))

// Create connection token and client secret for Stripe Terminal
router.post('/create-connection-token', catchAsync(salonController.createConnectionToken))

module.exports = router
