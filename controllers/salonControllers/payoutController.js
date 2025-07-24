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
  employeeCommission,
  commissionPayout,
  rentChairPayout,
  rentChairEarning,
  salaryPayout,
  tip,
  wallet,
  rentCollection,
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

const {
  calculateDueSalaries,
  calculateSalaryFromLastDateToToday,
} = require('../../utils/salariesCalculations')

const CustomDate = require('../../utils/currentDay')
const { response } = require('../../utils/response')
const { calculateDueRents } = require('../../utils/dueRents')

//! Functions to calculate payouts in app ------------------------

//*Payouts 1 -:> Calculate Payouts On Service --------------

//? this function will only calculate payouts for comission and rendAChair WagesMethods
exports.calculatePayoutsOnService = (job) => {
  if (job && job?.employeeId) {
    const input = {
      jobId: job.id,
      bookingId: job.bookingId,
      employeeId: job.employeeId,
    }
    console.log('ðŸš€ ~ Commission:', input)
    console.log(
      'ðŸš€ ~ Commission:',
      job?.employee?.employeeWagesMethod?.wagesMethodId,
    )
    if (job?.employee?.employeeWagesMethod?.wagesMethodId == 1) {
      const commissionPercentage =
        job?.employee?.employeeWagesMethod?.value || 0
      const commission = job.total * (commissionPercentage / 100)
      console.log('ðŸš€ ~ Commission:', commission)

      input.commission = commission
      input.total = job.total
      input.withPercentage = job?.employee?.employeeWagesMethod?.value

      employeeCommission.create(input)
    } else if (job?.employee?.employeeWagesMethod?.wagesMethodId == 3) {
      input.earnings = job.total
      console.log('ðŸš€ ~Rent a Chair earnings:', input.earnings)
      rentChairEarning.create(input)
    } else {
      console.log('ðŸš€ ~ Salary employee:')
    }
  }
  return true
}

//*Payouts 2 -:> Calculate Payouts On Service --------------

//? this function will only calculate payouts for comission and rendAChair  WagesMethods
exports.calculatePayoutsOnBooking = async (
  appointment,
  finePercentage,
  status,
) => {
  appointment?.jobs.forEach((job) => {
    if (job && job?.employeeId) {
      const input = {
        jobId: job.id,
        bookingId: job.bookingId,
        byJob: status,
        appointmentClosed: true,
        employeeId: job.employeeId,
      }
      console.log('ðŸš€ ~job.id:', job.id)
      if (job?.employee?.employeeWagesMethod?.wagesMethodId == 1) {
        const commissionPercentage =
          job?.employee?.employeeWagesMethod?.value || 0

        const totalAfterFine = job.total * (finePercentage / 100)

        const commission = totalAfterFine * (commissionPercentage / 100)
        console.log('ðŸš€ ~ Commission:', commission)

        input.commission = commission
        input.total = totalAfterFine
        input.withPercentage = job?.employee?.employeeWagesMethod?.value
        employeeCommission.create(input)
      } else if (job?.employee?.employeeWagesMethod?.wagesMethodId == 3) {
        const totalAfterFine = job.total * (finePercentage / 100)
        input.earnings = totalAfterFine
        console.log('ðŸš€ ~Rent a Chair earnings:', input.earnings)
        rentChairEarning.create(input)
      } else {
        console.log('ðŸš€ ~ Salary employee:')
      }
    }
  })
  return true
}

//! Actual Payout Apis
//* Payout 1. Get Commission Employes ------------------------------------------------
exports.commissionEmployees = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  const employees = await employee.findAll({
    where: {
      salonDetailId: salon.id,
      id: {
        [Op.in]: literal(`(
        SELECT employeeId
        FROM employeeWagesMethods
        WHERE wagesMethodId = 1
      )`),
      },
    },
    attributes: [
      'id',
      [
        literal(`COALESCE(
        (SELECT SUM(employeeCommissions.commission)
         FROM employeeCommissions
         WHERE employeeCommissions.employeeId = employee.id AND employeeCommissions.appointmentClosed = TRUE), 0)`),
        'totalCommission',
      ],
      [
        literal(`COALESCE(
         (SELECT SUM(commissionPayouts.amount)
          FROM commissionPayouts
          WHERE commissionPayouts.employeeId = employee.id ), 0)`),
        'paidAmount',
      ],
      [
        literal(`COALESCE(
         (SELECT SUM(commissionPayouts.tip)
          FROM commissionPayouts
          WHERE commissionPayouts.employeeId = employee.id ), 0)`),
        'paidTip',
      ],
      [
        literal(`COALESCE(
        (SELECT SUM(tips.amount)
         FROM tips
         WHERE tips.employeeId = employee.id), 0)`),
        'totalTip',
      ],
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
          `(SELECT users.image FROM users WHERE users.id = employee.userId)`,
        ),
        'image',
      ],
    ],
  })

  return res.json(response({ message: 'Success', data: { employees } }))
}

//* Payout 2. Get Rent a Chair Employes ----------------------------------------------

exports.rentalChairEmployees = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  const employees = await employee.findAll({
    where: {
      salonDetailId: salon.id,
      isExternalEmployee: false,
      id: {
        [Op.in]: literal(`(
        SELECT employeeId
        FROM employeeWagesMethods
        WHERE wagesMethodId = 3
      )`),
      },
    },
    attributes: [
      'id',
      [
        literal(`COALESCE(
        (SELECT SUM(rentChairEarnings.earnings)
         FROM rentChairEarnings
         WHERE rentChairEarnings.employeeId = employee.id AND rentChairEarnings.appointmentClosed = TRUE), 0)`),
        'earnings',
      ],
      [
        literal(`COALESCE(
        (SELECT SUM(tips.amount)
         FROM tips
         WHERE tips.employeeId = employee.id), 0)`),
        'totalTip',
      ],
      [
        literal(`COALESCE(
         (SELECT SUM(commissionPayouts.tip)
          FROM commissionPayouts
          WHERE commissionPayouts.employeeId = employee.id ), 0)`),
        'paidTip',
      ],
      [
        literal(`COALESCE(
         (SELECT SUM(rentChairPayouts.amount)
          FROM rentChairPayouts
          WHERE rentChairPayouts.employeeId = employee.id ), 0)`),
        'paidAmount',
      ],

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
          `(SELECT users.image FROM users WHERE users.id = employee.userId)`,
        ),
        'image',
      ],
    ],
  })

  return res.json(response({ message: 'Success', data: { employees } }))
}

//* Payout 3. Get Salary Employees ---------------------------------------------------
exports.salaryEmployees = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  const employeesRaw = await employee.findAll({
    where: {
      salonDetailId: salon?.id,
    },
    attributes: [
      'id',

      // Salary Paid Amount
      [
        literal(`COALESCE(
         (SELECT SUM(salaryPayouts.amount)
          FROM salaryPayouts
          WHERE salaryPayouts.employeeId = employee.id AND salaryPayouts.status = 'paid'
        ), 0)`),
        'paidAmount',
      ],

      // User First Name
      [
        literal(`(SELECT users.firstName FROM users WHERE users.id = employee.userId)`),
        'firstName',
      ],

      // User Last Name
      [
        literal(`(SELECT users.lastName FROM users WHERE users.id = employee.userId)`),
        'lastName',
      ],

      // User Image
      [
        literal(`(SELECT users.image FROM users WHERE users.id = employee.userId)`),
        'image',
      ],
    ],
    include: [
      {
        model: employeeWagesMethod,
        required: true,
        where: { wagesMethodId: 2 }, // ✅ Only salary-based employees
      },
    ],
    distinct: true, // still useful with JOINs
  });

  const employees = Object.values(
    employeesRaw.reduce((acc, emp) => {
      acc[emp.id] = emp;
      return acc;
    }, {})
  );
  const input = JSON.parse(JSON.stringify(employees))
  const data = await calculateDueSalaries(input);

  //   const data = await calculateDueSalaries(input)

  return res.json(response({ message: 'Success', data: { employees: data } }))
}

//* Payout 4. Get Salary Employees ---------------------------------------------------
exports.salaryEmployeePayout = async (req, res, next) => {
  let input = []
  const isValid = await employeeWagesMethod.findOne({
    where: { employeeId: req.body.employeeId, wagesMethodId: 2 },
    attributes: ['id', 'wagesMethodId', 'value', 'prevSalaryDate'],
  })
  if (!isValid)
    throw new AppError('Failed to transfer salary. Employee not found', 200)

  const salon = await employee.findOne({
    where: { id: req.body?.employeeId },
    attributes: ['salonDetailId'],
  })

  if (req.body?.salary) {
    req.body.salary.employeeId = req.body.employeeId
    req.body.salary.status = 'paid'
    req.body.salary.description = req.body?.description
    req.body.salary.tansferDate = new Date()
    input.push(req.body.salary)
  } else if (req.body?.salaries) {
    req.body.salaries.forEach((salary) => {
      salary.employeeId = req.body?.employeeId
      salary.status = 'paid'
      salary.description = req.body?.description
      salary.tansferDate = new Date()
    })
    input = req.body.salaries
  }

  const lastExpectedDate =
    input.length > 0 ? input[input.length - 1].expectedDate : null

  if (!lastExpectedDate) throw new AppError('Failed to transfer salary.', 200)

  const totalAmount =
    input.length > 0
      ? input.reduce((total, { amount }) => {
        if (amount) {
          const num = typeof amount === 'number' ? amount : parseFloat(amount)
          if (!isNaN(num)) {
            return total + num
          }
        }
        return total
      }, 0)
      : 0

  const totalTip =
    input.length > 0
      ? input.reduce((total, { tip }) => {
        if (tip) {
          const num = typeof tip === 'number' ? tip : parseFloat(tip)
          if (!isNaN(num)) {
            return total + num
          }
        }
        return total
      }, 0)
      : 0

  await salaryPayout.bulkCreate(input)

  await wallet.increment(
    {
      salaryPayout: totalAmount,
      totalPayout: totalAmount,
      tipPayout: totalTip,
    },
    { where: { salonDetailId: salon?.salonDetailId } },
  )

  isValid.prevSalaryDate = lastExpectedDate
  await isValid.save()
  console.log('--->', input)

  return res.json(response({ message: 'Success', data: {} }))
}

//* Payout 5. Commission Employee Summary ---------------------------------------------
exports.commissionEmployeeSummary = async (req, res, next) => {
  const result = await employee.findOne({
    where: { id: req.params.employee },
    attributes: [
      'id',
      // [
      //   literal(`COALESCE(
      //   (SELECT SUM(employeeCommissions.commission)
      //    FROM employeeCommissions
      //    WHERE employeeCommissions.employeeId = employee.id AND employeeCommissions.appointmentClosed = true), 0)`),
      //   'totalCommission',
      // ],
      // [
      //   literal(`COALESCE(
      //    (SELECT SUM(commissionPayouts.amount)
      //     FROM commissionPayouts
      //     WHERE commissionPayouts.employeeId = employee.id ), 0)`),
      //   'paidAmount',
      // ],
      // [
      //   literal(
      //     `(SELECT users.firstName
      //      FROM users WHERE users.id = employee.userId)`,
      //   ),
      //   'firstName',
      // ],
      // [
      //   literal(
      //     `(SELECT users.lastName
      //      FROM users WHERE users.id = employee.userId)`,
      //   ),
      //   'lastName',
      // ],
      // [
      //   literal(
      //     `(SELECT users.image FROM users WHERE users.id = employee.userId)`,
      //   ),
      //   'image',
      // ],
    ],
    include: [
      {
        model: employeeCommission,
        where: { appointmentClosed: true },
        attributes: [
          `id`,
          `commission`,
          `byJob`,
          `total`,
          `createdAt`,
          `updatedAt`,
          `bookingId`,
          `jobId`,
          [
            literal(`(SELECT services.serviceName 
                     FROM services 
                     WHERE services.id = (SELECT jobs.serviceId 
                                          FROM jobs 
                                          WHERE jobs.id = employeeCommissions.jobId))`),
            'serviceName',
          ],
          [
            literal(`(SELECT CONCAT(users.firstName, ' ', users.lastName)
                     FROM users 
                     WHERE users.id = (SELECT bookings.customerId 
                                       FROM bookings 
                                       WHERE bookings.id = employeeCommissions.bookingId))`),
            'customerName', // Custom literal to fetch customer name
          ],
        ],
      },
    ],
  })

  return res.json(response({ message: 'Success', data: { result } }))
}

//* Payout 6. Rent a Chair Employee Summary -------------------------------------------

exports.rentalChairEmployeeSummary = async (req, res, next) => {
  const result = await employee.findOne({
    where: { id: req.params.employee },
    attributes: ['id'],
    include: [
      {
        model: rentChairEarning,
        where: { appointmentClosed: true },
        attributes: [
          `id`,
          `earnings`,
          `byJob`,
          `createdAt`,
          `updatedAt`,
          `bookingId`,
          `jobId`,
          [
            literal(`(SELECT services.serviceName 
                     FROM services 
                     WHERE services.id = (SELECT jobs.serviceId 
                                          FROM jobs 
                                          WHERE jobs.id = rentChairEarnings.jobId))`),
            'serviceName',
          ],
          [
            literal(`(SELECT CONCAT(users.firstName, ' ', users.lastName)
                     FROM users 
                     WHERE users.id = (SELECT bookings.customerId 
                                       FROM bookings 
                                       WHERE bookings.id = rentChairEarnings.bookingId))`),
            'customerName', // Custom literal to fetch customer name
          ],
        ],
      },
    ],
  })

  return res.json(response({ message: 'Success', data: { result } }))
}

//* Payout 7. Salary Employee Summary --------------------------------------------------

exports.salaryEmployeeSummary = async (req, res, next) => {
  const result = await jobs.findAll({
    where: { employeeId: req.params.employee, status: 'complete' },
    attributes: [
      'id',
      'status',
      'bookingId',
      'total',
      [
        literal(
          `(SELECT services.serviceName
           FROM services WHERE services.id = jobs.serviceId)`,
        ),
        'serviceName',
      ],
      [
        literal(`(SELECT CONCAT(users.firstName, ' ', users.lastName)
             FROM users
             WHERE users.id = (SELECT bookings.customerId
                               FROM bookings
                               WHERE bookings.id = jobs.bookingId))`),
        'customerName', // Custom literal to fetch customer name
      ],
      'on',
      'startTime',
    ],
  })

  return res.json(response({ message: 'Success', data: { result } }))
}

//? Transfer amount to employees

//* Amount-Transfer 1. To commission employees ------------------------------------------
exports.amountTransferCommission = async (req, res, next) => {
  //TODO handle exception for amounts bigger then balance

  const salon = await employee.findOne({
    where: { id: req.body?.employeeId },
    attributes: ['salonDetailId'],
  })

  if (!salon)
    throw new AppError('Transfer Failed: Employee Information Not Found.', 200)

  await commissionPayout.create(req.body)

  await wallet.increment(
    {
      commissionPayout: req.body?.amount,
      totalPayout: req.body?.amount,
      tipPayout: req.body?.tip,
    },
    { where: { salonDetailId: salon?.salonDetailId } },
  )

  return res.json(response({ message: 'Success', data: {} }))
}

//* Amount-Transfer 2. To rent a chair employees ----------------------------------------
exports.amountTransferRentAChair = async (req, res, next) => {
  //TODO handle exception for amounts bigger then balance

  const salon = await employee.findOne({
    where: { id: req.body?.employeeId },
    attributes: ['salonDetailId'],
  })

  if (!salon)
    throw new AppError('Transfer Failed: Employee Information Not Found.', 200)

  await rentChairPayout.create(req.body)

  await wallet.increment(
    {
      rentalPayout: req.body?.amount,
      totalPayout: req.body?.amount,
      tipPayout: req.body?.tip,
    },
    { where: { salonDetailId: salon?.salonDetailId } },
  )
  return res.json(response({ message: 'Success', data: {} }))
}

//! TRANSACTIONS HISTORY

//* TRANSACTIONS HISTORY 1. Commission Transaction History ------------------------------

exports.commissionTransactionHistory = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id', 'salonName'],
  })

  const history = await commissionPayout.findAll({
    where: { employeeId: req.params.employee },
  })

  return res.json(
    response({
      message: 'Success',
      data: { salon: salon.salonName, history },
    }),
  )
}

//* TRANSACTIONS HISTORY 2. Commission Transaction History -------------------------------

exports.rentChairTransactionHistory = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id', 'salonName'],
  })

  const history = await rentChairPayout.findAll({
    where: { employeeId: req.params.employee },
  })

  return res.json(
    response({
      message: 'Success',
      data: { salon: salon.salonName, history },
    }),
  )
}

//* TRANSACTIONS HISTORY 3. Salry Transaction History ------------------------------------

exports.salaryTransactionHistory = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id', 'salonName'],
  })

  const history = await salaryPayout.findAll({
    where: { employeeId: req.params.employee },
    attributes: { exclude: ['updatedAt', 'transactionType', 'employee'] },
  })

  return res.json(
    response({
      message: 'Success',
      data: { salon: salon.salonName, history },
    }),
  )
}
//------------------------------------------------+ different wage method
//! Payment needs to be made before switching the employee to a

//* Employee  3. Comission employee Account ----------------------------------------

exports.comissionEmployeeAccount = async (req, res, next) => {
  const employee = await employee.findOne({
    where: {
      id: req.params.id,
      id: {
        [Op.in]: literal(`(
        SELECT employeeId
        FROM employeeWagesMethods
        WHERE wagesMethodId = 1
      )`),
      },
    },
    attributes: [
      'id',
      [
        literal(`COALESCE(
        (SELECT SUM(employeeCommissions.commission)
         FROM employeeCommissions
         WHERE employeeCommissions.employeeId = employee.id AND employeeCommissions.appointmentClosed = TRUE), 0)`),
        'totalCommission',
      ],
      [
        literal(`COALESCE(
         (SELECT SUM(commissionPayouts.amount)
          FROM commissionPayouts
          WHERE commissionPayouts.employeeId = employee.id ), 0)`),
        'paidAmount',
      ],
    ],
  })
  return res.json(
    response({
      message: 'Success',
      data: { employee },
    }),
  )
}
//* Salary employee Account

exports.salaryEmployeeAccount = async (req, res, next) => {
  const result = await employee.findOne({
    where: {
      id: req.params.employee,
      // id: {
      //   [Op.in]: literal(`(
      //   SELECT employeeId
      //   FROM employeeWagesMethods
      //   WHERE wagesMethodId = 2
      // )`),
      // },
    },
    attributes: [
      'id',
      [
        literal(`COALESCE(
         (SELECT SUM(salaryPayouts.amount)
          FROM salaryPayouts
          WHERE salaryPayouts.employeeId = employee.id AND salaryPayouts.status = 'paid'  ), 0)`),
        'paidAmount',
      ],
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
          `(SELECT users.image FROM users WHERE users.id = employee.userId)`,
        ),
        'image',
      ],
    ],
    include: [
      {
        model: employeeWagesMethod,
        required: true,
      },
    ],
  })

  if (!result) throw new AppError('Employee not found', 404)

  const input = JSON.parse(JSON.stringify(result))
  console.log('🚀 ~ exports.salaryEmployeeAccount= ~ input:', input)

  const [data] = await calculateDueSalaries([input])
  const amount = parseFloat(input?.employeeWagesMethod?.value || 0)
  const cycle = input?.employeeWagesMethod?.cycle || 'Weekly' // Payment cycle type
  let lastExpectedDate =
    data?.dueSalaries[data?.dueSalaries?.length - 1]?.expectedDate

  if (!lastExpectedDate) {
    const createdAt = input?.employeeWagesMethod?.createdAt
      ? new Date(input?.employeeWagesMethod.createdAt)
      : null // Creation date

    // Determine last payment date
    lastExpectedDate = input?.employeeWagesMethod?.prevSalaryDate
      ? new Date(input?.employeeWagesMethod.prevSalaryDate)
      : createdAt || today // Default to today if both are null

    lastExpectedDate.setHours(0, 0, 0, 0) // Reset time part to start of the day
    console.log('🚀 ~ No Salary:', lastExpectedDate)
  }
  console.log(
    '🚀 ~ exports.salaryEmployeeAccount= ~ lastExpectedDate:',
    lastExpectedDate,
  )
  const remainings = await calculateSalaryFromLastDateToToday(
    amount,
    lastExpectedDate,
    cycle,
  )
  if (parseFloat(remainings.amount) > 0) {
    data.totalSalary = `${parseFloat(data.totalSalary) + parseFloat(remainings.totalTransfer)}`
    data.dueSalaries?.push(remainings)
  }

  return res.json(
    response({
      message: 'Success',
      data: { lastExpectedDate, data },
    }),
  )
}

//* RENT A CHAIR EXTERNAL  employee Account

exports.externalEmployeeSummary = async (req, res, next) => {
  const result = await employee.findAll({
    where: { salonDetailId: req.params.salon, isExternalEmployee: true },
    attributes: [
      'id',
      'position',
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
          `(SELECT users.image FROM users WHERE users.id = employee.userId)`,
        ),
        'image',
      ],
    ],
    include: [
      {
        model: employeeWagesMethod,
        required: true,
        attributes: ['prevSalaryDate', 'createdAt', 'cycle', 'value'],
      },
    ],
  })

  const workers =
    result && result.length > 0 ? JSON.parse(JSON.stringify(result)) : []
  if (workers.length > 0) {
    workers.forEach((ele) => {
      ele.rent = calculateDueRents(ele)
      delete ele.employeeWagesMethod
    })
  }

  // const rents = calculateDueRents({
  //   id: 419,
  //   position: 'stylish',
  //   employeeWagesMethod: {
  //     prevSalaryDate: null,
  //     createdAt: '2025-01-07T09:52:01.000Z',
  //     cycle: 'Weekly',
  //     value: '10',
  //   },
  // })

  return res.json(
    response({
      message: 'Success',
      data: { employees: workers, currencyUnit: CURRENCY_UNIT },
    }),
  )
}

//* RENT A CHAIR EXTERNAL  employee Account

exports.collectRent = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  if (!salon)
    throw new AppError('The rent payment could not be processed.', 404)

  req.body.employeeId = req.params?.employee
  req.body.salonDetailId = salon?.id

  await rentCollection.create(req.body)

  await employeeWagesMethod.update(
    { prevSalaryDate: req.body.paymentTillDate },
    { where: { employeeId: req.params?.employee } },
  )

  await wallet.increment(
    { accruedRent: req.body.amount },
    { where: { salonDetailId: salon?.id } },
  )

  return res.json(
    response({
      message: 'Rent payment received',
      data: {},
    }),
  )
}

//* RENT A CHAIR EXTERNAL Transaction History

exports.collectedRentTransactionHistory = async (req, res, next) => {
  const history = await rentCollection.findAll({
    where: { employeeId: req.params.employee },
    attributes: { exclude: ['updatedAt', 'employeeId', 'salonDetailId'] },
  })

  return res.json(
    response({
      message: 'Rent payment received',
      data: { history, currencyUnit: CURRENCY_UNIT },
    }),
  )
}

// 419 employee
// 1056 userId
// salon is  = 292
// attributes: [
//   'id',
//   'position',
//   [
//     literal(
//       `(SELECT users.firstName
//    FROM users WHERE users.id = employee.userId)`,
//     ),
//     'firstName',
//   ],
//   [
//     literal(
//       `(SELECT users.lastName
//    FROM users WHERE users.id = employee.userId)`,
//     ),
//     'lastName',
//   ],
//   [
//     literal(
//       `(SELECT users.image FROM users WHERE users.id = employee.userId)`,
//     ),
//     'image',
//   ],
// ],
