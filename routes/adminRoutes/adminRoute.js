const express = require('express')
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const router = express.Router()
const adminController = require('../../controllers/adminController/adminController')
const customerController = require('../../controllers/userControllers/customerController')
const protect = require('../../middlewares/accessCheck')
const catchAsync = require('../../middlewares/catchAync')
const {
  user,
  deviceToken,
  serviceType,
  salonDetail,
  rating,
  addressDBS,
  subscriptionPlan,
  subscriptionFeature,
  pushNotification,
  role,
} = require('../../models')

const { createDestinationDirectory } = require('../../utils/customFunctions')

// !Module:1 Home
router.post('/auth/login', catchAsync(adminController.login))

//!2.Service Types -------------------------------
const serviceTypeImage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destinationPath = './Public/ServiceTypes'

    // Call the function to create the destination directory
    createDestinationDirectory(destinationPath, cb)
  },
  filename: (req, file, cb) => {
    cb(null, `service-type-${Date.now()}${path.extname(file.originalname)}`)
  },
})

const upload = multer({
  storage: serviceTypeImage,
})

router.post(
  '/service-type',
  protect,
  upload.single('image'),
  catchAsync(adminController.addServieType),
)

router.get(
  '/service-type/view',
  protect,
  catchAsync(adminController.fetchServiceTypes),
)

router.put(
  '/service-type/edit/:id',
  protect,
  upload.single('image'),
  catchAsync(adminController.updateServiceTypes),
)

router.put(
  '/service-type/change-status/:id',
  catchAsync(adminController.changeStatus(serviceType)),
)
router.delete(
  '/service-type/delete/:id',
  catchAsync(adminController.softDelete(serviceType)),
)

//!3.SALONS -------------------------------

router.get('/salon-view', protect, catchAsync(adminController.fecthSalons))
router.get(
  '/salon-filter',
  protect,
  catchAsync(adminController.fecthSalonsForFilter),
)
router.get(
  '/salon-detail/:id',
  protect,
  catchAsync(customerController.salonDetails),
)
// router.put('/employee-detail/:id',protect,  catchAsync(customerController.employeeDetails));
router.put(
  '/salon-change-status/:id',
  protect,
  catchAsync(adminController.changeSalonStatus),
)
router.delete(
  '/salon-delete/:id',
  protect,
  catchAsync(adminController.delete(user)),
)

//!4.SALON EMPLOYEEs --------------------------------------------

router.get(
  '/salon-employee-detail/:id',
  protect,
  catchAsync(adminController.employeeDetails),
)

//!5.CUSTOMERS -------------------------------

router.get('/customer', protect, catchAsync(adminController.fecthCustomers))
router.get(
  '/customer-detail/:id',
  protect,
  catchAsync(adminController.fecthCustomerDetail),
)
router.put(
  '/customer-change-status/:id',
  protect,
  catchAsync(adminController.changeStatus(user)),
)
router.delete(
  '/customer-delete/:id',
  protect,
  catchAsync(adminController.delete(user)),
)

//!6.COUPONS -------------------------------

router.get('/coupons', protect, catchAsync(adminController.fecthCoupons))

//!7.CUSTOMERS -------------------------------

router.post(
  '/subscription',
  protect,
  catchAsync(adminController.addSubscription),
)
router.get(
  '/subscriptions',
  protect,
  catchAsync(adminController.fetchSubscriptions),
)
router.get(
  '/subscription/:id',
  protect,
  catchAsync(adminController.fetchSubscriptions),
)
router.put(
  '/subscription-update/:id',
  protect,
  catchAsync(adminController.updateSubscriptionPlan),
)
router.put(
  '/subscription-feature-update/:id',
  protect,
  catchAsync(adminController.updateSubscriptionFeature),
)
router.put(
  '/subscription-change-status/:id',
  protect,
  catchAsync(adminController.changeStatus(subscriptionPlan)),
)
router.delete(
  '/subscription-delete/:id',
  protect,
  catchAsync(adminController.delete(subscriptionPlan)),
)
router.put(
  '/subscription-feature-remove/:id',
  protect,
  catchAsync(adminController.delete(subscriptionFeature)),
)

//! 7.Appointments -------------------------------------------------------------------------------

router.get(
  '/appointments',
  protect,
  catchAsync(adminController.fecthAppointments),
)
router.get(
  '/appointment-detail/:id',
  protect,
  catchAsync(adminController.fecthAppointmentsDetails),
)

//! 8.Dashboard -------------------------------------------------------------------------------

router.get('/dashboard', protect, catchAsync(adminController.dashboard))

//! 8.earnings -------------------------------------------------------------------------------

router.get(
  '/salon-earnings',
  protect,
  catchAsync(adminController.fecthSalonsEarnings),
)

//! 8.Help Support --------------------------------------------------------------------------

router.get(
  '/help-support',
  protect,
  catchAsync(adminController.fetchHelpSupport),
)
router.put(
  '/help-support/:id',
  protect,
  catchAsync(adminController.updateHelpSupport),
)

//! 9.Reports -------------------------------------------------------------------------------

router.get(
  '/reports/peak-time/:status/:id',
  protect,
  catchAsync(adminController.peakTimesReport),
)
router.get(
  '/reports/financial-performance/:status',
  protect,
  catchAsync(adminController.financialPerformanceReport),
)
router.get(
  '/reports/client-file',
  protect,
  catchAsync(adminController.clientFileReport),
)
router.get(
  '/reports/appointment-conversion',
  protect,
  catchAsync(adminController.appointmentConversionReport),
)

//! 11.Salon Employees -------------------------------------------------------------------------------

router.get(
  '/salon-employees/:salon',
  protect,
  catchAsync(adminController.fetchSalonEmployees),
)

//! 12.Salon Employees -------------------------------------------------------------------------------

router.put(
  '/delete-notification/:id',
  protect,
  catchAsync(adminController.delete(pushNotification)),
)
router.post(
  '/throw-notification',
  protect,
  catchAsync(adminController.throwNotifications),
)
router.post(
  '/re-send-notification/:notification',
  protect,
  catchAsync(adminController.throwNotifications),
)
router.get(
  '/notifications',
  protect,
  catchAsync(adminController.fetchPushNotifications),
)

//! 13. Subscription Plans ----------------------------------------------------------------------

router.get('/AllSubscriptions', catchAsync(adminController.AllSubscriptions))
router.post(
  '/updateSubscription',
  catchAsync(adminController.updateSubscription),
)

//! 14.Admnin Employee management

router.post('/employee', catchAsync(adminController.addAdminsEmployee))
router.get('/employees', catchAsync(adminController.fetchAdminsEmployee))
router.get(
  '/employee-detail/:employee',
  catchAsync(adminController.fetchAdminEmployeeDetails),
)

//! 15.Role and Permission management

router.post('/add-role', catchAsync(adminController.addRoles))
router.put('/update-role-name/:role', catchAsync(adminController.updateRole))
router.put(
  '/update-role-permisiions/:role',
  catchAsync(adminController.updateRole),
)
router.get('/role-detail/:role', catchAsync(adminController.roleDetails))
router.get('/role-list', catchAsync(adminController.fetchRolesList))
router.get(
  '/fetch-active-fetures',
  catchAsync(adminController.fetchActiveFeatures),
)
router.put(
  '/role-change-status/:id',
  protect,
  catchAsync(adminController.changeStatus(role)),
)
router.delete(
  '/role-delete/:id',
  protect,
  catchAsync(adminController.delete(role)),
)
router.put(
  '/employee-change-status/:id',
  protect,
  catchAsync(adminController.changeStatus(user)),
)
router.delete(
  '/employee-delete/:id',
  protect,
  catchAsync(adminController.delete(user)),
)

//! Otehrs
router.get(
  '/employee-services-history/:employee',
  catchAsync(adminController.serviceHistory),
)

router.get(
  '/graph/top-performing-services',
  catchAsync(adminController.topPerformingServices),
)
router.get(
  '/graph/top-performing-salons/:limit',
  catchAsync(adminController.topPerformingSalons),
)
router.get(
  '/graph/client-status-distribution-graph',
  catchAsync(adminController.clientStatusDistributionGraph),
)

//! Resons
router.post('/add-new-reason/:type', catchAsync(adminController.addReasons))

router.get('/fetch-reasons/:type', catchAsync(adminController.fetchReasons))
router.put('/edit-reason/:type/:id', catchAsync(adminController.updateReasons))
router.put(
  '/change-reason-status/:type/:id',
  catchAsync(adminController.changeReasonStatus),
)
router.delete(
  '/delete-reason/:type/:id',
  catchAsync(adminController.deleteReasons),
)

module.exports = router
