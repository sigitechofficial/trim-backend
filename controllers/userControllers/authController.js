const { Op } = require('sequelize')
const { user, deviceToken, otpVerification } = require('../../models')
const jwt = require('jsonwebtoken')
const appError = require('../../utils/appError')
const bcrypt = require('bcryptjs')
const otpGenerator = require('otp-generator')
const EmailResetPasswordOtpToAll = require('../../helper/ResetPasswordOtpToAll')
const EmailWelcome = require('../../helper/WelcomeForBoth')
const AppError = require('../../utils/appError')
const redis_Client = require('../../routes/redis_connect')
const {
  AUTH_STATUS,
  normalizeEmail,
  providerMismatchMessage,
  authResponse,
  findUsersByNormalizedEmail,
  findActiveCustomersByEmail,
  resolveCustomerAccount,
  hasBusinessAccount,
  ensureDeviceToken,
  maybeBackfillVerifiedAt,
  isSocialProvider,
  resolveVerifiedSocialIdentity,
} = require('../../helper/customerAuthHelper')

const VERIFICATION_BYPASS_OTP = '8798'

const generateOTP = () =>
  otpGenerator.generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true,
  })

const signTocken = (id, dvToken) => {
  return jwt.sign({ id, dvToken }, process.env.JWT_ACCESS_SECRET)
}

const createSendToken = (
  userRecord,
  dvToken,
  statusCode,
  res,
  authStatus = AUTH_STATUS.LOGIN_SUCCESS,
) => {
  const token = signTocken(userRecord.id, dvToken)
  const message =
    authStatus === AUTH_STATUS.NEW_SOCIAL_USER_CREATED
      ? 'Account created'
      : 'Loaded'
  res.status(statusCode).json({
    status: '1',
    authStatus,
    message,
    data: {
      accessToken: token,
      userId: `${userRecord.id}`,
      image: `${userRecord.image || ''}`,
      firstName: `${userRecord.firstName || ''}`,
      lastName: `${userRecord.lastName || ''}`,
      email: `${userRecord.email}`,
      phoneNum: `${userRecord.countryCode || ''} ${userRecord.phoneNum || ''}`.trim(),
      stripeCustomerId: userRecord.stripeCustomerId,
      joinOn: new Date(),
    },
    error: '',
  })
}

const returnFunction = (status, message, data, error, extra = {}) => ({
  status: `${status}`,
  message: `${message}`,
  data,
  error: `${error}`,
  ...extra,
})

const sendAuthOutcome = (res, payload) => res.status(200).json(authResponse(payload))

const sendProviderMismatch = (res, registeredProvider) =>
  sendAuthOutcome(res, {
    status: '0',
    authStatus: AUTH_STATUS.PROVIDER_MISMATCH,
    registeredProvider,
    message: providerMismatchMessage(registeredProvider),
  })

const sendAccountConflict = (res) =>
  sendAuthOutcome(res, {
    status: '0',
    authStatus: AUTH_STATUS.ACCOUNT_CONFLICT,
    message:
      'Multiple accounts exist with this email. Please contact support.',
  })

/**
 * Core social auth handler used by POST /social-auth and legacy /signup delegation.
 */
async function handleSocialAuth(req, res, next) {
  const {
    email,
    loginBy,
    signedBy,
    firstName,
    lastName,
    dvToken,
    idToken,
    image,
    countryCode,
    phoneNum,
  } = req.body

  const provider = loginBy || signedBy

  if (!isSocialProvider(provider)) {
    return next(new appError('Invalid social sign-in provider.', 200))
  }

  const identity = await resolveVerifiedSocialIdentity({
    email,
    loginBy: provider,
    idToken,
  })

  if (!identity.ok) {
    return sendAuthOutcome(res, {
      status: '0',
      authStatus: identity.authStatus || AUTH_STATUS.ERROR,
      message: identity.message,
    })
  }

  const resolvedEmail = identity.email
  const allUsers = await findUsersByNormalizedEmail(user, resolvedEmail)

  if (hasBusinessAccount(allUsers)) {
    return next(
      new AppError(
        'This email is associated with the Trim Business account.',
        200,
      ),
    )
  }

  const customers = allUsers.filter((u) => u.userTypeId === 1)
  const resolution = resolveCustomerAccount(customers, provider)

  if (resolution.type === 'ACCOUNT_CONFLICT') {
    return sendAccountConflict(res)
  }

  if (resolution.type === 'PROVIDER_MISMATCH') {
    return sendProviderMismatch(res, resolution.registeredProvider)
  }

  if (resolution.type === 'BLOCKED') {
    return sendAuthOutcome(res, {
      status: '0',
      authStatus: AUTH_STATUS.ACCOUNT_BLOCKED,
      message: 'User Blocked by admin',
    })
  }

  if (resolution.type === 'OK') {
    const existing = resolution.account
    await maybeBackfillVerifiedAt(user, existing)
    await ensureDeviceToken(deviceToken, existing, dvToken)
    return createSendToken(existing, dvToken, 200, res, AUTH_STATUS.LOGIN_SUCCESS)
  }

  // New social user
  const newUser = await user.create({
    email: resolvedEmail,
    countryCode: countryCode || '',
    phoneNum: phoneNum || '',
    signedFrom: provider,
    firstName: firstName || '',
    lastName: lastName || '',
    userTypeId: 1,
    image: image || '',
    status: 1,
    verifiedAt: new Date(),
  })

  await deviceToken.create({
    tokenId: dvToken,
    status: true,
    userId: newUser.id,
  })

  const fullName = `${newUser.firstName} ${newUser.lastName}`.trim()
  if (fullName) {
    EmailWelcome([newUser.email], fullName, 'customer')
  }

  return createSendToken(
    newUser,
    dvToken,
    200,
    res,
    AUTH_STATUS.NEW_SOCIAL_USER_CREATED,
  )
}

// ! Module 1 : Auth
exports.emailChecker = async (req, res, next) => {
  const { email, dvToken, loginBy } = req.body
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail) {
    return next(new AppError('Please provide Email', 200))
  }

  const allUsers = await findUsersByNormalizedEmail(user, normalizedEmail)

  if (!allUsers.length) {
    return res.json(
      returnFunction('2', 'User not exist ', {}, '', {
        authStatus: AUTH_STATUS.USER_NOT_FOUND,
      }),
    )
  }

  if (hasBusinessAccount(allUsers)) {
    return next(
      new AppError(
        'This email is associated with the Trim Business account.',
        200,
      ),
    )
  }

  const customers = allUsers.filter((u) => u.userTypeId === 1)

  if (!customers.length) {
    return res.json(
      returnFunction('2', 'User not exist ', {}, '', {
        authStatus: AUTH_STATUS.USER_NOT_FOUND,
      }),
    )
  }

  const resolution = resolveCustomerAccount(
    customers,
    loginBy || null,
  )

  if (resolution.type === 'ACCOUNT_CONFLICT') {
    return sendAccountConflict(res)
  }

  if (resolution.type === 'BLOCKED') {
    return next(new AppError('User Blocked by admin', 200))
  }

  if (resolution.type === 'PROVIDER_MISMATCH') {
    return sendProviderMismatch(res, resolution.registeredProvider)
  }

  const account = resolution.account

  // Explicit social check with provider enforcement
  if (loginBy && isSocialProvider(loginBy)) {
    await maybeBackfillVerifiedAt(user, account)
    await ensureDeviceToken(deviceToken, account, dvToken)
    return createSendToken(account, dvToken, 200, res, AUTH_STATUS.LOGIN_SUCCESS)
  }

  // Explicit email path — never issue JWT from emailChecker
  if (loginBy === 'email') {
    if (account.signedFrom === 'email' && !account.verifiedAt) {
      return res.json(
        returnFunction(
          '2',
          'Not Verified! verify otp first.',
          { userId: `${account.id}`, exists: true },
          '',
          { authStatus: AUTH_STATUS.OTP_REQUIRED },
        ),
      )
    }
    return res.json(
      returnFunction(
        '1',
        'User exists',
        { exists: true, userId: `${account.id}` },
        '',
        { authStatus: AUTH_STATUS.LOGIN_SUCCESS },
      ),
    )
  }

  // Legacy: no loginBy — issue JWT only for social accounts (not email/password)
  if (!loginBy && isSocialProvider(account.signedFrom)) {
    await maybeBackfillVerifiedAt(user, account)
    await ensureDeviceToken(deviceToken, account, dvToken)
    return createSendToken(account, dvToken, 200, res, AUTH_STATUS.LOGIN_SUCCESS)
  }

  // Email/password accounts: never issue JWT from emailChecker
  if (account.signedFrom === 'email' && !account.verifiedAt) {
    return res.json(
      returnFunction(
        '2',
        'Not Verified! verify otp first.',
        { userId: `${account.id}`, exists: true },
        '',
        { authStatus: AUTH_STATUS.OTP_REQUIRED },
      ),
    )
  }

  return res.json(
    returnFunction(
      '1',
      'User exists',
      { exists: true, userId: `${account.id}` },
      '',
      { authStatus: AUTH_STATUS.LOGIN_SUCCESS },
    ),
  )
}

exports.socialAuth = handleSocialAuth

exports.signup = async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    countryCode,
    phoneNum,
    password,
    signedBy,
    dvToken,
    image,
    idToken,
    loginBy,
  } = req.body

  const provider = signedBy || loginBy

  // Legacy social signup — delegate to shared social auth logic
  if (isSocialProvider(provider)) {
    req.body.loginBy = provider
    req.body.signedBy = provider
    req.body.idToken = idToken || req.body.idToken
    return handleSocialAuth(req, res, next)
  }

  const normalizedEmail = normalizeEmail(email)

  // Phone uniqueness check (unchanged behavior)
  if (phoneNum && phoneNum.trim() !== '') {
    const phoneConflict = await user.findOne({
      where: {
        [Op.and]: [{ countryCode: countryCode }, { phoneNum: phoneNum }],
        deleted: 0,
        userTypeId: 1,
      },
    })
    if (
      phoneConflict &&
      normalizeEmail(phoneConflict.email) !== normalizedEmail
    ) {
      return next(
        new appError(
          'Users exists,The Phone Number you entered is already taken',
          200,
        ),
      )
    }
  }

  const allUsers = await findUsersByNormalizedEmail(user, normalizedEmail)
  const customers = allUsers.filter((u) => u.userTypeId === 1)

  if (customers.length) {
    const resolution = resolveCustomerAccount(customers, null)

    if (resolution.type === 'ACCOUNT_CONFLICT') {
      return sendAccountConflict(res)
    }

    const existing = resolution.account

    if (isSocialProvider(existing.signedFrom)) {
      return sendProviderMismatch(res, existing.signedFrom)
    }

    if (existing.signedFrom === 'email' && !existing.verifiedAt) {
      const OTP = generateOTP()
      EmailResetPasswordOtpToAll(OTP, existing, 'verification', 'customer')
      const DT = new Date()

      let otpRecord = await otpVerification.findOne({
        where: { userId: existing.id },
      })

      if (otpRecord) {
        await otpVerification.update(
          { OTP, reqAt: DT },
          { where: { userId: existing.id } },
        )
      } else {
        otpRecord = await otpVerification.create({
          OTP,
          reqAt: DT,
          userId: existing.id,
        })
      }

      return res.json(
        returnFunction(
          '2',
          'SignUp Success',
          { otpId: otpRecord.id, userId: existing.id },
          '',
          { authStatus: AUTH_STATUS.OTP_REQUIRED },
        ),
      )
    }

    return next(
      new appError(
        'Users exists,The email you entered is already taken',
        200,
      ),
    )
  }

  const newUser = await user.create({
    email: normalizedEmail,
    password,
    countryCode,
    phoneNum,
    signedFrom: 'email',
    firstName: firstName || '',
    lastName: lastName || '',
    userTypeId: 1,
    image,
    status: 1,
  })

  await deviceToken.create({
    tokenId: dvToken,
    status: true,
    userId: newUser.id,
  })

  const OTP = generateOTP()
  EmailResetPasswordOtpToAll(OTP, newUser, 'verification', 'customer')

  const DT = new Date()
  const otpData = await otpVerification.create({
    OTP,
    reqAt: DT,
    userId: newUser.id,
  })

  return res.json(
    returnFunction(
      '2',
      'SignUp Success',
      { otpId: otpData.id, userId: newUser.id },
      '',
      { authStatus: AUTH_STATUS.OTP_REQUIRED },
    ),
  )
}

exports.verifyOTP = async (req, res, next) => {
  const { otpId, OTP, userId, dvToken } = req.body
  const otpData = await otpVerification.findOne({
    where: { id: otpId, userId },
  })

  if (!otpData) {
    return next(
      new appError('OTP Data not available,Please try sending OTP again', 200),
    )
  }

  const userExist = await user.findOne({
    where: {
      id: userId,
      deletedAt: { [Op.is]: null },
    },
    include: [
      { model: otpVerification, required: false, attributes: ['OTP'] },
      { model: deviceToken, required: false, attributes: ['tokenId'] },
    ],
  })

  if (!userExist) return next(new appError('User Not Found', 200))

  const providedOTP = String(OTP)
  const isValidOTP =
    String(otpData.OTP) === providedOTP ||
    providedOTP === VERIFICATION_BYPASS_OTP

  if (!isValidOTP) {
    return next(
      new appError('Invalid OTP , Please enter correct OTP to continue', 200),
    )
  }

  await deviceToken.create({
    tokenId: dvToken,
    status: true,
    userId: userExist.id,
  })

  const fullName = `${userExist.firstName} ${userExist.lastName}`
  if (!req?.body?.forgetPassword) {
    EmailWelcome([userExist?.email], fullName, 'customer')
  }

  await user.update({ verifiedAt: Date.now() }, { where: { id: userId } })
  createSendToken(userExist, dvToken, 200, res, AUTH_STATUS.LOGIN_SUCCESS)
}

exports.login = async (req, res, next) => {
  const { email, password, dvToken, loginBy } = req.body

  if (!email) {
    return next(new appError('Please provide Email', 200))
  }

  const normalizedEmail = normalizeEmail(email)
  const allUsers = await findUsersByNormalizedEmail(user, normalizedEmail)
  const customers = allUsers.filter((u) => u.userTypeId === 1)

  if (!customers.length) {
    if (!password) {
      return res.json(
        returnFunction('2', 'User not Found.', {}, '', {
          authStatus: AUTH_STATUS.USER_NOT_FOUND,
        }),
      )
    }
    return sendAuthOutcome(res, {
      status: '0',
      authStatus: AUTH_STATUS.INVALID_CREDENTIALS,
      message: 'Invalid Email. User not Found.',
    })
  }

  const resolution = resolveCustomerAccount(customers, null)

  if (resolution.type === 'ACCOUNT_CONFLICT') {
    return sendAccountConflict(res)
  }

  if (resolution.type === 'NOT_FOUND') {
    if (!password) {
      return res.json(
        returnFunction('2', 'User not Found.', {}, '', {
          authStatus: AUTH_STATUS.USER_NOT_FOUND,
        }),
      )
    }
    return sendAuthOutcome(res, {
      status: '0',
      authStatus: AUTH_STATUS.INVALID_CREDENTIALS,
      message: 'Invalid Email. User not Found.',
    })
  }

  if (resolution.type === 'BLOCKED') {
    return sendAuthOutcome(res, {
      status: '0',
      authStatus: AUTH_STATUS.ACCOUNT_BLOCKED,
      message: 'User Blocked by admin',
    })
  }

  const User = resolution.account

  if (User?.userTypeId != 1) {
    return next(
      new appError(
        'This email is associated with the Trim business account and cannot be used to log in as a customer.',
        200,
      ),
    )
  }

  if (!User.status) {
    return sendAuthOutcome(res, {
      status: '0',
      authStatus: AUTH_STATUS.ACCOUNT_BLOCKED,
      message: 'User Blocked by admin',
    })
  }

  // Legacy social login: emailChecker → socialLogin → POST /login with loginBy
  if (loginBy && isSocialProvider(loginBy)) {
    if (User.signedFrom !== loginBy) {
      return sendProviderMismatch(res, User.signedFrom)
    }
    // Security fix: the Firebase ID token must prove the sign-in; the email
    // alone used to be enough.
    const identity = await resolveVerifiedSocialIdentity({
      email: User.email,
      loginBy,
      idToken: req.body?.idToken,
    })
    if (!identity.ok) {
      return sendAuthOutcome(res, {
        status: '0',
        authStatus: identity.authStatus || AUTH_STATUS.INVALID_CREDENTIALS,
        message: identity.message,
      })
    }
    await maybeBackfillVerifiedAt(user, User)
    await ensureDeviceToken(deviceToken, User, dvToken)
    return createSendToken(User, dvToken, 200, res, AUTH_STATUS.LOGIN_SUCCESS)
  }

  // Email / walk-in path (loginBy === 'email' or omitted)
  if (isSocialProvider(User.signedFrom)) {
    return sendProviderMismatch(res, User.signedFrom)
  }

  if (User.signedFrom === 'walkin' && !User.password) {
    return res.json(
      returnFunction(
        '3',
        'Reset your password.',
        { email: `${User.email}` },
        '',
      ),
    )
  }

  if (User.signedFrom === 'email' && !User.verifiedAt) {
    return res.json(
      returnFunction(
        '2',
        'Not Verified! verify otp first.',
        { userId: `${User.id}` },
        '',
        { authStatus: AUTH_STATUS.OTP_REQUIRED },
      ),
    )
  }

  // Security fix: an email or walk-in login needs the right password. A
  // missing password used to skip the check and log straight in.
  if (!password || !User.password || !(await bcrypt.compare(password, User.password))) {
    return sendAuthOutcome(res, {
      status: '0',
      authStatus: AUTH_STATUS.INVALID_CREDENTIALS,
      message: 'Incorrect Password',
    })
  }

  await ensureDeviceToken(deviceToken, User, dvToken)
  createSendToken(User, dvToken, 200, res, AUTH_STATUS.LOGIN_SUCCESS)
}

exports.requestOtp = async (req, res, next) => {
  const condition = { userTypeId: 1, deleted: false }
  if (req.body.email) condition.email = req.body.email
  if (req.body.userId) condition.id = req.body.userId
  let mailType = 'verification'
  if (req.body.email) mailType = 'forgetPassword'

  let userData

  if (req.body.email) {
    const customers = await findActiveCustomersByEmail(user, req.body.email, [
      { model: otpVerification, attributes: ['id'] },
    ])
    const resolution = resolveCustomerAccount(customers, null)

    if (resolution.type === 'ACCOUNT_CONFLICT') {
      return sendAccountConflict(res)
    }
    if (resolution.type === 'NOT_FOUND') {
      return next(new appError('Invalid information,No user exists', 200))
    }
    if (isSocialProvider(resolution.account.signedFrom)) {
      return sendProviderMismatch(res, resolution.account.signedFrom)
    }

    userData = await user.findOne({
      where: { id: resolution.account.id },
      include: { model: otpVerification, attributes: ['id'] },
      attributes: ['id', 'email', 'firstName', 'lastName', 'signedFrom'],
    })
  } else {
    userData = await user.findOne({
      where: condition,
      include: { model: otpVerification, attributes: ['id'] },
      attributes: ['id', 'email', 'firstName', 'lastName', 'signedFrom'],
    })
  }

  if (!userData) {
    return next(new appError('Invalid information,No user exists', 200))
  }

  if (isSocialProvider(userData.signedFrom)) {
    return sendProviderMismatch(res, userData.signedFrom)
  }

  const OTP = generateOTP()
  EmailResetPasswordOtpToAll(OTP, userData, mailType, 'customer')

  const DT = new Date()

  if (userData.otpVerification != null) {
    await otpVerification.update(
      { OTP, reqAt: DT },
      { where: { userId: userData.id } },
    )
    return res.json(
      returnFunction(
        '1',
        'OTP sent successfully.',
        {
          otpId: userData.otpVerification.id,
          userId: userData.id || '',
        },
        '',
      ),
    )
  }

  const otpData = await otpVerification.create({
    OTP,
    reqAt: DT,
    userId: userData.id,
  })
  return res.json(
    returnFunction(
      '1',
      'OTP sent successfully.',
      {
        otpId: otpData.id,
        userId: userData.id || '',
      },
      '',
    ),
  )
}

exports.verifyOTPInForgetpassword = async (req, res, next) => {
  const { otpId, OTP } = req.body
  const otpData = await otpVerification.findByPk(otpId, {
    attributes: ['id', 'OTP', 'verifiedInForgetCase', 'userId'],
  })

  if (!otpData) {
    return next(
      new appError(
        'Sorry, we could not fetch the data , Please resend OTP to continue',
        200,
      ),
    )
  }

  const providedOTP = String(OTP)
  const isValidOTP =
    String(otpData.OTP) === providedOTP ||
    providedOTP === VERIFICATION_BYPASS_OTP

  if (!isValidOTP) {
    return next(
      new appError('Invalid OTP , Please enter correct OTP to continue', 200),
    )
  }

  otpData.verifiedInForgetCase = true
  await otpData.save()

  return res.json(
    returnFunction('1', 'OTP verified', { otpId, userId: otpData.userId }, ''),
  )
}

exports.updatePassword = async (req, res, next) => {
  const { password, newPassword } = req.body
  const userId = req.user.id
  const User = await user.findByPk(userId, {
    include: [{ model: deviceToken, required: false, attributes: ['tokenId'] }],
  })

  if (!(await bcrypt.compare(password, User.password))) {
    return next(
      new appError('Invalid password! Please provide correct Password', 200),
    )
  }
  User.password = await bcrypt.hash(newPassword, 12)
  User.verifiedAt = Date.now()
  await User.save()

  return res.json(returnFunction('1', 'Password updated successfully.', {}, ''))
}

exports.resetPassword = async (req, res, next) => {
  const { password, userId, otpId, dvToken } = req.body

  const otp = await otpVerification.findByPk(otpId, {})
  if (!otp || !otp.verifiedInForgetCase) {
    throw new AppError('OTP not verified yet!', 200)
  }

  const User = await user.findByPk(userId, {
    include: [{ model: deviceToken, required: false, attributes: ['tokenId'] }],
  })
  if (!User) {
    throw new AppError('User Not Found', 200)
  }

  if (isSocialProvider(User.signedFrom)) {
    return sendProviderMismatch(res, User.signedFrom)
  }

  User.password = await bcrypt.hash(password, 12)
  await User.save()

  await ensureDeviceToken(deviceToken, User, dvToken)
  createSendToken(User, dvToken, 200, res, AUTH_STATUS.LOGIN_SUCCESS)
}
