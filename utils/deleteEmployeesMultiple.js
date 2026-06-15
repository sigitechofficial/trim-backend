const {
  pushNotification,
  jobs,
  booking,
  reason,
  cancelledBooking,
  salonDetail,
  user,
  deletedCustomer,
  deviceToken,
  employee,
} = require('../models')
const {
  cancelBySalon,
} = require('../controllers/eventDrivenCommunication/appointmentCancel')
const {
  socketForCalendar,
} = require('../controllers/eventDrivenCommunication/calendarView')
const Stripe = require('../controllers/stripe')

const {
  processAllAppointments,
  processAppointment,
} = require('./cancelMultipleBookings')

async function deleteEmployeesAll(salonId) {
  const workers = await employee.findAll({
    where: { salonDetailId: salonId },
    attributes: [
      'id',
      'userId',
      'isExternalEmployee',
      'isOwner',
      'salonDetailId',
    ],
  })
  if (workers && workers.length > 0) {
    for (const worker of workers) {
      if (worker.isOwner) {
        employee.update({ deleted: 1 }, { where: { salonDetailId: salonId } })
      } else if (workers.isExternalEmployee) {
        deleteExternalEmployee(worker.userId)
      } else {
        deleteRegularEmployee(worker.userId)
      }
    }
  }
}

async function deleteExternalEmployee(userid) {
  try {
    const id = userid

    const salon = await salonDetail.findOne({
      where: { userId: id },
      attributes: ['id'],
    })

    const data = await user.findOne({
      where: { id },
      attributes: [
        'firstName',
        'lastName',
        'image',
        'email',
        'countryCode',
        'phoneNum',
        'stripeCustomerId',
      ],
    })
    if (!data || !salon) return 0

    employee.update({ deleted: 1 }, { where: { salonDetailId: salon.id } })

    if (salon) {
      const work = await booking.findAll({
        where: {
          [Op.or]: [{ status: 'assign' }, { status: 'pending' }],
          salonDetailId: salon?.id,
        },
        attributes: [
          'id',
          'status',
          'actualCapturedAmount',
          'tip',
          'initialPaymentIntend',
          'stripeCardId',
          'total',
          'subTotal',
          'initialPayment',
          'salonDetailId',
        ],
      })
      processAllAppointments(work)
    }
    //TODO using Customer table for salon as well. will change in future if needed

    await deletedCustomer.create({ userId: id, ...data.get({ plain: true }) })

    await user.update(
      {
        deleted: true,
        firstName: 'Anonymous',
        lastName: 'Customer',
        email: `Anonymous${id}@gmail.com`,
        countryCode: '+00',
        phoneNum: '000 0000000',
        image: '',
      },
      { where: { id } },
    )

    Stripe.deleteCustomer(data?.stripeCustomerId, 'employee')
    deviceToken.destroy({ where: { userId: id } })
  } catch (error) {
    console.error('Error processing appointment:', error)
  }
}

async function deleteRegularEmployee(userid) {
  const userId = userid
  const worker = await employee.findOne({
    where: { userId },
    attributes: [
      ['userId', 'id'],
      'status',
      ['id', 'employeeId'],
      'isOwner',
      'isExternalEmployee',
    ],
  })
  if (!worker) return next(new appError('Data not found', 404))
  if (worker?.dataValues?.isOwner) {
    return next(new appError('The shop owner cannot be deleted.', 200))
  }
  // return res.json({ work, employeeId })

  if (worker?.isExternalEmployee) {
    const salon = await salonDetail.findOne({
      where: { userId },
      attributes: ['id'],
    })
    if (salon) {
      const work = await booking.findAll({
        where: {
          [Op.or]: [{ status: 'assign' }, { status: 'pending' }],
          salonDetailId: salon?.id,
        },
        attributes: [
          'id',
          'status',
          'actualCapturedAmount',
          'tip',
          'initialPaymentIntend',
          'stripeCardId',
          'total',
          'subTotal',
          'initialPayment',
          'salonDetailId',
        ],
      })
      processAllAppointments(work)
    }
  } else {
    const employeeId = worker?.dataValues?.employeeId
    console.log('🚀 ~ exports.deleteEmployee ~ employeeId:', employeeId)
    const work = await jobs.findAll({
      where: { status: 'assign', employeeId },
      attributes: ['id', 'bookingId'],
    })

    if (work && work.length > 0) {
      const jobsIds = work.map((ele) => ele.id)
      console.log('🚀 ~ exports.deleteEmployee ~ jobsIds:', jobsIds)
      const bookingIds = work.map((ele) => ele.bookingId)
      console.log('🚀 ~ exports.deleteEmployee ~ bookingIds:', bookingIds)
      const uniqueBookingIds = [...new Set(bookingIds)]
      console.log(
        '🚀 ~ exports.deleteEmployee ~ uniqueBookingIds:',
        uniqueBookingIds,
      )
      jobs.update(
        { employeeId: null, status: 'pending' },
        { where: { id: jobsIds } },
      )
      booking.update({ status: 'pending' }, { where: { id: uniqueBookingIds } })
    }
  }
  user.update({ deleted: true }, { where: { id: userId } })
  employee.update({ deleted: true }, { where: { userId: userId } })
  deviceToken.destroy({ where: { userId } })
}
module.exports = {
  deleteExternalEmployee,
  deleteEmployeesAll,
  deleteRegularEmployee,
}
