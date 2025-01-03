const { Op, literal, where } = require('sequelize')
const fs = require('fs').promises
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
  wallet,
  employeeAccess,
  employeeAccessDefault,
  jobs,
  booking,
} = require('../../models')
const jwt = require('jsonwebtoken')
const appError = require('../../utils/appError')
const Email = require('../../utils/Email')
const Convert = require('../../utils/dateManipulation')
const otpGenerator = require('otp-generator')
const inviteEmployeeEmail = require('../../helper/inviteEmployee')

const { salonDetails } = require('../userControllers/customerController')
const { sortAndCompleteTimes } = require('../../utils/timesFormator')
const e = require('cors')

//! Return Function
let returnFunction = (status, message, data, error) => {
  return {
    status: `${status}`,
    message: `${message}`,
    data: data,
    error: `${error}`,
  }
}
/*
            1. All Employees of Salon
    ________________________________________
*/
exports.AllEmployees = async (req, res, next) => {
  const userId = req.user.id
  // check if user with same eamil and phoneNum exists
  const salonDetails = await salonDetail.findOne({
    where: {
      userId,
    },
    attributes: ['id', 'teamSize'],
  })
  const salonDetailId = salonDetails.id
  const AllEmployess = await employee.findAll({
    where: {
      salonDetailId,
      deleted: false,
    },
    attributes: [
      'id',
      'position',
      'status',
      'salonDetailId',
      'isOwner',
      'deleted',
      [
        literal(
          '(SELECT FORMAT(AVG(ratings.value), 1) FROM ratings WHERE ratings.employeeId = employee.id)',
        ),
        'employeeAverageRating',
      ],
    ],
    include: {
      model: user,
      where: { deleted: false },
      attributes: ['id', 'firstName', 'lastName', 'image', 'status'],
    },
  })
  const activeMembers =
    AllEmployess.length > 0
      ? AllEmployess.filter(
          (employee) =>
            !employee.isOwner && employee.status && !employee.deleted,
        ).length
      : 0
  return res.json(
    returnFunction(
      '1',
      'All Employees of Salon',
      { AllEmployess, membersAllowed: salonDetails?.teamSize, activeMembers },
      '',
    ),
  )
}
/*
            1. Register Employee Manually(Employee data)
    ________________________________________
*/
exports.AddEmployee = async (req, res, next) => {
  const userId = req.user.id

  const {
    firstName,
    lastName,
    email,
    phoneNum,
    countryCode,
    password,
    position,
  } = req.body

  // check if user with same eamil and phoneNum exists
  const salonDetails = await salonDetail.findOne({
    where: {
      userId,
    },
    include: {
      model: time,
      attributes: ['id', 'day', 'openingTime', 'closingTime', 'status'],
    },
    attributes: ['id', 'salonName', 'teamSize', 'addressDBId'],
  })

  let teamCount = await employee.count({
    where: {
      salonDetailId: salonDetails.id,
      isOwner: false,
      status: true,
      deleted: false,
    },
  })
  // to equal self employee

  if (teamCount >= salonDetails.teamSize) {
    return next(
      new appError(
        '"Your subscription limit has been reached. Please upgrade your plan to add more employees.',
        200,
      ),
    )
  }
  const salonDetailId = salonDetails.id
  const userExist = await user.findOne({
    where: {
      [Op.or]: [
        { email: email },
        { [Op.and]: [{ countryCode: countryCode }, { phonenum: phoneNum }] },
      ],
      deletedAt: { [Op.is]: null },
    },
  })

  //   return res.json(req.body)
  if (userExist) {
    if (email === userExist.email)
      return next(
        new appError(
          'Users exists,The email you entered is already taken',
          200,
        ),
      )
    else if (phoneNum === userExist.phoneNum) {
      return next(
        new appError(
          'Users exists,The Phone Number you entered is already taken',
          200,
        ),
      )
    } else if ([1, 2, 4].includes(userExist.userTypeId)) {
      // check if there is already user with the same Email in relative apps
      return next(
        new appError(
          'Trying to login?,A Customer with the follwoing email exists ',
          200,
        ),
      )
    }

    const employeeData = await employee.findOne({
      where: {
        userId: userExist.id,
      },
    })

    return res.json(
      returnFunction(
        '1',
        'Employee Details Added Successfully!',
        { employeeId: employeeData.id },
        '',
      ),
    )
  } else {
    let DT = Date.now()

    const employeeInput = {
      firstName,
      lastName,
      email,
      phoneNum,
      countryCode,
      status: true,
      password,
      verifiedAt: DT,
      signedFrom: 'email',
      userTypeId: 3,
    }

    if (req.file) {
      let tmpprofileImage = req.file.path
      let profileImageName = tmpprofileImage.replace(/\\/g, '/')
      employeeInput.image = profileImageName
    }

    const isExternalEmployeeCondition = req.body?.isExternalEmployee == 'true'

    if (isExternalEmployeeCondition) {
      employeeInput.isExternalEmployee = true
      employeeInput.userTypeId = 2
    }

    // if No User Exist with the same email create new user
    let newEntry = await user.create(employeeInput)
    // save  Employee data in the table by creating new entry
    let employeeData = await employee.create({
      position,
      userId: newEntry.id,
      salonDetailId,
      isExternalEmployee: isExternalEmployeeCondition,
    })

    let workerId = employeeData.id
    let externalEmployeeSalonId = null
    if (isExternalEmployeeCondition) {
      //create a slaon of external employee
      const externalEmployeeSalon = await salonDetail.create({
        salonName: `${firstName} ${lastName}`,
        status: true,
        isExternalEmployee: true,
        addressDBId: salonDetails?.addressDBId,
        teamSize: 0,
        userId: newEntry.id,
        isExternalEmployee: true,
        parentSalonId: salonDetails?.id,
        approvedByAdmin: true,
      })

      externalEmployeeSalonId = externalEmployeeSalon.id

      const externalEmployee = await employee.create({
        position: 'Me',
        userId: newEntry.id,
        salonDetailId: externalEmployeeSalon.id,
        parentEmployeeId: workerId,
        isOwner: true,
      })
      workerId = externalEmployee.id

      await wallet.create({
        salonDetailId: externalEmployeeSalon.id,
      })
      //Optional need more data from client side
      employeeWagesMethod.create({
        value: 10,
        wagesMethodId: 3,
        employeeId: employeeData.id,
        cycle: 'Monthly',
      })
    }

    wallet.create({
      employeeId: employeeData.id,
    })

    salonDetails.times.map(async (dat) => {
      const newTime = new time()
      newTime.openingTime = dat.openingTime
      newTime.closingTime = dat.closingTime
      newTime.day = dat.day
      newTime.status = dat.status
      newTime.employeeId = workerId
      if (externalEmployeeSalonId) {
        newTime.salonDetailId = externalEmployeeSalonId
      }
      await newTime.save()
    })

    // Handling the uploaded pictures
    const emailData = {
      name: `${firstName} ${lastName} `,
      email,
      password,
      salonName: salonDetails.salonName,
      link: req.body.link,
    }
    inviteEmployeeEmail([email], emailData)
    return res.json(
      returnFunction(
        '1',
        'Employee Details Added Successfully!',
        { employeeId: employeeData.id },
        '',
      ),
    )
  }
}
/*
            2.Get Employee Timings 
    ________________________________________
*/
exports.getEmployeeTiming = async (req, res, next) => {
  const { employeeId } = req.body
  // ittirating an array and creating the entries of salon timings
  const employeeTiming = await time.findAll({
    where: {
      employeeId,
    },
    attributes: ['id', 'day', 'openingTime', 'closingTime', 'status'],
  })
  console.log('employeeTiming', JSON.parse(JSON.stringify(employeeTiming)))
  employeeTiming.forEach((timeSlot) => {
    timeSlot.openingTime =
      timeSlot.openingTime == '00:00:01'
        ? ''
        : timeSlot.openingTime == null
          ? ''
          : Convert.convertTo12HourFormat(timeSlot.openingTime)
    timeSlot.closingTime =
      timeSlot.closingTime == '24:00:00'
        ? ''
        : timeSlot.closingTime == null
          ? ''
          : Convert.convertTo12HourFormat(timeSlot.closingTime)
  })
  return res.json(
    returnFunction('1', 'Employee Timing', { employeeTiming }, ''),
  )
}
/*
            3.Get Salon Services
    ________________________________________
*/
exports.getServices = async (req, res, next) => {
  const userId = req.user.id

  const serviceData = await service.findAll({
    include: {
      model: salonDetail,
      where: {
        userId,
      },
      attributes: [],
    },
  })

  return res.json(returnFunction('1', 'Services of Salon', { serviceData }, ''))
}
/*
            4.Add Employee Services
    ________________________________________
*/
exports.addEmployeeService = async (req, res, next) => {
  const userId = req.user.id
  const SalonDetail = await salonDetail.findOne({
    where: { userId },
  })
  const { serviceIds, employeeId, salonDetailId } = req.body
  // ittirating the array and add the srevices of employee
  const associatedServices = [...new Set(serviceIds)]
  associatedServices.map(async (dat) => {
    const newService = new employeeService()
    newService.serviceId = dat.id
    newService.employeeId = employeeId
    newService.salonDetailId = SalonDetail.id
    await newService.save()
  })
  return res.json(returnFunction('1', 'Services of Employee', {}, ''))
}
/*
            3.get Wages Method
    ________________________________________
*/
exports.getWagesMethod = async (req, res, next) => {
  const WagesMethod = await wagesMethod.findAll({
    attributes: ['id', 'methodName', 'description'],
  })

  return res.json(returnFunction('1', 'Services of Salon', { WagesMethod }, ''))
}
/*
            4.Add wages method
    ________________________________________
*/
exports.addWagesMethod = async (req, res, next) => {
  const method = await employeeWagesMethod.create(req.body)
  return res.json(
    returnFunction('1', 'Wages Method Added Successfully!', {}, ''),
  )
}

/*
            4.Employee Detail
    ________________________________________
*/

exports.employeeDetail = async (req, res, next) => {
  const employeeId = req.body.employeeId

  const result = await employee.findByPk(employeeId, {
    include: [
      {
        model: user,
        attributes: [
          'id',
          'firstName',
          'lastName',
          'email',
          'countryCode',
          'phoneNum',
          'image',
        ],
      },
      { model: salonDetail, attributes: ['coverImage'] },
      {
        model: employeeWagesMethod,
        include: { model: wagesMethod, attributes: ['methodName'] },
        attributes: [
          'id',
          'value',
          'cycle',
          'cycleValue',
          'payDay',
          'payDate',
          'wagesMethodId',
        ],
      },
      {
        model: employeeService,
        required: false,
        where: { status: true },
        include: { model: service, attributes: ['id', 'serviceName'] },
        attributes: ['status'],
      },
      {
        model: time,
        attributes: ['id', 'day', 'openingTime', 'closingTime', 'status'],
      },
    ],
    attributes: [
      'id',
      'position',
      'isOwner',
      'status',
      'description',
      [
        literal(
          '(SELECT FORMAT(AVG(ratings.value), 1) FROM ratings WHERE ratings.employeeId = employee.id)',
        ),
        'employeeAverageRating',
      ],
      [
        literal(
          '(SELECT COUNT(ratings.id) FROM ratings WHERE ratings.employeeId = employee.id)',
        ),
        'totalRatings',
      ],
    ],
  })

  if (!result) return next(new appError('Data not found', 404))

  const employeeData = JSON.parse(JSON.stringify(result))

  const methodId = employeeData.employeeWagesMethod?.wagesMethodId
  let paymentPending = false
  if (methodId && methodId != 2) {
    const commissionAttributes = [
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
    ]

    //will use if needed ((in case where we need to show balance along with tips)) now we will just check if the earnings is in positive number then pending payment will be true

    // const baseAttributes = [
    //   'id',
    //   [
    //     literal(`COALESCE(
    //       (SELECT SUM(tips.amount)
    //        FROM tips
    //        WHERE tips.employeeId = employee.id), 0)`),
    //     'totalTip',
    //   ],
    // ]

    const rendAChair = [
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
     (SELECT SUM(rentChairPayouts.amount)
      FROM rentChairPayouts
      WHERE rentChairPayouts.employeeId = employee.id ), 0)`),
        'paidAmount',
      ],
    ]

    const attributes = methodId == 1 ? commissionAttributes : rendAChair
    const worker = await employee.findOne({
      where: {
        id: employeeData.id,
        //   id: {
        //     [Op.in]: literal(`(
        //   SELECT employeeId
        //   FROM employeeWagesMethods
        //   WHERE wagesMethodId = ${methodId}
        // )`),
        // },
      },
      attributes: attributes,
    })
    // return res.json(returnFunction('1', 'Employee Deyails', worker, ''))

    console.log('ðŸš€ ~ exports.employeeDetail= ~ worker:', worker)
    if (methodId == 1) {
      const earning =
        parseFloat(worker?.dataValues?.totalCommission) -
          parseFloat(worker?.dataValues?.paidAmount) || 0

      if (earning > 0) paymentPending = true
    } else if (methodId == 3) {
      const earning =
        parseFloat(worker?.dataValues?.earnings) -
          parseFloat(worker?.dataValues?.paidAmount) || 0

      if (earning > 0) paymentPending = true
    }
  }
  // Convert opening and closing times to 12-hour format
  employeeData?.times?.forEach((timeSlot) => {
    timeSlot.openingTime = timeSlot.openingTime
      ? Convert.convertTo12HourFormat(timeSlot.openingTime)
      : ''
    timeSlot.closingTime = timeSlot.closingTime
      ? Convert.convertTo12HourFormat(timeSlot.closingTime)
      : ''
  })

  employeeData.times = sortAndCompleteTimes(employeeData?.times || [])

  employeeData.paymentPending = paymentPending
  return res.json(returnFunction('1', 'Employee Deyails', employeeData, ''))
}

/*
            4.Update Employee Detail
    ________________________________________
*/
exports.updateEmployee = async (req, res, next) => {
  const { firstName, lastName, position, employeeId } = req.body
  let employeeData = await employee.findByPk(employeeId, {
    include: {
      model: user,
      attributes: ['id', 'firstName', 'lastName', 'image'],
    },
    attributes: ['id', 'position'],
  })
  if (req.file) {
    if (employeeData.user.image == '') {
      let tmpprofileImage = req.file.path
      let profileImageName = tmpprofileImage.replace(/\\/g, '/')
      let userUpdate = await user.update(
        { image: profileImageName },
        { where: { id: employeeData.user.id } },
      )
    } else {
      let tmpprofileImage = req.file.path
      let profileImageName = tmpprofileImage.replace(/\\/g, '/')
      fs.unlink(employeeData.user.image, async (err) => {
        if (err) {
          console.error(`Error deleting file: ${err.message}`)
        } else {
          console.log('Picture Deleted Successfully!')
        }
      })
      await user.update(
        { image: profileImageName },
        { where: { id: employeeData.user.id } },
      )
    }
  }
  await user.update(
    {
      firstName,
      lastName,
    },
    {
      where: { id: employeeData.user.id },
    },
  )
  ;(employeeData.position = position ?? employeeData.position),
    await employeeData.save()

  return res.json(returnFunction('1', 'Employee Updated Successfully!', {}, ''))
}
/*
            4.Update Employee Timings
    ________________________________________
*/
exports.updateEmployeTimings = async (req, res, next) => {
  const { employeeId, timeData } = req.body

  timeData.map(async (dat) => {
    let timeTable = await time.findOne({
      where: [{ employeeId }, { day: dat.day }],
    })
    if (timeTable) {
      timeTable.openingTime =
        dat.openingTime && dat.status
          ? Convert.convertTo24HourFormat(dat.openingTime)
          : !dat.status
            ? null
            : '00:00:01'
      timeTable.closingTime =
        dat.closingTime && dat.status
          ? Convert.convertTo24HourFormat(dat.closingTime)
          : !dat.status
            ? null
            : '24:00:00'
      timeTable.status = dat.status
      await timeTable.save()
    } else {
      const newTime = new time()
      newTime.openingTime =
        dat.openingTime && dat.status
          ? Convert.convertTo24HourFormat(dat.openingTime)
          : !dat.status
            ? null
            : '00:00:01'
      newTime.closingTime =
        dat.closingTime && dat.status
          ? Convert.convertTo24HourFormat(dat.closingTime)
          : !dat.status
            ? null
            : '24:00:00'
      newTime.day = dat.day
      newTime.employeeId = employeeId
      await newTime.save()
    }
  })
  return res.json(
    returnFunction('1', 'Employee Timings Updated Successfully!', {}, ''),
  )
}
/*
            5.Update Employee Service
    ________________________________________
*/
exports.updateEmployeeService = async (req, res, next) => {
  const userId = req.user.id
  const SalonDetail = await salonDetail.findOne({
    where: { userId },
  })
  const { serviceIds, employeeId } = req.body
  const associatedServices = [...new Set(serviceIds)]

  associatedServices.map(async (dat) => {
    let serviceData = await employeeService.findOne({
      where: [{ employeeId }, { serviceId: dat.id }],
    })
    if (serviceData) {
      serviceData.status = dat.status
      serviceData.salonDetailId = SalonDetail.id
      await serviceData.save()
    } else {
      let newService = new employeeService()
      newService.employeeId = employeeId
      newService.serviceId = dat.id
      newService.status = dat.status
      newService.salonDetailId = SalonDetail.id
      await newService.save()
    }
  })
  return res.json(
    returnFunction('1', 'Employee Services Updated Successfully!', {}, ''),
  )
}
/*
            5.Update Employee Wages Method
    ________________________________________
*/
exports.updateWagesMethod = async (req, res, next) => {
  let method = await employeeWagesMethod.findOne({
    where: {
      employeeId: req.body.employeeId,
    },
  })
  if (method) {
    await employeeWagesMethod.update(req.body, {
      where: { employeeId: req.body.employeeId },
    })
  } else {
    await employeeWagesMethod.create(req.body)
  }
  return res.json(
    returnFunction('1', 'Employee Wages Method Updated Successfully!', {}, ''),
  )
}

/*
            6.Add Accesslevels
    ________________________________________
*/

exports.addOrUpdateAccessleves = async (req, res, next) => {
  const { employeeId, accesslevels } = req.body

  await employeeAccess.destroy({
    where: { employeeId },
  })

  accesslevels.forEach((el) => (el.employeeId = employeeId))

  employeeAccess.bulkCreate(accesslevels)

  return res.json(returnFunction('1', 'success', {}, ''))
}

/*
            7.Add Accesslevels
    ________________________________________
*/

exports.fetchAccesslevels = async (req, res, next) => {
  const { employeeId } = req.params
  const accesslevels = await employeeAccess.findAll({
    where: {
      employeeId,
    },
    attributes: { exclude: ['createdAt', 'updatedAt', 'employeeId'] },
  })
  return res.json(returnFunction('1', 'success', { accesslevels }, ''))
}

//*8.Fecth Default Accesslevels

exports.fetchDefaultAccesslevels = async (req, res, next) => {
  const { salonDetailId } = req.params

  let accesslevels = await employeeAccessDefault.findAll({
    where: {
      salonDetailId,
    },
    attributes: {
      exclude: ['createdAt', 'updatedAt', 'salonDetailId', 'id', 'status'],
    },
  })

  if (!accesslevels || accesslevels.length < 1) {
    accesslevels = [
      {
        access: 'Reschedule\nAppointments',
        key: 'appointments',
        level: 'none',
      },
      {
        access: 'Team\nMember',
        key: 'teamMember',
        level: 'none',
      },
      {
        access: 'Can Book\nAppointments',
        key: 'bookAppointments',
        level: 'none',
      },
      {
        access: 'Can Apply Discounts\nTo Appointments',
        key: 'applyDiscount',
        level: 'none',
      },
      {
        access: 'Clients',
        key: 'client',
        level: 'none',
      },
      {
        access: 'Services',
        key: 'services',
        level: 'none',
      },
      {
        access: 'Client\nFeedback',
        key: 'feedback',
        level: 'none',
      },
      {
        access: 'Manage\nDeals',
        key: 'manageDeals',
        level: 'none',
      },
    ]
  }

  return res.json(returnFunction('1', 'success', { accesslevels }, ''))
}

//*8.Add or update Default Accesslevels
exports.addOrUpdateDefaultAccessleves = async (req, res, next) => {
  const { salonDetailId, accesslevels } = req.body

  await employeeAccessDefault.destroy({
    where: {
      salonDetailId,
    },
  })

  accesslevels.forEach((el) => (el.salonDetailId = salonDetailId))
  employeeAccessDefault.bulkCreate(accesslevels)
  return res.json(returnFunction('1', 'success', {}, ''))
}

//*8.Active Block
exports.activeBlockEmployee = async (req, res, next) => {
  const userId = req.params.employee

  const result = await user.findByPk(userId, {
    attributes: [
      'id',
      'status',
      [
        literal(
          `(SELECT employees.id
           FROM employees WHERE employees.userId = user.id)`,
        ),
        'employeeId',
      ],
      [
        literal(
          `(SELECT employees.isOwner
           FROM employees WHERE employees.userId = user.id)`,
        ),
        'isOwner',
      ],
    ],
  })
  const worker = JSON.parse(JSON.stringify(result))
  const salon = await salonDetail.findOne({
    where: { userId: req?.user?.id },
    attributes: ['id', 'teamSize'],
  })

  if (!worker) return next(new appError('Data not found', 404))
  if (worker.isOwner) {
    return next(
      new appError('The salon owner cannot be restricted or blocked.', 200),
    )
  }
  const activeMembers = await employee.count({
    where: {
      isOwner: false,
      status: true,
      deleted: false,
      salonDetailId: salon.id,
    },
  })
  console.log('🚀 ~ = ~ activeMembers >= salon?.teamSize:', activeMembers)
  console.log('🚀 ~ = ~ req.body.status:', salon?.teamSize)
  if (activeMembers >= salon?.teamSize && req.body.status) {
    return next(
      new appError(
        'Your team size must not exceed the limit of your subscription.',
        200,
      ),
    )
  }

  const employeeId = worker?.dataValues?.employeeId
  console.log('🚀 ~ exports.deleteEmployee ~ employeeId:', employeeId)
  const work = await jobs.findAll({
    where: { status: 'assign', employeeId },
    attributes: ['id', 'bookingId'],
  })
  // return res.json({ work, employeeId })
  if (work && work.length > 0) {
    const jobsIds = work.map((ele) => ele.id)
    console.log('🚀 ~ exports.deleteEmployee ~ jobsIds:', jobsIds)
    const bookingIds = work.map((ele) => ele.bookingId)
    console.log('🚀 ~ exports.deleteEmployee ~ bookingIds:', bookingIds)
    const uniqueBookingIds = [...new Set(bookingIds)]
    jobs.update(
      { employeeId: null, status: 'pending' },
      { where: { id: jobsIds } },
    )
    booking.update({ status: 'pending' }, { where: { id: uniqueBookingIds } })
  }
  user.update({ status: req.body.status }, { where: { id: userId } })
  employee.update({ status: req.body.status }, { where: { userId: userId } })
  return res.json(returnFunction('1', 'success', {}, ''))
}

//*8. Delete Employee
exports.deleteEmployee = async (req, res, next) => {
  const userId = req.params.employee
  const worker = await user.findByPk(userId, {
    attributes: [
      'id',
      'status',
      'isOwner',
      [
        literal(
          `(SELECT employees.id
         FROM employees WHERE employees.userId = user.id)`,
        ),
        'employeeId',
      ],
    ],
  })
  if (!worker) return next(new appError('Data not found', 404))
  if (worker.isOwner) {
    return next(new appError('The salon owner cannot be deleted.', 200))
  }
  const employeeId = worker?.dataValues?.employeeId
  console.log('🚀 ~ exports.deleteEmployee ~ employeeId:', employeeId)
  const work = await jobs.findAll({
    where: { status: 'assign', employeeId },
    attributes: ['id', 'bookingId'],
  })
  // return res.json({ work, employeeId })
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

  user.update({ deleted: true }, { where: { id: userId } })
  employee.update({ deleted: true }, { where: { userId: userId } })
  deviceToken.destroy({ where: { userId } })
  return res.json(returnFunction('1', 'success', {}, ''))
}
