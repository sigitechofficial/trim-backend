const { Op, literal, col, fn, where } = require('sequelize')
const {
  salonDetail,
  addressDBS,
  coupon,
  employee,
  time,
  breakTime,
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
  customerOnConnectAccount,
  employeeWagesMethod,
  salonProfiles,
  clientNotes,
  couponOnBooking,
  couponTimeSlot,
  subscriptions,
  salonClient,
  allergies,
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
  parseMetadataMinorUnits,
  resolveTapToPayServiceAmountMinorUnits,
} = require('../../utils/tapToPayAmount')
const {
  walkinAppointmentConfirm,
  onlineAppointmentConfirm,
} = require('../eventDrivenCommunication/appointmentConfirm')
const {
  requestDeclined,
  timeProposed,
} = require('../eventDrivenCommunication/appointmentRequest')
const { DateTime } = require('luxon')
const { isSalonRowActive } = require('../../helper/salonSubscriptionRule')
const { requestExpiresAt: requestDeadline } = require('../../helper/bookingApproval')
const { expireOverdueRequestsSafely } = require('../../helper/expireBookingRequests')
const loyalty = require('../../helper/loyalty')
const mobileBarber = require('../../helper/mobileBarber')
const mobileVisitStatus = require('../../helper/mobileVisitStatus')
const { actingSalonId } = require('../../helper/branchScope')
const {
  resolveRequestActor,
  ownRequestBookingIds,
  canActOnBooking,
} = require('../../helper/bookingRequestAccess')

// A shop may suggest a new time at most this many times per request.
const MAX_TIME_PROPOSALS = 2

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
const {
  socketForCalendar,
  socketForCalendarJobOnly,
} = require('../eventDrivenCommunication/calendarView')

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
// exports.calendarAppointments = async (req, res, next) => {
//   const salon = await salonDetail.findOne({
//     where: { userId: req?.user?.id },
//     attributes: ['id', 'parentSalonId', 'onlinePayments'],
//   })
//   console.log(req.body)
//   let parentSalonName = ''
//   const JobAttributes = [
//     'id',
//     'on',
//     'status',
//     'startTime',
//     'endTime',
//     'total',
//     'duration',
//     'serviceDiscount',
//     'extraDiscount',
//     'serviceId',
//     'employeeId',
//     'bookingId',
//     [
//       literal(
//         `(SELECT services.serviceName
//        FROM services WHERE services.id = jobs.serviceId)`,
//       ),
//       'serviceName',
//     ],
//     [
//       literal(
//         `(SELECT categories.color
//           FROM services
//           INNER JOIN categories ON services.categoryId = categories.id
//           WHERE services.id = jobs.serviceId
//           LIMIT 1)`,
//       ),
//       'color',
//     ],

//     [
//       literal(
//         `(SELECT CONCAT(users.firstName, ' ', users.lastName)
//           FROM users
//           INNER JOIN bookings ON bookings.customerId = users.id
//           WHERE bookings.id = jobs.bookingId
//           LIMIT 1)`,
//       ),
//       'customerName',
//     ],
//     [
//       literal(
//         `(SELECT bookings.customerId
//        FROM bookings WHERE bookings.id = jobs.bookingId)`,
//       ),
//       'customerId',
//     ],
//   ]

//   if (salon?.parentSalonId) {
//     const parentSalon = await salonDetail.findOne({
//       where: { id: salon?.parentSalonId },
//       attributes: ['id', 'salonName'],
//     })

//     parentSalonName = parentSalon?.salonName
//   }
//   if (!salon) {
//     throw new AppError('Resource not found', 404)
//   }
//   const employeCondition = {
//     salonDetailId: salon?.id,
//     deleted: 0,
//     status: true,
//     isExternalEmployee: false,
//   }
//   const jobCondition = {
//     status: {
//       [Op.or]: ['assign', 'complete', 'no-show'],
//     },
//     on: req.params?.date,
//   }
//   const unAssignCondition = {
//     status: {
//       [Op.or]: ['pending', 'no-show'],
//     },
//     employeeId: null,
//     on: req.params.date,
//     [Op.and]: literal(`EXISTS (
//       SELECT 1
//       FROM bookings
//       WHERE bookings.id = jobs.bookingId
//       AND bookings.salonDetailId = ${salon?.id}
//     )`),
//   }

//   if (req.body?.employeeList && req.body?.employeeList.length > 0)
//     employeCondition.id = { [Op.or]: req.body?.employeeList }

//   if (req.body?.serviceList && req.body?.serviceList.length > 0) {
//     jobCondition.serviceId = { [Op.or]: req.body?.serviceList }
//     unAssignCondition.serviceId = { [Op.or]: req.body?.serviceList }
//   }

//   const data = await employee.findAll({
//     where: employeCondition,
//     attributes: [
//       'id',
//       // 'salonDetailId',
//       'position',
//       [
//         literal(
//           `(SELECT users.firstName
//            FROM users WHERE users.id = employee.userId)`,
//         ),
//         'firstName',
//       ],
//       [
//         literal(
//           `(SELECT users.lastName
//            FROM users WHERE users.id = employee.userId)`,
//         ),
//         'lastName',
//       ],
//       [
//         literal(
//           `(SELECT users.image
//            FROM users WHERE users.id = employee.userId)`,
//         ),
//         'image',
//       ],
//       [
//         literal(
//           `(SELECT times.openingTime
//            FROM times WHERE times.employeeId = employee.id AND times.day = '${req.params.day}')`,
//         ),
//         'openingTime',
//       ],
//       [
//         literal(
//           `(SELECT times.closingTime
//            FROM times WHERE times.employeeId = employee.id AND times.day = '${req.params.day}')`,
//         ),
//         'closingTime',
//       ],
//       [
//         literal(
//           `(SELECT times.status
//            FROM times WHERE times.employeeId = employee.id AND times.day = '${req.params.day}')`,
//         ),
//         'dayStatus',
//       ],
//     ],
//     include: [
//       {
//         model: jobs,
//         required: false,
//         where: jobCondition,
//         attributes: JobAttributes,
//       },
//     ],
//   })

//   const results = JSON.parse(JSON.stringify(data))
//   const startOfDay = '00:00:00'
//   const endOfDay = '23:59:59'

//   // Process each employee to set default opening and closing times if needed
//   results.forEach((employee) => {
//     if (!employee.dayStatus || !employee.openingTime) {
//       employee.openingTime = startOfDay
//     }
//     if (!employee.dayStatus || !employee.closingTime) {
//       employee.closingTime = endOfDay
//     }
//   })

//   const salonTimes = await time.findOne({
//     where: { salonDetailId: salon?.id, day: req.params?.day },
//     attributes: ['openingTime', 'closingTime', 'status'],
//   })

//   const unAssignedJobs = await jobs.findAll({
//     where: unAssignCondition,
//     attributes: JobAttributes,
//   })

//   if (req.body.status == 'Un-Assigned') {
//     results.forEach((el) => {
//       el.jobs = []
//     })
//   }

//   if (unAssignedJobs.length > 0) {
//     const unassign = {
//       id: 0,
//       position: '',
//       firstName: 'UnAssigned',
//       lastName: '',
//       openingTime: salonTimes?.openingTime,
//       closingTime: salonTimes?.closingTime,
//       dayStatus: salonTimes?.status ? 1 : 0,
//       jobs: req.body.status == 'Assign' ? [] : unAssignedJobs,
//     }
//     results.push(unassign)
//   }
//   const output = response({
//     message: 'Success.',
//     data: {
//       salonTimes,
//       employees: results || [],
//       parentSalonName,
//       onlinePayments: salon?.onlinePayments ?? true,
//     },
//   })

//   return res.status(200).json(output)
// }

exports.calendarAppointments = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { id: await actingSalonId(req) },
    attributes: ['id', 'parentSalonId', 'isExternalEmployee', 'renterGraceUntil', 'onlinePayments', 'autoAcceptBookings', 'approvalScope', 'registrationExpiryDate', 'registrationDate', 'subscriptionLatestPaymentStatus'],
  })
  // Expire overdue requests first so the calendar and the requests count are current.
  if (salon?.id) await expireOverdueRequestsSafely({ salonDetailId: salon.id })
  console.log(req.body)
  let parentSalonName = ''
  let subscriptionSalon = salon
  const JobAttributes = [
    'id',
    'on',
    'status',
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
       FROM services WHERE services.id = jobs.serviceId LIMIT 1)`
      ),
      'serviceName',
    ],
    [
      literal(
        `(SELECT categories.color
          FROM services
          INNER JOIN categories ON services.categoryId = categories.id
          WHERE services.id = jobs.serviceId
          LIMIT 1)`
      ),
      'color',
    ],
    [
      literal(
        `(SELECT CONCAT(users.firstName, ' ', users.lastName)
          FROM users
          INNER JOIN bookings ON bookings.customerId = users.id
          WHERE bookings.id = jobs.bookingId
          LIMIT 1)`
      ),
      'customerName',
    ],
    [
      literal(
        `(SELECT bookings.customerId
       FROM bookings WHERE bookings.id = jobs.bookingId)`
      ),
      'customerId',
    ],
    // 'requested' = waiting for the shop to accept (manual approval)
    [
      literal(`(SELECT bookings.status FROM bookings WHERE bookings.id = jobs.bookingId)`),
      'bookingStatus',
    ],
    [
      literal(`(SELECT bookings.requestExpiresAt FROM bookings WHERE bookings.id = jobs.bookingId)`),
      'requestExpiresAt',
    ],
    // 'proposed' = the shop suggested a new time and waits for the client
    [
      literal(`(SELECT bookings.requestOutcome FROM bookings WHERE bookings.id = jobs.bookingId)`),
      'requestOutcome',
    ],
  ]

  if (salon?.parentSalonId) {
    const parentSalon = await salonDetail.findOne({
      where: { id: salon.parentSalonId },
      attributes: ['id', 'salonName', 'registrationExpiryDate', 'registrationDate'],
    })

    // A chair renter pays for their own plan, so only the shop name comes
    // from the host; the subscription stays the renter's own.
    if (parentSalon) parentSalonName = parentSalon.salonName
  }
  if (!salon) {
    throw new AppError('Resource not found', 404)
  }
  const employeCondition = {
    salonDetailId: salon?.id,
    deleted: 0,
    status: true,
    isExternalEmployee: false,
  }
  const jobCondition = {
    status: {
      [Op.or]: ['assign', 'complete', 'no-show'],
    },
    on: req.params?.date,
  }
  const unAssignCondition = {
    status: {
      [Op.or]: ['pending', 'no-show'],
    },
    employeeId: null,
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
      'position',
      [
        literal(
          `(SELECT users.firstName
           FROM users WHERE users.id = employee.userId LIMIT 1)`
        ),
        'firstName',
      ],
      [
        literal(
          `(SELECT users.lastName
           FROM users WHERE users.id = employee.userId LIMIT 1)`
        ),
        'lastName',
      ],
      [
        literal(
          `(SELECT users.image
           FROM users WHERE users.id = employee.userId LIMIT 1)`
        ),
        'image',
      ],
      [
        literal(
          `(SELECT times.openingTime
           FROM times WHERE times.employeeId = employee.id AND times.day = '${req.params.day}' LIMIT 1)`
        ),
        'openingTime',
      ],
      [
        literal(
          `(SELECT times.closingTime
           FROM times WHERE times.employeeId = employee.id AND times.day = '${req.params.day}' LIMIT 1)`
        ),
        'closingTime',
      ],
      [
        literal(
          `(SELECT times.status
           FROM times WHERE times.employeeId = employee.id AND times.day = '${req.params.day}' LIMIT 1)`
        ),
        'dayStatus',
      ],
    ],
    include: [
      {
        model: jobs,
        required: false,
        where: jobCondition,
        attributes: JobAttributes,
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
    attributes: JobAttributes,
  })

  if (req.body.status == 'Un-Assigned') {
    results.forEach((el) => {
      el.jobs = []
    })
  }

  if (unAssignedJobs.length > 0) {
    const unassign = {
      id: 0,
      position: '',
      firstName: 'UnAssigned',
      lastName: '',
      openingTime: salonTimes?.openingTime,
      closingTime: salonTimes?.closingTime,
      dayStatus: salonTimes?.status ? 1 : 0,
      jobs: req.body.status == 'Assign' ? [] : unAssignedJobs,
    }
    results.push(unassign)
  }

  // Check salon subscription status (a chair renter's own plan for renters)
  let subscriptionExpire = false
  const renterBetweenShops = !!(salon?.isExternalEmployee && !salon?.parentSalonId && salon?.renterGraceUntil)
  const subscriptionSalonId = subscriptionSalon?.id ?? salon?.id
  const salonSubscription = await subscriptions.findOne({
    where: { salonDetailId: subscriptionSalonId },
    attributes: ['subscriptionId', 'status', 'subscriptionSource'],
    order: [['createdAt', 'DESC']], // Get the latest subscription
  })

  if (salonSubscription) {
    if (salonSubscription.subscriptionSource === 'revenuecat') {
      // For RevenueCat subscriptions, status is already stored in DB
      if (salonSubscription.status === 'expired' || salonSubscription.status === 'cancelled') {
        subscriptionExpire = true
      }
    } else if (salonSubscription.subscriptionId) {
      // For Stripe subscriptions, fetch live status from Stripe API
      const subscriptionStatus = await Stripe.getSubscriptionStatus(salonSubscription.subscriptionId)
      console.log('🚀 ~ Subscription Status:', subscriptionStatus)
      if (subscriptionStatus === 'canceled' || subscriptionStatus === 'cancelled') {
        subscriptionExpire = true
      }
    }
  }

  if (salon?.isExternalEmployee) {
    subscriptionExpire = !isSalonRowActive(salon, DateTime.now().toISODate())
  }

  const output = response({
    message: 'Success.',
    data: {
      salonTimes,
      employees: results || [],
      parentSalonName,
      onlinePayments: salon?.onlinePayments ?? true,
      autoAcceptBookings: salon?.autoAcceptBookings ?? true,
      approvalScope: salon?.approvalScope ?? 'all',
      ...(await requestCountsFor(req, salon?.id)),
      subscriptionExpire,
      registrationExpiryDate: subscriptionSalon?.registrationExpiryDate,
      registrationDate: subscriptionSalon?.registrationDate,
      renterBetweenShops,
      renterGraceUntil: renterBetweenShops ? salon.renterGraceUntil : null,
    },
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
        [Op.or]: ['book', 'pending', 'requested'],
      },
      salonDetailId: await actingSalonId(req), // the acting branch (Step A)
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
      'vatAmount',
      'isMobileVisit',
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
      salonDetailId: await actingSalonId(req), // the acting branch (Step A)
      isExternalEmployee: false,
      status: true,
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
    //let total=parseFloat(booking.total)+parseFloat(booking.vatAmount)
    //total=String(total)
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
      // Home visit: the calendar shows a "Mobile visit" tag.
      isMobileVisit: !!booking.isMobileVisit,
    }
    bookings.push(retObj)
  })

  return res.json(
    returnFunction(
      '1',
      'Shop bookings',
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
      console.log('ðŸš€ ~ exports.status= ~ status:', status)
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
    where: { isExternalEmployee: false, status: true },
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
      'List of bookings',
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
    where: { id: await actingSalonId(req) },
    attributes: ['id', 'connectAccountId'], // ✅ include account ID
  });

  const { bookingId } = req.body;
  let bookings = [];

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
      {
        model: couponOnBooking, // Ensure this model is included
        attributes: ['id', 'isCouponUsed', 'couponId', 'bookingId'],
        where:{
            isCouponUsed:true
            
        },
        required:false,
        include: [
          {
            model: coupon,
            attributes: ['id', 'promoCode', 'type', 'value', 'status', 'from', 'till'],
            include: [
              {
                model: couponTimeSlot,
                attributes: ['id', 'day', 'timeFrom', 'timeTo'],
              },
            ],
          },
        ],
      },
    ],
  });

  // Ensure couponOnBooking data is correctly accessed
  let couponData = null;
  if (bookingData?.couponOnBookings && Array.isArray(bookingData.couponOnBookings) && bookingData.couponOnBookings.length > 0) {
    couponData = bookingData.couponOnBookings[0]; // Extract the first coupon data
  }

  let cardDetails;
  if (bookingData?.paymentMethod === 'card') {
    try {
      cardDetails = await Stripe.retrievePaymentMethod(
        bookingData.stripeCardId,
        salon?.connectAccountId // ✅ send connectAccountId to Stripe call
      );
    } catch (error) {
      console.warn(`Stripe retrievePaymentMethod failed: ${error.message}`);
    }
  }

  let customerStatus = 'active';
  if (bookingData?.customerId && salon?.id) {
    const isblocked = await blockCustomer.findOne({
      where: { userId: bookingData.customerId, salonDetailId: salon.id },
      attributes: ['id'],
    });

    if (isblocked) customerStatus = 'block';
  }

  let notes;
  if (bookingData?.customerId && salon?.id) {
    notes = await clientNotes.findOne({
      where: { userId: bookingData.customerId, salonDetailId: salon.id },
      attributes: ['customerNote'],
    });
  }

  let services = [];
  bookingData?.jobs.map((ele) => {
    let obj = {
      id: ele.id,
      status: ele.status,
      on: ele.on,
      serviceId: ele.serviceId,
      serviceName: ele.service?.serviceName,
      color: ele.service?.category?.color,
      price: ele.total,
      loyaltyDiscount: ele.loyaltyDiscount,
      startTime: dateManipulation.convertTo12HourFormat(ele.startTime),
      duration: ele.duration,
      endTime: dateManipulation.convertTo12HourFormat(ele.endTime),
      employeeId: ele.employeeId,
      specialists: ele.employee ? `${ele.employee.user.firstName}` : '',
      extra: ele.Extra,
    };
    services.push(obj);
  });

  // The client's visit card at this shop ("3 / 5 visits", reward ready...).
  let loyaltyCard = null
  if (bookingData.customerId > 0) {
    try {
      loyaltyCard = await loyalty.summaryForClient(bookingData.salonDetailId, bookingData.customerId)
    } catch (err) {
      console.error('[loyalty] booking detail card failed:', err.message)
    }
  }

  const clientName = `${bookingData.user?.firstName || bookingData.clientFirstName} ${bookingData.user?.lastName || bookingData.clientLastName}`;
  const clientContact = `${bookingData.user?.countryCode || bookingData.countryCode} ${bookingData.user?.phoneNum || bookingData.phoneNum}`;
  const remaining =
    parseFloat(bookingData.total) +
    parseFloat(bookingData.discount) -
    parseFloat(bookingData.actualCapturedAmount);

  let bookingDetail = {
    id: bookingData.id,
    scheduleDate: bookingData.on,
    status: bookingData.status,
    requestExpiresAt: bookingData.requestExpiresAt,
    requestOutcome: bookingData.requestOutcome,
    previousOn: bookingData.previousOn,
    previousStartTime: bookingData.previousStartTime,
    proposalComment: bookingData.proposalComment,
    previousStaffName: bookingData.previousStaffName,
    proposalCount: bookingData.proposalCount,
    clientDeclineNote: bookingData.clientDeclineNote,
    discount: bookingData.discount,
    actualCapturedAmount: bookingData.actualCapturedAmount,
    appointmentNote: bookingData?.note || '',
    client: clientName,
    profile: bookingData.user?.image ?? '',
    email: bookingData.user?.email ?? '',
    clientNote: notes?.customerNote || '',
    Phone: clientContact,
    salonDetailId: bookingData.salonDetailId,
    Upfront: bookingData.initialPayment,
    duration: bookingData.duration,
    initialPayment: bookingData.initialPayment,
    total: bookingData.total,
    subTotal: bookingData.subTotal,
    vatAmount: bookingData?.vatAmount,
    vatOriginalAmount: bookingData?.vatOriginalAmount,
    tip: bookingData?.tip ?? 0.00,
    platformFee: bookingData.platformFee,
    customerId: bookingData?.customerId ?? '',
    last4: cardDetails?.last4 ?? '',
    paymentMethodId: bookingData?.stripeCardId ?? '',
    services,
    customerStatus,
    connectAccountId: salon?.connectAccountId || '', // ✅ added here
    couponOnBooking: couponData, // Add coupon information
    loyaltyDiscount: bookingData.loyaltyDiscount,
    loyaltyPercentage: bookingData.loyaltyPercentage,
    loyaltyCard,
    // Home visit: the client's address (postcode area only until accepted).
    isMobileVisit: !!bookingData.isMobileVisit,
    travelFee: bookingData.travelFee,
    travelMiles: bookingData.travelMiles,
  };
  if (bookingData.isMobileVisit) {
    const holder = { isMobileVisit: true, visitAddressId: bookingData.visitAddressId, status: bookingData.status }
    await mobileBarber.attachVisitAddress(holder)
    bookingDetail.visitAddress = holder.visitAddress || null
    // On my way / Arrived buttons and their times.
    Object.assign(bookingDetail, mobileVisitStatus.statusFields(bookingData), {
      visitWindow: mobileVisitStatus.windowState(bookingData),
    })
  }

  return res.json(returnFunction('1', 'Booking details', { bookingDetail }, ''));
};

/*
              4.Cancel Reasons
      ________________________________________
*/
exports.reasons = async (req, res, next) => {
  const actorReasonType =
    req.user?.userTypeId === 3
      ? 'appointment_employee_cancellation'
      : 'appointment_salon_owner_cancellation'

  const reasons = await reason.findAll({
    where: { status: true, type: actorReasonType },
    attributes: ['id', 'reason', 'type'],
  })
  return res.json(
    returnFunction('1', 'Booking cancelled reasons', { reasons }, ''),
  )
}
/*
              4.Cancel Booking
      ________________________________________
*/

/*
              Manual booking approval (requests)
      ________________________________________
*/

// The shop the caller works for: as owner, or as an in-house staff member.
async function shopIdForUser(userId) {
  const owned = await salonDetail.findOne({ where: { userId }, attributes: ['id'] })
  if (owned) return owned.id
  const staff = await employee.findOne({
    where: { userId, deleted: false },
    attributes: ['salonDetailId'],
  })
  return staff?.salonDetailId ?? null
}

// The request named in the body, if the caller's shop owns it and the caller
// is allowed to answer it. Sets req.requestActor (who is acting).
async function findOwnRequest(req) {
  const actor = await resolveRequestActor(req)
  req.requestActor = actor
  const shopId = actor.shopId
  const bookingId = parseInt(req.body?.bookingId, 10)
  const request =
    shopId && bookingId
      ? await booking.findOne({
          where: { id: bookingId, salonDetailId: shopId },
          include: [{ model: salonDetail, attributes: ['id', 'connectAccountId'] }],
        })
      : null
  if (!request) throw new AppError('Booking not found', 200)
  if (!(await canActOnBooking(actor, request.id))) {
    throw new AppError("You don't have access to respond to this booking request.", 200)
  }
  if (request.status !== 'requested') {
    throw new AppError('This booking request has already been answered.', 200)
  }
  if (request.requestExpiresAt && new Date(request.requestExpiresAt) <= new Date()) {
    await expireOverdueRequestsSafely({ id: request.id })
    throw new AppError('This request has expired. The client was not charged.', 200)
  }
  return request
}

// Open requests this person may answer, for the bar above the calendar:
// pendingRequests = waiting on the SHOP (orange "N booking requests waiting"),
// awaitingClientRequests = the shop suggested a time and the client must answer.
async function requestCountsFor(req, salonDetailId) {
  const none = { pendingRequests: 0, awaitingClientRequests: 0 }
  if (!salonDetailId) return none
  try {
    const actor = await resolveRequestActor(req)
    if (actor.level === 'none') return none
    const where = { salonDetailId, status: 'requested' }
    if (actor.level === 'low') where.id = { [Op.in]: await ownRequestBookingIds(actor.employeeId) }
    const [open, awaitingClientRequests] = await Promise.all([
      booking.count({ where }),
      booking.count({ where: { ...where, requestOutcome: 'proposed' } }),
    ])
    return { pendingRequests: open - awaitingClientRequests, awaitingClientRequests }
  } catch (err) {
    console.error('requestCountsFor failed:', err.message)
    return none
  }
}

exports.bookingRequests = async (req, res, next) => {
  const actor = await resolveRequestActor(req)
  const shopId = actor.shopId
  if (!shopId) throw new AppError('Shop not found', 200)
  if (actor.level === 'none') {
    return res.json(response({ message: 'Booking requests', data: { requests: [], access: 'none' } }))
  }
  // Expire anything past its deadline now, so the list only shows open requests.
  await expireOverdueRequestsSafely({ salonDetailId: shopId })
  const scope = { salonDetailId: shopId, status: 'requested' }
  // "Own only": requests for bookings with this staff member.
  if (actor.level === 'low') scope.id = { [Op.in]: await ownRequestBookingIds(actor.employeeId) }
  const requests = await booking.findAll({
    where: scope,
    attributes: [
      'id',
      'on',
      'startTime',
      'endTime',
      'duration',
      'total',
      'initialPayment',
      'paymentMethod',
      'customerStatus',
      'requestExpiresAt',
      'requestOutcome',
      'previousOn',
      'previousStartTime',
      'previousEndTime',
      'proposalComment',
      'previousStaffName',
      'proposedAt',
      'proposalCount',
      'clientDeclineNote',
      'status',
      'isMobileVisit',
      'visitAddressId',
      'travelFee',
      'travelMiles',
    ],
    include: [
      { model: user, attributes: ['id', 'firstName', 'lastName', 'image'] },
      {
        model: jobs,
        attributes: ['id', 'startTime', 'endTime', 'duration', 'total', 'status'],
        include: [
          { model: service, attributes: ['id', 'serviceName'] },
          {
            model: employee,
            attributes: ['id'],
            include: { model: user, attributes: ['firstName', 'lastName'] },
          },
        ],
      },
    ],
    order: [['requestExpiresAt', 'ASC']],
  })
  // Home visits show the postcode area only until accepted.
  await mobileBarber.attachVisitAddress(requests)
  return res.json(
    response({
      message: 'Booking requests',
      data: { requests, access: actor.level, maxTimeProposals: MAX_TIME_PROPOSALS },
    }),
  )
}

exports.acceptBookingRequest = async (req, res, next) => {
  const request = await findOwnRequest(req)
  if (request.requestOutcome === 'proposed') {
    throw new AppError('You suggested a new time. Waiting for the client to confirm it.', 200)
  }
  if (request.requestOutcome === 'returned') {
    throw new AppError(
      'The client declined the suggested time. Suggest another time or decline the request.',
      200,
    )
  }
  if (request.requestExpiresAt && new Date(request.requestExpiresAt) <= new Date()) {
    throw new AppError('This request has expired and can no longer be accepted.', 200)
  }

  // Claim the request first (the expiry job uses the same guard), then take the
  // held deposit; if the hold has lapsed, put it back so the shop can decline.
  const unassigned = await jobs.count({ where: { bookingId: request.id, status: 'pending' } })
  const [claimed] = await booking.update(
    {
      status: unassigned ? 'pending' : 'book',
      requestOutcome: 'accepted',
      respondedAt: new Date(),
      respondedByName: req.requestActor?.name || null,
    },
    { where: { id: request.id, status: 'requested' } },
  )
  if (!claimed) throw new AppError('This booking request has already been answered.', 200)

  const deposit = Number(request.initialPayment) || 0
  if (request.initialPaymentIntend && deposit > 0) {
    try {
      await Stripe.captureHeldPayment(
        request.initialPaymentIntend,
        request.salonDetail?.connectAccountId,
      )
    } catch (err) {
      await booking.update(
        { status: 'requested', requestOutcome: null, respondedAt: null, respondedByName: null },
        { where: { id: request.id } },
      )
      throw err
    }
    await booking.update({ actualCapturedAmount: deposit }, { where: { id: request.id } })
  }

  socketForCalendar({ appointmentId: request.id, type: 'new' })
  onlineAppointmentConfirm(request.id)
  return res.json(response({ message: 'Booking accepted', data: { appointment: request.id } }))
}

// "HH:mm", "HH:mm:ss" or "h:mm AM" -> "HH:mm:ss"
function toTime24(value) {
  const text = String(value || '').trim().toUpperCase()
  for (const format of ['HH:mm:ss', 'HH:mm', 'h:mm a', 'hh:mm a', 'h:mma', 'hh:mma']) {
    const parsed = DateTime.fromFormat(text, format, { locale: 'en' })
    if (parsed.isValid) return parsed.toFormat('HH:mm:ss')
  }
  return null
}

const addMinutes = (time, minutes) =>
  DateTime.fromFormat(time, 'HH:mm:ss').plus({ minutes }).toFormat('HH:mm:ss')

// Accept with a new time: move the request (and its held slot) to the shop's
// suggested date/time/staff and wait for the client to confirm or decline.
// The client's deadline uses the same rule as the shop's.
exports.proposeBookingTime = async (req, res, next) => {
  const request = await findOwnRequest(req)
  if (request.requestOutcome === 'proposed') {
    throw new AppError('You already suggested a new time. Waiting for the client to answer.', 200)
  }
  // Requests suggested before proposalCount existed count as one suggestion.
  const proposalsSoFar = Math.max(
    Number(request.proposalCount) || 0,
    request.requestOutcome === 'returned' ? 1 : 0,
  )
  if (proposalsSoFar >= MAX_TIME_PROPOSALS) {
    throw new AppError(
      `You have already suggested a new time ${MAX_TIME_PROPOSALS} times for this request.`,
      200,
    )
  }

  const on = String(req.body?.on || '').slice(0, 10)
  const startTime = toTime24(req.body?.startTime)
  if (!DateTime.fromISO(on).isValid || !startTime) {
    throw new AppError('Choose a valid date and time.', 200)
  }
  const shopZone = 'Europe/London'
  const startAt = DateTime.fromISO(`${on}T${startTime}`, { zone: shopZone })
  if (startAt <= DateTime.now().setZone(shopZone)) {
    throw new AppError('Please choose a time in the future.', 200)
  }
  const comment = String(req.body?.comment ?? '').trim().slice(0, 500)

  const employeeId = parseInt(req.body?.employeeId, 10) || null
  if (employeeId && !(await activeStaffOf(request.salonDetailId, employeeId))) {
    throw new AppError('This staff member is not available.', 200)
  }

  // Chain the services back to back from the new start time.
  const bookingJobs = await jobs.findAll({
    where: { bookingId: request.id },
    attributes: ['id', 'startTime', 'duration', 'employeeId', 'status'],
    order: [['startTime', 'ASC'], ['id', 'ASC']],
  })
  if (!bookingJobs.length) throw new AppError('This request has no services.', 200)
  let cursor = startTime
  const planned = bookingJobs.map((job) => {
    const jobStart = cursor
    const jobEnd = addMinutes(jobStart, Number(job.duration) || 0)
    cursor = jobEnd
    const staffId = employeeId || job.employeeId || null
    return {
      job,
      startTime: jobStart,
      endTime: jobEnd,
      employeeId: staffId,
      status: staffId ? 'assign' : job.status,
    }
  })
  const endTime = cursor
  // Home visit: the suggested barber must travel here and have travel time.
  await mobileBarber.checkVisitMove({ bookingId: request.id, employeeId, on, startTime, endTime })

  // Who the client asked for vs who the shop suggests (names for the client).
  const staffNames = async (ids) => {
    const unique = [...new Set(ids.filter(Boolean))]
    if (!unique.length) return ''
    const rows = await employee.findAll({
      where: { id: unique },
      attributes: ['id'],
      include: { model: user, attributes: ['firstName', 'lastName'] },
    })
    return rows
      .map((r) => `${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim())
      .filter(Boolean)
      .join(', ')
  }
  const previousIds = bookingJobs.map((j) => j.employeeId)
  const newIds = planned.map((p) => p.employeeId)
  const staffChanged = previousIds.join(',') !== newIds.join(',')
  // Always remember who the client asked for, so both apps can show it.
  // Keep what the client ORIGINALLY asked for across both suggestions.
  const firstProposal = !request.previousOn
  const previousStaffName = firstProposal ? await staffNames(previousIds) : request.previousStaffName
  const newStaffName = staffChanged ? await staffNames(newIds) : ''

  // Suggesting the time the booking already has changes nothing: on a fresh
  // request that is an accept; after a decline the client already said no.
  if (!staffChanged && on === String(request.on).slice(0, 10) && startTime.slice(0, 5) === String(request.startTime).slice(0, 5)) {
    throw new AppError(
      request.requestOutcome === 'returned'
        ? 'The client already declined this time. Please choose a different one.'
        : 'This is the time the client asked for. To keep it, accept the request.',
      200,
    )
  }

  if (endTime < startTime) {
    throw new AppError('The booking must finish on the same day.', 200)
  }

  // Same rules as the slot list: shop open, staff working, inside both
  // sets of hours, clear of breaks and other jobs.
  if (employeeId) {
    const toMin = (t) => {
      const [h, m] = String(t).split(':').map((n) => parseInt(n, 10) || 0)
      return h * 60 + m
    }
    const [day] = await proposalDays({
      salonDetailId: request.salonDetailId,
      bookingId: request.id,
      employeeId,
      duration: toMin(endTime) - toMin(startTime),
      start: DateTime.fromISO(on),
      days: 1,
    })
    if (day.status === 'closed') throw new AppError('The shop is closed on that day.', 200)
    if (day.status === 'off') throw new AppError("That staff member doesn't work on that day.", 200)
    const s0 = toMin(startTime)
    const e0 = toMin(endTime)
    const [openH, openM] = day.open.split(':').map(Number)
    const [closeH, closeM] = day.close.split(':').map(Number)
    if (s0 < openH * 60 + openM || e0 > closeH * 60 + closeM) {
      throw new AppError('That time is outside working hours.', 200)
    }
    if (!day.busy.every(([bs, be]) => e0 <= bs || s0 >= be)) {
      return res.json(
        response({
          status: '2',
          message: 'That time is no longer free for the chosen staff member. Please pick another time.',
        }),
      )
    }
  }

  // The new slot must be free for each staff member (other bookings only).
  for (const p of planned) {
    if (!p.employeeId) continue
    const clash = await jobs.findOne({
      where: {
        employeeId: p.employeeId,
        on,
        status: 'assign',
        bookingId: { [Op.ne]: request.id },
        startTime: { [Op.lt]: p.endTime },
        endTime: { [Op.gt]: p.startTime },
      },
      attributes: ['id'],
    })
    if (clash) {
      return res.json(
        response({
          status: '2',
          message: 'That time is no longer free for the chosen staff member. Please pick another time.',
        }),
      )
    }
  }

  // Claim: only one proposal, and not after an accept/decline/expiry.
  const [claimed] = await booking.update(
    {
      previousOn: firstProposal ? request.on : request.previousOn,
      previousStartTime: firstProposal ? request.startTime : request.previousStartTime,
      previousEndTime: firstProposal ? request.endTime : request.previousEndTime,
      on,
      startTime,
      endTime,
      requestOutcome: 'proposed',
      proposalComment: comment || null,
      previousStaffName: previousStaffName || null,
      proposedAt: new Date(),
      proposalCount: proposalsSoFar + 1,
      respondedByName: req.requestActor?.name || null,
      requestExpiresAt: requestDeadline(on, startTime),
      requestReminderSent: true,
    },
    {
      where: {
        id: request.id,
        status: 'requested',
        // Waiting on the shop: a fresh request, or one the client sent back.
        [Op.or]: [{ requestOutcome: null }, { requestOutcome: 'returned' }],
      },
    },
  )
  if (!claimed) throw new AppError('This booking request has already been answered.', 200)

  for (const p of planned) {
    await p.job.update({
      on,
      startTime: p.startTime,
      endTime: p.endTime,
      employeeId: p.employeeId,
      status: p.status,
    })
  }

  socketForCalendar({ appointmentId: request.id, type: 'reschedule' })
  timeProposed(request.id, comment, newStaffName, proposalsSoFar + 1 >= MAX_TIME_PROPOSALS)
  return res.json(
    response({
      message: 'New time sent to the client',
      data: {
        appointment: request.id,
        on,
        startTime,
        endTime,
        proposalCount: proposalsSoFar + 1,
        proposalsLeft: MAX_TIME_PROPOSALS - (proposalsSoFar + 1),
      },
    }),
  )
}

// Free start times for one staff member over several days, for suggesting a
// new time on a request: shop hours ∩ staff hours that day, minus the staff's
// own and shop-wide breaks and every booked / held / done job (except this
// request's own). Days are marked closed (shop), off (staff) or full.
// The same person can have linked employee records (parent / children, e.g.
// in-house and chair renter); their breaks and jobs all block that person.
async function linkedEmployeeIds(employeeId) {
  const me = await employee.findByPk(employeeId, { attributes: ['id', 'parentEmployeeId'] })
  const ids = new Set([employeeId])
  if (me?.parentEmployeeId) ids.add(me.parentEmployeeId)
  const children = await employee.findAll({ where: { parentEmployeeId: employeeId }, attributes: ['id'] })
  children.forEach((c) => ids.add(c.id))
  return [...ids]
}

// Mirrors the customer app's time selection: slots are as long as the
// booking's services, laid end to end from opening; on today's date they start
// from the shop's current time (sent by the shop's phone) instead.
async function proposalDays({
  salonDetailId,
  bookingId,
  employeeId,
  duration,
  start,
  days,
  step = duration,
  today = null,
  nowTime = null,
}) {
  const staffIds = await linkedEmployeeIds(employeeId)
  const [shopTimes, staffTimes, breaks] = await Promise.all([
    time.findAll({
      where: { salonDetailId },
      attributes: ['day', 'status', 'openingTime', 'closingTime'],
    }),
    time.findAll({
      where: { employeeId },
      attributes: ['day', 'status', 'openingTime', 'closingTime'],
    }),
    breakTime.findAll({
      where: {
        status: true,
        [Op.or]: [{ employeeId: { [Op.in]: staffIds } }, { employeeId: null, salonDetailId }],
      },
      attributes: ['day', 'breakStart', 'breakEnd'],
    }),
  ])
  const byDay = (rows) => Object.fromEntries(rows.map((r) => [r.day, r]))
  const shopByDay = byDay(shopTimes)
  const staffByDay = byDay(staffTimes)
  const toMin = (t) => {
    const [h, m] = String(t || '0:0').split(':').map((n) => parseInt(n, 10) || 0)
    return h * 60 + m
  }
  const closeMin = (t) => (String(t || '') === '00:00:00' ? 24 * 60 : toMin(t))
  const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

  const busyJobs = await jobs.findAll({
    where: {
      employeeId: { [Op.in]: staffIds },
      status: { [Op.in]: ['assign', 'complete', 'no-show'] },
      bookingId: { [Op.ne]: bookingId },
      on: { [Op.between]: [start.toISODate(), start.plus({ days: days - 1 }).toISODate()] },
    },
    attributes: ['on', 'startTime', 'endTime'],
  })

  const result = []
  for (let i = 0; i < days; i++) {
    const d = start.plus({ days: i })
    const date = d.toISODate()
    const weekday = d.setLocale('en').toFormat('cccc')
    const shop = shopByDay[weekday]
    const own = staffByDay[weekday]
    if (!shop || !shop.status) {
      result.push({ date, status: 'closed', slots: [] })
      continue
    }
    if (!own || !own.status) {
      result.push({ date, status: 'off', slots: [] })
      continue
    }
    let open = Math.max(toMin(shop.openingTime), toMin(own.openingTime))
    // Today: start from the shop's current time, like the customer app.
    if (today && nowTime && date === today) open = Math.max(open, toMin(nowTime))
    const close = Math.min(closeMin(shop.closingTime), closeMin(own.closingTime))
    const busy = [
      ...busyJobs
        .filter((j) => String(j.on).slice(0, 10) === date)
        .map((j) => [toMin(j.startTime), toMin(j.endTime)]),
      ...breaks.filter((b) => b.day === weekday).map((b) => [toMin(b.breakStart), toMin(b.breakEnd)]),
    ]
    const slots = []
    for (let m = open; m + duration <= close; m += step) {
      const end = m + duration
      if (busy.every(([bs, be]) => end <= bs || m >= be)) slots.push({ start: fmt(m), end: fmt(end) })
    }
    result.push({ date, status: slots.length ? 'open' : 'full', slots, open: fmt(open), close: fmt(close), busy })
  }
  return result
}

// Active (not blocked), not deleted staff of the request's shop, or null.
async function activeStaffOf(salonDetailId, employeeId) {
  if (!employeeId) return null
  return employee.findOne({
    where: { id: employeeId, salonDetailId, deleted: false, status: true },
    attributes: ['id'],
  })
}

exports.proposalSlots = async (req, res, next) => {
  const request = await findOwnRequest(req)
  const employeeId = parseInt(req.body?.employeeId, 10)
  if (!(await activeStaffOf(request.salonDetailId, employeeId))) {
    throw new AppError('This staff member is not available.', 200)
  }
  const bookingJobs = await jobs.findAll({ where: { bookingId: request.id }, attributes: ['duration'] })
  const duration = bookingJobs.reduce((sum, j) => sum + (Number(j.duration) || 0), 0) || 30
  const days = Math.min(Math.max(parseInt(req.body?.days, 10) || 21, 1), 42)
  const from = DateTime.fromISO(String(req.body?.from || '').slice(0, 10))
  const nowTime = /^\d{1,2}:\d{2}$/.test(String(req.body?.nowTime || '')) ? req.body.nowTime : null
  const result = await proposalDays({
    salonDetailId: request.salonDetailId,
    bookingId: request.id,
    employeeId,
    duration,
    start: from.isValid ? from : DateTime.now(),
    days,
    today: from.isValid ? from.toISODate() : null,
    nowTime,
  })
  return res.json(
    response({
      message: 'Proposal slots',
      data: { duration, days: result.map(({ date, status, slots }) => ({ date, status, slots })) },
    }),
  )
}

exports.declineBookingRequest = async (req, res, next) => {
  const request = await findOwnRequest(req)
  const reasonId = parseInt(req.body?.reasonId, 10) || null
  const chosen = reasonId
    ? await reason.findOne({
        where: {
          id: reasonId,
          type: {
            [Op.in]: ['appointment_salon_owner_cancellation', 'appointment_employee_cancellation'],
          },
        },
        attributes: ['id', 'reason'],
      })
    : null
  const reasonText = String(req.body?.reasonText ?? '').trim().slice(0, 255) || chosen?.reason || ''

  if (request.initialPaymentIntend) {
    await Stripe.releaseHeldPayment(
      request.initialPaymentIntend,
      request.salonDetail?.connectAccountId,
    )
  }
  await request.update({
    status: 'cancel',
    requestOutcome: 'declined',
    respondedAt: new Date(),
    respondedByName: req.requestActor?.name || null,
    actualCapturedAmount: 0,
    cancellationCharges: 0,
    total: 0,
    tip: 0,
  })
  await jobs.update({ status: 'cancel' }, { where: { bookingId: request.id } })
  await cancelledBooking.create({
    bookingId: request.id,
    userId: req.user.id,
    reasonId: chosen?.id ?? null,
    reasonText,
  })

  socketForCalendar({ appointmentId: request.id, type: 'finish', status: 'cancel' })
  requestDeclined(request.id, reasonText)
  return res.json(response({ message: 'Booking request declined', data: {} }))
}

exports.cancelBooking = async (req, res, next) => {
  const userId = req.user.id;
  const { bookingId, reasonId, reasonText } = req.body;

  const jobComplete = await jobs.findOne({
    where: { bookingId, status: 'complete' },
  });

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
      'customerId',
      'clientFirstName',
      'clientLastName',
    ],
    include: [
      {
        model: user,
        attributes: ['firstName', 'lastName'],
        required: false,
      },
    ],
  });

  if (!appointment) {
    throw new AppError('resource not found', 404);
  }

  if (
    appointment.status === 'complete' ||
    appointment.status === 'no-show' ||
    appointment.status === 'cancel'
  ) {
    throw new AppError(
      `The booking has already been marked as : ${appointment.status}.`,
      200
    );
  } else if (jobComplete) {
    return next(
      new appError(
        `You've completed one service, so the booking cannot be canceled at this stage.`,
        200
      )
    );
  }

  // ✅ Get connectAccountId and salon name for the salon
  const salon = await salonDetail.findOne({
    where: { id: appointment.salonDetailId },
    attributes: ['connectAccountId', 'salonName'],
  });
  const connectAccountId = salon?.connectAccountId;

  const updatedBooking = { tip: 0 };

  // A request was never charged: release the hold instead of refunding.
  const isRequest = appointment.status === 'requested';
  if (isRequest) {
    // Cancelling a request is declining it: same permission as Decline.
    const actor = await resolveRequestActor(req)
    if (actor.shopId !== appointment.salonDetailId || !(await canActOnBooking(actor, appointment.id))) {
      throw new AppError("You don't have access to respond to this booking request.", 200)
    }
    updatedBooking.respondedByName = actor.name || null
    if (appointment.initialPaymentIntend) {
      await Stripe.releaseHeldPayment(appointment.initialPaymentIntend, connectAccountId);
    }
    updatedBooking.requestOutcome = 'declined';
    updatedBooking.respondedAt = new Date();
  }

  const paid = isRequest
    ? 0
    : parseFloat(appointment.actualCapturedAmount) + parseFloat(appointment.tip);

  if (
    paid > 0 &&
    appointment.stripeCardId &&
    appointment.initialPaymentIntend
  ) {
    const refundAmount = paid;
    
    // Prepare customer name
    const customerName = appointment.user 
      ? `${appointment.user.firstName} ${appointment.user.lastName}`
      : `${appointment.clientFirstName || ''} ${appointment.clientLastName || ''}`.trim();
    
    // Prepare metadata for Stripe refund
    const metadata = {
      customerName: customerName,
      salonName: salon?.salonName || 'Unknown Shop',
      salonDetailId: appointment.salonDetailId.toString(),
      bookingId: bookingId.toString(),
      case: 'cancel',
      refundAmount: refundAmount.toString(),
      description: `Cancel: Refund of $${(refundAmount / 100).toFixed(2)} for booking #${bookingId}`
    };
    
    const refund = await Stripe.refundFullPayment(
      appointment?.initialPaymentIntend,
      connectAccountId, // ✅ passed here
      metadata // ✅ pass metadata
    );
    if (refund?.id) {
      updatedBooking.finalPayment = 'paid';
      updatedBooking.refundAmount = refundAmount;
      updatedBooking.refundPaymentIntend = refund?.id;
    }
    console.log('---------------> Refund Success', refund);
  }

  updatedBooking.status = 'cancel';
  updatedBooking.total = paid;
  updatedBooking.subTotal = appointment.total;
  updatedBooking.initialPayment = paid;

  await booking.update(updatedBooking, { where: { id: bookingId } });

  await jobs.update({ status: 'cancel' }, { where: { bookingId } });

  const actorReasonType =
    req.user?.userTypeId === 3
      ? 'appointment_employee_cancellation'
      : 'appointment_salon_owner_cancellation';

  // The booking is already cancelled at this point, so a missing or unknown
  // reason must not turn the call into an error: record what we have.
  const Reason = reasonId
    ? await reason.findOne({
        where: { id: reasonId, status: true, type: actorReasonType },
        attributes: ['id', 'reason', 'type'],
      })
    : null;

  await cancelledBooking.create({
    reasonText: reasonText ?? Reason?.reason ?? '',
    bookingId,
    userId,
    reasonId: Reason?.id ?? null,
  });

  cancelBySalon(bookingId);
  socketForCalendar({
    appointmentId: bookingId,
    type: 'finish',
    status: 'cancel',
  });

  return res.json(
    returnFunction('1', 'Booking cancelled successfully!', {}, '')
  );
};

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
  return res.json(returnFunction('1', 'Shop services', { allServices }, ''))
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
  return res.json(returnFunction('1', 'Shop services', { Services }, ''))
}
/*
              4.Find Employees That provides all selected services
      ________________________________________
  */
exports.employeesWithAllServices = async (req, res, next) => {
  const userId = req.user.id
  const SalonDetail = await salonDetail.findOne({
    where: { id: await actingSalonId(req) },
  })
  const { services } = req.body
  console.log('ðŸš€ ~ exports.employeesWithAllServices= ~ services:', services)
  const employeesWithServices = await employeeService.findAll({
    where: {
      salonDetailId: SalonDetail.id,
      status: true,
      serviceId: {
        [Op.in]: services,
      },
    },
    attributes: ['employeeId'],
    include: {
      model: employee,
      where: { deleted: false, status: true, isExternalEmployee: false },
    },
    group: ['employeeId'],
    having: literal(`COUNT(DISTINCT serviceId) = ${services.length}`),
  })
  const employeeIds =
    employeesWithServices.length > 0
      ? employeesWithServices.map(
        (employeeService) => employeeService.employeeId,
      )
      : null
  console.log('ðŸš€~employees:', employeesWithServices)
  console.log(employeeIds)
  if (!employeeIds) {
    return res.status(200).json({
      status: '2',
      message: 'No employees available',
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
          deleted: false,
          status: true,
          isExternalEmployee: false,
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
    returnFunction('1', 'Shop employees', { employees: result }, ''),
  )
}
/*
              4.Check Employees availability
      ________________________________________
  */
exports.employeeAvailability = async (req, res, next) => {
  const { jobDate, duration, employeeId } = req.body

  const salon = await salonDetail.findOne({
    where: { id: await actingSalonId(req) },
    attributes: ['id'],
  })

  console.log(' ðŸš€req.body ', req.body)
  var date = new Date(jobDate)
  console.log('ðŸš€date ONLY', date)
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
  console.log('ðŸš€date Day', dateDay)
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

  const employeeBreaks = await breakTime.findAll({
    where: {
      employeeId,
      day: dateDay,
      status: true,
      deletedAt: null,
    },
  })

  for (const br of employeeBreaks) {
    busyTimes.push({
      startTime: br.breakStart,
      endTime: br.breakEnd,
    })
  }

  // Travel time around this barber's home visits that day.
  if (employeeId > 0) {
    const travel = await mobileBarber.travelBlocks([employeeId], jobDate)
    busyTimes.push(...(travel.get(Number(employeeId)) || []))
  }

  console.log('TIMES BUSY', JSON.parse(JSON.stringify(busyTimes)))

  const closingTime =
    employeeTiming.status == true && employeeTiming.closingTime == '00:00:00'
      ? '24:00:00'
      : employeeTiming.closingTime

  console.log('ðŸš€ ~ exports.employeeAvailability= ~ closingTime:', closingTime)

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
  const result = await booking.findOne({
    where: { id: extraServices[0].bookingId },
    include: [
      { model: user, attributes: ['firstName', 'lastName', 'email', 'image'] },
    ],
  })

  if (
    result.status == 'complete' ||
    result.status == 'cancel' ||
    result.status == 'no-show'
  ) {
    let message =
      'You cannot add service because the booking has already been completed.'
    if (result.status == 'cancel') {
      message =
        'You cannot add service because the booking is marked as canceled'
    } else if (result.status == 'no-show') {
      message =
        'You cannot add service because the booking is marked as no-show'
    }
    throw new appError(message, 200)
  }
  const bookingData = JSON.parse(JSON.stringify(result))
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

      bookingData.total = parseFloat(bookingData.total) + parseFloat(ele.total)

      await booking.increment(
        { total: ele.total, subTotal: ele.total, duration: ele.duration },
        { where: { id: ele.bookingId } },
      )

      return job.id
    }),
  )

  console.log('ðŸš€ ~ exports.addExtraService= ~ newServiceIds:', newServiceIds)
  console.log(
    'ðŸš€ ~ exports.addExtraService= ~ newServiceIds:',
    bookingData.total,
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

  const allJobs = await jobs.findAll({
    where: { bookingId: bookingData?.id },
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
  })

  allJobs.map((ele) => {
    if (ele.employeeId === null) {
      assigned = false
    }
    if (ele.employee && ele.employee.user) {
      specialists.push(ele.employee?.user?.firstName) // Add specialist name to the set
    }
    servicesNames.push(ele.service?.serviceName)

    const isNew = newServiceIds.find((u) => u == ele.id)
    console.log('ðŸš€ ~ exports.addExtraService= ~ isNew:', isNew)

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
    total: `${bookingData.total}`,
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
    data: { type: 'add', job: newJobs, total: `${bookingData.total}` },
    bookingId: bookingData.id,
  }
  sendEvent(`${bookingData.salonDetailId}S`, socketInputService)
  const workers = await employeeForSocket(bookingData.salonDetailId)
  workers.forEach((el) => sendEvent(`${el}E`, socketInputService))

  socketForCalendar({ appointmentId: bookingData?.id, type: 'new' })

  return res.json(
    returnFunction('1', 'Extra service added successfully!', {}, ''),
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
      id: await actingSalonId(req),
    },
  })


  const customerAttributes = [
    'id',
    'firstName',
    'lastName',
    'email',
    'countryCode',
    'phoneNum',
    'image',
  ]

  // 1. Customers derived from bookings (historical behavior).
  const bookingCustomers = await booking.findAll({
    where: {
      salonDetailId: SalonDetail.id,
      customerId: { [Op.ne]: null },
    },
    include: [
      {
        model: user,
        attributes: customerAttributes,
      },
    ],
    attributes: ['customerId'],
    group: ['customerId'], // Group by customerId to ensure uniqueness
  })

  // 2. Clients linked directly to the salon (CSV import / manual add) — these may
  //    have no booking yet, so they would otherwise never show in the list.
  const importedClients = await salonClient.findAll({
    where: { salonDetailId: SalonDetail.id },
    include: [
      {
        model: user,
        as: 'customer',
        attributes: customerAttributes,
      },
    ],
    attributes: ['customerId'],
  })

  // Merge + dedupe by customerId, keeping the booking-shaped payload the app expects
  // (each row exposes `customerId` and a nested `user`).
  const byCustomerId = new Map()
  for (const row of bookingCustomers) {
    if (row.customerId == null) continue
    byCustomerId.set(row.customerId, { customerId: row.customerId, user: row.user })
  }
  for (const row of importedClients) {
    if (row.customerId == null || byCustomerId.has(row.customerId)) continue
    byCustomerId.set(row.customerId, { customerId: row.customerId, user: row.customer })
  }

  const salonCustomers = Array.from(byCustomerId.values())

  return res.json(
    returnFunction('1', 'Customer added successfully!', { salonCustomers }, ''),
  )
}
/*
              Bulk import clients (e.g. from a Fresha CSV export)
      ________________________________________
  Creates/links each client to the salon so they appear in the Client List,
  and (when notify=true) emails an announcement to clients who are NOT already
  registered Trim users.
*/
exports.bulkImportClients = async (req, res, next) => {
  const userId = req.user.id
  const notify = req.body.notify === true || req.body.notify === 'true'
  const rawClients = Array.isArray(req.body.clients) ? req.body.clients : []

  const SalonDetail = await salonDetail.findOne({ where: { id: await actingSalonId(req) } })
  if (!SalonDetail) {
    return res.json(returnFunction('0', 'Salon not found.', {}, ''))
  }

  // Registered Trim users (should NOT receive the announcement email).
  const registeredSignedFrom = ['email', 'google', 'apple', 'facebook']
  const isRegisteredTrimUser = (u) =>
    !!u &&
    (registeredSignedFrom.includes(u.signedFrom) ||
      (u.password && `${u.password}`.trim() !== '') ||
      u.verifiedAt != null)

  let added = 0
  let alreadyOnTrim = 0
  let skippedNoEmail = 0
  let notesAdded = 0
  let allergiesAdded = 0
  const emailTargets = [] // { email, firstName } for not-on-Trim clients

  for (const row of rawClients) {
    const email = (row.email || '').trim()
    const firstName = (row.firstName || '').trim()
    const lastName = (row.lastName || '').trim()
    const phoneNum = (row.phoneNum || '').trim()
    const countryCode = (row.countryCode || '').trim()
    const note = (row.note || '').trim()
    const allergyText = (row.allergies || '').trim()

    // Rows without an email can't be deduped or emailed, and can't be persisted
    // meaningfully (mirrors addWalkinCustomer) — skip and report the count.
    if (!email) {
      skippedNoEmail += 1
      continue
    }

    let customer = await user.findOne({
      where: { email, deletedAt: { [Op.is]: null } },
    })

    const registered = isRegisteredTrimUser(customer)
    if (registered) alreadyOnTrim += 1

    // Create the user if they don't exist yet (walk-in style, unregistered).
    if (!customer) {
      const fullName = `${firstName || 'Walkin'} ${lastName || 'Customer'}`
      const stripeCustomerId = await Stripe.addCustomer(fullName, email)
      customer = await user.create({
        email,
        countryCode: phoneNum ? countryCode : '',
        phoneNum: phoneNum || '',
        signedFrom: 'walkin',
        firstName: firstName || 'Walkin',
        lastName: lastName || 'Customer',
        stripeCustomerId,
        userTypeId: 1,
      })
    }

    // Link the client to this salon (idempotent via unique index).
    const [, created] = await salonClient.findOrCreate({
      where: { salonDetailId: SalonDetail.id, customerId: customer.id },
      defaults: {
        salonDetailId: SalonDetail.id,
        customerId: customer.id,
        source: 'import',
      },
    })
    if (created) added += 1

    // Optional: client note (upsert per salon+customer — mirrors addUpdateClientNote).
    if (note) {
      try {
        const existingNote = await clientNotes.findOne({
          where: { userId: customer.id, salonDetailId: SalonDetail.id },
        })
        if (existingNote) {
          await clientNotes.update(
            { customerNote: note },
            { where: { userId: customer.id, salonDetailId: SalonDetail.id } },
          )
        } else {
          await clientNotes.create({
            customerNote: note,
            userId: customer.id,
            salonDetailId: SalonDetail.id,
          })
        }
        notesAdded += 1
      } catch (e) {
        console.error('[importClients] note failed for', email, e.message)
      }
    }

    // Optional: allergies (one row per entry; split on newlines/semicolons).
    if (allergyText) {
      const entries = allergyText
        .split(/[\n;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
      for (const name of entries) {
        try {
          const existingAllergy = await allergies.findOne({
            where: { userId: customer.id, salonDetailId: SalonDetail.id, name },
          })
          if (!existingAllergy) {
            await allergies.create({
              name,
              allergyType: 'Non-drug',
              severity: 'Unknown',
              reaction: '',
              note: '',
              userId: customer.id,
              salonDetailId: SalonDetail.id,
            })
            allergiesAdded += 1
          }
        } catch (e) {
          console.error('[importClients] allergy failed for', email, e.message)
        }
      }
    }

    // Email only the clients who are not already on Trim.
    if (!registered) {
      emailTargets.push({ email, firstName: firstName || customer.firstName })
    }
  }

  let emailed = 0
  if (notify && emailTargets.length) {
    const { default: pLimit } = await import('p-limit')
    const limit = pLimit(10)
    const ClientInviteEmail = require('../../helper/ClientInviteEmail')

    const jobs = emailTargets.map((t) =>
      limit(async () => {
        await ClientInviteEmail({
          email: t.email,
          firstName: t.firstName,
          salonName: SalonDetail.salonName,
        })
        return true
      }),
    )
    const results = await Promise.allSettled(jobs)
    emailed = results.filter((r) => r.status === 'fulfilled').length
  }

  return res.json(
    returnFunction(
      '1',
      'Clients imported successfully.',
      {
        total: rawClients.length,
        added,
        alreadyOnTrim,
        emailed,
        skippedNoEmail,
        notesAdded,
        allergiesAdded,
      },
      '',
    ),
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
      id: await actingSalonId(req),
    },
  })

  let userExist = await user.findOne({
    where: {
      email: email,
      // [Op.or]: [
      //   { email: email },
      //   // { [Op.and]: [{ countryCode: countryCode }, { phonenum: phoneNum }] },
      // ],
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
    message = `New customer added to the shop.`
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
      id: await actingSalonId(req),
    },
  })
  startTime = Convert.convertTo24HourFormat(startTime)
  endTime = Convert.convertTo24HourFormat(endTime)

  console.log('ÃƒÂ°Ã…Â¸Ã…Â¡Ã¢â€šÂ¬ ~ exports.addWalkinBooking= ~ jobsData:', jobsData)
  const assignTimeSlots = Custom.scheduleSessions(
    { startTime, endTime, on: jobDate, duration },
    jobsData,
  )
  console.log(
    'ÃƒÂ°Ã…Â¸Ã…Â¡Ã¢â€šÂ¬ ~ exports.addWalkinBooking= ~ assignTimeSlots:',
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
    'ÃƒÂ°Ã…Â¸Ã…Â¡Ã¢â€šÂ¬ ~ exports.addWalkinBooking= ~ assiginEmployee:',
    // ,assiginEmployee
  )
  let appointmentStatus = 'book'
  const findUnAssign = assiginEmployee.find((el) => el.status === 'pending')
  if (findUnAssign) {
    console.log('ÃƒÂ°Ã…Â¸Ã…Â¡Ã¢â€šÂ¬ ~ findUnAssign:', findUnAssign)
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
    'Ã°Å¸Å¡â‚¬ ~ exports.addWalkinBooking= ~ policies:',
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

  const newAppointment = await booking.create({
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
    bookingId: newAppointment.id,
  }))
  console.log('ÃƒÂ°Ã…Â¸Ã…Â¡Ã¢â€šÂ¬ ~ exports.addWalkinBooking= ~ finalInput:', finalInput)
  await jobs.bulkCreate(finalInput)
  walkinAppointmentConfirm(newAppointment, customerId, SalonDetail?.id)
  socketForCalendar({ appointmentId: newAppointment?.id, type: 'new' })

  return res.json(
    returnFunction(
      '1',
      'Walkin Booking Added Successfully!',
      { bookingId: newAppointment.id },
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
    attributes: ['id', 'total', 'loyaltyDiscount', 'employeeId', 'serviceId', 'bookingId'],
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
        attributes: ['id', 'total', 'loyaltyDiscount', 'salonDetailId', 'duration'],
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

    const updatedLoyalty = Math.max(
      parseFloat(jobData.booking.loyaltyDiscount || 0) -
        parseFloat(jobData.loyaltyDiscount || 0),
      0,
    )
    await booking.update(
      {
        total: updatedBookingTotal,
        duration: updatedBookingDuration,
        loyaltyDiscount: updatedLoyalty,
      },
      { where: { id: jobData.bookingId } },
    )
  } else if (status == 'complete') {
    console.log('ðŸš€ ~ Calculation Start :status', status)
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

  socketForCalendarJobOnly({
    appointmentId: jobData?.bookingId,
    jobId: jobData.id,
    type: status,
  })

  return res.json(
    returnFunction('1', 'Job status updated successfully!', {}, ''),
  )
}
/*
              4.Client Booking History
      ________________________________________
  */
exports.clientHistory = async (req, res, next) => {
  console.log(
    '--------------------------------req.userreq.userreq.user',
    req.user,
  )
  const salon = await salonDetail.findOne({
    where: { id: await actingSalonId(req) },
    attributes: ['id'],
  })
  const { customerId } = req.body
  const clientBookings = await booking.findAll({
    where: {
      customerId: customerId,
      salonDetailId: salon?.id,
    },
    include: [
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
    attributes: ['id', 'status', 'on', 'startTime', 'customerId'],
  })

  let customerStatus = 'active'

  const isblocked = await blockCustomer.findOne({
    where: { userId: customerId, salonDetailId: salon?.id },
    attributes: ['id'],
  })
  if (isblocked) customerStatus = 'block'

  const notes = await clientNotes.findOne({
    where: { userId: customerId, salonDetailId: salon?.id },
    attributes: ['customerNote'],
  })
  return res.json(
    returnFunction(
      '1',
      'Client Booking History',
      { clientNote: '', customerStatus, clientBookings },
      '',
    ),
  )
}
exports.completeBookingAfterOnlinePayment = async ({
  bookingId,
  bookingData,
  paymentIntentId,
  serviceAmount,
  salonEarning,
  tipAmount,
  oldTip,
  amount,
  paymentMethod = null,
  skipTipDistribution = false,
}) => {
  const freshBooking = await booking.findByPk(bookingId, {
    attributes: ['id', 'status', 'finalPayment'],
  });

  if (
    freshBooking?.finalPayment === 'paid' ||
    freshBooking?.status === 'complete'
  ) {
    console.log(
      `completeBookingAfterOnlinePayment skipped: booking ${bookingId} already completed (status=${freshBooking?.status}, finalPayment=${freshBooking?.finalPayment})`,
    );
    return { alreadyCompleted: true };
  }

  // Add service amount to onlineAmount
  await wallet.increment(
    { onlineAmount: salonEarning },
    { where: { salonDetailId: bookingData?.salonDetail?.id } }
  );

  // ✅ CRITICAL FIX: Also add tip to onlineAmount so it's included in total wallet balance
  // The payment amount includes tip, so onlineAmount should also include it
  // Add the new tip (tipAmount) to onlineAmount - this ensures it's in the total
  // Note: Old tip was already added to onlineAmount during booking (if it was paid upfront)
  if (tipAmount > 0) {
    await wallet.increment(
      { onlineAmount: tipAmount },
      { where: { salonDetailId: bookingData?.salonDetail?.id } }
    );
    console.log(`✅ Tip added to onlineAmount: tipAmount=${tipAmount} (new tip from checkout)`);
  }

  bookingData.status = 'complete';
  bookingData.finalPaymentIntend = paymentIntentId;
  bookingData.finalPayment = 'paid';
  bookingData.subTotal = bookingData.total;
  if (paymentMethod) {
    bookingData.paymentMethod = paymentMethod;
  }
  await bookingData.save();

  // Increment actualCapturedAmount with service amount only (no tip)
  await booking.increment(
    { actualCapturedAmount: serviceAmount },
    { where: { id: bookingId } }
  );

  // Update tip: old tip + new tip
  await booking.update(
    { tip: oldTip + tipAmount },
    { where: { id: bookingId } }
  );

  Communication.online(bookingId, tipAmount, amount);
  loyalty.onBookingCompleted(bookingId);

  await employeeCommission.update(
    { appointmentClosed: true },
    { where: { bookingId: bookingData.id } }
  );

  await rentChairEarning.update(
    { appointmentClosed: true },
    { where: { bookingId: bookingData.id } }
  );

  // Call distributeTip for job distribution (tip distribution among employees)
  // distributeTip will handle adding tip to tipAmount field
  if (!skipTipDistribution) {
    try {
      const originalTip = bookingData.tip;
      bookingData.tip = parseFloat(oldTip) + parseFloat(tipAmount);
      distributeTip(bookingData, 0);
      bookingData.tip = originalTip;
    } catch (error) {
      console.error('Error in distributeTip (non-critical):', error);
    }
  }

  return { alreadyCompleted: false };
};

/*
              4.Finalize Tap to Pay
      ________________________________________
*/
exports.finalizeTapToPay = async (req, res, next) => {
  const { bookingId, paymentIntentId } = req.body;

  if (bookingId == null || bookingId === '') {
    return res.status(400).json(
      returnFunction('0', 'bookingId is required', {}, 'bookingId is required'),
    );
  }

  if (!paymentIntentId || typeof paymentIntentId !== 'string') {
    return res.status(400).json(
      returnFunction(
        '0',
        'paymentIntentId is required',
        {},
        'paymentIntentId is required',
      ),
    );
  }

  const salon = await salonDetail.findOne({
    where: { id: await actingSalonId(req) },
    attributes: ['id', 'connectAccountId'],
  });

  if (!salon) {
    return res.status(404).json(
      returnFunction('0', 'Shop not found', {}, 'Shop not found'),
    );
  }

  const freshBooking = await booking.findByPk(bookingId, {
    attributes: ['id', 'status', 'finalPayment', 'finalPaymentIntend'],
  });

  if (!freshBooking) {
    return res.status(404).json(
      returnFunction('0', 'Booking not found', {}, 'Booking not found'),
    );
  }

  if (
    freshBooking.finalPayment === 'paid' ||
    freshBooking.status === 'complete'
  ) {
    console.log(
      `finalizeTapToPay skipped: booking ${bookingId} already completed (status=${freshBooking.status}, finalPayment=${freshBooking.finalPayment})`,
    );
    return res.json({
      status: true,
      message: 'Tap to Pay payment finalized successfully',
      data: {
        bookingId: Number(bookingId),
        paymentIntentId: freshBooking.finalPaymentIntend || paymentIntentId,
        amountReceived: null,
        currency: 'gbp',
        alreadyCompleted: true,
      },
    });
  }

  if (
    freshBooking.status === 'cancel' ||
    freshBooking.status === 'no-show'
  ) {
    return res.status(409).json(
      returnFunction(
        '0',
        `Cannot finalize payment for booking with status ${freshBooking.status}`,
        {},
        'Invalid booking status',
      ),
    );
  }

  const bookingData = await booking.findByPk(bookingId, {
    include: [
      {
        model: salonDetail,
        attributes: ['id', 'connectAccountId', 'salonName'],
      },
      { model: jobs },
    ],
    attributes: [
      'id',
      'status',
      'total',
      'discount',
      'tip',
      'actualCapturedAmount',
      'salonDetailId',
      'finalPayment',
      'finalPaymentIntend',
    ],
  });

  if (!bookingData || bookingData.salonDetailId !== salon.id) {
    return res.status(404).json(
      returnFunction('0', 'Booking not found', {}, 'Booking not found'),
    );
  }

  const connectAccountId =
    bookingData.salonDetail?.connectAccountId || salon.connectAccountId;

  if (!connectAccountId) {
    console.error(
      `finalizeTapToPay failed: no connectAccountId for booking ${bookingId}, salon ${salon.id}`,
    );
    return res.status(400).json(
      returnFunction(
        '0',
        'Shop payment onboarding is incomplete. Stripe Connect account not found.',
        {},
        'Connect account not found',
      ),
    );
  }

  let paymentIntent;
  try {
    paymentIntent = await Stripe.retrieveConnectPaymentIntent(
      paymentIntentId,
      connectAccountId,
    );
  } catch (error) {
    console.error(
      `finalizeTapToPay Stripe retrieve failed for booking ${bookingId}, PI ${paymentIntentId}:`,
      error.message,
    );
    return res.status(400).json(
      returnFunction('0', error.message, {}, error.message),
    );
  }

  if (paymentIntent.status !== 'succeeded') {
    console.error(
      `finalizeTapToPay failed: PI ${paymentIntentId} status=${paymentIntent.status} for booking ${bookingId}`,
    );
    return res.status(400).json(
      returnFunction(
        '0',
        `PaymentIntent status must be succeeded (current: ${paymentIntent.status})`,
        {},
        'Payment not succeeded',
      ),
    );
  }

  if (paymentIntent.currency !== 'gbp') {
    return res.status(400).json(
      returnFunction(
        '0',
        `PaymentIntent currency must be gbp (current: ${paymentIntent.currency})`,
        {},
        'Invalid currency',
      ),
    );
  }

  if (String(paymentIntent.metadata?.bookingId) !== String(bookingId)) {
    console.error(
      `finalizeTapToPay metadata mismatch: expected bookingId ${bookingId}, got ${paymentIntent.metadata?.bookingId}`,
    );
    return res.status(400).json(
      returnFunction(
        '0',
        'PaymentIntent bookingId metadata does not match request',
        {},
        'Metadata mismatch',
      ),
    );
  }

  if (paymentIntent.metadata?.payment_Type !== 'tap_to_pay') {
    return res.status(400).json(
      returnFunction(
        '0',
        'PaymentIntent is not a Tap to Pay charge',
        {},
        'Invalid payment type',
      ),
    );
  }

  if (
    paymentIntent.metadata?.salonDetailId != null &&
    String(paymentIntent.metadata.salonDetailId) !== String(bookingData.salonDetailId)
  ) {
    return res.status(400).json(
      returnFunction(
        '0',
        'PaymentIntent salonDetailId metadata does not match booking',
        {},
        'Metadata mismatch',
      ),
    );
  }

  const amountReceivedMinor =
    paymentIntent.amount_received != null
      ? paymentIntent.amount_received
      : paymentIntent.amount;

  const fallbackServiceMinor = resolveTapToPayServiceAmountMinorUnits(bookingData);
  const serviceAmountMinor = parseMetadataMinorUnits(
    paymentIntent.metadata?.serviceAmountMinor,
    fallbackServiceMinor,
  );
  const tipAmountMinor = parseMetadataMinorUnits(
    paymentIntent.metadata?.tipAmountMinor,
    0,
  );
  const expectedMinor = parseMetadataMinorUnits(
    paymentIntent.metadata?.expectedAmountMinor,
    serviceAmountMinor + tipAmountMinor,
  );

  if (expectedMinor <= 0) {
    return res.status(400).json(
      returnFunction(
        '0',
        'Booking has no remaining balance to finalize',
        {},
        'Invalid expected amount',
      ),
    );
  }

  if (amountReceivedMinor !== expectedMinor) {
    console.error(
      `finalizeTapToPay amount mismatch for booking ${bookingId}: Stripe=${amountReceivedMinor} expected=${expectedMinor} (service=${serviceAmountMinor}, tip=${tipAmountMinor})`,
    );
    return res.status(400).json(
      returnFunction(
        '0',
        `Payment amount does not match booking total (received ${amountReceivedMinor} pence, expected ${expectedMinor} pence)`,
        {},
        'Amount mismatch',
      ),
    );
  }

  const serviceAmount = serviceAmountMinor / 100;
  const tipAmount = tipAmountMinor / 100;
  const oldTip = parseFloat(bookingData.tip) || 0;
  const amount = serviceAmount + tipAmount;
  const salonEarning =
    serviceAmount + parseFloat(bookingData.actualCapturedAmount || 0);

  const completion = await exports.completeBookingAfterOnlinePayment({
    bookingId,
    bookingData,
    paymentIntentId,
    serviceAmount,
    salonEarning,
    tipAmount,
    oldTip,
    amount,
    paymentMethod: 'tap_to_pay',
    skipTipDistribution: false,
  });

  return res.json({
    status: true,
    message: 'Tap to Pay payment finalized successfully',
    data: {
      bookingId: Number(bookingId),
      paymentIntentId,
      amountReceived: amountReceivedMinor,
      serviceAmount,
      tipAmount,
      currency: 'gbp',
      alreadyCompleted: completion.alreadyCompleted,
    },
  });
};

/*
              4.CheckOut Api
      ________________________________________
*/
exports.checkOutBooking = async (req, res, next) => {
  const { bookingId, tip } = req.body;

  const jobData = await jobs.findOne({
    where: { bookingId, status: { [Op.or]: ['pending', 'assign'] } },
  });

  if (jobData) {
    return res.json(
      returnFunction('2', 'The booking has unfinished services.', {}, '')
    );
  }

  let bookingData = await booking.findByPk(bookingId, {
    include: [
      {
        model: salonDetail,
        attributes: ['id', 'connectAccountId', 'salonName'],
      },
      {
        model: user,
        attributes: ['id', 'firstName', 'lastName'], // ✅ include customer name
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
      'customerId',
      'clientFirstName',
      'clientLastName',
    ],
  });

  if (
    bookingData.status === 'cancel' ||
    bookingData.status === 'no-show' ||
    bookingData.status === 'complete'
  ) {
    const statusMessages = {
      cancel: 'You cannot check out because the booking is marked as Canceled',
      'no-show': 'You cannot check out because the booking is marked as No-Show',
      complete: 'You cannot check out because the booking has already been Completed.',
    };
    return res.json(returnFunction('2', statusMessages[bookingData.status], {}, ''));
  }

  // ✅ Get Connect Account ID
  const accountId = bookingData.salonDetail.connectAccountId;

  // ✅ Lookup correct customer ID for this user + connect account
  const customerConnect = await customerOnConnectAccount.findOne({
    where: {
      userId: bookingData.user.id,
      salonDetailId: bookingData.salonDetailId,
      connectAccountId: accountId,
    },
  });

  if (!customerConnect || !customerConnect.customerId) {
    return res.json(
      returnFunction('0', 'No Stripe customer found for this connected account.', {}, '')
    );
  }

  const customerId = customerConnect.customerId;

  // ✅ FIX: Calculate service amount by subtracting tip from req.body.amount
  // Since total includes tip, req.body.amount also includes tip
  const tipAmount = parseFloat(tip) || 0;
  const oldTip = parseFloat(bookingData.tip) || 0;
  
  // Calculate service amount: req.body.amount includes old tip (if any), so subtract both old and new tip
  // req.body.amount = total remaining = (total - actualCapturedAmount) which includes tip
  const serviceAmount = parseFloat(req.body.amount) - tipAmount - oldTip;
  
  // Calculate payment amount for Stripe: service amount + new tip
  let amount = serviceAmount + tipAmount;
  const targetAmount = req.body.targetAmount;
  
  // ✅ CRITICAL FIX: salonEarning should ONLY include service amount, NEVER tip
  // Tip goes to tipAmount field via distributeTip function
  const salonEarning = serviceAmount + parseFloat(bookingData.actualCapturedAmount);

  // Prepare customer name
  const customerName = bookingData.user 
    ? `${bookingData.user.firstName} ${bookingData.user.lastName}`
    : `${bookingData.clientFirstName || ''} ${bookingData.clientLastName || ''}`.trim();

  // Prepare metadata for Stripe payment capture
  const metadata = {
    customerName: customerName,
    salonName: bookingData.salonDetail?.salonName || 'Unknown Shop',
    salonDetailId: bookingData.salonDetailId.toString(),
    bookingId: bookingId.toString(),
    case: 'complete',
    paymentAmount: amount.toString(),
    description: `Complete: Payment of $${(amount / 100).toFixed(2)} for booking #${bookingId}`
  };

  const payments = await Stripe.capturePayment(
    amount,
    customerId,
    bookingData.stripeCardId,
    accountId,
    targetAmount,
    metadata // ✅ pass metadata
  );

  if (payments.status === 'succeeded') {
    await exports.completeBookingAfterOnlinePayment({
      bookingId,
      bookingData,
      paymentIntentId: payments.id,
      serviceAmount,
      salonEarning,
      tipAmount,
      oldTip,
      amount,
    });

    return res.json(
      returnFunction('1', 'Payment processed successfully.', {}, '')
    );
  } else {
    return res.json(
      returnFunction('0', 'Payment processing unsuccessful.', {}, '')
    );
  }
};

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
      returnFunction('2', 'The booking has unfinished services.', {}, ''),
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
      'You cannot check out because the booking has already been Completed.'
    if (bookingData.status == 'cancel') {
      message =
        'You cannot check out because the booking is marked as Canceled.'
    } else if (bookingData.status == 'no-show') {
      message =
        'You cannot check out because the booking is marked as No-Show.'
    }
    return res.json(returnFunction('2', message, {}, ''))
  }
  // return res.json(bookingData)
  const salonEarning =
    parseFloat(req.body.amount) + parseFloat(bookingData.actualCapturedAmount)
  //Amount to be captured
  const amount = parseFloat(req.body.amount) + tip

  await wallet.increment(
    { cashAmount: salonEarning },
    { where: { salonDetailId: bookingData.salonDetailId } },
  )

  bookingData.status = 'complete'
  bookingData.paymentMethod = 'cash'
  bookingData.finalPayment = 'paid'
  bookingData.subTotal = bookingData.total

  await bookingData.save()
  const capturedPayment = parseFloat(req.body.amount)
  await booking.increment(
    { actualCapturedAmount: capturedPayment },
    { where: { id: bookingId } },
  )
  
  // Fixed: Use update instead of increment for tip to avoid doubling
  await booking.update(
    { tip: (bookingData.tip || 0) + (tip || 0) },
    { where: { id: bookingId } }
  )
  //EMAIL --//TODO
  Communication.cash(bookingId, tip || 0, amount)
  loyalty.onBookingCompleted(bookingId)
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

  return res.json(returnFunction('1', 'Cash payment successfully done', {}, ''))
}

/*
              4.CheckOut Minimal Payment (No Stripe)
      ________________________________________
  */
exports.checkOutMinimalPayment = async (req, res, next) => {
  const { bookingId, tip } = req.body;

  // Check for unfinished services
  const jobData = await jobs.findOne({
    where: { bookingId, status: { [Op.or]: ['pending', 'assign'] } },
  });

  if (jobData) {
    return res.json(
      returnFunction('2', 'The booking has unfinished services.', {}, '')
    );
  }

  // Get booking data with all necessary relations
  let bookingData = await booking.findByPk(bookingId, {
    include: [
      {
        model: salonDetail,
        attributes: ['id', 'salonName'],
      },
      {
        model: user,
        attributes: ['id', 'firstName', 'lastName'],
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
      'actualCapturedAmount',
      'salonDetailId',
      'customerId',
      'clientFirstName',
      'clientLastName',
    ],
  });

  // Check booking status
  if (
    bookingData.status === 'cancel' ||
    bookingData.status === 'no-show' ||
    bookingData.status === 'complete'
  ) {
    const statusMessages = {
      cancel: 'You cannot check out because the booking is marked as Canceled',
      'no-show': 'You cannot check out because the booking is marked as No-Show',
      complete: 'You cannot check out because the booking has already been Completed.',
    };
    return res.json(returnFunction('2', statusMessages[bookingData.status], {}, ''));
  }

  // Calculate amounts
  const amount = parseFloat(req.body.amount) || 0;
  const tipAmount = parseFloat(tip) || 0;
  const salonEarning = amount + parseFloat(bookingData.actualCapturedAmount);

  try {
    // Update salon wallet (even if amount is 0, we still track it)
    await wallet.increment(
      { onlineAmount: salonEarning },
      { where: { salonDetailId: bookingData.salonDetailId } }
    );

    // Update booking status and payment info
    bookingData.status = 'complete';
    bookingData.finalPayment = 'paid';
    bookingData.paymentMethod = 'card'; // New payment method for tracking
    bookingData.subTotal = bookingData.total;
    await bookingData.save();

    // Update actual captured amount and tip
    await booking.increment(
      { actualCapturedAmount: amount },
      { where: { id: bookingId } }
    );
    
    // Fixed: Use update instead of increment for tip to avoid doubling
    await booking.update(
      { tip: (bookingData.tip || 0) + tipAmount },
      { where: { id: bookingId } }
    );

    // Send communication (email and notifications)
    Communication.online(bookingId, tipAmount, amount);
    loyalty.onBookingCompleted(bookingId);

    // Update employee commission records
    await employeeCommission.update(
      { appointmentClosed: true },
      { where: { bookingId: bookingData.id } }
    );

    // Update rent chair earning records
    await rentChairEarning.update(
      { appointmentClosed: true },
      { where: { bookingId: bookingData.id } }
    );

    // Distribute tips if any
    await distributeTip(bookingData, tipAmount);

    return res.json(
      returnFunction('1', 'Booking completed successfully with minimal payment.', {}, '')
    );

  } catch (error) {
    console.error('Error in checkOutMinimalPayment:', error);
    return res.json(
      returnFunction('0', 'Failed to complete booking. Please try again.', {}, '')
    );
  }
};

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
      returnFunction('2', 'The booking has unfinished services.', {}, ''),
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
      'You cannot check out because the booking has already been Completed.'
    if (bookingData.status == 'cancel') {
      message =
        'You cannot check out because the booking is marked as Canceled.'
    } else if (bookingData.status == 'no-show') {
      message =
      'You cannot check out because the booking is marked as No-Show.'
    }
    return res.json(returnFunction('2', message, {}, ''))
  }

  bookingData.status = 'save-unpaid'
  bookingData.subTotal = bookingData.total

  await bookingData.save(bookingData)
  Communication.saveUnpaid(bookingData)
  return res.json(returnFunction('1', 'Booking saved unpaid', {}, ''))
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
  return res.json(returnFunction('1', 'Client removed successfully!', {}, ''))
}
//* 4.Reschedule Solo Employee Appointment -----------------

exports.rescheduleSoloEmployeeAppointment = async (req, res, next) => {
  const { bookingId, appointment, services, employeeId } = req.body
  appointment.startTime = dateManipulation.convertTo24HourFormat(
    appointment.startTime,
  )
  console.log('ðŸš€ ~ AFTER START-TIME', appointment.startTime)

  appointment.endTime = dateManipulation.convertTo24HourFormat(
    appointment.endTime,
  )
  const appointmentDate = new Date(appointment.on)
  const appointmentDay = dateManipulation.dayOnDate(appointmentDate)

  // Home visit: keeps travel time around it (the barber stays the same here).
  await mobileBarber.checkVisitMove({
    bookingId,
    on: appointment.on,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
  })

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
          message: 'This time is already booked by another customer',
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
  socketForCalendar({ appointmentId: bookingId, type: 'reschedule' })

  return res.json(
    returnFunction('1', 'Booking reschedule successfully!', {}, ''),
  )
}

//* 5.Reschedule Multiple Employee Appointment -----------------

exports.rescheduleMultipleEmployeeAppointment = async (req, res, next) => {
  const { appointment, services, bookingId,userId } = req.body
  console.log(
    'ðŸš€ ~ exports.rescheduleMultipleEmployeeAppointment= ~ req.body:',
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
        isExternalEmployee: false,
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

  console.log('ðŸš€~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€  services:', services)
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
  console.log('ðŸš€ ~ servicesinput ~ servicesinput:', servicesinput)
  const assignTimeSlots = Custom.scheduleSessions(appointment, servicesinput)
  // console.log("ðŸš€ ~ assignTimeSlots:", assignTimeSlots);

  // Home visit: every service stays with the one barber who travels.
  const visitMove = await mobileBarber.checkVisitMove({
    bookingId,
    employeeId: req.body?.employeeId,
    on: appointment.on,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
  })
  JobsInput = visitMove
    ? assignTimeSlots.map((slot) => ({ ...slot, employeeId: visitMove.employeeId, status: 'assign' }))
    : Custom.assignEmployeesToServices(employeeData, assignTimeSlots)
  appointment.status = 'book'
  const findUnAssign = JobsInput.find((el) => el.status === 'pending')
  if (findUnAssign) {
    appointment.status = 'pending'
  }
  const jobIds = services.map((obj) => obj.id)
  console.log(
    'ðŸš€ ~ exports.rescheduleMultipleEmployeeAppointment= ~ jobIds:',
    jobIds,
  )
  let sessions = await jobs.findAll({ where: { id: jobIds } })

  // Update each job's times
  console.log('ðŸš€ ~ JobsInput.forEach ~ JobsInput:', JobsInput)
  JobsInput.forEach((newJobData) => {
    // Find the corresponding job in sessions array by ID
    // console.log("ðŸš€ ~ exports.rescheduleMultipleEmployeeAppointment= ~ newJobData:", newJobData)

    const jobToUpdate = sessions.find((job) => job.id === newJobData.id)
    // console.log("ðŸš€ ~ exports.rescheduleMultipleEmployeeAppointment= ~ jobToUpdate:", jobToUpdate)
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
  if(appointment.isCouponApplied===false){
    await couponOnBooking.update(
      {
        isCouponUsed: false,
      },
      { where: { bookingId: bookingId, userId: userId } },
    )

    await booking.update({
      total: await mobileBarber.totalWithTravelFee(bookingId, appointment.total),
      discount:0,
      vatAmount:appointment.vatOriginalAmount,
    },
    { where: { id: bookingId } })
  }
  fromSalonMultipleEmployees(bookingId)
  socketForCalendar({ appointmentId: bookingId, type: 'reschedule' })
  return res.json(
    returnFunction('1', 'Booking reschedule successfully!', {}, ''),
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
    returnFunction('1', 'Available timeslots', { availableTimeSlots }, ''),
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
        where: { id: await actingSalonId(req) },
        attributes: [],
      },
    ],
    attributes: ['id', 'serviceName', 'duration'],
  })
  return res.json(
    returnFunction('1', 'All shop services', { salonServices }, ''),
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
      isExternalEmployee: false,
      // Add your conditions here
      salonDetailId: await actingSalonId(req), // the acting branch (Step A)
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
  // console.log('ðŸš€ ~ exports.serviceData= ~ updatedEmployees:', updatedEmployees)

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
    'ðŸš€ ~ exports.serviceData= ~ serviceData.jobData.total:',
    jobData.total,
  )
  console.log(
    'ðŸš€ ~ exports.serviceData= ~ serviceData.jobData.extraDiscount:',
    jobData.extraDiscount,
  )
  console.log(
    'ðŸš€ ~ exports.serviceData= ~ serviceData.parseFloat(jobData.total)+parseFloat(jobData.serviceDiscount):',
    parseFloat(jobData.total) + parseFloat(jobData.serviceDiscount),
  )
  if (jobData && jobData.serviceId == serviceId) {
    const total =
      parseFloat(jobData.total) +
      parseFloat(jobData.serviceDiscount) +
      parseFloat(jobData.extraDiscount) +
      parseFloat(jobData.loyaltyDiscount || 0)
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
    returnFunction('1', 'Service data!', { serviceData, teamMembers }, ''),
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

  console.log('Ã°Å¸Å¡â‚¬ ~ exports.editService= ~ req.body:', req.body)

  let jobStatus = 'pending'
  let bookingStatus = 'pending'
  if (!employeeId && employeeId < 1) employeeId = null

  if (employeeId) jobStatus = 'assign'

  startTime = dateManipulation.convertTo24HourFormat(startTime)
  console.log(
    'Ã°Å¸Å¡â‚¬ ~~~~~~~~~~~~~~~~~~~~ exports.editService= ~ startTime:',
    startTime,
  )

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

  console.log(
    'Ã°Å¸Å¡â‚¬ ~~~~~~~~~~~~~~~~~~~~ exports.editService= ~ endTime:',
    endTime,
  )

  const jobData = await jobs.findOne({
    where: { id: jobId },
    include: { model: booking },
  })
  //!TODO skipped booking End Time .. because its Not required on frontend on any app (IMP .. check if it required in reports)

  // A booking that used the loyalty reward keeps it on the edited line
  // (none if the new service is excluded from the offer).
  const lineLoyalty = await loyalty.lineDiscount(jobData.booking, serviceId, price)
  const lineTotal = Math.max(parseFloat(price) - lineLoyalty, 0)
  const bookingLoyalty = Math.max(
    parseFloat(jobData.booking.loyaltyDiscount || 0) -
      parseFloat(jobData.loyaltyDiscount || 0) +
      lineLoyalty,
    0,
  )

  let updatedBookingTotal =
    parseFloat(jobData.booking.total) - parseFloat(jobData.total)

  updatedBookingTotal = updatedBookingTotal + lineTotal

  let updatedBookingDuration =
    parseInt(jobData.booking.duration) - parseInt(jobData.duration)

  updatedBookingDuration = updatedBookingDuration + parseInt(duration)

  await jobs.update(
    {
      status: jobStatus,
      employeeId,
      serviceId,
      startTime,
      endTime,
      total: lineTotal,
      loyaltyDiscount: lineLoyalty,
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

  const allJobs = await jobs.findAll({
    where: { bookingId: jobData?.booking?.id },
    attributes: ['id', `startTime`, `endTime`],
    order: [['startTime', 'ASC']],
  })

  let startFrom = jobData?.booking?.startTime
  let endsAt = jobData?.booking?.endTime

  console.log(
    'Ã°Å¸Å¡â‚¬ ~~~~~~~~~~~~~~~~~~~~ exports.startFrom= ~ OLd TIME:',
    startFrom,
  )
  console.log('Ã°Å¸Å¡â‚¬ ~~~~~~~~~~~~~~~~~~~~ exports.endsAt= ~ OLd TIME:', endsAt)

  if (allJobs.length === 1) {
    console.log('Ã°Å¸Å¡â‚¬ ~~~~~~~~~~~~~~~~~~~~ exports.CASE IF:')

    // If there's only one entry
    startFrom = allJobs[0].startTime
    endsAt = allJobs[0].endTime
  } else if (allJobs.length > 1) {
    console.log('Ã°Å¸Å¡â‚¬ ~~~~~~~~~~~~~~~~~~~~ exports.CASE ELSEIF IF:')

    // If there are multiple entries
    startFrom = allJobs[0].startTime // start time of the first entry
    endsAt = allJobs[allJobs.length - 1].endTime // end time of the last entry
  }

  console.log('Ã°Å¸Å¡â‚¬ ~~~~~~~~~~~~~~~~~~~~ exports.startFrom EndsAt NEW TIMES:', {
    startFrom,
    endsAt,
  })

  console.log('ðŸš€ ~ exports.editService= ~ jobData.duration:', jobData.duration)

  const findUnAssign = await jobs.findOne({
    where: { bookingId: jobData.bookingId, status: 'pending' },
  })

  if (!findUnAssign) bookingStatus = 'book'

  await booking.update(
    {
      total: updatedBookingTotal,
      loyaltyDiscount: bookingLoyalty,
      duration: updatedBookingDuration,
      status: bookingStatus,
      startTime: startFrom,
      endTime: endsAt,
    },
    { where: { id: jobData.bookingId } },
  )

  console.log(
    'ðŸš€ ~ ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~exports.editService= ~ WHEN UDATE BOOKING ENDAT:',
    {
      endsAt,
      startFrom,
      id: jobData.bookingId,
    },
  )

  editJob(jobId, jobStatus, startFrom, endsAt)
  socketForCalendar({ appointmentId: jobData?.bookingId, type: 'reschedule' })

  return res.json(returnFunction('1', 'Service edit successfully!', {}, ''))
}

//! -- New Controllers

exports.markAppointmentAsNoShow = async (req, res, next) => {
  const { bookingId } = req.params;

  const appointment = await booking.findByPk(bookingId, {
    attributes: [
      "id",
      "status",
      "on",
      "startTime",
      "endTime",
      "duration",
      "discount",
      "total",
      "subTotal",
      "initialPayment",
      "initialPaymentIntend",
      "actualCapturedAmount",
      "tip",
      "salonDetailId",
      "paymentMethod",
      "stripeCardId",
      "customerId",
      "clientFirstName",
      "clientLastName",
      "noshowPolicyVersion",
      "cancellationPolicyVersion",
      "by",
      "isMobileVisit",
      "travelFee",
      "arrivedAt",
    ],
    include: [
      { model: user, attributes: ["id", "stripeCustomerId", "firstName", "lastName"] },
      { model: salonDetail, attributes: ["id", "connectAccountId", "salonName"] },
    ],
  });

  if (!appointment) {
    throw new AppError("resource not found", 404);
  }

  let finePercentage = 0;
  if (
    appointment?.status === "complete" ||
    appointment?.status === "no-show" ||
    appointment?.status === "cancel"
  ) {
    throw new AppError(
      `The booking has already been marked as : ${appointment.status}.`,
      200
    );
  }

  // Home visit: the client was not in when the barber got there.
  if (appointment.isMobileVisit && !appointment.arrivedAt) {
    throw new AppError('Tap "I\'ve arrived" on this home visit first, then mark the no-show.', 200);
  }

  const updatedBooking = { tip: 0 };

  if (
    appointment?.by == "online" &&
    appointment?.noshowPolicyVersion &&
    appointment?.stripeCardId &&
    appointment.initialPaymentIntend
  ) {
    const { refundPercentage } = await noShowPolicy.findOne({
      where: {
        version: appointment.noshowPolicyVersion,
        salonDetailId: appointment.salonDetailId,
      },
    });

    finePercentage = refundPercentage;

    const paid =
      parseFloat(appointment.actualCapturedAmount)

    // Home visit: the percentage on the services, plus the full travel fee.
    const noshowCharges = appointment.isMobileVisit
      ? mobileBarber.noShowCharge({
          total: appointment.total,
          travelFee: appointment.travelFee,
          percent: refundPercentage,
        })
      : parseFloat((appointment.total * (refundPercentage / 100)).toFixed(2));

    if (paid > noshowCharges) {
      // -----> CASE: Initial payment greater, refund the difference
      const refundAmount = paid - noshowCharges;
      
      // Prepare customer name
      const customerName = appointment.user 
        ? `${appointment.user.firstName} ${appointment.user.lastName}`
        : `${appointment.clientFirstName || ''} ${appointment.clientLastName || ''}`.trim();
      
      // Prepare metadata for Stripe refund
      const metadata = {
        customerName: customerName,
        salonName: appointment.salonDetail?.salonName || 'Unknown Shop',
        salonDetailId: appointment.salonDetailId.toString(),
        bookingId: bookingId.toString(),
        case: 'no-show',
        refundAmount: refundAmount.toString(),
        description: `No-Show: Refund of $${(refundAmount / 100).toFixed(2)} for booking #${bookingId}`
      };
      
      const refund = await Stripe.refundPartialPayment(
        appointment.initialPaymentIntend,
        refundAmount,
        appointment.salonDetail?.connectAccountId,
        metadata // 👈 pass metadata instead of appointment
      );

      if (refund?.id) {
        updatedBooking.status = "no-show";
        updatedBooking.finalPayment = "paid";
        updatedBooking.refundAmount = refundAmount;
        updatedBooking.refundPaymentIntend = refund?.id;
      }
    } else if (paid < noshowCharges) {
      // -----> CASE: Charges greater, capture penalty
      const fineAmount = noshowCharges - paid;
      
      // Prepare customer name
      const customerName = appointment.user 
        ? `${appointment.user.firstName} ${appointment.user.lastName}`
        : `${appointment.clientFirstName || ''} ${appointment.clientLastName || ''}`.trim();
      
      // Prepare metadata for Stripe penalty capture
      const metadata = {
        customerName: customerName,
        salonName: appointment.salonDetail?.salonName || 'Unknown Shop',
        salonDetailId: appointment.salonDetailId.toString(),
        bookingId: bookingId.toString(),
        case: 'no-show',
        penaltyAmount: fineAmount.toString(),
        description: `No-Show: Penalty of $${(fineAmount / 100).toFixed(2)} for booking #${bookingId}`
      };
      
      const fine = await Stripe.capturePayment(
        fineAmount,
        appointment.user?.stripeCustomerId,
        appointment.stripeCardId,
        appointment.salonDetail?.connectAccountId,
        metadata, // 👈 pass metadata instead of appointment
        appointment.total,
        
      );

      if (fine?.id) {
        updatedBooking.status = "no-show";
        updatedBooking.finalPayment = "paid";
        updatedBooking.penaltyPaymentIntend = fine?.id;
        updatedBooking.penaltyAmount = fineAmount;
      }
    } else {
      // -----> CASE: Equal
      updatedBooking.status = "no-show";
      updatedBooking.finalPayment = "paid";
    }

    updatedBooking.noshowCharges = noshowCharges;
    updatedBooking.actualCapturedAmount = noshowCharges;
    updatedBooking.total = noshowCharges;
    updatedBooking.initialPayment = paid;
  } else {
    updatedBooking.status = "no-show";
    updatedBooking.finalPayment = "paid";
    updatedBooking.total = appointment.actualCapturedAmount;
  }

  updatedBooking.subTotal = appointment.total;

  await booking.update(updatedBooking, { where: { id: bookingId } });

  await wallet.increment(
    { onlineAmount: updatedBooking.total },
    { where: { salonDetailId: appointment.salonDetailId } }
  );

  if (updatedBooking.status == "no-show") {
    await jobs.update({ status: "no-show" }, { where: { bookingId } });
    loyalty.onBookingNoShow(bookingId);
    noShowMessages(appointment?.id, finePercentage, true);
  } else {
    noShowMessages(appointment?.id, finePercentage);
  }

  socketForCalendar({
    appointmentId: bookingId,
    type: "finish",
    status: "no-show",
  });

  const output = response({
    message: "Booking marked as no-show",
    data: {},
  });
  return res.status(200).json(output);
};



//Online Payment Key update
exports.updateOnlibePayment = async (req, res, next) => {
  const { salonDetailId, onlinePayments } = req.body

  const findSaloonDetail = await salonDetail.findOne({
    where: {
      id: salonDetailId
    }
  })
  console.log("findSaloonDetail ----------->", findSaloonDetail)

  if (!findSaloonDetail) {
    throw new appError("Shop details do not exist")
  }

  await salonDetail.update({
    onlinePayments: onlinePayments,
  }, { where: { id: salonDetailId } })

  return res.json(returnFunction("1", 'Updated successfully', {}, ""))
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
    title: `Booking Cancellation`,
    body: `We regret to inform you that your booking on ${dateTime} has been cancelled. Please contact us to reschedule.`,
  }

  const fullName = `${inputData.user.firstName} ${inputData.user.lastName}`

  const salonNotification = {
    title: `Booking Cancellation Alert`,
    body: `The booking with ${fullName} on ${dateTime} has been cancelled.`,
  }

  const output = response({
    message: 'Booking marked as cancelled',
    data: {},
  })
  return res.status(200).json(output)
}

// id: 'pi_3QnJFRIUi1Nn55FG29YeL2sK',
// object: 'payment_intent',
// amount: 2.25

// ðŸš€ ~ amount: 6.25
// Ã°Å¸Å¡â‚¬ ~ accountId: acct_1QetyVIOTz68gwkY
// {
//   id: 'pi_3QnJGaIUi1Nn55FG2OXJUQp5',
//   object: 'payment_intent',
//   amount: 625,
