const express = require('express')
const router = express.Router()
const payoutController = require('../../controllers/salonControllers/payoutController')
const protect = require('../../middlewares/accessCheck')
const { ownerOnly, sameShop, needLevel } = require('../../middlewares/shopRole')

const catchAsync = require('../../middlewares/catchAync')
router.use(protect)
// Step A: the branch this request acts on (x-salon-id), checked once here.
router.use(require('../../middlewares/branchScope'))
// Team member and shop ids must be this shop's.
router.use(sameShop)
router.param('employee', (req, res, next) => sameShop(req, res, next))
router.param('salon', (req, res, next) => sameShop(req, res, next))
// Sending money is for the owner only.
// Pay and payout records: staff see only their own (paths ending in their
// employee id) unless they manage the team (teamMember high).
const ownRecord = async (req) => {
  const m = req.path.match(/\/(\d+)\/?$/)
  return Boolean(m && req._actor?.employeeId && Number(m[1]) === req._actor.employeeId)
}
router.use(needLevel('teamMember', 'high', { skip: ownRecord }))
router.use(['/transfer-salary-to-employee', '/transfer-to-commission-employee', '/transfer-to-rent-a-chair-employee', '/collect-rent'], ownerOnly)

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
//! EXTERNAL EMPLOYEE
router.get(
  '/rent-collection/dues/:salon',
  protect,
  catchAsync(payoutController.externalEmployeeSummary),
)

router.post(
  '/collect-rent/external-employee/:employee',
  protect,
  catchAsync(payoutController.collectRent),
)

router.get(
  '/rent-collection/transaction-history/:employee',
  protect,
  catchAsync(payoutController.collectedRentTransactionHistory),
)

router.get(
  '/rent-collection-employee-transaction-history',
  protect,
  catchAsync(payoutController.employeeRentCollectionTransactionHistory),
)


module.exports = router
