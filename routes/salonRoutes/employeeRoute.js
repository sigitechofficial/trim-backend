const express = require('express')
const router = express.Router()
const { employee, time, employeService } = require('../../models')
const employeeController = require('../../controllers/salonControllers/employeeController')
const factory = require('../../controllers/handlerFactory')
const validateToken = require('../../middlewares/accessCheck')
const catchAsync = require('../../middlewares/catchAync')
const multer = require('multer')
const path = require('path')

// !Module:1 Auth
router.use(validateToken)
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
router.get('/AllEmployees', catchAsync(employeeController.AllEmployees))
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

module.exports = router
