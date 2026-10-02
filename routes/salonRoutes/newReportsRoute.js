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
const Controller = require('../../controllers/salonControllers/newReportsController')
const factory = require('../../controllers/handlerFactory')
const validateToken = require('../../middlewares/accessCheck')
const multer = require('multer')
const catchAsync = require('../../middlewares/catchAync')
const path = require('path')

// !Module:1 Auth
router.use(validateToken)
// console.log('🚀 ~ IN NEW ROUTE FILe:')

router.get(
  '/busiest-vs-quietest/:basedOn',
  catchAsync(Controller.busiestVsQuietest),
)

router.get(
  '/services-by-staff-per-week',
  catchAsync(Controller.servicesByStaffPerWeek),
)

router.get(
  '/services-provided-by-each-employee',
  catchAsync(Controller.totalBookings),
)

router.get('/most-popular-services', catchAsync(Controller.mostPopularServices))

router.get('/services-performance', catchAsync(Controller.bookingPerformance))

router.get(
  '/income-report-yearly/:year',
  catchAsync(Controller.IncomeReportYear),
)

router.get('/income-report-week', catchAsync(Controller.weeklyIncomeReport))
router.get('/income-report-per-hour', catchAsync(Controller.hourlyIncomeReport))
router.get('/average-bookings', catchAsync(Controller.averageJobsReport))
router.get('/top-clients', catchAsync(Controller.topClients))


router.get('/subscriptions/history', validateToken, catchAsync(Controller.subscriptionHistory));

router.get('/income-with-rent-monthly', catchAsync(Controller.incomeWithRentMonthly))
router.get('/income-with-rent-daily', catchAsync(Controller.incomeWithRentDaily))
router.get('/rental-income-weekly', catchAsync(Controller.rentalIncomeWeekly))
router.get('/rental-income-monthly', catchAsync(Controller.rentalIncomeMonthly))
router.get('/rental-profit-weekly', catchAsync(Controller.rentalProfitWeekly))
router.get('/rental-profit-monthly', catchAsync(Controller.rentalProfitMonthly))
router.get('/rental-overview', catchAsync(Controller.rentalOverview))

module.exports = router
