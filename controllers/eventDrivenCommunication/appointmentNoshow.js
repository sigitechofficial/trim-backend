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
const { emailDateFormate } = require('../../utils/emailDateFormate')
const { sendEvent } = require('../../socket_io')
const ThrowNotification = require('../../utils/throwNotification')
const DateManupulation = require('../../utils/dateManipulation')
const AppointmentEmailsToCustomer = require('../../helper/AppointmentEmailsToCustomer')
const EmailAppointmentToSalon = require('../../helper/AppointmentEmailsToSalon')
const { employeeForSocket } = require('../../utils/socketUtilities')
const {
  bookingDataForEmailAndNotifications,
} = require('../../utils/emailsNotificationsData')
const {
  calculatePayoutsOnService,
  calculatePayoutsOnBooking,
} = require('../salonControllers/payoutController')
exports.noShowMessages = async (bookingId, finePercentage, isCase = false) => {
  try {
    const bookingData = await bookingDataForEmailAndNotifications(bookingId)
    //EMAIL
    if (!bookingData) return false
    const { appointment } = bookingData
    if (bookingData?.client?.customerEmail) {
      AppointmentEmailsToCustomer(
        [bookingData?.client?.customerEmail],
        appointment,
        'noshow',
      )
    }

    EmailAppointmentToSalon(
      [`${bookingData?.salon?.salonEmail}`],
      appointment,
      'noshow',
    )

    if (isCase) {
      calculatePayoutsOnBooking(appointment, finePercentage, 'no-show')
    }
    const socketInput = {
      event: 'complete-appointment',
      data: { id: bookingId * 1 },
      bookingId: bookingId,
    }
    await unAcknowledgedEvents.destroy({ where: { bookingId: bookingId } })
    sendEvent(`${appointment?.salonDetail?.id}S`, socketInput)
    const workers = await employeeForSocket(appointment?.salonDetail?.id)
    workers.forEach((el) => sendEvent(`${el}E`, socketInput))
    //Notification
    const dateTime = emailDateFormate(appointment.on, appointment.startTime)
    const salonTokens = appointment?.salonDetail?.user?.deviceTokens?.map(
      (ele) => {
        return ele?.tokenId
      },
    )
    const customerTokens = appointment?.user?.deviceTokens?.map((ele) => {
      return ele?.tokenId
    })

    const customerNotification = {
      title: `No-Show Notification`,
      body: `We missed you at your appointment today. Please contact us to reschedule.`,
    }

    const fullName = `${appointment.user.firstName} ${appointment.user.lastName}`

    const salonNotification = {
      title: `No-Show Alert`,
      body: `${fullName} did not show up for the appointment on ${dateTime}.`,
    }

    ThrowNotification(
      salonTokens,
      salonNotification,
      {
        appointment: appointment.id,
        name: bookingData?.client?.fullName,
        image: bookingData?.client.image,
      },
      bookingData.salon?.userId,
    )
    ThrowNotification(
      customerTokens,
      customerNotification,
      {
        appointment: appointment.id,
        name: bookingData?.salon?.salonName,
        image: bookingData?.salon.image,
      },
      bookingData.client?.userId,
    )

    console.log('🚀 ~~~~~ eventDrivenCommunication ~~~~~~~ 🚀')

    return true
  } catch (error) {
    console.log('🚀 ~ exports.onlineAppointmentConfirm= ~ error:', error)
  }
}
