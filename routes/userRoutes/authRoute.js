const express = require('express')
const router = express.Router()
const authController = require('../../controllers/userControllers/authController')
const validateToken = require('../../middlewares/accessCheck')

// !Module:1 Auth
router.post('/emailChecker', authController.emailChecker)
router.post('/signup', authController.signup)
router.post('/verify-otp', authController.verifyOTP)
router.post('/login', authController.login)
router.post(
  '/verify-otp-forget-password',
  authController.verifyOTPInForgetpassword,
)
router.post('/forgot-password', authController.requestOtp)
router.post('/resend-otp', authController.requestOtp)
router.patch('/reset-password', authController.resetPassword)

// router.use(validateToken);
router.patch('/change-password', validateToken, authController.updatePassword)

module.exports = router
