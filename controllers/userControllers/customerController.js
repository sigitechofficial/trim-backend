const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })
const { CURRENCY_UNIT, STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } = process.env

const { Op, literal, col, fn, where } = require('sequelize')

const {
  user,
  salonDetail,
  rating,
  addressDBS,
  category,
  service,
  salonImage,
  employee,
  time,
  employeeService,
  jobs,
  booking,
  socialLink,
  coupon,
  favorite,
  paymentPolicy,
  cancellationPolicy,
  depositPolicy,
  noShowPolicy,
  reschedulePolicy,
  blockCustomer,
  announcement,
  deviceToken,
  deletedCustomer,
  employeeWagesMethod,
  unAcknowledgedEvents,
  employeeCommission,
  rentChairEarning,
  commissionPayout,
  rentChairPayout,
  pushNotification,
} = require('../../models')
const AppError = require('../../utils/appError')
const Slot = require('../../utils/timeSlots')
const Custom = require('../../utils/customFunctions')
const Stripe = require('../stripe')
const ThrowNotification = require('../../utils/throwNotification')
const DateManupulation = require('../../utils/dateManipulation')
const CustomDate = require('../../utils/currentDay')
const { response } = require('../../utils/response')
const { sendEvent } = require('../../socket_io')

const EmailAppointmentToSalon = require('../../helper/AppointmentEmailsToSalon')
const AppointmentEmailsToCustomer = require('../../helper/AppointmentEmailsToCustomer')
const tankyou = require('../../helper/ThankYouForVisiting')
const demo = require('../../helper/demo')
const EmailResetPasswordOtpToAll = require('../../helper/ResetPasswordOtpToAll')

const {
  calculatePayoutsOnBooking,
} = require('../salonControllers/payoutController')

// const { distributeTip } = require('../../utils/tipDistribution')

const {
  onlineAppointmentConfirm,
} = require('../eventDrivenCommunication/appointmentConfirm')

const {
  fromCustomerSoloEmployee,
  fromCustomerMultipleEmployees,
} = require('../eventDrivenCommunication/appointmentReschedule')

const { feedBack } = require('../eventDrivenCommunication/customerFeedback')
const {
  cancelByCustomer,
} = require('../eventDrivenCommunication/appointmentCancel')

const {
  bookingDataForEmailAndNotifications,
} = require('../../utils/emailsNotificationsData')

//! Return Function
//* DEMO. Eamil Testing ----------------------

exports.emailtesting = async (req, res, next) => {
  const { email } = req.body
  const data = await bookingDataForEmailAndNotifications('1742')
  console.log('🚀 ~ exports.emailtesting= ~ data:', data.client)
  // tankyou([data.client.customerEmail], data)
  EmailAppointmentToSalon(
    [`${data?.salon?.salonEmail}`],
    data.appointment,
    'noshow',
  )
  return res.status(200).json(response({ data: { data } }))
}

//* DEMO. Notification Testing ----------------------

exports.notificationTesting = async (req, res, next) => {
  const customerNotification = {
    title: `JUST TESTING `,
    body: `Your appointment has been confirmed. Looking forward to seeing you!`,
  }

  // ThrowNotification(req.body.to, customerNotification, {
  //   appointment: 1,
  // })
  return res.status(200).json(response({ data: {} }))
}

//* 1.Get Home ----------------------

exports.home = async (req, res, next) => {
  const currentDay = CustomDate.currentDay()
  const { targetLat, targetLng } = req.body
  const rangeInKm = req.body.rangeInKm || 15
  const condition = { status: true }

  // Build price condition if provided
  const priceCondition = req.body?.price
    ? { price: { [Op.lte]: req.body?.price } }
    : {}

  // Build time condition if day and time are provided
  if (req.body.day && req.body.startTime && req.body.endTime) {
    condition.day = req.body.day
    condition.openingTime = { [Op.lte]: req.body.startTime }
    condition.closingTime = { [Op.gte]: req.body.endTime }
  }

  // Fetch liked salons if favorite filter is applied
  const likedSalons = await favorite.findAll({
    where: { userId: req?.user?.id || 0 },
    attributes: ['salonDetailId'],
  })
  const likeIds =
    likedSalons?.length > 0 ? likedSalons.map((ele) => ele.salonDetailId) : []

  // Initialize salon conditions
  const salonCondition = {
    registrationExpiryDate: { [Op.gte]: currentDay.currentDateOnly },
    approvedByAdmin: true,
    status: 1,
  }

  // Apply favorite filter if requested
  if (req.params?.favorite && req?.user) {
    if (likedSalons.length < 1) {
      return res.status(200).json(response({ data: { slons: [] } }))
    }
    salonCondition.id = { [Op.or]: likeIds }
  }

  // Haversine formula for distance calculation
  const formula = `(6371 * 
    acos(
      cos(radians(${targetLat})) * cos(radians(lat)) * 
      cos(radians(lng) - radians(${targetLng})) + 
      sin(radians(${targetLat})) * sin(radians(lat))
    )
  )`

  // Refactored salon conditions incorporating service and time filters
  const finalSalonCondition = {
    ...salonCondition,
    // Distance filter
    ...(targetLat &&
      targetLng && {
        [Op.and]: literal(`${formula} <= ${rangeInKm}`),
      }),

    // Service price filter
    ...(req.body.price && {
      id: {
        [Op.in]: literal(`(
          SELECT DISTINCT salonDetailId FROM services
          WHERE services.salonDetailId = salonDetail.id 
            AND services.price <= ${req.body.price}
        )`),
      },
    }),
    // Time filter
    ...(req.body.day &&
      req.body.time && {
        id: {
          [Op.in]: literal(`(
          SELECT DISTINCT salonDetailId FROM times
          WHERE times.salonDetailId = salonDetail.id 
            AND times.day = '${req.body.day}' 
            AND times.openingTime <= '${req.body.time}' 
            AND times.closingTime >= '${req.body.time}'
        )`),
        },
      }),
    ...(req?.body?.serviceType && {
      id: {
        [Op.in]: literal(`(
            SELECT DISTINCT salonDetailId FROM services
          WHERE services.salonDetailId = salonDetail.id 
              AND services.serviceTypeId = ${req?.body?.serviceType}
          )`),
      },
    }),
  }

  console.log('🚀 ~ exports.home= ~  finalSalonCondition:', finalSalonCondition)

  // Construct the query body without including 'service' and 'time'
  const body = {
    where: finalSalonCondition,
    attributes: [
      'id',
      'salonName',
      'coverImage',
      'isOnline',
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
        ],
      },
      {
        model: service,
        required: true,
        attributes: ['id', 'serviceName', 'price', 'discount'],
      },
      {
        model: user,
        where: { status: true },
        required: true,
        attributes: ['id'],
      },
    ],
    // group: ['salonDetail.id'],
    having: req.params?.favorite
      ? undefined
      : literal(`${formula} <= ${rangeInKm}`),
  }

  // Add distance attribute if not filtering by favorites
  if (!req.params?.favorite) {
    body.attributes.push([literal(`${formula}`), 'distance'])
  }

  let results = await salonDetail.findAll(body)

  results = JSON.parse(JSON.stringify(results))
  if (results.length > 0) {
    results = results.map((salon) => {
      const found = likeIds.some((id) => id === salon.id)
      return { ...salon, like: found }
    })
  }
  // console.log('🚀 ~ exports.home= ~ results:', results)
  let appointments = []
  if (req.user && req.user.id) {
    appointments = await booking.findAll({
      where: {
        customerId: req.user.id,
        status: { [Op.or]: ['pending', 'book'] },
      },
      attributes: [
        'id',
        `status`,
        `startTime`,
        `endTime`,
        `on`,
        'total',
        'actualCapturedAmount',
        [
          literal(
            `(SELECT COUNT(*) FROM jobs WHERE jobs.bookingId = booking.id)`,
          ),
          'serviceCount',
        ],
      ],

      include: [
        {
          model: salonDetail,
          attributes: [
            'id',
            `salonName`,
            'coverImage',
            // [literal('FORMAT(AVG(ratings.value), 1)'), 'salonAverageRating'],
            // [fn('COUNT', col('ratings.id')), 'ratingCount']
          ],
          include: [
            { model: addressDBS, attributes: [`streetAddress`, `city`] },
            { model: rating, attributes: [] },
          ],
        },
        {
          model: jobs,
          attributes: [],
        },
      ],
    })
  }

  const output = {
    data: {
      slons: results,
      appointments,
      currencyUnit: CURRENCY_UNIT,
      distanceUnit: 'km',
    },
  }

  if (req.params.favorite) {
    output.data = { slons: results }
  }

  return res.status(200).json(response(output))
}

//* 2.Get Salon Details -------------Modified----

exports.salonDetails = async (req, res, next) => {
  const currentDay = CustomDate.currentDay()

  const results = await salonDetail.findByPk(req.params.id, {
    where: {
      registrationExpiryDate: { [Op.gt]: currentDay.currentDateOnly },
      approvedByAdmin: true,
    },
    attributes: [
      'id',
      'salonName',
      'coverImage',
      'description',
      'onlinePayments',
      'isOnline',
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
        model: booking,
        required: false,
        where: { status: 'complete', rating: 'done' },
        limit: 10,
        attributes: [
          'id',
          'feedback',
          'createdAt',
          [
            literal(
              '(SELECT FORMAT(AVG(ratings.value), 1) FROM ratings WHERE ratings.bookingId = booking.id)',
            ),
            'averageRatingPerBooking',
          ],
        ],
        include: {
          model: user,
          attributes: ['firstName', 'lastName', 'image'],
        },
      },
      {
        model: socialLink,
        required: false,
        attributes: [`id`, `platform`, `url`],
      },
      {
        model: addressDBS,
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
        ],
      },
      {
        model: category,
        attributes: ['id', 'categoryName', 'color'],
        include: {
          model: service,
          attributes: [
            'id',
            'serviceName',
            'description',
            'price',
            'duration',
            'discount',
          ],
        },
      },
      {
        model: salonImage,
        attributes: ['imageUrl'],
      },
      {
        model: time,
        attributes: ['status', 'day', 'openingTime', 'closingTime'],
      },
      {
        model: employee,
        attributes: [
          'id',
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
            model: user,
            attributes: ['id', `firstName`, `lastName`, 'image'],
          },
        ],
      },
    ],
  })

  let like = false
  let customerStatus = 'active'
  if (req.user) {
    const likedSalon = await favorite.findOne({
      where: { userId: req.user.id, salonDetailId: req.params.id },
      attributes: ['salonDetailId'],
    })
    if (likedSalon) like = true
    const isblocked = await blockCustomer.findOne({
      where: { userId: req.user.id, salonDetailId: req.params.id },
      attributes: ['id'],
    })
    if (isblocked) customerStatus = 'block'
  }
  const policyCondition = { status: true }
  const policies = await salonDetail.findOne({
    where: { id: req.params.id },
    attributes: ['id', 'salonName'],
    include: [
      {
        model: cancellationPolicy,
        where: policyCondition,
        required: false,
        attributes: { exclude: ['createdAt', 'updatedAt', 'salonDetailId'] },
      },
      {
        model: noShowPolicy,
        where: policyCondition,
        required: false,
        attributes: { exclude: ['createdAt', 'updatedAt', 'salonDetailId'] },
      },
      {
        model: reschedulePolicy,
        where: policyCondition,
        required: false,
        attributes: { exclude: ['createdAt', 'updatedAt', 'salonDetailId'] },
      },
      {
        model: paymentPolicy,
        where: policyCondition,
        required: false,
        attributes: { excludse: ['createdAt', 'updatedAt', 'salonDetailId'] },
      },
    ],
  })

  await announcement.update(
    { status: false },
    {
      where: {
        [Op.and]: [
          { to: { [Op.lt]: currentDay.currentDateOnly } },
          { status: true },
        ],
      },
    },
  )

  const announcements = await announcement.findAll({
    where: {
      salonDetailId: req.params.id,
      status: true,
      from: { [Op.lte]: currentDay.currentDateOnly },
      to: { [Op.gte]: currentDay.currentDateOnly },
    },
    attributes: {
      exclude: ['updatedAt', 'salonDetailId'],
    },
  })
  return res.status(200).json(
    response({
      data: {
        announcements: announcements,
        customerStatus,
        like,
        detail: results,
        policies,
        currencyUnit: CURRENCY_UNIT,
      },
    }),
  )
}

//* 3.Salon Times

exports.salonTimes = async (req, res, next) => {
  const { salon } = req.params

  const data = await time.findAll({
    where: { salonDetailId: salon },
    attributes: ['status', 'day', 'openingTime', 'closingTime'],
  })

  return res.status(200).json(response({ data: { times: data } }))
}

//* 4 .Get Employee Times -----------------

exports.employeeTimes = async (req, res, next) => {
  const { employee } = req.params
  const data = await time.findAll({
    where: { employeeId: employee },
    attributes: ['status', 'day', 'openingTime', 'closingTime'],
  })

  return res.status(200).json(response({ data: { times: data } }))
}

//* 2.Get Employee Details -----------------

exports.employeeDetails = async (req, res, next) => {
  const results = await user.findByPk(req.params.id, {
    attributes: ['firstName', 'lastName', 'image'],
    include: [
      {
        model: employee,
        attributes: [
          'id',
          'position',
          'coverImage',
          'description',
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
            model: employeeService,
            attributes: ['status'],
            include: [
              {
                model: service,
                attributes: [
                  'id',
                  'serviceName',
                  'description',
                  'price',
                  'duration',
                  'discount',
                ],
                include: {
                  model: category,
                  attributes: ['id', 'categoryName', 'color'],
                },
              },
            ],
          },
          {
            model: time,
            attributes: ['status', 'day', 'openingTime', 'closingTime'],
          },
        ],
      },
    ],
  })

  const output = results.toJSON()
  output.employee = output.employees[0]
  delete output.employees

  return res
    .status(200)
    .json(response({ data: { detail: output, currencyUnit: CURRENCY_UNIT } }))
}

//* 2.Check User Session -----------------

exports.session = async (req, res, next) => {
  const accessToken = req.header('accessToken')
  const userId = req.user.id
  const data = await user.findByPk(userId, {
    attributes: [
      'id',
      'firstName',
      'lastName',
      'email',
      'status',
      'image',
      'stripeCustomerId',
    ],
  })
  if (data.status === false)
    next(new AppError('Blocked by Admin. Contact customer support'))

  const output = JSON.parse(JSON.stringify(data))
  output.accessToken = accessToken
  output.userId = `${userId}`
  delete output.id
  return res.status(200).json(response({ data: output }))
}

//~ AppointMent Journey Start

//* 1.Find Employees That provides all selected services -----------------

exports.employeesWithAllServices = async (req, res, next) => {
  const { services } = req.body

  const employeesWithServices = await employeeService.findAll({
    where: {
      salonDetailId: req.params.salon,
      serviceId: {
        [Op.in]: services,
      },
    },
    attributes: ['employeeId'],
    include: { model: employee, where: { deleted: false, status: true } },
    group: ['employeeId'],
    having: literal(`COUNT(DISTINCT serviceId) = ${services.length}`),
  })

  const employeeIds =
    employeesWithServices.length > 0
      ? employeesWithServices.map(
          (employeeService) => employeeService.employeeId,
        )
      : []
  console.log('ðŸš€~employees:', employeeIds)
  if (employeeIds.length < 1) {
    return res
      .status(200)
      .json({ status: '2', message: 'No employee available move forword.' })
  }

  const workers = await user.findAll({
    attributes: ['firstName', 'lastName', 'image'],
    include: [
      {
        model: employee,
        where: { id: employeeIds, salonDetailId: req.params.salon },
        attributes: [
          'id',
          'position',
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
            attributes: [],
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

  if (!workers || workers.length < 1) {
    return res
      .status(200)
      .json({ status: '2', message: 'No employee available move forword.' })
  }

  const result = workers.map((ele) => {
    const obj = ele.toJSON()
    obj.employee = obj.employees[0]
    delete obj.employees
    return obj
  })

  const output = response({ data: { employees: result } })
  return res.status(200).json(output)
}

//* 2.Check Employees availability -----------------

exports.employeeAvailability = async (req, res, next) => {
  let { openingTime, closingTime, jobDate, duration } = req.body
  console.log('🚀 ~ exports.employeeAvailability= ~ req.body:', req.body)

  if (openingTime == '00:00' || openingTime == '00:00:00')
    openingTime = '00:00:01'
  if (closingTime == '00:00' || closingTime == '00:00:00')
    closingTime = '24:00:00'

  const busyTimes = await jobs.findAll({
    where: { status: 'assign', employeeId: req.params.employee, on: jobDate },
    attributes: ['startTime', 'endTime'],
  })

  const availableTimeSlots = Slot.getAvailableTimeSlots(
    jobDate,
    openingTime,
    closingTime,
    duration,
    busyTimes,
  )

  const output = response({ data: { availableTimeSlots } })
  return res.status(200).json(output)
}

//* 3.Check Employees availability -----------------

exports.salonAvailability = async (req, res, next) => {
  let { openingTime, closingTime, jobDate, duration } = req.body

  if (openingTime == '00:00' || openingTime == '00:00:00')
    openingTime = '00:00:01' //Have do this because of (how they handeled on salon Side)
  if (closingTime == '00:00' || closingTime == '00:00:00')
    closingTime = '24:00:00'

  const salon = await salonDetail.findOne({
    where: { id: req.params.salon },
    attributes: ['id'],
  })
  if (!salon) throw new AppError('resource not Found', 200)

  const availableTimeSlots = Slot.getAvailableTimeSlots(
    jobDate,
    openingTime,
    closingTime,
    duration,
    [],
  )

  const output = response({ data: { availableTimeSlots } })
  return res.status(200).json(output)
}

//* 4.Reschedule Solo Employee Appointment -----------------

exports.rescheduleSoloEmployeeAppointment = async (req, res, next) => {
  const { bookingId } = req.params
  const { appointment, services, employeeId } = req.body
  console.log(
    '🚀 ~ exports.rescheduleSoloEmployeeAppointment= ~ employeeId:',
    employeeId,
  )
  console.log(
    '🚀 ~ exports.rescheduleSoloEmployeeAppointment= ~ services:',
    services,
  )
  console.log(
    '🚀 ~ exports.rescheduleSoloEmployeeAppointment= ~ appointment:',
    appointment,
  )
  appointment.startTime = DateManupulation.convertTo24HourFormat(
    appointment.startTime,
  )
  console.log('🚀 ~ AFTER START-TIME', appointment.startTime)

  appointment.endTime = DateManupulation.convertTo24HourFormat(
    appointment.endTime,
  )
  const appointmentDate = new Date(appointment.on)
  const appointmentDay = DateManupulation.dayOnDate(appointmentDate)

  // services offered by single employees
  if (employeeId) {
    const availability = await jobs.findOne({
      where: {
        status: 'assign',
        employeeId: req.body.employeeId,
        on: appointment.on,
        bookingId: { [Op.not]: bookingId },
        [Op.or]: [
          {
            // Case starts within the busy time range
            startTime: {
              [Op.between]: [appointment.startTime, appointment.endTime],
            },
          },
          {
            //  when ends within the busy time range
            endTime: {
              [Op.between]: [appointment.startTime, appointment.endTime],
            },
          },
          {
            //when within the job time range
            [Op.and]: [
              { startTime: { [Op.lte]: appointment.startTime } },
              { endTime: { [Op.gte]: appointment.endTime } },
            ],
          },
        ],
      },
      attributes: ['startTime', 'endTime'],
    })

    if (availability) {
      return res.status(200).json(
        response({
          status: '2',
          message: 'Time slot booked by another customer',
        }),
      )
    }
  }
  const jobIds = services.map((obj) => obj.id)
  const assignTimeSlots = Custom.scheduleSessions(appointment, services)
  console.log(
    '🚀 ~ exports.rescheduleSoloEmployeeAppointment= ~ assignTimeSlots:',
    assignTimeSlots,
  )

  let sessions = await jobs.findAll({ where: { id: jobIds } })

  // Update each job's times
  assignTimeSlots.forEach((newJobData) => {
    // Find the corresponding job in sessions array by ID
    const jobToUpdate = sessions.find((job) => job.id === newJobData.id)
    if (jobToUpdate) {
      // Update startTime, endTime, and on attributes
      jobToUpdate.startTime = newJobData.startTime
      jobToUpdate.endTime = newJobData.endTime
      jobToUpdate.on = newJobData.on
      jobToUpdate.employeeId = employeeId
    } else {
      console.log(`Job with ID ${newJobData.id} not found in sessions array.`)
    }
  })
  // Save all changes to the database
  await Promise.all(sessions.map((job) => job.save()))
  await booking.update(
    {
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      on: appointment.on,
    },
    { where: { id: bookingId } },
  )

  booking.increment(
    {
      reScheduleCount: 1,
    },
    { where: { id: bookingId } },
  )
  fromCustomerSoloEmployee(bookingId)
  const output = response({
    message: 'Appointment re-schedule successfully.',
    data: {},
  })
  return res.status(200).json(output)
}

//* 5.Reschedule Multiple Employee Appointment -----------------

exports.rescheduleMultipleEmployeeAppointment = async (req, res, next) => {
  const { bookingId } = req.params
  const { appointment, services } = req.body

  appointment.startTime = DateManupulation.convertTo24HourFormat(
    appointment.startTime,
  )
  appointment.endTime = DateManupulation.convertTo24HourFormat(
    appointment.endTime,
  )

  const appointmentDate = new Date(appointment.on)
  const appointmentDay = DateManupulation.dayOnDate(appointmentDate)

  let employeeData, JobsInput
  // services offered by multiple employees

  employeeData = await employee.findAll({
    where: {
      salonDetailId: appointment.salonDetailId,
      deleted: false,
      status: true,
    },
    attributes: ['id'],
    include: [
      {
        model: employeeService,
        required: true,
        attributes: ['status'],
        include: {
          model: service,
          required: true,
          attributes: ['id'],
        },
      },
      {
        model: time,
        required: true,
        where: { day: appointmentDay },
        attributes: ['openingTime', 'closingTime'],
      },
      {
        model: jobs,
        where: { on: appointment.on, status: 'assign' },
        required: false,
        attributes: ['duration', 'startTime', 'endTime'],
      },
    ],
  })
  employeeData.sort((a, b) => a.jobs.length - b.jobs.length)

  console.log('🚀~🚀 ~🚀 ~🚀 ~🚀 ~🚀 ~🚀 ~🚀 ~🚀  services:', services)
  const assignTimeSlots = Custom.scheduleSessions(appointment, services)
  console.log('🚀 ~ assignTimeSlots:', assignTimeSlots)

  JobsInput = Custom.assignEmployeesToServices(employeeData, assignTimeSlots)
  appointment.status = 'book'
  const findUnAssign =
    JobsInput.length > 0
      ? JobsInput.find((el) => el.status === 'pending')
      : false
  console.log(
    '🚀 ~ exports.rescheduleMultipleEmployeeAppointment= ~ findUnAssign:',
    findUnAssign,
  )
  if (findUnAssign) {
    appointment.status = 'pending'
  }
  const jobIds = services.map((obj) => obj.id)
  console.log(
    '🚀 ~ exports.rescheduleMultipleEmployeeAppointment= ~ jobIds:',
    jobIds,
  )
  let sessions = await jobs.findAll({ where: { id: jobIds } })

  // Update each job's times
  JobsInput.forEach((newJobData) => {
    // Find the corresponding job in sessions array by ID
    // console.log("🚀 ~ exports.rescheduleMultipleEmployeeAppointment= ~ newJobData:", newJobData)

    const jobToUpdate = sessions.find((job) => job.id === newJobData.id)
    // console.log("🚀 ~ exports.rescheduleMultipleEmployeeAppointment= ~ jobToUpdate:", jobToUpdate)
    if (jobToUpdate) {
      // Update startTime, endTime, and on attributes
      jobToUpdate.startTime = newJobData.startTime
      jobToUpdate.endTime = newJobData.endTime
      jobToUpdate.on = newJobData.on
      jobToUpdate.employeeId = newJobData.employeeId
      jobToUpdate.employeeId =
        jobToUpdate.employeeId == 0 ? null : jobToUpdate.employeeId
      jobToUpdate.status = newJobData.status
    } else {
      console.log(`Job with ID ${newJobData.id} not found in sessions array.`)
    }
  })
  // Save all changes to the database
  await Promise.all(sessions.map((job) => job.save()))
  await booking.update(
    {
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      on: appointment.on,
      status: appointment.status,
    },
    { where: { id: bookingId } },
  )
  booking.increment(
    {
      reScheduleCount: 1,
    },
    { where: { id: bookingId } },
  )
  fromCustomerMultipleEmployees(bookingId)
  const output = response({ message: 'Appointment re-schedule successfully.' })
  return res.status(200).json(output)
}

//* 6.Cancel Appointment -----------------

exports.cancelAppointment = async (req, res, next) => {
  const { bookingId } = req.params

  const bookingData = await booking.findByPk(bookingId, {
    attributes: [
      'id',
      'status',
      'on',
      'startTime',
      'endTime',
      'duration',
      'discount',
      'total',
      'subTotal',
      'initialPayment',
      'initialPaymentIntend',
      'actualCapturedAmount',
      'tip',
      'salonDetailId',
      'paymentMethod',
      'stripeCardId',
      'customerId',
      'noshowPolicyVersion',
      'cancellationPolicyVersion',
      'by',
    ],
    include: [
      {
        model: salonDetail,
        attributes: ['id', 'salonName', 'connectAccountId'],
      },
      {
        model: user,
        attributes: [
          'id',
          'firstName',
          'lastName',
          'email',
          'countryCode',
          'phoneNum',
          'stripeCustomerId',
          'image',
        ],
      },
      {
        model: jobs,
        attributes: [
          'id',
          'status',
          'total',
          'duration',
          'startTime',
          'endTime',
          'employeeId',
          'bookingId',
          'tip',
          'Extra',
          'on',
        ],
        include: [
          {
            model: service,
            attributes: ['serviceName'],
          },
          {
            model: employee,
            attributes: ['id', 'position'],
            include: [
              {
                model: user,
                attributes: ['id', 'firstName', 'lastName'],
              },
              {
                model: employeeWagesMethod,
                attributes: ['value', 'wagesMethodId'],
              },
            ],
          },
        ],
      },
    ],
  })
  if (!bookingData) {
    return res.status(404).json({ message: 'Appointment not found.' })
  }

  const finePercentage = req.body?.cancellationPercentage ?? 0

  const appointment = bookingData

  if (
    appointment.status === 'complete' ||
    appointment.status === 'no-show' ||
    appointment.status === 'cancel'
  ) {
    throw new AppError(
      `The appointment has already been marked as : ${appointment.status}.`,
      200,
    )
  }
  //& Refund or extra amount chagr will be here
  const updatedBooking = {
    cancellationCharges: req.body.cancellationCharges,
    tip: 0,
  }
  if (
    appointment.by === 'online' &&
    appointment?.stripeCardId &&
    appointment.initialPaymentIntend &&
    req.body.cancellationCharges > 0
  ) {
    const paid =
      parseFloat(appointment.actualCapturedAmount) + parseFloat(appointment.tip)

    const cancellationCharges = parseFloat(req.body.cancellationCharges)
    console.log('🚀 ~ exports.cancelAppointment= ~ paid:', paid)
    console.log('🚀 ~ ~ cancellationCharges:', cancellationCharges)

    if (paid * 1 > cancellationCharges * 1) {
      console.log('-----> ~CASE~ intialPayment Greater (refund) ')

      const refundAmount = paid - cancellationCharges
      console.log('🚀  refundAmount:', refundAmount)
      if (refundAmount > 0.31) {
        const refund = await Stripe.refundPartialPayment(
          appointment.initialPaymentIntend,
          refundAmount,
        )
        if (refund?.id) {
          updatedBooking.refundAmount = refundAmount
          updatedBooking.refundPaymentIntend = refund?.id
        }
      } else {
        updatedBooking.total = appointment?.actualCapturedAmount
      }
      updatedBooking.status = 'cancel'
      updatedBooking.finalPayment = 'paid'
    } else if (paid * 1 < cancellationCharges * 1) {
      console.log('-----------> ~CASE~ cancellationCharges Greater (penalty)')
      const fineAmount = cancellationCharges - paid
      const fine = await Stripe.capturePayment(
        fineAmount,
        appointment.user?.stripeCustomerId,
        appointment.stripeCardId,
        appointment.salonDetail?.connectAccountId,
      )
      if (fine?.id) {
        updatedBooking.status = 'cancel'
        updatedBooking.finalPayment = 'paid'
        updatedBooking.penaltyAmount = fineAmount
        updatedBooking.penaltyPaymentIntend = fine?.id
      }
      console.log('ðŸš€ ----------->~Fine Captured Success', fine)
    } else {
      // Cancellation charges equal to upfront payment
      updatedBooking.status = 'cancel'
      updatedBooking.finalPayment = 'paid'

      console.log('-----> ~ Equal')
    }
    updatedBooking.cancellationCharges = cancellationCharges
    updatedBooking.actualCapturedAmount = cancellationCharges
    updatedBooking.total = cancellationCharges
    updatedBooking.initialPayment = paid
  } else {
    updatedBooking.status = 'cancel'
    updatedBooking.finalPayment = 'paid'
    updatedBooking.total = appointment?.actualCapturedAmount
  }
  updatedBooking.subTotal = appointment.total

  console.log(
    '🚀 ~ exports.cancelAppointment= ~ updatedBooking:',
    updatedBooking,
  )

  await booking.update(updatedBooking, { where: { id: bookingId } })

  if (updatedBooking.status == 'cancel') {
    await jobs.update({ status: 'cancel' }, { where: { bookingId } })
    calculatePayoutsOnBooking(appointment, finePercentage, 'cancel')
    cancelByCustomer(appointment.id) //Notifications etc
  }
  employeeCommission.update(
    { appointmentClosed: true },
    { where: { bookingId: bookingId } },
  )
  rentChairEarning.update(
    { appointmentClosed: true },
    { where: { bookingId: bookingId } },
  )
  const output = response({
    message: 'Appointment cancel successfully.',
    data: {},
  })
  return res.status(200).json(output)
}

//* 7.Book Appointment -----------------

exports.bookAppointment = async (req, res, next) => {
  const customerId = req.user.id
  const { appointment, services } = req.body
  console.log(
    '🚀 ~ exports.bookAppointment= ~ req.body:',
    JSON.stringify(req.body),
  )

  const hasAppointments = await booking.count({
    where: {
      salonDetailId: appointment.salonDetailId,
      customerId,
      status: 'complete',
    },
  })
  if (hasAppointments && hasAppointments > 0)
    appointment.customerStatus = 'repeat'

  appointment.customerId = customerId
  appointment.initialPaymentIntend = req.body.initialPaymentIntend
  if (req.body.paymentMethod === 'card') {
    if (!req.body.stripeCardId)
      throw new AppError(
        'Card not attached! Please attach card to proceed',
        200,
      )
    appointment.stripeCardId = req.body.stripeCardId
  } else if (req.body.paymentMethod === 'cash') {
    appointment.paymentMethod = 'cash'
  } else {
    throw new AppError('Please select payment a method first', 200)
  }

  appointment.startTime = DateManupulation.convertTo24HourFormat(
    appointment.startTime,
  )
  console.log('ðŸš€ ~ AFTER START-TIME', appointment.startTime)

  appointment.endTime = DateManupulation.convertTo24HourFormat(
    appointment.endTime,
  )
  appointment.by = 'online'
  const appointmentDate = new Date(appointment.on)
  const appointmentDay = DateManupulation.dayOnDate(appointmentDate)

  // services offered by single employees
  if (req.body.employeeId) {
    const availability = await jobs.findOne({
      where: {
        status: 'assign', //TODO add  Date check
        on: appointment.on,
        employeeId: req.body.employeeId,
        [Op.or]: [
          {
            // Case starts within the busy time range
            startTime: {
              [Op.between]: [appointment.startTime, appointment.endTime],
            },
          },
          {
            //  when ends within the busy time range
            endTime: {
              [Op.between]: [appointment.startTime, appointment.endTime],
            },
          },
          {
            //when within the job time range
            [Op.and]: [
              { startTime: { [Op.lte]: appointment.startTime } },
              { endTime: { [Op.gte]: appointment.endTime } },
            ],
          },
        ],
      },
      attributes: ['startTime', 'endTime'],
    })

    // if(availability){ return res.status(200).json(response({ status :'2',message:"Time slot booked by another customer"}))}//!TODO comment cause we already capture upfront amount.
  }

  let employeeData, JobsInput
  // services offered by multiple employees
  if (!req.body.employeeId) {
    employeeData = await employee.findAll({
      where: {
        salonDetailId: appointment.salonDetailId,
        deleted: false,
        status: true,
      },
      attributes: ['id'],
      include: [
        {
          model: employeeService,
          attributes: ['status'],
          include: {
            model: service,
            attributes: ['id'],
          },
        },
        {
          model: time,
          required: true,
          where: { day: appointmentDay },
          attributes: ['openingTime', 'closingTime'],
        },
        {
          model: jobs,
          where: { on: appointment.on, status: 'assign' },
          required: false,
          attributes: ['duration', 'startTime', 'endTime'],
        },
      ],
    })
    employeeData.sort((a, b) => a.jobs.length - b.jobs.length)
  }

  console.log(
    'ðŸš€~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€  services:',
    services,
  )
  const assignTimeSlots = Custom.scheduleSessions(appointment, services)
  console.log('ðŸš€ ~ assignTimeSlots:', assignTimeSlots)

  if (!req.body.employeeId) {
    JobsInput = Custom.assignEmployeesToServices(employeeData, assignTimeSlots)
  } else {
    JobsInput = assignTimeSlots.map((service) => ({
      ...service,
      employeeId: req.body.employeeId,
      status: 'assign',
    }))
  }
  const findUnAssign = JobsInput.find((el) => el.status === 'pending')
  if (findUnAssign) {
    console.log('ðŸš€ ~ findUnAssign:', findUnAssign)
    appointment.status = 'pending'
  }
  const book = await booking.create(appointment)
  if (!book)
    throw new AppError('Something went wrong appointment not booked', 200)

  //TODO  intial payment will be charge be Here

  const finalInput = JobsInput.map((service) => ({
    ...service,
    bookingId: book.id,
  }))

  const jobsData = await jobs.bulkCreate(finalInput)

  if (!jobsData || jobsData.length < 1) {
    await booking.destroy({ where: { id: book.id } })
    throw new AppError('Something went wrong appointment not booked.', 200)
  }

  //& Send Email Notification and Socket Event

  onlineAppointmentConfirm(book?.id)

  const output = response({
    message: 'Appointment booked successfully',
    data: { appointment: book?.id },
  })
  return res.status(200).json(output)
}

//* 4.5 Capture Payment info -----------------

exports.captureUpFrontPaymentInfo = async (req, res, next) => {
  //Partial payment upfront
  if (!req.body.onlinePayments)
    throw new AppError('Salon does not accept online payments.', 200)
  if (!req.body.stripeCustomerId)
    throw new AppError('Salon does not accept online payments.', 200)

  const upFrontAmount =
    req.body.advanceAmount && req.body.advanceAmount > 0
      ? parseFloat(req.body.advanceAmount)
      : 0
  const tip = req.body.tip ? parseFloat(req.body.tip) : 0
  const advanceAmount = upFrontAmount + tip
  const actualCapturedAmount = upFrontAmount
  const ephemeralKey = await Stripe.createEphemeralKey(
    req.body.stripeCustomerId,
  )
  const account = await salonDetail.findOne({
    where: { id: req.body.salonId },
    attributes: ['connectAccountId'],
  })
  //TODO Ensure that the payment goes to the specific salon's account, not the admin's account.
  const indent =
    advanceAmount > 0
      ? await Stripe.createPaymentIntendForUpFrontPayments(
          advanceAmount,
          req.body.stripeCustomerId,
          account.connectAccountId,
        )
      : null

  const data = {
    ephemeralKeySecret: ephemeralKey ? ephemeralKey.secret : '',
    client_secret: indent ? indent.client_secret : '',
    paymentIntendId: indent ? indent.id : '',
    initialPayment: upFrontAmount,
    tip: tip,
    actualCapturedAmount: actualCapturedAmount,
    stripeCustomerId: req.body.stripeCustomerId,
  }

  const output = response({ status: '1', message: 'Advance Payment.', data })
  return res.status(200).json(output)
}

//* 4.5.2 Capture Payment info For web-----------------

exports.captureUpFrontPaymentInfoFromWeb = async (req, res, next) => {
  //Partial payment upfront
  if (!req.body.onlinePayments)
    throw new AppError('Salon does not accept online payments.', 200)
  if (!req.body.stripeCustomerId)
    throw new AppError('Salon does not accept online payments.', 200)

  const upFrontAmount =
    req.body.advanceAmount && req.body.advanceAmount > 0
      ? parseFloat(req.body.advanceAmount)
      : 0
  const tip = req.body.tip ? parseFloat(req.body.tip) : 0
  const advanceAmount = upFrontAmount + tip
  const actualCapturedAmount = upFrontAmount
  //TODO Ensure that the payment goes to the specific salon's account, not the admin's account.
  const paymentLink =
    advanceAmount > 0
      ? await Stripe.sessionCheckoutPaymnet(
          advanceAmount,
          req.body.success_url,
          req.body.cancel_url,
        )
      : null

  const data = {
    url: paymentLink ? paymentLink.url : '',
    paymentIntendId: paymentLink ? paymentLink.id : '',
    initialPayment: upFrontAmount,
    tip: tip,
    actualCapturedAmount,
    stripeCustomerId: req.body.stripeCustomerId,
  }

  const output = response({ status: '1', message: 'Advance Payment.', data })
  return res.status(200).json(output)
}

//* 5.fetch Appointments -----------------

exports.fetchAppointments = async (req, res, next) => {
  // TODO Filters
  const userId = req.user.id
  // `cancellationPolicyVersion`, `reschedulePolicyVersion`, `upFrontPolicyVersion`, `noshowPolicyVersion`
  const appointments = await booking.findAll({
    where: {
      customerId: userId,
      // status: { [Op.or]: ['pending', 'book'] }
    },
    attributes: [
      'id',
      'status',
      'startTime',
      'endTime',
      'on',
      'total',
      'subTotal',
      'noshowCharges',
      'cancellationCharges',
      [
        literal(
          '(SELECT COUNT(*) FROM jobs WHERE jobs.bookingId = booking.id)',
        ),
        'serviceCount',
      ],
    ],
    include: [
      {
        model: salonDetail,
        attributes: ['salonName', 'coverImage'],
        include: { model: addressDBS, attributes: ['streetAddress', 'city'] },
      },
    ],
  })

  return res.status(200).json(
    response({
      data: { appointments: appointments, currencyUnit: CURRENCY_UNIT },
    }),
  )
}

//* 6.fetch Appointment Details ----------------------

exports.fetchAppointmentsDetails = async (req, res, next) => {
  const id = req.params.id
  const data = await booking.findOne({
    where: { id },
    attributes: [
      'id',
      `status`,
      `discount`,
      `total`,
      'actualCapturedAmount',
      'tip',
      `initialPayment`,
      `startTime`,
      `endTime`,
      `duration`,
      `on`,
      'rating',
      'upFrontPaymentPercentage',
      'initialPaymentIntend',
      'cancellationPolicyVersion',
      `reschedulePolicyVersion`,
      `upFrontPolicyVersion`,
      `noshowPolicyVersion`,
      'noshowCharges',
      'cancellationCharges',
      'penaltyAmount',
      'refundAmount',
      'reScheduleCount',
      'finalPayment',
      'subTotal',
      'paymentMethod',
      'feedback',
      'salonReply',
      [
        literal(
          '(SELECT FORMAT(AVG(ratings.value), 1) FROM ratings WHERE ratings.bookingId = booking.id)',
        ),
        'appointmentRating',
      ],
    ],
    include: [
      {
        model: salonDetail,
        attributes: [
          'id',
          `salonName`,
          `coverImage`,
          'connectAccountId',
          'isOnline',
          'description',
        ],
        include: [
          {
            model: addressDBS,
            attributes: [
              `id`,
              `streetAddress`,
              `building`,
              `floor`,
              `apartment`,
              `district`,
              `city`,
              `country`,
              `lat`,
              `lng`,
            ],
          },
          {
            model: user,
            attributes: [`countryCode`, `phoneNum`, 'stripeCustomerId'],
          },
        ],
      },
      {
        model: jobs,
        attributes: [
          `id`,
          `status`,
          `total`,
          `duration`,
          'employeeId',
          'tip',
          'extra',
        ],
        include: [
          {
            model: employee,
            attributes: ['id'],
            include: { model: user, attributes: [`firstName`, `lastName`] },
          },
          { model: service, attributes: [`id`, `serviceName`] },
        ],
      },
    ],
  })

  const actualJobs = data.jobs.map((el) => {
    const obj = el.toJSON()

    if (obj.employee) {
      obj.employee = `${obj.employee.user.firstName} ${obj.employee.user.lastName}`
      obj.employeeId = `${obj.employeeId}`
    } else {
      obj.employee = ''
      obj.employeeId = ``
    }
    return obj
  })

  const output = data.toJSON()
  output.jobs = actualJobs

  const policies = await salonDetail.findOne({
    where: { id: output.salonDetail.id },
    attributes: ['id', 'salonName'],
    include: [
      {
        model: cancellationPolicy,
        as: 'cancellationPolicies',
        where: { version: output.cancellationPolicyVersion },
        attributes: [
          'id',
          'hoursBeforeBooking',
          'refundPercentage',
          'status',
          'version',
        ],
      },
      {
        model: noShowPolicy,
        as: 'noShowPolicies',
        where: { version: output.noshowPolicyVersion },
        attributes: ['id', 'refundPercentage', 'status', 'version'],
      },
      {
        model: reschedulePolicy,
        as: 'reschedulePolicies',
        where: { version: output.reschedulePolicyVersion },
        attributes: ['id', 'hoursBeforeBooking', 'count', 'version', 'status'],
      },
      {
        model: paymentPolicy,
        as: 'paymentPolicies',
        where: { version: output.upFrontPolicyVersion },
        attributes: ['id', 'percentage', 'status', 'version'],
      },
    ],
    order: [
      [cancellationPolicy, 'hoursBeforeBooking', 'ASC'], // Order by 'hoursBeforeBooking' in 'cancellationPolicies'
      [reschedulePolicy, 'hoursBeforeBooking', 'ASC'], // Order by 'hoursBeforeBooking' in 'reschedulePolicies'
    ],
  })

  return res.status(200).json(
    response({
      data: { appointments: output, policies, currencyUnit: CURRENCY_UNIT },
    }),
  )
}

//~ AppointMent Journey ends

//!STRIPE

//* 1.Stripe Add Card -----------------

exports.addCard = async (req, res, next) => {
  const { cardName, cardExpYear, cardExpMonth, cardNumber, cardCVC } = req.body
  const customerID = req.user.id
  const customer = await user.findByPk(customerID, {
    attributes: ['firstName', 'lastName', 'email', 'stripeCustomerId'],
  })
  let customerId = null
  if (!customer) throw new AppError('User not found!', 200)
  if (!customer.stripeCustomerId) {
    const fullName = `${customer.firstName} ${customer.lastName}`
    const stripeCustomerId = await Stripe.addCustomer(fullName, customer.email)
    await user.update({ stripeCustomerId }, { where: { id: customerID } })
    customerId = stripeCustomerId
  } else {
    customerId = customer.stripeCustomerId
  }
  req.body.customerId = customerId
  if (customerId === null) throw new AppError('Something Went Wrong', 200)

  // const cardData = await Stripe.addCard(
  //   customerId,
  //   cardName,
  //   cardExpYear,
  //   cardExpMonth,
  //   cardNumber,
  //   cardCVC);

  const cardData = await Stripe.addCard(req.body)
  const output = response({
    message: 'Card Added successfully',
    data: { stripePaymentId: cardData },
  })
  return res.status(200).json(output)
}

/*
 * 2.Get Cards   ___________________________________
 */

exports.fetchCards = async (req, res, next) => {
  const userId = req.user.id
  console.log('🚀 ~ ~ userId:', userId)
  const customer = await user.findByPk(userId, {
    attributes: ['firstName', 'lastName', 'email', 'stripeCustomerId'],
  })
  if (customer.stripeCustomerId === null || customer.stripeCustomerId === '') {
    const output = response({ message: 'All cards', data: { cards: [] } })
    return res.status(200).json(output)
  }
  const customerId = customer.stripeCustomerId
  const allCards = await Stripe.cards(customerId)
  console.log('🚀 ~ ~ customerId:', customerId)

  const stripeCards = allCards.data.map((obj) => ({
    id: obj.id,
    name: obj.billing_details.name,
    brand: obj.card.brand,
    expMonth: obj.card.exp_month,
    expYear: obj.card.exp_year,
    last4: obj.card.last4,
    funding: obj.card.funding,
  }))

  console.log('🚀 ~ stripeCards ~ stripeCards:', stripeCards)

  const output = response({ data: { cards: stripeCards } })

  return res.status(200).json(output)
}

/*
 *3.delete Card __________________________________
 */

exports.detachCard = async (req, res, next) => {
  const pmId = req.params.pm
  const detach = await Stripe.cardDetach(pmId)
  const output = response({ message: 'Card detach success', data: detach })
  return res.status(200).json(output)
}

//!Promo Code

//* 1.Apply Coupon -----------------

exports.applyCoupon = async (req, res, next) => {
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
  const { salonId, promoCode } = req.body
  const data = await coupon.findOne({
    where: { promoCode, salonDetailId: salonId },
    attributes: [`id`, `promoCode`, `type`, `status`, `value`],
  })
  if (!data) throw new AppError('Invalid promo code', 200)
  if (data.status === 'expire') throw new AppError('Promo code Exprie.', 200)
  const output = response({ message: 'success', data: { promoCode: data } })
  return res.status(200).json(output)
}

//~ Reschedule & cancel

//!Drawer

//* 1.Update Profile Image -----------------

exports.profileImageUpdate = async (req, res, next) => {
  const userId = req.user.id
  const data = await user.findByPk(userId, {
    attributes: ['id'],
  })
  if (!data) throw new AppError('User Not found', 200)

  if (!req.file) throw new AppError('Please provide image.', 200)
  let tmpPath = req.file.path
  let imagePath = tmpPath.replace(/\\/g, '/')
  await user.update({ image: imagePath }, { where: { id: userId } })

  const output = response({
    message: 'Profile Image updated.',
    data: { image: imagePath },
  })
  return res.status(200).json(output)
}

//* 2.Update profile data -----------------

exports.UpdateProfileData = async (req, res, next) => {
  const userId = req.user.id
  const data = req.body
  await user.update(data, { where: { id: userId } })

  const output = response({ message: 'Profile data updated.', data })
  return res.status(200).json(output)
}

//!Favorites

//* 1.like Dislike  -----------------

exports.likeDislike = async (req, res, next) => {
  const userId = req.user.id
  const salonDetailId = req.params.salon
  let msg = 'Like'

  const data = await favorite.findOne({
    where: { userId, salonDetailId },
    attributes: ['id'],
  })

  if (data) {
    await data.destroy()
    msg = 'Dislike'
  } else {
    await favorite.create({ userId, salonDetailId })
  }

  await user.update(data, { where: { id: userId } })

  const output = response({ message: `${msg}.` })
  return res.status(200).json(output)
}

//!Reviews and Ratings

//* 1.Fetch Reviews And Ratings  -----------------

exports.ratingAndReviews = async (req, res, next) => {
  const userId = req.user.id
  const condition = {
    customerId: userId,
    status: 'complete',
    rating: 'pending',
  }

  if (req.params.appointment) {
    condition.rating = { [Op.or]: ['pending', 'skiped'] }
    condition.id = req.params.appointment
  }

  const appointment = await booking.findOne({
    where: condition,
    attributes: ['id', `status`, `startTime`, 'endTime', `on`, 'stripeCardId'],
    include: [
      {
        model: salonDetail,
        attributes: ['id', `salonName`, 'coverImage'],
        include: { model: addressDBS, attributes: [`streetAddress`, `city`] },
      },
      {
        model: jobs,
        attributes: ['id'],
        include: [
          { model: service, required: true, attributes: ['id', 'serviceName'] },
          {
            model: employee,
            required: true,
            attributes: ['id', 'position'],
            include: {
              model: user,
              attributes: ['firstName', 'lastName', 'image'],
            },
          },
        ],
      },
    ],
  })

  if (!appointment)
    throw new AppError(
      'Currently, there is nothing that requires review or feedback.',
      200,
    )

  const epmloyess = Object.values(
    appointment.jobs.reduce((acc, job) => {
      const employeeId = job.employee.id
      const serviceName = job.service.serviceName.trim()
      const employee = job.employee.user

      if (!acc[employeeId]) {
        acc[employeeId] = { id: employeeId, employee: employee, services: [] }
      }

      if (!acc[employeeId].services.includes(serviceName)) {
        acc[employeeId].services.push(serviceName)
      }
      return acc
    }, {}),
  )

  const result = {
    appointmentId: appointment.id,
    on: appointment.on,
    stripeCardId: appointment.stripeCardId,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    salonDetail: appointment.salonDetail,
    epmloyess,
  }

  const output = response({ message: `success`, data: result })
  return res.status(200).json(output)
}

//* 2.Rate Employees  -----------------

exports.rateEmployes = async (req, res, next) => {
  const userId = req.user.id
  const { salonDetailId, appointmentId, at, employeesRating, comment } =
    req.body

  employeesRating.forEach((el) => {
    el.salonDetailId = salonDetailId
    el.at = at
    el.userId = userId
    el.bookingId = appointmentId
  })

  await rating.bulkCreate(employeesRating)

  await booking.update(
    { rating: 'done', feedback: comment },
    { where: { id: appointmentId } },
  )
  feedBack(appointmentId, comment, employeesRating)
  const output = response({
    message: `Thank you for your feedback! We appreciate it.`,
    data: {},
  })

  return res.status(200).json(output)
}

//* 2.Rate Employees  -----------------

exports.skipRating = async (req, res, next) => {
  const { doNotShow, appointmentId } = req.body
  const status = doNotShow ? 'cancel' : 'skiped'
  await booking.update({ rating: status }, { where: { id: appointmentId } })

  const output = response({ message: `success`, data: {} })
  return res.status(200).json(output)
}

//!Stripe Customers Ephemeral Key Secret

//* 2.Rate Employees  -----------------

exports.renewEphemeralSecret = async (req, res, next) => {
  const userId = req.user.id

  const userExist = await user.findByPk(userId, {
    attributes: [
      'id',
      'firstName',
      'lastName',
      'email',
      'status',
      'image',
      'stripeCustomerId',
    ],
  })

  if (!userExist) throw new AppError('resource not Found', 200)

  const fullName = `${userExist.firstName} ${userExist.lastName}`

  const stripeCustomerId =
    userExist.stripeCustomerId ||
    (await Stripe.addCustomer(fullName, userExist.email))
  const ephemeralKeySecret = await Stripe.createEphemeralKey(stripeCustomerId)
  console.log('🚀 ~ exports.signup= ~ ephemeralKeySecret:', ephemeralKeySecret)
  const expiry = DateManupulation.stampToDate(ephemeralKeySecret.expires)
  // console.log('🚀 ~ exports.signup= ~ expiry:', expiry)
  //

  const input = {
    stripeCustomerId,
    ephemeralKeySecret: ephemeralKeySecret.id,
    ephemeralKeyExpireAt: expiry,
  }

  if (!userExist.stripeCustomerId) input.stripeCustomerId = stripeCustomerId

  await user.update(input, { where: { id: userExist.id } })

  userExist.stripeCustomerId = stripeCustomerId
  userExist.ephemeralKeySecret = ephemeralKeySecret.id
  userExist.ephemeralKeyExpireAt = expiry

  const output = response({ message: `success`, data: userExist })
  return res.status(200).json(output)
}

//!Salon Policies

//* 1.Policies  -----------------

exports.salonPolicies = async (req, res, next) => {
  const salonDetailId = req.params.salon
  console.log('🚀 ~ exports.salonPolicies= ~ salonDetailId:', salonDetailId)

  const output = await salonDetail.findOne({
    where: { id: salonDetailId },
    attributes: ['id', 'salonName'],
    include: [
      {
        model: cancellationPolicy,
        where: { status: true },
        attributes: { exclude: ['createdAt', 'updatedAt', 'salonDetailId'] },
      },
      {
        model: depositPolicy,
        where: { status: true },
        attributes: { exclude: ['createdAt', 'updatedAt', 'salonDetailId'] },
      },
      {
        model: noShowPolicy,
        where: { status: true },
        attributes: { exclude: ['createdAt', 'updatedAt', 'salonDetailId'] },
      },
      {
        model: reschedulePolicy,
        where: { status: true },
        attributes: { exclude: ['createdAt', 'updatedAt', 'salonDetailId'] },
      },
      {
        model: paymentPolicy,
        where: { status: true },
        attributes: { exclude: ['createdAt', 'updatedAt', 'salonDetailId'] },
      },
    ],
  })

  return res.status(200).json(output)
}

//!Client Feedback

//* 1. Client Feedback  -----------------

exports.clientFeedBack = async (req, res, next) => {
  let limit = 2
  const condition = {}
  if (req.query.limit) limit = req.query.limit * 1
  if (req.params.salon) condition.salonDetailId = req.params.salon
  if (req.params.employee) condition.employeeId = req.params.employee
  if (req.params.client) condition.userId = req.params.client
  if (req.params.booking) condition.bookingId = req.params.booking

  const feedbacks = await rating.findAll({
    where: condition,
    limit: limit,
    attributes: ['id', 'value', 'comment', 'createdAt', 'bookingId'],
    include: [
      {
        model: user,
        attributes: ['firstName', 'lastName', 'image'],
      },
      {
        model: employee,
        attributes: ['id', 'position'],
        include: { model: user, attributes: ['firstName', 'lastName'] },
      },
    ],

    order: [['createdAt', 'DESC']],
  })

  const feedbackCount = await rating.count({ where: condition })

  return res.json(
    response({
      message: 'Client Feedbacks.',
      data: { limit, feedbacks, feedbackCount },
    }),
  )
}

//!Account Delete
//* 1. Customer Account Delete
exports.accountDelete = async (req, res, next) => {
  const id = req.user.id
  const data = await user.findOne({
    where: { id },
    attributes: [
      'firstName',
      'lastName',
      'image',
      'email',
      'countryCode',
      'phoneNum',
    ],
  })

  await deletedCustomer.create({ userId: id, ...data.get({ plain: true }) })
  await user.update(
    {
      deleted: true,
      firstName: 'Anonymous',
      lastName: 'Customer',
      email: `Anonymous${id}@gmail.com`,
      countryCode: '+00',
      phoneNum: '000 0000000',
      image: '',
    },
    { where: { id } },
  )
  deviceToken.destroy({ where: { userId: id } })
  return res.json(response({ message: 'Account Deleted.', data: {} }))
}

//! Notifications
//* 1. Fetch Notifications

exports.fetchNotifications = async (req, res, next) => {
  const id = req.user.id

  const notifications = await pushNotification.findAll({
    where: { userId: id },
    attributes: [`id`, `at`, `to`, `title`, `body`, `data`],
  })

  return res.json(
    response({ message: 'Notifications.', data: { notifications } }),
  )
}

//!Logout

//* 1. logout
exports.logout = async (req, res, next) => {
  const id = req.user.id
  deviceToken.destroy({ where: { userId: id, tokenId: req.user.dvToken } })
  return res.json(response({ message: 'Logout.', data: {} }))
}

//!Salon Subcription

//* 1.Subcription From Client-Side  -----------------

exports.forSubcriptionPurchase = async (req, res, next) => {
  const salon = await user.findOne({
    where: { id: req.user.id },
    attributes: ['id', 'stripeCustomerId', 'firstName', 'lastName', 'email'],
  })
  if (!salon) throw new AppError('resource not found', 200)

  // TODO salon already have subscripiton
  console.log('Ã°Å¸Å¡â‚¬ ~ = ~ req.body:', req.body)
  //   return res.json(req.body);
  let stripeCustomer = salon?.stripeCustomerId
  if (!salon?.stripeCustomerId) {
    const stripeCustomerId = await Stripe.addCustomer(
      salon.fullName,
      salon.email,
    )
    stripeCustomer = stripeCustomerId
    await user.update({ stripeCustomerId }, { where: { id: salon.id } })
  }
  const metadata = {
    members: req.body?.members,
    subscriptionName: req.body.subscriptionName,
    sloanId: salon.id,
    membersCount: req.body?.membersCount,
    freeTrialDays: req.body?.freeTrialDays || 0,
    paymentMethodId: req.body?.paymentMethodId,
    priceId: req.body?.priceId,
  }
  //   {
  //   priceId: 'price_1QMk38IUi1Nn55FG2GP2Oxoq',
  //   members: 'limited',
  //   membersCount: 3,
  //   freeTrialDays: 1,
  //   paymentMethodId: 'pm_1QOybVIUi1Nn55FGghbBphUh',
  //   teamSize: 1,
  //   subscriptionName: 'Owner + 3 members'
  // }
  console.log(
    'Ã°Å¸Å¡â‚¬ ~ stripeCustomer.stripeCustomer= ~ stripeCustomer:',
    stripeCustomer,
  )
  // const ephemeralKey = await Stripe.createEphemeralKey(stripeCustomer)
  const indent = await Stripe.createSubscriptionWithPriceId(
    stripeCustomer,
    req.body.priceId,
    metadata,
    req.body.memberCount,
    req.body?.freeTrialDays || 0,
    req.body.paymentMethodId,
  )
  //   return res.json(indent);

  await salonDetail.update(
    {
      teamSize: req.body?.membersCount,
      metadata,
      subscriptionPrice: req.body.subscriptionPrice,
    },
    { where: { userId: salon.id } },
  )
  const data = {
    ephemeralKeySecret: 'ephemeralKey.secret',
    client_secret: 'indent?.latest_invoice?.payment_intent?.client_secret',
    subscriptionId: indent.id,
    stripeCustomerId: stripeCustomer,
  }
  const output = response({ status: '1', message: 'Payment.', data })

  return res.status(200).json(output)
}

exports.forSubcriptionUpdate = async (req, res, next) => {
  const salon = await user.findOne({
    where: { id: req.user.id },
    attributes: [
      'id',
      'stripeCustomerId',
      'firstName',
      'lastName',
      'email',
      'subscriptionPlan',
    ],
  })
  if (!salon) throw new AppError('resource not found', 200)
  console.log('ðŸš€ ~ exports.forSubcription= ~ salonsalonsalona:', salon)
  let stripeCustomer = salon?.stripeCustomerId
  if (!salon?.stripeCustomerId) {
    const stripeCustomerId = await Stripe.addCustomer(
      salon.fullName,
      salon.email,
    )
    stripeCustomer = stripeCustomerId
    await user.update({ stripeCustomerId }, { where: { id: salon.id } })
  }
  const metadata = {
    members: req.body.members,
    subscriptionName: req.body.subscriptionName,
    sloanId: salon.id,
  }
  console.log(
    'ðŸš€ ~ stripeCustomer.stripeCustomer= ~ stripeCustomer:',
    stripeCustomer,
  )
  const ephemeralKey = await Stripe.createEphemeralKey(stripeCustomer)
  const indent = await Stripe.createSubscriptionWithPriceId(
    stripeCustomer,
    req.body.priceId,
    metadata,
    req.body.memberCount,
    req.body.freeTrialDays,
    req.body.paymentMethodId,
  )
  //   return res.json(indent);
  const data = {
    ephemeralKeySecret: 'ephemeralKey.secret',
    client_secret: 'indent?.latest_invoice?.payment_intent?.client_secret',
    subscriptionId: indent.id,
    stripeCustomerId: stripeCustomer,
  }
  const output = response({ status: '1', message: 'Payment.', data })

  return res.status(200).json(output)
}
//* 2. Check Subcription Feedback  -----------------

exports.checkSubscription = async (req, res, next) => {
  const subscription = await Stripe.subscriptionsRetrieve(
    req.body.subscriptionId,
  )

  const data = {
    subscription,
  }

  const output = response({ status: '1', message: 'subscription.', data })

  return res.status(200).json(output)
}
