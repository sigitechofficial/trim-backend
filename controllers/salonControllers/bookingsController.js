const { Op, literal, col, fn, where } = require('sequelize')
const {
  salonDetail,
  addressDBS,
  coupon,
  employee,
  time,
  category,
  service,
  booking,
  user,
  jobs,
  cancelledBooking,
  reason,
  employeeService,
  rating,
  wallet,
  cancellationPolicy,
  noShowPolicy,
  reschedulePolicy,
  paymentPolicy,
  salonTimeHistory,
  blockCustomer,
  deviceToken,
  unAcknowledgedEvents,
  employeeCommission,
  rentChairEarning,
  employeeWagesMethod,
} = require('../../models')
const Stripe = require('../stripe')
const appError = require('../../utils/appError')
const Slot = require('../../utils/timeSlots')
const dateManipulation = require('../../utils/dateManipulation')
const Custom = require('../../utils/customFunctions')
const Convert = require('../../utils/dateManipulation')
const { response } = require('../../utils/response')
const { emailDateFormate } = require('../../utils/emailDateFormate')
const ThrowNotification = require('../../utils/throwNotification')
const {
  bookingDataForEmailAndNotifications,
} = require('../../utils/emailsNotificationsData')
const { employeeForSocket } = require('../../utils/socketUtilities')
const {
  bookingFormat,
  formatedBookingsDetail,
} = require('../../utils/dataFormatorsForSalon')

const { distributeTip } = require('../../utils/tipDistribution')
const {
  walkinAppointmentConfirm,
} = require('../eventDrivenCommunication/appointmentConfirm')

const { sendEvent } = require('../../socket_io')
const AppError = require('../../utils/appError')

const {
  calculatePayoutsOnService,
  calculatePayoutsOnBooking,
} = require('./payoutController')
const Communication = require('../eventDrivenCommunication/appointmentCheckout')
const {
  cancelBySalon,
} = require('../eventDrivenCommunication/appointmentCancel')

const {
  noShowMessages,
} = require('../eventDrivenCommunication/appointmentNoshow')

const {
  fromSalonMultipleEmployees,
} = require('../eventDrivenCommunication/appointmentReschedule')

const { editJob } = require('../eventDrivenCommunication/jobUpdate')

//! Return Function
let returnFunction = (status, message, data, error) => {
  return {
    status: `${status}`,
    message: `${message}`,
    data: data,
    error: `${error}`,
  }
}

//* Home:1 Calendar view with filters
exports.calendarAppointments = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req?.user?.id },
    attributes: ['id'],
  })

  if (!salon) {
    throw new AppError('Resource not found', 404)
  }
  const employeCondition = {
    salonDetailId: salon?.id,
  }
  const jobCondition = {
    status: {
      [Op.or]: ['assign'],
    },
    on: req.params?.date,
  }
  const unAssignCondition = {
    status: {
      [Op.or]: ['pending'],
    },
    on: req.params.date,
    [Op.and]: literal(`EXISTS (
      SELECT 1
      FROM bookings
      WHERE bookings.id = jobs.bookingId
      AND bookings.salonDetailId = ${salon?.id}
    )`),
  }

  if (req.body?.employeeList && req.body?.employeeList.length > 0)
    employeCondition.id = { [Op.or]: req.body?.employeeList }

  if (req.body?.serviceList && req.body?.serviceList.length > 0) {
    jobCondition.serviceId = { [Op.or]: req.body?.serviceList }
    unAssignCondition.serviceId = { [Op.or]: req.body?.serviceList }
  }

  const data = await employee.findAll({
    where: employeCondition,
    attributes: [
      'id',
      // 'salonDetailId',
      'position',
      [
        literal(
          `(SELECT users.firstName
           FROM users WHERE users.id = employee.userId)`,
        ),
        'firstName',
      ],
      [
        literal(
          `(SELECT users.lastName
           FROM users WHERE users.id = employee.userId)`,
        ),
        'lastName',
      ],
      [
        literal(
          `(SELECT users.image
           FROM users WHERE users.id = employee.userId)`,
        ),
        'image',
      ],
      [
        literal(
          `(SELECT times.openingTime
           FROM times WHERE times.employeeId = employee.id AND times.day = '${req.params.day}')`,
        ),
        'openingTime',
      ],
      [
        literal(
          `(SELECT times.closingTime
           FROM times WHERE times.employeeId = employee.id AND times.day = '${req.params.day}')`,
        ),
        'closingTime',
      ],
      [
        literal(
          `(SELECT times.status
           FROM times WHERE times.employeeId = employee.id AND times.day = '${req.params.day}')`,
        ),
        'dayStatus',
      ],
    ],
    include: [
      {
        model: jobs,
        required: false,
        where: jobCondition,
        attributes: [
          'id',
          'on',
          'startTime',
          'endTime',
          'total',
          'duration',
          'serviceDiscount',
          'extraDiscount',
          'serviceId',
          'employeeId',
          'bookingId',
          [
            literal(
              `(SELECT services.serviceName
             FROM services WHERE services.id = jobs.serviceId)`,
            ),
            'serviceName',
          ],
          [
            literal(
              `(SELECT categories.color
                FROM services
                INNER JOIN categories ON services.categoryId = categories.id
                WHERE services.id = jobs.serviceId
                LIMIT 1)`,
            ),
            'color',
          ],

          [
            literal(
              `(SELECT CONCAT(users.firstName, ' ', users.lastName)
                FROM users
                INNER JOIN bookings ON bookings.customerId = users.id
                WHERE bookings.id = jobs.bookingId
                LIMIT 1)`,
            ),
            'customerName',
          ],
          [
            literal(
              `(SELECT bookings.customerId
             FROM bookings WHERE bookings.id = jobs.bookingId)`,
            ),
            'customerId',
          ],
        ],
      },
    ],
  })
  const results = JSON.parse(JSON.stringify(data))
  const startOfDay = '00:00:00'
  const endOfDay = '23:59:59'

  // Process each employee to set default opening and closing times if needed
  results.forEach((employee) => {
    if (!employee.dayStatus || !employee.openingTime) {
      employee.openingTime = startOfDay
    }
    if (!employee.dayStatus || !employee.closingTime) {
      employee.closingTime = endOfDay
    }
  })

  const salonTimes = await time.findOne({
    where: { salonDetailId: salon?.id, day: req.params?.day },
    attributes: ['openingTime', 'closingTime', 'status'],
  })

  const unAssignedJobs = await jobs.findAll({
    where: unAssignCondition,
    attributes: [
      'id',
      'on',
      'startTime',
      'endTime',
      'serviceId',
      'employeeId',
      'bookingId',
      [
        literal(
          `(SELECT services.serviceName
         FROM services WHERE services.id = jobs.serviceId)`,
        ),
        'serviceName',
      ],
      [
        literal(
          `(SELECT categories.color
            FROM services
            INNER JOIN categories ON services.categoryId = categories.id
            WHERE services.id = jobs.serviceId
            LIMIT 1)`,
        ),
        'color',
      ],

      [
        literal(
          `(SELECT CONCAT(users.firstName, ' ', users.lastName)
            FROM users
            INNER JOIN bookings ON bookings.customerId = users.id
            WHERE bookings.id = jobs.bookingId
            LIMIT 1)`,
        ),
        'customerName',
      ],
      [
        literal(
          `(SELECT bookings.customerId
         FROM bookings WHERE bookings.id = jobs.bookingId)`,
        ),
        'customerId',
      ],
    ],
  })

  if (unAssignedJobs.length > 0) {
    const unassign = {
      id: 0,
      position: '',
      firstName: 'UnAssigned',
      lastName: '',
      openingTime: salonTimes?.openingTime,
      closingTime: salonTimes?.closingTime,
      dayStatus: salonTimes?.status ? 1 : 0,
      jobs: unAssignedJobs,
    }
    results.push(unassign)
  }

  const output = response({
    message: 'Success.',
    data: { salonTimes, employees: results || [] },
  })
  return res.status(200).json(output)
}

//! bookings
/*
            4.Home
    ________________________________________
*/
exports.salonBookings = async (req, res, next) => {
  const userId = req.user.id
  let bookings = []
  // Get current date using Date object
  const currentDate = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const filters = []

  if (req.body?.employeeId && req.body?.employeeId.length > 0) {
    filters.push({ employeeId: { [Op.in]: req.body.employeeId } })
  }
  if (req.body?.serviceId && req.body?.serviceId.length > 0) {
    filters.push({ serviceId: { [Op.in]: req.body?.serviceId } })
  }
  const jobFilter = filters.length > 0 ? { [Op.or]: filters } : {}

  const result = await booking.findAll({
    where: {
      status: {
        [Op.or]: ['book', 'pending'],
      },
      [Op.and]: literal(`EXISTS (
      SELECT 1
      FROM salonDetails
      WHERE salonDetails.id = booking.salonDetailId
      AND salonDetails.userId = ${userId}
    )`),
      clientRemoved: false,
    },
    attributes: [
      `id`,
      `status`,
      `subTotal`,
      `discount`,
      `total`,
      `actualCapturedAmount`,
      `startTime`,
      `endTime`,
      `duration`,
      `on`,
      `tip`,
      'clientFirstName',
      'clientLastName',
      'countryCode',
      'phoneNum',
      [
        literal(`(SELECT CONCAT(users.firstName, ' ', users.lastName)
                FROM users
                WHERE users.id = booking.customerId)`),
        'fullName',
      ],
      [
        literal(
          `(SELECT users.email
         FROM users WHERE users.id = booking.customerId)`,
        ),
        'email',
      ],
      [
        literal(
          `(SELECT users.image
         FROM users WHERE users.id = booking.customerId)`,
        ),
        'image',
      ],
    ],
    include: [
      {
        model: jobs,
        attributes: [
          'serviceId',
          'employeeId',
          [
            literal(
              `(SELECT services.serviceName
             FROM services WHERE services.id = jobs.serviceId)`,
            ),
            'serviceName',
          ],
          [
            literal(
              `(SELECT users.firstName
             FROM users
             JOIN employees ON employees.userId = users.id
             WHERE employees.id = jobs.employeeId)`,
            ),
            'employeeFirstName',
          ],
        ],
        where: jobFilter,
      },
    ],
  })
  const bookingList = JSON.parse(JSON.stringify(result))

  const salonEmployee = await employee.findAll({
    where: {
      [Op.and]: literal(`EXISTS (
        SELECT 1
        FROM salonDetails
        WHERE salonDetails.id = employee.salonDetailId
        AND salonDetails.userId = ${userId}
      )`),
    },
    include: [
      {
        model: user,
        attributes: ['firstName', 'lastName', 'image', 'email'],
      },
    ],
    attributes: {
      exclude: ['description', 'coverImage', 'createdAt', 'updatedAt'],
    },
  })

  let statTime, endTime
  //   return res.json(bookingList)
  let assigned = true

  bookingList.map((booking, idx) => {
    let services = []
    let specialists = []
    booking.jobs.map((ele) => {
      if (ele.employeeId === null) {
        assigned = false
      }
      if (ele?.employeeFirstName) {
        specialists.push(ele?.employeeFirstName || '')
      }
      services.push(ele?.serviceName || '')
    })
    const remaining =
      parseFloat(booking.total) +
      parseFloat(booking.discount) -
      parseFloat(booking.actualCapturedAmount)

    statTime = dateManipulation.convertTo12HourFormat(booking.startTime)
    endTime = dateManipulation.convertTo12HourFormat(booking.endTime)

    let retObj = {
      id: booking.id,
      status: booking.status,
      statTime,
      endTime,
      scheduleDate: booking.on,
      duration: booking.duration,
      assigned,
      client: `${booking.fullName || booking.clientFirstName}`,
      clientEmail: `${booking.email || booking.clientLastName}`,
      clientImage: `${booking.image || ''}`,
      total: booking.total,
      services,
      specialists: specialists.length > 0 ? [...new Set(specialists)] : [''],
    }
    bookings.push(retObj)
  })

  return res.json(
    returnFunction(
      '1',
      'Salon All Bookings',
      { salonEmployee, bookings: bookings.reverse() },
      '',
    ),
  )
}

/*
            4.Filtered Bookings
*/
exports.getbookingByFilter = async (req, res, next) => {
  const userId = req.user.id
  let { employeeId, serviceId, orderStatus } = req.body
  // let price = req.query.price;
  // ...(req.body.price && {
  //   id: {
  //     [Op.in]: literal(`(
  //       SELECT DISTINCT salonDetailId FROM services
  //       WHERE services.salonDetailId = salonDetail.id
  //         AND services.price <= ${req.body.price}
  //     )`),
  //   },
  // }),
  let filteredBooking = []
  const bookingList = await booking.findAll({
    where: {
      status: {
        [Op.or]: ['book', 'pending'],
      },
      clientRemoved: false,
    },
    include: [
      {
        model: user,
      },
      {
        model: jobs,
        include: { model: service },
      },
      {
        model: salonDetail,
        where: {
          userId,
        },
      },
    ],
  })
  let statTime, endTime
  bookingList.map((booking, idx) => {
    if (serviceId) {
      let found = booking.jobs.find(
        (ele) => ele.service.id === parseInt(serviceId),
      )
      if (!found) return null
    }

    if (employeeId) {
      let found = booking.jobs.find(
        (ele) => ele.employeeId === parseInt(employeeId),
      )
      if (!found) return null
    }

    if (orderStatus) {
      const status = orderStatus === 'unAssigned' ? 'pending' : 'assign'
      console.log('🚀 ~ exports.status= ~ status:', status)
      let found = booking.jobs.find((ele) => ele.status === status)
      if (!found) return null
    }

    let assigned = true
    let services = []
    let specialists = []
    booking.jobs.map((ele) => {
      if (ele.employeeId === null) {
        assigned = false
      }
      specialists.push(ele.employee?.user.firstName)
      services.push(ele.service.serviceName)
    })
    statTime = dateManipulation.convertTo12HourFormat(booking.startTime)
    endTime = dateManipulation.convertTo12HourFormat(booking.endTime)
    let retObj = {
      id: booking.id,
      status: booking.status,
      statTime,
      endTime,
      scheduleDate: booking.on,
      duration: booking.duration,
      assigned,
      client: `${booking.user?.firstName} ${booking.user?.lastName}`,
      clientEmail: `${booking.user?.email}`,
      clientImage: `${booking.user?.image}`,
      total: booking.total,
      services,
      specialists: assigned ? specialists : ['Anyone'],
    }
    filteredBooking.push(retObj)
  })

  const salonEmployee = await employee.findAll({
    include: [
      {
        model: salonDetail,
        where: {
          userId,
        },
        attributes: [],
      },
      {
        model: user,
        attributes: ['firstName', 'lastName', 'image', 'email'],
      },
    ],
    attributes: {
      exclude: ['description', 'coverImage', 'createdAt', 'updatedAt'],
    },
  })
  const response = returnFunction(
    '1',
    'List of Bookings',
    { salonEmployee, bookings: filteredBooking },
    '',
  )
  return res.json(response)
}

/*
              4.Booking Details
      ________________________________________
*/

exports.bookingDetails = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })
  const { bookingId } = req.body
  let bookings = []
  const bookingData = await booking.findByPk(bookingId, {
    include: [
      {
        model: user,
        attributes: [
          'id',
          'firstName',
          'lastName',
          'countryCode',
          'phoneNum',
          'image',
          'email',
        ],
      },
      {
        model: rating,
        attributes: ['id', 'comment', 'value'],
        include: {
          model: employee,
          attributes: ['id', 'position'],
          include: { model: user, attributes: ['firstName', 'lastName'] },
        },
      },
      {
        model: jobs,
        include: [
          {
            model: service,
            attributes: ['serviceName', 'price'],
            include: { model: category, attributes: ['color'] },
          },
          {
            model: employee,
            include: {
              model: user,
              attributes: ['id', 'firstName', 'lastName'],
            },
            attributes: ['id', 'position'],
          },
        ],
      },
    ],
  })
  console.log(
    '🚀 ~ exports.bookingDetails= ~ bookingData:',
    // JSON.parse(JSON.stringify(bookingData)),
  )
  let cardDetails
  if (bookingData.paymentMethod == 'card') {
    cardDetails = await Stripe.retrievePaymentMethod(bookingData.stripeCardId)
  }
  let customerStatus = 'active'

  const isblocked = await blockCustomer.findOne({
    where: { userId: bookingData.customerId, salonDetailId: salon.id },
    attributes: ['id'],
  })
  if (isblocked) customerStatus = 'block'

  let services = []
  let startTime, endTime
  bookingData.jobs.map((ele) => {
    let obj = {
      id: ele.id,
      status: ele.status,
      on: ele.on,
      serviceId: ele.serviceId,
      serviceName: ele.service?.serviceName,
      color: ele.service?.category?.color,
      price: ele.total,
      startTime: dateManipulation.convertTo12HourFormat(ele.startTime),
      duration: ele.duration,
      endTime: dateManipulation.convertTo12HourFormat(ele.endTime),
      employeeId: ele.employeeId,
      specialists: ele.employee ? `${ele.employee.user.firstName}` : '',
      extra: ele.Extra,
    }
    services.push(obj)
  })

  const clientName = `${bookingData.user?.firstName || bookingData.clientFirstName} ${bookingData.user?.lastName || bookingData.clientLastName}`

  const clientContact = `${bookingData.user?.countryCode || bookingData.countryCode} ${bookingData.user?.phoneNum || bookingData.phoneNum}`

  const remaining =
    parseFloat(bookingData.total) +
    parseFloat(bookingData.discount) -
    parseFloat(bookingData.actualCapturedAmount)
  let bookingDetail = {
    id: bookingData.id,
    scheduleDate: bookingData.on,
    status: bookingData.status,
    discount: bookingData.discount,
    actualCapturedAmount: bookingData.actualCapturedAmount,
    client: clientName,
    profile: bookingData.user?.image ?? '',
    email: bookingData.user?.email ?? '',
    Phone: clientContact,
    salonDetailId: bookingData.salonDetailId,
    Upfront: bookingData.initialPayment,
    duration: bookingData.duration,
    initialPayment: bookingData.initialPayment,
    total: bookingData.total,
    customerId: bookingData?.customerId ?? '',
    last4: cardDetails?.last4 ?? '',
    paymentMethodId: bookingData?.stripeCardId ?? '',
    services,
    customerStatus,
    // clientFeedBack:bookingData?.rating
  }
  return res.json(returnFunction('1', 'Booking Details', { bookingDetail }, ''))
}
/*
              4.Cancel Reasons
      ________________________________________
*/
exports.reasons = async (req, res, next) => {
  const reasons = await reason.findAll({
    attributes: ['id', 'reason'],
  })
  return res.json(
    returnFunction('1', 'Booking Cancelled Reasons', { reasons }, ''),
  )
}
/*
              4.Cancel Booking
      ________________________________________
*/

exports.cancelBooking = async (req, res, next) => {
  const userId = req.user.id
  const { bookingId, reasonId, reasonText } = req.body
  const jobComplete = await jobs.findOne({
    where: { bookingId, status: 'complete' },
  })

  const appointment = await booking.findByPk(bookingId, {
    attributes: [
      'id',
      'status',
      'actualCapturedAmount',
      'tip',
      'initialPaymentIntend',
      'stripeCardId',
      'total',
      'subTotal',
      'initialPayment',
      'salonDetailId',
    ],
  })
  if (!appointment) {
    throw new AppError('resource not found', 404)
  }

  if (
    appointment.status === 'complete' ||
    appointment.status === 'no-show' ||
    appointment.status === 'cancel'
  ) {
    throw new AppError(
      `The appointment has already been marked as : ${appointment.status}.`,
      200,
    )
  } else if (jobComplete) {
    return next(
      new appError(
        `You've completed one service, so the appointment cannot be canceled at this stage.`,
        200,
      ),
    )
  }
  //!TODO Term and Condition on cancel charges and time ---->>> after discuss //Implemented
  const updatedBooking = { tip: 0 }

  const paid =
    parseFloat(appointment.actualCapturedAmount) + parseFloat(appointment.tip)

  if (
    paid > 0 &&
    appointment.stripeCardId &&
    appointment.initialPaymentIntend
  ) {
    const refundAmount = paid
    const refund = await Stripe.refundFullPayment(
      appointment?.initialPaymentIntend,
    )
    if (refund?.id) {
      updatedBooking.finalPayment = 'paid'
      updatedBooking.refundAmount = refundAmount
      updatedBooking.refundPaymentIntend = refund?.id
    }
    console.log('--------------->Ã°Å¸Å¡â‚¬ ~Refund Success', refund)
  }

  updatedBooking.status = 'cancel'
  updatedBooking.total = paid
  updatedBooking.subTotal = appointment.total
  updatedBooking.initialPayment = paid

  await booking.update(updatedBooking, { where: { id: bookingId } })

  await jobs.update({ status: 'cancel' }, { where: { bookingId } })

  const Reason = await reason.findByPk(reasonId, {
    attributes: ['id', 'reason'],
  })

  // creating canceled booking details column
  await cancelledBooking.create({
    reasonText: reasonText ?? Reason.reason,
    bookingId,
    userId,
    reasonId,
  })
  cancelBySalon(bookingId)

  return res.json(
    returnFunction('1', 'Booking Cancelled Successfully!', {}, ''),
  )
}
/*
              4.Get Services of salon
      ________________________________________
*/
exports.getServices = async (req, res, next) => {
  const userId = req.user.id
  const formattedServices = await category.findAll({
    include: [
      {
        model: service,
        include: {
          model: category,
          attributes: ['categoryName', 'color'],
        },
        attributes: {
          exclude: ['createdAt', 'updatedAt'],
        },
      },
      {
        model: salonDetail,
        where: {
          userId,
        },
      },
    ],
    attributes: {
      exclude: ['createdAt', 'updatedAt'],
    },
  })
  const allServices = formattedServices.map((category) => {
    const services = category.services.map((service) => {
      const {
        category: { categoryName, color },
        ...rest
      } = service.toJSON()
      return {
        ...rest,
        categoryName,
        color,
      }
    })

    return {
      ...category.toJSON(),
      services,
    }
  })
  return res.json(returnFunction('1', 'Salon Services', { allServices }, ''))
}
/*
              4.Get Services of Ctegories
      ________________________________________
  */
exports.getServicesofCategories = async (req, res, next) => {
  const userId = req.user.id
  const { categoryId } = req.body
  const Services = await service.findAll({
    where: { categoryId },
    include: {
      model: salonDetail,
      where: {
        userId,
      },
      attributes: [],
    },
  })
  return res.json(returnFunction('1', 'Salon Services', { Services }, ''))
}
/*
              4.Find Employees That provides all selected services
      ________________________________________
  */
exports.employeesWithAllServices = async (req, res, next) => {
  const userId = req.user.id
  const SalonDetail = await salonDetail.findOne({
    where: { userId },
  })
  const { services } = req.body
  console.log('🚀 ~ exports.employeesWithAllServices= ~ services:', services)
  const employeesWithServices = await employeeService.findAll({
    where: {
      salonDetailId: SalonDetail.id,
      status: true,
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
      : null
  console.log('🚀~employees:', employeesWithServices)
  console.log(employeeIds)
  if (!employeeIds) {
    return res.status(200).json({
      status: '2',
      message: 'No employee available move forword',
      data: {},
      error: '',
    })
  }

  const workers = await user.findAll({
    attributes: ['firstName', 'lastName', 'image'],
    include: [
      {
        model: employee,
        where: {
          id: {
            [Op.in]: employeeIds,
          },
        },
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
            model: time,
            attributes: ['openingTime', 'closingTime', 'day'],
          },
          {
            model: rating,
            attributes: [],
          },
        ],
      },
    ],
  })

  const result = workers.map((ele) => {
    const obj = ele.toJSON()
    obj.employee = obj.employees[0]
    delete obj.employees
    return obj
  })
  return res.json(
    returnFunction('1', "Salon Employee's", { employees: result }, ''),
  )
}
/*
              4.Check Employees availability
      ________________________________________
  */
exports.employeeAvailability = async (req, res, next) => {
  const { jobDate, duration, employeeId } = req.body

  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  console.log(' 🚀req.body ', req.body)
  var date = new Date(jobDate)
  console.log('🚀date ONLY', date)
  let daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
  let salonOpen = true
  // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  let dayOfWeekIndex = date.getDay()
  const dateDay = daysOfWeek[dayOfWeekIndex]
  console.log('🚀date Day', dateDay)
  console.log(employeeId)

  const isSalonOpen = await time.findOne({
    where: {
      salonDetailId: salon.id,
      day: dateDay,
    },
  })

  if (!isSalonOpen || isSalonOpen.status == false) {
    salonOpen = false
    return res.json(
      returnFunction(
        '1',
        'Available Time Slots',
        { salonOpen, availableTimeSlots: [] },
        '',
      ),
    )
  }
  const condition = {
    day: dateDay,
  }
  if (employeeId > 0) {
    condition.employeeId = employeeId
  } else {
    condition.salonDetailId = salon.id
  }
  const employeeTiming = await time.findOne({
    where: condition,
  })
  if (!employeeTiming) {
    return res.json(
      returnFunction(
        '1',
        'Time Slots not Available',
        { salonOpen, availableTimeSlots: [] },
        '',
      ),
    )
  }
  console.log('employeeTiming', JSON.parse(JSON.stringify(employeeTiming)))
  const busyTimes =
    employeeId > 0
      ? await jobs.findAll({
          where: { status: 'assign', employeeId, on: jobDate },
          attributes: ['startTime', 'endTime'],
        })
      : []

  console.log('TIMES BUSY', JSON.parse(JSON.stringify(busyTimes)))

  const closingTime =
    employeeTiming.status == true && employeeTiming.closingTime == '00:00:00'
      ? '24:00:00'
      : employeeTiming.closingTime

  console.log('🚀 ~ exports.employeeAvailability= ~ closingTime:', closingTime)

  const availableTimeSlots = Slot.getAvailableTimeSlots(
    jobDate,
    employeeTiming.openingTime,
    closingTime,
    duration,
    busyTimes,
  )

  return res.json(
    returnFunction(
      '1',
      'Available Time Slots',
      { salonOpen, availableTimeSlots },
      '',
    ),
  )
}
/*
              4.Add Extra Service in Booking 
      ________________________________________
  */
exports.addExtraService = async (req, res, next) => {
  const { extraServices } = req.body
  let startTime, endTime
  const bookingData = await booking.findOne({
    where: { id: extraServices[0].bookingId },
    include: [
      { model: user, attributes: ['firstName', 'lastName', 'email', 'image'] },
      {
        model: jobs,
        include: [
          {
            model: service,
            include: { model: category, attributes: ['color'] },
          },
          {
            model: employee,
            include: { model: user, attributes: ['firstName'] },
          },
        ],
      },
    ],
  })

  if (
    bookingData.status == 'complete' ||
    bookingData.status == 'cancel' ||
    bookingData.status == 'no-show'
  ) {
    let message =
      'You cannot add service because the Appointment has already been Completed.'
    if (bookingData.status == 'cancel') {
      message =
        'You cannot add service because the appointment is marked as Canceled'
    } else if (bookingData.status == 'no-show') {
      message =
        'You cannot add service because the appointment is marked as No-Show'
    }
    throw new appError(message, 200)
  }

  const newServiceIds = await Promise.all(
    extraServices.map(async (ele) => {
      const startTime = dateManipulation.convertTo24HourFormat(ele.startTime)
      const endTime = dateManipulation.convertTo24HourFormat(ele.endTime)

      const job = await jobs.create({
        bookingId: ele.bookingId,
        serviceId: ele.serviceId,
        employeeId: ele.employeeId == 0 ? null : ele.employeeId,
        status: ele.employeeId == 0 ? 'pending' : 'assign',
        on: ele.jobDate,
        startTime,
        endTime,
        total: ele.total,
        duration: ele.duration,
        Extra: true,
      })

      await booking.increment(
        { total: ele.total, subTotal: ele.total, duration: ele.duration },
        { where: { id: ele.bookingId } },
      )

      return job.id
    }),
  )
  const findUnAssign = extraServices.find((service) => service.employeeId == 0)
  let status = 'book'
  if (findUnAssign) status = 'pending'
  await booking.update(
    { status },
    { where: { id: extraServices[0].bookingId } },
  )

  let servicesNames = []
  let specialists = []
  let assigned = true
  const newJobs = []
  bookingData.jobs.map((ele) => {
    if (ele.employeeId === null) {
      assigned = false
    }
    if (ele.employee && ele.employee.user) {
      specialists.push(ele.employee?.user?.firstName) // Add specialist name to the set
    }
    servicesNames.push(ele.service?.serviceName)

    const isNew = newServiceIds.find((u) => u == ele.id)
    if (isNew) {
      const job = {
        id: ele.id,
        status: ele.status,
        on: ele.on,
        serviceId: ele.serviceId,
        serviceName: ele.service?.serviceName,
        color: ele.service?.category?.color,
        price: ele.total,
        startTime: dateManipulation.convertTo12HourFormat(ele.startTime),
        duration: ele.duration,
        endTime: dateManipulation.convertTo12HourFormat(ele.endTime),
        employeeId: ele.employeeId,
        specialists: ele.employee ? `${ele.employee.user.firstName}` : '',
        extra: ele.Extra,
      }
      newJobs.push(job)
    }
  })
  const statTime = dateManipulation.convertTo12HourFormat(bookingData.startTime)
  const endTimeBooking = dateManipulation.convertTo12HourFormat(
    bookingData.endTime,
  )

  let socketData = {
    id: bookingData.id,
    status: bookingData.status,
    statTime,
    endTime: endTimeBooking,
    scheduleDate: bookingData.on,
    duration: bookingData.duration,
    assigned,
    client: `${bookingData.user?.firstName} ${bookingData.user?.lastName}`,
    clientEmail: `${bookingData.user?.email}`,
    clientImage: `${bookingData.user?.image}`,
    total: bookingData.total,
    services: servicesNames,
    specialists: specialists.length > 0 ? [...new Set(specialists)] : [''],
  }
  const socketInputBooking = {
    event: 'update-appointment',
    data: socketData,
    bookingId: bookingData?.id,
  }
  sendEvent(`${bookingData?.salonDetailId}S`, socketInputBooking)
  const workersForbooking = await employeeForSocket(bookingData?.salonDetailId)
  workersForbooking.forEach((el) => sendEvent(`${el}E`, socketInputBooking))

  const socketInputService = {
    event: 'update-service',
    data: { type: 'add', job: newJobs, total: bookingData.total },
    bookingId: bookingData.id,
  }
  sendEvent(`${bookingData.salonDetailId}S`, socketInputService)
  const workers = await employeeForSocket(bookingData.salonDetailId)
  workers.forEach((el) => sendEvent(`${el}E`, socketInputService))

  return res.json(
    returnFunction('1', 'Extra Service Added Successfully!', {}, ''),
  )
}
/*
           schedule jobs
     _____________________________
*/
function scheduleJobs(startTime, jobs, jobDate, bookingId, employeeId) {
  const [startHour, startMinute, ampm] = startTime.split(/:|\s/)
  let currentTime = parseInt(startHour) * 60 + parseInt(startMinute)
  if (ampm.toLowerCase() === 'pm') {
    currentTime += 12 * 60
  }

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60) % 12 || 12
    const mins = minutes % 60
    const period = minutes < 720 ? 'am' : 'pm'
    return `${padZero(hours)}:${padZero(mins)} ${period}`
  }

  const padZero = (num) => (num < 10 ? `0${num}` : num)

  const jobSchedule = []

  for (const job of jobs) {
    const duration = job.duration
    const scheduledJob = {
      ...job,
      startTime: formatTime(currentTime),
      endTime: formatTime(currentTime + duration),
      on: jobDate,
      bookingId,
      status: 'assign',
      employeeId,
    }
    jobSchedule.push(scheduledJob)
    currentTime += duration
  }

  return jobSchedule
}
/*
              4.Get All Customers of Salon
      ________________________________________
  */
exports.getSalonCustomer = async (req, res, next) => {
  const userId = req.user.id
  const SalonDetail = await salonDetail.findOne({
    where: {
      userId,
    },
  })

  const salonCustomers = await booking.findAll({
    where: {
      salonDetailId: SalonDetail.id,
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

  return res.json(
    returnFunction('1', 'Customer Added Successfully!', { salonCustomers }, ''),
  )
}
/*
              4.Add Walkn in Customer by barber 
      ________________________________________
  */
exports.addWalkinCustomer = async (req, res, next) => {
  const userId = req.user.id
  const { email, countryCode, phoneNum, firstName, lastName } = req.body
  const SalonDetail = await salonDetail.findOne({
    where: {
      userId,
    },
  })

  let userExist = await user.findOne({
    where: {
      [Op.or]: [
        { email: email },
        // { [Op.and]: [{ countryCode: countryCode }, { phonenum: phoneNum }] },
      ],
      deletedAt: { [Op.is]: null },
    },
  })
  let alreadyExist = false
  let message = `Customer already exists. Continuing with existing profile.`
  if (userExist) alreadyExist = true

  if (!alreadyExist && req.body.email) {
    const fullName = `${firstName || 'Walkin'} ${lastName || 'Customer'}`
    const stripeCustomerId = await Stripe.addCustomer(fullName, email)

    userExist = await user.create({
      email,
      countryCode: phoneNum ? countryCode : '',
      phoneNum: phoneNum || '',
      signedFrom: 'walkin',
      firstName: firstName || 'Walkin',
      lastName: lastName || 'Customer',
      stripeCustomerId,
      userTypeId: 1,
    })
    message = `New customer added to the salon.`
  } else if (!alreadyExist && !req?.body?.email) {
    userExist = {
      id: 0,
      firstName: firstName || 'Walkin',
      lastName: lastName || 'Customer',
      email: '',
      countryCode: !phoneNum ? '' : countryCode,
      phoneNum: phoneNum || '',
    }
    message = `Customer information has been successfully saved.`
  }

  return res.json(
    returnFunction('1', message, { User: userExist, alreadyExist }, ''),
  )
}
/*
              4.Add Walkn in Booking by barber 
*/
exports.addWalkinBooking = async (req, res, next) => {
  const userId = req.user.id
  let {
    total,
    startTime,
    endTime,
    jobDate,
    jobsData,
    duration,
    customerId,
    employeeId,
    phoneNum,
    countryCode,
    clientFirstName,
    clientLastName,
  } = req.body
  const SalonDetail = await salonDetail.findOne({
    where: {
      userId,
    },
  })
  startTime = Convert.convertTo24HourFormat(startTime)
  endTime = Convert.convertTo24HourFormat(endTime)

  console.log('Ã°Å¸Å¡â‚¬ ~ exports.addWalkinBooking= ~ jobsData:', jobsData)
  const assignTimeSlots = Custom.scheduleSessions(
    { startTime, endTime, on: jobDate, duration },
    jobsData,
  )
  console.log(
    'Ã°Å¸Å¡â‚¬ ~ exports.addWalkinBooking= ~ assignTimeSlots:',
    assignTimeSlots,
  )
  const appointmentDate = new Date(jobDate)
  const appointmentDay = dateManipulation.dayOnDate(appointmentDate)
  let employeeData = []
  if (employeeId < 1) {
    employeeData = await employee.findAll({
      where: {
        salonDetailId: SalonDetail.id,
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
          where: { on: jobDate, status: 'assign' },
          required: false,
          attributes: ['duration', 'startTime', 'endTime'],
        },
      ],
    })
    employeeData.sort((a, b) => a.jobs.length - b.jobs.length)
  }

  const assiginEmployee =
    employeeId < 1 && employeeData.length > 0
      ? Custom.assignEmployeesToServices(employeeData, assignTimeSlots)
      : assignTimeSlots.map((service) => ({
          ...service,
          employeeId: employeeId > 0 ? employeeId : null,
          status: employeeId > 0 ? 'assign' : 'pending',
        }))
  console.log(
    'Ã°Å¸Å¡â‚¬ ~ exports.addWalkinBooking= ~ assiginEmployee:',
    // ,assiginEmployee
  )
  let appointmentStatus = 'book'
  const findUnAssign = assiginEmployee.find((el) => el.status === 'pending')
  if (findUnAssign) {
    console.log('Ã°Å¸Å¡â‚¬ ~ findUnAssign:', findUnAssign)
    appointmentStatus = 'pending'
  }

  const policyCondition = { status: true }
  const policies = await salonDetail.findOne({
    where: { id: SalonDetail.id },
    attributes: ['id', 'salonName'],
    include: [
      {
        model: cancellationPolicy,
        where: policyCondition,
        attributes: ['version'],
      },
      { model: noShowPolicy, where: policyCondition, attributes: ['version'] },
      {
        model: reschedulePolicy,
        where: policyCondition,
        attributes: ['version'],
      },
      { model: paymentPolicy, where: policyCondition, attributes: ['version'] },
    ],
  })

  console.log(
    'ðŸš€ ~ exports.addWalkinBooking= ~ policies:',
    JSON.parse(JSON.stringify(policies)),
  )

  const hasAppointments =
    customerId && customerId > 0
      ? await booking.count({
          where: {
            salonDetailId: SalonDetail.id,
            customerId,
            status: 'complete',
          },
        })
      : 0

  const AddBooking = await booking.create({
    startTime,
    status: appointmentStatus,
    endTime,
    salonDetailId: SalonDetail.id,
    on: jobDate,
    customerId: customerId ?? null,
    duration,
    total,
    subTotal: total,
    paymentMethod: 'cash',
    phoneNum,
    countryCode: phoneNum ? countryCode : '',
    clientFirstName: clientFirstName || 'Walkin',
    clientLastName: clientLastName || 'Customer',
    cancellationPolicyVersion: policies?.cancellationPolicies[0]?.version,
    reschedulePolicyVersion: policies?.reschedulePolicies[0]?.version,
    upFrontPolicyVersion: policies?.paymentPolicies[0]?.version,
    noshowPolicyVersion: policies?.noShowPolicies[0]?.version,
    customerStatus: hasAppointments && hasAppointments > 0 ? 'repeat' : 'new',
  })

  const finalInput = assiginEmployee.map((service) => ({
    ...service,
    bookingId: AddBooking.id,
  }))
  console.log('Ã°Å¸Å¡â‚¬ ~ exports.addWalkinBooking= ~ finalInput:', finalInput)
  await jobs.bulkCreate(finalInput)

  walkinAppointmentConfirm(AddBooking, customerId, SalonDetail?.id)

  return res.json(
    returnFunction(
      '1',
      'Walkin Booking Added Successfully!',
      { bookingId: AddBooking.id },
      '',
    ),
  )
}
/*
              4.Update Job Status
      ________________________________________
  */
exports.jobStatus = async (req, res, next) => {
  const { status, jobIds, notify } = req.body
  const jobData = await jobs.findOne({
    where: { id: jobIds },
    attributes: ['id', 'total', 'employeeId', 'serviceId', 'bookingId'],
    include: [
      {
        model: employee,
        attributes: ['id'],
        include: {
          model: employeeWagesMethod,
          attributes: [`id`, `value`, `wagesMethodId`, `cycle`, `cycleValue`],
        },
      },
      {
        model: booking,
        attributes: ['id', 'total', 'salonDetailId', 'duration'],
      },
    ],
  })

  if (!jobData) return next(new appError('resource not Found', 200))
  if (jobData.employeeId == null && status != 'cancel') {
    return next(new appError('Assign employee first!', 200))
  }

  await jobs.update(
    {
      status,
    },
    {
      where: { id: jobIds },
    },
  )

  let updatedBookingTotal = jobData.booking.total
  if (status == 'cancel') {
    updatedBookingTotal =
      parseFloat(jobData.booking.total) - parseFloat(jobData.total)
    const updatedBookingDuration =
      parseInt(jobData.booking.duration) - parseInt(jobData.duration)

    await booking.update(
      { total: updatedBookingTotal, duration: updatedBookingDuration },
      { where: { id: jobData.bookingId } },
    )
  } else if (status == 'complete') {
    console.log('🚀 ~ Calculation Start :status', status)
    calculatePayoutsOnService(jobData)
  }

  const socketInput = {
    event: 'job-status',
    data: {
      id: jobIds,
      status,
      total: `${updatedBookingTotal}`,
      bookingId: jobData?.bookingId,
    },
    bookingId: jobData?.bookingId,
  }

  sendEvent(`${jobData?.booking?.salonDetailId}S`, socketInput)
  const workers = await employeeForSocket(jobData?.booking?.salonDetailId)
  workers.forEach((el) => sendEvent(`${el}E`, socketInput))
  return res.json(
    returnFunction('1', 'Job Status Updated Successfully!', {}, ''),
  )
}
/*
              4.Client Booking History
      ________________________________________
  */
exports.clientHistory = async (req, res, next) => {
  const userId = req.user.id
  const { customerId } = req.body
  const clientBookings = await booking.findAll({
    where: {
      customerId,
    },
    include: [
      {
        model: salonDetail,
        where: {
          userId,
        },
        attributes: [],
      },
      {
        model: jobs,
        include: [
          {
            model: service,
            attributes: ['serviceName'],
            include: { model: category, attributes: ['color'] },
          },
          {
            model: employee,
            required: false,
            include: {
              model: user,
              attributes: ['firstName', 'lastName'],
            },
            attributes: [['id', 'employeeId']],
          },
        ],
        attributes: ['id', 'total', 'duration'],
      },
    ],
    attributes: ['id', 'status', 'on', 'startTime'],
  })
  return res.json(
    returnFunction('1', 'Client Booking History', { clientBookings }, ''),
  )
}
/*
              4.CheckOut Api
      ________________________________________
  */
exports.checkOutBooking = async (req, res, next) => {
  const { bookingId, tip } = req.body
  const jobData = await jobs.findOne({
    where: { bookingId, status: { [Op.or]: ['pending', 'assign'] } },
  })
  if (jobData) {
    return res.json(
      returnFunction('2', 'The appointment has unfinished services.', {}, ''),
    )
  }
  let bookingData = await booking.findByPk(bookingId, {
    include: [
      {
        model: salonDetail,
        attributes: ['id', 'connectAccountId'],
      },
      {
        model: user,
        attributes: ['stripeCustomerId'],
      },
      { model: jobs },
    ],
    attributes: [
      'id',
      'status',
      'on',
      'startTime',
      'initialPayment',
      'discount',
      'total',
      'tip',
      'stripeCardId',
      'actualCapturedAmount',
      'salonDetailId',
    ],
  })

  if (
    bookingData.status == 'cancel' ||
    bookingData.status == 'no-show' ||
    bookingData.status == 'complete'
  ) {
    let message =
      'You cannot check out because the Appointment has already been Completed.'
    if (bookingData.status == 'cancel') {
      message =
        'You cannot check out because the appointment is marked as Canceled'
    } else if (bookingData.status == 'no-show') {
      message =
        'You cannot check out because the appointment is marked as No-Show'
    }
    return res.json(returnFunction('2', message, {}, ''))
  }
  // return res.json(bookingData)
  const salonEarning =
    parseFloat(req.body.amount) + parseFloat(bookingData.actualCapturedAmount)

  //Amount to be captured
  const amount = parseFloat(req.body.amount) + tip

  const accountId = bookingData.salonDetail.connectAccountId
  const customerId = bookingData.user.stripeCustomerId

  const payments = await Stripe.capturePayment(
    amount,
    customerId,
    bookingData.stripeCardId,
    accountId,
  )

  console.log('ðŸš€ ~ payments= ~ tip:', payments)

  if (payments.status === 'succeeded') {
    await wallet.increment(
      { amount: salonEarning },
      { where: { salonDetailId: bookingData?.salonDetail?.id } },
    )

    bookingData.status = 'complete'
    bookingData.finalPaymentIntend = payments.id
    bookingData.finalPayment = 'paid'
    bookingData.subTotal = bookingData.total
    await bookingData.save()
    const capturedPayment = parseFloat(req.body.amount)
    await booking.increment(
      { actualCapturedAmount: capturedPayment, tip: tip },
      { where: { id: bookingId } },
    )

    // ------------------------Notificatons------------------------
    Communication.online(bookingId, tip || 0, amount)

    employeeCommission.update(
      { appointmentClosed: true },
      { where: { bookingId: bookingData.id } },
    )
    rentChairEarning.update(
      { appointmentClosed: true },
      { where: { bookingId: bookingData.id } },
    )
    distributeTip(bookingData, tip || 0)
    return res.json(
      returnFunction('1', 'Payment processed successfully.', {}, ''),
    )
  } else {
    console.log('ðŸš€ ~ exports.checkOutBooking= ~ Unsuccess:')
    return res.json(
      returnFunction('0', 'Payment processing unsuccessful.', {}, ''),
    )
  }
}
/*
                          4.CheckOut Cash Api
                  ________________________________________
*/

exports.checkoutCash = async (req, res, next) => {
  const { tip, bookingId } = req.body
  const jobData = await jobs.findOne({
    where: { bookingId, status: { [Op.or]: ['pending', 'assign'] } },
  })
  if (jobData) {
    return res.json(
      returnFunction('2', 'The appointment has unfinished services.', {}, ''),
    )
  }
  const bookingData = await booking.findOne({
    where: { id: bookingId },
    attributes: [
      'id',
      'status',
      'on',
      'startTime',
      'initialPayment',
      'discount',
      'total',
      'tip',
      'stripeCardId',
      'actualCapturedAmount',
      'salonDetailId',
    ],
    include: { model: jobs },
  })

  if (
    bookingData.status == 'cancel' ||
    bookingData.status == 'no-show' ||
    bookingData.status == 'complete'
  ) {
    let message =
      'You cannot check out because the Appointment has already been Completed.'
    if (bookingData.status == 'cancel') {
      message =
        'You cannot check out because the appointment is marked as Canceled.'
    } else if (bookingData.status == 'no-show') {
      message =
        'You cannot check out because the appointment is marked as No-Show.'
    }
    return res.json(returnFunction('2', message, {}, ''))
  }
  // return res.json(bookingData)
  const salonEarning =
    parseFloat(req.body.amount) + parseFloat(bookingData.actualCapturedAmount)
  //Amount to be captured
  const amount = parseFloat(req.body.amount) + tip

  await wallet.increment(
    { amount: salonEarning },
    { where: { salonDetailId: bookingData.salonDetailId } },
  )

  bookingData.status = 'complete'
  bookingData.paymentMethod = 'cash'
  bookingData.finalPayment = 'paid'
  bookingData.subTotal = bookingData.total

  await bookingData.save()
  const capturedPayment = parseFloat(req.body.amount)
  await booking.increment(
    { actualCapturedAmount: capturedPayment, tip: tip },
    { where: { id: bookingId } },
  )
  //EMAIL --//TODO
  Communication.cash(bookingId, tip || 0, amount)
  // EmailAppointmentConfirmToSalon(['sigidevelopers@gmail.com'],inputData);

  employeeCommission.update(
    { appointmentClosed: true },
    { where: { bookingId: bookingId } },
  )
  rentChairEarning.update(
    { appointmentClosed: true },
    { where: { bookingId: bookingId } },
  )
  distributeTip(bookingData, tip || 0)

  return res.json(returnFunction('1', 'Cash Payment Successfully Done', {}, ''))
}

/*
              4.Save Unpaid
      ________________________________________
  */
exports.saveUnpaid = async (req, res, next) => {
  const { bookingId } = req.body
  const jobData = await jobs.findOne({
    where: { bookingId, status: { [Op.or]: ['pending', 'assign'] } },
  })
  if (jobData) {
    return res.json(
      returnFunction('2', 'The appointment has unfinished services.', {}, ''),
    )
  }
  let bookingData = await booking.findByPk(bookingId, {
    attributes: ['id', 'status', 'total', 'subTotal', 'salonDetailId'],
  })

  if (
    bookingData.status == 'cancel' ||
    bookingData.status == 'no-show' ||
    bookingData.status == 'complete'
  ) {
    let message =
      'You cannot check out because the Appointment has already been Completed.'
    if (bookingData.status == 'cancel') {
      message =
        'You cannot check out because the appointment is marked as Canceled.'
    } else if (bookingData.status == 'no-show') {
      message =
        'You cannot check out because the appointment is marked as No-Show.'
    }
    return res.json(returnFunction('2', message, {}, ''))
  }

  bookingData.status = 'save-unpaid'
  bookingData.subTotal = bookingData.total

  await bookingData.save(bookingData)
  Communication.saveUnpaid(bookingData)
  return res.json(returnFunction('1', 'Booking Saved UnPaid', {}, ''))
}
/*
              4.Remove Client
      ________________________________________
  */
exports.removeClient = async (req, res, next) => {
  const userId = req.user.id
  const { customerId } = req.body
  const clientBookings = await booking.update(
    {
      clientRemoved: true,
    },
    {
      where: {
        customerId,
      },
    },
  )
  return res.json(returnFunction('1', 'Client Removed Successfully!', {}, ''))
}
//* 4.Reschedule Solo Employee Appointment -----------------

exports.rescheduleSoloEmployeeAppointment = async (req, res, next) => {
  const { bookingId, appointment, services, employeeId } = req.body
  appointment.startTime = dateManipulation.convertTo24HourFormat(
    appointment.startTime,
  )
  console.log('🚀 ~ AFTER START-TIME', appointment.startTime)

  appointment.endTime = dateManipulation.convertTo24HourFormat(
    appointment.endTime,
  )
  const appointmentDate = new Date(appointment.on)
  const appointmentDay = dateManipulation.dayOnDate(appointmentDate)

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

  let sessions = await jobs.findAll({ where: { id: jobIds } })

  // Update each job's times
  assignTimeSlots.forEach((newJobData) => {
    // Find the corresponding job in sessions array by ID
    const jobToUpdate = sessions.find((job) => job.id === newJobData.id)
    if (jobToUpdate) {
      // Update startTime, endTime, and on attributes
      jobToUpdate.startTime = dateManipulation.convertTo24HourFormat(
        newJobData.startTime,
      )
      jobToUpdate.endTime = dateManipulation.convertTo24HourFormat(
        newJobData.endTime,
      )
      jobToUpdate.on = newJobData.on
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

  return res.json(
    returnFunction('1', 'Appointment Reschedule Successfully!', {}, ''),
  )
}

//* 5.Reschedule Multiple Employee Appointment -----------------

exports.rescheduleMultipleEmployeeAppointment = async (req, res, next) => {
  const { appointment, services, bookingId } = req.body
  console.log(
    '🚀 ~ exports.rescheduleMultipleEmployeeAppointment= ~ req.body:',
    req.body,
  )
  appointment.startTime = dateManipulation.convertTo24HourFormat(
    appointment.startTime,
  )

  appointment.endTime = dateManipulation.convertTo24HourFormat(
    appointment.endTime,
  )
  const appointmentDate = new Date(appointment.on)
  const appointmentDay = dateManipulation.dayOnDate(appointmentDate)

  let employeeData, JobsInput
  // services offered by multiple employees
  if (!req.body?.employeeId || req.body?.employeeId < 1) {
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

  console.log('🚀~🚀 ~🚀 ~🚀 ~🚀 ~🚀 ~🚀 ~🚀 ~🚀  services:', services)
  const servicesinput =
    services.length > 0
      ? services.map((ele) => {
          let obj = {
            id: ele.id,
            duration: ele.duration,
            serviceId: ele.serviceId,
          }
          return obj
        })
      : []
  console.log('🚀 ~ servicesinput ~ servicesinput:', servicesinput)
  const assignTimeSlots = Custom.scheduleSessions(appointment, servicesinput)
  // console.log("🚀 ~ assignTimeSlots:", assignTimeSlots);

  JobsInput = Custom.assignEmployeesToServices(employeeData, assignTimeSlots)
  appointment.status = 'book'
  const findUnAssign = JobsInput.find((el) => el.status === 'pending')
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
  console.log('🚀 ~ JobsInput.forEach ~ JobsInput:', JobsInput)
  JobsInput.forEach((newJobData) => {
    // Find the corresponding job in sessions array by ID
    // console.log("🚀 ~ exports.rescheduleMultipleEmployeeAppointment= ~ newJobData:", newJobData)

    const jobToUpdate = sessions.find((job) => job.id === newJobData.id)
    // console.log("🚀 ~ exports.rescheduleMultipleEmployeeAppointment= ~ jobToUpdate:", jobToUpdate)
    if (jobToUpdate) {
      // Update startTime, endTime, and on attributes
      jobToUpdate.startTime = dateManipulation.convertTo24HourFormat(
        newJobData.startTime,
      )
      jobToUpdate.endTime = dateManipulation.convertTo24HourFormat(
        newJobData.endTime,
      )
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
      startTime: dateManipulation.convertTo24HourFormat(appointment.startTime),
      endTime: dateManipulation.convertTo24HourFormat(appointment.endTime),
      on: appointment.on,
      status: appointment.status,
    },
    { where: { id: bookingId } },
  )
  fromSalonMultipleEmployees(bookingId)
  return res.json(
    returnFunction('1', 'Appointment Reschedule Successfully!', {}, ''),
  )
}

//* 3.salon Availability
exports.salonAvailability = async (req, res, next) => {
  const { jobDate, duration, salonDetailId } = req.body
  const parsedDate = new Date(jobDate)
  // Get the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const currentDayOfWeek = parsedDate.getDay()
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
  // Get the name of the current day of the week
  const currentDayName = dayNames[currentDayOfWeek]
  console.log(currentDayName)
  const data = await time.findOne({
    where: { salonDetailId: salonDetailId, day: currentDayName },
    attributes: ['day', 'openingTime', 'closingTime'],
  })
  const salon = await salonDetail.findOne({
    where: { id: salonDetailId },
    attributes: ['id'],
  })
  if (!salon) return next(new appError('resource not Found', 200))

  const availableTimeSlots = Slot.getAvailableTimeSlots(
    jobDate,
    data.openingTime,
    data.closingTime,
    duration,
    [],
  )
  return res.json(
    returnFunction('1', 'Available TimeSlots', { availableTimeSlots }, ''),
  )
}

/*
              4.Get Job Data
      ________________________________________
*/
exports.salonServices = async (req, res, next) => {
  const userId = req.user.id
  const salonServices = await service.findAll({
    include: [
      {
        model: salonDetail,
        where: { userId },
        attributes: [],
      },
    ],
    attributes: ['id', 'serviceName', 'duration'],
  })
  return res.json(
    returnFunction('1', 'All Services of Salon', { salonServices }, ''),
  )
}
/*
              4.Get Job Data
      ________________________________________
*/
function updateEmployeeAvailability(employees, serviceId, duration, startTime) {
  // Utility function to convert time string to minutes
  function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Utility function to convert minutes to time string in HH:MM format
  function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // Loop through each employee and add the required keys
  employees.forEach((employee) => {
    // Sort jobs by start time
    employee.jobs.sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
    )

    // Check if the employee provides the service
    employee.providesService = employee.serviceIds
      ? employee.serviceIds.split(',').includes(serviceId.toString())
      : false

    // Check availability based on timeStatus, openingTime, and closingTime
    if (
      employee.timeStatus === 0 ||
      !employee.openingTime ||
      !employee.closingTime
    ) {
      employee.availability = false
      employee.nextAvailableTime = ''
      employee.busy = false
      return
    }

    const openingTimeMinutes = timeToMinutes(employee.openingTime)
    const closingTimeMinutes = timeToMinutes(employee.closingTime)
    const requestedStartTimeMinutes = timeToMinutes(startTime)
    const requestedEndTimeMinutes = requestedStartTimeMinutes + duration

    // Check if requested time is within working hours
    if (
      requestedStartTimeMinutes < openingTimeMinutes ||
      requestedEndTimeMinutes > closingTimeMinutes
    ) {
      employee.availability = false
      employee.nextAvailableTime = ''
      employee.busy = false
      return
    }

    // Check if the employee has any jobs during the requested time
    let isBusy = false
    let nextAvailableTime = openingTimeMinutes
    for (const job of employee.jobs) {
      const jobStartMinutes = timeToMinutes(job.startTime)
      const jobEndMinutes = timeToMinutes(job.endTime)

      // Check if the requested time overlaps with any existing job
      if (
        (requestedStartTimeMinutes >= jobStartMinutes &&
          requestedStartTimeMinutes < jobEndMinutes) ||
        (requestedEndTimeMinutes > jobStartMinutes &&
          requestedEndTimeMinutes <= jobEndMinutes) ||
        (requestedStartTimeMinutes <= jobStartMinutes &&
          requestedEndTimeMinutes >= jobEndMinutes)
      ) {
        isBusy = true
      }

      // Update the next available time if there's an overlap
      if (requestedStartTimeMinutes < jobEndMinutes) {
        nextAvailableTime = Math.max(nextAvailableTime, jobEndMinutes)
      }
    }

    // Set availability, busy status, and nextAvailableTime
    employee.busy = isBusy
    employee.availability = employee.timeStatus === 1 && !isBusy
    if (isBusy) {
      // Calculate the next available time slot for the given duration
      let potentialNextTime = nextAvailableTime
      while (potentialNextTime + duration <= closingTimeMinutes) {
        const overlap = employee.jobs.some((job) => {
          const jobStartMinutes = timeToMinutes(job.startTime)
          const jobEndMinutes = timeToMinutes(job.endTime)
          return (
            (potentialNextTime >= jobStartMinutes &&
              potentialNextTime < jobEndMinutes) ||
            (potentialNextTime + duration > jobStartMinutes &&
              potentialNextTime + duration <= jobEndMinutes)
          )
        })

        if (!overlap) {
          employee.nextAvailableTime = minutesToTime(potentialNextTime)
          employee.availability = false // Update availability to false since they are busy currently
          return
        }

        // Move to the end of the current overlapping job
        potentialNextTime += 1
      }
      employee.nextAvailableTime = ''
    } else {
      employee.nextAvailableTime = ''
    }
  })

  return employees
}

exports.serviceData = async (req, res, next) => {
  const userId = req.user.id
  const { jobId, serviceId } = req.body
  const jobData = await jobs.findByPk(jobId, {
    attributes: {
      exclude: ['createdAt'],
    },
    include: { model: service },
  })

  let serviceData = await service.findByPk(serviceId, {
    attributes: [
      'id',
      'serviceName',
      'discount',
      'categoryId',
      'duration',
      'price',
    ],
  })

  const employees = await employee.findAll({
    where: {
      deleted: false,
      status: true,
      // Add your conditions here
      [Op.and]: literal(`EXISTS (
        SELECT 1
        FROM salonDetails
        WHERE salonDetails.id = employee.salonDetailId
        AND salonDetails.userId = ${userId}
      )`),
    },
    attributes: [
      ['id', 'employeeId'],
      [
        literal(`(SELECT CONCAT(users.firstName, ' ', users.lastName)
                  FROM users
                  WHERE users.id = employee.userId)`),
        'name',
      ],
      [
        literal(`(SELECT GROUP_CONCAT(serviceId) 
                  FROM employeeServices 
                  WHERE employeeServices.employeeId = employee.id)`),
        'serviceIds',
      ],
      [
        literal(`(SELECT openingTime
                  FROM times 
                  WHERE times.employeeId = employee.id 
                  AND times.day = '${req.body.day}'
                  LIMIT 1)`),
        'openingTime',
      ],
      [
        literal(`(SELECT closingTime
                  FROM times 
                  WHERE times.employeeId = employee.id 
                  AND times.day = '${req.body.day}'
                  LIMIT 1)`),
        'closingTime',
      ],
      [
        literal(`(SELECT status
                  FROM times 
                  WHERE times.employeeId = employee.id 
                  AND times.day = '${req.body.day}'
                  LIMIT 1)`),
        'timeStatus',
      ],
      [
        literal(`(SELECT closingTime
                  FROM times 
                  WHERE times.employeeId = employee.id 
                  AND times.day = '${req.body.day}'
                  LIMIT 1)`),

        'closingTime',
      ],
    ],
    include: [
      {
        model: jobs,
        required: false,
        where: {
          status: 'pending',
          on: req.body.date,
          startTime: {
            [Op.gte]: req.body.startTime,
          },
        },
        attributes: ['startTime', 'endTime', 'duration'],
      },
    ],
  })

  //   [
  //     {
  //         "id": 260,
  //         "fullName": "Lazy Barber",
  //         "serviceIds": "326,327"
  //     },
  //     {
  //         "id": 261,
  //         "fullName": "Hazy Barber",
  //         "serviceIds": "325,327"
  //     },
  //     {
  //         "id": 262,
  //         "fullName": "Jazy Barber",
  //         "serviceIds": "325,327"
  //     },
  //     {
  //         "id": 263,
  //         "fullName": "Dazy Barber",
  //         "serviceIds": "326,327"
  //     },
  //     {
  //         "id": 264,
  //         "fullName": "Fazy Barber",
  //         "serviceIds": "325,327"
  //     },
  //     {
  //         "id": 265,
  //         "fullName": "Yazdan Ali",
  //         "serviceIds": "325,326,327"
  //     },
  //     {
  //         "id": 266,
  //         "fullName": "Farhan Barber",
  //         "serviceIds": "325,327"
  //     }
  // ]
  const input = JSON.parse(JSON.stringify(employees))
  const teamMembers = updateEmployeeAvailability(
    input,
    serviceId,
    serviceData?.duration,
    req.body?.startTime || '13:00:00',
  )
  // console.log('🚀 ~ exports.serviceData= ~ updatedEmployees:', updatedEmployees)

  // return res.json({ employees, teamMembers })

  // const teamMembers = employees.map((employee) => {
  //   const hasMatchingService = employee.employeeServices.some((service) => {
  //     return service.serviceId == jobData.serviceId
  //   })

  //   return {
  //     employeeId: employee.id,
  //     name: `${employee.user.firstName} ${employee.user.lastName}`,
  //     provider: hasMatchingService,
  //   }
  // })

  console.log(
    '🚀 ~ exports.serviceData= ~ serviceData.jobData.total:',
    jobData.total,
  )
  console.log(
    '🚀 ~ exports.serviceData= ~ serviceData.jobData.extraDiscount:',
    jobData.extraDiscount,
  )
  console.log(
    '🚀 ~ exports.serviceData= ~ serviceData.parseFloat(jobData.total)+parseFloat(jobData.serviceDiscount):',
    parseFloat(jobData.total) + parseFloat(jobData.serviceDiscount),
  )
  if (jobData && jobData.serviceId == serviceId) {
    const total =
      parseFloat(jobData.total) +
      parseFloat(jobData.serviceDiscount) +
      parseFloat(jobData.extraDiscount)
    serviceData = {
      id: jobData.serviceId,
      serviceName: jobData.service.serviceName,
      price: `${total}`,
      duration: jobData.duration,
      categoryId: jobData.service.categoryId,
      discount: parseInt((jobData.serviceDiscount / total) * 100),
      extraDiscount: jobData.extraDiscount,
    }
  } else {
    serviceData = JSON.parse(JSON.stringify(serviceData))
    serviceData.extraDiscount = '0.00'
  }

  return res.json(
    returnFunction('1', 'Service Data!', { serviceData, teamMembers }, ''),
  )
}
/*
              4.Edit Service
      ________________________________________
*/

exports.editService = async (req, res, next) => {
  let {
    jobId,
    price,
    serviceDiscount,
    employeeId,
    serviceId,
    startTime,
    duration,
    extraDiscount,
  } = req.body

  console.log('ðŸš€ ~ exports.editService= ~ req.body:', req.body)

  let jobStatus = 'pending'
  let bookingStatus = 'pending'
  if (!employeeId && employeeId < 1) employeeId = null

  if (employeeId) jobStatus = 'assign'

  startTime = dateManipulation.convertTo24HourFormat(startTime)
  console.log('ðŸš€ ~ exports.editService= ~ startTime:', startTime)

  let startTimeParts = startTime.split(':')
  let startHour = parseInt(startTimeParts[0])
  let startMinute = parseInt(startTimeParts[1])
  // Calculating the end time
  let setendTime = new Date()
  setendTime.setHours(startHour)
  setendTime.setMinutes(startMinute + duration)
  // Formatting the end time as HH:MM
  let endTime =
    ('0' + setendTime.getHours()).slice(-2) +
    ':' +
    ('0' + setendTime.getMinutes()).slice(-2)

  const jobData = await jobs.findOne({
    where: { id: jobId },
    include: { model: booking },
  })
  //!TODO skipped booking End Time .. because its Not required on frontend on any app (IMP .. check if it required in reports)

  let updatedBookingTotal =
    parseFloat(jobData.booking.total) - parseFloat(jobData.total)

  updatedBookingTotal = updatedBookingTotal + parseFloat(price)

  let updatedBookingDuration =
    parseInt(jobData.booking.duration) - parseInt(jobData.duration)

  updatedBookingDuration = updatedBookingDuration + parseInt(duration)

  const allJobs = await jobs.findAll({
    where: { bookingId: jobData?.booking?.id },
    attributes: ['id', `startTime`, `endTime`],
    order: [['startTime', 'ASC']],
  })

  let startFrom = jobData?.booking?.startTime
  let endsAt = jobData?.booking?.endTime

  if (allJobs.length === 1) {
    // If there's only one entry
    startFrom = allJobs[0].startTime
    endsAt = allJobs[0].endTime
  } else if (allJobs.length > 1) {
    // If there are multiple entries
    startFrom = allJobs[0].startTime // start time of the first entry
    endsAt = allJobs[allJobs.length - 1].endTime // end time of the last entry
  }

  // console.log('🚀 ~ exports.editService= ~ jobData.duration:', jobData.duration)

  await jobs.update(
    {
      status: jobStatus,
      employeeId,
      serviceId,
      startTime,
      endTime,
      total: price,
      serviceDiscount,
      extraDiscount,
      duration,
    },
    {
      where: {
        id: jobId,
      },
    },
  )

  const findUnAssign = await jobs.findOne({
    where: { bookingId: jobData.bookingId, status: 'pending' },
  })

  if (!findUnAssign) bookingStatus = 'book'

  await booking.update(
    {
      total: updatedBookingTotal,
      duration: updatedBookingDuration,
      status: bookingStatus,
      startTime: startFrom,
      endTime: endsAt,
    },
    { where: { id: jobData.bookingId } },
  )

  editJob(jobId, jobStatus)
  return res.json(returnFunction('1', 'Service Edit Successfully!', {}, ''))
}

//! -- New Controllers

exports.markAppointmentAsNoShow = async (req, res, next) => {
  const { bookingId } = req.params

  const appointment = await booking.findByPk(bookingId, {
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
      { model: user, attributes: ['id', 'stripeCustomerId'] },
      { model: salonDetail, attributes: ['id', 'connectAccountId'] },
    ],
  })

  if (!appointment) {
    throw new AppError('resource not found', 404)
  }

  let finePercentage = 0
  if (
    appointment?.status === 'complete' ||
    appointment?.status === 'no-show' ||
    appointment?.status === 'cancel'
  ) {
    throw new AppError(
      `The appointment has already been marked as : ${appointment.status}.`,
      200,
    )
  }
  //!TODO Term and Condition on cancel charges and time ---->>> after discuss
  const updatedBooking = { tip: 0 }

  if (
    appointment?.by == 'online' &&
    appointment?.noshowPolicyVersion &&
    appointment?.stripeCardId &&
    appointment.initialPaymentIntend
  ) {
    const { refundPercentage } = await noShowPolicy.findOne({
      where: {
        version: appointment.noshowPolicyVersion,
        salonDetailId: appointment.salonDetailId,
      },
    })

    finePercentage = refundPercentage

    const paid =
      parseFloat(appointment.actualCapturedAmount) + parseFloat(appointment.tip)

    const noshowCharges = appointment.total * (refundPercentage / 100)
    console.log(
      'ðŸš€ ~ exports.cancelAppointment= ~ refundPercentage:',
      appointment.noshowPolicyVersion,
      refundPercentage,
    )

    console.log(
      'ðŸš€ ~ exports.cancelAppointment= ~ paid:',
      paid,
      refundPercentage,
    )
    console.log('ðŸš€ ~ ~ noshowCharges:', noshowCharges)

    if (paid > noshowCharges) {
      console.log('-----> ~CASE~ intialPayment Greater (penalty) ')

      const refundAmount = paid - noshowCharges
      const refund = await Stripe.refundPartialPayment(
        appointment.initialPaymentIntend,
        refundAmount,
      )
      if (refund?.id) {
        updatedBooking.status = 'no-show'
        updatedBooking.finalPayment = 'paid'
        updatedBooking.refundAmount = refundAmount
        updatedBooking.refundPaymentIntend = refund?.id
      }

      console.log('--------------->Ã°Å¸Å¡â‚¬ ~Refund Success', refund)
    } else if (paid < noshowCharges) {
      console.log('-----------> ~CASE~ noshowCharges Greater (penalty)')
      const fineAmount = noshowCharges - paid
      const fine = await Stripe.capturePayment(
        fineAmount,
        appointment.user?.stripeCustomerId,
        appointment.stripeCardId,
        appointment.salonDetail?.connectAccountId,
      )
      if (fine?.id) {
        updatedBooking.status = 'no-show'
        updatedBooking.finalPayment = 'paid'
        updatedBooking.penaltyPaymentIntend = fine?.id
        updatedBooking.penaltyAmount = fineAmount
      }
      console.log('Ã°Å¸Å¡â‚¬ ----------->~Fine Captured Success', fine)
    } else {
      // Cancellation charges equal to upfront payment
      updatedBooking.status = 'no-show'
      updatedBooking.finalPayment = 'paid'

      console.log('-----> ~ Equal')
    }
    updatedBooking.noshowCharges = noshowCharges
    updatedBooking.actualCapturedAmount = noshowCharges
    updatedBooking.total = noshowCharges
    updatedBooking.initialPayment = paid
  } else {
    updatedBooking.status = 'no-show'
    updatedBooking.finalPayment = 'paid'
    updatedBooking.total = appointment.actualCapturedAmount
  }
  updatedBooking.subTotal = appointment.total
  console.log(
    'ðŸš€ ~ exports.cancelAppointment= ~ updatedBooking:',
    updatedBooking,
  )
  await booking.update(updatedBooking, { where: { id: bookingId } })
  if (updatedBooking.status == 'no-show') {
    await jobs.update({ status: 'no-show' }, { where: { bookingId } })
    noShowMessages(appointment?.id, finePercentage, true)
  } else {
    noShowMessages(appointment?.id, finePercentage)
  }

  //notifications
  const output = response({
    message: 'Appointment marked as no-show successfull.',
    data: {},
  })
  return res.status(200).json(output)
}

// Not using
exports.markAppointmentAscancel = async (req, res, next) => {
  const { bookingId } = req.params

  await booking.update({ status: 'cancel' }, { where: { id: bookingId } })
  await jobs.update({ status: 'cancel' }, { where: { bookingId } })

  const inputData = await booking.findOne({
    where: { id: bookingId },
    attributes: ['id', 'status', 'on', 'startTime'],
    include: [
      {
        model: salonDetail,
        attributes: ['salonName'],
        include: [
          {
            model: addressDBS,
            attributes: [
              'streetAddress',
              'city',
              'district',
              'province',
              'country',
            ],
          },
          {
            model: user,
            attributes: [
              'firstName',
              'lastName',
              'email',
              'countryCode',
              'phoneNum',
            ],
            include: { model: deviceToken, attributes: ['tokenId'] },
          },
        ],
      },
      {
        model: user,
        attributes: [
          'firstName',
          'lastName',
          'email',
          'countryCode',
          'phoneNum',
        ],
        include: { model: deviceToken, attributes: ['tokenId'] },
      },
      {
        model: jobs,
        attributes: ['id', 'on', 'startTime', 'duration'],
        include: [
          { model: service, attributes: ['serviceName'] },
          {
            model: employee,
            attributes: ['position'],
            include: { model: user, attributes: ['firstName', 'lastName'] },
          },
        ],
      },
    ],
  })

  const socketInput = {
    event: 'complete-appointment',
    data: { id: bookingId * 1 },
    bookingId: bookingId,
  }
  await unAcknowledgedEvents.destroy({ where: { bookingId } })
  sendEvent(`${inputData?.salonDetail?.id}S`, socketInput)
  const workers = await employeeForSocket(inputData?.salonDetail?.id)
  workers.forEach((el) => sendEvent(`${el}E`, socketInput))
  //EMAIL --//TODO
  // EmailAppointmentConfirmToSalon(['sigidevelopers@gmail.com'],inputData);

  //Notification
  const dateTime = emailDateFormate(inputData.on, inputData.startTime)
  const salonTokens = inputData?.salonDetail?.user?.deviceTokens?.map((ele) => {
    return ele?.tokenId
  })
  const customerTokens = inputData?.user?.deviceTokens?.map((ele) => {
    return ele?.tokenId
  })

  const customerNotification = {
    title: `Appointment Cancellation`,
    body: `We regret to inform you that your appointment on ${dateTime} has been cancelled. Please contact us to reschedule.`,
  }

  const fullName = `${inputData.user.firstName} ${inputData.user.lastName}`

  const salonNotification = {
    title: `Booking Cancellation Alert`,
    body: `The appointment with ${fullName} on ${dateTime} has been cancelled.`,
  }

  const output = response({
    message: 'Appointment marked as cancel successfull.',
    data: {},
  })
  return res.status(200).json(output)
}
