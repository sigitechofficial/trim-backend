const { Op, literal, fn, col, where } = require('sequelize')
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
  salonTimeHistory,
} = require('../../models')
const AppError = require('../../utils/appError')
const {
  daysBetween,
  getPreviousDates,
  calculateMinutes,
} = require('../../utils/dateManipulation')
const {
  calculatePercentageChange,
  transformAppointmentReport,
} = require('../../utils/performanceDashboardUtils')

const response = ({ status, message, data, error }) => {
  return {
    status: status ? `${status}` : '1',
    message: message ? `${message}` : 'success',
    data: data || {},
    error: error ? `${error}` : '',
  }
}

const CustomDate = require('../../utils/currentDay')
//* 1.Performance Dashboad-> Section One includes(Sales and appointments tabs)

exports.performanceDashboadSectionOne = async (req, res, next) => {
  const condition = {
    // salonDetailId: salon.id,
    status: 'complete',
  }

  if (req.query && req.query.startDate && req.query.endDate) {
    condition.on = { [Op.between]: [req.query.startDate, req.query.endDate] }
  }
  const startDate = req.query.startDate
  const endDate = req.query.endDate

  const days = daysBetween(startDate, endDate)
  console.log('🚀 ~ exports.appointmentsGraph= ~ days:', days)

  const { prevStartDate, prevEndDate } = getPreviousDates(startDate, endDate)

  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: [
      'id',
      //^Appointments Section
      //given dates
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${startDate}' AND '${endDate}' AND (bookings.status = 'pending' OR bookings.status = 'book'))`,
        ),
        'upcomingAppointments',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${startDate}' AND '${endDate}' AND bookings.status = 'complete')`,
        ),
        'completeAppointments',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${startDate}' AND '${endDate}' AND bookings.status = 'cancel')`,
        ),
        'cancelAppointments',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${startDate}' AND '${endDate}' AND bookings.status = 'no-show')`,
        ),
        'noshowAppointments',
      ],
      //previous dates
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}' AND (bookings.status = 'pending' OR bookings.status = 'book'))`,
        ),
        'prevUpcomingAppointments',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}' AND bookings.status = 'complete')`,
        ),
        'prevCompleteAppointments',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}' AND bookings.status = 'cancel')`,
        ),
        'prevCancelAppointments',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}' AND bookings.status = 'no-show')`,
        ),
        'prevNoshowAppointments',
      ],
      //^ Appointment section Done--> Sales Section start it include sections(Total Sales ,Online Slaes , Walkin Sales)
      [
        literal(`COALESCE(
          (SELECT SUM(bookings.actualCapturedAmount)
           FROM bookings
           WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${startDate}' AND '${endDate}' AND bookings.status = 'complete'
             AND bookings.finalPayment = 'paid'), 0)`),
        'revenueOfCompletedAppointments',
      ],
      [
        literal(`COALESCE(
          (SELECT SUM(bookings.actualCapturedAmount)
           FROM bookings
           WHERE bookings.salonDetailId = salonDetail.id
             AND bookings.on BETWEEN '${startDate}' AND '${endDate}'
             AND bookings.status = 'cancel'
             AND bookings.finalPayment = 'paid'), 0)`),
        'revenueOfCancelledAppointments',
      ],
      [
        literal(`COALESCE(
          (SELECT SUM(bookings.actualCapturedAmount)
           FROM bookings
           WHERE bookings.salonDetailId = salonDetail.id
             AND bookings.on BETWEEN '${startDate}' AND '${endDate}'
             AND bookings.status = 'no-show'
             AND bookings.finalPayment = 'paid'), 0)`),
        'revenueOfNoShowAppointments',
      ],
      [
        literal(`COALESCE(
          (SELECT SUM(bookings.actualCapturedAmount)
           FROM bookings
           WHERE bookings.salonDetailId = salonDetail.id
             AND bookings.on BETWEEN '${startDate}' AND '${endDate}'
             AND (bookings.status = 'no-show'
               OR bookings.status = 'complete'
               OR bookings.status = 'cancel')
             AND bookings.finalPayment = 'paid'), 0)`),
        'totalRevenueOfAppointments',
      ],
      [
        literal(`COALESCE(
          (SELECT SUM(bookings.actualCapturedAmount)
           FROM bookings
           WHERE bookings.salonDetailId = salonDetail.id 
             AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}'
             AND bookings.status = 'complete'
             AND bookings.finalPayment = 'paid'), 0)`),
        'prevRevenueOfCompletedAppointments',
      ],
      [
        literal(`COALESCE(
          (SELECT SUM(bookings.actualCapturedAmount)
           FROM bookings
           WHERE bookings.salonDetailId = salonDetail.id
             AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}'
             AND bookings.status = 'cancel'
             AND bookings.finalPayment = 'paid'), 0)`),
        'prevRevenueOfCancelledAppointments',
      ],
      [
        literal(`COALESCE(
          (SELECT SUM(bookings.actualCapturedAmount)
           FROM bookings
           WHERE bookings.salonDetailId = salonDetail.id
             AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}'
             AND bookings.status = 'no-show'
             AND bookings.finalPayment = 'paid'), 0)`),
        'prevRevenueOfNoShowAppointments',
      ],
      [
        literal(`COALESCE(
          (SELECT SUM(bookings.actualCapturedAmount)
           FROM bookings
           WHERE bookings.salonDetailId = salonDetail.id
             AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}'
             AND (bookings.status = 'no-show'
               OR bookings.status = 'complete'
               OR bookings.status = 'cancel')
             AND bookings.finalPayment = 'paid'), 0)`),
        'prevTotalRevenueOfAppointments',
      ],
      [
        literal(`COALESCE(
          (SELECT SUM(bookings.actualCapturedAmount)
           FROM bookings
           WHERE bookings.salonDetailId = salonDetail.id
             AND bookings.on BETWEEN '${startDate}' AND '${endDate}'
             AND (bookings.status = 'no-show'
               OR bookings.status = 'complete'
               OR bookings.status = 'cancel')
             AND bookings.finalPayment = 'paid' AND bookings.by = 'online'), 0)`),
        'revenueOfOnlineAppointments',
      ],
      [
        literal(`COALESCE(
          (SELECT SUM(bookings.actualCapturedAmount)
           FROM bookings
           WHERE bookings.salonDetailId = salonDetail.id
             AND bookings.on BETWEEN '${startDate}' AND '${endDate}'
             AND (bookings.status = 'no-show'
               OR bookings.status = 'complete'
               OR bookings.status = 'cancel')
             AND bookings.finalPayment = 'paid' AND bookings.by = 'walkin'), 0)`),
        'revenueOfWalkinAppointments',
      ],
      [
        literal(`COALESCE(
          (SELECT SUM(bookings.actualCapturedAmount)
           FROM bookings
           WHERE bookings.salonDetailId = salonDetail.id
             AND bookings.on BETWEEN '${startDate}' AND '${endDate}'
             AND (bookings.status = 'no-show'
               OR bookings.status = 'complete'
               OR bookings.status = 'cancel')
             AND bookings.finalPayment = 'paid' AND bookings.by = 'online'), 0)`),
        'prevRevenueOfOnlineAppointments',
      ],
      [
        literal(`COALESCE(
          (SELECT SUM(bookings.actualCapturedAmount)
           FROM bookings
           WHERE bookings.salonDetailId = salonDetail.id
             AND bookings.on BETWEEN '${startDate}' AND '${endDate}'
             AND (bookings.status = 'no-show'
               OR bookings.status = 'complete'
               OR bookings.status = 'cancel')
             AND bookings.finalPayment = 'paid' AND bookings.by = 'walkin'), 0)`),
        'prevtotalRevenueOfWalkinAppointments',
      ],
    ],
  })

  if (!salon) throw new AppError('esource not found', 404)

  //& Comparision for Appointment Section

  const upcommintAppointmentPercentage = calculatePercentageChange(
    parseInt(salon.get('upcomingAppointments')),
    parseInt(salon.get('prevUpcomingAppointments')),
  )

  const completeAppointmentPercentage = calculatePercentageChange(
    parseInt(salon.get('completeAppointments')),
    parseInt(salon.get('prevCompleteAppointments')),
  )

  const cancelAppointmentPercentage = calculatePercentageChange(
    parseInt(salon.get('cancelAppointments')),
    parseInt(salon.get('prevCancelAppointments')),
  )

  const noshowAppointmentPercentage = calculatePercentageChange(
    parseInt(salon.get('noshowAppointments')),
    parseInt(salon.get('prevNoshowAppointments')),
  )

  const totalAppointments =
    parseInt(salon.get('upcomingAppointments')) +
    parseInt(salon.get('completeAppointments')) +
    parseInt(salon.get('cancelAppointments')) +
    parseInt(salon.get('noshowAppointments'))

  const prevTotalAppointments =
    parseInt(salon.get('prevUpcomingAppointments')) +
    parseInt(salon.get('prevCompleteAppointments')) +
    parseInt(salon.get('prevCancelAppointments')) +
    parseInt(salon.get('prevNoshowAppointments'))
  console.log(
    '🚀 ~ exports.performanceDashboad= ~ prevTotalAppointments:',
    prevTotalAppointments,
  )

  const totalAppointmentPercentage = calculatePercentageChange(
    totalAppointments,
    prevTotalAppointments,
  )

  const appointments = {
    upcomingAppointments: salon.get('upcomingAppointments') || 0,
    upcommintAppointmentPercentage,
    completeAppointments: salon.get('completeAppointments') || 0,
    completeAppointmentPercentage,
    cancelAppointments: salon.get('cancelAppointments') || 0,
    cancelAppointmentPercentage,
    noshowAppointments: salon.get('noshowAppointments') || 0,
    noshowAppointmentPercentage,
    totalAppointments,
    totalAppointmentPercentage,
  }

  //& Comparision for Sections(Total Sales ,Online Slaes , Walkin Sales)
  const completedComparisionPercentage = calculatePercentageChange(
    parseFloat(salon.get('revenueOfCompletedAppointments')),
    parseFloat(salon.get('prevRevenueOfCompletedAppointments')),
  )

  const cancelledComparisionPercentage = calculatePercentageChange(
    parseFloat(salon.get('revenueOfCancelledAppointments')),
    parseFloat(salon.get('prevRevenueOfCancelledAppointments')),
  )

  const noShowComparisionPercentage = calculatePercentageChange(
    parseFloat(salon.get('revenueOfNoShowAppointments')),
    parseFloat(salon.get('prevRevenueOfNoShowAppointments')),
  )

  const totalRevenueComparisionPercentage = calculatePercentageChange(
    parseFloat(salon.get('totalRevenueOfAppointments')),
    parseFloat(salon.get('prevTotalRevenueOfAppointments')),
  )

  const revenueOfOnlineComparisionPercentage = calculatePercentageChange(
    parseFloat(salon.get('revenueOfOnlineAppointments')),
    parseFloat(salon.get('prevRevenueOfOnlineAppointments')),
  )

  const revenueOfWalkinComparisionPercentage = calculatePercentageChange(
    parseFloat(salon.get('revenueOfWalkinAppointments')),
    parseFloat(salon.get('prevtotalRevenueOfWalkinAppointments')),
  )

  const basedOn = {
    id: salon.id,
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
  }
  const totalSales = {
    totalRevenueOfAppointments: salon.get('totalRevenueOfAppointments'),
    totalRevenueComparisionPercentage,
    revenueOfCompletedAppointments: salon.get('revenueOfCompletedAppointments'),
    completedComparisionPercentage,
    revenueOfCancelledAppointments: salon.get('revenueOfCancelledAppointments'),
    cancelledComparisionPercentage,
    revenueOfNoShowAppointments: salon.get('revenueOfNoShowAppointments'),
    noShowComparisionPercentage,
  }
  const onlineSales = {
    revenueOfOnlineAppointments: salon.get('revenueOfOnlineAppointments'),
    revenueOfOnlineComparisionPercentage,
  }

  const walkinSales = {
    revenueOfWalkinAppointments: salon.get('revenueOfWalkinAppointments'),
    revenueOfWalkinComparisionPercentage,
  }

  const ouptut = {
    basedOn,
    totalSales,
    onlineSales,
    walkinSales,
    appointments,
  }

  return res.status(200).json(response({ data: { report: ouptut } }))
}

//* 2.Performance Dashboad-> Section Two includes(Returning client rate , Occupancy rate)

exports.performanceDashboadSectionTwo = async (req, res, next) => {
  const condition = {
    // salonDetailId: salon.id,
    status: 'complete',
  }

  if (req.query && req.query.startDate && req.query.endDate) {
    condition.on = { [Op.between]: [req.query.startDate, req.query.endDate] }
  }
  const startDate = req.query.startDate
  const endDate = req.query.endDate

  const days = daysBetween(startDate, endDate)
  // console.log("ðŸš€ ~ exports.appointmentsGraph= ~ days:", days)

  const { prevStartDate, prevEndDate } = getPreviousDates(startDate, endDate)

  //TODO will we count clients from (cacnel appointments as well)

  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: [
      'id',
      //^Appointments Section
      //given dates
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${startDate}' AND '${endDate}' AND bookings.customerStatus = 'new' AND  (bookings.status = 'complete' OR bookings.status = 'cancel' OR bookings.status = 'no-show'))`,
        ),
        'newCustomers',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${startDate}' AND '${endDate}' AND bookings.customerStatus = 'repeat' AND  (bookings.status = 'complete' OR bookings.status = 'cancel' OR bookings.status = 'no-show'))`,
        ),
        'returningCustomers',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${startDate}' AND '${endDate}' AND bookings.customerStatus = 'new' AND bookings.by = 'walkin' AND  (bookings.status = 'complete' OR bookings.status = 'cancel' OR bookings.status = 'no-show'))`,
        ),
        'newWalkinCustomers',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${startDate}' AND '${endDate}' AND bookings.customerStatus = 'repeat' AND bookings.by = 'walkin' AND  (bookings.status = 'complete' OR bookings.status = 'cancel' OR bookings.status = 'no-show'))`,
        ),
        'returningWalkinCustomers',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${startDate}' AND '${endDate}' AND bookings.customerStatus = 'new' AND bookings.by = 'walkin' AND  (bookings.status = 'complete' OR bookings.status = 'cancel' OR bookings.status = 'no-show'))`,
        ),
        'newOnlineCustomers',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${startDate}' AND '${endDate}' AND bookings.customerStatus = 'repeat' AND bookings.by = 'walkin' AND  (bookings.status = 'complete' OR bookings.status = 'cancel' OR bookings.status = 'no-show'))`,
        ),
        'returningOnlineCustomers',
      ],
      // Previous date
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}' AND bookings.customerStatus = 'new' AND  (bookings.status = 'complete' OR bookings.status = 'cancel' OR bookings.status = 'no-show'))`,
        ),
        'newCustomersPrev',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}' AND bookings.customerStatus = 'repeat' AND  (bookings.status = 'complete' OR bookings.status = 'cancel' OR bookings.status = 'no-show'))`,
        ),
        'returningCustomersPrev',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}' AND bookings.customerStatus = 'new' AND bookings.by = 'walkin' AND  (bookings.status = 'complete' OR bookings.status = 'cancel' OR bookings.status = 'no-show'))`,
        ),
        'newWalkinCustomersPrev',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}' AND bookings.customerStatus = 'repeat' AND bookings.by = 'walkin' AND  (bookings.status = 'complete' OR bookings.status = 'cancel' OR bookings.status = 'no-show'))`,
        ),
        'returningWalkinCustomersPrev',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}' AND bookings.customerStatus = 'new' AND bookings.by = 'walkin' AND  (bookings.status = 'complete' OR bookings.status = 'cancel' OR bookings.status = 'no-show'))`,
        ),
        'newOnlineCustomersPrev',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}' AND bookings.customerStatus = 'repeat' AND bookings.by = 'walkin' AND  (bookings.status = 'complete' OR bookings.status = 'cancel' OR bookings.status = 'no-show'))`,
        ),
        'returningOnlineCustomersPrev',
      ],
      // available and working time of current filter date
      [
        literal(`COALESCE(
          (SELECT SUM(salonTimeHistories.workingTime)
           FROM salonTimeHistories
           WHERE salonTimeHistories.salonDetailId = salonDetail.id AND salonTimeHistories.on BETWEEN '${startDate}' AND '${endDate}'), 0)`),
        'availableTime',
      ],
      [
        literal(`COALESCE(
          (SELECT SUM(bookings.duration)
           FROM bookings
           WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${startDate}' AND '${endDate}' AND bookings.status = 'complete'), 0)`),
        'workingTime',
      ],
      // available and working time of Previous dates
      [
        literal(`COALESCE(
          (SELECT SUM(salonTimeHistories.workingTime)
           FROM salonTimeHistories
           WHERE salonTimeHistories.salonDetailId = salonDetail.id AND salonTimeHistories.on BETWEEN '${prevStartDate}' AND '${prevEndDate}'), 0)`),
        'availableTimePrev',
      ],
      [
        literal(`COALESCE(
          (SELECT SUM(bookings.duration)
           FROM bookings
           WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}' AND bookings.status = 'complete'), 0)`),
        'workingTimePrev',
      ],
    ],
  })
  //!Returning client rate

  const totalCustomers =
    parseFloat(salon.get('newCustomers')) +
    parseFloat(salon.get('returningCustomers'))
  const totalCustomersPerv =
    parseFloat(salon.get('newCustomersPrev')) +
    parseFloat(salon.get('returningCustomersPrev'))
  const totalCustomersPercentage = calculatePercentageChange(
    totalCustomers,
    totalCustomersPerv,
  )

  const newCustomersPercentage = calculatePercentageChange(
    parseFloat(salon.get('newCustomers')),
    parseFloat(salon.get('newCustomersPrev')),
  )

  const returningCustomersPercentage = calculatePercentageChange(
    parseFloat(salon.get('returningCustomers')),
    parseFloat(salon.get('returningCustomersPrev')),
  )

  const newWalkinCustomersPercentage = calculatePercentageChange(
    parseFloat(salon.get('newWalkinCustomers')),
    parseFloat(salon.get('newWalkinCustomersPrev')),
  )

  const returningWalkinCustomersPercentage = calculatePercentageChange(
    parseFloat(salon.get('returningWalkinCustomers')),
    parseFloat(salon.get('returningWalkinCustomersPrev')),
  )

  const newOnlineCustomersPercentage = calculatePercentageChange(
    parseFloat(salon.get('newOnlineCustomers')),
    parseFloat(salon.get('newOnlineCustomersPrev')),
  )

  const returningOnlineCustomersPercentage = calculatePercentageChange(
    parseFloat(salon.get('returningOnlineCustomers')),
    parseFloat(salon.get('returningOnlineCustomersPrev')),
  )

  const returningClientRate = {
    totalCustomers, //TODO to be decided RturingRate
    totalCustomersPercentage,
    newCustomers: salon.get('newCustomers'),
    newCustomersPercentage,
    newCustomers: salon.get('returningCustomers'),
    returningCustomersPercentage,
    newWalkinCustomers: salon.get('newWalkinCustomers'),
    newWalkinCustomersPercentage,
    returningWalkinCustomers: salon.get('returningWalkinCustomers'),
    returningWalkinCustomersPercentage,
    newOnlineCustomers: salon.get('newOnlineCustomers'),
    newOnlineCustomersPercentage,
    returningOnlineCustomers: salon.get('returningOnlineCustomers'),
    returningOnlineCustomersPercentage,
  }

  // ! Occupancy Rate

  const availableTimePercentage = calculatePercentageChange(
    parseFloat(salon.get('availableTime')),
    parseFloat(salon.get('availableTimePrev')),
  )

  const workingTimePercentage = calculatePercentageChange(
    parseFloat(salon.get('workingTime')),
    parseFloat(salon.get('workingTimePrev')),
  )

  const unBookedTime =
    parseFloat(salon.get('availableTime')) -
    parseFloat(salon.get('workingTime'))
  const unBookedTimePrev =
    parseFloat(salon.get('availableTimePrev')) -
    parseFloat(salon.get('workingTimePrev'))

  const unBookedTimePercentage = calculatePercentageChange(
    unBookedTime,
    unBookedTimePrev,
  )

  const availableTime =
    salon.get('availableTime') * 1 === 0 ? 1 : salon.get('availableTime') * 1
  const availableTimePrev =
    salon.get('availableTimePrev') * 1 === 0
      ? 1
      : salon.get('availableTimePrev') * 1

  let currentOccupancyRate = (salon.get('workingTime') * 1) / availableTime
  const currentOccupancyRatePrev =
    (salon.get('workingTimePrev') * 1) / availableTimePrev

  const occupancyRatePercentage = calculatePercentageChange(
    currentOccupancyRate,
    currentOccupancyRatePrev,
  )

  currentOccupancyRate = parseFloat(currentOccupancyRate).toFixed(3)

  const occupancyRate = {
    currentOccupancyRate: `${currentOccupancyRate}`,
    occupancyRatePercentage,
    workingTime: salon.get('availableTime') * 1,
    workingTimePercentage: availableTimePercentage,
    bookedTime: salon.get('workingTime') * 1,
    bookedTimePercentage: workingTimePercentage,
    unBookedTime,
    unBookedTimePercentage,
  }

  const basedOn = {
    id: salon.id,
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
  }

  return res
    .status(200)
    .json(response({ data: { basedOn, occupancyRate, returningClientRate } }))
}

//* 3.Performance Dashboad-> Section three includes(Top Services And Top Employees)

exports.performanceDashboadSectionThree = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  const condition = {
    salonDetailId: salon.id,
  }
  console.log(
    '🚀 ~ exports.performanceDashboadSectionThree= ~ condition:',
    condition,
  )

  const startDate = req.query.startDate
  const endDate = req.query.endDate

  const { prevStartDate, prevEndDate } = getPreviousDates(startDate, endDate)

  const topServices = await service.findAll({
    where: condition,
    attributes: [
      'id',
      'serviceName',
      [
        literal(
          `(SELECT COUNT(*) FROM jobs WHERE jobs.serviceId = service.id AND jobs.on BETWEEN '${startDate}' AND '${endDate}' AND jobs.status = 'complete')`,
        ),
        'servieCount',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM jobs WHERE jobs.serviceId = service.id AND jobs.on BETWEEN '${prevStartDate}' AND '${prevEndDate}' AND jobs.status = 'complete')`,
        ),
        'prevServieCount',
      ],
    ],
    order: [[literal('servieCount'), 'DESC']],
  })

  const topEmployees = await employee.findAll({
    where: condition,
    attributes: [
      'id',
      'position',
      [
        literal(
          `(SELECT COUNT(*) FROM jobs WHERE jobs.employeeId = employee.id AND jobs.on BETWEEN '${startDate}' AND '${endDate}' AND jobs.status = 'complete')`,
        ),
        'servieCount',
      ],
      [
        literal(`COALESCE(
          (SELECT SUM(jobs.total)
           FROM jobs
           WHERE jobs.employeeId = employee.id AND jobs.on BETWEEN '${startDate}' AND '${endDate}' AND (jobs.status = 'complete' OR jobs.status = 'cancel' OR jobs.status = 'no-show')), 0)`),
        'sales',
      ],
    ],
    include: { model: user, attributes: ['firstName', 'lastName', 'image'] },
    order: [[literal('sales'), 'DESC']],
  })

  const ouptut = {
    topServices,
    topEmployees,
  }

  return res.status(200).json(response({ data: ouptut }))
}

//! Graphs -------------------------------------------------

//* 1.Performance Dashboad Graphs-> Appointment Graph

exports.appointmentsGraph = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  const startDate = req.query.startDate
  const endDate = req.query.endDate

  const { prevStartDate, prevEndDate } = getPreviousDates(startDate, endDate)

  const condition = {
    salonDetailId: salon.id,
    on: {
      [Op.between]: [startDate, endDate],
    },
  }

  const conditionForPrev = {
    salonDetailId: salon.id,
    on: {
      [Op.between]: [prevStartDate, prevEndDate],
    },
  }
  const dailyAppointments = await booking.count({
    where: condition,
    attributes: ['on'],
    group: ['on'],
    order: [['on', 'ASC']],
  })

  const totalAppointments = await booking.count({ where: condition })
  const previousAppointments = await booking.count({ where: conditionForPrev })

  const basedOn = {
    id: salon.id,
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
  }
  const comparisionPercentage = calculatePercentageChange(
    totalAppointments,
    previousAppointments,
  )
  const ouptut = {
    basedOn,
    graph: dailyAppointments,
    totalAppointments,
    comparisionPercentage,
  }

  return res.status(200).json(response({ data: ouptut }))
}

//* 2.Performance Dashboad Graphs-> Sales Graph ( All three manages here (TOTAL , Walkin , Online))

exports.salesGraph = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  const startDate = req.query.startDate
  const endDate = req.query.endDate

  const { prevStartDate, prevEndDate } = getPreviousDates(startDate, endDate)

  const condition = {
    salonDetailId: salon.id,
    on: {
      [Op.between]: [startDate, endDate],
    },
    finalPayment: 'paid',
    [Op.or]: [
      { status: 'complete' },
      { status: 'cancel' },
      { status: 'no-show' },
    ],
  }

  const conditionForPrev = {
    salonDetailId: salon.id,
    on: {
      [Op.between]: [prevStartDate, prevEndDate],
    },
    finalPayment: 'paid',
    [Op.or]: [
      { status: 'complete' },
      { status: 'cancel' },
      { status: 'no-show' },
    ],
  }

  if (req.params.of === 'walkin' || req.params.of === 'online') {
    condition.by = req.params.of
    conditionForPrev.by = req.params.of
  }
  // console.log("🚀 ~ exports.salesGraph= ~ condition:", condition)
  // console.log("🚀 ~ exports.salesGraph= ~ conditionForPrev:", conditionForPrev)
  //TODO we can deal on appointments where payment status is closed
  const totalSumGroupedByDate = await booking.findAll({
    attributes: ['on', [fn('SUM', col('actualCapturedAmount')), 'sales']],
    where: condition,
    group: ['on'],
    order: [['on', 'ASC']],
  })

  const salesTotal =
    (await booking.sum('actualCapturedAmount', {
      where: condition,
    })) || 0

  const prevSalesTotal =
    (await booking.sum('actualCapturedAmount', {
      where: conditionForPrev,
    })) || 0

  const basedOn = {
    id: salon.id,
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
  }

  const comparisionPercentage = calculatePercentageChange(
    +salesTotal,
    +prevSalesTotal,
  )
  const ouptut = {
    basedOn,
    graph: totalSumGroupedByDate,
    salesTotal,
    comparisionPercentage,
  }

  return res.status(200).json(response({ data: ouptut }))
}

//* 1.Performance Dashboad Graphs-> Occupancy rate Graph

exports.occupancyRateGraph = async (req, res, next) => {
  const startDate = req.query.startDate
  const endDate = req.query.endDate

  const { prevStartDate, prevEndDate } = getPreviousDates(startDate, endDate)

  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: [
      'id',
      // available and working time of current filter date
      [
        literal(`COALESCE(
          (SELECT SUM(salonTimeHistories.workingTime)
           FROM salonTimeHistories
           WHERE salonTimeHistories.salonDetailId = salonDetail.id AND salonTimeHistories.on BETWEEN '${startDate}' AND '${endDate}'), 0)`),
        'availableTime',
      ],
      [
        literal(`COALESCE(
          (SELECT SUM(bookings.duration)
           FROM bookings
           WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${startDate}' AND '${endDate}' AND bookings.status = 'complete'), 0)`),
        'workingTime',
      ],
      // available and working time of Previous dates
      [
        literal(`COALESCE(
          (SELECT SUM(salonTimeHistories.workingTime)
           FROM salonTimeHistories
           WHERE salonTimeHistories.salonDetailId = salonDetail.id AND salonTimeHistories.on BETWEEN '${prevStartDate}' AND '${prevEndDate}'), 0)`),
        'availableTimePrev',
      ],
      [
        literal(`COALESCE(
          (SELECT SUM(bookings.duration)
           FROM bookings
           WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}' AND bookings.status = 'complete'), 0)`),
        'workingTimePrev',
      ],
    ],
  })

  const condition = {
    salonDetailId: salon.id,
    on: {
      [Op.between]: [startDate, endDate],
    },
    status: 'complete',
  }
  const workingTimes = await booking.findAll({
    attributes: ['on', [fn('SUM', col('duration')), 'sales']],
    where: condition,
    group: ['on'],
    order: [['on', 'ASC']],
  })

  const availableTime =
    salon.get('availableTime') * 1 === 0 ? 1 : salon.get('availableTime') * 1
  const availableTimePrev =
    salon.get('availableTimePrev') * 1 === 0
      ? 1
      : salon.get('availableTimePrev') * 1

  let currentOccupancyRate = (salon.get('workingTime') * 1) / availableTime

  const currentOccupancyRatePrev =
    salon.get('workingTimePrev') / availableTimePrev

  const occupancyRatePercentage = calculatePercentageChange(
    currentOccupancyRate,
    currentOccupancyRatePrev,
  )

  currentOccupancyRate = parseFloat(currentOccupancyRate).toFixed(3)

  const occupancyRate = {
    currentOccupancyRate: `${currentOccupancyRate}`,
    occupancyRatePercentage,
  }

  const basedOn = {
    id: salon.id,
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
  }

  return res
    .status(200)
    .json(response({ data: { basedOn, occupancyRate, graph: workingTimes } }))
}

//* 1.Performance Dashboad Graphs-> Occupancy rate Graph

exports.returningClientRateGraph = async (req, res, next) => {
  const startDate = req.query.startDate
  const endDate = req.query.endDate

  const { prevStartDate, prevEndDate } = getPreviousDates(startDate, endDate)
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: [
      'id',
      //^Appointments Section
      //given dates
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${startDate}' AND '${endDate}' AND bookings.customerStatus = 'new' AND  (bookings.status = 'complete' OR bookings.status = 'cancel' OR bookings.status = 'no-show'))`,
        ),
        'newCustomers',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${startDate}' AND '${endDate}' AND bookings.customerStatus = 'repeat' AND  (bookings.status = 'complete' OR bookings.status = 'cancel' OR bookings.status = 'no-show'))`,
        ),
        'returningCustomers',
      ],

      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}' AND bookings.customerStatus = 'new' AND  (bookings.status = 'complete' OR bookings.status = 'cancel' OR bookings.status = 'no-show'))`,
        ),
        'newCustomersPrev',
      ],
      [
        literal(
          `(SELECT COUNT(*) FROM bookings WHERE bookings.salonDetailId = salonDetail.id AND bookings.on BETWEEN '${prevStartDate}' AND '${prevEndDate}' AND bookings.customerStatus = 'repeat' AND  (bookings.status = 'complete' OR bookings.status = 'cancel' OR bookings.status = 'no-show'))`,
        ),
        'returningCustomersPrev',
      ],
    ],
  })
  //!Returning client rate

  const totalCustomers =
    parseFloat(salon.get('newCustomers')) +
    parseFloat(salon.get('returningCustomers'))
  console.log(
    '🚀 ~ exports.returningClientRateGraph= ~ totalCustomers:',
    totalCustomers,
  )
  let totalCustomersPerv =
    parseFloat(salon.get('newCustomersPrev')) +
    parseFloat(salon.get('returningCustomersPrev'))
  console.log(
    '🚀 ~ exports.returningClientRateGraph= ~ totalCustomersPerv:',
    totalCustomersPerv,
  )
  const totalCustomersPercentage = calculatePercentageChange(
    totalCustomers,
    totalCustomersPerv,
  )
  const devidedBy = totalCustomersPerv > 0 ? totalCustomersPerv : 1
  const retentionRate = totalCustomers / devidedBy //TODO Same in dashbord section two

  const condition = {
    salonDetailId: salon.id,
    on: {
      [Op.between]: [startDate, endDate],
    },
    status: 'complete',
  }

  const dailyCustomers = await booking.count({
    where: condition,
    attributes: ['on'],
    group: ['on'],
    order: [['on', 'ASC']],
  })

  //TODO to be decided RturingRate
  const returningClientRate = {
    retentionRate: parseFloat(retentionRate).toFixed(3),
    totalCustomersPercentage,
  }

  const basedOn = {
    id: salon.id,
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
  }

  return res.status(200).json(
    response({
      data: { basedOn, returningClientRate, graph: dailyCustomers },
    }),
  )
}

//! Reports -------------------------------------------------

//* 1.Performance Dashboad Reports-> Sales Report

exports.salesReport = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  const startDate = req.query.startDate
  const endDate = req.query.endDate

  const condition = {
    salonDetailId: salon.id,
    on: {
      [Op.between]: [startDate, endDate],
    },
    status: 'complete',
  }

  const sales = await booking.findAll({
    where: condition,
    attributes: ['id', 'on', 'startTime', 'finalPayment'],
    include: {
      model: user,
      attributes: ['firstName', 'lastName'],
    },
  })

  return res.status(200).json(response({ data: { report: sales } }))
}

//* 2.Performance Dashboad Reports-> Appointment Report

exports.appointmentReport = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  const startDate = req.query.startDate
  const endDate = req.query.endDate

  const condition = {
    salonDetailId: salon.id,
    on: {
      [Op.between]: [startDate, endDate],
    },
    status: 'complete',
  }

  const dailyAppointments = await booking.findAll({
    where: condition,
    attributes: ['id', 'on', 'startTime', 'by'],
    include: [
      {
        model: user,
        attributes: ['firstName', 'lastName'],
      },
      {
        model: jobs,
        attributes: [
          [
            literal(
              `(SELECT serviceName FROM services WHERE jobs.serviceId = services.id)`,
            ),
            'service',
          ],
        ],
      },
    ],
  })

  const input = JSON.parse(JSON.stringify(dailyAppointments))
  const output = input.length > 0 ? transformAppointmentReport(input) : []

  return res.status(200).json(response({ data: { report: output } }))
}

//* 3.Performance Dashboad Reports-> sales Summary Report

exports.salesSummaryReport = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  const startDate = req.query.startDate

  const condition = {
    salonDetailId: salon.id,
    on: startDate,
    status: 'complete',
    [Op.or]: [
      { status: 'complete' },
      { status: 'cancel' },
      { status: 'no-show' },
    ],
  }

  console.log('🚀 ~ exports.salesSummaryReport= ~ condition:', condition)

  const summary = await booking.findAll({
    where: condition,
    attributes: [
      'id',
      'on',
      'status',
      'initialPayment',
      'initialPaymentIntend',
      'finalPaymentIntend',
      'tip',
      'actualCapturedAmount',
      'refundAmount',
      'noshowCharges',
      'cancellationCharges',
    ],
    include: [
      {
        model: jobs,
        required: true,
        where: {
          [Op.or]: [
            { status: 'complete' },
            { status: 'cancel' },
            { status: 'no-show' },
          ],
        },
        attributes: ['total', 'status'],
      },
    ],
  })

  const result = JSON.parse(JSON.stringify(summary))
  console.log('🚀 ~ exports.salesSummaryReport= ~ result:', result)
  // Services
  let completedJobsCount = 0
  let totalCompletedAmount = 0
  let refundCompletedAmount = 0
  // Cancellation fees
  let cancelJobsCount = 0
  let totalCancelAmount = 0
  let refundCancelAmount = 0
  // No-show fees
  let noshowJobsCount = 0
  let totalNoshowAmount = 0
  let refundNoshowAmount = 0

  // Cash movement summary
  let onlineCollection = 0
  let cashCollection = 0
  let tipCollection = 0

  result.forEach((item) => {
    if (item.status === 'complete') {
      refundCompletedAmount += parseFloat(item.refundAmount)

      tipCollection += parseFloat(item.tip)
      console.log(
        '🚀 ~ exports.salesSummaryReport= ~ tipCollection:',
        tipCollection,
      )
      if (item.initialPaymentIntend)
        onlineCollection += parseFloat(item.initialPayment)
      console.log(
        '🚀 ~ exports.salesSummaryReport= ~ item.initialPayment:',
        item.initialPayment,
      )
      if (item.finalPaymentIntend) {
        onlineCollection +=
          parseFloat(item.actualCapturedAmount) -
          (parseFloat(item.initialPayment) + parseFloat(item.tip))
      } else {
        cashCollection +=
          parseFloat(item.actualCapturedAmount) -
          (parseFloat(item.initialPayment) + parseFloat(item.tip))
      }

      item?.jobs?.forEach((job) => {
        if (job.status === 'complete') {
          completedJobsCount += 1
          totalCompletedAmount += parseFloat(job?.total)
        }
      })
    } else if (item.status === 'cancel') {
      cancelJobsCount += item.jobs.length
      totalCancelAmount += parseFloat(item.cancellationCharges)
      refundCancelAmount += parseFloat(item.refundAmount)
    } else if (item?.status === 'no-show') {
      noshowJobsCount += item.jobs.length
      totalNoshowAmount += parseFloat(item.noshowCharges)
      refundNoshowAmount += parseFloat(item.refundAmount)
    }
    // Cash movement summary //TODO
  })

  console.log(
    '🚀 ~ exports.salesSummaryReport= ~ onlineCollection:',
    onlineCollection,
  )
  console.log('🚀 ~ exports.tipCollection= ~ tipCollection:', tipCollection)
  console.log('🚀 ~ exports.cashCollection= ~ cashCollection:', cashCollection)

  const report = {
    transactionSummary: [
      // Services
      {
        type: 'services',
        quantity: completedJobsCount,
        refund: refundCompletedAmount,
        grossTotal: `${totalCompletedAmount}`,
      },
      // Cancellation fees
      {
        type: 'Cancellation fees',
        quantity: cancelJobsCount,
        refund: refundCancelAmount,
        grossTotal: `${totalCancelAmount}`,
      },
      // No-show fees
      {
        type: 'No-show fees',
        quantity: noshowJobsCount,
        refund: refundNoshowAmount,
        grossTotal: `${totalNoshowAmount}`,
      },
      //Total
      {
        type: 'Total sales',
        quantity: noshowJobsCount + cancelJobsCount + completedJobsCount,
        refund: refundNoshowAmount + refundCancelAmount + refundCompletedAmount,
        grossTotal: `${totalNoshowAmount + totalCancelAmount + totalCompletedAmount}`,
      },
    ],
    cashMovementSummary: [
      {
        paymentType: 'Cash',
        paymentCollection: `${cashCollection}`,
      },
      {
        paymentType: 'Online Transfer',
        paymentCollection: `${onlineCollection}`,
      },
      {
        paymentType: 'Total Amount',
        paymentCollection: `${cashCollection + onlineCollection + tipCollection}`,
      },
    ],
  }

  return res.status(200).json(response({ data: { report } }))
}
