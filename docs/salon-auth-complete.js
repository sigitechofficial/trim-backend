/**
 * @swagger
 * tags:
 *   name: Salon Auth
 *   description: Complete salon authentication and session management
 */

/**
 * @swagger
 * /salon/v1/auth/googleLogIn:
 *   post:
 *     summary: Authenticate salon using Google OAuth with secure token generation and push notification setup
 *     tags: [Salon Auth]
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
 *                 description: Google account email
 *               dvToken:
 *                 type: string
 *                 description: Device token for push notifications
 *               firstName:
 *                 type: string
 *                 description: First name from Google account
 *               lastName:
 *                 type: string
 *                 description: Last name from Google account
 *               image:
 *                 type: string
 *                 description: Profile image URL from Google
 *     responses:
 *       200:
 *         description: Google login successful
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
 * /salon/v1/auth/signup:
 *   post:
 *     summary: Create new salon account with comprehensive profile setup and multi-channel authentication options
 *     tags: [Salon Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - phoneNum
 *               - countryCode
 *               - signedBy
 *               - dvToken
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Salon owner's email address
 *               password:
 *                 type: string
 *                 description: Password for the account
 *               firstName:
 *                 type: string
 *                 description: Salon owner's first name
 *               lastName:
 *                 type: string
 *                 description: Salon owner's last name
 *               phoneNum:
 *                 type: string
 *                 description: Phone number
 *               countryCode:
 *                 type: string
 *                 description: Country code for phone number
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
 *         description: Salon registered successfully
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
 *                       description: OTP ID for verification (if email signup)
 *                     userId:
 *                       type: string
 *                       description: User ID of registered salon
 *                     accessToken:
 *                       type: string
 *                       description: Access token (if social signup)
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/auth/resendOTP:
 *   post:
 *     summary: Trigger new verification code delivery with configurable channel selection and expiry management
 *     tags: [Salon Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to resend OTP for
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to send OTP to (optional)
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
 * /salon/v1/auth/verifyOTP:
 *   post:
 *     summary: Validate salon verification code with secure token generation and account activation
 *     tags: [Salon Auth]
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
 *                 description: OTP ID received during signup/resend
 *               OTP:
 *                 type: string
 *                 description: 4-digit OTP code
 *               userId:
 *                 type: string
 *                 description: User ID to verify
 *               dvToken:
 *                 type: string
 *                 description: Device token for push notifications
 *               forgetPassword:
 *                 type: boolean
 *                 description: Whether this is for password reset
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
 * /salon/v1/auth/login:
 *   post:
 *     summary: Authenticate salon credentials with secure token generation and device-specific session management
 *     tags: [Salon Auth]
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
 *                 description: Salon email address
 *               password:
 *                 type: string
 *                 description: Password (required for email login)
 *               dvToken:
 *                 type: string
 *                 description: Device token for push notifications
 *     responses:
 *       200:
 *         description: Login successful
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
 * /salon/v1/auth/forgotPassword:
 *   post:
 *     summary: Initiate secure password recovery process with OTP verification and account validation
 *     tags: [Salon Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Salon email address to send reset OTP
 *     responses:
 *       200:
 *         description: Password reset OTP sent successfully
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
 * /salon/v1/auth/verifyPasswordOtp:
 *   patch:
 *     summary: Validate password reset verification code with temporary access token generation
 *     tags: [Salon Auth]
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
 *                 description: OTP ID received from forgot password request
 *               OTP:
 *                 type: string
 *                 description: 4-digit OTP code
 *     responses:
 *       200:
 *         description: Password reset OTP verified successfully
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
 * /salon/v1/auth/resetPassword:
 *   patch:
 *     summary: Update salon password with secure hash generation and session token refresh
 *     tags: [Salon Auth]
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
 *               - otpId
 *             properties:
 *               password:
 *                 type: string
 *                 description: New password
 *               otpId:
 *                 type: string
 *                 description: Verified OTP ID
 *               userId:
 *                 type: string
 *                 description: User ID (optional if using token)
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
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/auth/updatePassword:
 *   patch:
 *     summary: Modify authenticated salon password with current credential verification and secure update
 *     tags: [Salon Auth]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password for verification
 *               newPassword:
 *                 type: string
 *                 description: New password to set
 *     responses:
 *       200:
 *         description: Password updated successfully
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

/**
 * @swagger
 * /salon/v1/auth/session:
 *   get:
 *     summary: Retrieve authenticated salon profile with detailed business information and access permissions
 *     tags: [Salon Auth]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Session information retrieved successfully
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
 *                     userId:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     userType:
 *                       type: string
 *                     salonDetails:
 *                       type: object
 *                       description: Salon information if available
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/auth/employee-session/{user}:
 *   get:
 *     summary: Access employee profile with role-based permissions and salon association details
 *     tags: [Salon Auth]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: user
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID or employee identifier
 *     responses:
 *       200:
 *         description: Employee session information retrieved successfully
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
 *                     employeeId:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     salonId:
 *                       type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/auth/logout:
 *   get:
 *     summary: Securely terminate salon session with token invalidation and device notification cleanup
 *     tags: [Salon Auth]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
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
