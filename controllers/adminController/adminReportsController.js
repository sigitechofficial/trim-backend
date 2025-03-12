const { Op, literal, fn, col, where } = require('sequelize')
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
  serviceType,
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

exports.busiestVsQuietestAdmin = async (req, res, next) => {
  const userId = req.params?.salon || req.user?.id

  const condition = {
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

  const results = JSON.parse(JSON.stringify(appointments))

  const output =
    req.params.basedOn === 'hours'
      ? busiestQuietestHours(results, req.query.startDate)
      : busiestQuietestDays(results, req.query.startDate)

  const report = Object.entries(output).map(([day, values]) => ({
    day,
    ...values,
  }))
  // })
  return res.status(200).json(response({ data: { report } }))
}

//* 3.Reports-> Services By Staff Per Week------------------------------------------------------------------
// TODO Need to Disscuss -- there are lot of services if report is for all salons?
exports.servicesByStaffPerWeekAdmin = async (req, res, next) => {
  const condition = {
    status: 'complete',
    deleted: false,
    isExternalEmployee: false,
  }

  const startDate = req.query.startDate
  const endDate = req.query.endDate
  const result = await service.findAll({
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
exports.mostPopularServiceTypes = async (req, res, next) => {
  // Build the subquery to count completed jobs for services under each serviceType.
  // The inner query ensures that only services belonging to the current salon are counted.
  let subQuery = `(SELECT COUNT(*) 
                     FROM jobs AS j 
                     WHERE j.serviceId IN (
                       SELECT s.id FROM services AS s 
                       WHERE s.serviceTypeId = serviceType.id 
                     ) 
                     AND j.status = 'complete')`

  // If a date range is provided, adjust the subquery to count jobs within that range.
  if (req.query && req.query.startDate && req.query.endDate) {
    const { startDate, endDate } = req.query
    subQuery = `(SELECT COUNT(*) 
                   FROM jobs AS j 
                   WHERE j.serviceId IN (
                     SELECT s.id FROM services AS s 
                     WHERE s.serviceTypeId = serviceType.id 
                   ) 
                   AND j.status = 'complete'
                   AND j.on BETWEEN '${startDate}' AND '${endDate}')`
  }

  // Query the serviceType model and include the computed services count.
  const result = await serviceType.findAll({
    // If your serviceType model does not have a direct salonDetailId field,
    // ensure you adjust your association or query accordingly.
    // Here we assume all serviceTypes are relevant to the salon.
    where: { deleted: false },
    attributes: [
      'id',
      'typeName',
      'image',
      [literal(subQuery), 'servicesCount'],
    ],
  })

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
  // Build the subqueries to count jobs for each status, aggregating over all services
  // that belong to a given service type.
  let complete = `(SELECT COUNT(*) FROM jobs AS j 
                      WHERE j.serviceId IN (
                        SELECT s.id FROM services AS s 
                        WHERE s.serviceTypeId = serviceType.id
                      ) AND j.status = 'complete')`

  let cancel = `(SELECT COUNT(*) FROM jobs AS j 
                    WHERE j.serviceId IN (
                      SELECT s.id FROM services AS s 
                      WHERE s.serviceTypeId = serviceType.id
                    ) AND j.status = 'cancel')`

  let noshow = `(SELECT COUNT(*) FROM jobs AS j 
                    WHERE j.serviceId IN (
                      SELECT s.id FROM services AS s 
                      WHERE s.serviceTypeId = serviceType.id
                    ) AND j.status = 'no-show')`

  // If a date range is provided in the query parameters, adjust the subqueries accordingly.
  if (req.query && req.query.startDate && req.query.endDate) {
    const { startDate, endDate } = req.query
    complete = `(SELECT COUNT(*) FROM jobs AS j 
                   WHERE j.serviceId IN (
                     SELECT s.id FROM services AS s 
                     WHERE s.serviceTypeId = serviceType.id
                   ) AND j.status = 'complete' 
                   AND j.on BETWEEN '${startDate}' AND '${endDate}')`

    cancel = `(SELECT COUNT(*) FROM jobs AS j 
                 WHERE j.serviceId IN (
                   SELECT s.id FROM services AS s 
                   WHERE s.serviceTypeId = serviceType.id
                 ) AND j.status = 'cancel'
                 AND j.on BETWEEN '${startDate}' AND '${endDate}')`

    noshow = `(SELECT COUNT(*) FROM jobs AS j 
                 WHERE j.serviceId IN (
                   SELECT s.id FROM services AS s 
                   WHERE s.serviceTypeId = serviceType.id
                 ) AND j.status = 'no-show'
                 AND j.on BETWEEN '${startDate}' AND '${endDate}')`
  }

  // Query the serviceType model along with the computed counts.
  const result = await serviceType.findAll({
    where: { deleted: false }, // adjust condition as needed if you have salon-specific filtering
    attributes: [
      'id',
      'typeName',
      [literal(complete), 'complete'],
      [literal(cancel), 'cancel'],
      [literal(noshow), 'noshow'],
    ],
  })

  return res.status(200).json(
    response({
      data: {
        report: result,
      },
    }),
  )
}

//* 8.Reports-> Income Report Yearly------------------------------------------------------------------------------

exports.IncomeReportYearAdmin = async (req, res, next) => {
  const { year } = req.query

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
      FROM bookings WHERE  bookings.status = 'complete' 
        AND YEAR(bookings.on) = :thisYear
      GROUP BY MONTH(bookings.on)
      ORDER BY MONTH(bookings.on)
    `

  const lastYearRevenueQuery = `
      SELECT 
        MONTH(bookings.on) AS month, 
        SUM(bookings.total) AS revenue 
      FROM bookings WHERE bookings.status = 'complete' 
        AND YEAR(bookings.on) = :lastYear
      GROUP BY MONTH(bookings.on)
      ORDER BY MONTH(bookings.on)
    `

  // Execute both queries concurrently
  const [currentYearRevenue, lastYearRevenue] = await Promise.all([
    sequelize.query(currentYearRevenueQuery, {
      replacements: { thisYear },
      type: sequelize.QueryTypes.SELECT,
    }),
    sequelize.query(lastYearRevenueQuery, {
      replacements: { lastYear },
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

//* 9.Reports-> Income Report weekly------------------------------------------------------------------------------
exports.weeklyIncomeReportAdmin = async (req, res, next) => {
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

  // Fetch earliest and latest booking dates for all-time average
  const bookingDates = await sequelize.query(
    `
      SELECT 
        MIN(bookings.on) AS earliestDate,
        MAX(bookings.on) AS latestDate
      FROM bookings 
      WHERE bookings.status = 'complete'
      `,
    {
      // replacements: {},
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
      WHERE bookings.status = 'complete' 
        AND bookings.on >= :startDate 
        AND bookings.on <= :endDate
      GROUP BY DAYNAME(bookings.on)
    `

  const previousWeekRevenueQuery = `
      SELECT 
        DAYNAME(bookings.on) AS day,
        SUM(bookings.total) AS revenue 
      FROM bookings 
      WHERE bookings.status = 'complete' 
        AND bookings.on >= :prevStartDate 
        AND bookings.on <= :prevEndDate
      GROUP BY DAYNAME(bookings.on)
    `

  const allTimeRevenueQuery = `
      SELECT 
        DAYNAME(bookings.on) AS day,
        SUM(bookings.total) AS totalRevenue 
      FROM bookings 
      WHERE bookings.status = 'complete' 
      GROUP BY DAYNAME(bookings.on)
    `

  // Execute all three queries concurrently
  const [thisWeekRevenue, previousWeekRevenue, allTimeRevenueData] =
    await Promise.all([
      sequelize.query(thisWeekRevenueQuery, {
        replacements: {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        },
        type: sequelize.QueryTypes.SELECT,
      }),
      sequelize.query(previousWeekRevenueQuery, {
        replacements: {
          prevStartDate: formattedPrevStartDate,
          prevEndDate: formattedPrevEndDate,
        },
        type: sequelize.QueryTypes.SELECT,
      }),
      sequelize.query(allTimeRevenueQuery, {
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
      message: 'Income Report.',
      data: { currencyUnit: CURRENCY_UNIT, report },
    }),
  )
}

//* 10.Reports-> Income Report Houly------------------------------------------------------------------------------
exports.hourlyIncomeReportAdmin = async (req, res, next) => {
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
      FROM bookings WHERE bookings.status = 'complete'
    `,
    {
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

  const thisWeekRevenueQuery = `
      SELECT 
        HOUR(bookings.startTime) AS hour,
        SUM(bookings.total) AS revenue 
      FROM bookings WHERE bookings.status = 'complete' 
        AND bookings.on BETWEEN :startDate AND :endDate
      GROUP BY HOUR(bookings.startTime)
      ORDER BY HOUR(bookings.startTime)
    `

  const previousWeekRevenueQuery = `
      SELECT 
        HOUR(bookings.startTime) AS hour,
        SUM(bookings.total) AS revenue 
      FROM bookings WHERE bookings.status = 'complete' 
        AND bookings.on BETWEEN :prevStartDate AND :prevEndDate
      GROUP BY HOUR(bookings.startTime)
      ORDER BY HOUR(bookings.startTime)
    `

  const allTimeAverageRevenueQuery = `
      SELECT 
        HOUR(bookings.startTime) AS hour,
        SUM(bookings.total) AS totalRevenue 
      FROM bookings WHERE bookings.status = 'complete'
      GROUP BY HOUR(bookings.startTime)
      ORDER BY HOUR(bookings.startTime)
    `

  // Execute all three queries concurrently
  const [thisWeekRevenue, previousWeekRevenue, allTimeRevenueData] =
    await Promise.all([
      sequelize.query(thisWeekRevenueQuery, {
        replacements: {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        },
        type: sequelize.QueryTypes.SELECT,
      }),
      sequelize.query(previousWeekRevenueQuery, {
        replacements: {
          prevStartDate: formattedPrevStartDate,
          prevEndDate: formattedPrevEndDate,
        },
        type: sequelize.QueryTypes.SELECT,
      }),
      sequelize.query(allTimeAverageRevenueQuery, {
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
      message: 'Hourly income report generated successfully.',
      data: {
        report: orderedHours,
      },
    }),
  )
}
