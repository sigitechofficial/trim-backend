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
]
exports.socketForCalendar = async ({ appointmentId, type }) => {
  try {
    const appointment = await booking.findByPk(appointmentId, {
      attributes: ['id', 'salonDetailId'],
      include: {
        where: {
          status: { [Op.or]: ['pending', 'assign'] },
        },
        model: jobs,
        attributes: jobAttributes,
      },
    })
    if (!appointment) return 0

    let event =
      type == 'new'
        ? 'new-appointment-calendar'
        : 'reschedule-appointment-calendar'

    if (type == 'finish') event = 'finish-appointment-calendar'
    const socketInput = {
      event: event,
      data: {
        jobs: appointment?.jobs,
        bookingId: appointment?.id,
        on: appointment.on,
      },
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
