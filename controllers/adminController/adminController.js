const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })
const { Op, literal, col, fn, where } = require('sequelize')
const {
  user,
  deviceToken,
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
} = require('../../models')

const jwt = require('jsonwebtoken')
const appError = require('../../utils/appError')
const bcrypt = require('bcryptjs')
const AppError = require('../../utils/appError')
const Custom = require('../../utils/customFunctions')
const ThrowNotification = require('../../utils/throwNotification')
const FormatPermissions = require('../../utils/permissionsFormator')
const Graph = require('../../utils/graphsGenerators')
const Stripe = require('../stripe')
const { CURRENCY_UNIT } = process.env
//Global Variables

const CustomDate = require('../../utils/currentDay')
const { salonDetails } = require('../userControllers/customerController')

// console.log('🚀 ~ ', currentDateOnly);
//! Return Function
const response = ({ status, message, data, error, currencyUnit }) => {
  const output = {
    status: status ? `${status}` : '1',
    message: message ? `${message}` : 'success',
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
    },
  })
}

//!1.AUTH

//* 1. Admin Login
exports.login = async (req, res, next) => {
  const { email, password, dvToken } = req.body

  if (!email || !password) {
    return next(new AppError('Please provide Email or Password', 400))
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
    return next(new AppError('Incorrect Password.', 401))
  }

  const features = await feature.findAll({
    attributes: [`id`, `title`, `key`],
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
    throw new AppError('Image is required. Please upload Image', 400)
  }
  const data = await serviceType.create(input)

  return res.status(200).json(
    response({
      message: 'Service type added successfully',
      data: { id: data.id },
    }),
  )
}

//* 2.Get All service types -------------------------

exports.fetchServiceTypes = async (req, res, next) => {
  const data = await serviceType.findAll({
    where: { deleted: false },
    attributes: ['id', 'typeName', 'image', 'status', 'createdAt'],
    order: [['id', 'DESC']],
  })

  return res.status(200).json({
    status: '1',
    message: 'success',
    data: data,
  })
}

//& 3.Update service types --------------------------

exports.updateServiceTypes = async (req, res, next) => {
  if (!req.params.id) throw new AppError(`Invalid request format`, 400)
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

  const [rows] = await serviceType.update(input, { where: { id } })

  return res.status(200).json(response({ data: rows }))
}

exports.dashboard = async (req, res, next) => {
  // salons or subscriptions
  const totalSalon = await salonDetail.count()
  //appointments
  const upcommingConfirmAppointments = await booking.count({
    where: { status: 'book' },
  })
  const completeAppointments = await booking.count({
    where: { status: 'complete' },
  })
  const cancelAppointments = await booking.count({
    where: { status: 'cancel' },
  })
  const unAssignedAppointments = await booking.count({
    where: { status: 'pending' },
  })
  // customers
  const totalCustomers = await user.count({ where: { userTypeId: 1 } })

  //revenue
  const revenue = await booking.sum('total', { where: { status: 'complete' } })

  const monthlyRevenue = await booking.findAll({
    attributes: [
      [fn('MONTH', col('on')), 'month'],
      [fn('SUM', col('total')), 'totalRevenue'],
    ],
    where: {
      status: 'complete',
    },
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

  //Graphs
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
    mesage: 'success',
    data: {
      totalSalon,
      upcommingConfirmAppointments,
      completeAppointments,
      unAssignedAppointments,
      cancelAppointments,
      totalAppointments:
        completeAppointments +
        unAssignedAppointments +
        upcommingConfirmAppointments,
      totalCustomers,
      revenue: revenue || 0,
      dashboardBarChartData,
      dashboardDoughnutChartData,
      currencyUnit: CURRENCY_UNIT,
    },
  })
}

//!3.SALONS ----------------------------------------------------------------------------------------

//* 1.Fetch All Salons ---------------------

exports.fecthSalons = async (req, res, next) => {
  const results = await salonDetail.findAll({
    attributes: [
      'salonName',
      'id',
      // 'coverImage',
      // [literal('FORMAT(AVG(ratings.value), 1)'), 'salonAverageRating'],
      [fn('COUNT', col('employees.id')), 'employeeCount'],
    ],
    include: [
      {
        model: employee,
        attributes: [],
        on: { salonDetailId: col('salonDetail.id') },
        required: false,
      },
      {
        model: user,
        required: true,
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
      {
        model: addressDBS,
        required: true,
        attributes: ['id', 'streetAddress', 'city', 'country', 'postalCode'],
      },
    ],
    group: ['salonDetail.id'],
  })

  console.log('🚀 ~ ', results.averageRating)
  return res.status(200).json(response({ data: results }))
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
            attributes: [`id`, `value`],
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
  if (!results) throw new AppError('Resource not found', 404)

  const employeeData = results.toJSON()
  employeeData.employee = employeeData.employees[0]
  delete employeeData.employees
  console.log(
    'employeeData.employee.salonDetailId-------------------',
    employeeData.employee.salonDetailId,
  )
  const salonData = employeeData.employee.salonDetailId
    ? await salonDetail.findByPk(employeeData.employee.salonDetailId, {
        attributes: [
          'id',
          'salonName',
          'coverImage',
          [literal('FORMAT(AVG(ratings.value), 1)'), 'salonAverageRating'],
          [fn('COUNT', col('ratings.id')), 'ratingCount'],
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
  const output = {
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
  if (!plan) throw new AppError('Not creatred', 409)

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
      message: 'Subscription Plan added successfully',
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
    message: 'success',
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
  const data = await booking.findAll({
    attributes: ['id', `status`, `startTime`, `on`, 'createdAt'],
    include: [
      {
        model: salonDetail,
        attributes: [`salonName`],
        include: { model: addressDBS, attributes: [`streetAddress`, `city`] },
      },
      {
        model: user,
        attributes: [`id`, `firstName`, 'lastName'],
      },
      {
        model: jobs,
        attributes: [`status`],
        include: [
          {
            model: employee,
            attributes: ['id'],
            include: {
              model: user,
              attributes: [`firstName`],
            },
          },
          { model: service, attributes: [`serviceName`] },
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
      `startTime`,
      `endTime`,
      `duration`,
      `tip`,
      `note`,
      `on`,
      `stripeCardId`,
      `paymentMethod`,
    ],
    include: [
      {
        model: salonDetail,
        attributes: [
          'id',
          'salonName',
          'coverImage',
          'description',
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
            model: rating,
            attributes: [],
          },
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
  if (req.query.startDate && req.query.endDate) {
    bookingCondition.on = {
      [Op.between]: [req.query.startDate, req.query.endDate],
    }
  }
  console.log(
    'ðŸš€ ~ file: adminController.js:629 ~ exports.fecthSalonsEarnings= ~ bookingCondition:',
    bookingCondition,
  )
  const results = await salonDetail.findAll({
    attributes: [
      'salonName',
      'status',
      [literal('FORMAT(AVG(ratings.value), 1)'), 'salonAverageRating'],
      [fn('COUNT', col('ratings.id')), 'ratingCount'],
      [fn('SUM', col('bookings.total')), 'revenue'],
      [fn('COUNT', col('bookings.id')), 'totalBookings'],
    ],
    include: [
      {
        model: booking,
        where: bookingCondition,
        attributes: [],
        required: false,
      },
      {
        model: rating,
        attributes: [],
        on: { salonDetailId: col('salonDetail.id') },
        required: false,
      },
      {
        model: addressDBS,
        required: true,
        attributes: ['id', 'streetAddress', 'city', 'country', 'postalCode'],
      },
    ],
    group: ['salonDetail.id'],
  })

  console.log('ðŸš€ ~ ', results.averageRating)
  return res
    .status(200)
    .json(response({ data: { salons: results, currencyUnit: CURRENCY_UNIT } }))
}
//! 9.Help & Support ----------------------------------------------------------------------

//* 3.fetch Help Support --------------------

exports.fetchHelpSupport = async (req, res, next) => {
  const data = await helpSupport.findOne({
    attributes: ['id', 'email', 'countryCode', 'phoneNum', 'address'],
  })
  return res.status(200).json({
    status: '1',
    message: 'success',
    data: data,
  })
}

//* 3.Update Help Support --------------------------

exports.updateHelpSupport = async (req, res, next) => {
  if (!req.params.id) throw new AppError(`Invalid request format`, 400)
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
        model: rating,
        attributes: [],
      },
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
    message: 'success',
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
    ;(input.sendTo = notData.to),
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
  if (sendTo === 'customers') condition.userTypeId = 1
  if (sendTo === 'salons') condition.userTypeId = 2
  if (sendTo === 'employees') condition.userTypeId = 3
  if (sendTo === 'all') condition.userTypeId = [1, 2, 3]

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
  //return res.json(senderData)
  const senderData = data.map((ele) => {
    ele.deviceTokens.map((token) => {
      if (token.tokenId != null) to.push(token.tokenId)
    })
  })

  let notification = { title, body }
  ThrowNotification(to, notification)

  let dt = new Date()

  //adding 5 hours
  dt.setTime(dt.getTime() + 5 * 60 * 60 * 1000)

  if (req.body) pushNotification.create({ at: dt, to: sendTo, title, body })

  return res.status(200).json({
    status: '1',
    message: 'success',
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
    message: 'All Push Notifications.',
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
    .json(response({ message: 'Peak Times Report', data: { report, status } }))
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
      message: 'Financial Performance Report',
      data: { report, status, currencyUnit: CURRENCY_UNIT },
    }),
  )
}

//* 3.Reports > Client File Report --------------------------

exports.clientFileReport = async (req, res, next) => {
  const currentDay = CustomDate.currentDay()
  let startDate = req.query.startDate || '2023-12-01'
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
  //TODO (in all reports and earnings )replace booking.total with booking.actualCapturedAmount

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
      message: 'Financial Performance Report',
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
      message: 'All Subscription Plan',
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
      message: 'Subscription Plan Updated Successfully!',
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

  if (!emplData) throw new AppError('Record not found.', 404)

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
    attributes: ['id', 'title'],
  })
  let permissionType = ['create', 'read', 'update', 'delete']
  const employeePermissions = FormatPermissions(featureData, [], permissionType)
  return res.json(
    response({
      data: { employeePermissions },
    }),
  )
}

//* 3.Role&Permission > Add Roles  -----------------

exports.addRoles = async (req, res, next) => {
  const { name, permissionRole } = req.body
  // making   unique
  const checkExist = await role.findOne({ where: { name } })
  if (checkExist) throw new AppError('Role already exists.', 409)
  const data = await role.create({ name, status: true })
  // manipulating to our desired format
  let bulkArray = []
  permissionRole.map((ele) => {
    if (ele.permissions.create === true)
      bulkArray.push({
        permissionType: 'create',
        featureId: ele.id,
        roleId: data.id,
      })
    if (ele.permissions.read === true)
      bulkArray.push({
        permissionType: 'read',
        featureId: ele.id,
        roleId: data.id,
      })
    if (ele.permissions.update === true)
      bulkArray.push({
        permissionType: 'update',
        featureId: ele.id,
        roleId: data.id,
      })
    if (ele.permissions.delete === true)
      bulkArray.push({
        permissionType: 'delete',
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
    if (ele.permissions.create === true)
      bulkArray.push({ permissionType: 'create', featureId: ele.id, roleId })
    if (ele.permissions.read === true)
      bulkArray.push({ permissionType: 'read', featureId: ele.id, roleId })
    if (ele.permissions.update === true)
      bulkArray.push({ permissionType: 'update', featureId: ele.id, roleId })
    if (ele.permissions.delete === true)
      bulkArray.push({ permissionType: 'delete', featureId: ele.id, roleId })
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
  if (!roleData) throw new AppError('Role not Found', 404)
  const permissionData = await permission.findAll({
    where: { roleId },
  })
  //return res.json(permissionData)
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
    response({
      data: { name: roleData.name, permissionRole: employeePermissions },
    }),
  )
}
//!New Changes

//* 4.Service History  -----------------

exports.serviceHistory = async (req, res, next) => {
  const history = await booking.findAll({
    where: {
      // status :'complete', //TODO un-comment
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
        required: true,
        attributes: [
          [
            literal(
              '(SELECT GROUP_CONCAT(service.serviceName SEPARATOR ", ") FROM services AS service WHERE service.id = jobs.serviceId)',
            ),
            'serviceNames',
          ],
        ],
        where: { employeeId: req.params.employee },
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
      message: 'Top Performing Services',
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
      message: `Top ${limit} Performing Salons.`,
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
    req.query && req.query.startDate ? req.query.startDate : '2024-03-31'
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

//*1 Client Status Distribution Graph
exports.changeSalonStatus = async (req, res, next) => {
  const id = req.params.id

  const existingRecord = await user.findByPk(id, { attributes: ['status'] })

  if (!existingRecord) {
    throw new AppError('No record found with that ID', 404)
  }
  const newStatus = existingRecord.status === true ? 0 : 1
  const [updatedCount] = await user.update(
    { status: newStatus },
    { where: { id } },
  )

  await salonDetail.update({ status: newStatus }, { where: { userId: id } })

  res.status(200).json(
    response({
      message: 'Status changed successfully',
      data: { count: updatedCount },
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
    throw new AppError('No record found with that ID', 404)
  }
  const newStatus = existingRecord.status === true ? 0 : 1
  const [updatedCount] = await Model.update(
    { status: newStatus },
    { where: { id } },
  )
  res.status(200).json(
    response({
      message: 'Status changed successfully',
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
  res.status(200).json(
    response({
      message: 'Service type deleted successfully',
      data: { count: updatedCount },
    }),
  )
}

//& Delete --------------------------

exports.delete = (Model) => async (req, res, next) => {
  if (!req.params.id) throw new AppError(`Invalid request format`, 400)

  const data = await Model.destroy({
    where: { id: req.params.id },
  })

  if (!data) {
    throw new AppError(`Record not found`, 404)
  } else {
    return res.status(200).json(
      response({
        mesage: 'Deleted successfully',
      }),
    )
  }
}

//! .Reason Fro subscriptions and appointments -------------------------------------------------------------------------------

//^ 1.Add Reasons  ----------------------------

exports.addReasons = async (req, res, next) => {
  req.body.type = req.params.type
  const data = await reason.create(req.body)

  return res.status(200).json(
    response({
      message: 'Reason type added successfully',
      data: { reason: data },
    }),
  )
}
//^ 2.Fetch Reasons  ----------------------------

exports.fetchReasons = async (req, res, next) => {
  const data = await reason.findAll({
    where: { type: req.params?.type, status: true },
  })

  return res.status(200).json(
    response({
      message: 'Reasons',
      data: { reasons: data.reverse() },
    }),
  )
}

//^ 2.Update Reasons  ----------------------------

exports.updateReasons = async (req, res, next) => {
  const data = await reason.findAll(
    { reason: req.body?.reason },
    { where: { type: req.params?.id } },
  )

  return res.status(200).json(
    response({
      message: 'success',
      data: {},
    }),
  )
}

//^ 3.Update Status  ----------------------------

exports.changeReasonStatus = async (req, res, next) => {
  await reason.findAll(
    { reason: req.body?.status },
    { where: { type: req.params?.id } },
  )

  return res.status(200).json(
    response({
      message: 'success',
      data: {},
    }),
  )
}
//^ 4.Delete Reasons  ----------------------------

exports.deleteReasons = async (req, res, next) => {
  const data = await reason.destroy({ where: { id: req.params?.id } })

  return res.status(200).json(
    response({
      message: 'success',
      data: {},
    }),
  )
}
