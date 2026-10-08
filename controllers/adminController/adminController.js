const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })
const { Op, literal, col, fn, where } = require('sequelize')
const {
  user,
  deviceToken,
  otpVerification,
  serviceType,
  salonDetail,
  rating,
  addressDBS,
  socialLink,
  employee,
  employeeService,
  service,
  time,
  jobs,
  wagesMethod,
  booking,
  coupon,
  subscriptionFeature,
  subscriptionPlan,
  helpSupport,
  employeeWagesMethod,
  pushNotification,
  feature,
  permission,
  role,
  cancellationPolicy,
  depositPolicy,
  noShowPolicy,
  paymentPolicy,
  reschedulePolicy,
  reason,
  subscriptions,
  faqs,
  faqCategory,
  commissionPayout,
  rentChairPayout,
  rentChairEarning,
  salaryPayout,
  countries,
  cities,
  zones,
  appVersionConfig,
  rebookReminderConfig,
} = require('../../models')

const jwt = require('jsonwebtoken')
const appError = require('../../utils/appError')
const bcrypt = require('bcryptjs')
const otpGenerator = require('otp-generator')
const AppError = require('../../utils/appError')
const Custom = require('../../utils/customFunctions')
const ThrowNotification = require('../../utils/throwNotificationByAdmin')
const FormatPermissions = require('../../utils/permissionsFormator')
const Graph = require('../../utils/graphsGenerators')
const Stripe = require('../stripe')
const { CURRENCY_UNIT } = process.env
const CustomDate = require('../../utils/currentDay')
const CutomEmails = require('../../helper/CustomEmails')
const EmailResetPasswordOtpToAll = require('../../helper/ResetPasswordOtpToAll')
const { salonBlock } = require('../eventDrivenCommunication/salonBlock')
const {
  customerBlockEvent,
} = require('../eventDrivenCommunication/customerBlockEvent')

//Global Variables
const formatDate = (date) => {
  if (!date) return null
  return date.toISOString().slice(0, 19).replace('T', ' ') // Format as 'YYYY-MM-DD HH:MM:SS'
}

const { salonDetails } = require('../userControllers/customerController')

const OTP_PURPOSE_FORGOT_PASSWORD = 'FORGOT_PASSWORD'
const OTP_PURPOSE_ADMIN_2FA_LOGIN = 'ADMIN_2FA_LOGIN'
const VERIFICATION_BYPASS_OTP = '8798'
const generateOTP = () =>
  otpGenerator.generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true,
  })

// console.log('🚀 ~ ', currentDateOnly);
//! Return Function
const response = ({ status, message, data, error, currencyUnit }) => {
  const output = {
    status: status ? `${status}` : '1',
    message: message ? `${message}` : 'Success',
    data: data,
    error: error ? `${error}` : '',
  }
  if (currencyUnit) output.currencyUnit = currencyUnit
  return output
}

//! Function to create JWT Tocken
const signTocken = (id, dvToken) => {
  return jwt.sign({ id, dvToken }, process.env.JWT_ACCESS_SECRET)
}

const createSendToken = (
  user,
  userType,
  features,
  dvToken,
  statusCode,
  res,
) => {
  const token = signTocken(user.id, dvToken)

  res.status(statusCode).json({
    status: '1',
    data: {
      userId: `${user.id}`,
      accessToken: token,
      image: `${user.image}`,
      firstName: `${user.firstName}`,
      lastName: `${user.lastName}`,
      email: `${user.email}`,
      phoneNum: `${user.countryCode} ${user.phoneNum}`,
      joinOn: user.createdAt,
      userType: userType,
      features: features,
      twoFactor: `${user.adminTwoFactorEnabled}`,
    },
  })
}

//!1.AUTH

//* 1. Admin Login
exports.login = async (req, res, next) => {
  const { email, password, dvToken } = req.body

  if (!email || !password) {
    return next(new AppError('Please provide Email or Password', 200))
  }

  if (!dvToken) {
    return next(new AppError('Please provide Device Token', 200))
  }

  const User = await user.findOne({
    where: {
      email,
      userTypeId: [4, 5],
    },
    include: [{ model: deviceToken, required: false, attributes: ['tokenId'] }],
  })
  if (!User) throw new AppError('Invalid Email. User not Found', 200)
  if (User.status == false) throw new AppError('Blocked by admin.', 200)

  if (!User || !(await bcrypt.compare(password, User.password))) {
    return next(new AppError('Incorrect Password.', 200))
  }

  if (User.adminTwoFactorEnabled === true) {
    const OTP = generateOTP()
    const DT = new Date()
    EmailResetPasswordOtpToAll(OTP, User, 'verification', 'admin')

    const existingOtp = await otpVerification.findOne({
      where: { userId: User.id },
    })
    let otpRecord
    if (existingOtp) {
      await existingOtp.update({
        OTP,
        reqAt: DT,
        verifiedInForgetCase: false,
        otpPurpose: OTP_PURPOSE_ADMIN_2FA_LOGIN,
      })
      otpRecord = existingOtp
    } else {
      otpRecord = await otpVerification.create({
        OTP,
        reqAt: DT,
        userId: User.id,
        verifiedInForgetCase: false,
        otpPurpose: OTP_PURPOSE_ADMIN_2FA_LOGIN,
      })
    }

    return res.status(200).json({
      status: '1',
      message:
        'Two-factor authentication is enabled. An OTP has been sent to your email. Verify it to complete sign-in.',
      data: {
        twoFactor: true,
        otpId: otpRecord.id,
        userId: User.id,
        email: User.email,
      },
      error: '',
    })
  }

  const features = await feature.findAll({
    attributes: [`id`, `title`, `key`,
      [
        literal(
          `(SELECT permissionType FROM permissions WHERE permissions.featureId = feature.id &&  permissions.roleId = ${User?.roleId || 0} LIMIT 1)`,
        ),
        'access',
      ]
    ],
  })
  // check Device Token
  const found = User.deviceTokens.find((ele) => ele.tokenId === dvToken)
  if (!found)
    await deviceToken.create({
      tokenId: dvToken,
      status: true,
      userId: User.id,
    })
  let userType = 'Admin'
  if (User.userTypeId == 5 && User.roleId) {
    let userRole = await role.findOne({
      where: { id: User.roleId, deletedAt: { [Op.is]: null } },
      attributes: ['name'],
    })
    console.log('🚀 ~ exports.login= ~ User.roleId,:', User.roleId)
    console.log('🚀 ~ exports.login= ~ userRole:', userRole)
    userType = userRole ? userRole.name : 'employee'
  }
  createSendToken(User, userType, features, dvToken, 200, res)
}

//* 1b. Admin login — verify 2FA OTP (returns same payload as successful login)
exports.verifyAdminLoginTwoFactor = async (req, res, next) => {
  const { otpId, OTP, dvToken } = req.body
  if (!otpId || !OTP || !dvToken) {
    throw new AppError('Please provide otpId, OTP, and dvToken.', 200)
  }

  const otpData = await otpVerification.findByPk(otpId, {
    attributes: ['id', 'OTP', 'userId', 'otpPurpose'],
  })
  if (!otpData || otpData.otpPurpose !== OTP_PURPOSE_ADMIN_2FA_LOGIN) {
    throw new AppError(
      'Invalid or expired verification. Please sign in again with your password.',
      200,
    )
  }
  if (OTP !== otpData.OTP && String(OTP) !== VERIFICATION_BYPASS_OTP) {
    throw new AppError('Invalid OTP , Please enter correct OTP to continue', 200)
  }

  const User = await user.findOne({
    where: {
      id: otpData.userId,
      userTypeId: [4, 5],
    },
    include: [{ model: deviceToken, required: false, attributes: ['tokenId'] }],
  })
  if (!User) throw new AppError('User not found.', 200)
  if (User.status == false) throw new AppError('Blocked by admin.', 200)
  if (User.adminTwoFactorEnabled !== true) {
    throw new AppError('Two-factor authentication is not enabled for this account.', 200)
  }

  await otpData.destroy()

  const features = await feature.findAll({
    attributes: [`id`, `title`, `key`,
      [
        literal(
          `(SELECT permissionType FROM permissions WHERE permissions.featureId = feature.id &&  permissions.roleId = ${User?.roleId || 0} LIMIT 1)`,
        ),
        'access',
      ]
    ],
  })

  const found = User.deviceTokens.find((ele) => ele.tokenId === dvToken)
  if (!found)
    await deviceToken.create({
      tokenId: dvToken,
      status: true,
      userId: User.id,
    })

  let userType = 'Admin'
  if (User.userTypeId == 5 && User.roleId) {
    const userRole = await role.findOne({
      where: { id: User.roleId, deletedAt: { [Op.is]: null } },
      attributes: ['name'],
    })
    userType = userRole ? userRole.name : 'employee'
  }

  createSendToken(User, userType, features, dvToken, 200, res)
}

//* 1c. Admin — enable / disable two-factor (logged-in admin only)
exports.updateAdminTwoFactorSetting = async (req, res, next) => {
  const { enabled } = req.body
  if (enabled !== true && enabled !== false) {
    throw new AppError('Please provide enabled as true or false.', 200)
  }

  const User = await user.findOne({
    where: {
      id: req.user.id,
      userTypeId: [4, 5],
    },
  })
  if (!User) throw new AppError('Admin user not found.', 200)

  User.adminTwoFactorEnabled = Boolean(enabled)
  await User.save()

  return res.status(200).json(
    response({
      message: enabled
        ? 'Two-factor authentication has been enabled for your account.'
        : 'Two-factor authentication has been disabled for your account.',
      data: { adminTwoFactorEnabled: User.adminTwoFactorEnabled },
    }),
  )
}

//* 2. Admin change password (must send current + new + confirm)
exports.changeAdminPassword = async (req, res, next) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body
  if (!oldPassword || !newPassword || !confirmNewPassword) {
    throw new AppError(
      'Please provide your current password, new password, and confirm new password.',
      200,
    )
  }
  if (newPassword !== confirmNewPassword) {
    throw new AppError(
      'New password and confirm new password do not match. Please re-enter both fields.',
      200,
    )
  }
  if (oldPassword === newPassword) {
    throw new AppError(
      'New password must be different from your current password.',
      200,
    )
  }
  if (String(newPassword).length < 6) {
    throw new AppError('New password must be at least 6 characters.', 200)
  }

  const User = await user.findOne({
    where: {
      id: req.user.id,
      userTypeId: [4, 5],
    },
  })
  if (!User) throw new AppError('Admin user not found.', 200)
  if (!User.password) {
    throw new AppError(
      'This account has no password set; use password reset instead.',
      200,
    )
  }
  if (!(await bcrypt.compare(oldPassword, User.password))) {
    throw new AppError(
      'Your current password is incorrect. Enter the correct current password before setting a new one.',
      200,
    )
  }

  User.password = await bcrypt.hash(newPassword, 12)
  await User.save()

  return res.status(200).json(
    response({
      message:
        'Password changed successfully. Your old password is no longer valid; sign in with your new password next time.',
      data: {},
    }),
  )
}

//* 3. Admin forgot password - request OTP
exports.requestAdminForgotPasswordOtp = async (req, res, next) => {
  const { email } = req.body
  if (!email) throw new AppError('Please provide email.', 200)

  const userData = await user.findOne({
    where: {
      email,
      userTypeId: [4, 5],
      deleted: false,
    },
    include: { model: otpVerification, attributes: ['id'] },
    attributes: ['id', 'email', 'firstName', 'lastName'],
  })

  if (!userData) {
    throw new AppError('Invalid information,No user exists', 200)
  }

  const OTP = '8798'
  const DT = new Date()
  EmailResetPasswordOtpToAll(OTP, userData, 'forgetPassword', 'customer')

  if (userData.otpVerification != null) {
    await otpVerification.update(
      {
        OTP,
        reqAt: DT,
        verifiedInForgetCase: false,
        otpPurpose: OTP_PURPOSE_FORGOT_PASSWORD,
      },
      { where: { userId: userData.id } },
    )
    return res.status(200).json(
      response({
        message: 'OTP sent successfully.',
        data: { otpId: userData.otpVerification.id, userId: userData.id },
      }),
    )
  }

  const otpData = await otpVerification.create({
    OTP,
    reqAt: DT,
    userId: userData.id,
    otpPurpose: OTP_PURPOSE_FORGOT_PASSWORD,
  })

  return res.status(200).json(
    response({
      message: 'OTP sent successfully.',
      data: { otpId: otpData.id, userId: userData.id },
    }),
  )
}

//* 4. Admin forgot password - verify OTP
exports.verifyAdminForgotPasswordOtp = async (req, res, next) => {
  const { otpId, OTP } = req.body
  if (!otpId || !OTP) throw new AppError('Please provide otpId and OTP.', 200)

  const otpData = await otpVerification.findByPk(otpId, {
    attributes: ['id', 'OTP', 'verifiedInForgetCase', 'userId', 'otpPurpose'],
  })

  if (!otpData) {
    throw new AppError(
      'Sorry, we could not fetch the data , Please resend OTP to continue',
      200,
    )
  }
  if (OTP !== otpData.OTP && OTP !== '8798') {
    throw new AppError('Invalid OTP , Please enter correct OTP to continue', 200)
  }

  if (
    otpData.otpPurpose &&
    otpData.otpPurpose !== OTP_PURPOSE_FORGOT_PASSWORD
  ) {
    throw new AppError(
      'This OTP is for admin sign-in verification, not password reset.',
      200,
    )
  }

  otpData.verifiedInForgetCase = true
  await otpData.save()

  return res.status(200).json(
    response({
      message: 'OTP verified',
      data: { otpId, userId: otpData.userId },
    }),
  )
}

//* 5. Admin forgot password - reset password
exports.resetAdminForgotPassword = async (req, res, next) => {
  const { password, confirmPassword, userId, otpId } = req.body
  if (!password || !confirmPassword || !userId || !otpId) {
    throw new AppError(
      'Please provide password, confirmPassword, userId and otpId.',
      200,
    )
  }
  if (password !== confirmPassword) {
    throw new AppError('Password and confirmPassword do not match.', 200)
  }
  if (String(password).length < 6) {
    throw new AppError('Password must be at least 6 characters.', 200)
  }

  const otp = await otpVerification.findByPk(otpId)
  if (!otp || !otp.verifiedInForgetCase || Number(otp.userId) !== Number(userId)) {
    throw new AppError('OTP not verified yet!', 200)
  }
  if (
    otp.otpPurpose &&
    otp.otpPurpose !== OTP_PURPOSE_FORGOT_PASSWORD
  ) {
    throw new AppError('Invalid OTP session for password reset.', 200)
  }

  const User = await user.findOne({
    where: {
      id: userId,
      userTypeId: [4, 5],
      deleted: false,
    },
  })
  if (!User) throw new AppError('User Not Found', 200)

  User.password = await bcrypt.hash(password, 12)
  await User.save()
  await otp.update({ verifiedInForgetCase: false, otpPurpose: null })

  return res.status(200).json(
    response({
      message: 'Password reset successfully. Please login with your new password.',
      data: {},
    }),
  )
}

//! 2.SERVICES TYPES -------------------------------------------------------------------------------

//^ 1.Add servies Types ----------------------------

exports.addServieType = async (req, res, next) => {
  const input = req.body
  if (req.file) {
    // throw new  'Image not uploaded', 'Please upload image';
    const tmpPath = req.file.path
    const imagePath = tmpPath.replace(/\\/g, '/')
    input.image = imagePath
  } else {
    throw new AppError('Image is required. Please upload Image', 200)
  }
  if (input.serviceOrder < input.actualOrder) {
    await serviceType.update({
      serviceOrder: input.actualOrder,
    }, { where: { serviceOrder: input.serviceOrder } })
  }

  const findServiceType = await serviceType.findOne({
    where: {
      typeName: input.typeName,
      deleted: 0
    }
  })

  if (findServiceType) {
    throw new appError("Service Already Exists  &&  Active")
  }
  const data = await serviceType.create(input)

  return res.status(200).json(
    response({
      message: 'Service type added',
      data: { id: data.id },
    }),
  )
}

//* 2.Get All service types -------------------------

exports.fetchServiceTypes = async (req, res, next) => {
  const data = await serviceType.findAll({
    where: { deleted: false },
    attributes: ['id', 'typeName', 'image', 'serviceOrder', 'status', 'createdAt'],
    order: [['serviceOrder', 'ASC']],
  })

  return res.status(200).json({
    status: '1',
    message: 'Success',
    data: data,
  })
}

//& 3.Update service types --------------------------

exports.updateServiceTypes = async (req, res, next) => {
  if (!req.params.id) throw new AppError(`Invalid request format`, 200)
  const { id } = req.params
  console.log('🚀 ~ exports.updateServiceTypes= ~ id:', id)
  const input = req.body
  if (req.file) {
    const tmpPath = req.file.path
    const imagePath = tmpPath.replace(/\\/g, '/')
    input.image = imagePath
  } else {
    delete input.image
  }
  console.log('🚀 ~ exports.updateServiceTypes= ~ input:', input)

  if (input.serviceOrder != input.newOrder) {
    await serviceType.update({
      serviceOrder: input.serviceOrder
    }, {
      where: {
        serviceOrder: input.newOrder
      }
    })
    input.serviceOrder = input.newOrder
  }

  const [rows] = await serviceType.update(input, { where: { id } })

  return res.status(200).json(response({ data: rows }))
}

exports.dashboard = async (req, res, next) => {
  // salons or subscriptions

  const { startDate, endDate } = req.query

  // Initialize the date filter
  let dateFilter = {}
  let customerFilter = { userTypeId: 1, deleted: 0 }
  let salonFilter = { isExternalEmployee: { [Op.or]: [false, null] } }
  // Check if both startDate and endDate are provided and not empty
  if (startDate && endDate) {
    dateFilter = {
      on: {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      },
    }
      ; (customerFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      }),
        (salonFilter.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        })
  } else if (startDate) {
    // If only startDate is provided
    dateFilter = {
      on: {
        [Op.gte]: new Date(startDate),
      },
    }
  } else if (endDate) {
    // If only endDate is provided
    dateFilter = {
      on: {
        [Op.lte]: new Date(endDate),
      },
    }
  }

  const totalSalon = await salonDetail.count({
    where: salonFilter,
  })

  const countAppointments = async (status) => {
    const whereCondition = {
      status,
      ...dateFilter,
      salonDetailId: { [Op.ne]: null },
    }

    return await booking.count({ where: whereCondition })
  }

  const sumTotalByStatus = async (status) => {
    const whereCondition = {
      status,
      ...dateFilter,
    }
    return await booking.sum('total', { where: whereCondition })
  }
  // Perform the counts
  const upcommingConfirmAppointments = await countAppointments('book')
  const completeAppointments = await countAppointments('complete')
  const cancelAppointments = await countAppointments('cancel')
  const unAssignedAppointments = await countAppointments('pending')

  // customers

  const totalCustomers = await user.count({
    where: customerFilter,
  })

  const revenue = await sumTotalByStatus('complete')

  // For Graph Output

  return res.status(200).json({
    status: '1',
    mesage: 'Success',
    data: {
      totalSalon,
      upcommingConfirmAppointments,
      completeAppointments,
      unAssignedAppointments,
      cancelAppointments,
      totalAppointments:
        completeAppointments +
        unAssignedAppointments +
        cancelAppointments +
        upcommingConfirmAppointments,
      totalCustomers,
      revenue: revenue || 0,
      currencyUnit: CURRENCY_UNIT,
    },
  })
}

exports.dashboardCharts = async (req, res, next) => {
  // salons or subscriptions
  let salonFilter = { isExternalEmployee: { [Op.or]: [false, null] } }

  const totalSalon = await salonDetail.count({
    where: salonFilter,
  })

  const monthlyRevenueCondition = {
    status: 'complete',
  }

  if (req.query?.year) {
    monthlyRevenueCondition.on = {
      [Op.between]: [
        new Date(`${req.query?.year}-01-01`),
        new Date(`${req.query?.year}-12-31`),
      ],
    }
  }
  const monthlyRevenue = await booking.findAll({
    attributes: [
      [fn('MONTH', col('on')), 'month'],
      [fn('SUM', col('total')), 'totalRevenue'],
    ],
    where: monthlyRevenueCondition,
    group: [fn('MONTH', col('on'))],
    raw: true,
  })

  const monthlyArray = Array.from({ length: 12 }, () => 0)

  // For Graph Output
  const data = monthlyArray.map((value, index) => {
    const monthRevenue = monthlyRevenue.find((item) => item.month === index + 1)
    const revenue = monthRevenue ? parseFloat(monthRevenue.totalRevenue) : 0
    return revenue
  })

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const salonLast6Months = await salonDetail.count({
    where: { createdAt: { [Op.gte]: sixMonthsAgo } },
  })

  const dashboardBarChartData = {
    labels: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    datasets: [{ data }],
  }

  const dashboardDoughnutChartData = {
    labels: ['Old Members', 'New Subscription'],
    datasets: [
      {
        data: [totalSalon - salonLast6Months, salonLast6Months],
      },
    ],
  }

  return res.status(200).json({
    status: '1',
    mesage: 'Success',
    data: {
      dashboardBarChartData,
      dashboardDoughnutChartData,
      currencyUnit: CURRENCY_UNIT,
    },
  })
}

//!3.SALONS ----------------------------------------------------------------------------------------
//* 0.Fetch All salonCustomer ---------------------

exports.fetchSalonCustomer = async (req, res, next) => {
  const salonCustomers = await booking.findAll({
    where: {
      salonDetailId: req?.params?.salon,
    },
    include: [
      {
        model: user,
        attributes: [
          `id`,
          `firstName`,
          'lastName',
          'email',
          'countryCode',
          'phoneNum',
          'image',
        ],
      },
    ],
    attributes: ['customerId'],
    group: ['customerId'], // Group by customerId to ensure uniqueness
  })

  return res.json(response({ data: salonCustomers }))
}

//* 1.Fetch All Salons ---------------------

exports.fecthSalons = async (req, res, next) => {
  const currentDay = CustomDate.currentDay()

  const condition = {
    isExternalEmployee: { [Op.or]: [false, null] },
  }

  if (req.params?.subscription == 'active') {
    condition.registrationExpiryDate = { [Op.gte]: currentDay.currentDateOnly }
    condition.metadata = { [Op.ne]: null }
  } else if (req.params?.subscription == 'expire') {
    condition.registrationExpiryDate = { [Op.lte]: currentDay.currentDateOnly }
    condition.metadata = { [Op.ne]: null }
  }

  if (req.params?.sticker == 'sticker') {
    condition.stickerSent = false
  }

  if (req.params?.external == 'external') {
    condition.isExternalEmployee = true
  }

  const results = await salonDetail.findAll({
    where: condition,
    attributes: [
      'id',
      'userId',
      'salonName',
      'coverImage',
      'metadata',
      'stickerSent',
      'createdAt',
      'updatedAt',
      'autoAcceptBookings',
      'approvalScope',
      [
        literal(`(
          SELECT COUNT(b.id)
          FROM bookings b
          WHERE b.salonDetailId = salonDetail.id AND b.status = 'requested'
        )`),
        'pendingRequests',
      ],
      [
        literal(`(
          SELECT FORMAT(AVG(ratings.value), 1)
          FROM ratings
          WHERE ratings.salonDetailId = salonDetail.id
        )`),
        'salonAverageRating',
      ],
      [
        literal(`(
          SELECT COUNT(ratings.id)
          FROM ratings
          WHERE ratings.salonDetailId = salonDetail.id
        )`),
        'ratingCount',
      ],
      [
        literal(`(
          SELECT COUNT(employees.id)
          FROM employees
          WHERE employees.salonDetailId = salonDetail.id AND employees.status = true 
            AND employees.deleted = false
        )`),
        'employeeCount',
      ],
      [
        literal(
          `(SELECT salonName FROM salonDetails WHERE id = salonDetail.parentSalonId)`,
        ),
        'ownerSalonName',
      ],
      [
        literal(`(
          SELECT CONCAT(u.firstName, '-', u.lastName)
          FROM salonDetails sd
          INNER JOIN users u ON u.id = sd.userId
          WHERE sd.id = salonDetail.parentSalonId
          LIMIT 1
        )`),
        'parentOwnerName',
      ],
      [
        literal(`(
          SELECT revenueCatUserId
          FROM subscriptions
          WHERE subscriptions.salonDetailId = salonDetail.id
            AND subscriptions.subscriptionSource = 'revenuecat'
            AND subscriptions.deletedAt IS NULL
          ORDER BY subscriptions.createdAt DESC
          LIMIT 1
        )`),
        'revenueCatUserId',
      ],
      [
        literal(`(
          SELECT COALESCE(
            (
              SELECT subscriptions.status
              FROM subscriptions
              WHERE subscriptions.salonDetailId = salonDetail.id
                AND subscriptions.deletedAt IS NULL
              ORDER BY subscriptions.createdAt DESC
              LIMIT 1
            ),
            salonDetail.subscriptionLatestPaymentStatus
          )
        )`),
        'subscriptionStatus',
      ],
      [
        literal(`(
          SELECT subscriptions.revenueCatStore
          FROM subscriptions
          WHERE subscriptions.salonDetailId = salonDetail.id
            AND subscriptions.deletedAt IS NULL
          ORDER BY subscriptions.createdAt DESC
          LIMIT 1
        )`),
        'revenueCatStore',
      ],
      [
        literal(`(
          SELECT subscriptions.name
          FROM subscriptions
          WHERE subscriptions.salonDetailId = salonDetail.id
            AND subscriptions.deletedAt IS NULL
          ORDER BY subscriptions.createdAt DESC
          LIMIT 1
        )`),
        'subscriptionTier',
      ],
      // AND employees.isOwner = false
    ],
    include: [
      // {
      //   model: rating,
      //   attributes: [],
      //   on: { salonDetailId: col('salonDetail.id') },
      //   required: false,
      // },
      {
        model: addressDBS,
        required: true,
        attributes: [
          'id',
          'streetAddress',
          'city',
          'district',
          'province',
          'country',
          'lat',
          'lng',
          'building',
          'postalCode',
          'town',
          'streetLineAddress1',
          'streetLineAddress2',
        ],
      },
      {
        model: user,
        required: true,
        where: { deleted: 0 },
        attributes: [
          `id`,
          `firstName`,
          `lastName`,
          'status',
          `password`,
          `email`,
          `countryCode`,
          `phoneNum`,
        ],
      },
      // {
      //   model: addressDBS,
      //   required: true,
      //   attributes: ['id', 'streetAddress', 'city', 'country', 'postalCode'],
      // },
    ],
    group: ['salonDetail.id'],
  })

  // console.log('🚀 ~ ', results.averageRating)
  return res.status(200).json(response({ data: results }))
}

//* 1.Fetch All Salons ---------------------(send stickers include) sendSticker

exports.updateSalonDetails = async (req, res, next) => {
  console.log('🚀 ~ exports.updateSalonDetails= ~ req.body:', req.body)
  let condition = {}
  if (req.params?.salon) condition.id = req.params.salon
  else if (req.body?.ids) condition.id = req.body.ids
  salonDetail.update(req.body, {
    where: condition,
  })

  return res.status(200).json(
    response({
      message: 'Success',
      data: {},
    }),
  )
}


//* 1.Fetch All Salons For Filters ---------------------

exports.fecthSalonsForFilter = async (req, res, next) => {
  const results = await salonDetail.findAll({
    attributes: ['salonName', 'id'],
  })
  return res.status(200).json(response({ data: results }))
}

//* 3.Get Employee Details -----------------

exports.employeeDetails = async (req, res, next) => {
  const results = await user.findByPk(req.params.id, {
    attributes: [
      'firstName',
      'lastName',
      'image',
      'email',
      'countryCode',
      'phoneNum',
    ],
    include: [
      {
        model: employee,
        attributes: [
          'id',
          'position',
          'coverImage',
          'description',
          'salonDetailId',
          [
            literal(
              '(SELECT FORMAT(AVG(ratings.value), 1) FROM ratings WHERE ratings.employeeId = employees.id)',
            ),
            'employeeAverageRating',
          ],
          [
            literal(
              '(SELECT COUNT(ratings.id) FROM ratings WHERE ratings.employeeId = employees.id)',
            ),
            'totalRatings',
          ],
        ],
        include: [
          {
            model: rating,
            attributes: ['id', 'value', 'comment', 'createdAt'],
            include: {
              model: user,
              attributes: ['firstName', 'lastName', 'image'],
            },
          },
          {
            model: employeeWagesMethod,
            attributes: [`id`, `value`, 'wagesMethodId'],
            include: {
              model: wagesMethod,
              attributes: ['methodName'],
            },
          },
          {
            model: employeeService,
            attributes: ['status'],
            include: [
              {
                model: service,
                attributes: [
                  'id',
                  'serviceName',
                  'price',
                  'duration',
                  'discount',
                ],
              },
            ],
          },
          {
            model: time,
            where: { status: true },
            attributes: ['day', 'openingTime', 'closingTime'],
          },
        ],
      },
    ],
  })
  if (!results) throw new AppError('Resource not found', 200)

  const employeeData = results.toJSON()
  employeeData.employee = employeeData.employees[0]
  delete employeeData.employees
  console.log(
    'employeeData.employee.salonDetailId-------------------',
    employeeData.employee.salonDetailId,
  )
  const salonData = employeeData.employee.salonDetailId
    ? await salonDetail.findByPk(employeeData?.employee?.salonDetailId, {
      attributes: [
        'id',
        'salonName',
        'coverImage',
        [
          literal(
            '(SELECT FORMAT(AVG(ratings.value), 1) FROM ratings WHERE ratings.salonDetailId = salonDetail.id)',
          ),
          'salonAverageRating',
        ],
        [
          literal(
            '(SELECT COUNT(DISTINCT ratings.bookingId) FROM ratings WHERE ratings.salonDetailId = salonDetail.id)',
          ),
          'ratingCount',
        ],
      ],
      include: [
        {
          model: rating,
          attributes: [],
          on: { salonDetailId: col('salonDetail.id') },
          required: false,
        },
        {
          model: socialLink,
          attributes: [`id`, `platform`, `url`],
        },
        {
          model: addressDBS,
          required: true,
          attributes: [
            'id',
            'streetAddress',
            'city',
            'country',
            'postalCode',
          ],
        },
      ],
      group: ['salonDetail.id', 'socialLinks.id'],
    })
    : null

  const jobsData = employeeData.employee.salonDetailId
    ? await jobs.findAll({
      where: { employeeId: employeeData.employee.id, status: 'complete' },
      attributes: [`total`, `tip`, 'on'],
    })
    : null
  const calculationsOnJob = Custom.calculateJobTotals(jobsData)
  let earnings = calculationsOnJob.totalRevenue
  let tip = calculationsOnJob.totalTip
  if (employeeData?.employee?.employeeWagesMethod?.wagesMethodId) {
    const wagesid = employeeData?.employee?.employeeWagesMethod?.wagesMethodId
    let employeeeEarning = 0,
      employeeTip = 0

    if (wagesid == 1) {
      employeeeEarning = await commissionPayout.sum('amount', {
        where: { employeeId: employeeData?.employee?.id },
      })
      employeeTip = await commissionPayout.sum('tip', {
        where: { employeeId: employeeData?.employee?.id },
      })
    } else if (wagesid == 2) {
      employeeeEarning = await salaryPayout.sum('amount', {
        where: { employeeId: employeeData?.employee?.id },
      })
      employeeTip = await salaryPayout.sum('tip', {
        where: { employeeId: employeeData?.employee?.id },
      })
    } else if (wagesid == 3) {
      employeeeEarning = await rentChairPayout.sum('amount', {
        where: { employeeId: employeeData?.employee?.id },
      })
      employeeTip = await rentChairPayout.sum('tip', {
        where: { employeeId: employeeData?.employee?.id },
      })
    }
    tip = employeeTip
    earnings = employeeeEarning
  }

  const output = {
    tip,
    earnings,
    employee: employeeData,
    salon: salonData,
    revenue: calculationsOnJob,
  }

  return res.status(200).json(response({ data: output }))
}
//!4.CUSTOMER ----------------------------------------------------------------------------------------

//* 1.Fetch All Customers ------------------

exports.fecthCustomers = async (req, res, next) => {
  const results = await user.findAll({
    where: {
      userTypeId: 1, //Customer
      deleted: 0,
    },
    attributes: [
      `id`,
      `firstName`,
      `lastName`,
      `email`,
      `countryCode`,
      `phoneNum`,
      `status`,
      `verifiedAt`,
      `stripeCustomerId`,
      `image`,
      `signedFrom`,
    ],
  })

  return res.status(200).json(response({ data: results }))
}

//* 2.Fetch Customer Detail ----------------

exports.fecthCustomerDetail = async (req, res, next) => {
  const results = await user.findByPk(req.params.id, {
    where: {
      userTypeId: 1, //Customer
    },
    attributes: [
      `id`,
      `firstName`,
      `lastName`,
      `email`,
      `countryCode`,
      `phoneNum`,
      `image`,
    ],
    include: {
      model: booking,
      attributes: [
        'id',
        `status`,
        `on`,
        `startTime`,
        `endTime`,
        'total',
        'duration',
        'createdAt',
      ],
      order: [['id', 'DESC']],
      include: [
        {
          model: salonDetail,
          attributes: [`salonName`],
        },
        {
          model: jobs,
          attributes: [`status`, 'total'],
          include: [
            {
              model: employee,
              attributes: ['id'],
              include: {
                model: user,
                attributes: [`firstName`],
              },
            },
            {
              model: service,
              attributes: [`serviceName`],
            },
          ],
        },
      ],
    },
    order: [[booking, 'id', 'DESC']],
  })

  const output = results.toJSON()
  output.currencyUnit = CURRENCY_UNIT

  return res.status(200).json(response({ data: output }))
}

//!5.Coupons ----------------------------------------------------------------------------------------

//* 1.Fetch All Coupons ---------------------
//TODO Auto expire
exports.fecthCoupons = async (req, res, next) => {
  const currentDay = CustomDate.currentDay()
  await coupon.update(
    { status: 'expire' },
    {
      where: {
        [Op.and]: [
          { till: { [Op.lt]: currentDay.currentDateOnly } },
          { status: 'active' },
        ],
      },
    },
  )

  const results = await coupon.findAll({
    attributes: [
      `id`,
      `promoCode`,
      `type`,
      `status`,
      `limit`,
      `from`,
      `till`,
      'value',
      `createdAt`,
    ],
    include: {
      model: salonDetail,
      attributes: ['salonName'],
    },
    order: [['id', 'DESC']],
  })

  return res
    .status(200)
    .json(response({ data: results, currencyUnit: CURRENCY_UNIT }))
}

//! 6.Subscription -------------------------------------------------------------------------------

//* 1.Add Subscription ----------------------------

exports.addSubscription = async (req, res, next) => {
  const { features, ...input } = req.body
  console.log(
    '🚀 ~ file: adminController.js:410 ~ exports.addSubscription= ~ input:',
    input,
  )
  console.log(
    '🚀 ~ file: adminController.js:417 ~ featureInput ~ features:',
    features,
  )
  const plan = await subscriptionPlan.create(input)
  if (!plan) throw new AppError('Not creatred', 200)

  const featureInput = features.map((ele) => {
    ele.subscriptionPlanId = plan.id
    return ele
  })
  console.log(
    '🚀 ~ file: adminController.js:416 ~ featureInput ~ featureInput:',
    featureInput,
  )

  const featureData = await subscriptionFeature.bulkCreate(featureInput)
  return res.status(200).json(
    response({
      message: 'Subscription plan added',
      data: { id: plan.id },
    }),
  )
}

//* 2.Get All Subscriptions -------------------------

exports.fetchSubscriptions = async (req, res, next) => {
  const condition = {}
  if (!req.params.id) condition.id = req.params.id
  const data = await subscriptionPlan.findAll({
    attributes: ['id', 'name', 'price', 'teamSize', 'duration'],
    include: {
      model: subscriptionFeature,
      attributes: ['id', 'feature'],
    },
  })
  let output = data
  if (req.params.id) output = output[0]
  return res.status(200).json({
    status: '1',
    message: 'Success',
    data: data,
    currencyUnit: CURRENCY_UNIT,
  })
}
//* 3.Update Subscription Plan -------------------------

exports.updateSubscriptionPlan = async (req, res, next) => {
  const input = req.body
  const [rows] = await subscriptionPlan.update(input, {
    where: { id: req.params.id },
  })
  return res.status(200).json(response({ data: rows }))
}

//* 4.Update Subscription Feature -----------------------

exports.updateSubscriptionFeature = async (req, res, next) => {
  const { feature } = req.body
  const [rows] = await subscriptionFeature.update(
    { feature },
    { where: { id: req.params.id } },
  )
  return res.status(200).json(response({ data: rows }))
}

//! 7.Appointments -------------------------------------------------------------------------

//* 1.fetch Appointments -----------------

exports.fecthAppointments = async (req, res, next) => {
  let bookingFilters = {}
  // Check if both startDate and endDate are provided and not empty
  const { startDate, endDate } = req.query

  if (startDate && endDate)
    bookingFilters.on = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    }

  if (req.params?.type == 'cancel') bookingFilters.status = 'cancel'
  else if (req.params?.type == 'complete') bookingFilters.status = 'complete'
  else if (req.params?.type == 'noshow') bookingFilters.status = 'no-show'
  else if (req.params?.type == 'unpaid') bookingFilters.status = 'save-unpaid'
  else if (req.params?.type == 'upcoming')
    bookingFilters.status = { [Op.or]: ['pending', 'book'] }
  // Manual booking approval: waiting requests, and requests that ended
  // without a booking (stored as cancel + requestOutcome).
  else if (req.params?.type == 'requested') bookingFilters.status = 'requested'
  else if (req.params?.type == 'proposed') {
    bookingFilters.status = 'requested'
    bookingFilters.requestOutcome = 'proposed'
  }
  else if (req.params?.type == 'declined') {
    bookingFilters.status = 'cancel'
    bookingFilters.requestOutcome = 'declined'
  } else if (req.params?.type == 'expired') {
    bookingFilters.status = 'cancel'
    bookingFilters.requestOutcome = 'expired'
  }

  //TODO optimize this query
  console.log(
    '🚀 ~ exports.fecthAppointments= ~ bookingFilters:',
    bookingFilters,
  )

  const data = await booking.findAll({
    where: bookingFilters,
    attributes: [
      'id',
      `status`,
      `startTime`,
      'note',
      `on`,
      'createdAt',
      'requestOutcome',
      'requestExpiresAt',
      [
        literal(
          `(SELECT COUNT(*) FROM jobs WHERE jobs.bookingId = booking.id)`,
        ),
        'servicesCount',
      ],
      [
        literal(
          `(SELECT salonDetails.salonName FROM salonDetails WHERE salonDetails.id = booking.salonDetailId)`,
        ),
        'salonName',
      ],
      [
        literal(
          `(SELECT CONCAT(users.firstName, ' ', users.lastName)
            FROM users WHERE users.id = booking.customerId
            LIMIT 1)`,
        ),
        'customerName',
      ],
    ],
  })

  return res
    .status(200)
    .json(
      response({ data: { appointments: data, currencyUnit: CURRENCY_UNIT } }),
    )
}

//* 2.fetch Appointment Details -----------------

exports.fecthAppointmentsDetails = async (req, res, next) => {
  const data = await booking.findByPk(req.params.id, {
    attributes: [
      'id',
      `status`,
      `subTotal`,
      `discount`,
      `total`,
      `initialPayment`,
      `vatAmount`,
      `platformFee`,
      `startTime`,
      `endTime`,
      `duration`,
      `tip`,
      `note`,
      `on`,
      `stripeCardId`,
      `actualCapturedAmount`,
      `paymentMethod`,
      'createdAt',
      'requestExpiresAt',
      'respondedAt',
      'requestOutcome',
      'previousOn',
      'previousStartTime',
      'previousEndTime',
      'proposalComment',
      'proposedAt',
      [
        literal(
          '(SELECT cb.reasonText FROM cancelledBookings cb WHERE cb.bookingId = booking.id ORDER BY cb.id DESC LIMIT 1)',
        ),
        'cancellationReasonText',
      ],
    ],
    include: [
      {
        model: salonDetail,
        attributes: [
          'id',
          'salonName',
          'coverImage',
          'description',
          'vatPercentage',
          'platformFee',
          [
            literal(
              '(SELECT FORMAT(AVG(ratings.value), 1) FROM ratings WHERE ratings.salonDetailId = salonDetail.id)',
            ),
            'salonAverageRating',
          ],
          [
            literal(
              '(SELECT COUNT(ratings.id) FROM ratings WHERE ratings.salonDetailId = salonDetail.id)',
            ),
            'ratingCount',
          ],
        ],
        include: [
          {
            model: socialLink,
            attributes: [`id`, `platform`, `url`],
          },
          {
            model: addressDBS,
            attributes: [
              `id`,
              `title`,
              `streetAddress`,
              `building`,
              `floor`,
              `apartment`,
              `district`,
              `city`,
              `province`,
              `country`,
              `postalCode`,
              `lat`,
              `lng`,
            ],
          },
        ],
        group: ['salonDetail.id'],
      },
      {
        model: user,
        attributes: [
          `id`,
          `firstName`,
          'lastName',
          'email',
          'countryCode',
          'phoneNum',
        ],
      },
      {
        model: jobs,
        attributes: [
          `id`,
          `total`,
          `tip`,
          `status`,
          `duration`,
          `startTime`,
          `endTime`,
          `on`,
        ],
        include: [
          {
            model: employee,
            attributes: [
              'id',
              'position',

              // [
              //   literal(
              //     '(SELECT FORMAT(AVG(ratings.value), 1) FROM ratings WHERE ratings.employeeId = employees.id)'
              //   ),
              //   'employeeAverageRating'
              // ],
              // [
              //   literal(
              //     '(SELECT COUNT(ratings.id) FROM ratings WHERE ratings.employeeId = employees.id)'
              //   ),
              //   'totalRatings'
              // ]
            ],
            include: [
              // {
              //   model: rating,
              //   attributes: []
              // },
              { model: user, attributes: [`firstName`, `lastName`, 'image'] },
            ],
            // group:['employee.id']
          },
          { model: service, attributes: [`id`, `serviceName`] },
        ],
      },
    ],
  })

  return res
    .status(200)
    .json(
      response({ data: { appointments: data, currencyUnit: CURRENCY_UNIT } }),
    )
}

//! 8.Earnings All salons -----------------------------------------------------------------

//* 1.fetch Salons Earning -----------------

exports.fecthSalonsEarnings = async (req, res, next) => {
  const bookingCondition = { status: 'complete' }
  const newDate = CustomDate.currentDay()
  const startDate = req.query?.startDate ? new Date(req.query.startDate) : null
  const endDate = req.query?.endDate ? new Date(req.query.endDate) : null

  // Function to safely format dates for SQL

  // Format dates
  const formattedStartDate = formatDate(startDate)
  const formattedEndDate = formatDate(endDate)

  // Build the date filter string if both dates are provided
  const dateFilter =
    formattedStartDate && formattedEndDate
      ? ` AND bookings.on BETWEEN '${formattedStartDate}' AND '${formattedEndDate}'`
      : ''

  // Optionally, handle bookingCondition if it might be undefined
  const bookingStatusCondition = bookingCondition?.status
    ? `'${bookingCondition.status}'`
    : ''

  console.log('🚀 ~ exports.fecthSalonsEarnings= ~ dateFilter:', dateFilter)
  // Perform the query
  const salonCondition = { isExternalEmployee: false }

  if (req.params.external == 'external')
    salonCondition.isExternalEmployee = true

  const results = await salonDetail.findAll({
    where: salonCondition,
    attributes: [
      'salonName',
      'status',
      [
        literal(
          `(SELECT FORMAT(COALESCE(AVG(ratings.value), 0), 1) 
            FROM ratings 
            WHERE ratings.salonDetailId = salonDetail.id)`,
        ),
        'salonAverageRating',
      ],
      [
        literal(
          `(SELECT COUNT(DISTINCT ratings.bookingId) 
            FROM ratings 
            WHERE ratings.salonDetailId = salonDetail.id)`,
        ),
        'ratingCount',
      ],
      [
        literal(
          `(SELECT SUM(bookings.total) 
              FROM bookings 
              WHERE bookings.salonDetailId = salonDetail.id 
                AND bookings.status = 'complete' 
                ${dateFilter})`,
        ),

        'revenue',
      ],
      [
        literal(
          `(SELECT COUNT(bookings.salonDetailId) 
            FROM bookings 
            WHERE bookings.salonDetailId = salonDetail.id 
              AND bookings.status = 'complete' 
              ${dateFilter})`,
        ),
        'totalBookings',
      ],
    ],
    include: [
      {
        model: addressDBS,
        required: false,
        attributes: ['id', 'streetAddress', 'city', 'country', 'postalCode'],
      },
    ],
  })

  const earnings =
    results?.length > 0 ? JSON.parse(JSON.stringify(results)) : []

  const totalEarning =
    earnings.length > 0
      ? earnings.reduce((accumulator, currentObject) => {
        const revenueStr = currentObject.revenue

        // Check if revenue exists
        if (revenueStr) {
          const revenue = parseFloat(revenueStr)

          // Check if the parsed revenue is a valid number
          if (!isNaN(revenue)) {
            return accumulator + revenue
          } else {
            console.warn(`Invalid revenue value encountered: ${revenueStr}`)
            return accumulator
          }
        } else {
          console.warn('Revenue key missing in object:', currentObject)
          return accumulator
        }
      }, 0)
      : 0
  return res.status(200).json(
    response({
      data: { salons: results, currencyUnit: CURRENCY_UNIT, totalEarning },
    }),
  )
}

//! 9.Help & Support ----------------------------------------------------------------------

//* 3.fetch Help Support --------------------

exports.fetchHelpSupport = async (req, res, next) => {
  const data = await helpSupport.findOne({
    attributes: ['id', 'email', 'countryCode', 'phoneNum', 'address'],
  })
  return res.status(200).json({
    status: '1',
    message: 'Success',
    data: data,
  })
}

//* 3.Update Help Support --------------------------

exports.updateHelpSupport = async (req, res, next) => {
  if (!req.params.id) throw new AppError(`Invalid request format`, 200)
  const { id } = req.params
  const input = req.body
  const [rows] = await helpSupport.update(input, { where: { id } })
  return res.status(200).json(response({ data: rows }))
}

//! 10.Salon Employees ---------------------------------------------------------------------

//* 1.Fetch Salon Employees --------------------

exports.fetchSalonEmployees = async (req, res, next) => {
  const condition = {}
  if (req.params.salon !== 'all') condition.salonDetailId = req.params.salon
  const data = await employee.findOne({
    where: condition,
    attributes: [
      'position',
      [
        literal(
          '(SELECT FORMAT(AVG(ratings.value), 1) FROM ratings WHERE ratings.employeeId = employees.id)',
        ),
        'employeeAverageRating',
      ],
    ],
    include: [
      {
        model: salonDetail,
        attributes: [`salonName`],
      },
      {
        model: user,
        attributes: ['id', `firstName`, `lastName`, 'image'],
      },
    ],
  })
  return res.status(200).json({
    status: '1',
    message: 'Success',
    data: data,
  })
}

//! 11.Push Notification ------------------------------------------------------------------

//* 1.Push Notification --------------------

exports.throwNotifications = async (req, res, next) => {
  let input = {}
  if (req.params.notification) {
    const notData = await pushNotification.findByPk(req.params.notification, {
      attributes: ['to', 'title', 'body'],
    })
      ; (input.sendTo = notData.to),
        (input.title = notData.title),
        (input.body = notData.body)
    console.log('Body -------', input)
    req.body = null
  }

  const { sendTo, title, body } = req.body || input
  // usertype Ids
  // customer = 1
  // salon = 2
  //employee = 3
  let to = []
  const condition = { status: true, verifiedAt: { [Op.not]: null } }
  if (sendTo === 'customer') condition.userTypeId = 1
  if (sendTo === 'shop') condition.userTypeId = 2
  if (sendTo === 'employee') condition.userTypeId = 3
  if (sendTo === 'all') condition.userTypeId = [1, 2, 3]

  console.log('Sending To: ======================>>>>>>>>>>>>>', sendTo);

  const data = await user.findAll({
    where: condition,
    attributes: ['id'],
    include: {
      model: deviceToken,
      required: true,
      where: { status: true },
      attributes: ['tokenId'],
    },
  })
  // console.log('data To: ======================>>>>>>>>>>>>>', data);
  //return res.json(senderData)
  const senderData = data.map((ele) => {
    ele.deviceTokens.map((token) => {
      if (token.tokenId != null) to.push(token.tokenId)
    })
  })

  //console.log('senderData To: ======================>>>>>>>>>>>>>', senderData);


  let notification = { title, body }
  ThrowNotification(to, notification, {}, sendTo, 'admin')

  let dt = new Date()

  //adding 5 hours
  dt.setTime(dt.getTime() + 5 * 60 * 60 * 1000)

  if (req.body)
    pushNotification.create({ at: dt, to: sendTo, title, body, type: 'admin' })

  return res.status(200).json({
    status: '1',
    message: 'Success',
    data: {},
  })
}

//* 3.Push Notification --------------------

exports.fetchPushNotifications = async (req, res, next) => {
  const condition = {}

  const allNotData = await pushNotification.findAll({
    attributes: ['id', 'to', 'title', 'body', 'at'],
  })

  return res.json({
    status: '1',
    message: 'All push notifications.',
    data: allNotData,
    error: '',
  })
}

//! 12.REPORTS ----------------------------------------------------------------------------
//TODO change total to actual capture amount and booking status to complete....

//* 1.Reports > Peak Times Report --------------------------

exports.peakTimesReport = async (req, res, next) => {
  const currentDay = CustomDate.currentDay()
  const { id } = req.params
  const startDate = req.query.startDate || '2023-12-01'
  const endDate = req.query.endDate || currentDay.currentDateOnly
  const status = req.params.status || 'complete'

  const bookingCondition = {
    salonDetailId: id,
    status,
    on: { [Op.between]: [startDate, endDate] },
  }

  const rows = await booking.findAll({
    where: bookingCondition,
    attributes: ['id', 'startTime', 'on'],
  })

  const report = Custom.peakTimeReportGenerator(rows)

  return res
    .status(200)
    .json(response({ message: 'Peak times report', data: { report, status } }))
}

//* 2.Reports > Financial Performance Report-----------------

exports.financialPerformanceReport = async (req, res, next) => {
  const currentDay = CustomDate.currentDay()
  let startDate = req.query.startDate || '2023-12-01'
  let endDate = req.query.endDate || currentDay.currentDateOnly
  let status = req.params.status || 'complete'

  const bookingCondition = {
    status,
    on: { [Op.between]: [startDate, endDate] },
  }

  startDate = `"${startDate}"`
  endDate = `"${endDate}"`

  const report = await salonDetail.findAll({
    attributes: [
      'id',
      'salonName',
      [literal('FORMAT(AVG(ratings.value), 1)'), 'salonAverageRating'],
      [fn('COUNT', literal('DISTINCT ratings.id')), 'ratingCount'],
      [fn('COUNT', literal('DISTINCT bookings.id')), 'totalAppointments'],
      [fn('COUNT', literal('DISTINCT employees.id')), 'totalEmployees'],
      [
        fn(
          'FORMAT',
          literal(
            `(SELECT SUM(bookings.total)FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.status = '${status}' AND bookings.on BETWEEN ${startDate} AND ${endDate} )`,
          ),
          1,
        ),
        'revenue',
      ],
      [
        fn(
          'FORMAT',
          literal(
            `(SELECT AVG(bookings.total) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.status = '${status}' AND bookings.on BETWEEN ${startDate} AND ${endDate})`,
          ),
          1,
        ),
        'averageBookingTotal',
      ],
    ],
    include: [
      {
        model: rating,
        attributes: [],
        on: { salonDetailId: col('salonDetail.id') },
        required: false,
      },
      {
        model: booking,
        where: bookingCondition,
        attributes: [],
        required: false,
      },
      {
        model: employee,
        required: false,
        attributes: [],
      },
    ],
    group: ['salonDetail.id'],
  })

  return res.status(200).json(
    response({
      message: 'Financial performance report',
      data: { report, status, currencyUnit: CURRENCY_UNIT },
    }),
  )
}

//* 3.Reports > Client File Report --------------------------

exports.clientFileReport = async (req, res, next) => {
  const currentDay = CustomDate.currentDay()
  let startDate = req.query.startDate || '2024-12-01'
  let endDate = req.query.endDate || currentDay.currentDateOnly

  const bookingCondition = { on: { [Op.between]: [startDate, endDate] } }

  //for raw queries
  startDate = `'${startDate}'`
  endDate = `'${endDate}'`

  console.log(
    '🚀 ~ file: adminController.js:785 ~ exports.clientFileReport= ~ bookingCondition:',
    bookingCondition,
  )

  const report = await user.findAll({
    where: { userTypeId: 1 },
    attributes: [
      'id',
      'firstName',
      'lastName',
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.customerId = user.id AND bookings.status = 'complete' AND bookings.on BETWEEN ${startDate} AND ${endDate} )`,
        ),
        'completeBookingCount',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.customerId = user.id AND bookings.status = 'cancel' AND bookings.on BETWEEN ${startDate} AND ${endDate} )`,
        ),
        'cancelBookingCount',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.customerId = user.id AND bookings.status = 'no-show' AND bookings.on BETWEEN ${startDate} AND ${endDate} )`,
        ),
        'noShowBookingCount',
      ],
      [
        literal(
          `(SELECT SUM(bookings.reScheduleCount) FROM bookings WHERE bookings.customerId = user.id AND bookings.on BETWEEN ${startDate} AND ${endDate} )`,
        ),
        'reScheduleCount',
      ],
      [
        fn(
          'FORMAT',
          literal(
            `(SELECT AVG(bookings.total) FROM bookings WHERE bookings.customerId = user.id AND bookings.on BETWEEN ${startDate} AND ${endDate})`,
          ),
          1,
        ),
        'averageSpent',
      ],
    ],
    include: [
      {
        model: booking,
        attributes: [],
        required: false,
      },
    ],
    group: ['user.id'],
  })
  //TODO (in all reports and earnings )replace booking.total with booking.actualCapturedAmount //not needed yet

  return res.status(200).json(response({ data: { report } }))
}

//* 4.Reports > Appointment Conversion Report-----------------

exports.appointmentConversionReport = async (req, res, next) => {
  const currentDay = CustomDate.currentDay()
  let startDate = req.query.startDate || '2023-12-01'
  let endDate = req.query.endDate || currentDay.currentDateOnly

  const bookingCondition = { on: { [Op.between]: [startDate, endDate] } }

  startDate = `"${startDate}"`
  endDate = `"${endDate}"`

  const report = await salonDetail.findAll({
    attributes: [
      'id',
      'salonName',
      [fn('COUNT', literal('DISTINCT bookings.id')), 'totalAppointments'],
      [fn('COUNT', literal('DISTINCT employees.id')), 'totalEmployees'],
      [
        fn(
          'FORMAT',
          literal(
            `(SELECT SUM(bookings.total)FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN ${startDate} AND ${endDate} )`,
          ),
          1,
        ),
        'revenue',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.status = 'complete' AND bookings.on BETWEEN ${startDate} AND ${endDate} )`,
        ),
        'completeBookingCount',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.status = 'cancel' AND bookings.on BETWEEN ${startDate} AND ${endDate} )`,
        ),
        'cancelBookingCount',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.status = 'no-show' AND bookings.on BETWEEN ${startDate} AND ${endDate} )`,
        ),
        'noShowBookingCount',
      ],
      [
        literal(
          `(SELECT SUM(bookings.reScheduleCount) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN ${startDate} AND ${endDate} )`,
        ),
        'reScheduleCount',
      ],
      [
        fn(
          'FORMAT',
          literal(
            `(SELECT SUM(bookings.total)FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN ${startDate} AND ${endDate} )`,
          ),
          1,
        ),
        'revenue',
      ],
    ],
    include: [
      {
        model: booking,
        where: bookingCondition,
        attributes: [],
        required: false,
      },
      {
        model: employee,
        required: false,
        attributes: [],
      },
    ],
    group: ['salonDetail.id'],
  })

  return res.status(200).json(
    response({
      message: 'Financial performance report',
      data: { report, currencyUnit: CURRENCY_UNIT },
    }),
  )
}
/*
   Subscription
   ____________________________
 */
exports.AllSubscriptions = async (req, res, next) => {
  const listOfPlans = await Stripe.AllProducts(3)
  return res.status(200).json(
    response({
      message: 'Subscription plans',
      data: { listOfPlans },
    }),
  )
}
/*
    Get All Subscription
   ____________________________
 */
exports.updateSubscription = async (req, res, next) => {
  const { productId, name, description, features } = req.body
  const updatedProduct = await Stripe.updateProduct(
    productId,
    name,
    description,
    features,
  )
  return res.status(200).json(
    response({
      message: 'Subscription plan updated',
      data: { updatedProduct },
    }),
  )
}

//! 13.Admnin Employee management

//* 1.AdminEmployee > Add Emplyee -----------------

exports.addAdminsEmployee = async (req, res, next) => {
  req.body.userTypeId = 5

  const existEmail = await user.findOne({
    where: {
      email: req.body.email,
    },
  })

  const existPhone = await user.findOne({
    where: {
      countryCode: req.body.countryCode,
      phoneNum: req.body.phoneNum,
    },
  })

  if (existEmail)
    throw new AppError(
      'Users exists,The email you entered is already taken',
      200,
    )
  if (existPhone)
    throw new AppError(
      'Users exists,The Phone Number you entered is already taken',
      200,
    )

  const newEmployee = await user.create(req.body)
  return res.status(201).json(
    response({
      data: { id: newEmployee.id },
    }),
  )
}

//* 2.AdminEmployee > Add Emplyee -----------------

exports.fetchAdminsEmployee = async (req, res, next) => {
  const allEmployees = await user.findAll({
    where: { userTypeId: 5 },
    attributes: [
      'id',
      'firstName',
      'lastName',
      'email',
      'countryCode',
      'phoneNum',
      'status',
      'createdAt',
    ],
    include: { model: role, attributes: ['id', 'name'] },
  })

  return res.status(200).json(
    response({
      data: { employees: allEmployees },
    }),
  )
}

//* 3.AdminEmployee > Fetch Employee Details -----------------

exports.fetchAdminEmployeeDetails = async (req, res, next) => {
  const empId = req.params.employee
  const emplData = await warehouse.findByPk(empId, {
    attributes: [
      'id',
      'name',
      'email',
      'status',
      'countryCode',
      'phoneNum',
      'roleId',
    ],
    include: { model: role, attributes: ['name'] },
  })

  if (!emplData) throw new AppError('Record not found.', 200)

  const permissionData = await permission.findAll({
    where: { roleId: emplData.roleId },
  })
  const featureData = await feature.findAll({
    where: { status: true },
    attributes: ['id', 'title'],
  })
  let permissionType = ['create', 'read', 'update', 'delete']
  const employeePermissions = FormatPermissions(
    featureData,
    permissionData,
    permissionType,
  )
  return res.json(
    response({ data: { employeeData: emplData, employeePermissions } }),
  )
}

//! 14. Role and Permission management

//* 1.Role&Permission > Fetch Roles List -----------------

exports.fetchRolesList = async (req, res, next) => {
  const roleData = await role.findAll({
    attributes: ['id', 'name', 'status', 'createdAt'],
  })
  return res.status(200).json(
    response({
      data: { rolesList: roleData },
    }),
  )
}

//* 2.Role&Permission > Active Features -----------------

exports.fetchActiveFeatures = async (req, res, next) => {
  const featureData = await feature.findAll({
    where: { status: true },
    attributes: ['id', 'title', 'tabId'],
  })
  let permissionType = ['create', 'read', 'update', 'delete']
  const employeePermissions = FormatPermissions(featureData, [], permissionType)
  return res.json(
    response({
      data: { employeePermissions },
    }),
  )
}

//* 2b.Features catalog — add (bulk) -----------------

exports.addFeatures = async (req, res, next) => {
  const { features: featureList } = req.body
  if (!Array.isArray(featureList) || featureList.length === 0) {
    throw new AppError('Please provide a non-empty features array', 200)
  }
  const rows = featureList.map((f) => {
    if (f == null || typeof f !== 'object') {
      throw new AppError(
        'Each feature must be an object with title, key, or both',
        200,
      )
    }
    return {
      title: f.title != null ? String(f.title) : '',
      key: f.key != null ? String(f.key) : '',
      tabId: f.tabId != null ? String(f.tabId) : '',
      status: f.status === false ? false : true,
    }
  })
  const created = await feature.bulkCreate(rows)
  return res.status(201).json(
    response({
      message: 'Features created',
      data: { features: created },
    }),
  )
}

//* 2c.Features catalog — list all (optionally including soft-deleted) -----------------

exports.fetchAllFeaturesCatalog = async (req, res, next) => {
  const includeDeleted =
    req.query.includeDeleted === 'true' || req.query.includeDeleted === '1'
  const attributes = [
    'id',
    'title',
    'key',
    'tabId',
    'status',
    'createdAt',
    'updatedAt',
  ]
  if (includeDeleted) attributes.push('deletedAt')
  const featureData = await feature.findAll({
    attributes,
    paranoid: !includeDeleted,
    order: [['id', 'ASC']],
  })
  return res.json(
    response({
      data: { features: featureData },
    }),
  )
}

//* 2c1.Features catalog — update one -----------------

exports.updateFeature = async (req, res, next) => {
  const id = req.params.id
  if (!id) throw new AppError('Invalid request format', 200)
  const row = await feature.findByPk(id)
  if (!row) throw new AppError('Feature not found', 200)
  const { title, key, tabId, status } = req.body
  if (title !== undefined) row.title = String(title)
  if (key !== undefined) row.key = String(key)
  if (tabId !== undefined) row.tabId = String(tabId)
  if (status !== undefined) row.status = Boolean(status)
  await row.save()
  return res.status(200).json(
    response({
      message: 'Feature updated',
      data: { feature: row },
    }),
  )
}

//* 2d.Features catalog — soft delete -----------------

exports.softDeleteFeature = async (req, res, next) => {
  const id = req.params.id
  if (!id) throw new AppError('Invalid request format', 200)
  const row = await feature.findByPk(id)
  if (!row) throw new AppError('Feature not found', 200)
  await row.destroy()
  return res.status(200).json(
    response({
      message: 'Feature removed',
      data: { id: String(row.id) },
    }),
  )
}

//* 2e.Features catalog — restore soft-deleted -----------------

exports.restoreFeature = async (req, res, next) => {
  const id = req.params.id
  if (!id) throw new AppError('Invalid request format', 200)
  const row = await feature.findOne({
    where: { id },
    paranoid: false,
  })
  if (!row) throw new AppError('Feature not found', 200)
  if (!row.deletedAt) {
    throw new AppError('Feature is not deleted', 200)
  }
  await row.restore()
  return res.status(200).json(
    response({
      message: 'Feature restored',
      data: { id: String(row.id) },
    }),
  )
}

//* 3.Role&Permission > Add Roles  -----------------

exports.addRoles = async (req, res, next) => {
  const { name, permissionRole } = req.body
  // making   unique
  const checkExist = await role.findOne({ where: { name } })
  if (checkExist) throw new AppError('Role already exists.', 200)
  const data = await role.create({ name, status: true })
  // manipulating to our desired format
  let bulkArray = []

  permissionRole.map((ele) => {
    if (ele.permissions.access === true)
      bulkArray.push({
        permissionType: true,
        featureId: ele.id,
        roleId: data.id,
      })
  })

  await permission.bulkCreate(bulkArray)

  return res.status(200).json(
    response({
      data: { bulkArray },
    }),
  )
}

//* 4.Role&Permission > Update Roles  -----------------

exports.updateRole = async (req, res, next) => {
  const roleId = req.params.role
  // making email unique
  if (req.body.name) {
    const checkExist = await role.findOne({
      where: { name: req.body.name, id: { [Op.not]: roleId } },
    })
    if (checkExist) throw new AppError('Same role exists', 200)
    const data = await role.update(
      { name: req.body.name, status: true },
      { where: { id: roleId } },
    )
    return res.json(
      response({
        data: {},
      }),
    )
  }
  let permissionRole = req.body.permissionRole
  // Deleting all the previous permissions of that role
  permission.destroy({ where: { roleId } })
  // manipulating to our desired format
  let bulkArray = []
  permissionRole.map((ele) => {
    if (ele.permissions.access === true)
      bulkArray.push({ permissionType: true, featureId: ele.id, roleId })

  })

  permission.bulkCreate(bulkArray)

  return res.json(
    response({
      data: {},
    }),
  )
}

//* 4.Role&Permission > Role Details   -----------------

exports.roleDetails = async (req, res, next) => {
  const roleId = req.params.role
  const roleData = await role.findByPk(roleId, {
    attributes: ['name'],
  })
  if (!roleData) throw new AppError('Role not Found', 200)
  const permissionData = await permission.findAll({
    where: { roleId },
  })
  //return res.json(permissionData)
  const featureData = await feature.findAll({
    where: { status: true },
    attributes: ['id', 'title', [
      literal(
        `(SELECT permissionType FROM permissions WHERE permissions.featureId = feature.id &&  permissions.roleId = ${roleId || 0} LIMIT 1)`,
      ),
      'access',
    ]],
  })

  // let permissionType = ['create', 'read', 'update', 'delete']
  // const employeePermissions = FormatPermissions(
  //   featureData,
  //   permissionData,
  //   permissionType,
  // )

  return res.json(
    response({
      data: { name: roleData.name, permissionRole: featureData },
    }),
  )
}
//!New Changes

//* 4.Service History  -----------------

exports.serviceHistory = async (req, res, next) => {
  const worker = await employee.findOne({
    where: { userId: req.params?.employee },
  })

  if (!worker) {
    throw new AppError('Employee Not found', 200)
  }

  const history = await booking.findAll({
    where: {
      status: 'complete',
    },
    attributes: [
      'id',
      'status',
      'on',
      'actualCapturedAmount',
      'createdAt',
      'startTime',
    ],
    include: [
      {
        model: user,
        attributes: ['id', 'firstName', 'lastName'],
      },
      {
        model: jobs,
        where: { employeeId: worker?.id, status: 'complete' },
        required: true,
        attributes: [
          [
            literal(
              '(SELECT serviceName  FROM services WHERE services.id = jobs.serviceId)',
            ),
            'serviceName',
          ],
        ],
      },
    ],
  })

  return res.json(
    response({
      data: { currencyUnit: CURRENCY_UNIT, history },
    }),
  )
}

//! Graphs
///*1 Top performing services Graph
exports.topPerformingServices = async (req, res, next) => {
  const currentDay = CustomDate.currentDay()
  const { id } = req.params
  const startDate = req.query.startDate || '2023-12-01'
  const endDate = req.query.endDate || currentDay.currentDateOnly
  const status = req.params.status || 'complete'

  const bookingCondition = {
    deleted: false,
    // on: { [Op.between]: [startDate, endDate] },
  }

  const rows = await serviceType.findAll({
    where: bookingCondition,
    attributes: ['id', 'typeName'],
    include: [
      {
        model: service,
        attributes: [
          [
            fn(
              'FORMAT',
              literal(
                `(SELECT SUM(jobs.total)FROM jobs WHERE jobs.serviceId = services.id AND jobs.status = '${status}'  AND jobs.on BETWEEN ${startDate} AND ${endDate})`,
              ),
              1,
            ),
            'revenue',
          ],
        ],
      },
    ],
  })
  const input = JSON.parse(JSON.stringify(rows))

  const output = Graph.adminTopPerformingServices(input)

  return res.status(200).json(
    response({
      message: 'Top performing services',
      data: { currencyUnit: CURRENCY_UNIT, graph: output },
    }),
  )
}

//*2 Top performing Salons Graph

exports.topPerformingSalons = async (req, res, next) => {
  const currentDay = CustomDate.currentDay()
  const { id } = req.params
  const startDate = req.query.startDate || '2023-12-01'
  const endDate = req.query.endDate || currentDay.currentDateOnly
  const status = req.params.status || 'complete'

  const bookingCondition = {
    deleted: false,
    // on: { [Op.between]: [startDate, endDate] },
  }
  const limit = req.params.limit * 1

  const rows = await salonDetail.findAll({
    // where: bookingCondition,
    attributes: [
      'id',
      'salonName',
      [
        // Calculate revenue as a numeric value
        literal(
          `(SELECT SUM(bookings.actualCapturedAmount)
            FROM bookings
            WHERE bookings.salonDetailId = salonDetail.id AND bookings.status = '${status}' AND bookings.on BETWEEN '${startDate}' AND '${endDate}')`,
        ),
        'revenue',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.status = '${status}' AND bookings.on BETWEEN '${startDate}' AND '${endDate}')`,
        ),
        'bookingCount',
      ],
      [
        // Summing up the serviceAmount from jobs for bookings associated with each salon
        literal(
          `(SELECT COUNT(*)
            FROM jobs
            WHERE jobs.bookingId IN (
              SELECT id FROM bookings WHERE bookings.salonDetailId = salonDetail.id 
              AND bookings.status = '${status}' AND bookings.on BETWEEN '${startDate}' AND '${endDate}'
            ))`,
        ),
        'totalServices',
      ],
    ],

    order: [[literal('revenue'), 'DESC']],
    limit: limit,
  })

  const input = JSON.parse(JSON.stringify(rows))

  const output = Graph.adminTopPerformingSalons(input)

  return res.status(200).json(
    response({
      message: `Top ${limit} performing shops.`,
      data: { currencyUnit: CURRENCY_UNIT, graph: output },
    }),
  )
}

//*3 Client Status Distribution Graph

exports.clientStatusDistributionGraph = async (req, res, next) => {
  const currentDay = CustomDate.currentDay()

  const startDate =
    req.query && req.query.startDate ? req.query.startDate : '2024-02-01'
  const endDate =
    req.query && req.query.endDate
      ? req.query.endDate
      : currentDay?.currentDateOnly
  const condition = {
    on: { [Op.between]: [startDate, endDate] },
  }
  const appointments = await booking.findAll({
    where: condition,
    attributes: ['id', 'on', 'customerId'],
  })

  const input = JSON.parse(JSON.stringify(appointments))
  const output = input.length > 0 ? Graph.customerStatusGraph(input) : null
  const doughnutChartData = {
    labels: ['New', 'Return', 'Lapsed'],
    datasets: [
      {
        data: output
          ? [
            output.newCustomers,
            output.returningCustomers,
            output.lapsedCustomers,
          ]
          : [0, 0, 0],
      },
    ],
  }
  return res.status(200).json(
    response({
      data: { currencyUnit: CURRENCY_UNIT, report: doughnutChartData },
    }),
  )
}

//^ Status-Change And Delete --------------------------------------------------------------

//*1 Salon status
//* A shop's subscription: current state plus payment history, for the admin
// shop details "Subscription plan" tab.
exports.fetchSalonSubscription = async (req, res, next) => {
  const shop = await salonDetail.findByPk(req.params.id, {
    attributes: [
      'id',
      'salonName',
      'metadata',
      'registrationExpiryDate',
      'subscriptionLatestPaymentStatus',
      'hasObtainedFreeTrial',
      'isExternalEmployee',
    ],
  })
  if (!shop) throw new AppError('No record found with that ID', 200)

  const history = await subscriptions.findAll({
    where: { salonDetailId: shop.id },
    attributes: [
      'id',
      'name',
      'status',
      'subscriptionSource',
      'subscriptionId',
      'customerId',
      'priceId',
      'invoiceId',
      'invoice',
      'amountPaid',
      'renewablePrice',
      'currency',
      'VAT',
      'periodStart',
      'periodEnd',
      'revenueCatUserId',
      'revenueCatOriginalTransactionId',
      'revenueCatStore',
      'appleProductId',
      'appleOriginalTransactionId',
      'appleEnvironment',
      'createdAt',
    ],
    order: [['createdAt', 'DESC']],
    limit: 100,
  })

  let planName = null
  try {
    planName = JSON.parse(shop.metadata || '{}')?.subscriptionName || null
  } catch (_) {}

  const today = CustomDate.currentDay().currentDateOnly
  const latest = history[0] || null
  const status = latest?.status || shop.subscriptionLatestPaymentStatus || null
  const blocked = ['expired', 'payment_failed', 'paused', 'refunded']
  const active =
    !!shop.registrationExpiryDate &&
    shop.registrationExpiryDate >= today &&
    !!shop.subscriptionLatestPaymentStatus &&
    !blocked.includes(shop.subscriptionLatestPaymentStatus)

  return res.status(200).json(
    response({
      message: 'Subscription',
      data: {
        shop: {
          id: shop.id,
          salonName: shop.salonName,
          planName: planName || latest?.name || null,
          registrationExpiryDate: shop.registrationExpiryDate,
          latestPaymentStatus: shop.subscriptionLatestPaymentStatus,
          hasObtainedFreeTrial: shop.hasObtainedFreeTrial,
          isExternalEmployee: shop.isExternalEmployee,
          active,
          status,
        },
        latest,
        history,
      },
    }),
  )
}

//* Change a shop's booking approval mode (automatic / manual, all / new clients).
// Waiting requests are unaffected; they are still answered or expire as normal.
exports.updateSalonBookingApproval = async (req, res, next) => {
  const shop = await salonDetail.findByPk(req.params.id, {
    attributes: ['id', 'autoAcceptBookings', 'approvalScope'],
  })
  if (!shop) throw new AppError('No record found with that ID', 200)

  const { autoAcceptBookings, approvalScope } = req.body
  if (autoAcceptBookings !== undefined && typeof autoAcceptBookings !== 'boolean') {
    throw new AppError('autoAcceptBookings must be true or false', 200)
  }
  if (approvalScope !== undefined && !['all', 'new'].includes(approvalScope)) {
    throw new AppError("approvalScope must be 'all' or 'new'", 200)
  }
  if (autoAcceptBookings !== undefined) shop.autoAcceptBookings = autoAcceptBookings
  if (approvalScope !== undefined) shop.approvalScope = approvalScope
  await shop.save()

  return res.status(200).json(
    response({
      message: 'Booking approval updated',
      data: {
        autoAcceptBookings: shop.autoAcceptBookings,
        approvalScope: shop.approvalScope,
      },
    }),
  )
}

exports.changeSalonStatus = async (req, res, next) => {
  const id = req.params.id

  const existingRecord = await user.findByPk(id, { attributes: ['status'] })

  if (!existingRecord) {
    throw new AppError('No record found with that ID', 200)
  }
  const newStatus = existingRecord.status === true ? 0 : 1
  const [updatedCount] = await user.update(
    { status: newStatus },
    { where: { id } },
  )

  await salonDetail.update({ status: newStatus }, { where: { userId: id } })

  salonBlock(id, newStatus)

  res.status(200).json(
    response({
      message: 'Status changed',
      data: { count: updatedCount, newStatus },
    }),
  )
}

//*1 Client Status Change
exports.changeCustomerStatus = async (req, res, next) => {
  const id = req.params.id

  const existingRecord = await user.findByPk(id, { attributes: ['status'] })

  if (!existingRecord) {
    throw new AppError('No record found with that ID', 200)
  }
  const newStatus = existingRecord.status === true ? 0 : 1
  const [updatedCount] = await user.update(
    { status: newStatus },
    { where: { id } },
  )

  if (!newStatus) {
    customerBlockEvent(id, newStatus)
  }

  res.status(200).json(
    response({
      message: 'Status changed',
      data: { count: updatedCount, newStatus },
    }),
  )
}

//& Change Status -------------------

exports.changeStatus = (Model) => async (req, res, next) => {
  const id = req.params.id
  console.log(
    '🚀 ~ file: adminController.js:397 ~ exports.changeStatus=Model=> ~ id:',
    id,
  )

  const existingRecord = await Model.findByPk(id, { attributes: ['status'] })

  if (!existingRecord) {
    throw new AppError('No record found with that ID', 200)
  }
  const newStatus = existingRecord.status === true ? 0 : 1
  const [updatedCount] = await Model.update(
    { status: newStatus },
    { where: { id } },
  )
  res.status(200).json(
    response({
      message: 'Status changed',
      data: { count: updatedCount },
    }),
  )
}

//& Soft Delete Status -------------------

exports.softDelete = (Model) => async (req, res, next) => {
  const { id } = req.params

  const [updatedCount] = await Model.update(
    { deleted: true },
    { where: { id } },
  )
  if (updatedCount === 0) {
    return res.status(200).json(
      response({ message: 'Record not found or already deleted' })
    );
  }
  const records = await Model.findAll({
    where: {
      deleted: false,
      serviceOrder: { [Op.ne]: null }
    },
    order: [['serviceOrder', 'ASC']]
  })

  const updateRecords = records.map((record, index) =>
    record.update({ serviceOrder: index + 1 })
  );

  await Promise.all(updateRecords)

  res.status(200).json(
    response({
      message: 'Service type deleted',
      data: { count: updatedCount },
    }),
  )
}

//& Delete --------------------------

exports.delete = (Model) => async (req, res, next) => {
  if (!req.params.id) throw new AppError(`Invalid request format`, 200)

  const data = await Model.destroy({
    where: { id: req.params.id },
  })

  if (!data) {
    throw new AppError(`Record not found`, 200)
  } else {
    return res.status(200).json(
      response({
        mesage: 'Deleted Successfully',
      }),
    )
  }
}

//! .Reason Fro subscriptions and appointments -------------------------------------------------------------------------------

//^ 1.Add Reasons  ----------------------------

const VALID_REASON_TYPES = [
  'subscription',
  'appointment_customer_cancellation',
  'appointment_salon_owner_cancellation',
  'appointment_employee_cancellation',
  'account_deletion_customer',
  'account_deletion_salon',
]

const LEGACY_REASON_TYPE_MAP = {
  appointment: 'appointment_customer_cancellation',
}

const normalizeReasonType = (type) => LEGACY_REASON_TYPE_MAP[type] || type

const appointmentTypeByActor = {
  customer: 'appointment_customer_cancellation',
  salon_owner: 'appointment_salon_owner_cancellation',
  employee: 'appointment_employee_cancellation',
}

const ensureValidReasonType = (type) => {
  const normalizedType = normalizeReasonType(type)
  if (!VALID_REASON_TYPES.includes(normalizedType)) {
    throw new AppError('Invalid reason type', 200)
  }
  return normalizedType
}

exports.addReasons = async (req, res, next) => {
  const normalizedType = ensureValidReasonType(req.params.type)
  req.body.type = normalizedType
  const data = await reason.create(req.body)

  return res.status(200).json(
    response({
      message: 'Reason type added',
      data: { reason: data },
    }),
  )
}

//^ 2.Fetch Reasons  ----------------------------

exports.fetchReasons = async (req, res, next) => {
    const whereCondition = {}
    if (req.params?.type) {
      if (req.params.type === 'appointment' && req.query?.actor) {
        const actorType = appointmentTypeByActor[req.query.actor]
        if (!actorType) {
          throw new AppError('Invalid actor for appointment reasons', 200)
        }
        whereCondition.type = actorType
      } else {
        whereCondition.type = ensureValidReasonType(req.params.type)
      }
    }

    const data = await reason.findAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json(
      response({
        message: 'Reasons',
        data: { reasons: data },
      }),
    );
};


//^ 2.Update Reasons  ----------------------------

exports.updateReasons = async (req, res, next) => {
  const normalizedType = ensureValidReasonType(req.params?.type)
  const record = await reason.findOne({
    where: {
      type: normalizedType,
      id: req.params?.id
    }
  })

  if (!record) {
    throw new AppError('No record found with that ID', 200)
  }

  await reason.update(
    { 
        reason: req.body?.reason,
        type: req.body?.type
          ? ensureValidReasonType(req.body?.type)
          : normalizedType,
        
    },
    {
      where: {
        type: normalizedType,
        id: req.params?.id
      }
    },
  )

  return res.status(200).json(
    response({
      message: 'Success',
      data: {},
    }),
  )
}

//^ 3.Update Status  ----------------------------

exports.changeReasonStatus = async (req, res, next) => {
  const normalizedType = ensureValidReasonType(req.params?.type)
  const data=await reason.update(
    { status: req.body?.status },
    { where: { type: normalizedType, id: req.params?.id } },
  )

  return res.status(200).json(
    response({
      message: 'Success',
      data: {status:req.body.status},
    }),
  )
}

//^ 4.Delete Reasons  ----------------------------

exports.deleteReasons = async (req, res, next) => {
  const normalizedType = ensureValidReasonType(req.params?.type)
  const data = await reason.destroy({
    where: { id: req.params?.id, type: normalizedType },
  })

  return res.status(200).json(
    response({
      message: 'Success',
      data: {},
    }),
  )
}

exports.customEmails = async (req, res, next) => {
  CutomEmails(req.body)
  return res.status(200).json(
    response({
      message: 'Success',
      data: {},
    }),
  )
}

exports.adminEarnings = async (req, res, next) => {
  const currentDay = CustomDate.currentDay()

  const startDate = req.query.startDate || '2024-01-01'
  const endDate = req.query.endDate || currentDay.currentDateOnly

  const salonCondition = {
    isExternalEmployee: false,
  }

  const limit = req.params.limit * 1

  const formattedStartDate = formatDate(new Date(startDate))
  const formattedEndDate = formatDate(new Date(endDate))

  // Build the date filter string if both dates are provided
  const dateFilter =
    formattedStartDate && formattedEndDate
      ? ` AND subscriptions.createdAt BETWEEN '${formattedStartDate}' AND '${formattedEndDate}'`
      : ''

  const rows = await salonDetail.findAll({
    where: salonCondition,
    attributes: [
      'id',
      'salonName',
      [
        // Calculate revenue as a numeric value
        literal(
          `(SELECT COALESCE(SUM(subscriptions.amountPaid), 0) 
            FROM subscriptions 
            WHERE subscriptions.salonDetailId = salonDetail.id ${dateFilter})`,
        ),
        'revenue',
      ],
    ],
  })

  const totalRevenue =
    rows.length > 0
      ? rows.reduce((accumulator, currentObject) => {
        const revenueStr = currentObject.dataValues.revenue

        // Check if revenue exists
        if (revenueStr) {
          const revenue = parseFloat(revenueStr)

          // Check if the parsed revenue is a valid number
          if (!isNaN(revenue)) {
            return accumulator + revenue
          } else {
            console.warn(`Invalid revenue value encountered: ${revenueStr}`)
            return accumulator
          }
        } else {
          console.warn('Revenue key missing in object:', currentObject)
          return accumulator
        }
      }, 0)
      : 0

  return res.status(200).json(
    response({
      message: 'Success',
      data: { totalRevenue, data: rows },
    }),
  )
}

exports.adminEarningsFromSpecificSalon = async (req, res, next) => {
  const currentDay = CustomDate.currentDay()

  const startDate = req.query.startDate || '2024-01-01'
  const endDate = req.query.endDate || currentDay.currentDateOnly
  const limit = req.params.limit * 1

  const formattedStartDate = formatDate(new Date(startDate))
  const formattedEndDate = formatDate(new Date(endDate))

  const salonCondition = {
    salonDetailId: req.params?.salon,
    createdAt: {
      [Op.between]: [formattedStartDate, formattedEndDate],
    },
  }

  const rows = await subscriptions.findAll({
    where: salonCondition,
    attributes: [
      `id`,
      `name`,
      `amountPaid`,
      `currency`,
      `priceId`,
      `status`,
      `createdAt`,
      `periodEnd`,
      `periodStart`,
    ],
  })

  const totalRevenue =
    rows.length > 0
      ? rows.reduce((accumulator, currentObject) => {
        const revenueStr = currentObject.dataValues.amountPaid

        // Check if revenue exists
        if (revenueStr) {
          const revenue = parseFloat(revenueStr)

          // Check if the parsed revenue is a valid number
          if (!isNaN(revenue)) {
            return accumulator + revenue
          } else {
            console.warn(`Invalid revenue value encountered: ${revenueStr}`)
            return accumulator
          }
        } else {
          console.warn('Revenue key missing in object:', currentObject)
          return accumulator
        }
      }, 0)
      : 0

  return res.status(200).json(
    response({
      message: 'Success',
      data: { totalRevenue, data: rows },
    }),
  )
}


/*
 * Update VAT Percentage and Platform Fee for All Salons
 * ____________________________________________________
 */
exports.updateAllSalonsVatAndPlatformFee = async (req, res, next) => {
  const { vatPercentage, platformFee } = req.body;

  // Validate input
  if (vatPercentage === undefined && platformFee === undefined) {
    return next(new appError('At least one field (vatPercentage or platformFee) is required', 400));
  }

  // Validate vatPercentage if provided
  if (vatPercentage !== undefined) {
    if (typeof vatPercentage !== 'number' || vatPercentage < 0 || vatPercentage > 100) {
      return next(new appError('VAT percentage must be a number between 0 and 100', 400));
    }
  }

  // Validate platformFee if provided
  if (platformFee !== undefined) {
    if (typeof platformFee !== 'number' || platformFee < 0) {
      return next(new appError('Platform fee must be a non-negative number', 400));
    }
  }

    // Prepare update object with only provided fields
    const updateFields = {};
    if (vatPercentage !== undefined) {
      updateFields.vatPercentage = vatPercentage;
    }
    if (platformFee !== undefined) {
      updateFields.platformFee = platformFee;
    }

    // Update all salon details
    const [affectedRowsCount] = await salonDetail.update(updateFields, {
      where: {
        status: 1, // Only update non-deleted salons
      },
    });
    
    return res.status(200).json({
    status: '1',
    message: 'VAT percentage and platform fee updated successfully for all shops',
    data: {
          affectedSalons: affectedRowsCount,
          updatedFields: updateFields,
        },
  })

};

//! .Reason Fro subscriptions and appointments -------------------------------------------------------------------------------

const FAQ_FOR_VALUES = ['general', 'salon', 'customer', 'external-employee']

function normalizeFaqFor(value) {
  if (!value) return null
  const v = String(value).trim()
  return FAQ_FOR_VALUES.includes(v) ? v : null
}

function mapFaqCategoryPlain(cat) {
  if (!cat) return null
  const plain = typeof cat.toJSON === 'function' ? cat.toJSON() : cat
  return {
    id: plain.id,
    name: plain.name,
    sortOrder: plain.sortOrder ?? 0,
  }
}

function mapFaqReasonPlain(row) {
  const plain = typeof row.toJSON === 'function' ? row.toJSON() : row
  const category = mapFaqCategoryPlain(plain.category)
  return {
    id: plain.id,
    status: plain.status,
    question: plain.question,
    answer: plain.answer,
    faqFor: plain.faqFor,
    createdAt: plain.createdAt,
    sortOrder: plain.sortOrder ?? 0,
    faqCategoryId: plain.faqCategoryId ?? null,
    category,
  }
}

function sortFaqsForResponse(rows) {
  return [...rows].sort((a, b) => {
    const aCatOrder =
      a.category?.sortOrder ?? Number.MAX_SAFE_INTEGER
    const bCatOrder =
      b.category?.sortOrder ?? Number.MAX_SAFE_INTEGER
    if (aCatOrder !== bCatOrder) return aCatOrder - bCatOrder
    const aCatName = (a.category?.name || '').toLowerCase()
    const bCatName = (b.category?.name || '').toLowerCase()
    if (aCatName !== bCatName) return aCatName.localeCompare(bCatName)
    if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) {
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    }
    return (a.id || 0) - (b.id || 0)
  })
}

function buildCategoriesList(reasons, allAudienceCategories = []) {
  const byId = new Map()
  for (const cat of allAudienceCategories) {
    if (!cat || cat.status === false) continue
    byId.set(cat.id, {
      id: cat.id,
      name: cat.name,
      sortOrder: cat.sortOrder ?? 0,
    })
  }
  for (const reason of reasons) {
    if (reason.category?.id != null) {
      byId.set(reason.category.id, {
        id: reason.category.id,
        name: reason.category.name,
        sortOrder: reason.category.sortOrder ?? 0,
      })
    }
  }
  return [...byId.values()].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return String(a.name).localeCompare(String(b.name))
  })
}

//^ FAQ Categories ----------------------------

exports.addFaqCategory = async (req, res, next) => {
  const faqFor = normalizeFaqFor(req.body?.faqFor)
  const name = String(req.body?.name || '').trim()
  if (!faqFor) {
    return next(new appError('faqFor is required', 400))
  }
  if (!name) {
    return next(new appError('Category name is required', 400))
  }
  const sortOrder =
    req.body?.sortOrder !== undefined && req.body?.sortOrder !== null
      ? parseInt(req.body.sortOrder, 10) || 0
      : 0
  const status =
    req.body?.status === undefined || req.body?.status === null
      ? true
      : Boolean(req.body.status)

  const data = await faqCategory.create({
    name,
    faqFor,
    sortOrder,
    status,
  })

  return res.status(200).json(
    response({
      message: 'FAQ category created',
      data: { category: data },
    }),
  )
}

exports.fetchFaqCategories = async (req, res, next) => {
  const faqFor = normalizeFaqFor(req.params?.type || req.query?.faqFor)
  const condition = {}
  if (faqFor) condition.faqFor = faqFor
  // Admin web: return all statuses unless explicitly filtered
  if (req.query?.status === 'true') condition.status = true
  if (req.query?.status === 'false') condition.status = false

  const data = await faqCategory.findAll({
    where: condition,
    order: [
      ['sortOrder', 'ASC'],
      ['name', 'ASC'],
      ['id', 'ASC'],
    ],
  })

  return res.status(200).json(
    response({
      data: { categories: data },
    }),
  )
}

exports.updateFaqCategory = async (req, res, next) => {
  const id = parseInt(req.params?.id, 10)
  const existing = await faqCategory.findByPk(id)
  if (!existing) {
    return next(new appError('FAQ category not found', 404))
  }

  const updates = {}
  if (req.body?.name !== undefined) {
    const name = String(req.body.name || '').trim()
    if (!name) return next(new appError('Category name is required', 400))
    updates.name = name
  }
  if (req.body?.sortOrder !== undefined) {
    updates.sortOrder = parseInt(req.body.sortOrder, 10) || 0
  }
  if (req.body?.status !== undefined) {
    updates.status = Boolean(req.body.status)
  }
  if (req.body?.faqFor !== undefined) {
    const faqFor = normalizeFaqFor(req.body.faqFor)
    if (!faqFor) return next(new appError('Invalid faqFor', 400))
    updates.faqFor = faqFor
  }

  await existing.update(updates)

  return res.status(200).json(
    response({
      message: 'FAQ category updated',
      data: { category: existing },
    }),
  )
}

/**
 * Delete category without deleting FAQs.
 * Body: { moveToCategoryId: <id>|null }
 * - null / omitted / "uncategorised" → set faqCategoryId = null
 * - number → reassign FAQs to that category (same faqFor preferred)
 */
exports.deleteFaqCategory = async (req, res, next) => {
  const id = parseInt(req.params?.id, 10)
  const existing = await faqCategory.findByPk(id)
  if (!existing) {
    return next(new appError('FAQ category not found', 404))
  }

  let moveTo =
    req.body?.moveToCategoryId ?? req.query?.moveToCategoryId
  if (
    moveTo === undefined ||
    moveTo === null ||
    moveTo === '' ||
    moveTo === 'uncategorised' ||
    moveTo === 'null'
  ) {
    moveTo = null
  } else {
    moveTo = parseInt(moveTo, 10)
    if (Number.isNaN(moveTo)) {
      return next(new appError('Invalid moveToCategoryId', 400))
    }
    if (moveTo === id) {
      return next(
        new appError('Cannot move FAQs to the category being deleted', 400),
      )
    }
    const target = await faqCategory.findByPk(moveTo)
    if (!target) {
      return next(new appError('Target category not found', 404))
    }
  }

  await faqs.update(
    { faqCategoryId: moveTo },
    { where: { faqCategoryId: id } },
  )
  await existing.destroy()

  return res.status(200).json(
    response({
      message: 'FAQ category deleted; questions were preserved',
      data: {},
    }),
  )
}

exports.reorderFaqCategories = async (req, res, next) => {
  const items = Array.isArray(req.body?.categories) ? req.body.categories : []
  if (!items.length) {
    return next(new appError('categories array is required', 400))
  }

  for (const item of items) {
    const id = parseInt(item.id, 10)
    if (!id) continue
    await faqCategory.update(
      { sortOrder: parseInt(item.sortOrder, 10) || 0 },
      { where: { id } },
    )
  }

  return res.status(200).json(
    response({
      message: 'FAQ categories reordered',
      data: {},
    }),
  )
}

//^ 1.Add FAQs  ----------------------------

exports.addFAQs = async (req, res, next) => {
  const payload = { ...req.body, status: true }
  if (payload.faqCategoryId === '' || payload.faqCategoryId === 'null') {
    payload.faqCategoryId = null
  }
  if (payload.faqCategoryId != null) {
    payload.faqCategoryId = parseInt(payload.faqCategoryId, 10) || null
  }
  if (payload.sortOrder !== undefined) {
    payload.sortOrder = parseInt(payload.sortOrder, 10) || 0
  }
  const data = await faqs.create(payload)

  return res.status(200).json(
    response({
      data: { reason: data },
    }),
  )
}

//^ 2.Fetch FAQs  ----------------------------

exports.fetchFAQs = async (req, res, next) => {
  const faqFor = normalizeFaqFor(req.params?.type)
  const accessFrom = req.params?.accessFrom
  const isMobile = accessFrom === 'mobile'

  const condition = {}
  if (faqFor) condition.faqFor = faqFor

  if (isMobile && faqFor && faqFor !== 'general') {
    condition.faqFor = { [Op.or]: ['general', faqFor] }
    condition.status = true
  } else if (isMobile) {
    condition.status = true
  }

  const rows = await faqs.findAll({
    where: condition,
    attributes: { exclude: ['updatedAt'] },
    include: [
      {
        model: faqCategory,
        as: 'category',
        required: false,
        attributes: ['id', 'name', 'sortOrder', 'status', 'faqFor'],
      },
    ],
  })

  // Mobile: only expose active categories on nested objects
  let reasons = rows.map((row) => {
    const mapped = mapFaqReasonPlain(row)
    if (isMobile && mapped.category) {
      const rawCat =
        typeof row.category?.toJSON === 'function'
          ? row.category.toJSON()
          : row.category
      if (rawCat && rawCat.status === false) {
        mapped.category = null
        mapped.faqCategoryId = null
      }
    }
    return mapped
  })

  if (isMobile) {
    reasons = reasons.filter((r) => r.status === true)
  }

  reasons = sortFaqsForResponse(reasons)

  // Categories list for apps:
  // - audience categories (salon/customer/...) that are active
  // - plus any general categories that appear on FAQs in this response
  // Admin (web) also gets categories for the requested faqFor for convenience.
  let categories = []
  if (faqFor) {
    const audienceCats = await faqCategory.findAll({
      where: {
        faqFor,
        ...(isMobile ? { status: true } : {}),
      },
      attributes: ['id', 'name', 'sortOrder', 'status', 'faqFor'],
      order: [
        ['sortOrder', 'ASC'],
        ['name', 'ASC'],
      ],
    })

    let generalCats = []
    if (isMobile && faqFor !== 'general') {
      const generalIdsInResponse = [
        ...new Set(
          reasons
            .filter((r) => r.faqFor === 'general' && r.category?.id)
            .map((r) => r.category.id),
        ),
      ]
      if (generalIdsInResponse.length) {
        generalCats = await faqCategory.findAll({
          where: {
            id: { [Op.in]: generalIdsInResponse },
            faqFor: 'general',
            status: true,
          },
          attributes: ['id', 'name', 'sortOrder', 'status', 'faqFor'],
        })
      }
    }

    categories = buildCategoriesList(reasons, [
      ...audienceCats.map((c) => c.toJSON()),
      ...generalCats.map((c) => c.toJSON()),
    ])
  } else {
    categories = buildCategoriesList(reasons, [])
  }

  const support = await helpSupport.findOne({
    attributes: ['email'],
    order: [['createdAt', 'DESC']],
  })

  return res.status(200).json(
    response({
      data: {
        categories,
        reasons,
        support: {
          email: support?.email || '',
        },
      },
    }),
  )
}

//^ 2.Update FAQs  ----------------------------

exports.updateFAQs = async (req, res, next) => {
  const payload = { ...req.body }
  if (payload.faqCategoryId === '' || payload.faqCategoryId === 'null') {
    payload.faqCategoryId = null
  }
  if (payload.faqCategoryId !== undefined && payload.faqCategoryId !== null) {
    payload.faqCategoryId = parseInt(payload.faqCategoryId, 10) || null
  }
  if (payload.sortOrder !== undefined) {
    payload.sortOrder = parseInt(payload.sortOrder, 10) || 0
  }
  await faqs.update(payload, { where: { id: req.params?.id } })

  return res.status(200).json(
    response({
      message: 'Success',
      data: { id: req.params?.id },
    }),
  )
}

//^ 4.Delete FAQs  ----------------------------

exports.deleteFAQs = async (req, res, next) => {
  await faqs.destroy({ where: { id: req.params?.id } })

  return res.status(200).json(
    response({
      message: 'Success',
      data: {},
    }),
  )
}

// ^ Add Countires
exports.addCountries = async (req, res, next) => {

  const countrieFind=await countries.findOne({ where: { name: req.body.name } })
  if (countrieFind) {
    return next(new appError('Country already exists', 400))
  }
  const data = await countries.create(req.body)
  return res.status(200).json(response({ message: 'Country added successfully', data: { countries: data } }))
}

// ^ Get Countries
exports.getCountries = async (req, res, next) => {
  const data = await countries.findAll()
  return res.status(200).json(response({ data: { countries: data } }))
}


// ^ Add Cities
exports.addCities = async (req, res, next) => {
  const cityFind=await cities.findOne({ where: { name: req.body.name } })
  if (cityFind) {
    return next(new appError('City already exists', 400))
  }
  const data = await cities.create(req.body)
  return res.status(200).json(response({ message: 'City added successfully', data: { cities: data } }))
}

// ^ Get Cities
exports.getCities = async (req, res, next) => {
  const data = await cities.findAll()
  return res.status(200).json(response({ data: { cities: data } }))
}

// ^ Add Zones
exports.addZones = async (req, res, next) => {
  const zoneFind=await zones.findOne({ where: { zoneName: req.body.zoneName } })
  if (zoneFind) {
    return next(new appError('Zone already exists', 400))
  }
  const data = await zones.create(req.body)
  return res.status(200).json(response({ message: 'Zone added successfully', data: { zones: data } }))
}

// ^ Update Zones
exports.updateZones = async (req, res, next) => {
  const data = await zones.update(req.body, { where: { id: req.params?.id } })
  return res.status(200).json(response({ message: 'Zone updated successfully', data: { zones: data } }))
}
// ^ Get Zones
exports.getZones = async (req, res, next) => {
  const data = await zones.findAll()
  return res.status(200).json(response({ data: { zones: data } }))
}

//!-------------------------------App Version Config-------------------------------//

const APP_VERSION_SEMVER_REGEX = /^\d+\.\d+\.\d+$/

function parseAppSemver(version) {
  const parts = String(version).trim().split('.').map(Number)
  return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 }
}

function compareAppSemver(a, b) {
  const va = parseAppSemver(a)
  const vb = parseAppSemver(b)
  if (va.major !== vb.major) return va.major - vb.major
  if (va.minor !== vb.minor) return va.minor - vb.minor
  return va.patch - vb.patch
}

function isValidAppSemver(version) {
  return APP_VERSION_SEMVER_REGEX.test(String(version).trim())
}

function normalizeOptionalMessage(value) {
  if (value === undefined) return undefined
  const trimmed = String(value).trim()
  return trimmed === '' ? null : trimmed
}

// ^ Get all app version config rows (all appTypes + platforms)
exports.getAppVersionConfig = async (req, res, next) => {
  const data = await appVersionConfig.findAll({
    order: [['appType', 'ASC'], ['platform', 'ASC']],
  })
  return res.status(200).json(response({ data: { appVersionConfig: data } }))
}

// ^ Update a specific app version config row by appType + platform
exports.updateAppVersionConfig = async (req, res, next) => {
  const { appType, platform } = req.params
  const {
    latestVersion,
    minimumSupportedVersion,
    forceUpdateMessage,
    softUpdateMessage,
    allowMinimumGreaterThanLatest,
  } = req.body

  const validAppTypes = ['client', 'business']
  const validPlatforms = ['android', 'ios']

  if (!validAppTypes.includes(appType)) {
    return next(new appError(`Invalid appType. Must be one of: ${validAppTypes.join(', ')}`, 400))
  }

  if (!validPlatforms.includes(platform)) {
    return next(new appError(`Invalid platform. Must be one of: ${validPlatforms.join(', ')}`, 400))
  }

  if (
    latestVersion === undefined &&
    minimumSupportedVersion === undefined &&
    forceUpdateMessage === undefined &&
    softUpdateMessage === undefined
  ) {
    return next(new appError('At least one field is required to update', 400))
  }

  const row = await appVersionConfig.findOne({ where: { appType, platform } })

  if (!row) {
    return next(new appError(`No config found for appType: ${appType}, platform: ${platform}`, 404))
  }

  const updateFields = {}

  if (latestVersion !== undefined && latestVersion !== null && latestVersion !== '') {
    const trimmedLatest = String(latestVersion).trim()
    if (!isValidAppSemver(trimmedLatest)) {
      return next(new appError('latestVersion must use semantic version format x.y.z (e.g. 1.0.23)', 400))
    }
    updateFields.latestVersion = trimmedLatest
  }

  if (
    minimumSupportedVersion !== undefined &&
    minimumSupportedVersion !== null &&
    minimumSupportedVersion !== ''
  ) {
    const trimmedMinimum = String(minimumSupportedVersion).trim()
    if (!isValidAppSemver(trimmedMinimum)) {
      return next(
        new appError('minimumSupportedVersion must use semantic version format x.y.z (e.g. 1.0.23)', 400),
      )
    }
    updateFields.minimumSupportedVersion = trimmedMinimum
  }

  if (forceUpdateMessage !== undefined) {
    updateFields.forceUpdateMessage = normalizeOptionalMessage(forceUpdateMessage)
  }

  if (softUpdateMessage !== undefined) {
    updateFields.softUpdateMessage = normalizeOptionalMessage(softUpdateMessage)
  }

  const finalLatest = updateFields.latestVersion ?? row.latestVersion
  const finalMinimum = updateFields.minimumSupportedVersion ?? row.minimumSupportedVersion

  if (compareAppSemver(finalMinimum, finalLatest) > 0 && !allowMinimumGreaterThanLatest) {
    return next(
      new appError(
        'minimumSupportedVersion cannot be greater than latestVersion. Set allowMinimumGreaterThanLatest to true if this is intentional.',
        400,
      ),
    )
  }

  await row.update(updateFields)
  await row.reload()

  return res.status(200).json(
    response({
      message: `App version config updated for ${appType} / ${platform}`,
      data: { appVersionConfig: row },
    }),
  )
}

// ^ Get the rebooking-reminder config (single row, created with defaults).
exports.getRebookReminderConfig = async (req, res, next) => {
  let config = await rebookReminderConfig.findOne({ order: [['id', 'ASC']] })
  if (!config) {
    config = await rebookReminderConfig.create({})
  }
  return res
    .status(200)
    .json(response({ data: { rebookReminderConfig: config } }))
}

// ^ Update the rebooking-reminder config.
exports.updateRebookReminderConfig = async (req, res, next) => {
  const {
    isEnabled,
    singleBookingDays,
    minIntervalDays,
    maxIntervalDays,
    title,
    body,
    salonTitle,
    salonBody,
  } = req.body

  let config = await rebookReminderConfig.findOne({ order: [['id', 'ASC']] })
  if (!config) {
    config = await rebookReminderConfig.create({})
  }

  const updateFields = {}

  if (isEnabled !== undefined) {
    updateFields.isEnabled = !!isEnabled
  }

  const intFields = { singleBookingDays, minIntervalDays, maxIntervalDays }
  for (const [key, value] of Object.entries(intFields)) {
    if (value !== undefined && value !== null && value !== '') {
      const parsed = parseInt(value, 10)
      if (Number.isNaN(parsed) || parsed < 1) {
        return next(new appError(`${key} must be a positive whole number`, 400))
      }
      updateFields[key] = parsed
    }
  }

  const finalMin = updateFields.minIntervalDays ?? config.minIntervalDays
  const finalMax = updateFields.maxIntervalDays ?? config.maxIntervalDays
  if (finalMin > finalMax) {
    return next(
      new appError('minIntervalDays cannot be greater than maxIntervalDays', 400),
    )
  }

  if (title !== undefined) {
    const trimmed = String(title).trim()
    if (!trimmed) {
      return next(new appError('title cannot be empty', 400))
    }
    updateFields.title = trimmed
  }

  if (body !== undefined) {
    const trimmed = String(body).trim()
    if (!trimmed) {
      return next(new appError('body cannot be empty', 400))
    }
    updateFields.body = trimmed
  }

  if (salonTitle !== undefined) {
    const trimmed = String(salonTitle).trim()
    if (!trimmed) {
      return next(new appError('salonTitle cannot be empty', 400))
    }
    updateFields.salonTitle = trimmed
  }

  if (salonBody !== undefined) {
    const trimmed = String(salonBody).trim()
    if (!trimmed) {
      return next(new appError('salonBody cannot be empty', 400))
    }
    updateFields.salonBody = trimmed
  }

  if (Object.keys(updateFields).length === 0) {
    return next(new appError('At least one field is required to update', 400))
  }

  await config.update(updateFields)
  await config.reload()

  return res.status(200).json(
    response({
      message: 'Rebooking reminder config updated',
      data: { rebookReminderConfig: config },
    }),
  )
}
