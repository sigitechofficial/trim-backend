const express = require('express')
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const router = express.Router()
const adminController = require('../../controllers/adminController/adminController')
const adminReports = require('../../controllers/adminController/adminReportsController')
const reportController = require('../../controllers/salonControllers/newReportsController')
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
// !Module:1 Home

const { createDestinationDirectory } = require('../../utils/customFunctions')

router.post('/auth/login', catchAsync(adminController.login))
router.post(
  '/change-admin-password',
  protect,
  catchAsync(adminController.changeAdminPassword),
)
router.post(
  '/request-otp-forget-password',
  catchAsync(adminController.requestAdminForgotPasswordOtp),
)
router.post(
  '/verify-otp-forget-password',
  catchAsync(adminController.verifyAdminForgotPasswordOtp),
)
router.patch(
  '/reset-password',
  catchAsync(adminController.resetAdminForgotPassword),
)

//!NEW REPORTS FOR ADMIN
router.get(
  '/overall-report/busiest-vs-quietest/:basedOn',
  catchAsync(adminReports.busiestVsQuietestAdmin),
)
router.get(
  '/overall-report/weekly-income-report',
  catchAsync(adminReports.weeklyIncomeReportAdmin),
)
router.get(
  '/overall-report/income-report-year',
  catchAsync(adminReports.IncomeReportYearAdmin),
)
router.get(
  '/overall-report/hourly-income-report',
  catchAsync(adminReports.hourlyIncomeReportAdmin),
)

router.get(
  '/overall-report/most-popular-service-types',
  catchAsync(adminReports.mostPopularServiceTypes),
)

router.get(
  '/overall-report/service-types-performance',
  catchAsync(adminReports.bookingPerformance),
)

// router.get(
//   '/overall-report/income-report-week',
//   catchAsync(adminReports.weeklyIncomeReport),
// )

/////////////////////////////////////////////////////////////////////////////
router.get(
  '/single-salon-report/busiest-vs-quietest/:basedOn/:salon',
  catchAsync(reportController.busiestVsQuietest),
)

router.get(
  '/single-salon-report/services-by-staff-per-week/:salon',
  catchAsync(reportController.servicesByStaffPerWeek),
)

router.get(
  '/single-salon-report/services-provided-by-each-employee/:salon',
  catchAsync(reportController.totalBookings),
)

router.get(
  '/single-salon-report/most-popular-services/:salon',
  catchAsync(reportController.mostPopularServices),
)

router.get(
  '/single-salon-report/services-performance/:salon',
  catchAsync(reportController.bookingPerformance),
)

router.get(
  '/single-salon-report/income-report-yearly/:year/:salon',
  catchAsync(reportController.IncomeReportYear),
)

router.get(
  '/single-salon-report/income-report-week/:salon',
  catchAsync(reportController.weeklyIncomeReport),
)
router.get(
  '/single-salon-report/income-report-per-hour/:salon',
  catchAsync(reportController.hourlyIncomeReport),
)
router.get(
  '/single-salon-report/average-bookings/:salon',
  catchAsync(reportController.averageJobsReport),
)

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

router.put(
  '/salon-update/:salon',
  protect,
  catchAsync(adminController.updateSalonDetails),
  
)
router.put(
  '/salon-update',
  protect,
  catchAsync(adminController.updateSalonDetails),
)
router.get('/salon-view', protect, catchAsync(adminController.fecthSalons))
router.get(
  '/salon-without/:sticker',
  protect,
  catchAsync(adminController.fecthSalons),
)
router.get(
  '/salon-with-subscription/:subscription',
  protect,
  catchAsync(adminController.fecthSalons),
)

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
  catchAsync(adminController.changeCustomerStatus),
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
  '/appointments/:type',
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
router.get(
  '/dashboard-charts',
  protect,
  catchAsync(adminController.dashboardCharts),
)

//! 8.earnings -------------------------------------------------------------------------------

router.get(
  '/salon-earnings',
  protect,
  catchAsync(adminController.fecthSalonsEarnings),
)

router.get(
  '/employee-earnings/:external',
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

router.post(
  '/add-features',
  protect,
  catchAsync(adminController.addFeatures),
)
router.get(
  '/fetch-features',
  protect,
  catchAsync(adminController.fetchAllFeaturesCatalog),
)
router.put(
  '/update-feature/:id',
  protect,
  catchAsync(adminController.updateFeature),
)
router.put(
  '/restore-feature/:id',
  protect,
  catchAsync(adminController.restoreFeature),
)
router.delete(
  '/delete-feature/:id',
  protect,
  catchAsync(adminController.softDeleteFeature),
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

router.get('/fetch-reasons/:type?', catchAsync(adminController.fetchReasons))
router.put('/edit-reason/:type/:id', catchAsync(adminController.updateReasons))
router.put(
  '/change-reason-status/:type/:id',
  catchAsync(adminController.changeReasonStatus),
)
router.delete(
  '/delete-reason/:type/:id',
  catchAsync(adminController.deleteReasons),
)

router.post('/custom-emails', protect, catchAsync(adminController.customEmails))

router.get(
  '/employees-list/:external',
  protect,
  catchAsync(adminController.fecthSalons),
)

router.get(
  '/salon-customers-list/:salon',
  protect,
  catchAsync(adminController.fetchSalonCustomer),
)

router.get(
  '/admin-earnings',
  protect,
  catchAsync(adminController.adminEarnings),
)

router.get(
  '/admin-earnings-from-specific-salon/:salon',
  protect,
  catchAsync(adminController.adminEarningsFromSpecificSalon),
)

//! FAQS
router.post('/add-new-faq', catchAsync(adminController.addFAQs))

router.get(
  '/fetch-faqs/:accessFrom/:type?',
  catchAsync(adminController.fetchFAQs),
)
router.put('/edit-faq/:id', catchAsync(adminController.updateFAQs))
router.put('/change-faq-status/:id', catchAsync(adminController.updateFAQs))
router.delete('/delete-faq/:id', catchAsync(adminController.deleteFAQs))



// Admin Report Summary Data
router.get(
  '/reports/subscriptions',
  catchAsync(adminReports.adminSubscriptionSummaryOnly)
);


// Admin Report Table Data
router.get(
  '/reports/subscriptions/table',
  catchAsync(adminReports.adminSubscriptionTableData)
);

// Update VAT percentage and platform fee for all salons
router.patch('/update-all-salons-vat-platform-fee', catchAsync(adminController.updateAllSalonsVatAndPlatformFee))


//!-------------------------------Zone Management-------------------------------//
// ^ Add Country
router.post('/add-country',protect, catchAsync(adminController.addCountries))
// ^ Get Countries
router.get('/get-countries',protect, catchAsync(adminController.getCountries))
// ^ Add City
router.post('/add-city',protect, catchAsync(adminController.addCities))
// ^ Get Cities
router.get('/get-cities',protect, catchAsync(adminController.getCities))
// ^ Add Zone
router.post('/add-zone',protect, catchAsync(adminController.addZones))
// ^ Get Zones
router.get('/get-zones',protect, catchAsync(adminController.getZones))
// ^ Update Zone
router.patch('/update-zone/:id',protect, catchAsync(adminController.updateZones))
module.exports = router
