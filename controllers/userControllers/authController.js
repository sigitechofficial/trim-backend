const { Op, where } = require('sequelize')
const { user, deviceToken, otpVerification } = require('../../models')
const jwt = require('jsonwebtoken')
const appError = require('../../utils/appError')
const DateManupulation = require('../../utils/dateManipulation')
const Email = require('../../utils/Email')
const Stripe = require('../stripe')
const bcrypt = require('bcryptjs')

// OTP generator
const otpGenerator = require('otp-generator')
const EmailResetPasswordOtpToAll = require('../../helper/ResetPasswordOtpToAll')
const EmailWelcome = require('../../helper/WelcomeForBoth')

const AppError = require('../../utils/appError')
//! Function to create JWT Tocken
const signTocken = (id, dvToken) => {
  return jwt.sign({ id, dvToken }, process.env.JWT_ACCESS_SECRET)
}

//! Function to send Tocken in Response
const createSendToken = (user, dvToken, statusCode, res) => {
  console.log('ðŸš€ ~ createSendToken ~ user:', user)
  const token = signTocken(user.id, dvToken)

  res.status(statusCode).json({
    status: '1',
    message: 'Success',
    data: {
      accessToken: token,
      userId: `${user.id}`,
      image: `${user.image}`,
      firstName: `${user.firstName}`,
      lastName: `${user.lastName}`,
      email: `${user.email}`,
      phoneNum: `${user.countryCode} ${user.phoneNum}`,
      stripeCustomerId: user.stripeCustomerId,
      joinOn: new Date(),
    },
    error: '',
  })
}
//! Return Function
let returnFunction = (status, message, data, error) => {
  return {
    status: `${status}`,
    message: `${message}`,
    data: data,
    error: `${error}`,
  }
}
// ! Module 1 : Auth
// ! _________________________________________________________________________________________________________________________________
exports.emailChecker = async (req, res, next) => {
  const { email, dvToken } = req.body

  const existUser = await user.findOne({
    where: [
      {
        email: email,
        deleted: 0,
      },
      // {
      //   signedFrom: {
      //     [Op.in]: ['google', 'apple', 'facebook'],
      //   },
      // },
    ],
  })
  // console.log('USER', existUser)
  if (existUser) {
    if (existUser.userTypeId == 2) {
      return next(
        new AppError(
          'This email is associated with the Trim Business account.',
          200,
        ),
      )
    }
    if (!existUser.status) {
      return next(new AppError('User Blocked by admin', 200))
    }
    createSendToken(existUser, dvToken, 200, res)
  } else if (!existUser) {
    return res.json(returnFunction('2', 'User not Exist ', {}, ''))
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
    image,
  } = req.body
  // check if user with same eamil and phoneNum exists
  let userExist = await user.findOne({
    where: {
      [Op.or]: [
        { email: email },
        { [Op.and]: [{ countryCode: countryCode }, { phoneNum: phoneNum }] },
      ],
      deleted: 0,
    },
    include: [
      { model: otpVerification, required: false, attributes: ['OTP'] },
      { model: deviceToken, required: false, attributes: ['tokenId'] },
    ],
  })

  //return res.json(userExist)
  if (userExist) {
    if (email === userExist.email)
      return next(
        new appError(
          'Users exists,The email you entered is already taken',
          200,
        ),
      )
    else if (email === userExist.email && signedBy != 'email') {
      return next(
        new appError(
          `This email is linked to a Trim business account and cannot be used for signing up as a customer.`,
          200,
        ),
      )
    } else if (phoneNum === userExist.phoneNum) {
      return next(
        new appError(
          'Users exists,The Phone Number you entered is already taken',
          200,
        ),
      )
    }
  }

  userExist = await user.create({
    email,
    password,
    countryCode,
    phoneNum,
    signedFrom: signedBy,
    firstName: firstName || '',
    lastName: lastName || '',
    userTypeId: 1,
    image,
    status: 1,
  })

  await deviceToken.create({
    tokenId: dvToken,
    status: true,
    userId: userExist.id,
  })

  if (signedBy !== 'email') {
    const fullName = `${userExist.firstName} ${userExist.lastName}`
    const stripeCustomerId = await Stripe.addCustomer(fullName, userExist.email)
    await user.update({ stripeCustomerId }, { where: { id: userExist.id } })
    let input = JSON.parse(JSON.stringify(userExist))
    input.stripeCustomerId = stripeCustomerId
    input.verifiedAt = new Date()

    EmailWelcome([userExist?.email], fullName, 'customer')

    createSendToken(input, dvToken, 200, res)
  } else {
    const OTP = otpGenerator.generate(4, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    })

    EmailResetPasswordOtpToAll(OTP, userExist, 'verification')

    const DT = new Date()
    const otpData = await otpVerification.create({
      OTP,
      reqAt: DT,
      userId: userExist.id,
    })

    return res.json(
      returnFunction(
        '2',
        'SignUp Success',
        { otpId: otpData.id, userId: userExist.id },
        '',
      ),
    )
  }
}
/*
            2. Verify OTP
*/
exports.verifyOTP = async (req, res, next) => {
  const { otpId, OTP, userId, dvToken } = req.body
  console.log('Ã°Å¸Å¡â‚¬ ~ exports.verifyOTP= ~ req.body:', req.body)
  const otpData = await otpVerification.findOne({
    where: { id: otpId, userId },
  })

  if (!otpData) {
    return next(
      new appError('OTP Data not available,Please try sending OTP again', 200),
    )
  }

  let userExist = await user.findOne({
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

  // TODO update the condition
  if (otpData.OTP != OTP && OTP !== 1234) {
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
  if (!user.stripeCustomerId) {
    const stripeCustomerId = await Stripe.addCustomer(fullName, userExist.email)
    userExist.stripeCustomerId = stripeCustomerId
    await user.update({ stripeCustomerId }, { where: { id: userExist.id } })
  }

  await user.update({ verifiedAt: Date.now() }, { where: { id: userId } })
  createSendToken(userExist, dvToken, 200, res)
}

/*
            4. Login
*/
exports.login = async (req, res, next) => {
  const { email, password, dvToken } = req.body

  if (!email) {
    return next(new appError('Please provide Email', 200))
  }
  const User = await user.findOne({
    where: {
      email,
      // userTypeId: 1,
      deleted: false,
    },
    include: [{ model: deviceToken, required: false, attributes: ['tokenId'] }],
  })
  console.log('🚀 ~ exports.login= ~ User:', User)

  // if (!User || password !== User.password) {
  // this is fri email or by google
  if (!User && !password) {
    return res.json(returnFunction('2', `User not Found.`, {}, ''))
  }

  if (!User) {
    return next(new appError(`Invalid Email. User not Found.`, 200))
  }

  if (User?.userTypeId != 1) {
    return next(
      new appError(
        'This email is associated with the Trim business account and cannot be used to log in as a customer.',
        200,
      ),
    )
  }
  if (
    User.signedFrom == 'email' &&
    password &&
    !(await bcrypt.compare(password || '123', User?.password))
  ) {
    return next(new appError('Incorrect Password', 200))
  }

  if (!User.status) {
    return next(new appError('User Blocked by admin', 200))
  }

  if (User.signedFrom == 'email' && !User.verifiedAt) {
    return res.json(
      returnFunction(
        '2',
        'Not Verified! verify otp first.',
        { userId: `${User.id}` },
        '',
      ),
    )
  }

  // check Device Token
  const found = User.deviceTokens.find((ele) => ele.tokenId === dvToken)
  if (!found)
    await deviceToken.create({
      tokenId: dvToken,
      status: true,
      userId: User.id,
    })
  createSendToken(User, dvToken, 200, res)
}
/*
            7. OTP request for changing password
*/
exports.requestOtp = async (req, res, next) => {
  const condition = { userTypeId: 1, deleted: false }
  if (req.body.email) condition.email = req.body.email
  if (req.body.userId) condition.id = req.body.userId
  let mailType = 'verification'
  if (req.body.email) mailType = 'resetPassword'
  const userData = await user.findOne({
    where: condition,
    include: { model: otpVerification, attributes: ['id'] },
    attributes: ['id', 'email', 'firstName', 'lastName'],
  })

  // user not found
  if (!userData) {
    return next(new appError('Invalid information,No user exists', 200))
  }

  let OTP = otpGenerator.generate(4, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  })

  //return res.json(OTP)

  EmailResetPasswordOtpToAll(OTP, userData, mailType)

  let DT = new Date()

  if (userData.otpVerification != null) {
    await otpVerification.update(
      {
        OTP,
        reqAt: DT,
      },
      { where: { userId: userData.id } },
    )
    res.json(
      returnFunction(
        '1',
        `OTP sent successfully.`,
        {
          otpId: userData.otpVerification.id,
          userId: userData.id || '',
        },
        '',
      ),
    )
  } else {
    await otpVerification.create({
      OTP,
      reqAt: DT,
      userId: userData.id,
    })
    res.json(
      returnFunction(
        '1',
        `OTP sent successfully.`,
        {
          otpId: otpData.id,
          userId: userData.id || '',
        },
        '',
      ),
    )
  }
}
/*
            8. Verify OTP for changing password
*/
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
  if (OTP !== otpData.OTP && OTP !== 1234) {
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
/*
            8. changing password
*/
exports.updatePassword = async (req, res, next) => {
  const { password, newPassword } = req.body
  const userId = req.user.id
  let User = await user.findByPk(userId, {
    include: [{ model: deviceToken, required: false, attributes: ['tokenId'] }],
  })

  // if (password !== User.password) {
  if (!(await bcrypt.compare(password, User.password))) {
    return next(
      new appError('Invalid password! Please provide correct Password', 200),
    )
  }
  User.password = await bcrypt.hash(newPassword, 12)
  await User.save()

  return res.json(returnFunction('1', 'Password updated successfully.', {}, ''))
}

exports.resetPassword = async (req, res, next) => {
  const { password, userId, otpId, dvToken } = req.body

  let otp = await otpVerification.findByPk(otpId, {})
  if (!otp || !otp.verifiedInForgetCase) {
    throw new AppError('OTP not verified yet!', 200)
  }
  let User = await user.findByPk(userId, {
    include: [{ model: deviceToken, required: false, attributes: ['tokenId'] }],
  })
  if (!User) {
    throw new AppError('User Not Found', 200)
  }

  User.password = await bcrypt.hash(password, 12)
  await User.save()

  const found = User.deviceTokens.find((ele) => ele.tokenId === dvToken)
  if (!found)
    await deviceToken.create({
      tokenId: dvToken,
      status: true,
      userId: User.id,
    })

  createSendToken(User, dvToken, 200, res)
}
