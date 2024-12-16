const { Op, literal, fn, col } = require('sequelize')
const { CURRENCY_UNIT } = process.env
const {
  user,
  employee,
  time,
  service,
  employeeService,
  otpVerification,
  deviceToken,
  wagesMethod,
  employeeWagesMethod,
  salonDetail,
  booking,
  jobs,
  opportunities,
} = require('../../models')
const AppError = require('../../utils/appError')
const DateManupulation = require('../../utils/dateManipulation')
const Report = require('../../utils/reportsGenerators')
const Graph = require('../../utils/graphsGenerators')
const Color = require('../../utils/colors')

const response = ({ status, message, data, error }) => {
  return {
    status: status ? `${status}` : '1',
    message: message ? `${message}` : 'success',
    data: data || {},
    error: error ? `${error}` : '',
  }
}
const CustomDate = require('../../utils/currentDay')
//* 1.Reports-> Peak times Report

exports.peakTimesReport = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  if (!salon) throw new AppError('resource not found', 404)

  const condition = {
    salonDetailId: salon.id,
    status: 'complete',
  }

  if (req.query && req.query.startDate && req.query.endDate) {
    condition.on = { [Op.between]: [req.query.startDate, req.query.endDate] }
  }

  const appointments = await booking.findAll({
    where: {
      // salonDetailId: salonId,//TODO
      // status: ''
    },
    attributes: [
      'id',
      'status',
      'startTime',
      'on',
      [
        literal(
          '(SELECT COUNT(*) FROM jobs WHERE jobs.bookingId = booking.id)',
        ),
        'serviceCount',
      ],
    ],
    include: [
      {
        model: jobs,
        attributes: [],
      },
    ],
  })

  const input = JSON.parse(JSON.stringify(appointments))
  const output = Report.peakTimeReportGenerator(input)
  return res.status(200).json(response({ data: { report: output } }))
}

//* 2.Reports-> Financial Report

exports.financialReport = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  const condition = {
    salonDetailId: salon.id,
    // status: 'complete'
  }

  if (req.query && req.query.startDate && req.query.endDate) {
    condition.on = { [Op.between]: [req.query.startDate, req.query.endDate] }
  }

  const appointments = await booking.findAll({
    where: condition,
    attributes: [
      'id',
      'status',
      'startTime',
      'on',
      [
        literal(
          '(SELECT COUNT(*) FROM jobs WHERE jobs.bookingId = booking.id)',
        ),
        'serviceCount',
      ],
      'total',
      'customerId',
    ],
    include: [
      {
        model: jobs,
        required: true,
        attributes: ['id', 'duration', 'total'],
        include: { model: service, attributes: ['id', 'serviceName'] },
      },
    ],
  })

  const input = JSON.parse(JSON.stringify(appointments))
  let output = []
  if (input.length > 0 && !req.params.filter)
    output = Report.generateFinancialReport(input)
  if (input.length > 0 && req.params.filter === 'year') {
    output = Report.generateFinancialReport(input)
    output.forEach((el) => {
      el.x = el.month
      delete el.month
    })
  }
  if (input.length > 0 && req.params && req.params.filter === 'month')
    output = Graph.generateFinancialGraphMonth(input)
  if (input.length > 0 && req.params && req.params.filter === 'week')
    output = Graph.generateFinancialGraphWeek(input)

  return res
    .status(200)
    .json(response({ data: { currencyUnit: CURRENCY_UNIT, report: output } }))
}

//* 3.Reports-> EP & STC Report

exports.EP_STCReport = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })
  if (!salon) throw new AppError('resource not found', 404)
  const { lastDateOfCurrentMonth, startDateOfPreviousMonth } =
    DateManupulation.TwoMonthStartEndDate()

  const appointments = await booking.findAll({
    where: {
      salonDetailId: salon.id,
      status: 'complete',
      on: {
        [Op.between]: [startDateOfPreviousMonth, lastDateOfCurrentMonth],
      },
    },
    attributes: ['id'],
    include: [
      {
        model: jobs,
        required: true,
        where: { employeeId: { [Op.not]: null } },
        attributes: ['id', 'duration', 'total', 'on'],
        include: [
          { model: service, attributes: ['id', 'serviceName'] },
          {
            model: employee,
            attributes: ['id', 'position'],
            include: { model: user, attributes: ['firstName', 'lastName'] },
          },
        ],
      },
    ],
  })

  const input = appointments.flatMap((obj) => obj.jobs)
  const output =
    input.length > 0 ? Report.generateEmployeeComparisionReport(input) : []
  return res
    .status(200)
    .json(response({ data: { currencyUnit: CURRENCY_UNIT, report: output } }))
}

//* 4.Reports-> Time Off Day Analysis Report

exports.timeOffDayAnalysisReport = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })
  if (!salon) throw new AppError('resource not found', 404)

  console.log('🚀 ~ exports.peakTimesReport= ~ salonId:', req.query.date)

  const conditionDate =
    req.query && req.query.date ? req.query.date : new Date()

  const appointments = await booking.findAll({
    where: {
      salonDetailId: salon.id,
      status: 'complete',
      on: conditionDate,
    },
    attributes: ['id', 'startTime', 'on', 'total'],
  })

  const promotions = await opportunities.findAll({
    attributes: [`hours`, `staffingLevel`, `promotions`],
  })

  const input = JSON.parse(JSON.stringify(appointments))
  const output =
    input.length > 0 ? Report.timeOffDayAnalysisReportGenerator(input) : []
  if (output.length > 0) {
    output.forEach((el) => {
      output.forEach((el) => {
        const find = promotions.find(
          (obj) =>
            el.staffingLevels == obj.staffingLevel && el.time == obj.hours,
        )
        if (find) el.opportunitiesForPromotions = find.promotions
      })
    })
  }
  return res
    .status(200)
    .json(response({ data: { currencyUnit: CURRENCY_UNIT, report: output } }))
}

//* 5.Reports-> Client File

exports.clientFileReport = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })
  if (!salon) throw new AppError('resource not found', 404)
  console.log('🚀 ~ exports.clientFileReport= ~ req.user.id:', req.user.id)
  console.log('🚀 ~ exports.clientFileReport= ~ salon.id:', salon.id)

  const condition = {
    salonDetailId: salon.id,
    status: { [Op.or]: ['complete', 'cancel', 'no-show'] },
  }

  if (req.query && req.query.startDate && req.query.endDate) {
    condition.on = { [Op.between]: [req.query.startDate, req.query.endDate] }
  }

  const appointments = await booking.findAll({
    where: condition,
    attributes: [
      'status',
      'on',
      'actualCapturedAmount',
      [
        literal(
          '(SELECT COUNT(*) FROM jobs WHERE jobs.bookingId = booking.id)',
        ),
        'serviceCount',
      ],
    ],
    include: [
      {
        model: user,
        attributes: [`id`, `firstName`, 'lastName'],
      },
      {
        model: jobs,
        required: true,
        attributes: ['id'],
        include: { model: service, attributes: ['serviceName'] },
      },
    ],
  })

  const input = JSON.parse(JSON.stringify(appointments))

  const output = input.length > 0 ? Report.clientFileReportGenerator(input) : []
  return res
    .status(200)
    .json(response({ data: { currencyUnit: CURRENCY_UNIT, report: output } }))
}

//* 6.Reports-> Appointment Conversion

exports.appointmentConversionReport = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })
  if (!salon) throw new AppError('resource not found', 404)
  console.log('🚀 ~ exports.clientFileReport= ~ req.user.id:', req.user.id)
  console.log('🚀 ~ exports.clientFileReport= ~ salon.id:', salon.id)

  const condition = {
    salonDetailId: salon.id,
    status: { [Op.or]: ['complete', 'cancel', 'no-show'] },
  }

  if (req.query && req.query.startDate && req.query.endDate) {
    condition.on = { [Op.between]: [req.query.startDate, req.query.endDate] }
  }

  const appointments = await booking.findAll({
    where: condition,
    attributes: [
      [fn('date', col('on')), 'bookingDate'],
      'status',
      [fn('count', literal('*')), 'bookingCount'],
    ],
    group: ['bookingDate', 'status'],
  })

  const input = JSON.parse(JSON.stringify(appointments))

  const output = Report.appointmentConversionGenerator(input)
  return res
    .status(200)
    .json(response({ data: { currencyUnit: CURRENCY_UNIT, report: output } }))
}
//! EXtra Graph

//* 6.Reports-> Graph sevices Sold

exports.sevicesSoldGraph = async (req, res, next) => {
  const colors = Color.generateHexColorsArray(100)
  const currentDay = CustomDate.currentDay()

  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  if (!salon) throw new AppError('resource not found', 404)

  const startDate =
    req.query && req.query.startDate ? req.query.startDate : '2024-01-01'
  const endDate =
    req.query && req.query.startDate
      ? req.query.startDate
      : currentDay.currentDateOnly

  const condition = {
    salonDetailId: salon.id,
  }

  const appointments = await service.findAll({
    where: condition,
    attributes: [
      'id',
      'serviceName',
      [
        literal(
          `(SELECT COUNT(*) FROM jobs WHERE jobs.serviceId = service.id AND jobs.on BETWEEN '${startDate}' AND '${endDate}' AND jobs.status = 'complete')`,
        ),
        'soldCount',
      ],
      [
        fn(
          'FORMAT',
          literal(
            `(SELECT SUM(jobs.total) FROM jobs WHERE jobs.serviceId = service.id AND jobs.on BETWEEN '${startDate}' AND '${endDate}' AND jobs.status = 'complete')`,
          ),
          1,
        ),
        'revenue',
      ],
    ],
    group: ['service.id'],
  })

  const input = JSON.parse(JSON.stringify(appointments))
  const output =
    input.length > 0
      ? input.map((el) => {
          el.color = colors[el.id]
          return el
        })
      : []
  return res
    .status(200)
    .json(response({ data: { currencyUnit: CURRENCY_UNIT, report: output } }))
}

//* 6.Reports-> Graph sevices Sold

exports.clientStatusDistributionGraph = async (req, res, next) => {
  const currentDay = CustomDate.currentDay()
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  if (!salon) throw new AppError('resource not found', 404)
  const startDate =
    req.query && req.query.startDate ? req.query.startDate : '2024-02-01'
  const endDate =
    req.query && req.query.startDate ? req.query.startDate : '2024-03-31'
  const condition = {
    salonDetailId: salon.id,
    on: { [Op.between]: [startDate, endDate] },
  }
  const appointments = await booking.findAll({
    where: condition,
    attributes: ['id', 'on', 'customerId'],
  })

  const input = JSON.parse(JSON.stringify(appointments))
  const output = input.length > 0 ? Graph.customerStatusGraph(input) : null
  return res
    .status(200)
    .json(response({ data: { currencyUnit: CURRENCY_UNIT, report: output } }))
}
//* 6.Reports-> Graph EP_STCReport
exports.EP_STCGraph = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })
  if (!salon) throw new AppError('resource not found', 404)

  const startDate = req.query.startDate
  const endDate = req.query.endDate
  const appointments = await employee.findAll({
    where: {
      salonDetailId: salon.id,
    },
    attributes: [
      'id',
      [
        literal(
          `(SELECT COUNT(*) FROM jobs WHERE jobs.employeeId = employee.id AND jobs.on BETWEEN '${startDate}' AND '${endDate}' AND jobs.status = 'complete')`,
        ),
        'servicesCount',
      ],
      [
        fn(
          'FORMAT',
          literal(
            `(SELECT SUM(jobs.total) FROM jobs WHERE jobs.employeeId = employee.id AND jobs.on BETWEEN '${startDate}' AND '${endDate}' AND jobs.status = 'complete')`,
          ),
          1,
        ),
        'revenue',
      ],
      [
        literal(
          `(SELECT COUNT(DISTINCT jobs.bookingId) FROM jobs WHERE jobs.employeeId = employee.id AND jobs.on BETWEEN '${startDate}' AND '${endDate}' AND '${endDate}' AND jobs.status = 'complete')`,
        ),
        'bookingCount',
      ],
    ],
    include: {
      model: user,
      required: true,
      attributes: ['firstName', 'lastName'],
    },
    group: ['employee.id'],
  })

  // const input = appointments.flatMap(obj => obj.jobs);
  // let output = [];
  // if(input.length > 0){
  //   if (req.params.filter === 'week') output = Graph.EP_STCGraphWeek(input)
  //   if (req.params.filter === 'month') output = Graph.EP_STCGraphMonth(input)
  //   if (req.params.filter === 'year') output = Graph.EP_STCGraphYear(input)
  // }
  return res
    .status(200)
    .json(
      response({ data: { currencyUnit: CURRENCY_UNIT, report: appointments } }),
    )
}
