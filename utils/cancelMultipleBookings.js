const {
  pushNotification,
  jobs,
  booking,
  reason,
  cancelledBooking,
} = require('../models')
const {
  cancelBySalon,
} = require('../controllers/eventDrivenCommunication/appointmentCancel')
const {
  socketForCalendar,
} = require('../controllers/eventDrivenCommunication/calendarView')
const Stripe = require('../controllers/stripe')

async function processAllAppointments(allAppointments) {
  if (!allAppointments || allAppointments.length)
    for (const appointment of allAppointments) {
      try {
        await processAppointment(appointment)
        console.log(
          `Appointment ${appointment.bookingId} processed successfully.`,
        )
      } catch (error) {
        console.error(
          `Failed to process appointment ${appointment?.id}:`,
          error,
        )
      }
    }
}

async function processAppointment(appointment) {
  try {
    const updatedBooking = { tip: 0 }

    // Calculate the paid amount
    const paid =
      parseFloat(appointment.actualCapturedAmount) + parseFloat(appointment.tip)

    // Process refund if applicable
    if (
      paid > 0 &&
      appointment.stripeCardId &&
      appointment.initialPaymentIntend
    ) {
      const refundAmount = paid
      const refund = await Stripe.refundFullPayment(
        appointment.initialPaymentIntend,
      )
      if (refund?.id) {
        updatedBooking.finalPayment = 'paid'
        updatedBooking.refundAmount = refundAmount
        updatedBooking.refundPaymentIntend = refund.id
      }
      console.log('Refund Success', refund)
    }

    // Update booking details
    updatedBooking.status = 'cancel'
    updatedBooking.total = paid
    updatedBooking.subTotal = appointment.total
    updatedBooking.initialPayment = paid

    booking.update(updatedBooking, {
      where: { id: appointment.bookingId },
    })

    jobs.update(
      { status: 'cancel' },
      { where: { bookingId: appointment.bookingId } },
    )

    // Retrieve cancellation reason

    // Create cancelled booking details record
    cancelledBooking.create({
      reasonText:
        'The appointment has been called off as the employee is no longer part of the salon.',
      bookingId: appointment.bookingId,
      userId: appointment.userId,
      reasonId: appointment.reasonId,
    })

    // Trigger additional actions
    cancelBySalon(appointment.bookingId)
    socketForCalendar({ appointmentId: appointment.bookingId, type: 'finish' })
  } catch (error) {
    console.error('Error processing appointment:', error)
  }
}

module.exports = {
  processAppointment,
  processAllAppointments,
}
