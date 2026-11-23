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
const { ownerOnly, teamEditGuard, needLevel, profileOrTeamEdit, sameShop } = require('../../middlewares/shopRole')
const catchAsync = require('../../middlewares/catchAync')
const multer = require('multer')
const path = require('path')

// !Module:1 Auth
router.use(validateToken)
// Step A: the branch this request acts on (x-salon-id), checked once here.
router.use(require('../../middlewares/branchScope'))
// Team member and shop ids sent by the app must be this shop's.
router.use(sameShop)
router.param('employee', (req, res, next) => sameShop(req, res, next))
router.param('employeeId', (req, res, next) => sameShop(req, res, next))
router.param('salonDetailId', (req, res, next) => sameShop(req, res, next))
// Owner-only team admin; access-level and pay edits are checked per member.
router.use(['/default-access-levels/create', '/default-access-levels/update', '/active-deactive-employee', '/delete-employee'], ownerOnly)
router.use(['/access-levels/create', '/access-levels/update', '/updateWagesMethod'], teamEditGuard)
// A new team member sets their own pay method on first login (the app's
// "Add wages method" step): themselves only, and only while they have none.
// Anyone else goes through teamEditGuard as before.
router.use('/addWagesMethod', async (req, res, next) => {
  try {
    const { resolveRequestActor } = require('../../helper/bookingRequestAccess')
    const actor = req._actor || (req._actor = await resolveRequestActor(req))
    const id = parseInt(req.body?.employeeId, 10)
    if (actor.shopId && !actor.isOwner && id > 0 && id === actor.employeeId) {
      const db = require('../../models')
      if ((await db.employeeWagesMethod.count({ where: { employeeId: id } })) === 0) return next()
    }
    return teamEditGuard(req, res, next)
  } catch (err) {
    next(err)
  }
})
// Step C: changing one person's access by hand to something other than their
// custom role's levels takes them off the role (otherwise the next change to
// the role would undo it). Saving the role's own levels keeps it.
router.use(['/access-levels/create', '/access-levels/update'], async (req, res, next) => {
  try {
    const id = parseInt(req.body?.employeeId, 10)
    const db = require('../../models')
    const e = id > 0 ? await db.employee.findByPk(id, { attributes: ['id', 'customRoleId'] }) : null
    const role = e?.customRoleId ? await db.customRole.findByPk(e.customRoleId) : null
    if (role) {
      const want = typeof role.levels === 'string' ? JSON.parse(role.levels) : role.levels
      const sent = Object.fromEntries((req.body?.accesslevels || []).map((a) => [a.key, a.level]))
      const differs = Object.keys(want).some((k) => (sent[k] || 'none') !== want[k])
      if (differs) {
        res.on('finish', () => {
          if (res.statusCode < 400) db.employee.update({ customRoleId: null }, { where: { id } }).catch(() => {})
        })
      }
    }
    next()
  } catch (err) {
    next(err)
  }
})
router.use('/AddEmployee', needLevel('teamMember', 'high'))
// A new team member picks their own services on first login (the app's
// "Add employee service" step). Allowed for themselves only, and only while
// they have none yet; later changes go through updateEmployeeService.
router.use('/addEmployeeService', needLevel('teamMember', 'high', {
  skip: async (req) => {
    const id = parseInt(req.body?.employeeId, 10)
    if (!(id > 0) || id !== req.actor?.employeeId) return false
    const db = require('../../models')
    return (await db.employeeService.count({ where: { employeeId: id } })) === 0
  },
}))
router.use(['/updateEmployee', '/updateEmployeTimings', '/updateEmployeeService'], profileOrTeamEdit)
// Step B: chair market, renter moves and shop work mode belong to the shop's
// owner (a chair renter is the owner of their own shop, so they pass).
router.use(['/chair-market', '/renter-moves', '/add-external-employee-default-service', '/mobile-visits/work-mode'], ownerOnly)
// Step C: some team changes wait for the owner's approval (after the guards).
router.use(require('../../middlewares/approvalGate'))
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
router.put('/mobile-visits/team/:employee', teamEditGuard, catchAsync(mobileBarberController.setStaffAllowed))
router.post('/mobile-visits/bookings/:booking/on-the-way', catchAsync(mobileBarberController.onTheWay))
router.post('/mobile-visits/bookings/:booking/arrived', catchAsync(mobileBarberController.arrived))
router.post('/mobile-visits/bookings/:booking/report-reply', catchAsync(mobileBarberController.reportReply))
router.post('/mobile-visits/quote', catchAsync(mobileBarberController.businessQuote))

module.exports = router
