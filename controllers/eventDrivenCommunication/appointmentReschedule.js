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

const rescheduleEmailsToCustomer = require('../../helper/AppointmentEmailsToCustomer')
const { employeeForSocket } = require('../../utils/socketUtilities')
const {
  bookingDataForEmailAndNotifications,
} = require('../../utils/emailsNotificationsData')

const {
  bookingFormat,
  formatedBookingsDetail,
} = require('../../utils/dataFormatorsForSalon')

//* 1.Reschedule Solo Employee Appointment -----------------

exports.fromCustomerSoloEmployee = async (bookingId) => {
  try {
    const bookingData = await bookingDataForEmailAndNotifications(bookingId)
    if (!bookingData) return null
    const inputData = bookingData.appointment

    EmailAppointmentToSalon(
      [`${bookingData?.salon?.salonEmail}`],
      inputData,
      'reschudle',
    )

    const { socketInputBooking } = bookingFormat(inputData)
    const { socketInputDetails } = await formatedBookingsDetail(inputData)

    sendEvent(`${inputData?.salonDetailId}S`, socketInputDetails)
    const workersForbookingDetails = await employeeForSocket(
      inputData?.salonDetailId,
    )
    workersForbookingDetails.forEach((el) =>
      sendEvent(`${el}E`, socketInputDetails),
    )

    sendEvent(`${inputData?.salonDetailId}S`, socketInputBooking)
    const workersForbooking = await employeeForSocket(inputData?.salonDetailId)
    workersForbooking.forEach((el) => sendEvent(`${el}E`, socketInputBooking))
    //EMAIL --//TODO
    // EmailAppointmentConfirmToSalon(['sigidevelopers@gmail.com'],inputData);

    //Notification
    const dateTime = emailDateFormate(inputData.on, inputData.startTime)
    const salonTokens = bookingData.salon.salonTokens
    const customerTokens = bookingData.client.customerTokens

    const customerNotification = {
      title: `Rescheduled Appointment`,
      body: `Your appointment with ${inputData?.salonDetail?.salonName} has been rescheduled to ${dateTime}. Please let us know if this works for you.`,
    }

    const fullName = bookingData.client.fullName

    const salonNotification = {
      title: `Booking Rescheduled Alert`,
      body: `The appointment with ${fullName} has been rescheduled to ${dateTime}.`,
    }

    if (bookingData?.employeeData > 0) {
      bookingData.employeeData.forEach((ele) => {
        const employeesTokens = ele.tokens
        const employeeNotification = {
          title: `Appointment Rescheduled`,
          body: `Your appointment with ${fullName} has been rescheduled to ${ele.dateTime} for ${ele.service}`,
        }
        ThrowNotification(
          employeesTokens,
          employeeNotification,
          {
            appointment: ele.bookingId,
            name: bookingData?.client?.fullName,
            image: bookingData?.client.image,
          },
          ele.userId,
        )
      })
    }
    //!Email
    rescheduleEmailsToCustomer(
      [bookingData?.client?.customerEmail],
      inputData,
      'reschudle',
    )
    ThrowNotification(
      salonTokens,
      salonNotification,
      {
        appointment: inputData.id,
        name: bookingData?.client?.fullName,
        image: bookingData?.client.image,
      },
      bookingData.salon.userId,
    )
    ThrowNotification(
      customerTokens,
      customerNotification,
      {
        appointment: inputData?.id,
        name: bookingData?.salon?.salonName,
        image: bookingData?.salon.image,
      },
      bookingData?.client?.userId,
    )

    console.log('🚀 ~~~~~ eventDrivenCommunication ~~~~~~~ 🚀')
    return true
  } catch (error) {
    console.log('🚀 ~ exports.onlineAppointmentConfirm= ~ error:', error)
  }
}

//* 2.Reschedule Multiple Employee Appointment -------------

exports.fromCustomerMultipleEmployees = async (bookingId) => {
  try {
    const bookingData = await bookingDataForEmailAndNotifications(bookingId)
    const inputData = bookingData.appointment

    EmailAppointmentToSalon(
      [`${bookingData?.salon?.salonEmail}`],
      inputData,
      'reschudle',
    )

    const { socketInputBooking } = bookingFormat(inputData)
    const { socketInputDetails } = await formatedBookingsDetail(inputData)

    sendEvent(`${inputData?.salonDetailId}S`, socketInputDetails)
    const workersForbookingDetails = await employeeForSocket(
      inputData?.salonDetailId,
    )
    workersForbookingDetails.forEach((el) =>
      sendEvent(`${el}E`, socketInputDetails),
    )

    sendEvent(`${inputData?.salonDetailId}S`, socketInputBooking)
    const workersForbooking = await employeeForSocket(inputData?.salonDetailId)
    workersForbooking.forEach((el) => sendEvent(`${el}E`, socketInputBooking))
    //EMAIL --//TODO
    // EmailAppointmentConfirmToSalon(['sigidevelopers@gmail.com'],inputData);

    //Notification
    const dateTime = emailDateFormate(inputData.on, inputData.startTime)
    const salonTokens = bookingData.salon.salonTokens
    const customerTokens = bookingData.client.customerTokens

    const customerNotification = {
      title: `Rescheduled Appointment`,
      body: `Your appointment with ${inputData?.salonDetail?.salonName} has been rescheduled to ${dateTime}. Please let us know if this works for you.`,
    }

    const fullName = bookingData.client.fullName

    const salonNotification = {
      title: `Booking Rescheduled Alert`,
      body: `The appointment with ${fullName} has been rescheduled to ${dateTime}.`,
    }

    if (bookingData?.employeeData > 0) {
      bookingData.employeeData.forEach((ele) => {
        const employeesTokens = ele.tokens
        const employeeNotification = {
          title: `Appointment Rescheduled`,
          body: `Your appointment with ${fullName} has been rescheduled to ${ele.dateTime} for ${ele.service}`,
        }
        ThrowNotification(
          employeesTokens,
          employeeNotification,
          {
            appointment: ele.bookingId,
            name: bookingData?.client?.fullName,
            image: bookingData?.client.image,
          },
          ele.userId,
        )
      })
    }
    rescheduleEmailsToCustomer(
      [bookingData?.client?.customerEmail],
      inputData,
      'reschudle',
    )
    ThrowNotification(
      salonTokens,
      salonNotification,
      {
        appointment: inputData.id,
        name: bookingData?.client?.fullName,
        image: bookingData?.client.image,
      },
      bookingData.salon.userId,
    )
    ThrowNotification(
      customerTokens,
      customerNotification,
      {
        appointment: inputData.id,
        name: bookingData?.salon?.salonName,
        image: bookingData?.salon.image,
      },
      bookingData.client.userId,
    )

    console.log('🚀 ~~~~~ eventDrivenCommunication ~~~~~~~ 🚀')
    return true
  } catch (error) {
    console.log(
      '🚀 ~eventDrivenCommunication exports.onlineAppointmentConfirm= ~ error:',
      error,
    )
  }
}

//* 2.Reschedule Multiple Employee From Salon -------------

exports.fromSalonMultipleEmployees = async (bookingId) => {
  try {
    const bookingData = await bookingDataForEmailAndNotifications(bookingId)
    const inputData = bookingData.appointment

    EmailAppointmentToSalon(
      [`${bookingData?.salon?.salonEmail}`],
      inputData,
      'reschudle',
    )

    const { socketInputBooking } = bookingFormat(inputData)
    const { socketInputDetails } = await formatedBookingsDetail(inputData)

    sendEvent(`${inputData?.salonDetailId}S`, socketInputDetails)
    const workersForbookingDetails = await employeeForSocket(
      inputData?.salonDetailId,
    )
    workersForbookingDetails.forEach((el) =>
      sendEvent(`${el}E`, socketInputDetails),
    )

    sendEvent(`${inputData?.salonDetailId}S`, socketInputBooking)
    const workersForbooking = await employeeForSocket(inputData?.salonDetailId)
    workersForbooking.forEach((el) => sendEvent(`${el}E`, socketInputBooking))
    //EMAIL --//TODO
    // EmailAppointmentConfirmToSalon(['sigidevelopers@gmail.com'],inputData);

    //Notification
    const dateTime = emailDateFormate(inputData.on, inputData.startTime)
    const salonTokens = inputData?.salonDetail?.user?.deviceTokens?.map(
      (ele) => {
        return ele?.tokenId
      },
    )
    const customerTokens = inputData?.user?.deviceTokens?.map((ele) => {
      return ele?.tokenId
    })

    if (bookingData?.employeeData > 0) {
      bookingData.employeeData.forEach((ele) => {
        const employeesTokens = ele.tokens
        const employeeNotification = {
          title: `Appointment Rescheduled`,
          body: `Your appointment with ${fullName} has been rescheduled to ${ele.dateTime} for ${ele.service}`,
        }
        ThrowNotification(
          employeesTokens,
          employeeNotification,
          {
            appointment: ele.bookingId,
            name: bookingData?.client?.fullName,
            image: bookingData?.client.image,
          },
          ele.userId,
        )
      })
    }

    const customerNotification = {
      title: `Rescheduled Appointment`,
      body: `Your appointment with ${inputData?.salonDetail?.salonName} has been rescheduled to ${dateTime}. Please let us know if this works for you.`,
    }
    const fullName = `${inputData.user.firstName} ${inputData.user.lastName}`
    const salonNotification = {
      title: `Booking Rescheduled Alert`,
      body: `The appointment with ${fullName} has been rescheduled to ${dateTime}.`,
    }
    if (bookingData?.client?.customerEmail) {
      rescheduleEmailsToCustomer(
        [bookingData?.client?.customerEmail],
        inputData,
        'reschudle',
      )
      ThrowNotification(
        customerTokens,
        customerNotification,
        {
          appointment: inputData.id,
          name: bookingData?.salon?.salonName,
          image: bookingData?.salon.image,
        },
        bookingData.client.userId,
      )
    }

    ThrowNotification(
      salonTokens,
      salonNotification,
      {
        appointment: inputData.id,
        name: bookingData?.client?.fullName,
        image: bookingData?.client.image,
      },
      bookingData.salon.userId,
    )

    console.log('🚀 ~~~~~ eventDrivenCommunication ~~~~~~~ 🚀')
    return true
  } catch (error) {
    console.log('🚀 ~ exports.onlineAppointmentConfirm= ~ error:', error)
  }
}
