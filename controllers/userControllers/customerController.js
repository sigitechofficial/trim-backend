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
  customerOnConnectAccount,
  couponTimeSlot,
  wallet,
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
const testing = require('../../helper/testing')
const tankyou = require('../../helper/ThankYouForVisiting')
const DEMO = require('../../helper/demo')
const EmailResetPasswordOtpToAll = require('../../helper/ResetPasswordOtpToAll')
const CustomDateNew =require('../../utils/customDateNew')
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
const {
  socketForCalendar,
} = require('../eventDrivenCommunication/calendarView')

//! Return Function
//* DEMO. Eamil Testing ----------------------
const axios = require('axios')

function formatTime(totalMinutes) {
  let hours = Math.floor(totalMinutes / 60)
  let minutes = totalMinutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  let displayHour = hours % 12
  if (displayHour === 0) displayHour = 12
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Return a random integer between min and max (inclusive).
 */
function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function sendSequentialRequests(
  endpoint,
  accessToken,
  baseRequestBody,
  baseDate,
) {
  const totalRequests = 20

  const initialDate = new Date(baseDate)
  // Appointment duration in minutes (e.g., 415 minutes).
  const appointmentDuration = baseRequestBody.appointment.duration
  // Earliest start time is 7:00 AM (7*60 = 420 minutes).
  const startMinutesMin = 7 * 60
  // Latest start time so that end time <= 7:00 PM (7:00 PM is 19*60 = 1140 minutes).
  const startMinutesMax = 19 * 60 - appointmentDuration

  for (let i = 0; i < totalRequests; i++) {
    // Calculate the appointment date.
    // Every 5 requests, the date increments by one day.
    const daysToAdd = Math.floor(i / 5)
    const currentDate = new Date(initialDate)
    currentDate.setDate(currentDate.getDate() + daysToAdd)
    // Format date as "YYYY-MM-DD"
    const formattedDate = currentDate.toISOString().split('T')[0]

    // Generate a random start time in minutes (ensuring the appointment fits before 7:00 PM).
    const randomStartMinutes = getRandomIntInclusive(
      startMinutesMin,
      startMinutesMax,
    )
    const randomEndMinutes = randomStartMinutes + appointmentDuration

    const formattedStartTime = formatTime(randomStartMinutes)
    const formattedEndTime = formatTime(randomEndMinutes)

    // Clone the base request body so we don't modify the original object.
    const requestBody = JSON.parse(JSON.stringify(baseRequestBody))
    // Update the appointment object.
    requestBody.appointment.startTime = formattedStartTime
    requestBody.appointment.endTime = formattedEndTime
    requestBody.appointment.on = formattedDate

    try {
      const response = await axios.post(endpoint, requestBody, {
        headers: {
          accesstoken: accessToken,
        },
      })
      console.log(`Request ${i + 1} succeeded:`, response.data)
    } catch (error) {
      console.error(`Request ${i + 1} failed:`, error.message)
    }
  }
}

// Starting date for the "on" field.

exports.emailtesting = async (req, res, next) => {
  const { html } = req.body
  testing(html)
  // const endpoint = `https://backend.trimworldwide.com/customer/book-appointment`
  // const baseDate = '2025-03-14'
  // sendSequentialRequests(endpoint, accessToken, baseRequestBody, baseDate)
  // // const data = DEMO(htmlContent)
  // // const bookingData = await bookingDataForEmailAndNotifications('2112')

  // // //EMAIL
  // // if (!bookingData) return false
  // // const emailInput = bookingData?.appointment

  // // EmailAppointmentToSalon([`${bookingData?.salon?.salonEmail}`], emailInput)

  // // AppointmentEmailsToCustomer(
  // //   [`${bookingData?.client?.customerEmail}`],
  // //   emailInput,
  // // )

  // // const salon = await salonDetail.findOne({
  // //   where: { id: 301 },
  // //   attributes: ['id', 'userId'],
  // //   include: [
  // //     {
  // //       model: employee,
  // //       attributes: ['id', 'userId'],
  // //     },
  // //   ],
  // // })

  return res.status(200).json(response({ data: {} }))
}

//* DEMO. Notification Testing ----------------------

exports.notificationTesting = async (req, res, next) => {
  const customerNotification = {
    title: `JUST TESTING `,
    body: `Your appointment has been confirmed. Looking forward to seeing you!`,
  }

  if (req.body?.subId) Stripe.expireManually(req?.body?.subId)

  // ThrowNotification(req.body.to, customerNotification, {
  //   appointment: 1,
  // })
  return res.status(200).json(response({ data: {} }))
}

//* 1.Get Home ----------------------

// exports.home = async (req, res, next) => {
//   const currentDay = CustomDate.currentDay()
//   const { targetLat, targetLng } = req.body
//   const rangeInKm = req.body.rangeInKm || 15
//   const condition = { status: true }

//   // Build price condition if provided
//   const priceCondition = req.body?.price
//     ? { price: { [Op.lte]: req.body?.price } }
//     : {}

//   // Build time condition if day and time are provided
//   if (req.body.day && req.body.startTime && req.body.endTime) {
//     condition.day = req.body.day
//     condition.openingTime = { [Op.lte]: req.body.startTime }
//     condition.closingTime = { [Op.gte]: req.body.endTime }
//   }

//   // Fetch liked salons if favorite filter is applied
//   const likedSalons = await favorite.findAll({
//     where: { userId: req?.user?.id || 0 },
//     attributes: ['salonDetailId'],
//   })
//   const likeIds =
//     likedSalons?.length > 0 ? likedSalons.map((ele) => ele.salonDetailId) : []

//   // Initialize salon conditions
//   const salonCondition = {
//     [Op.or]: [
//       { isExternalEmployee: true },
//       { registrationExpiryDate: { [Op.gte]: currentDay.currentDateOnly } },
//     ],
//     approvedByAdmin: true,
//     status: 1,
//     deleted: 0,
//   }

//   // Apply favorite filter if requested
//   if (req.params?.favorite && req?.user) {
//     if (likedSalons.length < 1) {
//       return res.status(200).json(response({ data: { slons: [] } }))
//     }
//     salonCondition.id = { [Op.or]: likeIds }
//   }

//   // Haversine formula for distance calculation
//   const formula = `(6371 * 
//     acos(
//       cos(radians(${targetLat})) * cos(radians(lat)) * 
//       cos(radians(lng) - radians(${targetLng})) + 
//       sin(radians(${targetLat})) * sin(radians(lat))
//     )
//   )`

//   // Refactored salon conditions incorporating service and time filters
//   const finalSalonCondition = {
//     ...salonCondition,
//     // Distance filter
//     ...(targetLat &&
//       targetLng && {
//         [Op.and]: literal(`${formula} <= ${rangeInKm}`),
//       }),

//     // Service price filter
//     ...(req.body.price && {
//       id: {
//         [Op.in]: literal(`(
//           SELECT DISTINCT salonDetailId FROM services
//           WHERE services.salonDetailId = salonDetail.id 
//             AND services.price <= ${req.body.price}
//         )`),
//       },
//     }),
//     // Time filter
//     ...(req.body.day &&
//       req.body.time && {
//         id: {
//           [Op.in]: literal(`(
//           SELECT DISTINCT salonDetailId FROM times
//           WHERE times.salonDetailId = salonDetail.id 
//             AND times.day = '${req.body.day}' 
//             AND times.openingTime <= '${req.body.time}' 
//             AND times.closingTime >= '${req.body.time}'
//         )`),
//         },
//       }),
//     ...(req?.body?.serviceType && {
//       id: {
//         [Op.in]: literal(`(
//             SELECT DISTINCT salonDetailId FROM services
//           WHERE services.salonDetailId = salonDetail.id 
//               AND services.serviceTypeId = ${req?.body?.serviceType}
//           )`),
//       },
//     }),
//   }

//   console.log('ðŸš€ ~ exports.home= ~  finalSalonCondition:', finalSalonCondition)

//   // Construct the query body without including 'service' and 'time'
//   const body = {
//     where: finalSalonCondition,
//     attributes: [
//       'id',
//       'salonName',
//       'coverImage',
//       'isExternalEmployee',
//       'isOnline',
//       [
//         literal(`(
//           SELECT FORMAT(AVG(ratings.value), 1)
//           FROM ratings
//           WHERE ratings.salonDetailId = salonDetail.id
//         )`),
//         'salonAverageRating',
//       ],
//       [
//         literal(`(
//           SELECT COUNT(ratings.id)
//           FROM ratings
//           WHERE ratings.salonDetailId = salonDetail.id
//         )`),
//         'ratingCount',
//       ],
//     ],
//     include: [
//       // {
//       //   model: rating,
//       //   attributes: [],
//       //   on: { salonDetailId: col('salonDetail.id') },
//       //   required: false,
//       // },
//       {
//         model: addressDBS,
//         required: true,
//         attributes: [
//           'id',
//           'streetAddress',
//           'city',
//           'district',
//           'province',
//           'country',
//           'lat',
//           'lng',
//           'building',
//           'postalCode',
//         ],
//       },
//       {
//         model: service,
//         required: true,
//         attributes: ['id', 'serviceName', 'price', 'discount'],
//       },
//       {
//         model: user,
//         where: { status: true, deleted: 0 },
//         required: true,
//         attributes: ['id'],
//       },
//     ],
//     // group: ['salonDetail.id'],
//     having: req.params?.favorite
//       ? undefined
//       : literal(`${formula} <= ${rangeInKm}`),
//   }

//   // Add distance attribute if not filtering by favorites
//   if (!req.params?.favorite) {
//     body.attributes.push([literal(`${formula}`), 'distance'])
//   }

//   let results = await salonDetail.findAll(body)

//   results = JSON.parse(JSON.stringify(results))
//   if (results.length > 0) {
//     results = results.map((salon) => {
//       const found = likeIds.some((id) => id === salon.id)
//       return { ...salon, like: found }
//     })
//   }
//   // console.log('ðŸš€ ~ exports.home= ~ results:', results)
//   let appointments = []
//   if (req.user && req.user.id) {
//     appointments = await booking.findAll({
//       where: {
//         customerId: req.user.id,
//         status: { [Op.or]: ['pending', 'book'] },
//       },
//       attributes: [
//         'id',
//         `status`,
//         `startTime`,
//         `endTime`,
//         `on`,
//         'total',
//         'actualCapturedAmount',
//         [
//           literal(
//             `(SELECT COUNT(*) FROM jobs WHERE jobs.bookingId = booking.id)`,
//           ),
//           'serviceCount',
//         ],
//       ],

//       include: [
//         {
//           model: salonDetail,
//           attributes: [
//             'id',
//             `salonName`,
//             'coverImage',
//             // [literal('FORMAT(AVG(ratings.value), 1)'), 'salonAverageRating'],
//             // [fn('COUNT', col('ratings.id')), 'ratingCount']
//           ],
//           include: [
//             { model: addressDBS, attributes: [`streetAddress`, `city`] },
//             { model: rating, attributes: [] },
//           ],
//         },
//         {
//           model: jobs,
//           attributes: [],
//         },
//       ],
//     })
//   }


//   const output = {
//     data: {
//       slons: results,
//       appointments,
//       currencyUnit: CURRENCY_UNIT,
//       distanceUnit: 'km',
//     },
//   }

//   if (req.params.favorite) {
//     output.data = { slons: results }
//   }

//   return res.status(200).json(response(output))
// }

exports.home = async (req, res, next) => {
  const currentDay = CustomDate.currentDay()

  // ✅ Support both POST (body) and GET (query)
  const targetLat = req.body?.targetLat || req.query?.targetLat
  const targetLng = req.body?.targetLng || req.query?.targetLng
  const rangeInKm = req.body?.rangeInKm || req.query?.rangeInKm || 15
  const condition = { status: true }

  // Price condition for filtering salons
  const priceCondition = req.body?.price || req.query?.price
    ? { price: { [Op.lte]: req.body?.price || req.query?.price } }
    : {}

  // Filter by day and time
  if ((req.body.day || req.query.day) && (req.body.startTime || req.query.startTime) && (req.body.endTime || req.query.endTime)) {
    condition.day = req.body.day || req.query.day
    condition.openingTime = { [Op.lte]: req.body.startTime || req.query.startTime }
    condition.closingTime = { [Op.gte]: req.body.endTime || req.query.endTime }
  }

  // Fetch favorite salon IDs
  const likedSalons = await favorite.findAll({
    where: { userId: req?.user?.id || 0 },
    attributes: ['salonDetailId'],
  })
  const likeIds =
    likedSalons?.length > 0 ? likedSalons.map((ele) => ele.salonDetailId) : []

  // Base salon condition
  const salonCondition = {
    [Op.or]: [
      { isExternalEmployee: true },
      { registrationExpiryDate: { [Op.gte]: currentDay.currentDateOnly } },
    ],
    approvedByAdmin: true,
    status: 1,
    deleted: 0,
  }

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

  // Final conditions with optional filters
  const finalSalonCondition = {
    ...salonCondition,
    ...(targetLat &&
      targetLng && {
        [Op.and]: literal(`${formula} <= ${rangeInKm}`),
      }),
    ...((req.body.price || req.query.price) && {
      id: {
        [Op.in]: literal(`(
          SELECT DISTINCT salonDetailId FROM services
          WHERE services.salonDetailId = salonDetail.id 
            AND services.price <= ${req.body.price || req.query.price}
        )`),
      },
    }),
    ...((req.body.day || req.query.day) &&
      (req.body.time || req.query.time) && {
        id: {
          [Op.in]: literal(`(
          SELECT DISTINCT salonDetailId FROM times
          WHERE times.salonDetailId = salonDetail.id 
            AND times.day = '${req.body.day || req.query.day}' 
            AND times.openingTime <= '${req.body.time || req.query.time}' 
            AND times.closingTime >= '${req.body.time || req.query.time}'
        )`),
        },
      }),
    ...(req?.body?.serviceType || req?.query?.serviceType
      ? {
          id: {
            [Op.in]: literal(`(
              SELECT DISTINCT salonDetailId FROM services
              WHERE services.salonDetailId = salonDetail.id 
                AND services.serviceTypeId = ${req?.body?.serviceType || req?.query?.serviceType}
            )`),
          },
        }
      : {}),
  }

  // Query salons
  const body = {
    where: finalSalonCondition,
    attributes: [
      'id',
      'salonName',
      'coverImage',
      'isExternalEmployee',
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
        where: { status: true, deleted: 0 },
        required: true,
        attributes: ['id'],
      },
    ],
    // ✅ Only apply HAVING filter if not favorites
    having: !req.params?.favorite
      ? literal(`${formula} <= ${rangeInKm}`)
      : undefined,
  }

  // ✅ Always include distance if lat/lng are provided
  if (targetLat && targetLng) {
    body.attributes.push([literal(`${formula}`), 'distance'])
    body.order = [[literal('distance'), 'ASC']]  // 👈 SORT BY DISTANCE ASC
  }

  // Fetch salon results
  let results = await salonDetail.findAll(body)
  results = JSON.parse(JSON.stringify(results))

  // Map salons with like and max discount
  if (results.length > 0) {
    results = results.map((salon) => {
      const found = likeIds.some((id) => id === salon.id)
      const discounts = (salon.services || []).map((s) => s.discount || 0)
      const maxDiscount = discounts.length > 0 ? Math.max(...discounts) : 0
      return { ...salon, like: found, averageDiscount: maxDiscount }
    })
  }

  // Fetch customer appointments
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
          attributes: ['id', 'salonName', 'coverImage'],
          include: [
            { model: addressDBS, attributes: [`streetAddress`, `city`] },
            { model: rating, attributes: [] },
          ],
        },
        { model: jobs, attributes: [] },
      ],
    })
  }

  // Compute global highest and lowest service prices across all salons
  const allServicePrices = results.flatMap(salon =>
    (salon.services || []).map(s => Number(s.price))
  )

  const highestPriceAcrossAllSalons = allServicePrices.length > 0
    ? Number(Math.max(...allServicePrices)).toFixed(2)
    : "0.00"

  const lowestPriceAcrossAllSalons = allServicePrices.length > 0
    ? Number(Math.min(...allServicePrices)).toFixed(2)
    : "0.00"

  // Final response
  const output = {
    data: {
      slons: results,
      appointments,
      currencyUnit: CURRENCY_UNIT,
      distanceUnit: 'km',
      highestPriceAcrossAllSalons,
      lowestPriceAcrossAllSalons,
    },
  }

  // ✅ For favorites: keep distance + other salon fields, just drop appointments
  if (req.params.favorite) {
    delete output.data.appointments
  }

  return res.status(200).json(response(output))
}





//* 2.Get Salon Details -------------Modified----

exports.salonDetails = async (req, res, next) => {
  const currentDay = CustomDate.currentDay()

  const results = await salonDetail.findByPk(req.params.id, {
    where: {
      // registrationExpiryDate: { [Op.gt]: currentDay.currentDateOnly },
      // approvedByAdmin: true,
    },
    attributes: [
      'id',
      'salonName',
      'metadata',
      'coverImage',
      'description',
      'onlinePayments',
      'isOnline',
      "userId",
      'isExternalEmployee',
      [
        literal(
          '(SELECT accountConnected FROM wallets WHERE wallets.salonDetailId = salonDetail.id LIMIT 1)',
        ),
        'stripeAccountConnected',
      ],
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
      ], //TODO Remove
    ],
    include: [
      {
        model: booking,
        required: false,
        where: { status: 'complete', rating: 'done' },
        order: [['createdAt', 'DESC']],
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
        where: { status: true },
        required: true,
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
        where: { isExternalEmployee: false },
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

  const feedbackCount = await rating.count({
    distinct: true,
    col: 'bookingId',
    where: {
      salonDetailId: req.params.id,
    },
  })

  return res.status(200).json(
    response({
      message:"Data loaded",
      data: {
        announcements: announcements,
        customerStatus,
        like,
        detail: results,
        policies,
        currencyUnit: CURRENCY_UNIT,
        feedbackCount,
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
      'phoneNum',
      'countryCode',
      'stripeCustomerId',
    ],
  })
  if (data.status === false)
    next(new AppError('Blocked by Admin. Contact customer support'))

  const output = JSON.parse(JSON.stringify(data))
  output.accessToken = accessToken
  output.userId = `${userId}`
  delete output.id
  output.phoneNum = `${output.countryCode} ${output.phoneNum}`
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
      : []
  console.log('Ã°Å¸Å¡â‚¬~employees:', employeeIds)
  if (employeeIds.length < 1) {
    return res
      .status(200)
      .json({ status: '2', message: 'Nobody is available at this time' })
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
              '(SELECT FORMAT(AVG(ratings.value), 1) FROM ratings WHERE ratings.employeeId = employees.id )',
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
      .json({ status: '2', message: 'Nobody is available at this time' })
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
  console.log('ðŸš€ ~ exports.employeeAvailability= ~ req.body:', req.body)

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
    'ðŸš€ ~ exports.rescheduleSoloEmployeeAppointment= ~ employeeId:',
    employeeId,
  )
  console.log(
    'ðŸš€ ~ exports.rescheduleSoloEmployeeAppointment= ~ services:',
    services,
  )
  console.log(
    'ðŸš€ ~ exports.rescheduleSoloEmployeeAppointment= ~ appointment:',
    appointment,
  )
  appointment.startTime = DateManupulation.convertTo24HourFormat(
    appointment.startTime,
  )
  console.log('ðŸš€ ~ AFTER START-TIME', appointment.startTime)

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
          message: 'This time is already booked by another customer',
        }),
      )
    }
  }

  const jobIds = services.map((obj) => obj.id)
  const assignTimeSlots = Custom.scheduleSessions(appointment, services)
  console.log(
    'ðŸš€ ~ exports.rescheduleSoloEmployeeAppointment= ~ assignTimeSlots:',
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
  socketForCalendar({ appointmentId: bookingId, type: 'reschedule' })
  const output = response({
    message: 'Booking rescheduled',
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
      isExternalEmployee: false,
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

  console.log('ðŸš€~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€ ~ðŸš€  services:', services)
  const assignTimeSlots = Custom.scheduleSessions(appointment, services)
  console.log('ðŸš€ ~ assignTimeSlots:', assignTimeSlots)

  JobsInput = Custom.assignEmployeesToServices(employeeData, assignTimeSlots)
  appointment.status = 'book'
  const findUnAssign =
    JobsInput.length > 0
      ? JobsInput.find((el) => el.status === 'pending')
      : false
  console.log(
    'ðŸš€ ~ exports.rescheduleMultipleEmployeeAppointment= ~ findUnAssign:',
    findUnAssign,
  )
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
  JobsInput.forEach((newJobData) => {
    // Find the corresponding job in sessions array by ID
    // console.log("ðŸš€ ~ exports.rescheduleMultipleEmployeeAppointment= ~ newJobData:", newJobData)

    const jobToUpdate = sessions.find((job) => job.id === newJobData.id)
    // console.log("ðŸš€ ~ exports.rescheduleMultipleEmployeeAppointment= ~ jobToUpdate:", jobToUpdate)
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
  socketForCalendar({ appointmentId: bookingId, type: 'reschedule' })
  const output = response({ message: 'Booking rescheduled' })
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
    return res.status(404).json({ message: 'Booking not found' })
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
    req.body.cancellationCharges >= 0
  ) {
    const paid =
      parseFloat(appointment.actualCapturedAmount) + parseFloat(appointment.tip)

    const cancellationCharges = parseFloat(req.body.cancellationCharges)
    console.log('ðŸš€ ~ exports.cancelAppointment= ~ paid:', paid)
    console.log('ðŸš€ ~ ~ cancellationCharges:', cancellationCharges)

    if (paid * 1 > cancellationCharges * 1) {
      console.log('-----> ~CASE~ intialPayment Greater (refund) ')

      const refundAmount = paid - cancellationCharges
      console.log('ðŸš€  refundAmount:', refundAmount)
      if (refundAmount > 0.31) {
        const refund = await Stripe.refundPartialPayment(
          appointment.initialPaymentIntend,
          refundAmount,
          appointment.salonDetail?.connectAccountId,
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
      const customerOnConnect = await customerOnConnectAccount.findOne({
        where: {
          userId: appointment.customerId,
          connectAccountId: appointment.salonDetail?.connectAccountId,
        },
        attributes: ['customerId'],
      });
      
      if (!customerOnConnect) {
        throw new AppError(
          `Customer not found on this connected account`,
          400
        );
      }
      const fineAmount = cancellationCharges - paid
      const fine = await Stripe.capturePayment(
        fineAmount,
        customerOnConnect.customerId,
        appointment.stripeCardId,
        appointment.salonDetail?.connectAccountId,
      )
      if (fine?.id) {
        updatedBooking.status = 'cancel'
        updatedBooking.finalPayment = 'paid'
        updatedBooking.penaltyAmount = fineAmount
        updatedBooking.penaltyPaymentIntend = fine?.id
      }
      console.log('Ã°Å¸Å¡â‚¬ ----------->~Fine Captured Success', fine)
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
    'ðŸš€ ~ exports.cancelAppointment= ~ updatedBooking:',
    updatedBooking,
  )

  await booking.update(updatedBooking, { where: { id: bookingId } })

  await wallet.increment(
    { onlineAmount: updatedBooking.total },
    { where: { salonDetailId: appointment.salonDetailId } },
  )

  await jobs.update(
    { status: 'cancel' },
    { where: { bookingId: appointment.id } },
  )
  calculatePayoutsOnBooking(appointment, finePercentage, 'cancel')
  cancelByCustomer(appointment.id) //Notifications etc
  socketForCalendar({ appointmentId: bookingId, type: 'finish' })

  employeeCommission.update(
    { appointmentClosed: true },
    { where: { bookingId: bookingId } },
  )
  rentChairEarning.update(
    { appointmentClosed: true },
    { where: { bookingId: bookingId } },
  )
  const output = response({
    message: 'Booking cancelled',
    data: {},
  })
  return res.status(200).json(output)
}

//* 7.Book Appointment -----------------

exports.bookAppointment = async (req, res, next) => {
  const customerId = req.user.id
  const { appointment, services } = req.body
  console.log(
    'ðŸš€ ~ exports.bookAppointment= ~ req.body:',
    JSON.stringify(req.body),
  )

  appointment.actualCapturedAmount =
    parseFloat(appointment?.actualCapturedAmount) - parseFloat(appointment?.tip)

  appointment.initialPayment =
    parseFloat(appointment?.initialPayment) - parseFloat(appointment?.tip)

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
    appointment.stripeCardId = req?.body?.stripeCardId
    const client = await user.findByPk(customerId, {
      attributes: ['stripeCustomerId'],
    })
    Stripe.attchPaymentMethod(
      appointment?.stripeCardId,
      client?.stripeCustomerId,
    )
  } else if (req.body.paymentMethod === 'cash') {
    appointment.paymentMethod = 'cash'
  } else {
    throw new AppError('Please select payment a method first', 200)
  }

  appointment.startTime = DateManupulation.convertTo24HourFormat(
    appointment.startTime,
  )
  console.log('Ã°Å¸Å¡â‚¬ ~ AFTER START-TIME', appointment.startTime)

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

  console.log(
    'Ã°Å¸Å¡â‚¬~Ã°Å¸Å¡â‚¬ ~Ã°Å¸Å¡â‚¬ ~Ã°Å¸Å¡â‚¬ ~Ã°Å¸Å¡â‚¬ ~Ã°Å¸Å¡â‚¬ ~Ã°Å¸Å¡â‚¬ ~Ã°Å¸Å¡â‚¬ ~Ã°Å¸Å¡â‚¬  services:',
    services,
  )
  const assignTimeSlots = Custom.scheduleSessions(appointment, services)
  console.log('Ã°Å¸Å¡â‚¬ ~ assignTimeSlots:', assignTimeSlots)

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
    console.log('Ã°Å¸Å¡â‚¬ ~ findUnAssign:', findUnAssign)
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
  socketForCalendar({ appointmentId: book?.id, type: 'new' })

  onlineAppointmentConfirm(book?.id)

  const output = response({
    message: 'Booked',
    data: { appointment: book?.id },
  })


  const salon = await salonDetail.findByPk(book.salonDetailId, {
    attributes: ['connectAccountId']
  });

  if(book.initialPaymentIntend){
        Stripe.updatePaymentIntentDescription(book.initialPaymentIntend, book, salon.connectAccountId)
  }
  return res.status(200).json(output)
}

//* 4.5 Capture Payment info -----------------

exports.captureUpFrontPaymentInfo = async (req, res, next) => {
  //Partial payment upfront
  console.log(
    'ðŸš€ ~ exports.captureUpFrontPaymentInfo= ~ !req.body.onlinePayments:',
    req.body.stripeCustomerId,
  )
  
  const customerId = req.user.id
  console.log("CustomerId=================>>>>",customerId)

  if (!req.body.onlinePayments)
    throw new AppError('Salon does not accept online payments.', 200)
  if (!req.body.stripeCustomerId)
    throw new AppError('Salon does not accept online payments.', 200)

  const upFrontAmount =
    req.body.advanceAmount && req.body.advanceAmount > 0
      ? parseFloat(req.body.advanceAmount)
      : 0
  const platformFee = req.body?.platformFee
    ? parseFloat(req.body?.platformFee)
    : 0
  const tip = req.body.tip ? parseFloat(req.body.tip) : 0
  const advanceAmount = upFrontAmount + tip 
  const actualCapturedAmount = upFrontAmount
  const account = await salonDetail.findOne({
    where: { id: req.body.salonId },
    attributes: ['connectAccountId'],
  })
  
  console.log("account.connectAccountId===========<><><><>>>><<<<<<<<<<<<<<>>>>>>>>>><<<<<<<<<<",account.connectAccountId)
  let stripeCustomerId=req.body.stripeCustomerId;
  let confirmCustomerId=await Stripe.getCustomer(stripeCustomerId,account.connectAccountId)
        console.log("confirmCustomerId------<><><><><><><><>",confirmCustomerId)

  if(!confirmCustomerId){
      throw new AppError("User Not Exists on Stripe Connect Account")
  }
  console.log("Stripe CustomerId-===============================>>>>",confirmCustomerId)
  const ephemeralKey = await Stripe.createEphemeralKey(
    confirmCustomerId,
    account.connectAccountId
  )
  

  //TODO Ensure that the payment goes to the specific salon's account, not the admin's account.
  const indent =
    advanceAmount > 0
      ? await Stripe.createDirectCharge(
          advanceAmount,
          confirmCustomerId,
          account.connectAccountId,
        )
      : null

  const data = {
    ephemeralKeySecret: ephemeralKey ? ephemeralKey.secret : '',
    client_secret: indent ? indent.client_secret : '',
    paymentIntendId: indent ? indent.id : '',
    initialPayment: upFrontAmount,
    tip: tip,
    platformFee,
    actualCapturedAmount: actualCapturedAmount,
    stripeCustomerId: confirmCustomerId,
    stripeAccountId:account.connectAccountId,
  }
  
  console.log("Data================================><><><><><><>",data);

  const output = response({ status: '1', message: 'Advance payment', data })
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

  const output = response({ status: '1', message: 'Advance payment', data })
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
              `postalCode`,
              `province`,
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

// exports.addCard = async (req, res, next) => {
//   const { cardName, cardExpYear, cardExpMonth, cardNumber, cardCVC } = req.body
//   const customerID = req.user.id
//   const customer = await user.findByPk(customerID, {
//     attributes: ['firstName', 'lastName', 'email', 'stripeCustomerId'],
//   })
//   let customerId = null
//   if (!customer) throw new AppError('User not found!', 200)
//   if (!customer.stripeCustomerId) {
//     const fullName = `${customer.firstName} ${customer.lastName}`
//     const stripeCustomerId = await Stripe.addCustomer(fullName, customer.email)
//     await user.update({ stripeCustomerId }, { where: { id: customerID } })
//     customerId = stripeCustomerId
//   } else {
//     customerId = customer.stripeCustomerId
//   }
//   req.body.customerId = customerId
//   if (customerId === null) throw new AppError('Something Went Wrong', 200)

//   // const cardData = await Stripe.addCard(
//   //   customerId,
//   //   cardName,
//   //   cardExpYear,
//   //   cardExpMonth,
//   //   cardNumber,
//   //   cardCVC);

//   const cardData = await Stripe.addCard(req.body)
//   const output = response({
//     message: 'Card Added successfully',
//     data: { stripePaymentId: cardData },
//   })
//   return res.status(200).json(output)
// }

/*
 * 2.Get Cards   ___________________________________
 */

exports.fetchCards = async (req, res, next) => {
  const userId = req.user.id
  console.log('ðŸš€ ~ ~ userId:', userId)
  const customer = await user.findByPk(userId, {
    attributes: ['firstName', 'lastName', 'email', 'stripeCustomerId'],
  })
  if (customer.stripeCustomerId === null || customer.stripeCustomerId === '') {
    const output = response({ message: 'All cards', data: { cards: [] } })
    return res.status(200).json(output)
  }
  const customerId = customer.stripeCustomerId
  const allCards = await Stripe.cards(customerId)
  console.log('ðŸš€ ~ ~ customerId:', customerId)

  const stripeCards = allCards.data.map((obj) => ({
    id: obj.id,
    name: obj.billing_details.name,
    brand: obj.card.brand,
    expMonth: obj.card.exp_month,
    expYear: obj.card.exp_year,
    last4: obj.card.last4,
    funding: obj.card.funding,
  }))

  console.log('ðŸš€ ~ stripeCards ~ stripeCards:', stripeCards)

  const output = response({ data: { cards: stripeCards } })

  return res.status(200).json(output)
}

/*
 *3.delete Card __________________________________
 */

exports.detachCard = async (req, res, next) => {
  const pmId = req.params.pm
  const detach = await Stripe.cardDetach(pmId)
  const output = response({ message: 'Card removed', data: detach })
  return res.status(200).json(output)
}

//!Promo Code

//* 1.Apply Coupon -----------------

// exports.applyCoupon = async (req, res, next) => {
//   const currentDay = CustomDate.currentDay()
//   await coupon.update(
//     { status: 'expire' },
//     {
//       where: {
//         [Op.and]: [
//           { till: { [Op.lt]: currentDay.currentDateOnly } },
//           { status: 'active' },
//         ],
//       },
//     },
//   )
//   const { salonId, promoCode } = req.body
//   console.log("req.body==================>",req.body)
//   let data = await coupon.findOne({
//   where: {
//     promoCode,
//     salonDetailId: salonId,
//     from: { [Op.lte]: currentDay.currentDateOnly },
//     till: { [Op.gte]: currentDay.currentDateOnly },
//   },
//   attributes: [`id`, `promoCode`, `type`, `status`, `value`, `limit`],
// });
  
//   console.log("data===============================>>>>>>",data)

//   if (!data) throw new AppError('Invalid promo code', 200)
//   if (data.status === 'expire') throw new AppError('Promo code Exprie.', 200)
//   data = JSON.parse(JSON.stringify(data))
//   if (data?.limit == null || data?.limit < 1) {
//     const exist = await booking.findOne({
//       where: {
//         customerId: req.user?.id,
//         //couponId: data?.id,
//         salonDetailId: salonId,
//       },
//     })
//     if (exist) {
//       throw new AppError(
//         `You've already redeemed this one-time coupon, so it can't be used again.`,
//         200,
//       )
//     }
//     data.limit = 1
//     data.applied = 0
//   }
//   const output = response({ message: 'Success', data: { promoCode: data } })
//   return res.status(200).json(output)
// }


exports.applyCoupon = async (req, res, next) => {
  const currentDay = CustomDate.currentDay(); 
  // e.g. { currentDateOnly: '2025-09-09', dayName: 'Tuesday', currentTime: '03:30 PM' }

  // 1️⃣ Expire old coupons
  await coupon.update(
    { status: 'expire' },
    {
      where: {
        [Op.and]: [
          { till: { [Op.lt]: currentDay.currentDateOnly } },
          { status: 'active' },
        ],
      },
    }
  );

  const { salonId, promoCode, bookingDate, bookingStartTime, bookingEndTime } = req.body;
  console.log("req.body================>>>",req.body)

  if (!salonId || !promoCode || !bookingStartTime || !bookingEndTime) {
    throw new AppError(
      'salonId, promoCode, bookingStartTime, and bookingEndTime are required',
      200
    );
  }

  // 2️⃣ Determine date and day to check
  const dateToCheck = bookingDate || currentDay.currentDateOnly;
  const dayName = CustomDateNew.getDayName(dateToCheck); // returns "Monday", "Tuesday", etc.

  // 3️⃣ Find coupon
  let data = await coupon.findOne({
    where: {
      promoCode,
      salonDetailId: salonId,
      from: { [Op.lte]: dateToCheck },
      till: { [Op.gte]: dateToCheck },
      status: 'active',
    },
    attributes: ['id', 'promoCode', 'type', 'status', 'value', 'limit', 'applied'],
    include: [
      {
        model: couponTimeSlot,
        attributes: ['day', 'timeFrom', 'timeTo'],
      },
    ],
  });

  if (!data) throw new AppError('Invalid promo code', 200);
  if (data.status === 'expire') throw new AppError('Promo code expired.', 200);

  data = JSON.parse(JSON.stringify(data));
  
  console.log("Data====>",data)

  // 4️⃣ Check if coupon is valid for this day
  const slotsForToday = data.couponTimeSlots.filter(slot => slot.day === dayName);
  if (!slotsForToday || slotsForToday.length === 0) {
    throw new AppError(`Coupon not valid on ${dayName}`, 200);
  }

  // 5️⃣ Check booking time overlaps with at least one slot
  const moment = require('moment');
  const bookingStart = moment(bookingStartTime, 'hh:mm A');
  const bookingEnd = moment(bookingEndTime, 'hh:mm A');

  let isTimeValid = false;
  for (const slot of slotsForToday) {
    const slotStart = moment(slot.timeFrom, 'hh:mm A');
    const slotEnd = moment(slot.timeTo, 'hh:mm A');

    if (bookingStart.isBefore(slotEnd) && bookingEnd.isAfter(slotStart)) {
      isTimeValid = true;
      break;
    }
  }

  if (!isTimeValid) {
    throw new AppError(
      `Coupon not valid for booking time ${bookingStartTime} - ${bookingEndTime}`,
      200
    );
  }

  // 6️⃣ Handle limit usage
  if (data.limit == null || data.limit < 1) {
    const exist = await booking.findOne({
      where: {
        customerId: req.user?.id,
        salonDetailId: salonId,
        couponId: data.id,
      },
    });

    if (exist) {
      throw new AppError(
        `You've already redeemed this one-time coupon, so it can't be used again.`,
        200
      );
    }
    data.limit = 1;
    data.applied = 0;
  } else {
    if (data.applied >= data.limit) {
      throw new AppError(`This coupon has reached its usage limit.`, 200);
    }
  }

  // 7️⃣ Return success
  const output = response({
    message: 'Success',
    data: { promoCode: data },
  });
  return res.status(200).json(output);
};

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
    message: 'Profile image updated',
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
    message: `Feedback posted`,
    data: {},
  })

  return res.status(200).json(output)
}

//* 2.Rate Employees  -----------------

exports.skipRating = async (req, res, next) => {
  const { doNotShow, appointmentId } = req.body
  const status = doNotShow ? 'cancel' : 'skiped'
  await booking.update({ rating: status }, { where: { id: appointmentId } })

  const output = response({ message: `Success`, data: {} })
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
  console.log('ðŸš€ ~ exports.signup= ~ ephemeralKeySecret:', ephemeralKeySecret)
  const expiry = DateManupulation.stampToDate(ephemeralKeySecret.expires)
  // console.log('ðŸš€ ~ exports.signup= ~ expiry:', expiry)
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

  const output = response({ message: `Success`, data: userExist })
  return res.status(200).json(output)
}

//!Salon Policies

//* 1.Policies  -----------------

exports.salonPolicies = async (req, res, next) => {
  const salonDetailId = req.params.salon
  console.log('ðŸš€ ~ exports.salonPolicies= ~ salonDetailId:', salonDetailId)

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
  if (req.params.salon) {
    condition.salonDetailId = req.params.salon
  }
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
      message: 'Customer feedback',
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
      [
        literal(
          `(SELECT COUNT(*) 
           FROM bookings 
           WHERE bookings.customerId = user.id 
           AND bookings.status IN ('pending', 'book', 'saveunpaid'))`,
        ),
        'bookingCount',
      ],
    ],
  })

  if (!data) throw new AppError('resource not found', 200)
  if (data?.dataValues?.bookingCount && data?.dataValues?.bookingCount > 0)
    throw new AppError(
      'Account deletion cannot proceed until all pending appointments are finalized.',
      200,
    )

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
  Stripe.deleteCustomer(data?.stripeCustomerId)
  deviceToken.destroy({ where: { userId: id } })
  return res.json(response({ message: 'Account deleted', data: { data } }))
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
    response({ message: 'Notifications', data: { notifications } }),
  )
}

//!Logout

//* 1. logout
exports.logout = async (req, res, next) => {
  const id = req.user.id
  deviceToken.destroy({ where: { userId: id, tokenId: req.user.dvToken } })
  return res.json(response({ message: 'Logged out', data: {} }))
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
  console.log('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ ~ = ~ req.body:', req.body)
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
  const salonDetails = await salonDetail.findOne({ where: { userId: salon.id } })

let trialDays = req.body?.freeTrialDays || 0
if (salonDetails?.hasObtainedFreeTrial) {
  trialDays = 0 // User already consumed free trial
}
  const metadata = {
    members: req.body?.members,
    subscriptionName: req.body.subscriptionName,
    sloanId: salon.id,
    salonDetailId: salonDetails.id,
    membersCount: req.body.membersCount,
    freeTrialDays: trialDays,
    paymentMethodId: req.body?.paymentMethodId,
    teamSize: req.body.membersCount,
    priceId: req.body?.priceId,
    VAT:req.body?.VAT,
  }
  console.log("metadata=====================>>>>>>>",metadata)
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
    'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ ~ stripeCustomer.stripeCustomer= ~ stripeCustomer:',
    stripeCustomer,
  )
  // const ephemeralKey = await Stripe.createEphemeralKey(stripeCustomer)
  const indent = await Stripe.createSubscriptionWithPriceId(
    stripeCustomer,
    req.body.priceId,
    metadata,
    req.body.membersCount,
    trialDays|| 0,
    req.body.paymentMethodId,
  )
  //return res.json(indent);

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
  const output = response({ status: '1', message: 'Subscription active', data })

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
  console.log('Ã°Å¸Å¡â‚¬ ~ exports.forSubcription= ~ salonsalonsalona:', salon)
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
    'Ã°Å¸Å¡â‚¬ ~ stripeCustomer.stripeCustomer= ~ stripeCustomer:',
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
  const output = response({ status: '1', message: 'Subscription active', data })

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

  const output = response({ status: '1', message: 'Subscription', data })

  return res.status(200).json(output)
}

exports.testing = async (req, res, next) => {
  const subscription = await Stripe.subscriptionsRetrieve(
    req.body.subscriptionId,
  )

  const data = {
    subscription,
  }

  const output = response({ status: '1', message: 'Subscription', data })

  return res.status(200).json(output)
}


/*
* Transfer 0.50 Amouunt from To Admin Stripe
*/
exports.transferFixedFeeToAdmin = async (req, res, next) => {
    const { connectedAccountId } = req.body;
    const feeAmount = 0.50;

    // 1. Fetch booking with relations
    // const appointment = await booking.findOne({
    //   where: { id: bookingId },
    //   attributes: ["id", "customerId", "salonDetailId"],
    //   include: [
    //     {
    //       model: salonDetail,
    //       attributes: ["id", "salonName"],
    //     },
    //     {
    //       model: user,
    //       as: "user", // customer
    //       attributes: ["id", "firstName", "lastName"],
    //     },
    //   ],
    // });

    // if (!appointment) {
    //   return res
    //     .status(404)
    //     .json(response({ status: "0", message: "Booking not found" }));
    // }

    // // 2. Prepare metadata
    // const meta = {
    //   bookingId: appointment.id.toString(),
    //   salonName: appointment.salonDetail?.salonName || "",
    //   salonId: appointment.salonDetail?.id.toString() || "",
    //   customerName: `${appointment.user?.firstName || ""} ${appointment.user?.lastName || ""}`,
    //   customerId: appointment.user?.id.toString() || "",
    // };

    // 3. Call Stripe transfer
    const result = await Stripe.transferToPlatform(
      feeAmount,
      connectedAccountId,
    );

    return res.json(response({ status: "1", message: "Amount Transferred",transferId:result.transferId }));
};


/*
 * Attach Meta Data to Transfer
*/
exports.updateTransferMetadata = async (req, res, next) => {
  try {
    const { transferId, bookingId, connectedAccountId } = req.body;

    if (!transferId || !bookingId || !connectedAccountId) {
      return res
        .status(400)
        .json(response({ status: "0", message: "transferId, bookingId, and connectedAccountId are required" }));
    }

    // 🔎 Fetch booking details (you said you'll do this part)
    const appointment = await booking.findOne({
      where: { id: bookingId },
      attributes: ["id", "customerId", "salonDetailId"],
      include: [
        {
          model: salonDetail,
          attributes: ["id", "salonName"],
        },
        {
          model: user,
          as: "user", // customer
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });

    if (!appointment) {
      return res
        .status(404)
        .json(response({ status: "0", message: "Booking not found" }));
    }

    // Prepare metadata
    const meta = {
      salonId: appointment.salonDetail?.id.toString() || "",
      salonName: appointment.salonDetail?.salonName || "",
      customerId: appointment.user?.id.toString() || "",
      customerName: `${appointment.user?.firstName || ""} ${appointment.user?.lastName || ""}`,
    };

    // Call Stripe util
    const updatedTransfer = await Stripe.updateTransferMetadata(
      transferId,
      bookingId,
      connectedAccountId,
      meta
    );

    return res.json(
      response({
        status: "1",
        message: "Transfer metadata updated",
        transfer: updatedTransfer,
      })
    );
  } catch (error) {
    console.error("Error in updateTransferMetadata controller:", error);
    return res
      .status(500)
      .json(response({ status: "0", message: error.message || "Update failed" }));
  }
};



/*
* Create Customer on the Stripe Connect Account
*/

exports.initStripeCustomeronConnectAccount = async (req, res, next) => {
    const customerId = req.user.id;

    // Step 1: Get salon's connected account
    const account = await salonDetail.findOne({
      where: { userId: req.body.salonId },
      attributes: ['id', 'connectAccountId'],
    });

    if (!account) {
      return res.status(200).json({
        status: '0',
        message: 'Salon account not found',
      });
    }

    const connectAccountId = account.connectAccountId;

    // Step 2: Check if customer already exists on this connected account
    const existing = await customerOnConnectAccount.findOne({
      where: {
        userId: customerId,
        connectAccountId: connectAccountId,
      },
      attributes: ['customerId', 'connectAccountId', 'salonDetailId', 'userId'],
    });

    if (existing?.customerId) {
      const stripeCustomer = await Stripe.getCustomer(
        existing.customerId,
        connectAccountId
      );

      if (stripeCustomer) {
        return res.status(200).json({
          status: '1',
          message: 'Stripe Customer Fetched',
          data: {
            stripeCustomerId: existing.customerId,
            stripeAccountId: connectAccountId,
          },
        });
      }
    }

    // Step 3: Get user details to create customer
    const userDetails = await user.findByPk(customerId, {
      attributes: ['firstName', 'lastName', 'email'],
    });

    const fullName = `${userDetails.firstName} ${userDetails.lastName}`;
    const email = userDetails.email;

    // Step 4: Create new Stripe customer on connected account
    const stripeCustomerId = await Stripe.addCustomer(
      fullName,
      email,
      connectAccountId
    );

    // Step 5: Save to customerOnConnectAccount table
    await customerOnConnectAccount.create({
      userId: customerId,
      customerId: stripeCustomerId,
      connectAccountId: connectAccountId,
      status: true,
      salonDetailId: account.id,
    });

    // Step 6: Update user table with stripeCustomerId
    await user.update({ stripeCustomerId }, { where: { id: customerId } });

    // Step 7: Return success response
    return res.status(200).json({
      status: '1',
      message: 'Stripe customer initialized',
      data: {
        stripeCustomerId: stripeCustomerId,
        stripeAccountId: connectAccountId,
      },
    });
};











