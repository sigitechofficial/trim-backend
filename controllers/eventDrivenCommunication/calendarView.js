const { Op, literal, col, fn, where } = require('sequelize')

const {
  employee,
  salonDetail,
  user,
  booking,
  jobs,
  service,
  employeeWagesMethod,
  deviceToken,
  addressDBS,
  category,
  unAcknowledgedEvents,
} = require('../../models')
const { sendEvent } = require('../../socket_io')
const DateManupulation = require('../../utils/dateManipulation')
const { employeeForSocket } = require('../../utils/socketUtilities')

const jobAttributes = [
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
  // Manual booking approval: lets the shop app style request tiles live.
  [
    literal(`(SELECT bookings.status FROM bookings WHERE bookings.id = jobs.bookingId)`),
    'bookingStatus',
  ],
  [
    literal(`(SELECT bookings.requestExpiresAt FROM bookings WHERE bookings.id = jobs.bookingId)`),
    'requestExpiresAt',
  ],
  [
    literal(`(SELECT bookings.requestOutcome FROM bookings WHERE bookings.id = jobs.bookingId)`),
    'requestOutcome',
  ],
]

exports.socketForCalendar = async ({ appointmentId, type, status }) => {
  try {
    let event =
      type == 'new'
        ? 'new-appointment-calendar'
        : 'reschedule-appointment-calendar'

    let include = [
      {
        where: {
          status: { [Op.or]: ['pending', 'assign'] },
        },
        required: false,
        model: jobs,
        attributes: jobAttributes,
      },
    ]

    const appointment = await booking.findByPk(appointmentId, {
      attributes: ['id', 'salonDetailId', 'on', 'status', 'requestOutcome'],
      include: include,
    })

    const data = {
      jobs: appointment?.jobs || [],
      bookingId: appointment?.id,
      on: appointment.on,
      status: '',
      // Request events (new, moved, answered) carry these so the shop app only
      // refreshes its requests list for them, not for every booking.
      bookingStatus: appointment?.status,
      requestOutcome: appointment?.requestOutcome ?? null,
    }
    if (type == 'finish') {
      event = 'finish-appointment-calendar'
      data.status = status
      include = []
    }
    const socketInput = {
      event: event,
      data: data,
      bookingId: appointment?.id,
    }
    sendEvent(`${appointment?.salonDetailId}S`, socketInput)
    const workers = await employeeForSocket(appointment?.salonDetailId)
    workers.forEach((el) => sendEvent(`${el}E`, socketInput))

    console.log('🚀 ~~~~~ eventDrivenCommunication ~~~~~~~CALENDAR 🚀')
    return true
  } catch (error) {
    console.log('🚀 ~ exports.onlineAppointmentConfirm= ~ error:', error)
  }
}

exports.socketForCalendarJobOnly = async ({
  appointmentId,
  jobId,
  type = 'finish',
}) => {
  try {
    let event = `finish-job`

    const appointment = await booking.findByPk(appointmentId, {
      attributes: ['id', 'salonDetailId', 'on'],
    })

    const socketInput = {
      event: event,
      data: {
        jobId: jobId,
        type,
      },
      bookingId: appointmentId,
    }
    sendEvent(`${appointment?.salonDetailId}S`, socketInput)
    const workers = await employeeForSocket(appointment?.salonDetailId)
    workers.forEach((el) => sendEvent(`${el}E`, socketInput))

    console.log('🚀 ~~~~~ eventDrivenCommunication ~~~~~~~CALENDAR 🚀')
    return true
  } catch (error) {
    console.log('🚀 ~ exports.onlineAppointmentConfirm= ~ error:', error)
  }
}
