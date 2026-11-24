const express = require('express')
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const router = express.Router()
const appController = require('../../controllers/userControllers/customerController')
const {
  fetchServiceTypes,
} = require('../../controllers/adminController/adminController')
const protect = require('../../middlewares/accessCheck')
const loyaltyController = require('../../controllers/loyaltyController')
const mobileBarberController = require('../../controllers/mobileBarberController')
const publicProtected = require('../../middlewares/publicProtected')
const catchAsync = require('../../middlewares/catchAync')
const {
  fetchFAQs,
} = require('../../controllers/adminController/adminController')
const destinationDirectory = './Public/Customer-Profiles/'

if (!fs.existsSync(destinationDirectory)) {
  fs.mkdirSync(destinationDirectory, { recursive: true })
}

// Multer disk storage configuration
const Profile = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, destinationDirectory)
  },
  filename: (req, file, cb) => {
    cb(null, 'Profile-Image-' + Date.now() + path.extname(file.originalname))
  },
})

// Multer middleware setup
const ProfileImage = multer({
  storage: Profile,
})

// !Module:1 Home
const upload = multer().none()

// Apply multer middleware to the route
// A closed, paused or blocked shop: no slots, bookings or moves (helper/shopOpen.js).
const { requireOpenShop, fromSalonParam, fromEmployeeParam, fromBooking } = require('../../helper/shopOpen')
router.post('/email-testing', upload, catchAsync(appController.emailtesting))

router.post(
  '/template-preview',
  catchAsync(appController.sendTemplatePreview),
)

router.post(
  '/notification-testing',
  catchAsync(appController.notificationTesting),
)
router.get('/fetch-faqs/:accessFrom/:type?', catchAsync(fetchFAQs))
router.get('/session', protect, catchAsync(appController.session))
router.post('/home', publicProtected, catchAsync(appController.home))
router.get('/service-types', publicProtected, catchAsync(fetchServiceTypes))
router.post('/search', publicProtected, catchAsync(appController.searchSalons))
router.get('/favorites/:favorite', protect, catchAsync(appController.home))

// Applications for a chair or a staff job (offers with terms, like the business app)
const chairMarketController = require('../../controllers/salonControllers/chairMarketController')
router.get('/applications', protect, catchAsync(chairMarketController.listOffers))
router.post('/applications', protect, catchAsync(chairMarketController.applyFromClient))
router.post('/applications/:offer/counter', protect, catchAsync(chairMarketController.counter))
router.patch('/applications/:offer/accept', protect, catchAsync(chairMarketController.accept))
router.patch('/applications/:offer/decline', protect, catchAsync(chairMarketController.decline))

router.get(
  '/salon-detail/:id',
  publicProtected,
  catchAsync(appController.salonDetails),
)
// Brand page: every branch of the brand this shop belongs to (public).
// ?lat=&lng= sorts them nearest first.
router.get('/brand/:salon/branches', catchAsync(async (req, res) => {
  const data = await require('../../helper/brandPage').branchesOf(req.params.salon, { lat: req.query.lat, lng: req.query.lng })
  if (!data) return res.json({ status: '0', message: 'This shop has no other branches.', data: {}, error: '' })
  return res.json({ status: '1', message: 'Branches', data, error: '' })
}))

//! Staff advertisement (customer side)
router.get('/salon-times/:salon', catchAsync(appController.salonTimes))
router.get('/employee-times/:employee', catchAsync(appController.employeeTimes))
router.get('/employee-detail/:id', catchAsync(appController.employeeDetails))
router.get('/check-session', catchAsync(appController.session))

router.post(
  '/employees-with-services/salon/:salon',
  catchAsync(appController.employeesWithAllServices),
)
router.post(
  '/employees-availability/employee/:employee',
  requireOpenShop(fromEmployeeParam),
  catchAsync(appController.employeeAvailability),
)
router.post(
  '/salon-availability/salon/:salon',
  requireOpenShop(fromSalonParam),
  catchAsync(appController.salonAvailability),
)
router.post('/mobile-visit/quote', publicProtected, catchAsync(mobileBarberController.quote))
router.get('/mobile-visit/active', protect, catchAsync(mobileBarberController.activeVisit))
router.post('/mobile-visit/:booking/here', protect, catchAsync(mobileBarberController.answerHere))
router.post('/mobile-visit/:booking/report', protect, catchAsync(mobileBarberController.report))
router.post('/mobile-visit/:booking/report/review', protect, catchAsync(mobileBarberController.askReview))
router.post(
  '/book-appointment',
  protect,
  catchAsync(appController.bookAppointment),
)

router.post(
  '/upfront-payment-info',
  protect,
  catchAsync(appController.captureUpFrontPaymentInfo),
)
router.post(
  '/upfront-payment-info-web',
  protect,
  catchAsync(appController.captureUpFrontPaymentInfoFromWeb),
)
router.post(
  '/upfront-payment-info-setup-intent',
  protect,
  catchAsync(appController.captureUpFrontPaymentInfoWithSetupIntent),
)

router.post(
  '/solo-employee-appointment-schedule/:bookingId',
  requireOpenShop(fromBooking),
  protect,
  catchAsync(appController.rescheduleSoloEmployeeAppointment),
)
router.post(
  '/multiple-employee-appointment-schedule/:bookingId',
  requireOpenShop(fromBooking),
  protect,
  catchAsync(appController.rescheduleMultipleEmployeeAppointment),
)
router.post(
  '/respond-time-proposal',
  // Declining is always allowed; accepting needs the shop open.
  requireOpenShop((req) => (req.body?.accept === true || req.body?.accept === 'true' ? fromBooking(req) : null)),
  protect,
  catchAsync(appController.respondToTimeProposal),
)
router.patch(
  '/cancel-appointment/:bookingId',
  protect,
  catchAsync(appController.cancelAppointment),
)
router.get(
  '/cancellation-reasons',
  protect,
  catchAsync(appController.fetchCancellationReasons),
)

router.get(
  '/appointments',
  protect,
  catchAsync(appController.fetchAppointments),
)
router.get(
  '/appointment-detail/:id',
  protect,
  catchAsync(appController.fetchAppointmentsDetails),
)
router.get(
  '/appointment/:status',
  protect,
  catchAsync(appController.fetchAppointments),
)

// CARDS
// router.post('/add-card', protect, catchAsync(appController.addCard))
router.get('/view-cards', protect, catchAsync(appController.fetchCards))
router.put('/detach-card/:pm', protect, catchAsync(appController.detachCard))

// Coupons
router.post('/apply-coupon', protect, catchAsync(appController.applyCoupon))
router.post('/test-coupon-tracking', catchAsync(appController.testCouponTracking))

// Loyalty discount (visit card)
router.post('/loyalty/quote', protect, catchAsync(loyaltyController.quote))
router.get('/loyalty/cards', protect, catchAsync(loyaltyController.myCards))
// Step C: sharing across a brand's branches, and asking a shop to delete my data.
router.get('/privacy', protect, catchAsync(require('../../controllers/privacyController').myPrivacy))
router.put('/privacy', protect, catchAsync(require('../../controllers/privacyController').setSharing))
router.post('/privacy/delete-request', protect, catchAsync(require('../../controllers/privacyController').askToDelete))

// Drawer
router.patch(
  '/profile-update',
  protect,
  catchAsync(appController.UpdateProfileData),
)
router.patch(
  '/profile-image-update',
  protect,
  ProfileImage.single('image'),
  catchAsync(appController.profileImageUpdate),
)
router.patch(
  '/like-dislike/:salon',
  protect,
  catchAsync(appController.likeDislike),
)
router.get(
  '/ratings-and-reviews',
  protect,
  catchAsync(appController.ratingAndReviews),
)
router.get(
  '/ratings-and-reviews/:appointment',
  protect,
  catchAsync(appController.ratingAndReviews),
)
router.post(
  '/ratings-and-reviews',
  protect,
  catchAsync(appController.rateEmployes),
)
router.post(
  '/ratings-and-reviews/skip',
  protect,
  catchAsync(appController.skipRating),
)
//Stripe customers Ephemeral Secret
router.patch(
  '/ephemeral-secret/renew',
  protect,
  catchAsync(appController.renewEphemeralSecret),
)

//!Salon policies

router.get('/salon-policies/:salon', catchAsync(appController.salonPolicies))

//!Check Subscription

router.get('/check-subscription', catchAsync(appController.checkSubscription))

// Account Deletion Routes
router.get(
  '/account-deletion-reasons',
  publicProtected,
  catchAsync(appController.fetchAccountDeletionReasons),
)

router.post(
  '/delete-customer',
  protect,
  catchAsync(appController.accountDelete),
)

// Account Recovery Routes
// Browser-based recovery (via email link)
router.get(
  '/recover-account',
  catchAsync(appController.recoverAccountByToken),
)


// Lambda Functions (for cron jobs)
router.get(
  '/lambda/account-recovery-reminder',
  catchAsync(appController.accountRecoveryReminder),
)

router.get(
  '/lambda/permanent-deletion',
  catchAsync(appController.permanentAccountDeletion),
)

router.post('/logout', protect, catchAsync(appController.logout))
//! Client Feed Back

router.get(
  '/client-feedback/salon/:salon',
  catchAsync(appController.clientFeedBack),
)

router.get(
  '/client-feedback/employee/:employee',
  catchAsync(appController.clientFeedBack),
)

router.get(
  '/client-feedback/customer/:client',
  catchAsync(appController.clientFeedBack),
)

router.get(
  '/client-feedback/appointment/:booking',
  catchAsync(appController.clientFeedBack),
)

router.get(
  '/notifications',
  protect,
  catchAsync(appController.fetchNotifications),
)


// POST route to transfer fixed fee to admin
router.post(
  '/transfer-fee',
  protect,
  catchAsync(appController.transferFixedFeeToAdmin),
)


//Post Route to create the customer on the connect Account
router.post('/initStripeCustomeronConnectAccount',
protect,
catchAsync(appController.initStripeCustomeronConnectAccount),
)

//Post Route to create setup intent and attach card
router.post('/create-setup-intent',
protect,
catchAsync(appController.createSetupIntent),
)

//Post Route to Attach Meta Data to Transfer
router.post('/update-transfer-metadata',
protect,
catchAsync(appController.updateTransferMetadata),
)

//Post Route to send appointment reminders before 24 hours of the appointment
router.post('/send-appointment-reminders',
catchAsync(appController.sendReminder),
)

/////customer routes end here
module.exports = router
