const express = require('express')
const router = express.Router()
const authController = require('../../controllers/salonControllers/authController')
const validateToken = require('../../middlewares/accessCheck')
const catchAsync = require('../../middlewares/catchAync')

// !Module:1 Auth
router.post('/googleLogIn', catchAsync(authController.login))
router.post('/signup', catchAsync(authController.signup))
router.post('/resendOTP', catchAsync(authController.resendOTP))
router.post('/verifyOTP', catchAsync(authController.verifyOTP))
router.post('/login', catchAsync(authController.login))
router.post('/forgotPassword', catchAsync(authController.forgotPassword))
router.patch('/verifyPasswordOtp', catchAsync(authController.verifyPasswordOtp))

router.use(validateToken)
router.patch('/resetPassword', catchAsync(authController.resetPassword))
router.patch('/updatePassword', catchAsync(authController.updatePassword))
router.get('/session', catchAsync(authController.session))
router.get(
  '/employee-session/:user',
  catchAsync(authController.employeeSession),
)
router.get('/logout', catchAsync(authController.logout))
module.exports = router
