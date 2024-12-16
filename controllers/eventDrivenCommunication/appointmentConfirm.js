const { employee, user, jobs, service } = require('../../models')
const { emailDateFormate } = require('../../utils/emailDateFormate')
const { sendEvent } = require('../../socket_io')
const ThrowNotification = require('../../utils/throwNotification')
const DateManupulation = require('../../utils/dateManipulation')
const EmailAppointmentToSalon = require('../../helper/AppointmentEmailsToSalon')
const EmailAppointmentToCustomer = require('../../helper/AppointmentEmailsToCustomer')

const { employeeForSocket } = require('../../utils/socketUtilities')
const {
  bookingDataForEmailAndNotifications,
} = require('../../utils/emailsNotificationsData')

exports.onlineAppointmentConfirm = async (bookingId) => {
  try {
    console.log('🚀 ~ onlineAppointmentConfirm')
    const bookingData = await bookingDataForEmailAndNotifications(bookingId)
    //EMAIL
    if (!bookingData) return false
    const emailInput = bookingData?.appointment

    EmailAppointmentToSalon([`${bookingData?.salon?.salonEmail}`], emailInput)
    if (bookingData?.client?.customerEmail) {
      console.log(
        '🚀 ~ exports.onlineAppointmentConfirm= ~ bookingData?.client?.customerEmail:',
        bookingData?.client?.customerEmail,
      )
      EmailAppointmentToCustomer(
        [`${bookingData?.client?.customerEmail}`],
        emailInput,
      )
    }
    //Notification
    const dateTime = emailDateFormate(emailInput.on, emailInput.startTime)
    const salonTokens = emailInput?.salonDetail?.user?.deviceTokens?.map(
      (ele) => {
        return ele?.tokenId
      },
    )
    const customerTokens = emailInput?.user?.deviceTokens?.map((ele) => {
      return ele?.tokenId
    })

    const customerNotification = {
      title: `Appointment Confirmation`,
      body: `Your appointment with ${emailInput?.salonDetail?.salonName} on ${dateTime} has been confirmed. Looking forward to seeing you!`,
    }
    const fullName = `${emailInput.user.firstName} ${emailInput.user.lastName}`
    const salonNotification = {
      title: `New Appointment Alert`,
      body: `A new appointment has been booked with ${fullName} on ${dateTime}.`,
    }

    if (bookingData?.employeeData > 0) {
      bookingData.employeeData.forEach((ele) => {
        const employeesTokens = ele.tokens
        const employeeNotification = {
          title: `Appointment Assigned`,
          body: `A new appointment has been booked with ${fullName} on ${ele.dateTime} for ${ele.service}`,
        }
        ThrowNotification(
          employeesTokens,
          employeeNotification,
          {
            appointment: ele.bookingId,
            name: bookingData.client?.fullName,
            image: bookingData.client.image,
          },
          ele.userId,
        )
      })
    }

    ThrowNotification(
      salonTokens,
      salonNotification,
      {
        appointment: emailInput.id,
        name: bookingData.client?.fullName,
        image: bookingData.client?.image,
      },
      emailInput?.salonDetail?.user?.id,
    )
    ThrowNotification(
      customerTokens,
      customerNotification,
      {
        appointment: emailInput.id,
        name: bookingData.salon?.salonName,
        image: bookingData.salon?.image,
      },
      emailInput?.user?.id,
    )

    //.SOCKET

    let servicesNames = []
    let specialists = []
    let salonEmployeeIds = []
    let assigned = true
    emailInput.jobs.map((ele) => {
      if (ele.employeeId === null) {
        assigned = false
      }
      if (ele.employee && ele.employee.user) {
        specialists.push(ele.employee?.user?.firstName)
        salonEmployeeIds.push(ele.employee.id) // Add specialist name to the set
      }
      servicesNames.push(ele.service?.serviceName)
    })

    statTime = DateManupulation.convertTo12HourFormat(emailInput.startTime)
    endTime = DateManupulation.convertTo12HourFormat(emailInput.endTime)

    let socketData = {
      id: emailInput.id,
      status: emailInput.status,
      statTime,
      endTime,
      scheduleDate: emailInput.on,
      duration: emailInput.duration,
      assigned,
      client: `${emailInput.user?.firstName} ${emailInput.user?.lastName}`,
      clientEmail: `${emailInput.user?.email}`,
      clientImage: `${emailInput.user?.image}`,
      total: emailInput.total,
      services: servicesNames,
      specialists: specialists.length > 0 ? [...new Set(specialists)] : [''],
    }
    const socketInput = {
      event: 'book-appointment',
      data: socketData,
      bookingId: emailInput.id,
    }
    sendEvent(`${emailInput?.salonDetailId}S`, socketInput)
    const workers = await employeeForSocket(emailInput?.salonDetailId)
    workers.forEach((el) => sendEvent(`${el}E`, socketInput))

    console.log('🚀 ~~~~~ eventDrivenCommunication ~~~~~~~ 🚀')
    return true
  } catch (error) {
    console.log('🚀 ~ exports.onlineAppointmentConfirm= ~ error:', error)
  }
}

exports.walkinAppointmentConfirm = async (
  appointmentData,
  customerId,
  salonDetailId,
) => {
  try {
    const newJobs = await jobs.findAll({
      where: { bookingId: appointmentData.id },
      include: [
        { model: service, attributes: ['serviceName'] },
        {
          model: employee,
          include: { model: user, attributes: ['firstName'] },
        },
      ],
    })
    const customerData = await user.findByPk(customerId, {
      attributes: ['firstName', 'lastName', 'email', 'image'],
    })
    let servicesNames = []
    let specialists = []
    let assigned = true
    newJobs.map((ele) => {
      if (ele.employeeId === null) {
        assigned = false
      }
      if (ele?.employee && ele?.employee?.user) {
        specialists.push(ele.employee?.user?.firstName) // Add specialist name to the set
      }
      servicesNames.push(ele.service?.serviceName)
    })

    let statTime = DateManupulation.convertTo12HourFormat(
      appointmentData.startTime,
    )
    let bookingEndTime = DateManupulation.convertTo12HourFormat(
      appointmentData.endTime,
    )

    let socketData = {
      id: appointmentData.id,
      status: appointmentData.status,
      statTime,
      endTime: bookingEndTime,
      scheduleDate: appointmentData.on,
      duration: appointmentData.duration * 1,
      assigned,
      client: `${customerData?.firstName} ${customerData?.lastName}`,
      clientEmail: `${customerData?.email}`,
      clientImage: `${customerData?.image}`,
      total: `${appointmentData.total}`,
      services: servicesNames,
      specialists: specialists?.length > 0 ? [...new Set(specialists)] : [''],
    }
    const socketInput = {
      event: 'book-appointment',
      data: socketData,
      bookingId: appointmentData.id,
    }
    sendEvent(`${salonDetailId}S`, socketInput)
    const workers = await employeeForSocket(salonDetailId)
    workers.forEach((el) => sendEvent(`${el}E`, socketInput))

    console.log('🚀 ~~~~~ eventDrivenCommunication ~~~~~~~ 🚀')

    return true
  } catch (error) {
    console.log('🚀 ~ exports.onlineAppointmentConfirm= ~ error:', error)
  }
}
