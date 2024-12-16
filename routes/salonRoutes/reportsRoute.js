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
const Controller = require('../../controllers/salonControllers/reportsController')
const factory = require('../../controllers/handlerFactory')
const validateToken = require('../../middlewares/accessCheck')
const multer = require('multer')
const catchAsync = require('../../middlewares/catchAync')
const path = require('path')

// !Module:1 Auth
router.use(validateToken)

router.get('/peak-times-report', catchAsync(Controller.peakTimesReport))
router.get('/financial-report', catchAsync(Controller.financialReport))
router.get('/financial-graph/:filter', catchAsync(Controller.financialReport))
router.get(
  '/time-off-day-analysis-report',
  catchAsync(Controller.timeOffDayAnalysisReport),
)
router.get('/ep-stc-report', catchAsync(Controller.EP_STCReport))
router.get('/client-file-report', catchAsync(Controller.clientFileReport))
router.get(
  '/appointment-conversion-report',
  catchAsync(Controller.appointmentConversionReport),
)
router.get('/sold-services-graph', catchAsync(Controller.sevicesSoldGraph))
router.get(
  '/client-status-distribution-graph',
  catchAsync(Controller.clientStatusDistributionGraph),
)
router.get('/ep-stc-graph', catchAsync(Controller.EP_STCGraph))

module.exports = router
