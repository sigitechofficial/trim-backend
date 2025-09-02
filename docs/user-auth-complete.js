/**
 * @swagger
 * tags:
 *   name: User Auth
 *   description: Complete customer/user authentication system
 */

/**
 * @swagger
 * /customer-auth/emailChecker:
 *   post:
 *     summary: Validate email existence with device registration and account status verification
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - dvToken
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to check
 *               dvToken:
 *                 type: string
 *                 description: Device token for push notifications
 *     responses:
 *       200:
 *         description: Email check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Status code (1 = exists and logged in, 2 = not exists)
 *                 message:
 *                   type: string
 *                   description: Response message
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token (if user exists and active)
 *                     userId:
 *                       type: string
 *                       description: User ID
 *                     image:
 *                       type: string
 *                       description: Profile image URL
 *                     firstName:
 *                       type: string
 *                       description: User's first name
 *                     lastName:
 *                       type: string
 *                       description: User's last name
 *                     email:
 *                       type: string
 *                       description: User's email
 *                     phoneNum:
 *                       type: string
 *                       description: User's phone number
 *                     stripeCustomerId:
 *                       type: string
 *                       description: Stripe customer ID
 *                 error:
 *                   type: string
 *                   description: Error message if any
 */

/**
 * @swagger
 * /customer-auth/signup:
 *   post:
 *     summary: Create new customer profile with multi-channel authentication and device registration
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - countryCode
 *               - phoneNum
 *               - password
 *               - signedBy
 *               - dvToken
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Customer's first name
 *               lastName:
 *                 type: string
 *                 description: Customer's last name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer's email address
 *               countryCode:
 *                 type: string
 *                 description: Country code for phone number
 *               phoneNum:
 *                 type: string
 *                 description: Customer's phone number
 *               password:
 *                 type: string
 *                 description: Account password (for email signup)
 *               signedBy:
 *                 type: string
 *                 enum: [email, google, apple, facebook]
 *                 description: Registration method
 *               dvToken:
 *                 type: string
 *                 description: Device token for push notifications
 *               image:
 *                 type: string
 *                 description: Profile image URL (optional)
 *     responses:
 *       200:
 *         description: Customer registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Status code (1 = direct login for social, 2 = OTP required for email)
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT token (for social signup)
 *                     userId:
 *                       type: string
 *                       description: User ID
 *                     otpId:
 *                       type: string
 *                       description: OTP ID (for email signup)
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /customer-auth/verify-otp:
 *   post:
 *     summary: Complete account verification with OTP validation and secure token generation
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otpId
 *               - OTP
 *               - userId
 *               - dvToken
 *             properties:
 *               otpId:
 *                 type: string
 *                 description: OTP ID received from signup/resend
 *               OTP:
 *                 type: string
 *                 description: 4-digit OTP code (use 1234 for testing)
 *               userId:
 *                 type: string
 *                 description: User ID to verify
 *               dvToken:
 *                 type: string
 *                 description: Device token for push notifications
 *               forgetPassword:
 *                 type: boolean
 *                 description: Whether this is for password reset verification
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token
 *                     userId:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phoneNum:
 *                       type: string
 *                     stripeCustomerId:
 *                       type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /customer-auth/login:
 *   post:
 *     summary: Authenticate customer with secure token generation and multi-device support
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - dvToken
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer's email address
 *               password:
 *                 type: string
 *                 description: Account password (required for email accounts)
 *               dvToken:
 *                 type: string
 *                 description: Device token for push notifications
 *     responses:
 *       200:
 *         description: Login result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Status code (1 = success, 2 = not verified/not found, 3 = reset password required)
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token (on successful login)
 *                     userId:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phoneNum:
 *                       type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /customer-auth/verify-otp-forget-password:
 *   post:
 *     summary: Validate password reset verification code with temporary access token
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otpId
 *               - OTP
 *             properties:
 *               otpId:
 *                 type: string
 *                 description: OTP ID from forgot password request
 *               OTP:
 *                 type: string
 *                 description: 4-digit OTP code (use 1234 for testing)
 *     responses:
 *       200:
 *         description: OTP verified for password reset
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     otpId:
 *                       type: string
 *                       description: Verified OTP ID for password reset
 *                     userId:
 *                       type: string
 *                       description: User ID for password reset
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /customer-auth/forgot-password:
 *   post:
 *     summary: Initiate secure password recovery process with OTP verification
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address for password reset
 *               userId:
 *                 type: string
 *                 description: User ID for password reset (alternative to email)
 *     responses:
 *       200:
 *         description: Password reset OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     otpId:
 *                       type: string
 *                       description: OTP ID for verification
 *                     userId:
 *                       type: string
 *                       description: User ID
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /customer-auth/resend-otp:
 *   post:
 *     summary: Trigger new verification code delivery with automated expiry management
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to resend OTP
 *               userId:
 *                 type: string
 *                 description: User ID to resend OTP (alternative to email)
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     otpId:
 *                       type: string
 *                     userId:
 *                       type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /customer-auth/reset-password:
 *   patch:
 *     summary: Update password with secure hash generation and session token refresh
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - userId
 *               - otpId
 *               - dvToken
 *             properties:
 *               password:
 *                 type: string
 *                 description: New password
 *               userId:
 *                 type: string
 *                 description: User ID
 *               otpId:
 *                 type: string
 *                 description: Verified OTP ID
 *               dvToken:
 *                 type: string
 *                 description: Device token for push notifications
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token
 *                     userId:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /customer-auth/change-password:
 *   patch:
 *     summary: Modify authenticated user password with current credential verification
 *     tags: [User Auth]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - newPassword
 *             properties:
 *               password:
 *                 type: string
 *                 description: Current password for verification
 *               newPassword:
 *                 type: string
 *                 description: New password to set
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                 error:
 *                   type: string
 */
