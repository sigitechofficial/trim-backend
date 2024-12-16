const express = require('express')
const router = express.Router()
const payoutController = require('../../controllers/salonControllers/payoutController')
const protect = require('../../middlewares/accessCheck')

const catchAsync = require('../../middlewares/catchAync')
router.use(protect)

router.get(
  '/commission-employees',
  protect,
  catchAsync(payoutController.commissionEmployees),
)

router.get(
  '/rent-a-chair-employees',
  protect,
  catchAsync(payoutController.rentalChairEmployees),
)

router.get(
  '/salary-employees',
  protect,
  catchAsync(payoutController.salaryEmployees),
)

router.post(
  '/transfer-salary-to-employee',
  protect,
  catchAsync(payoutController.salaryEmployeePayout),
)

router.get(
  '/commission-employee-details/:employee',
  protect,
  catchAsync(payoutController.commissionEmployeeSummary),
)

router.get(
  '/rent-a-chair-employee-details/:employee',
  protect,
  catchAsync(payoutController.rentalChairEmployeeSummary),
)

router.get(
  '/salary-employee-details/:employee',
  protect,
  catchAsync(payoutController.salaryEmployeeSummary),
)

router.post(
  '/transfer-to-commission-employee',
  protect,
  catchAsync(payoutController.amountTransferCommission),
)

router.post(
  '/transfer-to-rent-a-chair-employee',
  protect,
  catchAsync(payoutController.amountTransferRentAChair),
)

router.get(
  '/commission/transaction-history/:employee',
  protect,
  catchAsync(payoutController.commissionTransactionHistory),
)

router.get(
  '/rent-a-chair/transaction-history/:employee',
  protect,
  catchAsync(payoutController.rentChairTransactionHistory),
)

router.get(
  '/salary/transaction-history/:employee',
  protect,
  catchAsync(payoutController.salaryTransactionHistory),
)

router.get(
  '/salary/employee-account/:employee',
  protect,
  catchAsync(payoutController.salaryEmployeeAccount),
)

module.exports = router
