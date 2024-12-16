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
console.log('🚀 ~ IN NEW ROUTE FILe:')

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

module.exports = router
