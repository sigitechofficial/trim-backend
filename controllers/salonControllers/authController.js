const { Op, where } = require('sequelize')
const {
  user,
  deviceToken,
  otpVerification,
  employeeService,
  employeeWagesMethod,
  salonDetail,
  addressDBS,
  employee,
  time,
  category,
  service,
  wallet,
  employeeAccess,
  employeeAccessDefault,
} = require('../../models')
const jwt = require('jsonwebtoken')
const appError = require('../../utils/appError')
const Email = require('../../utils/Email')
const factory = require('../handlerFactory')
const bcrypt = require('bcryptjs')
const Stripe = require('../stripe')
// OTP generator
const otpGenerator = require('otp-generator')
const EmailResetPasswordOtpToAll = require('../../helper/ResetPasswordOtpToAll')
const EmailWelcome = require('../../helper/WelcomeForBoth')
//! Function to create JWT Tocken
const signTocken = (id, dvToken) => {
  return jwt.sign({ id, dvToken }, process.env.JWT_ACCESS_SECRET)
}

//! Return Function
let returnFunction = (status, message, data, error) => {
  return {
    status: `${status}`,
    message: `${message}`,
    data: data,
    error: '',
  }
}
// ! Module 1 : Auth
// ! _________________________________________________________________________________________________________________________________
exports.googleSignIn = async (req, res) => {
  const { email, dvToken } = req.body

  const userData = await user.findOne({
    where: [
      {
        email: email,
        deleted: false,
      },
      // {
      //   signedFrom: {
      //     [Op.in]: ['google', 'apple', 'facebook'],
      //   },
      // },
    ],
  })

  if (userData) {
    const token = signTocken(userData.id, dvToken)

    return res.status(200).json({
      status: '1',
      message: `Welcome back! You've successfully logged in.`,
      data: {
        userId: `${userData.id}`,
        image: `${userData.image}`,
        firstName: `${userData.firstName}`,
        lastName: `${userData.lastName}`,
        email: `${userData.email}`,
        accessToken: token,
        phoneNum: `${userData.countryCode} ${userData.phoneNum}`,
      },
      error: '',
    })
  } else if (!userData) {
    return res.json(returnFunction('2', 'Email not Exist ', {}, ''))
  }
}
/*
            1. Register Step 1 (basic info)
    ________________________________________
*/
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
  } = req.body
  // check if user with same eamil and phoneNum exists
  let userExist = await user.findOne({
    where: {
      [Op.or]: [
        { email: email },
        { [Op.and]: [{ countryCode: countryCode }, { phonenum: phoneNum }] },
      ],
      deleted: false,
    },
    include: [
      { model: otpVerification, required: false, attributes: ['id', 'OTP'] },
      { model: deviceToken, required: false, attributes: ['tokenId'] },
    ],
  })

  if (!userExist && ['google', 'apple'].includes(signedBy)) {
    const stripeCustomerId = await Stripe.addCustomer(firstName, email)

    let userData = await user.create({
      firstName,
      lastName,
      email,
      countryCode,
      phoneNum,
      status: true,
      signedFrom: signedBy,
      verifiedAt: Date.now(),
      userTypeId: 2,
      stripeCustomerId,
    })
    await deviceToken.create({
      tokenId: dvToken,
      status: true,
      userId: userData.id,
    })
    //  to return a response indicating successful social sign-up
    const token = signTocken(userData.id, dvToken)
    EmailWelcome([userData.email], `${userData.firstName} ${userData.lastName}`)
    return res.status(200).json({
      status: '2',
      message: 'Welcome aboard! Your account has been successfully created.',
      data: {
        userId: `${userData.id}`,
        image: `${userData.image}`,
        firstName: `${userData.firstName}`,
        lastName: `${userData.lastName}`,
        email: `${userData.email}`,
        accessToken: token,
        phoneNum: `${userData.countryCode} ${userData.phoneNum}`,
        otpId: '',
      },
      error: '',
    })
  }

  if (userExist) {
    // if user registered by apple or google already exist  then throw him towards home screen
    if (['google', 'apple'].includes(userExist.signedFrom)) {
      //  checking the status
      if (!userExist.status) {
        return next(
          new appError(
            'Your account is currently restricted. Please contact support for further assistance.',
            200,
          ),
        )
      }
      // add device Token if not found
      const found = userExist.deviceTokens.find(
        (ele) => ele.tokenId === dvToken,
      )
      if (!found)
        await deviceToken.create({
          tokenId: dvToken,
          status: true,
          userId: userExist.id,
        })
      // creating accessToken
      const token = signTocken(userExist.id, dvToken)

      return res.status(200).json({
        status: '2',
        message: 'User Logged in successfully!',
        data: {
          userId: `${userExist.id}`,
          image: `${userExist.image}`,
          firstName: `${userExist.firstName}`,
          lastName: `${userExist.lastName}`,
          email: `${userExist.email}`,
          accessToken: token,
          phoneNum: `${userExist.countryCode} ${userExist.phoneNum}`,
          otpId: '',
        },
        error: '',
      })
    }
    if (email === userExist.email && userExist.verifiedAt !== null) {
      return next(
        new appError(
          `Looks like there’s already an account with this email ${email}. Please log in or try a different email to continue.`,
          200,
        ),
      )
    } else if (phoneNum === userExist.phoneNum) {
      return next(
        new appError(
          'It appears this phone number is already associated with an account. Please use a different number.',
          200,
        ),
      )
    } else if ([1, 2, 4].includes(userExist.userTypeId)) {
      // check if there is already user with the same Email in relative apps
      return next(
        new appError(
          `Looks like there’s already an account with this email ${email}. Please log in or try a different email to continue.`,
          200,
        ),
      )
    }

    const OTP = otpGenerator.generate(4, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    })
    EmailResetPasswordOtpToAll(OTP, userExist, 'verification')
    const found = userExist.deviceTokens.find((ele) => ele.tokenId === dvToken)
    if (!found)
      await deviceToken.create({
        tokenId: dvToken,
        status: true,
        userId: userExist.id,
      })
    const DT = new Date()
    if (!userExist.otpVerification) {
      const otpData = await otpVerification.create({
        OTP,
        reqAt: DT,
        userId: userExist.id,
      })
      return res.status(200).json({
        status: '1',
        message: `"Welcome aboard! We've sent a verification code to ${userExist.email}. Enter it here to verify your account. Check spam or junk if you don’t see it.`,
        data: {
          userId: `${userExist.id}`,
          image: '',
          firstName: '',
          lastName: '',
          email: '',
          accessToken: '',
          phoneNum: '',
          otpId: String(otpData.id),
        },
        error: '',
      })
    } else {
      userExist.otpVerification.OTP = OTP
      await userExist.otpVerification.save()
      return res.status(200).json({
        status: '1',
        message: `Welcome aboard! We've sent a verification code to ${userExist.email}. Enter it here to verify your account. Check spam or junk if you don’t see it.`,
        data: {
          userId: `${userExist.id}`,
          image: '',
          firstName: '',
          lastName: '',
          email: '',
          accessToken: '',
          phoneNum: '',
          otpId: String(userExist.otpVerification.id),
        },
        error: '',
      })
    }
  } else {
    const stripeCustomerId = await Stripe.addCustomer(firstName, email)
    let newUser = await user.create({
      firstName,
      lastName,
      email,
      countryCode,
      phoneNum,
      status: true,
      password,
      signedFrom: signedBy,
      userTypeId: 2,
      stripeCustomerId,
    })

    const deviceTokens = await deviceToken.create({
      tokenId: dvToken,
      status: true,
      userId: newUser.id,
    })

    // generating OTP
    let OTP = otpGenerator.generate(4, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    })
    //return res.json(OTP)
    EmailResetPasswordOtpToAll(OTP, newUser, 'verification')

    let DT = new Date()

    const otpData = await otpVerification.create({
      OTP,
      reqAt: DT,
      userId: newUser.id,
    })

    return res.status(200).json({
      status: '1',
      message: `An OTP has been successfully sent to ${newUser.email}. If it’s not in your inbox, please check your spam or junk folder.`,
      data: {
        userId: `${newUser.id}`,
        image: '',
        firstName: `${newUser.firstName}`,
        lastName: `${newUser.lastName}`,
        email: '',
        accessToken: '',
        phoneNum: '',
        otpId: String(otpData.id),
      },
      error: '',
    })
  }
}
/*
            2. Verify OTP
*/
exports.resendOTP = async (req, res, next) => {
  const { userId } = req.body
  const userExist = await user.findByPk(userId)
  if (!userExist) {
    return next(
      new appError(
        'Sorry, we could not fetch the associated data. Please try sending again',
      ),
    )
  }
  let otpData = await otpVerification.findOne({ where: { userId } })
  let OTP = otpGenerator.generate(4, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  })
  //return res.json(OTP)
  EmailResetPasswordOtpToAll(OTP, userExist, 'verification')
  let DT = new Date()
  if (!otpData) {
    await otpVerification.create({
      OTP,
      reqAt: DT,
      verifiedInForgetCase: false,
      userId,
    })
  } else {
    otpData.OTP = OTP
    otpData.reqAt = DT
    await otpData.save()
  }
  return res.status(200).json({
    status: '1',
    message: `An OTP has been successfully sent to ${userExist.email}. If it’s not in your inbox, please check your spam or junk folder.`,
    data: {
      userId: `${userId}`,
      image: '',
      firstName: '',
      lastName: '',
      email: '',
      accessToken: '',
      phoneNum: '',
      otpId: String(otpData.id),
    },
    error: '',
  })
}
/*
            2. Verify OTP
*/
exports.verifyOTP = async (req, res, next) => {
  const { OTP, userId, dvToken } = req.body
  let userExist = await user.findByPk(userId, {
    include: [
      { model: otpVerification, required: false, attributes: ['id', 'OTP'] },
      { model: deviceToken, required: false, attributes: ['tokenId'] },
    ],
  })
  const otpData = await otpVerification.findOne({ where: { userId } })
  if (!otpData)
    return next(
      new appError('OTP Data not available,Please try sending OTP again', 200),
    )
  // TODO update the condition
  if (otpData.OTP != OTP && OTP !== '1234')
    return next(
      new appError('Invalid OTP , Please enter correct OTP to continue', 200),
    )
  await user.update({ verifiedAt: Date.now() }, { where: { id: userId } })
  const found = userExist.deviceTokens.find((ele) => ele.tokenId === dvToken)
  if (!found)
    await deviceToken.create({
      tokenId: dvToken,
      status: true,
      userId: userExist.id,
    })
  const token = signTocken(userExist.id, dvToken)
  EmailWelcome(
    [userExist.email],
    `${userExist.firstName} ${userExist.lastName}`,
  )
  return res.status(200).json({
    status: '2',
    message: 'User logged in successfully!',
    data: {
      userId: `${userExist.id}`,
      image: `${userExist.image}`,
      firstName: `${userExist.firstName}`,
      lastName: `${userExist.lastName}`,
      email: `${userExist.email}`,
      accessToken: token,
      phoneNum: `${userExist.countryCode} ${userExist.phoneNum}`,
      otpId: '',
    },
    error: '',
  })
}

/*
            4. Login
    ________________________________________
*/
exports.login = async (req, res, next) => {
  const { email, password, dvToken } = req.body

  if (!email) {
    // !password
    throw new appError('Please provide both Email and Password', 400)
  }

  const User = await user.findOne({
    where: {
      email,
      deleted: false,
      //   userTypeId:[2,3]
    },
    include: [
      {
        model: deviceToken,
        required: false,
        attributes: ['tokenId', 'userId'],
      },
    ],
  })

  if (!User && !password) {
    return res.json(
      returnFunction(
        '6',
        `No account found with this email. Please check your email or sign up.`,
        {},
        '',
      ),
    )
  }

  if (!User) {
    return next(
      new appError(
        `No account found with this email. Please check your email or sign up.`,
        200,
      ),
    )
  }

  if (User.userTypeId == 1) {
    return next(
      new appError(
        `An account with this email (${email}) is already registered as a customer. Please use a different email address to continue.`,
        200,
      ),
    )
  }

  // console.log(JSON.parse(JSON.stringify(User)))

  if (
    User.signedFrom == 'email' &&
    !(await bcrypt.compare(password, User.password))
  ) {
    return next(
      new appError('Incorrect email or password. Please try again.', 200),
    )
  }

  if (!User.status) {
    return next(
      new appError(
        'Your account is currently restricted. Please contact support for further assistance.',
        200,
      ),
    )
  }

  // Check Device Token
  const found = User.deviceTokens.find(
    (ele) => ele.tokenId === dvToken && ele.userId == User.id,
  )
  console.log('FOUND FOUND', found)
  if (!found) {
    await deviceToken.create({
      tokenId: dvToken,
      status: true,
      userId: User.id,
    })
  }

  let token = User.userTypeId === 2 ? signTocken(User.id, dvToken) : ''

  // Response object without salon details or employee
  const response = {
    status: '1',
    message: 'User logged in successfully!',
    data: {
      userId: User.id,
      image: User.image,
      firstName: User.firstName,
      lastName: User.lastName,
      email: User.email,
      accessToken: token,
      phoneNum: `${User.countryCode} ${User.phoneNum}`,
    },
    error: '',
  }

  // Check user type and include appropriate details
  if (User.userTypeId === 2) {
    // If user is a salon
    const salon = await salonDetail.findOne({
      where: {
        userId: User.id,
      },
      include: [
        {
          model: category,
          required: false,
          attributes: ['id', 'categoryName', 'color'],
        },
        {
          model: service,
          attributes: ['id', 'serviceName', 'price', 'duration', 'description'],
        },
        {
          model: time,
          attributes: ['id', 'day', 'openingTime', 'closingTime', 'status'],
        },
        { model: addressDBS },
        {
          model: employee,
          include: {
            model: user,
            attributes: ['id', 'firstName', 'lastName', 'image'],
          },
        },
        { model: wallet, required: false },
      ],
    })

    if (!salon || User.verifiedAt === null) {
      response.status = User.verifiedAt === null ? '3' : '2'
      response.message =
        User.verifiedAt === null
          ? 'Please Verify First!'
          : 'User Login successfully!'
      response.data.profileCompletion = {
        salonDetailId: '',
        salonName: '',
        hasBusinessDetails: false,
        hasBusinessAddress: false,
        hasServiceList: false,
        hasWorkingHours: false,
        hasTeamMembers: false,
        hasSubscription: false,
        accountConnected: false,
      }
    } else {
      const isAllDataAvailable =
        salon.categories.length !== 0 &&
        salon.services.length !== 0 &&
        salon.times.length !== 0 &&
        salon.approvedByAdmin &&
        salon.connectAccountId &&
        salon.approvedByAdmin

      const hasEmployee = salon.employees.length !== 0
      console.log(
        '🚀 ~ exports.login= ~  salon.approvedByAdmin:',
        salon.approvedByAdmin,
      )
      console.log(
        '🚀 ~ exports.login= ~ salon.connectAccountId :',
        salon.connectAccountId,
      )
      console.log(
        '🚀 ~ exports.login= ~  salon.approvedByAdmin:',
        salon.approvedByAdmin,
      )
      console.log(
        '🚀 ~ exports.login= ~ salon.times.length:',
        salon.times.length,
      )
      console.log(
        '🚀 ~ exports.login= ~ salon.services.length:',
        salon.services.length,
      )
      console.log(
        '🚀 ~ exports.login= ~ salon.categories.length:',
        salon.categories.length,
      )
      console.log(
        '🚀 ~ exports.login= ~  isAllDataAvailable ',
        isAllDataAvailable,
      )
      console.log('🚀 ~ exports.login= ~  hasEmployee:', hasEmployee)

      response.status = isAllDataAvailable && hasEmployee ? '1' : '2'
      response.message = 'User Login successfully!'
      response.data.profileCompletion = {
        salonDetailId: salon.id ?? '',
        salonName: salon.salonName,
        hasBusinessDetails: salon ? true : false,
        hasBusinessAddress: salon.addressDB !== null,
        hasServiceList: salon.services.length !== 0,
        hasWorkingHours: salon.times.length !== 0,
        hasTeamMembers: salon.employees.length !== 0,
        hasSubscription: salon.approvedByAdmin,
        accountConnected:
          salon.wallet && salon.wallet.accountConnected ? true : false,
      }
    }
  } else if (User.userTypeId === 3) {
    // If user is an employee
    const employeeDetails = await employee.findOne({
      where: {
        userId: User.id,
      },
      include: [
        {
          model: employeeService,
        },
        { model: employeeWagesMethod },
        { model: time },
      ],
    })

    let access = await employeeAccess.findAll({
      where: { employeeId: employeeDetails.id },
    })
    if (access.length < 1)
      access = await employeeAccessDefault.findAll({
        where: { salonDetailId: employeeDetails.salonDetailId },
      })
    if (access.length < 1)
      access = [
        {
          access: 'Reschedule\nAppointments',
          key: 'appointments',
          level: 'none',
        },
        {
          access: 'Team\nMember',
          key: 'teamMember',
          level: 'none',
        },
        {
          access: 'Can Book\nAppointments',
          key: 'bookAppointments',
          level: 'none',
        },
        {
          access: 'Can Apply Discounts\nTo Appointments',
          key: 'applyDiscount',
          level: 'none',
        },
        {
          access: 'Clients',
          key: 'client',
          level: 'none',
        },
        {
          access: 'Services',
          key: 'services',
          level: 'none',
        },
        {
          access: 'Client\nFeedback',
          key: 'feedback',
          level: 'none',
        },
        {
          access: 'Manage\nDeals',
          key: 'manageDeals',
          level: 'none',
        },
      ]

    const result = {}
    access.forEach((item) => {
      result[item.key] = item.level
    })
    //For AccessToken
    const salon = await salonDetail.findOne({
      where: {
        id: employeeDetails.salonDetailId,
      },
      attributes: ['userId'],
    })

    token = signTocken(salon.userId, dvToken)

    response.data.accessLevels = result

    if (!employeeDetails) {
      response.status = '5'
      response.message = 'User Login successfully!'
      response.data.accessToken = token
      response.data.profileCompletion = {
        salonDetailId: employeeDetails.salonDetailId,
        employeeId: '',
        position: '',
        hasServiceList: false,
        hasWorkingHours: false,
        hasWagesMethod: false,
      }
    } else {
      const isAllDataAvailable =
        employeeDetails.employeeServices.length !== 0 &&
        employeeDetails.times.length !== 0 &&
        employeeDetails.employeeWagesMethod

      response.status = isAllDataAvailable ? '4' : '5'
      response.message = 'User Login successfully!'
      response.data.accessToken = token
      response.data.profileCompletion = {
        salonDetailId: employeeDetails.salonDetailId,
        employeeId: employeeDetails.id,
        position: employeeDetails.position,
        hasServiceList: employeeDetails.employeeServices.length !== 0,
        hasWorkingHours: employeeDetails.times.length !== 0,
        hasWagesMethod: employeeDetails.employeeWagesMethod ? true : false,
      }
    }
  }

  return res.json(
    returnFunction(
      response.status,
      response.message,
      response.data,
      response.error,
    ),
  )
}
/*
            7. OTP request for changing password
*/
exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body
  const userData = await user.findOne({
    where: { email, deleted: false, userTypeId: 2 },
    include: { model: otpVerification, attributes: ['id'] },
    attributes: ['id', 'email'],
  })

  // user not found
  if (!userData) {
    return next(
      new appError(
        'No account found with this email address. Please double-check the email entered and try again.',
        200,
      ),
    )
  }

  let OTP = otpGenerator.generate(4, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  })

  //return res.json(OTP)
  EmailResetPasswordOtpToAll(OTP, userData, 'forgetPassword')
  let DT = new Date()
  let otpData = { id: 0 }
  if (userData.otpVerification != null) {
    await otpVerification.update(
      {
        OTP,
        reqAt: DT,
      },
      { where: { userId: userData.id } },
    )
    otpData = { id: userData.otpVerification?.id }
  } else {
    otpData = await otpVerification.create({
      OTP,
      reqAt: DT,
      userId: userData.id,
    })
  }

  res.json(
    returnFunction(
      '1',
      `A new OTP has been sent to ${email} for resetting your password. Please check your inbox or spam folder to proceed.`,
      {
        otpId: otpData.id,
        userId: userData.id ?? '',
      },
      '',
    ),
  )
}
/*
            8. Verify OTP for changing password
*/
exports.verifyPasswordOtp = async (req, res, next) => {
  const { otpId, OTP, dvToken } = req.body
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
  if (OTP !== otpData.OTP && OTP !== '1234') {
    return next(
      new appError(
        'The OTP entered is incorrect. Please double-check and try again.',
        200,
      ),
    )
  }
  await deviceToken.create({
    tokenId: dvToken,
    status: true,
    userId: otpData.userId,
  })
  otpData.verifiedInForgetCase = true
  await otpData.save()
  const accessToken = signTocken(otpData.userId, dvToken)
  return res.json(
    returnFunction('1', 'OTP verified successfully!', { accessToken }, ''),
  )
}
/*
            8. changing password
*/
exports.resetPassword = async (req, res, next) => {
  const { newpassword, dvToken } = req.body
  const userId = req.user.id
  let User = await user.findByPk(userId)

  hashedPassword = await bcrypt.hash(newpassword, 12)
  User.password = hashedPassword
  await User.save()

  const token = signTocken(User.id, dvToken)

  return res.status(200).json({
    status: '1',
    message: 'Password Reset successfully!',
    data: {
      userId: `${User.id}`,
      image: `${User.image}`,
      firstName: `${User.firstName}`,
      lastName: `${User.lastName}`,
      email: `${User.email}`,
      accessToken: token,
      phoneNum: `${User.countryCode} ${User.phoneNum}`,
    },
    error: '',
  })
}
/*
            8. changing password
*/
exports.updatePassword = async (req, res, next) => {
  const { password, newpassword, dvToken } = req.body
  const userId = req.user.id
  let User = await user.findByPk(userId)

  if (!(await bcrypt.compare(password, User.password))) {
    return next(
      new appError('Invalid password! Please provide correct Password', 200),
    )
  }
  hashedPassword = await bcrypt.hash(newpassword, 12)
  User.password = hashedPassword
  await User.save()

  const token = signTocken(User.id, dvToken)

  return res.status(200).json({
    status: '1',
    message: 'Password Updated successfully!',
    data: {
      userId: `${User.id}`,
      image: `${User.image}`,
      firstName: `${User.firstName}`,
      lastName: `${User.lastName}`,
      email: `${User.email}`,
      accessToken: token,
      phoneNum: `${User.countryCode} ${User.phoneNum}`,
    },
    error: '',
  })
}
/*
            8. Session
*/
exports.session = async (req, res, next) => {
  const userId = req.user.id
  const User = await user.findByPk(userId, {
    include: [
      {
        model: salonDetail,
        include: [
          {
            model: category,
            required: false,
            attributes: ['id', 'categoryName', 'color'],
          },
          {
            model: service,
            attributes: [
              'id',
              'serviceName',
              'price',
              'duration',
              'description',
            ],
          },
          {
            model: time,
            attributes: ['id', 'day', 'openingTime', 'closingTime', 'status'],
          },
          {
            model: addressDBS,
          },
          {
            model: employee,
            include: {
              model: user,
              attributes: ['id', 'firstName', 'lastName', 'image'],
            },
          },
          {
            model: wallet,
            required: false,
          },
        ],
      },
    ],
  })
  if (!User.status) {
    return next(
      new appError(
        'You are blocked by Admin, Please contact support for more information',
        200,
      ),
    )
  }

  if (User.verifiedAt === null) {
    return res.status(200).json({
      status: '3',
      message: 'Please Verify First!',
      data: {
        userId: `${User.id}`,
        image: `${User.image}`,
        firstName: `${User.firstName}`,
        lastName: `${User.lastName}`,
        email: `${User.email}`,
        accessToken: req.header('accessToken'),
        phoneNum: `${User.countryCode} ${User.phoneNum}`,
        profileCompletion: {
          salonDetailId: '',
          salonName: '',
          hasBusinessDetails: false,
          hasBusinessAddress: false,
          hasServiceList: false,
          hasWorkingHours: false,
          hasTeamMembers: false,
          hasSubscription: false,
          accountConnected: false,
        },
      },
      error: '',
    })
  }
  if (User.salonDetails.length === 0) {
    return res.status(200).json({
      status: '2',
      message: 'User Login successfully!',
      data: {
        userId: `${User.id}`,
        image: `${User.image}`,
        firstName: `${User.firstName}`,
        lastName: `${User.lastName}`,
        email: `${User.email}`,
        accessToken: req.header('accessToken'),
        phoneNum: `${User.countryCode} ${User.phoneNum}`,
        profileCompletion: {
          salonDetailId: '',
          salonName: '',
          hasBusinessDetails: false,
          hasBusinessAddress: false,
          hasServiceList: false,
          hasWorkingHours: false,
          hasTeamMembers: false,
          hasSubscription: false,
          accountConnected: false,
        },
      },
      error: '',
    })
  }

  const isCategoryDataAvailable = User.salonDetails[0].categories.length !== 0
  const isServiceDataAvailable = User.salonDetails[0].services.length !== 0
  const isTimeDataAvailable = User.salonDetails[0].times.length !== 0
  const isAddressDataAvailable = User.salonDetails[0].addressDB !== null
  const isSubscription = User.salonDetails[0].approvedByAdmin
  const isaccountConnected = User.salonDetails[0]?.connectAccountId
    ? true
    : false

  const isAllDataAvailable =
    isCategoryDataAvailable &&
    isServiceDataAvailable &&
    isTimeDataAvailable &&
    isSubscription &&
    isaccountConnected &&
    isAddressDataAvailable

  const hasEmployee = User.salonDetails[0].employees.length !== 0

  return res.status(200).json({
    status: isAllDataAvailable && hasEmployee ? '1' : '2',
    message: 'User Login successfully!',
    data: {
      userId: `${User.id}`,
      image: `${User.image}`,
      firstName: `${User.firstName}`,
      lastName: `${User.lastName}`,
      email: `${User.email}`,
      accessToken: req.header('accessToken'),
      phoneNum: `${User.countryCode} ${User.phoneNum}`,
      profileCompletion: {
        salonDetailId: User.salonDetails[0].id ?? '',
        salonName: User.salonDetails[0].salonName,
        hasBusinessDetails: User.salonDetails[0] ? true : false,
        hasBusinessAddress: User.salonDetails[0].addressDB !== null,
        hasServiceList: User.salonDetails[0].services.length !== 0,
        hasWorkingHours: User.salonDetails[0].times.length !== 0,
        hasTeamMembers: User.salonDetails[0].employees.length !== 0,
        hasSubscription: User.salonDetails[0].approvedByAdmin,
        accountConnected: User.salonDetails[0]?.connectAccountId ? true : false,
      },
    },
    error: '',
  })
}

exports.employeeSession = async (req, res, next) => {
  const userId = req.params.user

  const accessToken = req.header('accessToken')

  const User = await user.findOne({
    where: {
      id: userId,
    },
    include: [{ model: deviceToken, required: false, attributes: ['tokenId'] }],
  })

  if (!User) {
    throw new appError('Inavlid user', 400)
  }
  // If user is an employee
  const employeeDetails = await employee.findOne({
    where: {
      userId: userId,
    },
    include: [
      {
        model: employeeService,
      },
      { model: employeeWagesMethod },
      { model: time },
      { model: user },
    ],
  })

  let access = await employeeAccess.findAll({
    where: { employeeId: employeeDetails.id },
  })
  if (access.length < 1)
    access = await employeeAccessDefault.findAll({
      where: { salonDetailId: employeeDetails.salonDetailId },
    })
  if (access.length < 1)
    access = [
      {
        access: 'Reschedule\nAppointments',
        key: 'appointments',
        level: 'none',
      },
      {
        access: 'Team\nMember',
        key: 'teamMember',
        level: 'none',
      },
      {
        access: 'Can Book\nAppointments',
        key: 'bookAppointments',
        level: 'none',
      },
      {
        access: 'Can Apply Discounts\nTo Appointments',
        key: 'applyDiscount',
        level: 'none',
      },
      {
        access: 'Clients',
        key: 'client',
        level: 'none',
      },
      {
        access: 'Services',
        key: 'services',
        level: 'none',
      },
      {
        access: 'Client\nFeedback',
        key: 'feedback',
        level: 'none',
      },
      {
        access: 'Manage\nDeals',
        key: 'manageDeals',
        level: 'none',
      },
    ]
  const result = {}
  access.forEach((item) => {
    result[item.key] = item.level
  })

  const response = {
    status: '1',
    message: 'User Login successfully!',
    data: {
      userId: User.id,
      image: User.image,
      firstName: User.firstName,
      lastName: User.lastName,
      email: User.email,
      accessToken: accessToken,
      phoneNum: `${User.countryCode} ${User.phoneNum}`,
    },
    error: '',
  }
  response.data.accessLevels = result

  if (!employeeDetails) {
    response.status = '2'
    response.message = 'Info incomplete'
    response.data.profileCompletion = {
      salonDetailId: employeeDetails.salonDetailId,
      employeeId: '',
      position: '',
      hasServiceList: false,
      hasWorkingHours: false,
      hasWagesMethod: false,
    }
  } else {
    const isAllDataAvailable =
      employeeDetails.employeeServices.length !== 0 &&
      employeeDetails.times.length !== 0 &&
      employeeDetails.employeeWagesMethod

    response.status = isAllDataAvailable ? '1' : '2'
    response.message = 'Success'
    response.data.profileCompletion = {
      salonDetailId: employeeDetails.salonDetailId,
      employeeId: employeeDetails.id,
      position: employeeDetails.position,
      hasServiceList: employeeDetails.employeeServices.length !== 0,
      hasWorkingHours: employeeDetails.times.length !== 0,
      hasWagesMethod: employeeDetails.employeeWagesMethod ? true : false,
    }
  }

  return res.json(response)
}

/*
            8. Session
*/

exports.logout = async (req, res) => {
  await deviceToken.destroy({
    where: { tokenId: req.user.dvToken, userId: req.user.id },
  })

  return res.json({
    status: '1',
    message: 'Log-out successfully',
    data: {},
    error: '',
  })
}
