const { Op, literal, fn, col } = require('sequelize')
const { sequelize } = require('../../models')

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
const {
  busiestQuietestDays,
  busiestQuietestHours,
} = require('../../utils/reportsFormator/busiestQuietest')
const {
  processServicesReport,
} = require('../../utils/reportsFormator/servicesByStaffPerWeek')
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

//* 1&2 Reports->  Busiest Vs Quietest  (Days and hours)---------------------------------------------------

exports.busiestVsQuietest = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  if (!salon) throw new AppError('resource not found', 404)

  const condition = {
    // salonDetailId: salon.id,
    status: 'complete',
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
    ],
  })

  const input = JSON.parse(JSON.stringify(appointments))
  const output =
    req.params.basedOn == 'hours'
      ? busiestQuietestHours(input, req.query.startDate)
      : busiestQuietestDays(input, req.query.startDate)

  const report = Object.entries(output).map(([day, values]) => ({
    day,
    ...values,
  }))
  return res.status(200).json(response({ data: { report } }))
}

//* 3.Reports-> Services By Staff Per Week------------------------------------------------------------------

exports.servicesByStaffPerWeek = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  const condition = {
    salonDetailId: salon.id,
    // status: 'complete'
    deleted: false,
  }

  // if (req.query && req.query.startDate && req.query.endDate) {
  //   // condition.on = { [Op.between]: [req.query.startDate, req.query.endDate] }
  // }

  const startDate = req.query.startDate
  const endDate = req.query.endDate
  const result = await service.findAll({
    where: { salonDetailId: salon?.id },
    attributes: ['id', 'serviceName'],
  })
  const appointments = await employee.findAll({
    where: condition,
    attributes: [
      'id',
      [
        literal(
          `(SELECT users.firstName
           FROM users WHERE users.id = employee.userId)`,
        ),
        'firstName',
      ],
      [
        literal(
          `(SELECT users.lastName
           FROM users WHERE users.id = employee.userId)`,
        ),
        'lastName',
      ],
      [
        literal(
          `(SELECT GROUP_CONCAT(job.serviceId)
            FROM jobs AS job
            WHERE job.employeeId = employee.id AND job.status = 'complete' AND jobs.on BETWEEN '${startDate}' AND '${endDate}')`, // AND job.status = 'complete'
        ),
        'servicesProvided',
      ],
    ],
    // include: [
    //   {
    //     model: jobs,
    //     required: true,
    //     attributes: ['id', 'duration', 'total'],
    //     include: { model: service, attributes: ['id', 'serviceName'] },
    //   },
    // ],
  })

  const servicesList = JSON.parse(JSON.stringify(result))
  const input = JSON.parse(JSON.stringify(appointments))
  const ouptut = processServicesReport({ report: input, servicesList })
  return res.status(200).json(
    response({
      data: {
        // currencyUnit: CURRENCY_UNIT,
        ouptut,
        // report: input,
        servicesList,
      },
    }),
  )
}

//* 4.Reports-> Total Bookings------------------------------------------------------------------------------

exports.totalBookings = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  const condition = {
    salonDetailId: salon.id,
    deleted: false,
  }

  let queryString = `(SELECT COUNT(*) FROM jobs WHERE jobs.employeeId = employee.id AND jobs.status = 'complete')`
  if (req.query && req.query.startDate && req.query.endDate) {
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    queryString = `(SELECT COUNT(*) FROM jobs WHERE jobs.employeeId = employee.id AND jobs.status = 'complete' AND jobs.on BETWEEN '${startDate}' AND '${endDate}')`
  }

  const report = await employee.findAll({
    where: condition,
    attributes: [
      'id',
      'isOwner',
      [
        literal(
          `(SELECT users.firstName
           FROM users WHERE users.id = employee.userId)`,
        ),
        'firstName',
      ],
      [
        literal(
          `(SELECT users.lastName
           FROM users WHERE users.id = employee.userId)`,
        ),
        'lastName',
      ],
      [literal(queryString), 'servicesCount'],
    ],
  })

  // const report = JSON.parse(JSON.stringify(appointments))
  // const input = JSON.parse(JSON.stringify(appointments))
  // const ouptut = processServicesReport({ report: input, servicesList })
  return res.status(200).json(
    response({
      data: {
        report: report,
      },
    }),
  )
}

//* 6.Reports-> Most popular service--------------------------------------------------------------------------

exports.mostPopularServices = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  const condition = {
    salonDetailId: salon.id,
    deleted: false,
  }

  let queryString = `(SELECT COUNT(*) FROM jobs WHERE jobs.serviceId = service.id AND jobs.status = 'complete')`
  if (req.query && req.query.startDate && req.query.endDate) {
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    queryString = `(SELECT COUNT(*) FROM jobs WHERE jobs.serviceId = service.id AND jobs.status = 'complete' AND jobs.on BETWEEN '${startDate}' AND '${endDate}')`
  }

  const result = await service.findAll({
    where: { salonDetailId: salon?.id },
    attributes: [
      'id',
      'serviceName',
      [literal(queryString), 'servicesCount'],

      [
        literal(
          `(SELECT categories.color
           FROM categories WHERE categories.id = service.categoryId)`,
        ),
        'color',
      ],
    ],
  })

  // const report = JSON.parse(JSON.stringify(appointments))
  // const input = JSON.parse(JSON.stringify(appointments))
  // const ouptut = processServicesReport({ report: input, servicesList })
  return res.status(200).json(
    response({
      data: {
        report: result,
      },
    }),
  )
}

//* 7.Reports-> Booking performance----------------------------------------------------------------------------

exports.bookingPerformance = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  const condition = {
    salonDetailId: salon.id,
    // deleted: false,
  }

  let complete = `(SELECT COUNT(*) FROM jobs WHERE jobs.serviceId = service.id AND jobs.status = 'complete')`
  let cancel = `(SELECT COUNT(*) FROM jobs WHERE jobs.serviceId = service.id AND jobs.status = 'cancel')`
  let noshow = `(SELECT COUNT(*) FROM jobs WHERE jobs.serviceId = service.id AND jobs.status = 'no-show')`
  if (req.query && req.query.startDate && req.query.endDate) {
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    complete = `(SELECT COUNT(*) FROM jobs WHERE jobs.serviceId = service.id AND jobs.status = 'complete' AND jobs.on BETWEEN '${startDate}' AND '${endDate}')`
    cancel = `(SELECT COUNT(*) FROM jobs WHERE jobs.serviceId = service.id AND jobs.status = 'cancel' AND jobs.on BETWEEN '${startDate}' AND '${endDate}')`
    noshow = `(SELECT COUNT(*) FROM jobs WHERE jobs.serviceId = service.id AND jobs.status = 'no-show' AND jobs.on BETWEEN '${startDate}' AND '${endDate}')`
  }

  const result = await service.findAll({
    where: condition,
    attributes: [
      'id',
      'serviceName',
      [literal(complete), 'complete'],
      [literal(cancel), 'cancel'],
      [literal(noshow), 'noshow'],
    ],
  })

  // const report = JSON.parse(JSON.stringify(appointments))
  // const input = JSON.parse(JSON.stringify(appointments))
  // const ouptut = processServicesReport({ report: input, servicesList })
  return res.status(200).json(
    response({
      data: {
        report: result,
      },
    }),
  )
}

//* 8.Reports-> Income Report Year------------------------------------------------------------------------------

exports.IncomeReportYear = async (req, res, next) => {
  const { year } = req.params

  // Validate that 'year' is provided
  if (!year) {
    return res.status(400).json({
      status: '0',
      message: 'Year is required for monthly income report.',
      data: {},
      error: '',
    })
  }

  // Validate year format (simple 4-digit check)
  if (!/^\d{4}$/.test(year)) {
    throw new AppError(
      'Invalid year format. Please provide a 4-digit year.',
      404,
    )
  }

  const thisYear = parseInt(year, 10)
  const lastYear = thisYear - 1

  // Define SQL queries for both years
  const currentYearRevenueQuery = `
      SELECT 
        MONTH(bookings.on) AS month, 
        SUM(bookings.total) AS revenue 
      FROM bookings 
      WHERE bookings.salonDetailId = :salonDetailId 
        AND bookings.status = 'complete' 
        AND YEAR(bookings.on) = :thisYear
      GROUP BY MONTH(bookings.on)
      ORDER BY MONTH(bookings.on)
    `

  const lastYearRevenueQuery = `
      SELECT 
        MONTH(bookings.on) AS month, 
        SUM(bookings.total) AS revenue 
      FROM bookings 
      WHERE bookings.salonDetailId = :salonDetailId 
        AND bookings.status = 'complete' 
        AND YEAR(bookings.on) = :lastYear
      GROUP BY MONTH(bookings.on)
      ORDER BY MONTH(bookings.on)
    `

  // Fetch the salon details for the current user
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  if (!salon) throw new AppError('resource not found', 404)

  // Execute both queries concurrently
  const [currentYearRevenue, lastYearRevenue] = await Promise.all([
    sequelize.query(currentYearRevenueQuery, {
      replacements: { salonDetailId: salon.id, thisYear },
      type: sequelize.QueryTypes.SELECT,
    }),
    sequelize.query(lastYearRevenueQuery, {
      replacements: { salonDetailId: salon.id, lastYear },
      type: sequelize.QueryTypes.SELECT,
    }),
  ])

  // Map month numbers to month names
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  // Initialize the report with all months set to '0.00' for both years
  const report = monthNames.map((month) => ({
    month,
    thisYear: '0.00',
    lastYear: '0.00',
  }))

  // Populate 'thisYear' data
  currentYearRevenue.forEach((item) => {
    const monthIndex = item.month - 1 // Zero-based index
    if (monthIndex >= 0 && monthIndex < 12) {
      report[monthIndex].thisYear = parseFloat(item.revenue).toFixed(2)
    }
  })

  // Populate 'lastYear' data
  lastYearRevenue.forEach((item) => {
    const monthIndex = item.month - 1
    if (monthIndex >= 0 && monthIndex < 12) {
      report[monthIndex].lastYear = parseFloat(item.revenue).toFixed(2)
    }
  })

  // Format the response
  return res.status(200).json(
    response({
      message: 'Income Report.',
      data: { currencyUnit: CURRENCY_UNIT, report },
    }),
  )
}

//* 8.Reports-> Income Report week------------------------------------------------------------------------------

exports.weeklyIncomeReport = async (req, res, next) => {
  // Extract startDate and endDate from query parameters
  const { startDate, endDate } = req.query

  // Validate that both startDate and endDate are provided
  if (!startDate || !endDate) {
    return res.status(400).json({
      status: '0',
      message: 'startDate and endDate are required for weekly income report.',
      data: {},
      error: '',
    })
  }

  // Validate date formats (basic check)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return res.status(400).json({
      status: '0',
      message: "Invalid date format. Please use 'YYYY-MM-DD'.",
      data: {},
      error: '',
    })
  }

  // Parse dates to ensure validity
  const parsedStartDate = new Date(startDate)
  const parsedEndDate = new Date(endDate)

  if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
    return res.status(400).json({
      status: '0',
      message: 'Invalid dates provided.',
      data: {},
      error: '',
    })
  }

  // Ensure startDate is before or equal to endDate
  if (parsedStartDate > parsedEndDate) {
    return res.status(400).json({
      status: '0',
      message: 'startDate must be before or equal to endDate.',
      data: {},
      error: '',
    })
  }

  // Calculate Previous Week's Start and End Dates
  const previousWeekEnd = new Date(parsedStartDate)
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 1) // End 1 day before startDate

  const previousWeekStart = new Date(previousWeekEnd)
  previousWeekStart.setDate(previousWeekStart.getDate() - 6) // Start 7 days before previousWeekEnd

  // Format dates to 'YYYY-MM-DD' for SQL queries
  const formattedStartDate = parsedStartDate.toISOString().split('T')[0]
  const formattedEndDate = parsedEndDate.toISOString().split('T')[0]
  const formattedPrevStartDate = previousWeekStart.toISOString().split('T')[0]
  const formattedPrevEndDate = previousWeekEnd.toISOString().split('T')[0]

  // Fetch the salon details for the current user
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  if (!salon) AppError('Salon not found!', 200)

  // Define SQL queries for this week, previous week, and all-time average
  const thisWeekRevenueQuery = `
     SELECT 
       DAYNAME(bookings.on) AS day,
       SUM(bookings.total) AS revenue 
     FROM bookings 
     WHERE bookings.salonDetailId = :salonDetailId 
       AND bookings.status = 'complete' 
       AND bookings.on BETWEEN :startDate AND :endDate
     GROUP BY DAYNAME(bookings.on)
   `

  const previousWeekRevenueQuery = `
     SELECT 
       DAYNAME(bookings.on) AS day,
       SUM(bookings.total) AS revenue 
     FROM bookings 
     WHERE bookings.salonDetailId = :salonDetailId 
       AND bookings.status = 'complete' 
       AND bookings.on BETWEEN :prevStartDate AND :prevEndDate
     GROUP BY DAYNAME(bookings.on)
   `

  const allTimeAverageRevenueQuery = `
     SELECT 
       DAYNAME(bookings.on) AS day,
       AVG(bookings.total) AS averageRevenue 
     FROM bookings 
     WHERE bookings.salonDetailId = :salonDetailId 
       AND bookings.status = 'complete' 
     GROUP BY DAYNAME(bookings.on)
   `

  // Execute all three queries concurrently
  const [thisWeekRevenue, previousWeekRevenue, allTimeAverageRevenue] =
    await Promise.all([
      sequelize.query(thisWeekRevenueQuery, {
        replacements: {
          salonDetailId: salon.id,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        },
        type: sequelize.QueryTypes.SELECT,
      }),
      sequelize.query(previousWeekRevenueQuery, {
        replacements: {
          salonDetailId: salon.id,
          prevStartDate: formattedPrevStartDate,
          prevEndDate: formattedPrevEndDate,
        },
        type: sequelize.QueryTypes.SELECT,
      }),
      sequelize.query(allTimeAverageRevenueQuery, {
        replacements: { salonDetailId: salon.id },
        type: sequelize.QueryTypes.SELECT,
      }),
    ])

  // Define the order of days from Monday to Sunday
  const orderedDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ]

  // Initialize the report with all days set to '0.00'
  const report = orderedDays.map((day) => ({
    day,
    thisWeek: '0.00',
    previousWeek: '0.00',
    allTimeAverage: '0.00',
  }))

  // Helper function to update the report
  const updateReport = (data, weekType) => {
    data.forEach((item) => {
      const dayIndex = orderedDays.indexOf(item.day)
      if (dayIndex !== -1) {
        if (weekType === 'thisWeek') {
          report[dayIndex].thisWeek = parseFloat(item.revenue).toFixed(2)
        } else if (weekType === 'previousWeek') {
          report[dayIndex].previousWeek = parseFloat(item.revenue).toFixed(2)
        }
      }
    })
  }

  // Update the report with this week's revenue
  updateReport(thisWeekRevenue, 'thisWeek')

  // Update the report with previous week's revenue
  updateReport(previousWeekRevenue, 'previousWeek')

  // Update the report with all-time average revenue
  allTimeAverageRevenue.forEach((item) => {
    const dayIndex = orderedDays.indexOf(item.day)
    if (dayIndex !== -1) {
      report[dayIndex].allTimeAverage = parseFloat(item.averageRevenue).toFixed(
        2,
      )
    }
  })

  // Optional: Calculate averagePerWeek if needed (not requested here)
  // report.forEach(entry => {
  //   entry.averagePerWeek = ((parseFloat(entry.thisWeek) + parseFloat(entry.previousWeek)) / 2).toFixed(2);
  // });

  // Structure the response
  return res.status(200).json(
    response({
      message: 'Income Report.',
      data: { currencyUnit: CURRENCY_UNIT, report },
    }),
  )
}

//* 8.Reports-> Income Report week------------------------------------------------------------------------------

exports.weeklyIncomeReport = async (req, res, next) => {
  // Extract startDate and endDate from query parameters
  const { startDate, endDate } = req.query

  // Validate that both startDate and endDate are provided
  if (!startDate || !endDate) {
    return res.status(400).json({
      status: '0',
      message: 'startDate and endDate are required for weekly income report.',
      data: {},
      error: '',
    })
  }

  // Validate date formats (basic check)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return res.status(400).json({
      status: '0',
      message: "Invalid date format. Please use 'YYYY-MM-DD'.",
      data: {},
      error: '',
    })
  }

  // Parse dates to ensure validity
  const parsedStartDate = new Date(startDate)
  const parsedEndDate = new Date(endDate)

  if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
    return res.status(400).json({
      status: '0',
      message: 'Invalid dates provided.',
      data: {},
      error: '',
    })
  }

  // Ensure startDate is before or equal to endDate
  if (parsedStartDate > parsedEndDate) {
    return res.status(400).json({
      status: '0',
      message: 'startDate must be before or equal to endDate.',
      data: {},
      error: '',
    })
  }

  // Calculate Previous Week's Start and End Dates
  const previousWeekEnd = new Date(parsedStartDate)
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 1) // End 1 day before startDate

  const previousWeekStart = new Date(previousWeekEnd)
  previousWeekStart.setDate(previousWeekStart.getDate() - 6) // Start 7 days before previousWeekEnd

  // Format dates to 'YYYY-MM-DD' for SQL queries
  const formattedStartDate = parsedStartDate.toISOString().split('T')[0]
  const formattedEndDate = parsedEndDate.toISOString().split('T')[0]
  const formattedPrevStartDate = previousWeekStart.toISOString().split('T')[0]
  const formattedPrevEndDate = previousWeekEnd.toISOString().split('T')[0]

  // Fetch the salon details for the current user
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  if (!salon) AppError('Salon not found!', 200)

  // Define SQL queries for this week, previous week, and all-time average
  const thisWeekRevenueQuery = `
     SELECT 
       DAYNAME(bookings.on) AS day,
       SUM(bookings.total) AS revenue 
     FROM bookings 
     WHERE bookings.salonDetailId = :salonDetailId 
       AND bookings.status = 'complete' 
       AND bookings.on BETWEEN :startDate AND :endDate
     GROUP BY DAYNAME(bookings.on)
   `

  const previousWeekRevenueQuery = `
     SELECT 
       DAYNAME(bookings.on) AS day,
       SUM(bookings.total) AS revenue 
     FROM bookings 
     WHERE bookings.salonDetailId = :salonDetailId 
       AND bookings.status = 'complete' 
       AND bookings.on BETWEEN :prevStartDate AND :prevEndDate
     GROUP BY DAYNAME(bookings.on)
   `

  const allTimeAverageRevenueQuery = `
     SELECT 
       DAYNAME(bookings.on) AS day,
       AVG(bookings.total) AS averageRevenue 
     FROM bookings 
     WHERE bookings.salonDetailId = :salonDetailId 
       AND bookings.status = 'complete' 
     GROUP BY DAYNAME(bookings.on)
   `

  // Execute all three queries concurrently
  const [thisWeekRevenue, previousWeekRevenue, allTimeAverageRevenue] =
    await Promise.all([
      sequelize.query(thisWeekRevenueQuery, {
        replacements: {
          salonDetailId: salon.id,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        },
        type: sequelize.QueryTypes.SELECT,
      }),
      sequelize.query(previousWeekRevenueQuery, {
        replacements: {
          salonDetailId: salon.id,
          prevStartDate: formattedPrevStartDate,
          prevEndDate: formattedPrevEndDate,
        },
        type: sequelize.QueryTypes.SELECT,
      }),
      sequelize.query(allTimeAverageRevenueQuery, {
        replacements: { salonDetailId: salon.id },
        type: sequelize.QueryTypes.SELECT,
      }),
    ])

  // Define the order of days from Monday to Sunday
  const orderedDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ]

  // Initialize the report with all days set to '0.00'
  const report = orderedDays.map((day) => ({
    day,
    thisWeek: '0.00',
    previousWeek: '0.00',
    allTimeAverage: '0.00',
  }))

  // Helper function to update the report
  const updateReport = (data, weekType) => {
    data.forEach((item) => {
      const dayIndex = orderedDays.indexOf(item.day)
      if (dayIndex !== -1) {
        if (weekType === 'thisWeek') {
          report[dayIndex].thisWeek = parseFloat(item.revenue).toFixed(2)
        } else if (weekType === 'previousWeek') {
          report[dayIndex].previousWeek = parseFloat(item.revenue).toFixed(2)
        }
      }
    })
  }

  // Update the report with this week's revenue
  updateReport(thisWeekRevenue, 'thisWeek')

  // Update the report with previous week's revenue
  updateReport(previousWeekRevenue, 'previousWeek')

  // Update the report with all-time average revenue
  allTimeAverageRevenue.forEach((item) => {
    const dayIndex = orderedDays.indexOf(item.day)
    if (dayIndex !== -1) {
      report[dayIndex].allTimeAverage = parseFloat(item.averageRevenue).toFixed(
        2,
      )
    }
  })

  // Optional: Calculate averagePerWeek if needed (not requested here)
  // report.forEach(entry => {
  //   entry.averagePerWeek = ((parseFloat(entry.thisWeek) + parseFloat(entry.previousWeek)) / 2).toFixed(2);
  // });

  // Structure the response
  return res.status(200).json(
    response({
      message: 'Income Report.',
      data: { currencyUnit: CURRENCY_UNIT, report },
    }),
  )
}
