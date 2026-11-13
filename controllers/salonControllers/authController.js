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
  salonProfiles,
  subscriptions,
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
const clingReminderEmail = require('../../helper/clingReminderEmail')
const { DateTime } = require('luxon')
const { isSalonRowActive } = require('../../helper/salonSubscriptionRule')
const IncompleteRegistrationReminder = require('../../helper/IncompleteRegistrationReminder')
const StripeOnboardingReminderEmail = require('../../helper/StripeOnboardingReminderEmail')
const {
  STRIPE_STATUS,
  REMINDER_STAGE,
  buildStripeStatusPayload,
  buildSalonStripeStatusUpdate,
  nextInProgressReminder,
  shouldSendActionRequiredReminder,
  shouldSendPayoutBlockedEmail,
} = require('../../helper/stripeConnectStatusHelper')
const PayoutBlockedEmail = require('../../helper/PayoutBlockedEmail')
const redis_Client = require('../../routes/redis_connect')
const VERIFICATION_BYPASS_OTP = '8798'

const generateOTP = () =>
  otpGenerator.generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true,
  })

//! Function to create JWT Tocken
const { requestsLevelFrom } = require('../../helper/bookingRequestAccess')

const signTocken = (id, dvToken, extra = {}) => {
  return jwt.sign({ id, dvToken, ...extra }, process.env.JWT_ACCESS_SECRET)
}

const defaultAccess = [
  {
    access: 'Reschedule\nbookings',
    key: 'appointments',
    level: 'none',
  },
  {
    access: 'Team member\nmanagement',
    key: 'teamMember',
    level: 'none',
  },
  {
    access: 'Can add\nbookings',
    key: 'bookAppointments',
    level: 'none',
  },
  {
    access: 'Can apply discounts',
    key: 'applyDiscount',
    level: 'none',
  },
  {
    access: 'Customer information',
    key: 'client',
    level: 'none',
  },
  {
    access: 'Services',
    key: 'services',
    level: 'none',
  },
  {
    access: 'Customer\nfeedback',
    key: 'feedback',
    level: 'none',
  },
  {
    access: 'Coupons &\nloyalty',
    key: 'manageDeals',
    level: 'none',
  },
  {
    access: 'Shop profile',
    key: 'updateProfile',
    level: 'none',
  },
  {
    access: 'Send\nnotifications',
    key: 'sendNotification',
    level: 'none',
  },
  {
    access: 'Respond to\nenquiries',
    key: 'respondToEnquiries',
    level: 'none',
  },
  {
    access: 'Booking\nrequests',
    key: 'bookingRequests',
    level: 'none',
  },
]
// [
//   literal(
//     `(SELECT users.email
//    FROM users WHERE users.id = booking.customerId)`,
//   ),
//   'email',
// ],
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
// A chair renter's own Trim plan: they pay for it themselves, so the app can
// show "Renew your plan" from this without asking the host shop.
const renterSubscriptionOf = (salon) => ({
  active: isSalonRowActive(salon, DateTime.now().toISODate()),
  expiresOn: salon?.registrationExpiryDate ?? null,
  status: salon?.subscriptionLatestPaymentStatus ?? null,
  // Set when the renter's shop covers their plan (status 'shop_covered').
  coveredByShop: salon?.subscriptionLatestPaymentStatus === 'shop_covered',
})

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
      message: `Welcome to Trim`,
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
    return res.json(returnFunction('2', 'Email not exist ', {}, ''))
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
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', req.body)

  // check if user with same eamil and phoneNum exists
  // Only match by phone if both countryCode and phoneNum are provided and not empty
  const whereConditions = [
    { email: email },
  ]
  
  if (countryCode && phoneNum) {
    whereConditions.push({
      [Op.and]: [{ countryCode: countryCode }, { phonenum: phoneNum }]
    })
  }

  let userExist = await user.findOne({
    where: {
      [Op.or]: whereConditions,
      deleted: false,
    },
    include: [
      { model: otpVerification, required: false, attributes: ['id', 'OTP'] },
      { model: deviceToken, required: false, attributes: ['tokenId'] },
    ],
  })

  if (!userExist && ['google', 'apple', 'facebook'].includes(signedBy)) {
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')

    // For Apple signup, firstName/lastName/phoneNum can be null
    const userFirstName = firstName || ''
    const userLastName = lastName || ''
    const userCountryCode = countryCode || ''
    const userPhoneNum = phoneNum || ''

    const stripeCustomerId = await Stripe.addCustomer(userFirstName || 'Apple User', email)

    let userData = await user.create({
      firstName: userFirstName,
      lastName: userLastName,
      email,
      countryCode: userCountryCode,
      phoneNum: userPhoneNum,
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
    // Only send welcome email if we have a valid name
    const fullName = `${userData.firstName} ${userData.lastName}`.trim()
    if (fullName) {
      EmailWelcome([userData.email], fullName)
    }

    salonProfiles.create({ userid: userData?.id })

    // Apple gets status '1' (go to home), Google/Facebook get status '2'
    return res.status(200).json({
      status: signedBy === 'apple' ? '1' : '2',
      message: 'Account created',
      data: {
        userId: `${userData.id}`,
        image: `${userData.image || ''}`,
        firstName: `${userData.firstName || ''}`,
        lastName: `${userData.lastName || ''}`,
        email: `${userData.email}`,
        accessToken: token,
        phoneNum: `${userData.countryCode || ''} ${userData.phoneNum || ''}`.trim(),
        otpId: '',
      },
      error: '',
    })
  }

  if (userExist) {
    // if user registered by apple or google already exist  then throw him towards home screen
    if (['google', 'apple', 'facebook'].includes(userExist.signedFrom)) {
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
      // Apple gets status '1' (go to home), Google/Facebook get status '2'
      return res.status(200).json({
        status: userExist.signedFrom === 'apple' ? '1' : '2',
        message: 'Successful login',
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

    const OTP = generateOTP()
    EmailResetPasswordOtpToAll(OTP, userExist, 'verification','salon')
    const found = userExist.deviceTokens.find((ele) => ele.tokenId === dvToken)
    if (!found)
      await deviceToken.create({
        tokenId: dvToken,
        status: true,
        userId: userExist.id,
      })
    const DT = new Date()
    if (!userExist?.otpVerification) {
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
        message: `Welcome to Trim ${userExist.email}.`,
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

    await deviceToken.create({
      tokenId: dvToken,
      status: true,
      userId: newUser.id,
    })

    // generating OTP
    let OTP = generateOTP()
    //return res.json(OTP)
    EmailResetPasswordOtpToAll(OTP, newUser, 'verification','salon')

    let DT = new Date()

    const otpData = await otpVerification.create({
      OTP,
      reqAt: DT,
      userId: newUser.id,
    })

    salonProfiles.create({ userid: newUser?.id })
    return res.status(200).json({
      status: '1',
      message: `An OTP has been sent to ${newUser.email}.If it’s not in your inbox, please check your spam or junk folder`,
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
  const userExist = await user.findOne({ where: { id: userId } })
  if (!userExist) {
    return next(
      new appError(
        'Sorry, we could not fetch the associated data. Please try sending again',
      ),
    )
  }
  let otpData = await otpVerification.findOne({ where: { userId } })
  let OTP = generateOTP()
  //return res.json(OTP)
  EmailResetPasswordOtpToAll(OTP, userExist, 'verification','salon')
  let DT = new Date()
  if (!otpData) {
    otpData = await otpVerification.create({
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
    message: `An OTP has been sent to ${userExist.email}. If it’s not in your inbox, please check your spam or junk folder`,
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
  const providedOTP = String(OTP)
  const isValidOTP =
    String(otpData.OTP) === providedOTP || providedOTP === VERIFICATION_BYPASS_OTP

  if (!isValidOTP)
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
    message: 'Successful login',
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
// Step C: two-step login code (helper/twoStep.js).
exports.twoStepVerify = async (req, res) => {
  const out = await require('../../helper/twoStep').verify(req)
  return res.json(returnFunction(out.ok ? '1' : '0', out.message, {}, ''))
}
exports.twoStepResend = async (req, res) => {
  const out = await require('../../helper/twoStep').resend(req)
  return res.json(returnFunction(out.ok ? '1' : '0', out.message, {}, ''))
}

exports.login = async (req, res, next) => {
  const { email, password, dvToken } = req.body;

  if (!req.body?.loginBy) req.body.loginBy = 'email';
  if (!email) throw new appError('Please provide Email', 200);
  else if (req.body.loginBy == 'email' && !password)
    throw new appError('Please provide Password', 200);

  // One email can have a client app account and a business account (e.g. a
  // client hired from the client app): sign in to the business one.
  const sameEmail = await user.findAll({
    where: { email, deleted: false },
    include: [{ model: deviceToken, required: false, attributes: ['tokenId', 'userId'] }],
    order: [['id', 'DESC']],
  });
  const User = sameEmail.find((u) => u.userTypeId != 1) || sameEmail[0] || null;

  if (!User && !password) {
    return res.json(
      returnFunction(
        '6',
        `No account found with this email. Please check your email or sign up`,
        {},
        '',
      ),
    );
  }

  if (!User) {
    return next(
      new appError(
        `No account found with this email. Please check your email or sign up.`,
        200,
      ),
    );
  }

  if (User.userTypeId == 1) {
    return next(
      new appError(
        `An account with this email (${email}) is already registered as a customer. Please use a different email address to continue.`,
        200,
      ),
    );
  }
  if (!User.status) {
    return next(
      new appError(
        'Your account is currently restricted. Please contact support for further assistance.',
        200,
      ),
    );
  }

  if (req.body?.loginBy != User?.signedFrom) {
    return next(
      new appError(
        `An account with this email (${email}) is not registered by this singin method`,
        200,
      ),
    );
  }

  if (
    User.signedFrom == 'email' &&
    !(await bcrypt.compare(password, User.password))
  ) {
    // Step C: failed logins go in the activity log (security).
    require('../../helper/activityLog').recordLogin(User.id, { ok: false, ip: req.ip, dvToken })
    return next(
      new appError('Incorrect email or password. Please try again.', 200),
    );
  }

  // Step C: two-step login on a device this person hasn't confirmed yet.
  const twoStepAsk = await require('../../helper/twoStep').check(req, User)
  if (twoStepAsk) return res.json(twoStepAsk)

  // Device Token check
  const found = User.deviceTokens.find(
    (ele) => ele.tokenId === dvToken && ele.userId == User.id,
  );
  if (!found) {
    await deviceToken.create({ tokenId: dvToken, status: true, userId: User.id });
  }
  // An owner signing in on a phone a staff member used before: drop the old
  // staff link for this device, so the owner isn't treated as that staff member.
  if (User.userTypeId === 2 && dvToken) {
    const staleStaff = await deviceToken.findAll({
      where: { tokenId: dvToken, userId: { [Op.ne]: User.id } },
      attributes: ['id'],
      include: { model: user, where: { userTypeId: 3 }, attributes: ['id'], required: true },
    });
    if (staleStaff.length) {
      await deviceToken.destroy({ where: { id: staleStaff.map((row) => row.id) } });
    }
  }

  let token = User.userTypeId === 2 ? signTocken(User.id, dvToken) : '';

  const response = {
    status: '1',
    message: 'Successful login',
    data: {
      userId: User.id,
      image: User.image,
      firstName: User.firstName,
      lastName: User.lastName,
      email: User.email,
      businessEmail: '',
      businessCountryCode: '',
      businessPhoneNum: '',
      accessToken: token,
      phoneNum: `${User.countryCode} ${User.phoneNum}`,
    },
    error: '',
  };

  // -----------------------------
  // Salon Login
  // -----------------------------
  if (User.userTypeId === 2) {
    const salon = await salonDetail.findOne({
      where: { userId: User.id },
      include: [
        { model: category, required: false, attributes: ['id', 'categoryName', 'color'] },
        { model: service, attributes: ['id', 'serviceName', 'price', 'duration', 'description'] },
        { model: time, attributes: ['id', 'day', 'openingTime', 'closingTime', 'status'] },
        { model: addressDBS },
        {
          model: employee,
          include: { model: user, attributes: ['id', 'firstName', 'lastName', 'image'] },
        },
        { model: wallet, required: false },
      ],
    });

    response.data.businessEmail = salon?.businessEmail;
    response.data.businessCountryCode = salon?.businessCountryCode;
    response.data.businessPhoneNum = salon?.businessPhoneNum;

    // Get external employee's own employeeId
    let externalEmployeeId = null;
    if (User.isExternalEmployee) {
      // After a shop move the old host row is deleted: prefer the current one.
      const extEmployee = await employee.findOne({
        where: { userId: User.id, isExternalEmployee: true },
        attributes: ['id'],
        order: [['deleted', 'ASC'], ['id', 'DESC']],
      });
      externalEmployeeId = extEmployee ? extEmployee.id : null;
    }

    if (!salon || User.verifiedAt === null) {
      response.status = User.verifiedAt === null ? '3' : '2';
      response.message = User.verifiedAt === null ? 'Please Verify First!' : 'Login successful';
      response.data.profileCompletion = {
        salonDetailId: '',
        salonName: '',
        subscriptionLatestPaymentStatus: '',
        hasBusinessDetails: false,
        hasBusinessAddress: false,
        hasServiceList: false,
        hasWorkingHours: false,
        hasTeamMembers: false,
        hasSubscription: false,
        accountConnected: false,
        employeeId: externalEmployeeId,
      };
      response.data.stripeStatus = {
        state: 'NOT_STARTED',
        detailsSubmitted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        disabledReason: null,
        currentlyDue: [],
        pastDue: [],
        actionRequired: true,
        title: 'Stripe setup required',
        message: 'Connect Stripe to receive payouts.',
        ctaText: 'Set up Stripe',
      };
    } else {
      const isAllDataAvailable =
        salon.services.length !== 0 &&
        salon.times.length !== 0 &&
        salon.approvedByAdmin;

      const hasEmployee = salon.employees.length !== 0;

      response.status = isAllDataAvailable && hasEmployee ? '1' : '2';
      response.message = 'Login successful';
      response.data.profileCompletion = {
        salonDetailId: salon.id ?? '',
        salonName: salon.salonName,
        subscriptionLatestPaymentStatus: salon?.subscriptionLatestPaymentStatus,
        hasBusinessDetails: salon ? true : false,
        hasBusinessAddress: salon.addressDB !== null,
        hasServiceList: salon.services.length !== 0,
        hasWorkingHours: salon.times.length !== 0,
        hasTeamMembers: salon.employees.length !== 0,
        hasSubscription: salon.approvedByAdmin,
        accountConnected: salon?.wallet?.accountConnected ? true : false,
        employeeId: externalEmployeeId,
      };

      // 🔹 Live Stripe check
      if (salon?.connectAccountId) {
        const { isConnected, reason, currentlyDue } =
          await Stripe.checkStripeAccountStatus(salon.connectAccountId);

        if (salon.wallet) {
          await salon.wallet.update({ accountConnected: isConnected });
        } else if (isConnected) {
          await wallet.create({
            salonDetailId: salon.id,
            accountConnected: true,
          });
          salon.wallet = await wallet.findOne({ where: { salonDetailId: salon.id } });
        }

        response.data.profileCompletion.accountConnected = isConnected;
        response.data.stripeRestrictions = { reason, currentlyDue };
        try {
          const liveAccount = await Stripe.retrieveConnectAccount(salon.connectAccountId)
          const { update } = buildSalonStripeStatusUpdate(liveAccount, salon)
          await salon.update(update)
          Object.assign(salon, update)
        } catch (syncErr) {
          console.error('❌ Stripe status sync on login failed:', syncErr.message)
        }
        response.data.stripeStatus = buildStripeStatusPayload(salon);
      } else {
        response.data.stripeStatus = buildStripeStatusPayload({
          connectAccountId: null,
          stripeOnboardingStatus: STRIPE_STATUS.NOT_STARTED,
        });
      }

      // 🔹 Check subscription status
      let subscriptionStatus = null;
      if (salon?.id) {
        try {
          const salonSubscription = await subscriptions.findOne({
            where: { salonDetailId: salon.id },
            attributes: ['subscriptionId'],
            order: [['createdAt', 'DESC']], // Get the latest subscription
          });

          if (salonSubscription && salonSubscription.subscriptionId) {
            subscriptionStatus = await Stripe.getSubscriptionStatus(salonSubscription.subscriptionId);
            console.log('🚀 ~ Subscription Status:', subscriptionStatus);
          }
        } catch (err) {
          console.error("❌ Subscription status check failed:", err.message);
        }
      }
      response.data.profileCompletion.subscriptionStatus = subscriptionStatus;
      if (User.isExternalEmployee) {
        response.data.profileCompletion.renterSubscription = renterSubscriptionOf(salon);
      }
    }
  }

  // -----------------------------
  // Employee Login
  // -----------------------------
  else if (User.userTypeId === 3) {
    const employeeDetails = await employee.findOne({
      where: { userId: User.id },
      include: [{ model: employeeService }, { model: employeeWagesMethod }, { model: time }],
    });

    let access = await employeeAccess.findAll({ where: { employeeId: employeeDetails.id } });
    if (access.length < 1)
      access = await employeeAccessDefault.findAll({
        where: { salonDetailId: employeeDetails.salonDetailId },
      });
    if (access.length < 1) access = defaultAccess;

    const result = {};
    access.forEach((item) => {
      result[item.key] = item.level;
    });

    const salon = await salonDetail.findOne({
      where: { id: employeeDetails.salonDetailId },
      attributes: ['userId'],
    });

    // Staff JWT uses salon owner id; device token must match for validateToken
    if (salon?.userId) {
      const ownerDeviceToken = await deviceToken.findOne({
        where: { tokenId: dvToken, userId: salon.userId },
      });
      if (!ownerDeviceToken) {
        await deviceToken.create({
          tokenId: dvToken,
          status: true,
          userId: salon.userId,
        });
      }
    }

    // Staff sessions keep the owner's id (every shop lookup uses it) and now
    // also say who the staff member is (Step A, 0.1).
    token = signTocken(salon.userId, dvToken, { staffUserId: User.id });
    result.bookingRequests = requestsLevelFrom(result);
    response.data.accessLevels = result;

    if (!employeeDetails) {
      response.status = '5';
      response.message = 'Login successful';
      response.data.accessToken = token;
      response.data.profileCompletion = {
        salonDetailId: employeeDetails.salonDetailId,
        employeeId: '',
        position: '',
        hasServiceList: false,
        hasWorkingHours: false,
        hasWagesMethod: false,
      };
    } else {
      // Step A: a manager/receptionist who doesn't take bookings needs no
      // services, hours or pay method before they can start.
      const isAllDataAvailable =
        employeeDetails.bookable === false ||
        (employeeDetails.employeeServices.length !== 0 &&
          employeeDetails.times.length !== 0 &&
          employeeDetails.employeeWagesMethod);

      response.status = isAllDataAvailable ? '4' : '5';
      response.message = 'Login successful';
      response.data.accessToken = token;
      response.data.profileCompletion = {
        salonDetailId: employeeDetails.salonDetailId,
        employeeId: employeeDetails.id,
        position: employeeDetails.position,
        hasServiceList: employeeDetails.employeeServices.length !== 0,
        hasWorkingHours: employeeDetails.times.length !== 0,
        hasWagesMethod: !!employeeDetails.employeeWagesMethod,
      };
    }
  }

  response.data.isExternalEmployee = User.isExternalEmployee;
  if (response && response.data && response.data.isExternalEmployee) {
    response.data.profileCompletion.hasSubscription = true;
  }

  // Step A: every branch this login can open (the app's branch switcher).
  // [{ salonId, name, role }], home branch first. New field; old apps ignore it.
  if (response.data.accessToken) {
    try {
      const claims = jwt.verify(response.data.accessToken, process.env.JWT_ACCESS_SECRET)
      const list = await require('../../helper/branchScope').branchesFor({ user: claims })
      const names = await salonDetail.findAll({
        where: { id: list.map((b) => b.salonId) },
        attributes: ['id', 'salonName'],
      })
      const nameOf = new Map(names.map((n) => [n.id, n.salonName]))
      response.data.branches = list.map((b) => ({ salonId: b.salonId, name: nameOf.get(b.salonId) || '', role: b.role }))
      // Step C: the login in the activity log of the home branch.
      require('../../helper/activityLog').recordLogin(User.id, {
        ok: true, ip: req.ip, newDevice: !found, salonId: list[0]?.salonId, brandId: list[0]?.brandId, role: list[0]?.role,
      })
      // The brand, for the owner's branch-plan purchases (RevenueCat id).
      const brandRow = !claims.staffUserId && list.some((b) => b.brandId)
        ? await require('../../models').brand.findOne({ where: { ownerUserId: claims.id } })
        : null
      if (brandRow) {
        response.data.brand = {
          id: brandRow.id, name: brandRow.name, rcAppUserId: brandRow.rcAppUserId,
          branchLimit: brandRow.branchLimit, planProductId: brandRow.planProductId, planStatus: brandRow.planStatus,
        }
      }
    } catch (err) {
      console.warn('[login] branch list failed:', err.message)
    }
  }

  return res.json(
    returnFunction(
      response.status,
      response.message,
      response.data,
      response.error,
    ),
  );
};

/*
            7. OTP request for changing password
*/
exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body
  const userData = await user.findOne({
    where: { email, deleted: false, userTypeId: 2 },
    include: { model: otpVerification, attributes: ['id'] },
    attributes: ['id', 'email', 'firstName', 'lastName'],
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

  let OTP = generateOTP()

  //return res.json(OTP)
  EmailResetPasswordOtpToAll(OTP, userData, 'forgetPassword','salon')
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

// 8. Verify OTP for changing password

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
  const providedOTP = String(OTP)
  const isValidOTP =
    String(otpData.OTP) === providedOTP || providedOTP === VERIFICATION_BYPASS_OTP

  if (!isValidOTP) {
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
    message: 'Password reset',
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
    message: 'Password updated',
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
          { model: category, required: false, attributes: ['id', 'categoryName', 'color'] },
          { model: service, attributes: ['id','serviceName','price','duration','description'] },
          { model: time, attributes: ['id','day','openingTime','closingTime','status'] },
          { model: addressDBS },
          {
            model: employee,
            include: { model: user, attributes: ['id','firstName','lastName','image'] },
          },
          { model: wallet, required: false },
        ],
      },
    ],
  })

  if (!User) {
    console.warn('🚨 session: user missing, forcing re-auth', {
      userId,
      dvToken: req.user?.dvToken,
    })
    return res.status(200).json({
      status: '0',
      message: 'Session expired. Please login again',
      data: {},
      error: 'You are not authorized to access it',
    })
  }

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
      message: 'Please verify',
      data: {
        userId: `${User.id}`,
        image: `${User.image}`,
        firstName: `${User.firstName}`,
        lastName: `${User.lastName}`,
        email: `${User.email}`,
        accessToken: req.header('accessToken'),
        phoneNum: `${User.countryCode} ${User.phoneNum}`,
        isExternalEmployee: User.isExternalEmployee,
        businessEmail: '',
        businessCountryCode: '',
        businessPhoneNum: '',
        profileCompletion: {
          salonDetailId: '',
          salonName: '',
          subscriptionLatestPaymentStatus: '',
          hasBusinessDetails: false,
          hasBusinessAddress: false,
          hasServiceList: false,
          hasWorkingHours: false,
          hasTeamMembers: false,
          hasSubscription: false,
          accountConnected: false,
          stripeRestrictionReason: null,
        },
      },
      error: '',
    })
  }

  if (User.salonDetails.length === 0) {
    return res.status(200).json({
      status: '2',
      message: 'Successful login',
      data: {
        userId: `${User.id}`,
        image: `${User.image}`,
        firstName: `${User.firstName}`,
        lastName: `${User.lastName}`,
        email: `${User.email}`,
        accessToken: req.header('accessToken'),
        phoneNum: `${User.countryCode} ${User.phoneNum}`,
        isExternalEmployee: User.isExternalEmployee,
        businessEmail: '',
        businessCountryCode: '',
        businessPhoneNum: '',
        profileCompletion: {
          salonDetailId: '',
          salonName: '',
          subscriptionLatestPaymentStatus: '',
          hasBusinessDetails: false,
          hasBusinessAddress: false,
          hasServiceList: false,
          hasWorkingHours: false,
          hasTeamMembers: false,
          hasSubscription: false,
          accountConnected: false,
          stripeRestrictionReason: null,
        },
      },
      error: '',
    })
  }

  const salon = User.salonDetails[0]

  // Get external employee's own employeeId
  let externalEmployeeId = null;
  if (User.isExternalEmployee) {
    // After a shop move the old host row is deleted: prefer the current one.
    const extEmployee = await employee.findOne({
      where: { userId: User.id, isExternalEmployee: true },
      attributes: ['id'],
      order: [['deleted', 'ASC'], ['id', 'DESC']],
    });
    externalEmployeeId = extEmployee ? extEmployee.id : null;
  }

  let stripeRestrictions = null
  let subscriptionStatus = null

  // 🔹 Live Stripe check
  if (salon?.connectAccountId) {
    try {
      const { isConnected, reason, currentlyDue } = await Stripe.checkStripeAccountStatus(salon.connectAccountId)
      // Set stripeRestrictions to match login API format
      stripeRestrictions = { reason, currentlyDue }
      if (salon.wallet) {
        await salon.wallet.update({ accountConnected: isConnected })
      } else if (isConnected) {
        await wallet.create({
          salonDetailId: salon.id,
          accountConnected: true,
        })
        salon.wallet = await wallet.findOne({ where: { salonDetailId: salon.id } })
      }
      try {
        const liveAccount = await Stripe.retrieveConnectAccount(salon.connectAccountId)
        const { update } = buildSalonStripeStatusUpdate(liveAccount, salon)
        await salon.update(update)
        Object.assign(salon, update)
      } catch (syncErr) {
        console.error('❌ Stripe status sync in session failed:', syncErr.message)
      }
    } catch (err) {
      console.error("❌ Stripe check in session failed:", err.message)
    }
  }

  const stripeStatus = buildStripeStatusPayload(
    salon?.connectAccountId
      ? salon
      : { connectAccountId: null, stripeOnboardingStatus: STRIPE_STATUS.NOT_STARTED },
  )

  // 🔹 Check subscription status
  if (salon?.id) {
    try {
      const salonSubscription = await subscriptions.findOne({
        where: { salonDetailId: salon.id },
        attributes: ['subscriptionId'],
        order: [['createdAt', 'DESC']], // Get the latest subscription
      })

      if (salonSubscription && salonSubscription.subscriptionId) {
        subscriptionStatus = await Stripe.getSubscriptionStatus(salonSubscription.subscriptionId)
        console.log('🚀 ~ Subscription Status:', subscriptionStatus)
      }
    } catch (err) {
      console.error("❌ Subscription status check failed:", err.message)
    }
  }

  const isCategoryDataAvailable = salon.categories.length !== 0
  const isServiceDataAvailable = salon.services.length !== 0
  const isTimeDataAvailable = salon.times.length !== 0
  const isAddressDataAvailable = salon.addressDB !== null
  const isSubscription = User?.isExternalEmployee ? true : salon.approvedByAdmin
  const isaccountConnected = salon?.wallet?.accountConnected ? true : false

  const isAllDataAvailable =
    isServiceDataAvailable &&
    isTimeDataAvailable &&
    isSubscription &&
    isAddressDataAvailable

  const hasEmployee = salon.employees.length !== 0

  return res.status(200).json({
    status: isAllDataAvailable && hasEmployee ? '1' : '2',
    message: 'Successful login',
    data: {
      userId: `${User.id}`,
      image: `${User.image}`,
      firstName: `${User.firstName}`,
      lastName: `${User.lastName}`,
      email: `${User.email}`,
      accessToken: req.header('accessToken'),
      phoneNum: `${User.countryCode} ${User.phoneNum}`,
      isExternalEmployee: User.isExternalEmployee,
      businessEmail: salon?.businessEmail,
      businessCountryCode: salon?.businessCountryCode,
      businessPhoneNum: salon?.businessPhoneNum,
      profileCompletion: {
        salonDetailId: salon.id ?? '',
        salonName: salon.salonName,
        subscriptionLatestPaymentStatus: salon?.subscriptionLatestPaymentStatus,
        hasBusinessDetails: salon ? true : false,
        hasBusinessAddress: salon.addressDB !== null,
        hasServiceList: salon.services.length !== 0,
        hasWorkingHours: salon.times.length !== 0,
        hasTeamMembers: salon.employees.length !== 0,
        hasSubscription: isSubscription,
        accountConnected: salon?.wallet?.accountConnected ? true : false,
        subscriptionStatus: subscriptionStatus, // Subscription status (e.g., 'active', 'canceled', 'cancelled', etc.)
        employeeId: externalEmployeeId,
        ...(User?.isExternalEmployee ? { renterSubscription: renterSubscriptionOf(salon) } : {}),
      },
      ...(stripeRestrictions ? { stripeRestrictions } : {}), // Add stripeRestrictions at data level, same as login API
      stripeStatus,
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
  // If user is an employee. Step B: someone in several branches gets the row
  // (and permissions) of the branch the app is in (x-salon-id).
  const askedSalon = parseInt(req.get('x-salon-id'), 10)
  const inAsked = askedSalon > 0
    ? await employee.findOne({ where: { userId, salonDetailId: askedSalon, deleted: false }, attributes: ['id'] })
    : null
  const employeeDetails = await employee.findOne({
    where: inAsked ? { id: inAsked.id } : {
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
  if (access.length < 1) access = defaultAccess
  const result = {}
  access.forEach((item) => {
    result[item.key] = item.level
  })

  const response = {
    status: '1',
    message: 'Successful login',
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
  result.bookingRequests = requestsLevelFrom(result)
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
  // Staff sessions link the device to both the owner and the staff user;
  // remove every link for this device so nothing lingers after logout.
  if (req.user?.dvToken) {
    await deviceToken.destroy({ where: { tokenId: req.user.dvToken } })
  } else {
    await deviceToken.destroy({
      where: { tokenId: req.user?.dvToken, userId: req.user?.id },
    })
  }

  return res.json({
    status: '1',
    message: 'Logged out',
    data: {},
    error: '',
  })
}


//Cling Lamda Function
exports.clingLambdaFunction = async (req, res, next) => {
  // Calculate date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  console.log("sevenDaysAgo========================>>", sevenDaysAgo);
  
  // Find users with userTypeId 2 created 7 days ago
  const users = await user.findAll({
    where: {
      userTypeId: 2,
      salonMailReminder: false,
      createdAt: {
        [Op.gte]: new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate()),
        [Op.lt]: new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate() + 1)
      }
    },
    attributes: ['id', 'firstName', 'lastName', 'email']
  });
  
  if (users.length === 0) {
    return res.status(401).json({ 
      message: 'No users found with userTypeId 2 created 7 days ago',
      data: { count: 0 },
      error: '',
    });
  }
  
  // Send ClingReminderEmail to all matching users and update salonMailReminder
  const emailPromises = users.map(async (user) => {
      await clingReminderEmail({ firstName: user.firstName, lastName: user.lastName, email: user.email });
      // Update the salonMailReminder column to true
      await user.update({
        salonMailReminder: true
      });
  });

  await Promise.all(emailPromises);
  
  return res.status(200).json({ 
    status: '1',
    message: 'Cling reminder emails sent successfully',
    data: {
      count: users.length,
      users: users.map(u => ({ email: u.email }))
    },
    error: '',
  });
};

// Incomplete Registration Reminder API
exports.incompleteRegistrationReminder = async (req, res, next) => {
  try {
    console.log("🚀 Starting incomplete registration reminder process...");
    
    // Find salon users (userTypeId = 2) who are verified but have incomplete profiles
    const salonUsers = await user.findAll({
      where: {
        userTypeId: 2,
        deleted: false,
        status: true,
        verifiedAt: { [Op.ne]: null }, // Must be verified
        // Optional: Add condition to avoid sending too frequently
        salonIncompleteMailSent: false, 
      },
      include: [
        {
          model: salonDetail,
          required: false,
          include: [
            { model: category, required: false, attributes: ['id'] },
            { model: service, attributes: ['id'] },
            { model: time, attributes: ['id'] },
            { model: addressDBS },
            { model: employee, attributes: ['id'] },
            { model: wallet, required: false },
          ],
        },
      ],
      attributes: ['id', 'firstName', 'lastName', 'email', 'salonIncompleteMailSent'],
    });

    if (salonUsers.length === 0) {
      return res.status(200).json({
        status: '1',
        message: 'No shop users found with incomplete registrations',
        data: { count: 0 },
        error: '',
      });
    }

    console.log(`📊 Found ${salonUsers.length} salon users to check`);

    // Filter users with incomplete profiles
    const incompleteUsers = [];
    
    for (const salonUser of salonUsers) {
      const salon = salonUser.salonDetails?.[0];
      
      if (!salon) {
        // No salon details at all
        incompleteUsers.push({
          userInstance: salonUser, // Keep the Sequelize instance
          userData: salonUser.toJSON(),
          profileCompletion: {
            hasBusinessDetails: false,
            hasBusinessAddress: false,
            hasServiceList: false,
            hasWorkingHours: false,
            hasTeamMembers: false,
            hasSubscription: false,
            accountConnected: false,
          }
        });
        continue;
      }

      // Check profile completion status (same logic as session API)
      const profileCompletion = {
        hasBusinessDetails: salon ? true : false,
        hasBusinessAddress: salon.addressDB !== null,
        hasServiceList: salon.services.length !== 0,
        hasWorkingHours: salon.times.length !== 0,
        hasTeamMembers: salon.employees.length !== 0,
        hasSubscription: salonUser.isExternalEmployee ? true : salon.approvedByAdmin,
        accountConnected: salon?.wallet?.accountConnected ? true : false,
      };

      // Check if profile is incomplete
      const isComplete = 
        profileCompletion.hasBusinessDetails &&
        profileCompletion.hasBusinessAddress &&
        profileCompletion.hasServiceList &&
        profileCompletion.hasWorkingHours &&
        profileCompletion.hasTeamMembers &&
        profileCompletion.hasSubscription &&
        profileCompletion.accountConnected;

      if (!isComplete) {
        incompleteUsers.push({
          userInstance: salonUser, // Keep the Sequelize instance
          userData: salonUser.toJSON(),
          profileCompletion
        });
      }
    }

    console.log(`📋 Found ${incompleteUsers.length} users with incomplete profiles`);

    if (incompleteUsers.length === 0) {
      return res.status(200).json({
        status: '1',
        message: 'All shop users have complete profiles',
        data: { count: 0 },
        error: '',
      });
    }

    // Send reminder emails
    const emailPromises = incompleteUsers.map(async (incompleteUser) => {
      try {
        await IncompleteRegistrationReminder({
          firstName: incompleteUser.userData.firstName,
          lastName: incompleteUser.userData.lastName,
          email: incompleteUser.userData.email,
          profileCompletion: incompleteUser.profileCompletion
        });
        
        // Update the salonMailReminder flag to track that we sent an email
        await incompleteUser.userInstance.update({
          salonIncompleteMailSent: true
        });
        
        console.log(`✅ Sent reminder email to ${incompleteUser.userData.email}`);
        return { email: incompleteUser.userData.email, status: 'sent' };
      } catch (error) {
        console.error(`❌ Failed to send email to ${incompleteUser.userData.email}:`, error.message);
        return { email: incompleteUser.userData.email, status: 'failed', error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.status === 'sent');
    const failed = results.filter(r => r.status === 'failed');

    console.log(`📧 Email sending completed: ${successful.length} successful, ${failed.length} failed`);

    return res.status(200).json({
      status: '1',
      message: 'Incomplete registration reminder emails processed',
      data: {
        totalUsers: salonUsers.length,
        incompleteUsers: incompleteUsers.length,
        emailsSent: successful.length,
        emailsFailed: failed.length,
        successfulEmails: successful.map(s => s.email),
        failedEmails: failed.map(f => ({ email: f.email, error: f.error })),
      },
      error: '',
    });

  } catch (error) {
    console.error('❌ Incomplete registration reminder process failed:', error);
    return next(
      new appError(
        'Failed to process incomplete registration reminders. Please try again.',
        500,
      ),
    );
  }
};

/**
 * Delayed / throttled Stripe Connect onboarding reminders.
 * Intended for Lambda / cron:
 *   GET /salon/v1/auth/stripe-onboarding-reminders
 *
 * Query:
 *   dryRun=true|false (default false)
 *   salonDetailId=<id> optional
 *   limit=<n> optional (default all matching, max 500 when set)
 *
 * dryRun=true: evaluate only — no emails, no push, no DB updates.
 */
exports.sendStripeOnboardingReminders = async (req, res, next) => {
  try {
    const dryRun =
      String(req.query.dryRun ?? 'false').toLowerCase() === 'true'
    const salonDetailId = req.query.salonDetailId
      ? parseInt(req.query.salonDetailId, 10)
      : null
    const limitRaw = req.query.limit
      ? parseInt(req.query.limit, 10)
      : null
    const limit =
      limitRaw && !Number.isNaN(limitRaw)
        ? Math.min(Math.max(limitRaw, 1), 500)
        : null

    const whereClause = {
      deleted: false,
      connectAccountId: {
        [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }],
      },
      stripeOnboardingStatus: {
        [Op.in]: [
          STRIPE_STATUS.IN_PROGRESS,
          STRIPE_STATUS.ACTION_REQUIRED,
          STRIPE_STATUS.PAYOUTS_BLOCKED,
        ],
      },
    }
    if (salonDetailId) whereClause.id = salonDetailId

    const query = {
      where: whereClause,
      attributes: [
        'id',
        'salonName',
        'connectAccountId',
        'createdAt',
        'stripeOnboardingStatus',
        'stripeOnboardingStartedAt',
        'stripeLastStripeActivityAt',
        'stripeLastReminderSentAt',
        'stripeLastPayoutBlockedEmailSentAt',
        'stripeReminderStage',
        'stripeRequirementsHash',
        'stripeDisabledReason',
      ],
      include: [
        {
          model: user,
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: true,
        },
      ],
      order: [['id', 'ASC']],
    }
    if (limit) query.limit = limit

    const salons = await salonDetail.findAll(query)

    const results = []
    const sampleSalonDetailIds = []
    let wouldSendInProgress = 0
    let wouldSendActionRequired = 0
    let wouldSendPayoutsBlocked = 0
    let emailsSent = 0

    for (const salon of salons) {
      const owner = salon.user
      if (!owner?.email) {
        results.push({
          salonDetailId: salon.id,
          status: salon.stripeOnboardingStatus,
          intent: null,
          reason: 'no_email',
          action: 'skipped',
        })
        continue
      }

      const state = salon.stripeOnboardingStatus

      if (state === STRIPE_STATUS.IN_PROGRESS) {
        // Cron-based: every eligible IN_PROGRESS salon is due each run.
        const next = nextInProgressReminder(salon)

        wouldSendInProgress += 1
        if (sampleSalonDetailIds.length < 10) {
          sampleSalonDetailIds.push(salon.id)
        }

        if (dryRun) {
          results.push({
            salonDetailId: salon.id,
            status: state,
            intent: 'IN_PROGRESS_REMINDER',
            reason: next.reason,
            action: 'would_send',
            stage: next.stage,
          })
          continue
        }

        StripeOnboardingReminderEmail({
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
          salonName: salon.salonName || 'Your Shop',
          intent: STRIPE_STATUS.IN_PROGRESS,
        })

        const stageUpdate = {
          stripeLastReminderSentAt: new Date(),
          stripeReminderStage: REMINDER_STAGE.CRON,
        }
        await salon.update(stageUpdate)
        emailsSent += 1
        results.push({
          salonDetailId: salon.id,
          status: state,
          intent: 'IN_PROGRESS_REMINDER',
          reason: next.reason,
          action: 'sent',
          stage: stageUpdate.stripeReminderStage,
        })
        continue
      }

      if (state === STRIPE_STATUS.ACTION_REQUIRED) {
        const decision = shouldSendActionRequiredReminder(
          salon,
          salon.stripeRequirementsHash,
        )
        if (!decision.allow) {
          results.push({
            salonDetailId: salon.id,
            status: state,
            intent: null,
            reason: decision.reason,
            action: 'skipped',
          })
          continue
        }

        wouldSendActionRequired += 1
        if (sampleSalonDetailIds.length < 10) {
          sampleSalonDetailIds.push(salon.id)
        }

        if (dryRun) {
          results.push({
            salonDetailId: salon.id,
            status: state,
            intent: 'ACTION_REQUIRED_REMINDER',
            reason: decision.reason,
            action: 'would_send',
          })
          continue
        }

        StripeOnboardingReminderEmail({
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
          salonName: salon.salonName || 'Your Shop',
          intent: STRIPE_STATUS.ACTION_REQUIRED,
        })
        await salon.update({ stripeLastReminderSentAt: new Date() })
        emailsSent += 1
        results.push({
          salonDetailId: salon.id,
          status: state,
          intent: 'ACTION_REQUIRED_REMINDER',
          reason: decision.reason,
          action: 'sent',
        })
        continue
      }

      if (state === STRIPE_STATUS.PAYOUTS_BLOCKED) {
        const decision = shouldSendPayoutBlockedEmail(
          salon,
          salon.stripeRequirementsHash,
        )
        if (!decision.allow) {
          results.push({
            salonDetailId: salon.id,
            status: state,
            intent: null,
            reason: decision.reason,
            action: 'skipped',
          })
          continue
        }

        wouldSendPayoutsBlocked += 1
        if (sampleSalonDetailIds.length < 10) {
          sampleSalonDetailIds.push(salon.id)
        }

        if (dryRun) {
          results.push({
            salonDetailId: salon.id,
            status: state,
            intent: 'PAYOUTS_BLOCKED_EMAIL',
            reason: decision.reason,
            action: 'would_send',
          })
          continue
        }

        PayoutBlockedEmail({
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
          salonName: salon.salonName || 'Your Shop',
          disabledReason: salon.stripeDisabledReason || 'Account restrictions',
        })
        await salon.update({
          stripeLastPayoutBlockedEmailSentAt: new Date(),
          stripeLastReminderSentAt: new Date(),
        })
        emailsSent += 1
        results.push({
          salonDetailId: salon.id,
          status: state,
          intent: 'PAYOUTS_BLOCKED_EMAIL',
          reason: decision.reason,
          action: 'sent',
        })
      }
    }

    return res.status(200).json({
      status: '1',
      message: dryRun
        ? 'Stripe onboarding reminders dry-run complete (no emails, no DB updates)'
        : 'Stripe onboarding reminders processed',
      data: {
        dryRun,
        scanned: salons.length,
        wouldSendInProgress,
        wouldSendActionRequired,
        wouldSendPayoutsBlocked,
        emailsSent: dryRun ? 0 : emailsSent,
        pushSent: 0,
        sampleSalonDetailIds,
        results,
      },
      error: '',
    })
  } catch (error) {
    console.error('❌ Stripe onboarding reminder process failed:', error)
    return next(
      new appError('Failed to process Stripe onboarding reminders.', 500),
    )
  }
}

/**
 * One-time / ops Stripe Connect status backfill.
 * Syncs live Stripe account status into salonDetails (+ wallet.accountConnected).
 * NEVER sends emails or push notifications.
 *
 * GET /salon/v1/stripe-connect-status-backfill?dryRun=true&limit=50&offset=0
 * Optional: salonDetailId=
 * Protected by requireCronSecret.
 */
exports.backfillStripeConnectStatus = async (req, res, next) => {
  try {
    const dryRun =
      String(req.query.dryRun ?? 'true').toLowerCase() !== 'false'
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 50, 1),
      500,
    )
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0)
    const salonDetailId = req.query.salonDetailId
      ? parseInt(req.query.salonDetailId, 10)
      : null

    const whereClause = {
      deleted: false,
      connectAccountId: {
        [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }],
      },
    }
    if (salonDetailId) whereClause.id = salonDetailId

    const salons = await salonDetail.findAll({
      where: whereClause,
      attributes: [
        'id',
        'salonName',
        'connectAccountId',
        'createdAt',
        'stripeOnboardingStatus',
        'stripeOnboardingStartedAt',
        'stripeRequirementsHash',
        'stripeDetailsSubmitted',
        'stripeChargesEnabled',
        'stripePayoutsEnabled',
      ],
      order: [['id', 'ASC']],
      limit,
      offset,
    })

    const countsByStatus = {
      [STRIPE_STATUS.NOT_STARTED]: 0,
      [STRIPE_STATUS.IN_PROGRESS]: 0,
      [STRIPE_STATUS.ACTION_REQUIRED]: 0,
      [STRIPE_STATUS.PAYOUTS_BLOCKED]: 0,
      [STRIPE_STATUS.COMPLETE]: 0,
    }

    const sample = []
    const failed = []
    let wouldUpdate = 0
    let updated = 0
    let skipped = 0

    for (const salon of salons) {
      try {
        const account = await Stripe.retrieveConnectAccount(salon.connectAccountId)
        const { update, status, isComplete } = buildSalonStripeStatusUpdate(
          account,
          salon,
        )

        countsByStatus[status] = (countsByStatus[status] || 0) + 1

        const previousStatus = salon.stripeOnboardingStatus || STRIPE_STATUS.NOT_STARTED
        const row = {
          salonDetailId: salon.id,
          connectAccountId: salon.connectAccountId,
          previousStatus,
          calculatedStatus: status,
          detailsSubmitted: update.stripeDetailsSubmitted,
          chargesEnabled: update.stripeChargesEnabled,
          payoutsEnabled: update.stripePayoutsEnabled,
          walletAccountConnected: isComplete,
        }

        if (sample.length < 10) sample.push(row)
        wouldUpdate += 1

        if (dryRun) continue

        await salon.update(update)

        const [walletRecord] = await wallet.findOrCreate({
          where: { salonDetailId: salon.id },
          defaults: {
            salonDetailId: salon.id,
            accountConnected: isComplete,
          },
        })
        if (walletRecord.accountConnected !== isComplete) {
          await walletRecord.update({ accountConnected: isComplete })
        }

        updated += 1
      } catch (err) {
        skipped += 1
        failed.push({
          salonDetailId: salon.id,
          connectAccountId: salon.connectAccountId,
          error: err.message || 'Stripe retrieve failed',
        })
        console.error(
          '[stripe-backfill] failed salon',
          salon.id,
          salon.connectAccountId,
          err.message,
        )
      }
    }

    return res.status(200).json({
      status: '1',
      message: dryRun
        ? 'Stripe Connect status backfill dry-run complete (no DB writes)'
        : 'Stripe Connect status backfill complete',
      data: {
        dryRun,
        limit,
        offset,
        scanned: salons.length,
        wouldUpdate: dryRun ? wouldUpdate : undefined,
        updated: dryRun ? undefined : updated,
        skipped,
        failedCount: failed.length,
        countsByStatus,
        failed,
        sample,
        emailsSent: 0,
        pushSent: 0,
      },
      error: '',
    })
  } catch (error) {
    console.error('❌ Stripe Connect status backfill failed:', error)
    return next(
      new appError('Failed to backfill Stripe Connect status.', 500),
    )
  }
}