const express = require('express')
const router = express.Router()
const { employee, time, employeService } = require('../../models')
const employeeController = require('../../controllers/salonControllers/employeeController')
const renterMoveController = require('../../controllers/salonControllers/renterMoveController')
const chairMarketController = require('../../controllers/salonControllers/chairMarketController')
const hiringRequestsController = require('../../controllers/salonControllers/hiringRequestsController')
const mobileBarberController = require('../../controllers/mobileBarberController')
const factory = require('../../controllers/handlerFactory')
const validateToken = require('../../middlewares/accessCheck')
const { ownerOnly, teamEditGuard, needLevel, profileOrTeamEdit } = require('../../middlewares/shopRole')
const catchAsync = require('../../middlewares/catchAync')
const multer = require('multer')
const path = require('path')

// !Module:1 Auth
router.use(validateToken)
// Owner-only team admin; access-level and pay edits are checked per member.
router.use(['/default-access-levels/create', '/default-access-levels/update', '/active-deactive-employee', '/delete-employee'], ownerOnly)
router.use(['/access-levels/create', '/access-levels/update', '/addWagesMethod', '/updateWagesMethod'], teamEditGuard)
router.use(['/AddEmployee', '/addEmployeeService'], needLevel('teamMember', 'high'))
router.use(['/updateEmployee', '/updateEmployeTimings'], profileOrTeamEdit)
// for taking profile picture of customer
const uploadSalonImgs = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `./Public/Profile`)
  },
  filename: (req, file, cb) => {
    cb(
      null,
      'profile-' +
        req.body.userId +
        '-' +
        Date.now() +
        path.extname(file.originalname),
    )
  },
})
const uploadImage = multer({
  storage: uploadSalonImgs,
})
//2. Register Employe
router.get('/employees', catchAsync(employeeController.fetchEmployees))
router.get('/employees/:type', catchAsync(employeeController.fetchEmployees))
//2. Register Employe
router.post(
  '/AddEmployee',
  uploadImage.single('profile'),
  catchAsync(employeeController.AddEmployee),
)
// Get All ServiceTypes
router.get('/getWagesMethod', catchAsync(employeeController.getWagesMethod))
// Add Services of Salon
router.post('/addWagesMethod', catchAsync(employeeController.addWagesMethod))
// AddEmployeeTiming
router.post(
  '/getEmployeeTiming',
  catchAsync(employeeController.getEmployeeTiming),
)
// Get All ServiceTypes
router.get('/getServices', catchAsync(employeeController.getServices))
// Add Services of Salon
router.post(
  '/addEmployeeService',
  catchAsync(employeeController.addEmployeeService),
)
// Get Employee Details
router.post('/employeeDetail', catchAsync(employeeController.employeeDetail))
// Update Timings
router.patch(
  '/updateEmployeTimings',
  catchAsync(employeeController.updateEmployeTimings),
)
// Update Employee Services
router.patch(
  '/updateEmployeeService',
  catchAsync(employeeController.updateEmployeeService),
)
//Update Employee Wages Method
router.patch(
  '/updateWagesMethod',
  catchAsync(employeeController.updateWagesMethod),
)
// Update Employee Basic Info
const updateEmployeeImgs = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `./Public/Profile`)
  },
  filename: (req, file, cb) => {
    cb(
      null,
      'profile-' +
        req.body.employeeId +
        '-' +
        Date.now() +
        path.extname(file.originalname),
    )
  },
})
const updateImage = multer({
  storage: updateEmployeeImgs,
})
router.patch(
  '/updateEmployee',
  updateImage.single('profile'),
  catchAsync(employeeController.updateEmployee),
)

router.post(
  '/access-levels/create',
  catchAsync(employeeController.addOrUpdateAccessleves),
)
router.patch(
  '/access-levels/update',
  catchAsync(employeeController.addOrUpdateAccessleves),
)
router.get(
  '/access-levels/:employeeId',
  catchAsync(employeeController.fetchAccesslevels),
)

router.post(
  '/default-access-levels/create',
  catchAsync(employeeController.addOrUpdateDefaultAccessleves),
)
router.patch(
  '/default-access-levels/update',
  catchAsync(employeeController.addOrUpdateDefaultAccessleves),
)
router.get(
  '/default-access-levels/:salonDetailId',
  catchAsync(employeeController.fetchDefaultAccesslevels),
)

router.patch(
  '/active-deactive-employee/:employee',
  catchAsync(employeeController.activeBlockEmployee),
)

router.patch(
  '/delete-employee/:employee',
  catchAsync(employeeController.deleteEmployee),
)

router.post(
  '/add-external-employee-default-service/:salon',
  catchAsync(employeeController.addExternalEmployeeDefaultService),
)

// Chair renters moving shop
router.get('/renter-moves', catchAsync(renterMoveController.list))
router.post('/renter-moves/invite', catchAsync(renterMoveController.invite))
router.post('/renter-moves/leave', catchAsync(renterMoveController.leave))
router.patch('/renter-moves/:move/respond', catchAsync(renterMoveController.respond))
router.patch('/renter-moves/:move/rent-settled', catchAsync(renterMoveController.settleRent))
router.patch('/renter-moves/:move/cancel', catchAsync(renterMoveController.cancel))

// Chair market: renters open to work, shops' offers and counter offers
router.get('/chair-market/me', catchAsync(chairMarketController.getMyPrefs))
router.put('/chair-market/me', catchAsync(chairMarketController.saveMyPrefs))
router.get('/chair-market/shops/:shop', catchAsync(chairMarketController.shopProfile))
router.get('/chair-market/renters', catchAsync(chairMarketController.listRenters))
router.get('/chair-market/renters/:renter', catchAsync(chairMarketController.renterProfile))
router.get('/chair-market/rent-hint', catchAsync(chairMarketController.rentHint))
router.get('/chair-market/offers', catchAsync(chairMarketController.listOffers))
router.post('/chair-market/offers', catchAsync(chairMarketController.sendOffer))
router.post('/chair-market/offers/:offer/counter', catchAsync(chairMarketController.counter))
router.patch('/chair-market/offers/:offer/accept', catchAsync(chairMarketController.accept))
router.patch('/chair-market/offers/:offer/decline', catchAsync(chairMarketController.decline))
router.get('/chair-market/listing', catchAsync(chairMarketController.getMyListing))
router.put('/chair-market/listing', catchAsync(chairMarketController.saveMyListing))
router.get('/chair-market/hiring-shops', catchAsync(chairMarketController.listHiringShops))
router.post('/chair-market/apply', catchAsync(chairMarketController.applyToShop))
router.post('/chair-market/hiring-shops/:shop/hide', catchAsync(chairMarketController.hideShop))
// Hiring requests: client app applications and business app chair offers in one list
router.get('/hiring-requests', catchAsync(hiringRequestsController.list))
router.get('/hiring-requests/count', catchAsync(hiringRequestsController.count))
router.post('/chair-market/offers/:offer/start', catchAsync(chairMarketController.startDecision))
router.patch('/chair-market/renters/:renter/cover', catchAsync(chairMarketController.setCover))
router.get('/chair-market/team/:employee/cover', catchAsync(chairMarketController.teamCover))
router.patch('/chair-market/team/:employee/cover', catchAsync(chairMarketController.setTeamCover))

// Mobile barber: "Mobile visits" settings
router.get('/mobile-visits/me', catchAsync(mobileBarberController.getMine))
router.put('/mobile-visits/me', catchAsync(mobileBarberController.saveMine))
router.put('/mobile-visits/work-mode', catchAsync(mobileBarberController.setWorkMode))
router.get('/mobile-visits/team', catchAsync(mobileBarberController.team))
router.put('/mobile-visits/team/:employee', catchAsync(mobileBarberController.setStaffAllowed))
router.post('/mobile-visits/bookings/:booking/on-the-way', catchAsync(mobileBarberController.onTheWay))
router.post('/mobile-visits/bookings/:booking/arrived', catchAsync(mobileBarberController.arrived))

module.exports = router
