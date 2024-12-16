const { convertTo12HourFormat } = require('./dateManipulation')
const { retrievePaymentMethod } = require('../controllers/stripe')

const { blockCustomer } = require('../models')

exports.bookingFormat = (appointment) => {
  let servicesNames = []
  let specialists = []
  let assigned = true

  appointment.jobs.forEach((ele) => {
    if (ele.employeeId === null) {
      assigned = false
    }
    if (ele.employee && ele.employee.user) {
      specialists.push(ele.employee?.user?.firstName) // Add specialist name to the set
    }
    servicesNames.push(ele.service?.serviceName)
  })

  const statTime = convertTo12HourFormat(appointment.startTime)
  const endTimeBooking = convertTo12HourFormat(appointment.endTime)

  let socketData = {
    id: appointment.id,
    status: appointment.status,
    statTime,
    endTime: endTimeBooking,
    scheduleDate: appointment.on,
    duration: appointment.duration,
    assigned,
    client: `${appointment.user?.firstName} ${appointment.user?.lastName}`,
    clientEmail: `${appointment.user?.email}`,
    clientImage: `${appointment.user?.image}`,
    total: appointment.total,
    services: servicesNames,
    specialists: specialists.length > 0 ? [...new Set(specialists)] : [''],
  }
  const socketInputBooking = {
    event: 'update-appointment',
    data: socketData,
    bookingId: appointment?.id,
  }
  return { fromatedAppointment: socketData, socketInputBooking }
}

exports.formatedBookingsDetail = async (appointment) => {
  try {
    let cardDetails
    if (appointment.paymentMethod == 'card') {
      cardDetails = appointment?.stripeCardId
        ? await retrievePaymentMethod(appointment.stripeCardId)
        : {}
    }
    let customerStatus = 'active'

    const isblocked = await blockCustomer.findOne({
      where: {
        userId: appointment.customerId,
        salonDetailId: appointment.salonDetailId,
      },
      attributes: ['id'],
    })
    if (isblocked) customerStatus = 'block'

    let services = []

    appointment.jobs.map((ele) => {
      let obj = {
        id: ele.id,
        status: ele.status,
        on: ele.on,
        serviceId: ele.serviceId,
        serviceName: ele.service?.serviceName,
        color: ele.service?.category?.color,
        price: ele.total,
        startTime: convertTo12HourFormat(ele.startTime),
        duration: ele.duration,
        endTime: convertTo12HourFormat(ele.endTime),
        employeeId: ele.employeeId,
        specialists: ele.employee ? `${ele.employee.user.firstName}` : '',
        extra: ele.Extra,
      }
      services.push(obj)
    })
    const remaining =
      parseFloat(appointment.total) +
      parseFloat(appointment.discount) -
      parseFloat(appointment.actualCapturedAmount)
    let bookingDetail = {
      id: appointment.id,
      scheduleDate: appointment.on,
      status: appointment.status,
      discount: appointment.discount,
      actualCapturedAmount: `${appointment.actualCapturedAmount}`,
      client: `${appointment.user?.firstName ?? ''} ${
        appointment.user?.lastName ?? ''
      }`,
      profile: appointment.user?.image ?? '',
      email: appointment.user?.email ?? '',
      Phone: `${appointment.user?.countryCode ?? ''}${
        appointment.user?.phoneNum ?? ''
      }`,
      salonDetailId: appointment.salonDetailId,
      Upfront: `${appointment.initialPayment}`,
      duration: appointment.duration,
      initialPayment: `${appointment.initialPayment}`,
      total: appointment.total,
      customerId: appointment?.customerId ?? '',
      last4: cardDetails?.last4 ?? '',
      paymentMethodId: appointment?.stripeCardId ?? '',
      services,
      customerStatus,
      // clientFeedBack:appointment?.rating
    }
    const socketInputDetails = {
      event: 'reschedule-appointment',
      data: bookingDetail,
      bookingId: appointment?.id,
    }
    return { formatedBookingsDetail: bookingDetail, socketInputDetails }
  } catch (error) {
    console.log('----------------------------->', error)
  }
}
