const express = require('express')
const router = express.Router()

const Controller = require('../../controllers/salonControllers/performanceController')
const validateToken = require('../../middlewares/accessCheck')
const catchAsync = require('../../middlewares/catchAync')

// !Module:1 Auth
router.use(validateToken)
// Dashboard
router.get('/section-one', catchAsync(Controller.performanceDashboadSectionOne))
router.get('/section-two', catchAsync(Controller.performanceDashboadSectionTwo))
router.get(
  '/section-three',
  catchAsync(Controller.performanceDashboadSectionThree),
)

// Graph
router.get('/appointment-graph', catchAsync(Controller.appointmentsGraph))
router.get('/sales-graph/:of', catchAsync(Controller.salesGraph))
router.get('/occupancy-rate-graph', catchAsync(Controller.occupancyRateGraph))
router.get(
  '/returning-client-rate-graph',
  catchAsync(Controller.returningClientRateGraph),
)

// Reports
router.get('/report/sales', catchAsync(Controller.salesReport))
router.get('/report/appointments', catchAsync(Controller.appointmentReport))
router.get('/report/daily-summary', catchAsync(Controller.salesSummaryReport))

module.exports = router
