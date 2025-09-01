const { Op, literal, fn, col } = require('sequelize')
const { sequelize } = require('../../models')
// const dayjs = require('dayjs') // Optional: For date manipulations

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
  subscriptions,
} = require('../../models')
const AppError = require('../../utils/appError')
const DateManupulation = require('../../utils/dateManipulation')
const { response } = require('../../utils/response')

const {
  busiestQuietestDays,
  busiestQuietestHours,
} = require('../../utils/reportsFormator/busiestQuietest')
const {
  processServicesReport,
} = require('../../utils/reportsFormator/servicesByStaffPerWeek')

const {
  getDayOccurrences,
} = require('../../utils/reportsFormator/dayOccurrences')
const { formatDateTime } = require('../../utils/reportsFormator/formatDateTime')
const {
  getNumberOfWeeks,
} = require('../../utils/reportsFormator/numberofWeeks')

const {
  getNumberOfMonths,
} = require('../../utils/reportsFormator/numberofMonths')

const CustomDate = require('../../utils/currentDay')

//* 1&2 Reports->  Busiest Vs Quietest  (Days and hours)---------------------------------------------------

exports.busiestVsQuietest = async (req, res, next) => {
  const userId = req.params?.salon || req.user?.id
  const salon = await salonDetail.findOne({
    where: { userId: userId },
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
  const userId = req.params?.salon ?? req.user?.id
  console.log('🚀 ~ exports.servicesByStaffPerWeek= ~ userId:', userId)
  const salon = await salonDetail.findOne({
    where: { userId },
    attributes: ['id'],
  })

  const condition = {
    salonDetailId: salon.id,
    deleted: false,
    isExternalEmployee: false,
  }

  const startDate = req.query.startDate
  const endDate = req.query.endDate
  const result = await service.findAll({
    where: { salonDetailId: salon?.id },
    attributes: [
      'id',
      'serviceName',
      [
        literal(
          `(SELECT categories.color
         FROM categories WHERE categories.id = service.categoryId)`,
        ),
        'color',
      ],
      'salonDetailId',
    ],
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
            WHERE job.employeeId = employee.id AND job.status = 'complete' AND job.on BETWEEN '${startDate}' AND '${endDate}' )`,
        ),
        'servicesProvided',
      ],
    ],
  })

  const servicesList = JSON.parse(JSON.stringify(result))
  const input = JSON.parse(JSON.stringify(appointments))
  const ouptut = processServicesReport({ employees: input, servicesList })
  return res.status(200).json(
    response({
      data: {
        servicesList,
        report: ouptut,
      },
    }),
  )
}

//* 4.Reports-> Total Bookings------------------------------------------------------------------------------

exports.totalBookings = async (req, res, next) => {
  const userId = req.params?.salon || req.user?.id

  const salon = await salonDetail.findOne({
    where: { userId },
    attributes: ['id'],
  })

  const condition = {
    salonDetailId: salon.id,
    deleted: false,
    isExternalEmployee: false,
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
  const userId = req.params?.salon || req.user?.id

  const salon = await salonDetail.findOne({
    where: { userId },
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
  const userId = req.params?.salon || req.user?.id

  const salon = await salonDetail.findOne({
    where: { userId },
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

//* 8.Reports-> Income Report Yearly------------------------------------------------------------------------------

exports.IncomeReportYear = async (req, res, next) => {
  const userId = req.params?.salon || req.user?.id

  const { year } = req.params

  // Validate that 'year' is provided
  if (!year) {
    return res.status(200).json({
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
    where: { userId },
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
      message: 'Income report',
      data: { currencyUnit: CURRENCY_UNIT, report },
    }),
  )
}

//* 9.Reports-> Income Report weekly------------------------------------------------------------------------------
exports.weeklyIncomeReport = async (req, res, next) => {
  const userId = req.params?.salon || req.user?.id

  // Extract startDate and endDate from query parameters
  const { startDate, endDate } = req.query

  // Validate that both startDate and endDate are provided
  if (!startDate || !endDate)
    throw new AppError(
      `startDate and endDate are required for weekly income report.`,
      400,
    )

  // Validate date formats (basic check)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate))
    throw new AppError(`Invalid date format. Please use 'YYYY-MM-DD'.`, 200)

  // Parse dates in UTC to avoid timezone issues
  const parsedStartDate = new Date(`${startDate}T00:00:00Z`)
  const parsedEndDate = new Date(`${endDate}T23:59:59Z`)

  if (isNaN(parsedStartDate) || isNaN(parsedEndDate))
    throw new AppError(`Invalid dates provided.`, 200)

  // Ensure startDate is before or equal to endDate
  if (parsedStartDate > parsedEndDate)
    throw new AppError(`startDate must be before or equal to endDate.`, 200)

  // Calculate Previous Week's Start and End Dates
  const previousWeekEnd = new Date(parsedStartDate)
  previousWeekEnd.setUTCDate(previousWeekEnd.getUTCDate() - 1) // End 1 day before startDate

  const previousWeekStart = new Date(previousWeekEnd)
  previousWeekStart.setUTCDate(previousWeekStart.getUTCDate() - 6) // Start 7 days before previousWeekEnd

  // Format dates to 'YYYY-MM-DD HH:MM:SS' for SQL queries
  const formatDateTime = (date) => {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    const seconds = String(date.getUTCSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  const formattedStartDate = formatDateTime(parsedStartDate)
  const formattedEndDate = formatDateTime(parsedEndDate)
  const formattedPrevStartDate = formatDateTime(previousWeekStart)
  const formattedPrevEndDate = formatDateTime(previousWeekEnd)

  console.log('This Week:', formattedStartDate, 'to', formattedEndDate)
  console.log(
    'Previous Week:',
    formattedPrevStartDate,
    'to',
    formattedPrevEndDate,
  )

  // Fetch the salon details for the current user
  const salon = await salonDetail.findOne({
    where: { userId },
    attributes: ['id'],
  })

  if (!salon) throw new AppError(`Salon not found!`, 200)

  // Fetch earliest and latest booking dates for all-time average
  const bookingDates = await sequelize.query(
    `
      SELECT 
        MIN(bookings.on) AS earliestDate,
        MAX(bookings.on) AS latestDate
      FROM bookings 
      WHERE bookings.salonDetailId = :salonDetailId 
        AND bookings.status = 'complete'
      `,
    {
      replacements: { salonDetailId: salon.id },
      type: sequelize.QueryTypes.SELECT,
    },
  )

  let earliestDate = bookingDates[0].earliestDate
  let latestDate = bookingDates[0].latestDate

  if (!earliestDate || !latestDate) {
    // No bookings found, set earliest and latest dates to define a minimal range
    // For example, set them to the startDate and endDate provided
    earliestDate = parsedStartDate
    latestDate = parsedEndDate
  } else {
    earliestDate = new Date(earliestDate)
    latestDate = new Date(latestDate)
    // Ensure the date range includes at least the report's date range
    if (earliestDate > parsedStartDate) earliestDate = parsedStartDate
    if (latestDate < parsedEndDate) latestDate = parsedEndDate
  }

  // Calculate day occurrences between earliestDate and latestDate
  const dayOccurrences = getDayOccurrences(earliestDate, latestDate)
  console.log('Day Occurrences:', dayOccurrences)

  // Define SQL queries for this week, previous week, and all-time average
  const thisWeekRevenueQuery = `
      SELECT 
        DAYNAME(bookings.on) AS day,
        SUM(bookings.total) AS revenue 
      FROM bookings 
      WHERE bookings.salonDetailId = :salonDetailId 
        AND bookings.status = 'complete' 
        AND bookings.on >= :startDate 
        AND bookings.on <= :endDate
      GROUP BY DAYNAME(bookings.on)
    `

  const previousWeekRevenueQuery = `
      SELECT 
        DAYNAME(bookings.on) AS day,
        SUM(bookings.total) AS revenue 
      FROM bookings 
      WHERE bookings.salonDetailId = :salonDetailId 
        AND bookings.status = 'complete' 
        AND bookings.on >= :prevStartDate 
        AND bookings.on <= :prevEndDate
      GROUP BY DAYNAME(bookings.on)
    `

  const allTimeRevenueQuery = `
      SELECT 
        DAYNAME(bookings.on) AS day,
        SUM(bookings.total) AS totalRevenue 
      FROM bookings 
      WHERE bookings.salonDetailId = :salonDetailId 
        AND bookings.status = 'complete' 
      GROUP BY DAYNAME(bookings.on)
    `

  // Execute all three queries concurrently
  const [thisWeekRevenue, previousWeekRevenue, allTimeRevenueData] =
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
      sequelize.query(allTimeRevenueQuery, {
        replacements: { salonDetailId: salon.id },
        type: sequelize.QueryTypes.SELECT,
      }),
    ])

  console.log('This Week Revenue:', thisWeekRevenue)
  console.log('Previous Week Revenue:', previousWeekRevenue)
  console.log('All-Time Revenue Data:', allTimeRevenueData)

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
    currentWeek: '0.00',
    previousWeek: '0.00',
    averagePerWeek: '0.00',
  }))

  // Helper function to update the report
  const updateReport = (data, weekType) => {
    data.forEach((item) => {
      const dayIndex = orderedDays.findIndex(
        (day) => day.toLowerCase() === item.day.toLowerCase(),
      )
      if (dayIndex !== -1) {
        if (weekType === 'currentWeek') {
          report[dayIndex].currentWeek = parseFloat(item.revenue || 0).toFixed(
            2,
          )
        } else if (weekType === 'previousWeek') {
          report[dayIndex].previousWeek = parseFloat(item.revenue || 0).toFixed(
            2,
          )
        }
      }
    })
  }

  // Update the report with this week's revenue
  updateReport(thisWeekRevenue, 'currentWeek')

  // Update the report with previous week's revenue
  updateReport(previousWeekRevenue, 'previousWeek')

  // Calculate averagePerWeek considering all day occurrences
  const averagePerWeek = {
    Monday: '0.00',
    Tuesday: '0.00',
    Wednesday: '0.00',
    Thursday: '0.00',
    Friday: '0.00',
    Saturday: '0.00',
    Sunday: '0.00',
  }

  allTimeRevenueData.forEach((item) => {
    const day = item.day
    const totalRevenue = parseFloat(item.totalRevenue) || 0
    const occurrences = dayOccurrences[day] || 1 // Prevent division by zero
    averagePerWeek[day] = (totalRevenue / occurrences).toFixed(2)
  })

  // Merge `averagePerWeek` into the report
  orderedDays.forEach((day) => {
    const reportEntry = report.find((r) => r.day === day)
    if (reportEntry) {
      reportEntry.averagePerWeek = averagePerWeek[day] || '0.00'
    }
  })

  console.log('Final Report:', report)

  // Structure the response
  return res.status(200).json(
    response({
      message: 'Income report',
      data: { currencyUnit: CURRENCY_UNIT, report },
    }),
  )
}

//* 10.Reports-> Income Report Houly------------------------------------------------------------------------------
exports.hourlyIncomeReport = async (req, res, next) => {
  const userId = req.params?.salon || req.user?.id

  // Extract startDate and endDate from query parameters
  const { startDate, endDate } = req.query

  // Validate that both startDate and endDate are provided
  if (!startDate || !endDate)
    throw new AppError(
      `startDate and endDate are required for hourly income report.`,
      400, // Use appropriate HTTP status code
    )

  // Validate date formats (basic check)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate))
    throw new AppError(`Invalid date format. Please use 'YYYY-MM-DD'.`, 200)

  // Parse dates to ensure validity
  const parsedStartDate = new Date(startDate)
  const parsedEndDate = new Date(endDate)

  if (isNaN(parsedStartDate) || isNaN(parsedEndDate))
    throw new AppError(`Invalid dates provided.`, 200)

  // Ensure startDate is before or equal to endDate
  if (parsedStartDate > parsedEndDate)
    throw new AppError(`startDate must be before or equal to endDate.`, 200)

  // Calculate Previous Week's Start and End Dates
  const previousWeekStart = new Date(parsedStartDate)
  previousWeekStart.setDate(previousWeekStart.getDate() - 7)

  const previousWeekEnd = new Date(parsedEndDate)
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 7)

  // Format dates to 'YYYY-MM-DD' for SQL queries
  const formattedStartDate = parsedStartDate.toISOString().split('T')[0]
  const formattedEndDate = parsedEndDate.toISOString().split('T')[0]
  const formattedPrevStartDate = previousWeekStart.toISOString().split('T')[0]
  const formattedPrevEndDate = previousWeekEnd.toISOString().split('T')[0]

  // Fetch the salon details for the current user
  const salon = await salonDetail.findOne({
    where: { userId },
    attributes: ['id'],
  })

  if (!salon) throw new AppError(`Salon not found.`, 404)

  const salonId = salon.id

  // Fetch earliest and latest booking dates for all-time average
  const bookingDates = await sequelize.query(
    `
      SELECT 
        MIN(bookings.on) AS earliestDate,
        MAX(bookings.on) AS latestDate
      FROM bookings 
      WHERE bookings.salonDetailId = :salonDetailId 
        AND bookings.status = 'complete'
    `,
    {
      replacements: { salonDetailId: salonId },
      type: sequelize.QueryTypes.SELECT,
    },
  )

  const earliestDate = bookingDates[0].earliestDate
    ? new Date(bookingDates[0].earliestDate)
    : null
  const latestDate = bookingDates[0].latestDate
    ? new Date(bookingDates[0].latestDate)
    : null

  // Calculate the number of days between earliest and latest booking dates
  const calculateNumberOfDays = (start, end) => {
    const oneDay = 24 * 60 * 60 * 1000 // milliseconds in a day
    return Math.round((end - start) / oneDay) + 1 // +1 to include both start and end dates
  }

  const numberOfDays =
    earliestDate && latestDate
      ? calculateNumberOfDays(earliestDate, latestDate)
      : 0

  // Define SQL queries for this week, previous week, and all-time average
  const thisWeekRevenueQuery = `
      SELECT 
        HOUR(bookings.startTime) AS hour,
        SUM(bookings.total) AS revenue 
      FROM bookings 
      WHERE bookings.salonDetailId = :salonDetailId 
        AND bookings.status = 'complete' 
        AND bookings.on BETWEEN :startDate AND :endDate
      GROUP BY HOUR(bookings.startTime)
      ORDER BY HOUR(bookings.startTime)
    `

  const previousWeekRevenueQuery = `
      SELECT 
        HOUR(bookings.startTime) AS hour,
        SUM(bookings.total) AS revenue 
      FROM bookings 
      WHERE bookings.salonDetailId = :salonDetailId 
        AND bookings.status = 'complete' 
        AND bookings.on BETWEEN :prevStartDate AND :prevEndDate
      GROUP BY HOUR(bookings.startTime)
      ORDER BY HOUR(bookings.startTime)
    `

  const allTimeAverageRevenueQuery = `
      SELECT 
        HOUR(bookings.startTime) AS hour,
        SUM(bookings.total) AS totalRevenue 
      FROM bookings 
      WHERE bookings.salonDetailId = :salonDetailId 
        AND bookings.status = 'complete'
      GROUP BY HOUR(bookings.startTime)
      ORDER BY HOUR(bookings.startTime)
    `

  // Execute all three queries concurrently
  const [thisWeekRevenue, previousWeekRevenue, allTimeRevenueData] =
    await Promise.all([
      sequelize.query(thisWeekRevenueQuery, {
        replacements: {
          salonDetailId: salonId,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        },
        type: sequelize.QueryTypes.SELECT,
      }),
      sequelize.query(previousWeekRevenueQuery, {
        replacements: {
          salonDetailId: salonId,
          prevStartDate: formattedPrevStartDate,
          prevEndDate: formattedPrevEndDate,
        },
        type: sequelize.QueryTypes.SELECT,
      }),
      sequelize.query(allTimeAverageRevenueQuery, {
        replacements: { salonDetailId: salonId },
        type: sequelize.QueryTypes.SELECT,
      }),
    ])

  // Define the order of hours from 00:00 to 23:00
  const orderedHours = Array.from({ length: 24 }, (_, i) => ({
    day: `${i.toString().padStart(2, '0')}:00 - ${((i + 1) % 24).toString().padStart(2, '0')}:00`,
    currentWeek: '0.00',
    previousWeek: '0.00',
    averagePerWeek: '0.00',
  }))

  // Helper function to map revenue data to the report
  const mapRevenueData = (data, key) => {
    data.forEach((item) => {
      const hour = parseInt(item.hour, 10)
      if (!isNaN(hour) && hour >= 0 && hour < 24) {
        orderedHours[hour][key] = parseFloat(
          key === 'averagePerWeek' ? item.totalRevenue || 0 : item.revenue || 0,
        ).toFixed(2)
      }
    })
  }

  // Populate the report with this week's revenue
  mapRevenueData(thisWeekRevenue, 'currentWeek')

  // Populate the report with previous week's revenue
  mapRevenueData(previousWeekRevenue, 'previousWeek')

  // Populate the report with all-time total revenue
  mapRevenueData(allTimeRevenueData, 'averagePerWeek')

  // Calculate averagePerWeek as totalRevenue / numberOfDays
  if (numberOfDays > 0) {
    orderedHours.forEach((entry, index) => {
      const totalRevenue = parseFloat(entry.averagePerWeek) || 0
      const average = (totalRevenue / numberOfDays).toFixed(2)
      orderedHours[index].averagePerWeek = average
    })
  } else {
    // If there are no bookings, keep averagePerWeek as '0.00'
    orderedHours.forEach((entry) => {
      entry.averagePerWeek = '0.00'
    })
  }

  // Structure the response
  return res.status(200).json(
    response({
      message: 'Hourly income report generated',
      data: {
        report: orderedHours,
      },
    }),
  )
}

//* 11.Reports-> Income Report week------------------------------------------------------------------------------

exports.averageJobsReport = async (req, res, next) => {
  // 1. Extract the 'year' from query parameters
  const userId = req.params?.salon || req.user?.id

  const { year } = req.query

  let startDate, endDate

  const salonData = await salonDetail.findOne({
    where: { userId },
    attributes: ['id', 'createdAt'],
    raw: true,
  })
  console.log('🚀 ~ exports.averageJobsReport= ~ salonData:', salonData.id)

  if (year) {
    // Annual Report
    startDate = new Date(`${year}-01-01T00:00:00Z`)
    endDate = new Date(`${year}-12-31T23:59:59Z`)
  } else {
    if (salonData && salonData.createdAt) {
      startDate = new Date(salonData.createdAt)
    } else {
      // If salon.createdAt is not found, default to a very early date
      startDate = new Date('2024-01-01T00:00:00Z')
    }

    endDate = new Date() // Current date and time
  }

  // 2. Calculate the number of weeks and months in the reporting period
  const numberOfWeeks = getNumberOfWeeks(startDate, endDate)
  const numberOfMonths = getNumberOfMonths(startDate, endDate)

  // 3. Fetch employees with their firstName, lastName, and count of jobs
  const appointments = await employee.findAll({
    where: {
      salonDetailId: salonData.id,
      deleted: false,
      isExternalEmployee: false,
    },
    attributes: [
      'id',
      [
        literal(
          `(SELECT CONCAT(users.firstName, ' ', users.lastName)
             FROM users 
             WHERE users.id = employee.userId)`,
        ),
        'fullName',
      ],
      [
        literal(
          `(SELECT COUNT(job.id) 
              FROM jobs AS job
              WHERE job.employeeId = employee.id 
                AND job.status = 'complete' 
                AND job.on BETWEEN '${formatDateTime(startDate)}' AND '${formatDateTime(endDate)}')`,
        ),
        'servicesProvided',
      ],
    ],
    raw: true,
  })

  // 4. Assemble the report
  const report = appointments.map((emp) => {
    const name = emp.fullName || `Emp #${emp.id}`
    const totalJobs = parseInt(emp.servicesProvided, 10) || 0
    const averageBookingsPerWeek =
      numberOfWeeks > 0
        ? parseFloat((totalJobs / numberOfWeeks).toFixed(1))
        : 0.0
    const averageBookingsPerMonth =
      numberOfMonths > 0
        ? parseFloat((totalJobs / numberOfMonths).toFixed(1))
        : 0.0
    return {
      name: name,
      averageBookingsPerWeek: averageBookingsPerWeek,
      averageBookingsPerMonth: averageBookingsPerMonth,
    }
  })

  return res
    .status(200)
    .json(response({ message: 'Success', data: { report } }))
}




//* 12.Reports-> Subscription History------------------------------------------------------------------------------
exports.subscriptionHistory = async (req, res, next) => {

  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    include: [{ model: user, attributes: ['stripeCustomerId'] }],
  });

  if (!salon?.user?.stripeCustomerId) {
    return res.status(200).json(response({ message: 'No subscriptions found', data: [] }));
  }


  const plans = await Stripe.listSubscriptionsForCustomer(salon.user.stripeCustomerId, 30);

  const results = [];
  for (const plan of plans) {

    const info = await Stripe.listInvoicesForSubscription(plan.id, 48);

    const dbRows = await subscriptions.findAll({
      where: { subscriptionId: plan.id },
      attributes: ['invoiceId', 'VAT'],
    });
    const vatMap = new Map(dbRows.map(r => [r.invoiceId, Number(r.VAT || 0)]));


    const history = info.invoices.map(inv => ({
      ...inv,
      vatAmount: vatMap.has(inv.id) ? vatMap.get(inv.id) : inv.vatAmount,
    }));

    results.push({
      plan: {
        id: plan.id,
        name: plan.planName,
        status: plan.status,
        price: (plan.priceUnitAmount || 0) / 100,
        currency: (plan.priceCurrency || 'gbp').toUpperCase(),
        interval: plan.interval,
        currentPeriodStart: plan.currentPeriodStart,
        nextRenewal: plan.currentPeriodEnd,
      },
      history,
    });
  }

  return res.status(200).json(response({
    message: 'All subscription histories with VAT',
    data: results,
  }));

};