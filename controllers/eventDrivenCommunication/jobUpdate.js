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
const EmailAppointmentConfirmToSalon = require('../../helper/AppointmentEmailsToSalon')
const { employeeForSocket } = require('../../utils/socketUtilities')
const {
  bookingDataForEmailAndNotifications,
} = require('../../utils/emailsNotificationsData')
const {
  calculatePayoutsOnService,
  calculatePayoutsOnBooking,
} = require('../salonControllers/payoutController')

exports.editJob = async (jobId, jobStatus) => {
  try {
    const input = await jobs.findOne({
      where: { id: jobId },
      include: [
        { model: service, include: { model: category, attributes: ['color'] } },
        {
          model: employee,
          include: { model: user, attributes: ['firstName'] },
        },
      ],
    })
    const output = {
      id: jobId,
      status: jobStatus,
      on: input.on,
      serviceId: input.serviceId,
      serviceName: input.service?.serviceName,
      color: input.service?.category?.color,
      price: input.total,
      startTime: DateManupulation.convertTo12HourFormat(input.startTime),
      duration: input.duration,
      endTime: DateManupulation.convertTo12HourFormat(input.endTime),
      employeeId: input.employeeId,
      specialists: input.employee ? `${input.employee.user.firstName}` : '',
      extra: input.Extra,
    }

    const bookingData = await booking.findOne({
      where: { id: input.bookingId },
      include: [
        {
          model: user,
          attributes: ['firstName', 'lastName', 'email', 'image'],
        },
        {
          model: jobs,
          include: [
            {
              model: service,
              include: { model: category, attributes: ['color'] },
            },
            {
              model: employee,
              include: { model: user, attributes: ['firstName'] },
            },
          ],
        },
      ],
    })
    const socketInputService = {
      event: 'update-service',
      data: { type: 'update', job: output, total: bookingData?.total },
      bookingId: bookingData?.id,
    }
    sendEvent(`${bookingData?.salonDetailId}S`, socketInputService)
    const workers = await employeeForSocket(bookingData?.salonDetailId)
    workers.forEach((el) => sendEvent(`${el}E`, socketInputService))

    let servicesNames = []
    let specialists = []
    let assigned = true
    bookingData.jobs.map((ele) => {
      if (ele.employeeId === null) {
        assigned = false
      }
      if (ele.employee && ele.employee.user) {
        specialists.push(ele.employee?.user?.firstName) // Add specialist name to the set
      }
      servicesNames.push(ele.service?.serviceName)
    })

    const statTime = DateManupulation.convertTo12HourFormat(
      bookingData.startTime,
    )
    const endTimeBooking = DateManupulation.convertTo12HourFormat(
      bookingData.endTime,
    )

    let socketData = {
      id: bookingData.id,
      status: bookingData.status,
      statTime,
      endTime: endTimeBooking,
      scheduleDate: bookingData.on,
      duration: bookingData.duration,
      assigned,
      client: `${bookingData.user?.firstName} ${bookingData.user?.lastName}`,
      clientEmail: `${bookingData.user?.email}`,
      clientImage: `${bookingData.user?.image}`,
      total: bookingData.total,
      services: servicesNames,
      specialists: specialists.length > 0 ? [...new Set(specialists)] : [''],
    }
    const socketInputBooking = {
      event: 'update-appointment',
      data: socketData,
      bookingId: bookingData?.id,
    }
    sendEvent(`${bookingData?.salonDetailId}S`, socketInputBooking)
    const workersForbooking = await employeeForSocket(
      bookingData?.salonDetailId,
    )
    workersForbooking.forEach((el) => sendEvent(`${el}E`, socketInputBooking))

    console.log('🚀 ~~~~~ eventDrivenCommunication ~~~~~~~ 🚀')
    return true
  } catch (error) {
    console.log('🚀 ~ exports.onlineAppointmentConfirm= ~ error:', error)
  }
}
