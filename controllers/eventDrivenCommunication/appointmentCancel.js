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
const EmailAppointmentToSalon = require('../../helper/AppointmentEmailsToSalon')
const cancelEmailAppointmentCustomer = require('../../helper/AppointmentEmailsToCustomer')
const { employeeForSocket } = require('../../utils/socketUtilities')
const {
  bookingDataForEmailAndNotifications,
} = require('../../utils/emailsNotificationsData')

exports.cancelBySalon = async (bookingId) => {
  try {
    const bookingData = await bookingDataForEmailAndNotifications(bookingId)
    if (!bookingData) return false
    const { appointment } = bookingData

    if (bookingData?.client?.customerEmail) {
      cancelEmailAppointmentCustomer(
        [bookingData?.client?.customerEmail],
        appointment,
        'cancel',
      )
    }
    EmailAppointmentToSalon(
      [`${bookingData?.salon?.salonEmail}`],
      appointment,
      'cancel',
    )
    const socketInput = {
      event: 'complete-appointment',
      data: { id: bookingId * 1 },
      bookingId: bookingId,
    }
    await unAcknowledgedEvents.destroy({ where: { bookingId } })
    sendEvent(`${appointment?.salonDetail?.id}S`, socketInput)
    const workers = await employeeForSocket(appointment?.salonDetail?.id)
    workers.forEach((el) => sendEvent(`${el}E`, socketInput))
    //EMAIL --//TODO
    // EmailAppointmentConfirmToSalon(['sigidevelopers@gmail.com'],appointment);

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
      title: `Appointment Cancellation`,
      body: `We regret to inform you that your appointment on ${dateTime} has been cancelled. Please contact us to reschedule.`,
    }

    const fullName = `${appointment.user.firstName} ${appointment.user.lastName}`

    const salonNotification = {
      title: `Booking Cancellation Alert`,
      body: `The appointment with ${fullName} on ${dateTime} has been cancelled.`,
    }

    ThrowNotification(
      salonTokens,
      salonNotification,
      {
        appointment: appointment.id,
        name: bookingData.client.fullName,
        image: bookingData.client.image,
      },
      bookingData?.salon?.userId,
    )
    ThrowNotification(
      customerTokens,
      customerNotification,
      {
        appointment: appointment.id,
        name: bookingData.salon.salonName,
        image: bookingData.salon.image,
      },
      bookingData?.client?.userId,
    )

    console.log('🚀 ~~~~~ eventDrivenCommunication ~~~~~~~ 🚀')
    return true
  } catch (error) {
    console.log('🚀 ~ exports.onlineAppointmentConfirm= ~ error:', error)
  }
}

//TODO eamils
exports.cancelByCustomer = async (bookingId) => {
  try {
    //EMAIL --//TODO
    // EmailAppointmentConfirmToSalon(['sigidevelopers@gmail.com'],data);
    const bookingData = await bookingDataForEmailAndNotifications(bookingId)
    if (!bookingData) return false
    const { appointment } = bookingData

    if (bookingData?.client?.customerEmail) {
      cancelEmailAppointmentCustomer(
        [bookingData?.client?.customerEmail],
        appointment,
        'cancel',
      )
    }
    const socketInput = {
      event: 'complete-appointment',
      data: { id: bookingId * 1 },
      bookingId: bookingId,
    }
    await unAcknowledgedEvents.destroy({ where: { bookingId: bookingId } })
    console.log('----------------->> SLON S', appointment?.salonDetail?.id)
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
      title: `Appointment Cancellation`,
      body: `We regret to inform you that your appointment on ${dateTime} has been cancelled. Please contact us to reschedule.`,
    }

    const fullName = `${appointment.user.firstName} ${appointment.user.lastName}`

    const salonNotification = {
      title: `Booking Cancellation Alert`,
      body: `The appointment with ${fullName} on ${dateTime} has been cancelled.`,
    }

    if (appointment?.jobs?.length > 0) {
      appointment.jobs.forEach((ele) => {
        const employeesTokens = ele.employee?.user?.deviceTokens?.map((ele) => {
          return ele?.tokenId
        })
        const employeeNotification = {
          title: `Appointment Canceled`,
          body: `Appointment with ${fullName} on ${dateTime} for ${ele.service.serviceName} has been canceled`,
        }
        ThrowNotification(
          employeesTokens,
          employeeNotification,
          {
            appointment: appointment.id,
            name: bookingData.client.fullName,
            image: bookingData.client.image,
          },
          ele.employee?.user?.id,
        )
      })
    }

    ThrowNotification(
      salonTokens,
      salonNotification,
      {
        appointment: appointment.id,
        name: bookingData.client.fullName,
        image: bookingData.client.image,
      },
      bookingData?.salon?.userId,
    )
    ThrowNotification(
      customerTokens,
      customerNotification,
      {
        appointment: appointment.id,
        name: bookingData.salon.salonName,
        image: bookingData.salon.image,
      },
      bookingData?.client?.userId,
    )
    console.log('🚀 ~~~~~ eventDrivenCommunication ~~~~~~~ 🚀')
    return true
  } catch (error) {
    console.log('🚀 ~ exports.onlineAppointmentConfirm= ~ error:', error)
  }
}
