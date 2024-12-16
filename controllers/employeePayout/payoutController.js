const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })
const { CURRENCY_UNIT } = process.env

const { Op, literal, col, fn, where } = require('sequelize')

const {
  user,
  salonDetail,
  rating,
  addressDBS,
  category,
  service,
  salonImage,
  employee,
  time,
  employeeService,
  jobs,
  booking,
  socialLink,
  coupon,
  favorite,
  paymentPolicy,
  cancellationPolicy,
  depositPolicy,
  noShowPolicy,
  reschedulePolicy,
  blockCustomer,
  announcement,
  employeeWagesMethod,
} = require('../../models')
const AppError = require('../../utils/appError')
const Slot = require('../../utils/timeSlots')
const Custom = require('../../utils/customFunctions')
const Stripe = require('../stripe')
const ThrowNotification = require('../../utils/throwNotification')
const DateManupulation = require('../../utils/dateManipulation')
const CustomDate = require('../../utils/currentDay')
const { response } = require('../../utils/response')

exports.calculateCommission = async (req, res, next) => {
  const id = req.params.booking

  const data = await booking.findOne({
    where: { id },
    attributes: ['id'],
    include: [
      {
        model: jobs,
        attributes: [
          'id',
          'status',
          'total',
          'duration',
          'employeeId',
          'tip',
          'extra',
        ],
        include: [
          {
            model: employee,
            attributes: ['id'],
            include: [
              { model: user, attributes: ['firstName', 'lastName'] },
              {
                model: employeeWagesMethod,
                attributes: ['value', 'wagesMethodId'],
              },
            ],
          },
          { model: service, attributes: ['id', 'serviceName'] },
        ],
      },
    ],
  })

  if (!data) {
    return res.status(404).json({ message: 'Booking not found.' })
  }
  const cleanData = JSON.parse(JSON.stringify(data))

  // Array to store commission data per employee
  const employeeCommissions = []

  // Iterate over jobs to calculate commission per employee
  cleanData.jobs.forEach((job) => {
    const employeeId = job.employee.id
    const commissionPercentage = job.employee.employeeWagesMethod.value
    const total = parseFloat(job.total)
    const commission = (commissionPercentage / 100) * total

    // Create the employee commission object and push to array
    employeeCommissions.push({
      jobId: job.id,
      byJob: job.status,
      serviceId: job.serviceId,
      employeeId,
      total: total.toFixed(2), // Ensure total has 2 decimal places
      commission: commission.toFixed(2), // Ensure commission has 2 decimal places
    })
  })

  return res
    .status(200)
    .json({ message: 'Appointment.', data: employeeCommissions })
}
