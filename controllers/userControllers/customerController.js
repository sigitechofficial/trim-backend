const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })
const { CURRENCY_UNIT, STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } = process.env
const crypto = require('crypto')

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
  couponOnBooking,
  wallet,
  otpVerification,
  reason,
  subscriptions,
  allergies,
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
const EmailAppointmentToCustomer = require('../../helper/AppointmentEmailsToCustomer')
const testing = require('../../helper/testing')
const tankyou = require('../../helper/ThankYouForVisiting')
const DEMO = require('../../helper/demo')
const EmailResetPasswordOtpToAll = require('../../helper/ResetPasswordOtpToAll')
const WelcomeForBoth = require('../../helper/WelcomeForBoth')
const InviteEmployeeEmail = require('../../helper/inviteEmployee')
const ClingReminderEmail = require('../../helper/clingReminderEmail')
const PayoutBlockedEmail = require('../../helper/PayoutBlockedEmail')
const IncompleteRegistrationReminder = require('../../helper/IncompleteRegistrationReminder')
const CustomEmails = require('../../helper/CustomEmails')
const otpGenerator = require('otp-generator')
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
const Communication = require('../eventDrivenCommunication/appointmentCheckout')
const { findZones } = require('../../utils/zoneFind');

//! Return Function
//* DEMO. Eamil Testing ----------------------
const axios = require('axios')
const throwNotification = require('../../utils/throwNotification')

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
Communication.online(1167, 0, 5)
  return res.status(200).json(response({ data: {} }))
}

//* DEMO. Email Template Preview ----------------------
// Sends a real email to the provided address using any of the existing
// helper templates, populated with realistic dummy data so you can see
// exactly how the template will render in an inbox.
//
// POST /customer/template-preview
// Body: {
//   to: "you@example.com",                   // required - target inbox
//   template: "bookingCustomer",             // required - template key (see list below)
//   state: "book" | "cancel" | "reschudle",  // optional - only for appointment templates
//   overrides: { ... }                       // optional - partial object deep-merged into the dummy data
// }
//
// Available template keys:
//   welcomeCustomer, welcomeSalon,
//   otpSalonVerification, otpCustomerVerification,
//   forgetPasswordCustomer, forgetPasswordSalon,
//   deleteAccount, recoverAccount,
//   bookingCustomer, bookingSalon,
//   thankYou, inviteEmployee, clingReminder,
//   payoutBlocked, incompleteRegistration, customEmail,
//   demo
exports.sendTemplatePreview = async (req, res, next) => {
  try {
    const { to, template, state, overrides = {}, html } = req.body || {}

    if (!to || typeof to !== 'string') {
      return res
        .status(400)
        .json(response({ status: 'Error', statusCode: 400, message: '`to` (email) is required' }))
    }
    if (!template || typeof template !== 'string') {
      return res
        .status(400)
        .json(
          response({
            status: 'Error',
            statusCode: 400,
            message: '`template` is required (see controller for the list of valid keys)',
          }),
        )
    }

    const merge = (base, extra) => {
      if (!extra || typeof extra !== 'object') return base
      const out = Array.isArray(base) ? [...base] : { ...base }
      for (const key of Object.keys(extra)) {
        const bv = out[key]
        const ev = extra[key]
        if (
          bv &&
          ev &&
          typeof bv === 'object' &&
          typeof ev === 'object' &&
          !Array.isArray(bv) &&
          !Array.isArray(ev)
        ) {
          out[key] = merge(bv, ev)
        } else {
          out[key] = ev
        }
      }
      return out
    }

    // Shared dummy appointment payload used by the booking / thankYou templates.
    const buildAppointmentDummy = () =>
      merge(
        {
          id: 999001,
          on: new Date().toISOString().split('T')[0],
          startTime: '10:00 AM',
          endTime: '11:00 AM',
          total: 45,
          duration: 60,
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: to,
            countryCode: '+44',
            phoneNum: '7123456789',
          },
          salonDetail: {
            id: 1,
            salonName: 'Trim Demo Salon',
            businessEmail: 'salon-demo@trimworldwide.com',
            user: { email: 'salon-demo@trimworldwide.com' },
            addressDB: {
              streetAddress: '221B Baker Street',
              province: 'London',
              country: 'United Kingdom',
            },
          },
          jobs: [
            {
              total: 25,
              duration: 30,
              on: new Date().toISOString().split('T')[0],
              startTime: '10:00 AM',
              endTime: '10:30 AM',
              service: { serviceName: 'Haircut' },
              employee: { user: { firstName: 'Alex', lastName: 'Stylist' } },
            },
            {
              total: 20,
              duration: 30,
              on: new Date().toISOString().split('T')[0],
              startTime: '10:30 AM',
              endTime: '11:00 AM',
              service: { serviceName: 'Beard Trim' },
              employee: { user: { firstName: 'Alex', lastName: 'Stylist' } },
            },
          ],
        },
        overrides,
      )

    const stateValue = state || 'book'
    const key = String(template).trim()

    switch (key) {
      case 'welcomeCustomer': {
        const name = overrides?.name || 'John'
        WelcomeForBoth(to, name, 'customer')
        break
      }
      case 'welcomeSalon': {
        const name = overrides?.name || 'Trim Demo Salon'
        WelcomeForBoth(to, name, 'salon')
        break
      }

      case 'otpSalonVerification': {
        const payload = merge(
          { firstName: 'John', lastName: 'Doe', email: to },
          overrides,
        )
        EmailResetPasswordOtpToAll('123456', payload, 'verification', 'salon')
        break
      }
      case 'otpCustomerVerification': {
        const payload = merge(
          { firstName: 'John', lastName: 'Doe', email: to },
          overrides,
        )
        EmailResetPasswordOtpToAll('123456', payload, 'verification', 'customer')
        break
      }
      case 'forgetPasswordCustomer': {
        const payload = merge(
          { firstName: 'John', lastName: 'Doe', email: to },
          overrides,
        )
        EmailResetPasswordOtpToAll('123456', payload, 'forgetPassword', 'customer')
        break
      }
      case 'forgetPasswordSalon': {
        const payload = merge(
          { firstName: 'John', lastName: 'Doe', email: to },
          overrides,
        )
        EmailResetPasswordOtpToAll('123456', payload, 'forgetPassword', 'salon')
        break
      }
      case 'deleteAccount': {
        const payload = merge(
          { firstName: 'John', lastName: 'Doe', email: to },
          overrides,
        )
        EmailResetPasswordOtpToAll('123456', payload, 'deleteAccount', 'customer')
        break
      }
      case 'recoverAccount': {
        const payload = merge(
          { firstName: 'John', lastName: 'Doe', email: to },
          overrides,
        )
        EmailResetPasswordOtpToAll('123456', payload, 'recoverAccount', 'customer')
        break
      }

      case 'bookingCustomer': {
        const payload = buildAppointmentDummy()
        EmailAppointmentToCustomer(to, payload, stateValue)
        break
      }
      case 'bookingSalon': {
        const payload = buildAppointmentDummy()
        EmailAppointmentToSalon(to, payload, stateValue)
        break
      }

      case 'thankYou': {
        const payload = {
          appointment: buildAppointmentDummy(),
          salon: { salonName: 'Trim Demo Salon' },
        }
        tankyou(to, merge(payload, overrides))
        break
      }

      case 'inviteEmployee': {
        const payload = merge(
          {
            name: 'Jane Barber',
            salonName: 'Trim Demo Salon',
            email: to,
          },
          overrides,
        )
        InviteEmployeeEmail([to], payload)
        break
      }

      case 'clingReminder': {
        const payload = merge(
          { firstName: 'John', lastName: 'Doe', email: to },
          overrides,
        )
        ClingReminderEmail(payload)
        break
      }

      case 'payoutBlocked': {
        const payload = merge(
          {
            email: to,
            firstName: 'John',
            lastName: 'Doe',
            salonName: 'Trim Demo Salon',
            disabledReason: 'requirements.past_due',
            capabilityStatus: 'inactive',
          },
          overrides,
        )
        PayoutBlockedEmail(payload)
        break
      }

      case 'incompleteRegistration': {
        const payload = merge(
          {
            email: to,
            firstName: 'John',
            lastName: 'Doe',
            profileCompletion: {
              hasBusinessDetails: true,
              hasBusinessAddress: true,
              hasServiceList: false,
              hasWorkingHours: true,
              hasTeamMembers: false,
              hasSubscription: false,
              accountConnected: false,
            },
          },
          overrides,
        )
        IncompleteRegistrationReminder(payload)
        break
      }

      case 'customEmail': {
        const payload = merge(
          {
            email: to,
            greetings: 'Hi John!',
            content:
              'This is a custom email preview. You can override the `greetings` and `content` fields via the overrides object.',
          },
          overrides,
        )
        CustomEmails(payload)
        break
      }

      case 'demo': {
        const htmlBody =
          (typeof html === 'string' && html) ||
          overrides?.html ||
          '<h1>Demo template preview</h1><p>This is a demo email sent through the template-preview endpoint.</p>'
        DEMO(htmlBody)
        break
      }

      default:
        return res.status(400).json(
          response({
            status: 'Error',
            statusCode: 400,
            message: `Unknown template key: "${key}"`,
            data: {
              validTemplates: [
                'welcomeCustomer',
                'welcomeSalon',
                'otpSalonVerification',
                'otpCustomerVerification',
                'forgetPasswordCustomer',
                'forgetPasswordSalon',
                'deleteAccount',
                'recoverAccount',
                'bookingCustomer',
                'bookingSalon',
                'thankYou',
                'inviteEmployee',
                'clingReminder',
                'payoutBlocked',
                'incompleteRegistration',
                'customEmail',
                'demo',
              ],
            },
          }),
        )
    }

    return res.status(200).json(
      response({
        message: `Template "${key}" dispatched to ${to}`,
        data: { template: key, to, state: stateValue },
      }),
    )
  } catch (error) {
    console.error('sendTemplatePreview failed:', error)
    return res.status(500).json(
      response({
        status: 'Error',
        statusCode: 500,
        message: 'Failed to send template preview',
        data: { error: error.message },
      }),
    )
  }
}

//* DEMO. Notification Testing ----------------------

exports.notificationTesting = async (req, res, next) => {
  try {
    const { to, title, body, data } = req.body;
    
    // Default test notification if no data provided
    const customerNotification = {
      title: title || `TEST NOTIFICATION`,
      body: body || `This is a test notification to verify your notification system is working properly!`,
    }

    // Default test data
    const testData = data || {
      type: 'test',
      timestamp: new Date().toISOString(),
      message: 'Notification test successful'
    }

    // Default test tokens if none provided
    const testTokens = to || ['test-token-1', 'test-token-2'];

    console.log('🧪 Testing notification with:', {
      to: testTokens,
      notification: customerNotification,
      data: testData
    });
    
    // Send the test notification
    await throwNotification(testTokens, customerNotification, testData);

    return res.status(200).json({
      success: true,
      message: 'Test notification sent successfully',
      data: {
        sentTo: testTokens,
        notification: customerNotification,
        testData: testData
      }
    });
  } catch (error) {
    console.error('❌ Notification test failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Notification test failed',
      error: error.message
    });
  }
}

//* 1.Get Home ----------------------

// exports.home = async (req, res, next) => {
//   const currentDay = CustomDate.currentDay()

//   // ✅ Support both POST (body) and GET (query)
//   const targetLat = req.body?.targetLat || req.query?.targetLat
//   const targetLng = req.body?.targetLng || req.query?.targetLng
//   const rangeInKm = req.body?.rangeInKm || req.query?.rangeInKm || 15
//   const condition = { status: true }

//   // Price condition for filtering salons
//   const priceCondition = req.body?.price || req.query?.price
//     ? { price: { [Op.lte]: req.body?.price || req.query?.price } }
//     : {}

//   // Filter by day and time
//   if ((req.body.day || req.query.day) && (req.body.startTime || req.query.startTime) && (req.body.endTime || req.query.endTime)) {
//     condition.day = req.body.day || req.query.day
//     condition.openingTime = { [Op.lte]: req.body.startTime || req.query.startTime }
//     condition.closingTime = { [Op.gte]: req.body.endTime || req.query.endTime }
//   }
  
//   // Haversine formula for distance calculation
//   const formula = `(6371 * 
//     acos(
//       cos(radians(${targetLat})) * cos(radians(lat)) * 
//       cos(radians(lng) - radians(${targetLng})) + 
//       sin(radians(${targetLat})) * sin(radians(lat))
//     )
//   )`

//   // Fetch favorite salon IDs
//   const likedSalons = await favorite.findAll({
//     where: { userId: req?.user?.id || 0 },
//     attributes: ['salonDetailId'],
//   })
//   const likeIds =
//     likedSalons?.length > 0 ? likedSalons.map((ele) => ele.salonDetailId) : []

//   // Base salon condition
//   const salonCondition = {
//     [Op.or]: [
//       { isExternalEmployee: true },
//       { registrationExpiryDate: { [Op.gte]: currentDay.currentDateOnly } },
//     ],
//     approvedByAdmin: true,
//     status: 1,
//     deleted: 0,
//   }

//   // Find zone based on customer's lat/lng
//   let customerZoneId = null
//   let customerZoneName = null
//   if (targetLat && targetLng) {
//     const zones = await findZones(targetLat, targetLng)
//     if (zones && zones.length > 0) {
//       customerZoneId = zones[0].id // store scalar
//       customerZoneName = zones[0].zoneName || null
//     }
//   }

//   console.log("customerZone===================>>>>", customerZoneId)

//   if (req.params?.favorite && req?.user) {
//     if (likedSalons.length < 1) {
//       return res.status(200).json(response({ data: { slons: [] } }))
//     }
//     salonCondition.id = { [Op.or]: likeIds }
//   }

//   // Final conditions with optional filters
//   const finalSalonCondition = {
//     ...salonCondition,
//     ...(customerZoneId ? { zoneId: customerZoneId } : {}), // Filter by customer zoneId
//     ...((req.body.price || req.query.price) && {
//       id: {
//         [Op.in]: literal(`(
//           SELECT DISTINCT salonDetailId FROM services
//           WHERE services.salonDetailId = salonDetail.id 
//             AND services.price <= ${req.body.price || req.query.price}
//         )`),
//       },
//     }),
//     ...((req.body.day || req.query.day) &&
//       (req.body.time || req.query.time) && {
//         id: {
//           [Op.in]: literal(`(
//           SELECT DISTINCT salonDetailId FROM times
//           WHERE times.salonDetailId = salonDetail.id 
//             AND times.day = '${req.body.day || req.query.day}' 
//             AND times.openingTime <= '${req.body.time || req.query.time}' 
//             AND times.closingTime >= '${req.body.time || req.query.time}'
//         )`),
//         },
//       }),
//     ...(req?.body?.serviceType || req?.query?.serviceType
//       ? {
//           id: {
//             [Op.in]: literal(`(
//               SELECT DISTINCT salonDetailId FROM services
//               WHERE services.salonDetailId = salonDetail.id 
//                 AND services.serviceTypeId = ${req?.body?.serviceType || req?.query?.serviceType}
//             )`),
//           },
//         }
//       : {}),
//   }

//   // Query salons
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
//           'zoneId'
//         ],
//         // No zoneId filtering here, as it is done directly on salonDetail
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
//     having: !req.params?.favorite
//       ? literal(`${formula} <= ${rangeInKm}`)
//       : undefined,
//   }

//   // Always include distance if lat/lng are provided
//   if (targetLat && targetLng) {
//     body.attributes.push([literal(`${formula}`), 'distance'])
//     body.order = [[literal('distance'), 'ASC']]  // SORT BY DISTANCE ASC
//   }

//   // Fetch salon results
//   let results = await salonDetail.findAll(body)
//   results = JSON.parse(JSON.stringify(results))

//   // Map salons with like and max discount
//   if (results.length > 0) {
//     results = results.map((salon) => {
//       const found = likeIds.some((id) => id === salon.id)
//       const discounts = (salon.services || []).map((s) => s.discount || 0)
//       const maxDiscount = discounts.length > 0 ? Math.max(...discounts) : 0
//       return { ...salon, like: found, averageDiscount: maxDiscount }
//     })
//   }

//   // Fetch customer appointments
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
//           attributes: ['id', 'salonName', 'coverImage'],
//           include: [
//             { model: addressDBS, attributes: [`streetAddress`, `city`] },
//             { model: rating, attributes: [] },
//           ],
//         },
//         { model: jobs, attributes: [] },
//       ],
//       order: [['id', 'DESC']],
//     })
//   }

//   // Compute global highest and lowest service prices across all salons
//   const allServicePrices = results.flatMap(salon =>
//     (salon.services || []).map(s => Number(s.price))
//   )

//   const highestPriceAcrossAllSalons = allServicePrices.length > 0
//     ? Number(Math.max(...allServicePrices)).toFixed(2)
//     : "0.00"

//   const lowestPriceAcrossAllSalons = allServicePrices.length > 0
//     ? Number(Math.min(...allServicePrices)).toFixed(2)
//     : "0.00"

//   // Final response
//   const output = {
//     data: {
//       slons: results,
//       appointments,
//       currencyUnit: CURRENCY_UNIT,
//       distanceUnit: 'km',
//       highestPriceAcrossAllSalons,
//       lowestPriceAcrossAllSalons,
//       customerZone: customerZoneId ? { id: customerZoneId, name: customerZoneName } : null
//     },
//   }

//   // For favorites: keep distance + other salon fields, just drop appointments
//   if (req.params.favorite) {
//     delete output.data.appointments
//   }

//   return res.status(200).json(response(output))
// }

exports.home = async (req, res, next) => {
  const currentDay = CustomDate.currentDay();

  // ✅ Support both POST (body) and GET (query)
  const targetLat = req.body?.targetLat || req.query?.targetLat;
  const targetLng = req.body?.targetLng || req.query?.targetLng;
  const rangeInKm = req.body?.rangeInKm || req.query?.rangeInKm || 15;

  // Build time filter if provided
  const timeCondition = {};
  if ((req.body.day || req.query.day) && (req.body.startTime || req.query.startTime) && (req.body.endTime || req.query.endTime)) {
    timeCondition.day = req.body.day || req.query.day;
    timeCondition.openingTime = { [Op.lte]: req.body.startTime || req.query.startTime };
    timeCondition.closingTime = { [Op.gte]: req.body.endTime || req.query.endTime };
  }

  // Fetch favorite salon IDs for this user (if any)
  const likedSalons = await favorite.findAll({
    where: { userId: req?.user?.id || 0 },
    attributes: ['salonDetailId'],
  });
  const likeIds = likedSalons?.length ? likedSalons.map(e => e.salonDetailId) : [];

  // Base salon filter (no zone filter at all)
  const salonCondition = {
    [Op.or]: [
      {
        // External employee salons are only visible if their parent salon has an active subscription
        isExternalEmployee: true,
        parentSalonId: {
          [Op.in]: literal(`(
            SELECT id FROM salonDetails
            WHERE registrationExpiryDate >= '${currentDay.currentDateOnly}'
            AND (
              subscriptionLatestPaymentStatus IS NULL
              OR subscriptionLatestPaymentStatus NOT IN ('expired', 'cancelled', 'canceled', 'payment_failed', 'paused', 'refunded')
            )
          )`),
        },
      },
      {
        registrationExpiryDate: { [Op.gte]: currentDay.currentDateOnly },
        subscriptionLatestPaymentStatus: {
          [Op.notIn]: ['expired','payment_failed', 'paused', 'refunded'],
        },
      },
    ],
    approvedByAdmin: true,
    status: 1,
    deleted: 0,
  };

  // If asking only for favorites
  if (req.params?.favorite && req?.user) {
    if (!likeIds.length) {
      return res.status(200).json(response({ data: { slons: [] } }));
    }
    salonCondition.id = { [Op.or]: likeIds };
  }

  // Haversine formula for distance (km)
  const formula = `(6371 *
    acos(
      cos(radians(${targetLat})) * cos(radians(lat)) *
      cos(radians(lng) - radians(${targetLng})) +
      sin(radians(${targetLat})) * sin(radians(lat))
    )
  )`;

  // Optional filters (price, time, service type) added via subqueries
  const finalSalonCondition = {
    ...salonCondition,

    // Distance gating only when coords are provided
    ...(targetLat && targetLng ? { [Op.and]: literal(`${formula} <= ${rangeInKm}`) } : {}),

    // Max price across any service in the salon
    ...((req.body.price || req.query.price) && {
      id: {
        [Op.in]: literal(`(
          SELECT DISTINCT services.salonDetailId
          FROM services
          WHERE services.salonDetailId = salonDetail.id
            AND services.price <= ${req.body?.price || req.query?.price}
        )`),
      },
    }),

    // Day/time availability
    ...((req.body.day || req.query.day) && (req.body.time || req.query.time) && {
      id: {
        [Op.in]: literal(`(
          SELECT DISTINCT times.salonDetailId
          FROM times
          WHERE times.salonDetailId = salonDetail.id
            AND times.day = '${req.body?.day || req.query?.day}'
            AND times.openingTime <= '${req.body?.time || req.query?.time}'
            AND times.closingTime >= '${req.body?.time || req.query?.time}'
        )`),
      },
    }),

    // Service type filter
    ...((req.body.serviceType || req.query.serviceType) && {
      id: {
        [Op.in]: literal(`(
          SELECT DISTINCT services.salonDetailId
          FROM services
          WHERE services.salonDetailId = salonDetail.id
            AND services.serviceTypeId = ${req.body?.serviceType || req.query?.serviceType}
        )`),
      },
    }),
  };

  // Build query
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
          // ⛔️ zoneId removed from filtering entirely; just return whatever is stored
          'zoneId',
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

    // When NOT favorites view, apply HAVING distance <= range
    having: !req.params?.favorite ? literal(`${formula} <= ${rangeInKm}`) : undefined,
  };

  // Always compute/sort by distance if coords present
  if (targetLat && targetLng) {
    body.attributes.push([literal(`${formula}`), 'distance']);
    body.order = [[literal('distance'), 'ASC']];
  }

  // Fetch salons
  let results = await salonDetail.findAll(body);
  results = JSON.parse(JSON.stringify(results));

  // Add like + average/max discount (choose one; here we use max for usefulness)
  if (results.length) {
    results = results.map(salon => {
      const liked = likeIds.includes(salon.id);
      const discounts = (salon.services || []).map(s => s.discount || 0);
      const maxDiscount = discounts.length ? Math.max(...discounts) : 0;
      return { ...salon, like: liked, averageDiscount: maxDiscount };
    });

    // Keep distance sort (already applied). If you want to sort by discount instead, comment next line.
    // results.sort((a, b) => b.averageDiscount - a.averageDiscount);
  }

  // Upcoming/pending appointments for this customer (for the home header)
  let appointments = [];
  if (req.user && req.user.id) {
    appointments = await booking.findAll({
      where: {
        customerId: req.user.id,
        status: { [Op.or]: ['pending', 'book'] },
      },
      attributes: [
        'id',
        'status',
        'startTime',
        'endTime',
        'on',
        'total',
        'actualCapturedAmount',
        [literal(`(SELECT COUNT(*) FROM jobs WHERE jobs.bookingId = booking.id)`), 'serviceCount'],
      ],
      include: [
        {
          model: salonDetail,
          attributes: ['id', 'salonName', 'coverImage'],
          include: [
            { model: addressDBS, attributes: ['streetAddress', 'city'] },
            { model: rating, attributes: [] },
          ],
        },
        { model: jobs, attributes: [] },
      ],
      order: [['id', 'DESC']],
    });
  }

  // Global min/max price across returned salons
  const allServicePrices = results.flatMap(s => (s.services || []).map(x => Number(x.price)));
  const highestPriceAcrossAllSalons = allServicePrices.length ? Number(Math.max(...allServicePrices)).toFixed(2) : '0.00';
  const lowestPriceAcrossAllSalons  = allServicePrices.length ? Number(Math.min(...allServicePrices)).toFixed(2) : '0.00';

  // Final response
  const payload = {
    data: {
      slons: results,
      appointments,
      currencyUnit: CURRENCY_UNIT,
      distanceUnit: 'km',
      highestPriceAcrossAllSalons,
      lowestPriceAcrossAllSalons,
      // ⛔️ customerZone removed entirely
    },
  };

  if (req.params?.favorite) {
    delete payload.data.appointments;
  }

  return res.status(200).json(response(payload));
};


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
      'isVATRegistered',
      'vatType',
      'platformFee',
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
          'vatAmount',
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
  const userId = req.user.id;
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

  await booking.update(
    {
      total:req.body.total,
    },
    { where: { id: bookingId } },
  )

  if(req.body.isCouponApplied===false){
    await couponOnBooking.update(
      {
        isCouponUsed: false,
      },
      { where: { bookingId: bookingId, userId: userId } },
    )

    await booking.update(
      {
        total:req.body.total,
        discount:0,
        vatAmount:req.body.vatOriginalAmount,
      },
      { where: { id: bookingId } },
    )
  }
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
  const userId = req.user.id;

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

  await booking.update(
    {
      total:req.body.total,
    },
    { where: { id: bookingId } },
  )

  if(req.body.isCouponApplied===false){
    await couponOnBooking.update(
      {
        isCouponUsed: false,
      },
      { where: { bookingId: bookingId, userId: userId } },
    )

    await booking.update(
      {
        total:req.body.total,
        discount:0.00,
      },
      { where: { id: bookingId } },
    )
  }
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

      let refundAmount = paid - cancellationCharges
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
        bookingData,
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

  // appointment.actualCapturedAmount =
  //   parseFloat(appointment?.actualCapturedAmount) - parseFloat(appointment?.tip)

  // appointment.initialPayment =
  //   parseFloat(appointment?.initialPayment) - parseFloat(appointment?.tip)

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

  // Charge upfront amount if payment intent is provided and payment method is card
  if (req.body.paymentMethod === 'card' && req.body.initialPaymentIntend && appointment.initialPayment > 0) {
    try {
      // Get salon's connected account
      const salon = await salonDetail.findByPk(appointment.salonDetailId, {
        attributes: ['connectAccountId']
      });

      if (!salon || !salon.connectAccountId) {
        await booking.destroy({ where: { id: book.id } });
        throw new AppError('Salon connected account not found', 200);
      }

      // Get customer's stripe customer ID on connected account
      const client = await user.findByPk(customerId, {
        attributes: ['stripeCustomerId'],
      });

      if (!client?.stripeCustomerId) {
        await booking.destroy({ where: { id: book.id } });
        throw new AppError('Customer Stripe ID not found', 200);
      }

      // Verify customer exists on connected account
      const confirmCustomerId = await Stripe.getCustomer(
        client.stripeCustomerId,
        salon.connectAccountId
      );

      if (!confirmCustomerId) {
        await booking.destroy({ where: { id: book.id } });
        throw new AppError('Customer not found on salon Stripe account', 200);
      }

      // Calculate expected amount (upfront + tip)
      const tipAmount = appointment.tip || 0;
      const expectedAmount = appointment.initialPayment + tipAmount;

      // Retrieve and confirm payment intent
      const confirmedPayment = await Stripe.retrieveAndConfirmPaymentIntent(
        req.body.initialPaymentIntend,
        appointment.stripeCardId,
        salon.connectAccountId
      );

      // Check if payment succeeded
      if (confirmedPayment.status !== 'succeeded') {
        await booking.destroy({ where: { id: book.id } });
        throw new AppError(`Payment failed with status: ${confirmedPayment.status}`, 200);
      }

      // Verify the charged amount matches expected amount (allow small rounding differences)
      const chargedAmount = confirmedPayment.amount / 100; // Convert from cents to pounds
      const amountDifference = Math.abs(chargedAmount - expectedAmount);
      
      if (amountDifference > 0.01) { // Allow 1 penny difference for rounding
        console.warn(`⚠️ Amount mismatch: Expected £${expectedAmount}, Charged £${chargedAmount}`);
        // Don't fail, but log the warning
      }

      // Update booking with actual captured amount
      // actualCapturedAmount should be the upfront amount (excluding tip)
      const actualUpfrontAmount = appointment.initialPayment;

      await book.update({
        actualCapturedAmount: actualUpfrontAmount,
        initialPaymentIntend: confirmedPayment.id,
      });

      console.log(`✅ Upfront payment charged: £${actualUpfrontAmount} (Total charged: £${chargedAmount}, Tip: £${tipAmount})`);

    } catch (error) {
      // Rollback booking if payment fails
      await booking.destroy({ where: { id: book.id } });
      console.error('❌ Payment charge failed, booking rolled back:', error.message);
      throw new AppError(`Payment failed: ${error.message}`, 200);
    }
  } else if (req.body.paymentMethod === 'cash') {
    // For cash payments, set actualCapturedAmount to 0
    await book.update({
      actualCapturedAmount: 0,
    });
  } else if (req.body.paymentMethod === 'card' && appointment.initialPayment === 0) {
    // If card payment but no upfront amount, set actualCapturedAmount to 0
    await book.update({
      actualCapturedAmount: 0,
    });
  }

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
  

  if(req.body.couponId){
    const bookingCouponId = await couponOnBooking.update(
      { bookingId: book.id },
      { where: { couponId: req.body.couponId, bookingId: null, userId: customerId} }
    )
    if(!bookingCouponId){
      throw new AppError('Something went wrong coupon not linked to booking', 200);
    }
  }

  const salon = await salonDetail.findByPk(book.salonDetailId, {
    attributes: ['connectAccountId']
  });

  if(book.initialPaymentIntend){
    // Fetch customer email for metadata
    const customer = await user.findByPk(customerId, {
      attributes: ['email']
    });
    const customerEmail = customer?.email || '';
    
    Stripe.updatePaymentIntentDescription(
      book.initialPaymentIntend, 
      book, 
      salon.connectAccountId,
      customerEmail
    )
  }

  socketForCalendar({ appointmentId: book?.id, type: 'new' })

  onlineAppointmentConfirm(book?.id)

  const output = response({
    message: 'Booked',
    data: { appointment: book?.id },
  })
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
  
  // Create connection token for Stripe Terminal
  // In live mode, you need to pass a location ID
  // For now, we're passing null which works in test mode
  // In production, you'll need to provide an actual location ID
  const connectionToken = await Stripe.createConnectionToken(null, null)

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
    connectionToken: connectionToken,
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
      'platformFee',
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
      'stripeCardId',
      'feedback',
      'salonReply',
      'vatAmount',
      'vatOriginalAmount',
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
      {
        model: couponOnBooking,
        where:{
          isCouponUsed:true,
        },
        attributes: ['id', 'isCouponUsed', 'couponId', 'bookingId'],
        required: false, // LEFT JOIN - include booking even if no coupon
        include: [
          {
            model: coupon,
            attributes: ['id', 'promoCode', 'type', 'value', 'status', 'from', 'till'],
            include: [
              {
                model: couponTimeSlot,
                attributes: ['id', 'day', 'timeFrom', 'timeTo']
              }
            ]
          }
        ]
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

  if (output.couponOnBooking && Array.isArray(output.couponOnBooking) && output.couponOnBooking.length === 0) {
    output.couponOnBooking = null
  }

  // Calculate payment breakdown for "pay on the day" tracking
  const upfrontAmount = parseFloat(output.initialPayment || 0)
  const totalCapturedAmount = parseFloat(output.actualCapturedAmount || 0)
  let payOnTheDayAmount = Math.max(0, totalCapturedAmount - upfrontAmount) // Amount received at checkout
  const remainingAmount = Math.max(0, parseFloat(output.total || 0) - totalCapturedAmount) // Amount still pending (if any)
  
  // If payOnTheDayAmount is 0, use the remaining amount instead
  if (payOnTheDayAmount === 0) {
    payOnTheDayAmount = remainingAmount
  }
  
  // Add payment breakdown to output
  output.paymentBreakdown = {
    upfrontAmount: upfrontAmount, // Amount paid upfront when booking
    payOnTheDayAmount: payOnTheDayAmount, // Amount received later at checkout
    totalAmountReceived: totalCapturedAmount, // Total amount received (upfront + checkout)
    remainingAmount: remainingAmount, // Amount still pending (if any)
  }

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

  // Check salon subscription status
  let subscriptionExpire = false
  if (output.salonDetail && output.salonDetail.id) {
    const salonSubscription = await subscriptions.findOne({
      where: { salonDetailId: output.salonDetail.id },
      attributes: ['subscriptionId'],
      order: [['createdAt', 'DESC']], // Get the latest subscription
    })

    if (salonSubscription && salonSubscription.subscriptionId) {
      const subscriptionStatus = await Stripe.getSubscriptionStatus(salonSubscription.subscriptionId)
      
      // Check if subscription is cancelled
      if (subscriptionStatus === 'canceled' || subscriptionStatus === 'cancelled') {
        subscriptionExpire = true
      }
    }
  }

  // Fetch card details if payment method is card
  let cardDetails = null
  if (output.paymentMethod === 'card' && output.stripeCardId && output.salonDetail?.connectAccountId) {
    try {
      const cardInfo = await Stripe.retrievePaymentMethod(
        output.stripeCardId,
        output.salonDetail.connectAccountId
      )
      if (cardInfo && cardInfo.last4) {
        cardDetails = {
          last4: cardInfo.last4,
          brand: cardInfo.brand || null,
          expMonth: cardInfo.exp_month || null,
          expYear: cardInfo.exp_year || null,
        }
      }
    } catch (error) {
      console.warn(`Failed to retrieve card details for booking ${id}:`, error.message)
      // Continue without card details if retrieval fails
    }
  }

  return res.status(200).json(
    response({
      data: { 
        appointments: output, 
        policies, 
        currencyUnit: CURRENCY_UNIT,
        subscriptionExpire,
        cardDetails,
      },
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

  const userId = req.user.id;
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
  console.log("req.body================>>>", req.body);

  if (!salonId || !promoCode || !bookingStartTime || !bookingEndTime) {
    throw new AppError(
      'salonId, promoCode, bookingStartTime, and bookingEndTime are required',
      200
    );
  }

  // 2️⃣ Determine date and day to check
  const dateToCheck = bookingDate || currentDay.currentDateOnly;
  console.log("dateToCheck===========>>",dateToCheck)
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
  
  console.log("Data====>", data);

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
    // One-time per customer (kept exactly as you had it)
    const exist = await couponOnBooking.findOne({
      where: {
        couponId: data.id,
        isCouponUsed: true,
        userId: userId,
        bookingId: {
        [Op.ne]: null,
      },
      },
    });

    if (exist) {
      throw new AppError(
        `You've already redeemed this one-time coupon, so it can't be used again.`,
        200
      );
    }

    // Keeping your original in-memory assignments (no DB writes here)
    data.limit = 1;
    data.applied = 0;

  } else {
    // ✅ Limited overall usage: increment `applied` atomically (NO TRANSACTION)
    const [updated] = await coupon.update(
      { applied: literal('applied + 1') },
      {
        where: {
          id: data.id,
          status: 'active',
          applied: { [Op.lt]: col('limit') },       // guard against overrun
          from: { [Op.lte]: dateToCheck },          // still within window
          till: { [Op.gte]: dateToCheck },
        },
      }
    );
    
    console.log("updated============================>>",updated)

    if (updated === 0) {
      // Either limit reached or state changed between validation and increment
      throw new AppError(`This coupon has reached its usage limit.`, 200);
    }
  }

  const findCouponOnBooking = await couponOnBooking.findOne({
    where: {
      couponId: data.id,
      isCouponUsed: true,
      userId: userId,
      bookingId: {
      [Op.ne]: null,
    },
    },
  });
  
  // if(findCouponOnBooking){
  //   throw new AppError(`This coupon has already been used.`, 200);
  // }

  // 7️⃣ Create couponOnBooking record to track coupon usage
    await couponOnBooking.create({
      couponId: data.id,
      isCouponUsed: true,
      userId: userId,
    });
    console.log(`✅ Coupon tracking record created for coupon ID: ${data.id}`);

  // 8️⃣ Return success
  const output = response({
    message: 'Success',
    data: { promoCode: data },
  });
  return res.status(200).json(output);
};

//* Test Coupon Tracking -----------------
exports.testCouponTracking = async (req, res, next) => {
    const { couponId } = req.body;
    
    if (!couponId) {
      throw new AppError('couponId is required', 200);
    }

    // Check if couponOnBooking record exists
    const trackingRecord = await couponOnBooking.findOne({
      where: {
        couponId: couponId
      },
      include: [
        {
          model: coupon,
          attributes: ['id', 'promoCode', 'type', 'value']
        }
      ]
    });

    if (!trackingRecord) {
      throw new AppError('No tracking record found for this coupon', 200);
    }

    const output = response({
      message: 'Coupon tracking record found',
      data: {
        couponId: trackingRecord.couponId,
        isCouponUsed: trackingRecord.isCouponUsed,
        coupon: trackingRecord.coupon,
      },
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
//* 1. Customer Account Delete (Single API - No OTP)
exports.accountDelete = async (req, res, next) => {
  const id = req.user.id
  const { reasonId } = req.body

  if (!reasonId) {
    throw new AppError('Reason ID is required', 200)
  }

  // Validate reason exists
  const reasonData = await reason.findOne({
    where: { id: reasonId, status: true },
  })

  if (!reasonData) {
    throw new AppError('Invalid reason or reason not found', 200)
  }

  // Get user data before deletion
  const data = await user.findOne({
    where: { id },
    attributes: [
      'id',
      'firstName',
      'lastName',
      'image',
      'email',
      'countryCode',
      'phoneNum',
      'password',
      'stripeCustomerId',
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

  // Generate recovery token (32 bytes = 64 hex characters)
  const recoveryToken = crypto.randomBytes(32).toString('hex')
  console.log('🔍 Generated Recovery Token:', recoveryToken)
  console.log('🔍 Recovery Token Length:', recoveryToken.length)

  // Save to deletedCustomer table with reasonId and recoveryToken
  try {
    const createdRecord = await deletedCustomer.create({
      userId: id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      countryCode: data.countryCode,
      phoneNum: data.phoneNum,
      image: data.image,
      password: data.password,
      stripeCustomerId: data.stripeCustomerId,
      deletedAt: new Date(),
      recovered: false,
      permanentlyDeleted: false,
      reasonId: reasonId,
      recoveryToken: recoveryToken,
    })

    console.log('✅ Created DeletedCustomer Record ID:', createdRecord.id)
    console.log('✅ Saved Recovery Token:', createdRecord.recoveryToken)
    console.log('✅ Saved Token Length:', createdRecord.recoveryToken?.length)
    console.log('✅ Token Match Check:', createdRecord.recoveryToken === recoveryToken)
    
    // Verify it was saved correctly by querying it back
    const verifyRecord = await deletedCustomer.findByPk(createdRecord.id, {
      attributes: ['id', 'email', 'recoveryToken', 'userId'],
    })
    console.log('✅ Verification - Record exists:', verifyRecord ? 'YES' : 'NO')
    if (verifyRecord) {
      console.log('✅ Verification - Token matches:', verifyRecord.recoveryToken === recoveryToken)
    }
  } catch (error) {
    console.error('❌ Error creating deletedCustomer record:', error)
    throw error
  }

  // Hard delete user (not anonymous)
  await user.destroy({ where: { id } })

  // Delete device tokens
  await deviceToken.destroy({ where: { userId: id } })

  // Do NOT delete from Stripe (keep stripeCustomerId)

  // Send recovery email immediately after deletion with recovery token
  const emailData = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    recoveryToken: recoveryToken,
  }
  // Send recovery email
  EmailResetPasswordOtpToAll(null, emailData, 'recoverAccount', 'customer')

  return res.json(response({ message: 'Account deleted successfully', data: {} }))
}

//* 2. Fetch Account Deletion Reasons
exports.fetchAccountDeletionReasons = async (req, res, next) => {
  // Fetch all active reasons (you can filter by type if needed)
  const reasons = await reason.findAll({
    where: { status: true },
    attributes: ['id', 'reason', 'type'],
    order: [['createdAt', 'DESC']],
  })

  return res.json(
    response({
      message: 'Account deletion reasons',
      data: { reasons },
    }),
  )
}

//!Account Recovery
//* 1. Recover Account via Token (Browser-based, no OTP)
exports.recoverAccountByToken = async (req, res, next) => {
  let { token } = req.query

  // Handle URL encoding - decode if needed
  if (token) {
    token = decodeURIComponent(token)
  }

  console.log('🔍 Recovery Token Received (raw):', req.query.token)
  console.log('🔍 Recovery Token Received (decoded):', token)
  console.log('🔍 Token Length:', token?.length)

  if (!token) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Account Recovery - Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #d32f2f; }
        </style>
      </head>
      <body>
        <h1 class="error">Invalid Recovery Link</h1>
        <p>The recovery link is invalid or missing.</p>
      </body>
      </html>
    `)
  }

  // Clean and trim the token
  const cleanToken = token.trim()

  console.log('🔍 Clean Token:', cleanToken)
  console.log('🔍 Clean Token Length:', cleanToken.length)

  // Find deleted customer by recovery token
  // Note: Using paranoid: false to include soft-deleted records if any
  const deletedData = await deletedCustomer.findOne({
    where: {
      recoveryToken: cleanToken,
      recovered: false,
      permanentlyDeleted: false,
    },
    paranoid: false, // Include soft-deleted records
  })

  console.log('🔍 Deleted Data Found:', deletedData ? 'YES' : 'NO')
  
  if (deletedData) {
    console.log('🔍 Deleted Data ID:', deletedData.id)
    console.log('🔍 Deleted Data Email:', deletedData.email)
    console.log('🔍 Deleted Data Token:', deletedData.recoveryToken)
    console.log('🔍 Deleted Data Token Length:', deletedData.recoveryToken?.length)
    console.log('🔍 Token Match:', deletedData.recoveryToken === cleanToken)
  } else {
    // Debug: Check if any records exist with similar tokens or all records
    const allRecords = await deletedCustomer.findAll({
      attributes: ['id', 'email', 'recoveryToken', 'recovered', 'permanentlyDeleted'],
      limit: 5,
      order: [['createdAt', 'DESC']],
    })
    console.log('🔍 Recent deletedCustomer records:', allRecords.length)
    allRecords.forEach((record, index) => {
      console.log(`🔍 Record ${index + 1}:`, {
        id: record.id,
        email: record.email,
        tokenLength: record.recoveryToken?.length,
        tokenStart: record.recoveryToken?.substring(0, 20),
        recovered: record.recovered,
        permanentlyDeleted: record.permanentlyDeleted,
      })
    })
    
    // Try to find by partial token match
    const partialMatch = await deletedCustomer.findOne({
      where: {
        recoveryToken: { [Op.like]: `${cleanToken.substring(0, 20)}%` },
      },
    })
    console.log('🔍 Partial token match found:', partialMatch ? 'YES' : 'NO')
  }

  if (!deletedData) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Account Recovery - Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #d32f2f; }
        </style>
      </head>
      <body>
        <h1 class="error">Invalid Recovery Link</h1>
        <p>The recovery link is invalid or has already been used.</p>
        <p style="font-size: 12px; color: #999; margin-top: 20px;">Token: ${token?.substring(0, 20)}...</p>
      </body>
      </html>
    `)
  }

  // Check if recovery token has an expiry date
  // Currently, recovery tokens don't have an expiry field, so we check if it exists
  const tokenHasExpiry = deletedData.recoveryTokenExpiry || deletedData.tokenExpiry || deletedData.expiresAt
  
  // If token doesn't have expiry, generate new token, send recovery email, and proceed with recovery
  if (!tokenHasExpiry) {
    console.log('🔍 Recovery token has no expiry - generating new token and sending recovery email')
    
    // Generate new recovery token
    const newRecoveryToken = crypto.randomBytes(32).toString('hex')
    console.log('🔍 New Recovery Token Generated:', newRecoveryToken)
    console.log('🔍 New Recovery Token Length:', newRecoveryToken.length)
    
    // Update deletedCustomer record with new token
    await deletedCustomer.update(
      {
        recoveryToken: newRecoveryToken,
      },
      { where: { id: deletedData.id } },
    )
    
    // Send recovery email with new token
    const emailData = {
      firstName: deletedData.firstName,
      lastName: deletedData.lastName,
      email: deletedData.email,
      recoveryToken: newRecoveryToken,
    }
    
    // Send recovery email
    EmailResetPasswordOtpToAll(null, emailData, 'recoverAccount', 'customer')
    console.log('✅ New recovery email sent with updated token')
    
    // Update deletedData object with new token for subsequent processing
    deletedData.recoveryToken = newRecoveryToken
  }

  // Check if within 30 days
  const deletedAt = new Date(deletedData.deletedAt)
  const now = new Date()
  const daysDiff = Math.floor((now - deletedAt) / (1000 * 60 * 60 * 24))

  if (daysDiff > 30) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Account Recovery - Expired</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #d32f2f; }
        </style>
      </head>
      <body>
        <h1 class="error">Recovery Period Expired</h1>
        <p>The 30-day recovery period has expired. Your account cannot be recovered.</p>
      </body>
      </html>
    `)
  }

  // Get userId - use from deletedData or find by email
  let userIdToRestore = deletedData.userId
  
  if (!userIdToRestore) {
    // Fallback: Find user by email (including soft-deleted)
    const userByEmail = await user.findOne({
      where: { email: deletedData.email },
      paranoid: false, // Include soft-deleted records
      attributes: ['id'],
    })
    if (userByEmail) {
      userIdToRestore = userByEmail.id
    }
  }

  if (!userIdToRestore) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Account Recovery - Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #d32f2f; }
        </style>
      </head>
      <body>
        <h1 class="error">User Not Found</h1>
        <p>Unable to recover account. User record not found.</p>
      </body>
      </html>
    `)
  }

  // Check if user exists (including soft-deleted)
  const existingUser = await user.findByPk(userIdToRestore, {
    paranoid: false, // Include soft-deleted records
  })

  if (!existingUser) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Account Recovery - Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #d32f2f; }
        </style>
      </head>
      <body>
        <h1 class="error">User Not Found</h1>
        <p>Unable to recover account. User record not found.</p>
      </body>
      </html>
    `)
  }

  // Check if user is already recovered (not soft-deleted)
  if (!existingUser.deletedAt) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Account Recovery - Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #d32f2f; }
        </style>
      </head>
      <body>
        <h1 class="error">Account Already Recovered</h1>
        <p>Your account has already been recovered.</p>
      </body>
      </html>
    `)
  }

  try {
    // Restore user by updating the existing record (not creating new one)
    // Restore all original data from deletedCustomer and set deletedAt to null
    await user.update(
      {
        firstName: deletedData.firstName,
        lastName: deletedData.lastName,
        email: deletedData.email,
        countryCode: deletedData.countryCode || null,
        phoneNum: deletedData.phoneNum || '',
        image: deletedData.image || '',
        password: deletedData.password, // Already hashed
        stripeCustomerId: deletedData.stripeCustomerId || null,
        deleted: false,
        verifiedAt: new Date(),
        deletedAt: null, // This restores the soft-deleted user
      },
      {
        where: { id: userIdToRestore },
        paranoid: false, // Allow updating soft-deleted records
      },
    )

    // Fetch the restored user
    const restoredUser = await user.findByPk(userIdToRestore)

    // Mark as recovered in deletedCustomer
    await deletedCustomer.update(
      {
        recovered: true,
      },
      { where: { id: deletedData.id } },
    )

    // Return success HTML page
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Account Recovery - Success</title>
        <style>
          body { 
            font-family: 'Chivo', Arial, sans-serif; 
            text-align: center; 
            padding: 50px;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .success { color: #4caf50; }
          .button {
            display: inline-block;
            background-color: #000;
            color: #fff;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="success">✓ Account Recovered Successfully!</h1>
          <p>Your account has been successfully recovered. You can now log in to your account.</p>
          <a href="https://trimworldwide.com/SplashScreen" class="button">Go to Login</a>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    console.error('Recovery error:', error)
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Account Recovery - Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #d32f2f; }
        </style>
      </head>
      <body>
        <h1 class="error">Recovery Failed</h1>
        <p>An error occurred while recovering your account. Please try again or contact support.</p>
      </body>
      </html>
    `)
  }
}

//!Lambda Functions
//* 1. Account Recovery Reminder (Lambda - Daily Cron)
exports.accountRecoveryReminder = async (req, res, next) => {
  const now = new Date()
  
  // Calculate 30 days ago using JavaScript and convert to UTC start of day
  // This ensures consistent date calculations
  const today = new Date(now)
  today.setUTCHours(0, 0, 0, 0)
  
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30)
  
  console.log('today (UTC start)=====================>>>', today.toISOString())
  console.log('thirtyDaysAgo (UTC start)=====================>>>', thirtyDaysAgo.toISOString())
  console.log('now=====================>>>', now.toISOString())

  // DEBUG: First, check ALL deleted customers to see what's in the database
  // IMPORTANT: deletedCustomer model has paranoid: true, which filters out records with deletedAt IS NOT NULL
  // Since this table STORES deleted customer data (deletedAt is a regular field), we need paranoid: false
  const allDeletedCheck = await deletedCustomer.findAll({
    paranoid: false, // Override paranoid behavior - we want to see ALL records
    attributes: ['id', 'userId', 'email', 'deletedAt', 'recovered', 'permanentlyDeleted'],
    order: [['deletedAt', 'DESC']],
    limit: 10,
  })
  console.log('===== DEBUG: All deleted customers (first 10):', allDeletedCheck.length, '=====')
  allDeletedCheck.forEach(record => {
    const deletedAtDate = record.deletedAt ? new Date(record.deletedAt) : null
    console.log(`- id=${record.id}, deletedAt=${record.deletedAt} (ISO: ${deletedAtDate?.toISOString()}), recovered=${record.recovered}, permanentlyDeleted=${record.permanentlyDeleted}, email=${record.email}`)
  })

  // DEBUG: Check records that match the boolean conditions only
  const booleanMatchCheck = await deletedCustomer.findAll({
    paranoid: false, // Override paranoid behavior
    where: {
      recovered: false,
      permanentlyDeleted: false,
    },
    attributes: ['id', 'userId', 'email', 'deletedAt', 'recovered', 'permanentlyDeleted'],
    order: [['deletedAt', 'DESC']],
    limit: 10,
  })
  console.log(`===== DEBUG: Records matching boolean conditions (recovered=false, permanentlyDeleted=false): ${booleanMatchCheck.length} =====`)
  booleanMatchCheck.forEach(record => {
    const deletedAtDate = record.deletedAt ? new Date(record.deletedAt) : null
    console.log(`- id=${record.id}, deletedAt=${record.deletedAt} (ISO: ${deletedAtDate?.toISOString()}), email=${record.email}`)
    
    if (deletedAtDate) {
      const isWithin30Days = deletedAtDate >= thirtyDaysAgo && deletedAtDate <= now
      console.log(`  -> Should be included? ${isWithin30Days} (deletedAt >= thirtyDaysAgo: ${deletedAtDate >= thirtyDaysAgo}, deletedAt <= now: ${deletedAtDate <= now})`)
    }
  })

  const dateMatchCheck = await deletedCustomer.findAll({
    paranoid: false, // Override paranoid behavior
    where: {
      [Op.and]: [
        literal(`deletedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)`),
        literal(`deletedAt <= NOW()`),
      ],
    },
    attributes: ['id', 'userId', 'email', 'deletedAt', 'recovered', 'permanentlyDeleted'],
    order: [['deletedAt', 'DESC']],
    limit: 10,
  })
  console.log(`===== DEBUG: Records matching DATE condition only (within 30 days): ${dateMatchCheck.length} =====`)
  dateMatchCheck.forEach(record => {
    console.log(`- id=${record.id}, deletedAt=${record.deletedAt}, recovered=${record.recovered}, permanentlyDeleted=${record.permanentlyDeleted}, email=${record.email}`)
  })

  const deletedCustomers = await deletedCustomer.findAll({
    paranoid: false, // Override paranoid behavior - we need all records
    where: {
      [Op.and]: [
        literal(`DATE(deletedAt) >= DATE_SUB(DATE(NOW()), INTERVAL 30 DAY)`),
        literal(`DATE(deletedAt) <= DATE(NOW())`),
        literal(`recovered = 0`), // BOOLEAN stored as 0/1 in MySQL
        literal(`permanentlyDeleted = 0`), // BOOLEAN stored as 0/1 in MySQL
      ],
    },
    attributes: ['id', 'userId', 'firstName', 'lastName', 'email', 'deletedAt', 'recoveryToken'],
    order: [['deletedAt', 'DESC']],
  })

  console.log('===== Filtered deleted customers (within 30 days):', deletedCustomers.length, '=====')
  if (deletedCustomers.length > 0) {
    deletedCustomers.forEach(cust => {
      console.log(`- Found: deletedAt=${cust.deletedAt}, email=${cust.email}`)
    })
  }

  if (deletedCustomers.length === 0) {

    return res.status(200).json(
      response({
        message: 'No accounts pending recovery',
        data: { count: 0 },
      }),
    )
  }

  // Calculate days since deletion and send appropriate reminders
  const reminders = []
  for (const deletedCust of deletedCustomers) {
    const deletedAt = new Date(deletedCust.deletedAt)
    const daysSinceDeletion = Math.floor((now - deletedAt) / (1000 * 60 * 60 * 24))
    const daysRemaining = 30 - daysSinceDeletion

    // Send reminder based on days
    if (
      daysSinceDeletion === 1 ||
      daysSinceDeletion === 14 ||
      daysSinceDeletion === 29
    ) {
      // Generate new recovery token if it doesn't exist
      let recoveryTokenToUse = deletedCust.recoveryToken
      let emailSent = false
      
      // If token doesn't exist, generate new one
      if (!recoveryTokenToUse) {
        recoveryTokenToUse = crypto.randomBytes(32).toString('hex')
        // Update the record with new token
        await deletedCustomer.update(
          { recoveryToken: recoveryTokenToUse },
          { where: { id: deletedCust.id } },
        )
      }
      
      // Send recovery reminder email with recovery token
      const emailData = {
        firstName: deletedCust.firstName,
        lastName: deletedCust.lastName,
        email: deletedCust.email,
        recoveryToken: recoveryTokenToUse,
      }
      
      EmailResetPasswordOtpToAll(null, emailData, 'recoverAccount', 'customer')
      console.log(`✅ Recovery reminder email sent to ${deletedCust.email} (Day ${daysSinceDeletion})`)
      emailSent = true
      
      reminders.push({
        email: deletedCust.email,
        daysRemaining,
        daysSinceDeletion,
        emailSent,
      })
    }
  }
  return res.status(200).json(
    {
      message: 'Recovery reminders processed',
      data: {
        count: deletedCustomers.length,
        remindersSent: reminders.length,
        reminders,
      },
    }
  );
};

//* 2. Permanent Account Deletion (Lambda - Daily Cron)
exports.permanentAccountDeletion = async (req, res, next) => {
  const now = new Date();
  
  // Calculate today's date at start of day (UTC)
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  
  // Calculate 30 days ago from today (UTC start of day)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
  
  console.log('today (UTC start)=====================>>>', today.toISOString());
  console.log('thirtyDaysAgo (UTC start)=====================>>>', thirtyDaysAgo.toISOString());
  console.log('now=====================>>>', now.toISOString());

  // Find all deleted customers within the last 30 days (from today going back 30 days), not recovered
  // IMPORTANT: deletedCustomer model has paranoid: true, which filters out records with deletedAt IS NOT NULL
  // Since this table STORES deleted customer data (deletedAt is a regular field), we need paranoid: false
  const expiredCustomers = await deletedCustomer.findAll({
    paranoid: false, // Override paranoid behavior - we need all records
    where: {
      deletedAt: {
        [Op.between]: [thirtyDaysAgo, now],
      },
      recovered: false,
      permanentlyDeleted: false,
    },
    attributes: ['id', 'userId', 'email', 'deletedAt', 'firstName', 'lastName'],
  })

  if (expiredCustomers.length === 0) {
    return res.status(200).json(
      response({
        message: 'No accounts to permanently delete',
        data: { count: 0 },
      }),
    )
  }

  // Make users Anonymous (they should already be deleted, but in case they exist)
  for (const deletedCust of expiredCustomers) {
    // Check if user still exists (shouldn't, but safety check)
    const existingUser = await user.findByPk(deletedCust.userId, {
      attributes: ['id', 'userTypeId'],
    })
    
    if (existingUser) {
      const isSalon = existingUser.userTypeId === 2 // userTypeId 2 = Salon
      
      // Anonymize user
      await user.update(
        {
          deleted: true,
          firstName: 'Anonymous',
          lastName: isSalon ? 'Salon' : 'Customer',
          email: `Anonymous${deletedCust.userId}@gmail.com`,
          countryCode: '+00',
          phoneNum: '000 0000000',
          image: '',
        },
        { where: { id: deletedCust.userId } },
      )

      // If user is a salon, also anonymize salonDetail
      if (isSalon) {
        const salonData = await salonDetail.findOne({
          where: { userId: deletedCust.userId },
          attributes: ['id'],
        })
        
        if (salonData) {
          await salonDetail.update(
            {
              salonName: 'Anonymous Salon',
              businessEmail: `Anonymous${salonData.id}@gmail.com`,
              businessCountryCode: '+00',
              businessPhoneNum: '000 0000000',
              description: '',
              coverImage: '',
            },
            { where: { userId: deletedCust.userId } },
          )
        }
      } else {
        // Anonymize all allergies for customers only
        await allergies.update(
          {
            name: 'Anonymous Customer',
            reaction: '',
            note: '',
            severity: 'Unknown',
            allergyType: 'None',
          },
          { where: { userId: deletedCust.userId } },
        )
      }
    }

    // Send permanent deletion notification email
    const emailData = {
      firstName: deletedCust.firstName,
      lastName: deletedCust.lastName,
      email: deletedCust.email,
    }
    
    // Send deletion notification email
    EmailResetPasswordOtpToAll(null, emailData, 'deleteAccount', 'customer')
    console.log(`✅ Permanent deletion notification email sent to ${deletedCust.email}`)

    // Mark as permanently deleted
    await deletedCustomer.update(
      {
        permanentlyDeleted: true,
      },
      { where: { userId: deletedCust.userId } },
    )
  }

  return res.status(200).json(
    response({
      message: 'Accounts permanently deleted',
      data: {
        count: expiredCustomers.length,
        deletedAccounts: expiredCustomers.map((c) => ({
          userId: c.userId,
          email: c.email,
        })),
      },
    }),
  )
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

  console.log("req.body.paymentMethodId,====================>>>>>>>",req.body.paymentMethodId,)
  
  // Get subscription price amount
  const subscriptionAmount = parseFloat(req.body.subscriptionPrice) || 0;
  
  if (!subscriptionAmount || subscriptionAmount <= 0) {
    return res.status(200).json(response({
      status: '0',
      message: 'Invalid subscription price',
      data: {},
    }));
  }
  
  // Store subscription details in metadata for later use
  const subscriptionMetadata = {
    ...metadata,
    priceId: req.body.priceId,
    membersCount: req.body.membersCount,
    trialDays: trialDays || 0,
    subscriptionPrice: req.body.subscriptionPrice,
    userId: salon.id,
    salonDetailId: salonDetails.id,
    subscriptionName: req.body.subscriptionName,
  };
  
  // Create payment intent for subscription (like captureUpFrontPaymentInfo)
  const paymentIntent = await Stripe.createSubscriptionPaymentIntent(
    subscriptionAmount,
    stripeCustomer,
    subscriptionMetadata
  );
  
  const ephemeralKey = await Stripe.createEphemeralKey(stripeCustomer);
  
  // Return payment intent details for user to enter card
  const data = {
    paymentIntentId: paymentIntent.id,
    client_secret: paymentIntent.client_secret,
    ephemeralKeySecret: ephemeralKey.secret,
    stripeCustomerId: stripeCustomer,
    amount: subscriptionAmount,
    subscriptionData: {
      priceId: req.body.priceId,
      membersCount: req.body.membersCount,
      trialDays: trialDays || 0,
      subscriptionPrice: req.body.subscriptionPrice,
    }
  };
  
  const output = response({
    status: '1',
    message: 'Payment intent created. Complete payment to activate subscription.',
    data
  });
  
  return res.status(200).json(output);
}

//* 2. Complete Subscription After Payment -----------------
exports.completeSubscriptionAfterPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(200).json(response({
        status: '0',
        message: 'Payment intent ID is required',
        data: {},
      }));
    }

    // Retrieve payment intent to get payment method
    const paymentIntent = await Stripe.retrievePaymentIntent(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(200).json(response({
        status: '0',
        message: `Payment not completed. Status: ${paymentIntent.status}`,
        data: {},
      }));
    }

    // Get payment method from payment intent
    const paymentMethodId = paymentIntent.payment_method;
    if (!paymentMethodId) {
      return res.status(200).json(response({
        status: '0',
        message: 'Payment method not found in payment intent',
        data: {},
      }));
    }

    // Get subscription details from payment intent metadata
    const metadata = paymentIntent.metadata || {};
    const userId = parseInt(metadata.sloanId || metadata.userId);
    const salon = await user.findByPk(userId, {
      attributes: ['id', 'stripeCustomerId', 'firstName', 'lastName', 'email'],
    });

    if (!salon) {
      return res.status(200).json(response({
        status: '0',
        message: 'User not found',
        data: {},
      }));
    }

    const stripeCustomer = salon.stripeCustomerId || paymentIntent.customer;

    // Attach payment method to customer (required before creating subscription)
    try {
      await Stripe.attchPaymentMethod(paymentMethodId, stripeCustomer);
      console.log('Payment method attached to customer successfully');
    } catch (attachError) {
      console.error('Error attaching payment method:', attachError);
      // If already attached, we can continue
      if (!attachError.message?.includes('already been attached')) {
        return res.status(200).json(response({
          status: '0',
          message: `Failed to attach payment method: ${attachError.message}`,
          data: {},
        }));
      }
    }
    const salonDetails = await salonDetail.findOne({ where: { userId: salon.id } });

    if (!salonDetails) {
      return res.status(200).json(response({
        status: '0',
        message: 'Salon details not found',
        data: {},
      }));
    }

    // Prepare subscription metadata
    const subscriptionMetadata = {
      members: metadata.members,
      subscriptionName: metadata.subscriptionName,
      sloanId: salon.id,
      salonDetailId: salonDetails.id,
      membersCount: parseInt(metadata.membersCount || req.body.membersCount),
      freeTrialDays: parseInt(metadata.freeTrialDays || 0),
      paymentMethodId: paymentMethodId,
      teamSize: parseInt(metadata.membersCount || req.body.membersCount),
      priceId: metadata.priceId || req.body.priceId,
      VAT: parseFloat(metadata.VAT || req.body.VAT || 0),
    };

    const trialDays = parseInt(metadata.freeTrialDays || req.body.freeTrialDays || 0);
    const priceId = metadata.priceId || req.body.priceId;
    const membersCount = parseInt(metadata.membersCount || req.body.membersCount);

    if (!priceId) {
      return res.status(200).json(response({
        status: '0',
        message: 'Price ID is required',
        data: {},
      }));
    }

    // Create subscription with the payment method from payment intent
    const subscription = await Stripe.createSubscriptionWithPriceId(
      stripeCustomer,
      priceId,
      subscriptionMetadata,
      membersCount,
      trialDays,
      paymentMethodId,
    );

    // Update salon details
  await salonDetail.update(
    {
        teamSize: membersCount,
        metadata: subscriptionMetadata,
        subscriptionPrice: parseFloat(metadata.subscriptionPrice || req.body.subscriptionPrice),
    },
    { where: { userId: salon.id } },
    );

  const data = {
      subscriptionId: subscription.id,
    stripeCustomerId: stripeCustomer,
      subscriptionPrice: parseFloat(metadata.subscriptionPrice || req.body.subscriptionPrice),
      client_secret: subscription?.latest_invoice?.payment_intent?.client_secret,
    };

    return res.status(200).json(response({
      status: '1',
      message: 'Subscription created successfully',
      data,
    }));
  } catch (error) {
    console.error('Error completing subscription:', error);
    return res.status(200).json(response({
      status: '0',
      message: error.message || 'Failed to create subscription',
      data: {},
    }));
  }
}

//* 3. Create Subscription with Setup Intent - Step 1: Initialize -----------------
exports.initSubscriptionWithSetupIntent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { priceId, membersCount, freeTrialDays, subscriptionName, subscriptionPrice, VAT, members } = req.body;

    // Validate required fields
    if (!priceId || subscriptionPrice === undefined) {
      return res.status(200).json(response({
        status: '0',
        message: 'Missing required fields: priceId, membersCount, subscriptionPrice',
        data: {},
      }));
    }

    // Get salon user
    const salon = await user.findOne({
      where: { id: userId },
      attributes: ['id', 'stripeCustomerId', 'firstName', 'lastName', 'email'],
    });

    if (!salon) {
      return res.status(200).json(response({
        status: '0',
        message: 'Salon user not found',
        data: {},
      }));
    }

    // Get salon details
    const salonDetails = await salonDetail.findOne({ where: { userId: salon.id } });
    if (!salonDetails) {
      return res.status(200).json(response({
        status: '0',
        message: 'Salon details not found',
        data: {},
      }));
    }

    // Get or create Stripe customer
    let stripeCustomer = salon.stripeCustomerId;
    if (!stripeCustomer) {
      const fullName = `${salon.firstName || ''} ${salon.lastName || ''}`.trim() || salon.email;
      stripeCustomer = await Stripe.addCustomer(
        fullName,
        salon.email
      );
      await user.update({ stripeCustomerId: stripeCustomer }, { where: { id: salon.id } });
    }

    // Check if user has already used free trial
    let trialDays = freeTrialDays || 0;
    if (salonDetails?.hasObtainedFreeTrial) {
      trialDays = 0; // User already consumed free trial
    }

    // Create metadata for subscription
    const metadata = {
      members: members || '',
      subscriptionName: subscriptionName || '',
      sloanId: salon.id,
      salonDetailId: salonDetails.id,
      membersCount: membersCount,
      freeTrialDays: trialDays,
      teamSize: membersCount,
      priceId: priceId,
      VAT: VAT || 0,
      subscriptionPrice: subscriptionPrice,
    };

    // Create Setup Intent
    const setupIntent = await Stripe.setupIntent(stripeCustomer);

    // Create Ephemeral Key
    const ephemeralKey = await Stripe.createEphemeralKey(stripeCustomer);

    // Return setup intent details
    return res.status(200).json(response({
      status: '1',
      message: 'Setup Intent created. Please add payment method.',
      data: {
        clientSecret: setupIntent.client_secret,
        ephemeralKeySecret: ephemeralKey.secret,
        stripeCustomerId: stripeCustomer,
        setupIntentId: setupIntent.id,
        subscriptionPrice: subscriptionPrice,
      },
    }));
  } catch (error) {
    console.error('Error initializing subscription with setup intent:', error);
    return res.status(200).json(response({
      status: '0',
      message: error.message || 'Failed to initialize subscription',
      data: {},
    }));
  }
};

//* 4. Complete Subscription with Setup Intent - Step 2 -----------------
exports.completeSubscriptionWithSetupIntent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { setupIntentId, priceId, membersCount, freeTrialDays, subscriptionName, subscriptionPrice, VAT, members } = req.body;

    // Validate required fields
    if (!setupIntentId || !priceId || subscriptionPrice === undefined) {
      return res.status(200).json(response({
        status: '0',
        message: 'Missing required fields: setupIntentId, priceId, membersCount, subscriptionPrice',
        data: {},
      }));
    }

    // Get salon user
    const salon = await user.findOne({
      where: { id: userId },
      attributes: ['id', 'stripeCustomerId', 'firstName', 'lastName', 'email'],
    });

    if (!salon) {
      return res.status(200).json(response({
        status: '0',
        message: 'Salon user not found',
        data: {},
      }));
    }

    const stripeCustomer = salon.stripeCustomerId;
    if (!stripeCustomer) {
      return res.status(200).json(response({
        status: '0',
        message: 'Stripe customer ID not found',
        data: {},
      }));
    }

    // Get salon details
    const salonDetails = await salonDetail.findOne({ where: { userId: salon.id } });
    if (!salonDetails) {
      return res.status(200).json(response({
        status: '0',
        message: 'Salon details not found',
        data: {},
      }));
    }

    // Retrieve setup intent to get payment method
    const setupIntent = await Stripe.retrieveSetupIntent(setupIntentId);

    if (setupIntent.status !== 'succeeded') {
      return res.status(200).json(response({
        status: '0',
        message: `Setup Intent not completed. Status: ${setupIntent.status}`,
        data: {},
      }));
    }

    const paymentMethodId = setupIntent.payment_method;
    if (!paymentMethodId) {
      return res.status(200).json(response({
        status: '0',
        message: 'Payment method not found in setup intent',
        data: {},
      }));
    }

    // Check if user has already used free trial
    let trialDays = parseInt(freeTrialDays || 0);
    if (salonDetails?.hasObtainedFreeTrial) {
      trialDays = 0; // User already consumed free trial
    }

    // Create metadata for subscription
    const metadata = {
      members: members || '',
      subscriptionName: subscriptionName || '',
      sloanId: salon.id,
      salonDetailId: salonDetails.id,
      membersCount: membersCount,
      freeTrialDays: trialDays,
      paymentMethodId: paymentMethodId,
      teamSize: membersCount,
      priceId: priceId,
      VAT: VAT || 0,
    };

    // Create subscription
    const subscription = await Stripe.createSubscriptionWithPriceId(
      stripeCustomer,
      priceId,
      metadata,
      membersCount,
      trialDays,
      paymentMethodId
    );

    // Update salon details
    await salonDetail.update(
      {
        teamSize: membersCount,
        metadata: metadata,
        subscriptionPrice: subscriptionPrice,
      },
      { where: { userId: salon.id } }
    );

    const data = {
      subscriptionId: subscription.id,
      stripeCustomerId: stripeCustomer,
      subscriptionPrice: subscriptionPrice,
      clientSecret: subscription?.latest_invoice?.payment_intent?.client_secret,
    };

    return res.status(200).json(response({
      status: '1',
      message: 'Subscription created successfully',
      data,
    }));
  } catch (error) {
    console.error('Error completing subscription with setup intent:', error);
    return res.status(200).json(response({
      status: '0',
      message: error.message || 'Failed to create subscription',
      data: {},
    }));
  }
};

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

    return res.json(response({ status: "1", message: "Amount Transferred",data:{transferId:result.transferId} }));
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
        // Fetch cards for this customer on the connected account
        let cardsCount = 0;
        try {
          const paymentMethods = await Stripe.cards(existing.customerId, connectAccountId);
          cardsCount = paymentMethods?.data?.length || 0;
        } catch (error) {
          console.error('Error fetching cards:', error.message);
          // If error fetching cards, just return 0
          cardsCount = 0;
        }

        return res.status(200).json({
          status: '1',
          message: 'Stripe Customer Fetched',
          data: {
            stripeCustomerId: existing.customerId,
            stripeAccountId: connectAccountId,
            cardsCount: cardsCount,
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

    // Step 7: Fetch cards for this customer on the connected account
    let cardsCount = 0;
    try {
      const paymentMethods = await Stripe.cards(stripeCustomerId, connectAccountId);
      cardsCount = paymentMethods?.data?.length || 0;
    } catch (error) {
      console.error('Error fetching cards:', error.message);
      // If error fetching cards, just return 0
      cardsCount = 0;
    }

    // Step 8: Return success response
    return res.status(200).json({
      status: '1',
      message: 'Stripe customer initialized',
      data: {
        stripeCustomerId: stripeCustomerId,
        stripeAccountId: connectAccountId,
        cardsCount: cardsCount,
      },
    });
};

/*
 * Create Setup Intent and Attach Card
 * This API creates a SetupIntent for the customer to save their payment method
 */
exports.createSetupIntent = async (req, res, next) => {
  const customerId = req.user.id;
  const { salonId } = req.body;

  try {
    // Get user details
    const userDetails = await user.findByPk(customerId, {
      attributes: ['firstName', 'lastName', 'email', 'stripeCustomerId'],
    });

    if (!userDetails) {
      throw new AppError('User not found', 200);
    }

    // Get salon's connected account
    const account = await salonDetail.findOne({
      where: { id: salonId },
      attributes: ['id', 'connectAccountId'],
    });

    if (!account) {
      throw new AppError('Salon not found', 200);
    }

    if (!account.connectAccountId) {
      throw new AppError('Salon has not completed Stripe onboarding', 200);
    }

    const connectAccountId = account.connectAccountId;

    // Check if customer exists on this connected account
    let stripeCustomerId = null;
    const existingCustomer = await customerOnConnectAccount.findOne({
      where: {
        userId: customerId,
        connectAccountId: connectAccountId,
      },
      attributes: ['customerId'],
    });

    if (existingCustomer?.customerId) {
      // Verify customer still exists in Stripe
      const stripeCustomer = await Stripe.getCustomer(
        existingCustomer.customerId,
        connectAccountId
      );

      if (stripeCustomer) {
        stripeCustomerId = existingCustomer.customerId;
      }
    }

    // If customer doesn't exist, create one
    if (!stripeCustomerId) {
      const fullName = `${userDetails.firstName} ${userDetails.lastName}`;
      const email = userDetails.email;

      stripeCustomerId = await Stripe.addCustomer(
        fullName,
        email,
        connectAccountId
      );

      // Save to customerOnConnectAccount table
      await customerOnConnectAccount.create({
        userId: customerId,
        customerId: stripeCustomerId,
        connectAccountId: connectAccountId,
        status: true,
        salonDetailId: account.id,
      });

      // Update user table
      if (!userDetails.stripeCustomerId) {
        await user.update({ stripeCustomerId }, { where: { id: customerId } });
      }
    }

    // Create SetupIntent
    const setupIntent = await Stripe.setupIntent(stripeCustomerId, connectAccountId);

    console.log('✅ SetupIntent created:', setupIntent.id);

    const output = response({
      message: 'Setup intent created successfully',
      data: {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
        stripeCustomerId: stripeCustomerId,
        stripeAccountId: connectAccountId,
      },
    });

    return res.status(200).json(output);
  } catch (error) {
    console.error('❌ Error creating setup intent:', error.message);
    throw new AppError(error.message || 'Failed to create setup intent', 200);
  }
};

//* 4.5.3 Capture Payment info with Setup Intent (Alternative to Payment Intent) -----------------

exports.captureUpFrontPaymentInfoWithSetupIntent = async (req, res, next) => {
  //Partial payment upfront using Setup Intent
  console.log(
    '🚀 ~ exports.captureUpFrontPaymentInfoWithSetupIntent= ~ req.body:',
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
  
  // Create connection token for Stripe Terminal
  // In live mode, you need to pass a location ID
  // For now, we're passing null which works in test mode
  // In production, you'll need to provide an actual location ID
  const connectionToken = await Stripe.createConnectionToken(null, null)

  // Create Setup Intent instead of Payment Intent
  // Setup Intent is used to save payment method, then charge separately later
  const setupIntent =
    advanceAmount > 0
      ? await Stripe.setupIntent(
          confirmCustomerId,
          account.connectAccountId,
        )
      : null

  const data = {
    ephemeralKeySecret: ephemeralKey ? ephemeralKey.secret : '',
    connectionToken: connectionToken,
    client_secret: setupIntent ? setupIntent.client_secret : '',
    setupIntentId: setupIntent ? setupIntent.id : '',
    paymentIntendId: null, // No payment intent with setup intent approach
    initialPayment: upFrontAmount,
    tip: tip,
    platformFee,
    actualCapturedAmount: actualCapturedAmount,
    stripeCustomerId: confirmCustomerId,
    stripeAccountId:account.connectAccountId,
  }
  
  console.log("Data================================><><><><><><>",data);

  const output = response({ status: '1', message: 'Advance payment setup intent created', data })
  return res.status(200).json(output)
}

// Controller to send appointment reminders before 24 hours of the appointment
// exports.sendReminder = async (req, res) => {
//   try {
      
//       console.log("+++++++++++++++++++++++++++++++++++++++++++++CALLINGLAMDA 24")
//     // Calculate 24 hours from now ± 15 minutes
//     const now = new Date();
//     const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
//     const wiggle = 15 * 60 * 1000;

//     const windowStart = new Date(in24h.getTime() - wiggle);
//     const windowEnd = new Date(in24h.getTime() + wiggle);

//     const formatLocalDateTime = (date) =>
//       date.toLocaleString('sv', { timeZone: 'Asia/Karachi' }).replace('T', ' ');

//     const startStr = formatLocalDateTime(windowStart);
//     const endStr = formatLocalDateTime(windowEnd);

//     console.log("🚀 ~ startStr:", startStr);
//     console.log("🚀 ~ endStr:", endStr);

//     // Fetch bookings for the next 24 hours ± 15 minutes
//     const bookings = await booking.findAll({
//       where: {
//         reminderSent: false,
//         [Op.and]: literal(`
//           TIMESTAMP(\`on\`, startTime)
//           BETWEEN '${startStr}' AND '${endStr}'
//         `),
//       },
//       attributes: ['id', 'on', 'startTime', 'customerId', 'salonDetailId'],
//     });

//     console.log("🚀 ~ bookings:", bookings);
//     if (bookings.length === 0) {
//     return res.status(401).json({
//         message:"Data Not Found",
//         data:{}
//     })
//     }

//     // Fetch customers and salons associated with the bookings
//     const customerIds = [...new Set(bookings.map((b) => b.customerId))];
//     const salonIds = [...new Set(bookings.map((b) => b.salonDetailId))];

//     const customers = await user.findAll({
//       where: { id: { [Op.in]: customerIds }, userTypeId: 1 },
//       include: [{ model: deviceToken, attributes: ['tokenId'] }],
//     });

//     const salons = await salonDetail.findAll({
//       where: { id: { [Op.in]: salonIds } },
//       include: [
//         {
//           model: user,
//           attributes: ['id', 'firstName'],
//           include: [
//             {
//               model: deviceToken,
//               attributes: ['tokenId'],
//             },
//           ],
//         },
//       ],
//     });

//     const custMap = new Map(customers.map((c) => [c.id, c]));
//     const salonMap = new Map(salons.map((salon) => [salon.id, salon]));

//     // Process bookings and send notifications
//     for (const b of bookings) {
//       const customer = custMap.get(b.customerId);
//       const salon = salonMap.get(b.salonDetailId);

//       if (!customer || !salon) {
//         console.warn(`Skipping booking ${b.id} due to missing user data.`);
//         return res.status(401).json({
//             message:"Customer or Salon Not Found",
//             data:{}
//         })
//         continue;
//       }

//       const salonUser = salon.user;
//       const apptDateTime = new Date(`${b.on}T${b.startTime}`);

//       const notifCustomer = {
//         title: 'Upcoming Booking Customer',
//         body: `Your appointment with ${salonUser.firstName} is tomorrow at ${apptDateTime.toLocaleString('en-US', {
//           timeZone: 'Asia/Karachi',
//         })}. We look forward to seeing you!`,
//       };

//       const notifSalon = {
//         title: 'Upcoming Booking Salon',
//         body: `You have an appointment with ${customer.firstName} tomorrow at ${apptDateTime.toLocaleString('en-US', {
//           timeZone: 'Asia/Karachi',
//         })}.`,
//       };

//       const custTokens = customer.deviceTokens.map((t) => t.tokenId);
//       const salonTokens = salonUser.deviceTokens.map((t) => t.tokenId);

//       if (custTokens.length > 0) {
//         await throwNotification(custTokens, notifCustomer, { bookingId: b.id }, customer.id);
//       }

//       if (salonTokens.length > 0) {
//         await throwNotification(salonTokens, notifSalon, { bookingId: b.id }, salonUser.id, 'salon');
//       }

//       b.reminderSent = true;
//       await b.save();
//     }
    
//     return res.status(200).json({
//         statusCode:200,
//         message:"Notification Send Sucesfuuly",
//         data:{
//             processed: bookings.length
//         }
//     })
//   } catch (error) {
//     console.error('Error processing booking reminders:', error);
//     return response({ status: '0', message: 'Error processing reminders', error: error.message });
//   }
// };

exports.sendReminder = async (req, res) => {
  try {
    console.log("+++++++++++++++++++++++++++++++++++++++++++++CALLING LAMBDA 24/2H");

    // ---- windows in Asia/Karachi ----
    const now = new Date();
    const wiggle = 30 * 60 * 1000; // 30 minutes in milliseconds

    const makeWindow = (hoursAhead) => {
      const target = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
      const start = new Date(target.getTime() - wiggle); // 30 minutes before the target
      const end = new Date(target.getTime() + wiggle); // 30 minutes after the target
      const formatLocalDateTime = (date) =>
        date.toLocaleString('sv', { timeZone: 'Asia/Karachi' }).replace('T', ' ');
      return { startStr: formatLocalDateTime(start), endStr: formatLocalDateTime(end), start, end };
    };

    const w24 = makeWindow(24);
    const w2  = makeWindow(2);

    console.log("🚀 ~ 24h window:", w24.startStr, "→", w24.endStr);
    console.log("🚀 ~ 2h  window:", w2.startStr,  "→", w2.endStr);

    // ---- fetch bookings that need either reminder ----
    const bookings = await booking.findAll({
      where: {
        [Op.or]: [
          {
            reminderSent: false,
            [Op.and]: literal(`
              TIMESTAMP(\`booking\`.\`on\`, \`booking\`.\`startTime\`)
              BETWEEN '${w24.startStr}' AND '${w24.endStr}'
            `),
          },
          {
            twoHoursReminder: false,
            [Op.and]: literal(`
              TIMESTAMP(\`booking\`.\`on\`, \`booking\`.\`startTime\`)
              BETWEEN '${w2.startStr}' AND '${w2.endStr}'
            `),
          },
        ],
      },
      attributes: ['id', 'on', 'startTime', 'customerId', 'salonDetailId', 'reminderSent', 'twoHoursReminder'],
      include: [
        {
          model: jobs,
          attributes: ['id', 'serviceId'],
          include: [
            {
              model: service,
              attributes: ['serviceName'],
            },
          ],
        },
      ],
    });

    console.log("🚀 ~ matching bookings:", bookings.length);
    if (bookings.length === 0) {
      return res.status(401).json({ message: "Data Not Found", data: {} });
    }

    // ---- gather customers & salons ----
    const customerIds = [...new Set(bookings.map((b) => b.customerId))];
    const salonIds = [...new Set(bookings.map((b) => b.salonDetailId))];

    const customers = await user.findAll({
      where: { id: { [Op.in]: customerIds }, userTypeId: 1 },
      include: [{ model: deviceToken, attributes: ['tokenId'] }],
    });

    const salons = await salonDetail.findAll({
      where: { id: { [Op.in]: salonIds } },
      include: [
        {
          model: user,
          attributes: ['id', 'firstName'],
          include: [{ model: deviceToken, attributes: ['tokenId'] }],
        },
      ],
    });

    const custMap = new Map(customers.map((c) => [c.id, c]));
    const salonMap = new Map(salons.map((s) => [s.id, s]));

    const inWindow = (dateObj, window) => dateObj >= window.start && dateObj <= window.end;

    for (const b of bookings) {
      const customer = custMap.get(b.customerId);
      const salon = salonMap.get(b.salonDetailId);

      if (!customer || !salon) {
        console.warn(`Skipping booking ${b.id} due to missing user data.`);
        continue;
      }

      const salonUser = salon.user;

      // Build appointment Date (treat 'on' + 'startTime' as Asia/Karachi local)
      const apptDateTime = new Date(`${b.on}T${b.startTime}`); // raw
      
      // Format date as DD/MM/YYYY with time in Asia/Karachi timezone
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Karachi',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      const parts = formatter.formatToParts(apptDateTime);
      const day = parts.find(p => p.type === 'day').value;
      const month = parts.find(p => p.type === 'month').value;
      const year = parts.find(p => p.type === 'year').value;
      const hour = parts.find(p => p.type === 'hour').value;
      const minute = parts.find(p => p.type === 'minute').value;
      
      const apptLocalStr = `${day}/${month}/${year} @ ${hour}:${minute}`; // DD/MM/YYYY HH:mm format

      // Format date and time for salon notification (DD/MM/YY and 12-hour format)
      const yearShort = year.slice(-2); // Get last 2 digits of year
      const hour12 = parseInt(hour, 10);
      const hour12Formatted = hour12 === 0 ? 12 : hour12 > 12 ? hour12 - 12 : hour12;
      const ampm = hour12 >= 12 ? 'pm' : 'am';
      const time12Hour = `${hour12Formatted}:${minute}${ampm}`;
      const dateShort = `${day}/${month}/${yearShort}`; // DD/MM/YY format

      // Extract service names from jobs
      let servicesNames = [];
      if (b.jobs && b.jobs.length > 0) {
        servicesNames = b.jobs
          .map((job) => job.service?.serviceName)
          .filter(Boolean); // Remove any null/undefined values
      }
      
      // Format service names for notification (without "for a" or "for" prefix)
      let servicesText = '';
      if (servicesNames.length > 0) {
        if (servicesNames.length === 1) {
          servicesText = servicesNames[0]; // Just the service name
        } else if (servicesNames.length === 2) {
          servicesText = `${servicesNames[0]} and ${servicesNames[1]}`;
        } else {
          // For 3+ services, show first service and count
          servicesText = `${servicesNames[0]} and ${servicesNames.length - 1} more service${servicesNames.length - 1 > 1 ? 's' : ''}`;
        }
      }

      // Decide which reminder this booking is for
      const apptForCompare = new Date(`${b.on}T${b.startTime}`); // JS date for comparison to windows created from 'now'
      let which = null;
      if (!b.reminderSent && inWindow(apptForCompare, w24)) which = '24h';
      else if (!b.twoHoursReminder && inWindow(apptForCompare, w2)) which = '2h';

      if (!which) {
        console.warn(`Booking ${b.id} did not fall into a known window.`);
        continue;
      }

      // Adjust date for the 2-hour reminder to be today's date
      const notifCustomer =
        which === '24h'
          ? {
              title: 'Upcoming booking',
              body: `Your booking with ${salonUser.firstName} is tomorrow ${dateShort}  @ ${time12Hour}`,
            }
          : {
              title: 'Upcoming booking',
              body: `Your booking with ${salonUser.firstName} is in about 2 hours ${dateShort}  @ ${time12Hour}`,
            };

      // Salon notification format: "You have a booking with [customer] at [time]pm on [date] for a [service]"
      const servicePrefix = servicesNames.length === 1 ? 'for a' : 'for a';
      const serviceTextWithPrefix = servicesText ? ` ${servicePrefix} ${servicesText}` : '';
      const notifSalon =
        which === '24h'
          ? {
              title: 'Upcoming booking',
              body: `You have a booking with ${customer.firstName} tomorrow at ${time12Hour} on ${dateShort}${serviceTextWithPrefix}`,
            }
          : {
              title: 'Upcoming booking',
              body: `You have a booking with ${customer.firstName} at ${time12Hour} on ${dateShort}${serviceTextWithPrefix}`,
            };

      const custTokens = (customer.deviceTokens || []).map((t) => t.tokenId).filter(Boolean);
      const salonTokens = ((salonUser.deviceTokens) || []).map((t) => t.tokenId).filter(Boolean);

      if (custTokens.length > 0) {
        await throwNotification(custTokens, notifCustomer, { bookingId: b.id, kind: which }, customer.id);
      }
      if (salonTokens.length > 0) {
        await throwNotification(salonTokens, notifSalon, { bookingId: b.id, kind: which }, salonUser.id, 'salon');
      }

      // Mark the correct flag
      if (which === '24h') b.reminderSent = true;
      if (which === '2h') b.twoHoursReminder = true;
      await b.save();
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Notifications sent successfully",
      data: { processed: bookings.length },
    });
  } catch (error) {
    console.error('Error processing booking reminders:', error);
    return response({ status: '0', message: 'Error processing reminders', error: error.message });
  }
};







