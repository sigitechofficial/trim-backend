const express = require('express')
const router = express.Router()
const authController = require('../../controllers/userControllers/authController')
const validateToken = require('../../middlewares/accessCheck')
const catchAsync = require('../../middlewares/catchAync')

// !Module:1 Auth
router.post('/emailChecker', catchAsync(authController.emailChecker))
router.post('/signup', catchAsync(authController.signup))
router.post('/verify-otp', catchAsync(authController.verifyOTP))
router.post('/login', catchAsync(authController.login))
router.post('/social-auth', catchAsync(authController.socialAuth))
router.post(
  '/verify-otp-forget-password',
  catchAsync(authController.verifyOTPInForgetpassword),
)
router.post('/forgot-password', catchAsync(authController.requestOtp))
router.post('/resend-otp', catchAsync(authController.requestOtp))
router.patch('/reset-password', catchAsync(authController.resetPassword))

// router.use(validateToken);
router.patch('/change-password', validateToken, catchAsync(authController.updatePassword))

module.exports = router
