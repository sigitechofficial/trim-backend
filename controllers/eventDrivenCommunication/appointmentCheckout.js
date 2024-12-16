const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })
const { unAcknowledgedEvents } = require('../../models')
const { emailDateFormate } = require('../../utils/emailDateFormate')
const { sendEvent } = require('../../socket_io')
const ThrowNotification = require('../../utils/throwNotification')
const DateManupulation = require('../../utils/dateManipulation')
const EmailAppointmentToSalon = require('../../helper/AppointmentEmailsToSalon')
const { employeeForSocket } = require('../../utils/socketUtilities')
const ThankYouForVisiting = require('../../helper/ThankYouForVisiting')

const { CURRENCY_UNIT } = process.env

const {
  bookingDataForEmailAndNotifications,
} = require('../../utils/emailsNotificationsData')

//* case: payment manual capture (CASH)

exports.cash = async (bookingId, tip, amount = 0) => {
  try {
    //Notification
    const booking = await bookingDataForEmailAndNotifications(bookingId)
    //EMAIL
    if (!booking) return false
    const bookingData = booking.appointment
    EmailAppointmentToSalon(
      [`${booking?.salon?.salonEmail}`],
      bookingData,
      'complete',
    )
    const dateTime = emailDateFormate(bookingData.on, bookingData.startTime)

    const salonTokens = bookingData?.salonDetail?.user?.deviceTokens?.map(
      (ele) => {
        return ele?.tokenId
      },
    )

    const customerTokens = bookingData?.user?.deviceTokens?.map((ele) => {
      return ele?.tokenId
    })

    const customerNotification = {
      title: `Thank You for Visiting`,
      body: `Thank you for visiting ${bookingData?.salonDetail?.salonName}! We hope you enjoyed. Please leave a review.`,
    }

    if (tip > 0) {
      const TipNotification = {
        title: `Thank You for Tipping`,
        body: `Thank you for your generous tip. We greatly appreciate your support!`,
      }
      ThrowNotification(
        customerTokens,
        TipNotification,
        {
          appointment: bookingData?.id,
          name: booking.salon.salonName,
          image: booking.salon.image,
        },
        booking.client?.userId,
      )
    }

    const fullName = `${bookingData?.user?.firstName} ${bookingData?.user?.lastName}`
    const salonNotification = {
      title: `Payment Received`,
      body: `Payment of ${CURRENCY_UNIT}${amount} received from ${fullName}.`,
    }
    //TODO  $[Amount]

    if (bookingData?.customerId) {
      ThankYouForVisiting([booking?.client?.customerEmail], booking)
      ThrowNotification(
        salonTokens,
        salonNotification,
        {
          appointment: bookingData.id,
          name: booking.client.fullName,
          image: booking.client.image,
        },
        booking?.salon?.userId,
      )
    }

    ThrowNotification(
      customerTokens,
      customerNotification,
      {
        appointment: bookingData.id,
        name: booking.salon.salonName,
        image: booking.salon.image,
      },
      booking.client?.userId,
    )

    const socketInput = {
      event: 'complete-appointment',
      data: { id: bookingId * 1 },
      bookingId: bookingId,
    }
    await unAcknowledgedEvents.destroy({ where: { bookingId: bookingId } })
    sendEvent(`${bookingData?.salonDetailId}S`, socketInput)
    const workers = await employeeForSocket(bookingData?.salonDetailId)
    workers.forEach((el) => sendEvent(`${el}E`, socketInput))
    console.log('🚀 ~~~~~ eventDrivenCommunication ~~~~~~~ 🚀')
    return true
  } catch (error) {
    console.log('🚀 ~ exports.onlineAppointmentConfirm= ~ error:', error)
  }
}
//* case: payment capture by online method

exports.online = async (bookingId, tip, amount = 0) => {
  try {
    const booking = await bookingDataForEmailAndNotifications(bookingId)
    //EMAIL
    if (!booking) return false
    const bookingData = booking.appointment
    EmailAppointmentToSalon(
      [`${booking?.salon?.salonEmail}`],
      bookingData,
      'complete',
    )

    const salonTokens = bookingData?.salonDetail?.user?.deviceTokens?.map(
      (ele) => {
        return ele?.tokenId
      },
    )
    const customerTokens = bookingData?.user?.deviceTokens?.map((ele) => {
      return ele?.tokenId
    })

    if (tip > 0) {
      console.log('ðŸš€ ~ exports.checkOutBooking= ~ tip:', tip)
      const TipNotification = {
        title: `Thank You for Tipping`,
        body: `Thank you for your generous tip. We greatly appreciate your support!`,
      }

      ThrowNotification(
        customerTokens,
        TipNotification,
        {
          appointment: bookingData.id,
          name: booking.salon.salonName,
          image: booking.salon.image,
        },
        booking?.client?.userId,
      )
    }

    const customerNotification = {
      title: `Thank You for Visiting`,
      body: `Thank you for visiting ${bookingData?.salonDetail?.salonName}! We hope you enjoyed. Please leave a review.`,
    }

    console.log(
      'ðŸš€ ~ exports.checkOutBooking= ~ customerNotification:',
      customerNotification,
    )

    const fullName = `${bookingData.user.firstName} ${bookingData.user.lastName}`
    const salonNotification = {
      title: `Payment Received`,
      body: `Payment of ${amount} received from ${fullName}.`,
    }

    ThrowNotification(
      salonTokens,
      salonNotification,
      {
        appointment: bookingData?.id,
        name: booking.client?.fullName,
        image: booking.client?.image,
      },
      bookingData?.salonDetail?.user.id,
    )

    if (booking?.customerId) {
      ThankYouForVisiting([booking?.client?.customerEmail], booking)
      ThrowNotification(
        customerTokens,
        customerNotification,
        {
          appointment: bookingData?.id,
          name: booking.salon?.salonName,
          image: booking.salon?.image,
        },
        booking?.client?.userId,
      )
    }

    const socketInput = {
      event: 'complete-appointment',
      data: { id: bookingId * 1 },
      bookingId: bookingId,
    }

    await unAcknowledgedEvents.destroy({ where: { bookingId: bookingId } })
    sendEvent(`${bookingData.salonDetailId}S`, socketInput)
    const workers = await employeeForSocket(bookingData?.salonDetailId)
    workers.forEach((el) => sendEvent(`${el}E`, socketInput))

    console.log('🚀 ~~~~~ eventDrivenCommunication ~~~~~~~ 🚀')

    return true
  } catch (error) {
    console.log('🚀 ~ exports.onlineAppointmentConfirm= ~ error:', error)
  }
}

//* case: Save Unpaid (for later)

exports.saveUnpaid = async (bookingData) => {
  try {
    // const { appointment } = await bookingDataForEmailAndNotifications(bookingId)
    // //EMAIL
    // const bookingData = appointment

    const socketInput = {
      event: 'complete-appointment',
      data: { id: bookingData?.id * 1 },
      bookingId: bookingData?.id,
    }

    await unAcknowledgedEvents.destroy({
      where: { bookingId: bookingData?.id },
    })

    sendEvent(`${bookingData?.salonDetailId}S`, socketInput)
    const workers = await employeeForSocket(bookingData?.salonDetailId)
    workers.forEach((el) => sendEvent(`${el}E`, socketInput))
    console.log('🚀 ~~~~~ eventDrivenCommunication ~~~~~~~ 🚀')

    return true
  } catch (error) {
    console.log('🚀 ~ exports.onlineAppointmentConfirm= ~ error:', error)
  }
}
