const { Op, literal, where } = require('sequelize')
const { renterFreeDays } = require('../../helper/salonSubscriptionRule')
const renterMove = require('../../helper/renterMove')
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
  category,
  cancellationPolicy,
  paymentPolicy,
  reschedulePolicy,
  noShowPolicy,
  subscriptions,
} = require('../../models')
const jwt = require('jsonwebtoken')
const appError = require('../../utils/appError')
const Email = require('../../utils/Email')
const Convert = require('../../utils/dateManipulation')
const {
  updateServiceCategoryIds,
} = require('../../utils/updateServiceCategoryIds')
const otpGenerator = require('otp-generator')
const inviteEmployeeEmail = require('../../helper/inviteEmployee')

const { salonDetails } = require('../userControllers/customerController')
const { sortAndCompleteTimes } = require('../../utils/timesFormator')
const { blockEmployees } = require('../eventDrivenCommunication/blockEmployees')

const {
  processAllAppointments,
  processAppointment,
} = require('../../utils/cancelMultipleBookings')
//! Return Function
let returnFunction = (status, message, data, error) => {
  return {
    status: `${status}`,
    message: `${message}`,
    data: data,
    error: `${error}`,
  }
}

// Sentinel for unlimited team size (RevenueCat/Stripe store this as 999 in DB)
const UNLIMITED_TEAM_SIZE = 999;

//! Helper Function: Get team size from Apple product ID
const getTeamSizeFromAppleProduct = (productId) => {
  if (!productId) return null;
  
  // Map Apple product IDs to team sizes (owner + staff members)
  const productTeamSizeMapping = {
    'trimbiz_monthly_owner': 1,                      // Owner only
    'trimbiz_owner_one_staff': 2,                    // Owner + 1 staff
    'trimbiz_owner_two_staff': 3,                    // Owner + 2 staff
    'trimbiz_owner_three_staff': 4,                  // Owner + 3 staff
    'trimbiz_owner_four_staff': 5,                   // Owner + 4 staff
    'trimbiz_owner_five_staff': 6,                   // Owner + 5 staff
    'trimbiz_owner_unlimited_staff': UNLIMITED_TEAM_SIZE,            // Owner + unlimited staff
    'trimbiz_monthly_renter': 0,                     // Chair renter's own plan: no staff
  };
  
  return productTeamSizeMapping[productId] ?? null;
}

/*
            1. All Employees of Salon
    ________________________________________
*/
exports.fetchEmployees = async (req, res, next) => {
  const userId = req.user.id
  // check if user with same eamil and phoneNum exists
  const salonDetails = await salonDetail.findOne({
    where: {
      userId,
    },
    attributes: ['id', 'teamSize'],
  })
  const salonDetailId = salonDetails.id
  
  // Check for active Apple subscription
  let membersAllowed = salonDetails?.teamSize || 0;
  
  const appleSubscription = await subscriptions.findOne({
    where: {
      customerId: userId.toString(),
      status: 'active',
    },
    order: [['createdAt', 'DESC']],
    attributes: ['appleProductId', 'status', 'periodEnd'],
  });

  // If Apple subscription exists and is active, use team size from Apple product
  if (appleSubscription && appleSubscription.appleProductId) {
    const appleTeamSize = getTeamSizeFromAppleProduct(appleSubscription.appleProductId);
    if (appleTeamSize !== null) {
      membersAllowed = appleTeamSize;
      console.log(`✅ Using Apple subscription team size: ${appleTeamSize} (Product: ${appleSubscription.appleProductId})`);
    }
  } else {
    // Fallback to Stripe/RevenueCat subscription team size from salonDetails (999 = unlimited)
    console.log(`✅ Using Stripe/RevenueCat subscription team size: ${membersAllowed}`);
  }
  
  const condition = { salonDetailId, deleted: false, isExternalEmployee: false }
  if (req?.params?.type == 'external') condition.isExternalEmployee = true
  // Chair renters who moved to another shop (kept for history, not deleted).
  if (req?.params?.type == 'left') {
    condition.isExternalEmployee = true
    condition.deleted = true
    condition.leftAt = { [Op.ne]: null }
  }

  const AllEmployess = await employee.findAll({
    where: condition,
    attributes: [
      'id',
      'position',
      'status',
      'salonDetailId',
      'isOwner',
      'isExternalEmployee',
      'deleted',
      'leftAt',
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

  // Chair renters pay for their own plan, so they never use one of the shop's seats.
  const activeStaffCount = await employee.count({
    where: { salonDetailId, deleted: false, isOwner: false, status: true, isExternalEmployee: false },
  })
  // activeMembers = owner (1) + active staff (aligns with membersAllowed = owner + N staff)
  const activeMembers = 1 + activeStaffCount

  return res.json(
    returnFunction(
      '1',
      'All shop employees',
      { AllEmployess, membersAllowed, activeMembers },
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
    rentType,
    rentAmount,
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

  // Chair renters pay for their own plan, so only staff use the shop's seats.
  let teamCount = await employee.count({
    where: {
      salonDetailId: salonDetails.id,
      isOwner: false,
      status: true,
      deleted: false,
      isExternalEmployee: false,
    },
  })
  // to equal self employee

  const addingRenter = req.body?.isExternalEmployee == 'true'
  if (!addingRenter && req?.body?.registerEmployeeDuringSalonRegistration != 'fromAuth') {
    const limit = salonDetails.teamSize;
    if (limit !== UNLIMITED_TEAM_SIZE && teamCount >= limit) {
      return next(
        new appError(
          'Your subscription limit has been reached. Please upgrade your plan to add more employees.',
          200,
        ),
      )
    }
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
    if (email === userExist.email) {
      throw new appError(
        'Users exists,The email you entered is already taken',
        200,
      )
    } else if (phoneNum === userExist.phoneNum) {
      throw new appError(
        'Users exists,The Phone Number you entered is already taken',
        200,
      )
    } else if ([1, 2, 4].includes(userExist.userTypeId)) {
      // check if there is already user with the same Email in relative apps
      throw new appError(
        'Trying to login?,A Customer with the follwoing email exists ',
        200,
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
        onlinePayments: true,
        coverImage: employeeInput?.image,
        onlinePayments: false,
        // The renter's own plan: free days first, so clients can book them at once.
        ...renterFreeDays(),
      })

      externalEmployeeSalonId = externalEmployeeSalon?.id

      const externalEmployee = await employee.create({
        position: 'Me',
        userId: newEntry.id,
        salonDetailId: externalEmployeeSalon?.id,
        parentEmployeeId: workerId,
        isOwner: true,
      })
      workerId = externalEmployee.id

      await wallet.create({
        salonDetailId: externalEmployeeSalon?.id,
      })

      cancellationPolicy.create({
        hoursBeforeBooking: 72,
        refundPercentage: 0,
        salonDetailId: externalEmployeeSalon?.id,
      })

      paymentPolicy.create({
        salonDetailId: externalEmployeeSalon?.id,
      })

      reschedulePolicy.create({
        salonDetailId: externalEmployeeSalon?.id,
      })

      noShowPolicy.create({
        salonDetailId: externalEmployeeSalon?.id,
      })

      //Optional need more data from client side
      await employeeWagesMethod.create({
        value: rentAmount,
        wagesMethodId: 3,
        employeeId: employeeData.id,
        cycle: rentType,
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
    returnFunction('1', 'Opening hours', { employeeTiming }, ''),
  )
}
/*
            3.Get Salon Services
    ________________________________________
*/
exports.getServices = async (req, res, next) => {
  const userId = req.user.id
  const salon = await salonDetail.findOne({
    where: { userId },
    attributes: [
      'isExternalEmployee',
      'id',
      [
        literal(
          '(SELECT COUNT(services.id) FROM services WHERE services.salonDetailId = salonDetail.id)',
        ),
        'totalServices',
      ],
      'parentSalonId',
    ],
  })

  if (!salon) return next(new appError('Data not found', 404))

  const condition = { salonDetailId: salon.id }
  if (salon?.isExternalEmployee && salon?.dataValues?.totalServices < 1) {
    condition.salonDetailId = salon?.parentSalonId
  }

  const serviceData = await service.findAll({
    where: condition,
  })

  return res.json(returnFunction('1', 'Shop services', { serviceData }, ''))
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
  return res.json(
    returnFunction('1', 'Services of employee added successfully!', {}, ''),
  )
}
/*
            3.get Wages Method
    ________________________________________
*/
exports.getWagesMethod = async (req, res, next) => {
  const WagesMethod = await wagesMethod.findAll({
    where: { status: true },
    attributes: ['id', 'methodName', 'description'],
  })

  return res.json(returnFunction('1', 'Shop services', { WagesMethod }, ''))
}
/*
            4.Add wages method
    ________________________________________
*/
exports.addWagesMethod = async (req, res, next) => {
  const method = await employeeWagesMethod.create(req.body)
  return res.json(
    returnFunction('1', 'Wages method added successfully!', {}, ''),
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
        required: false,
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
      // { model: salonDetail, attributes: ['coverImage'] },
      {
        model: employeeWagesMethod,
        required: false,
        include: {
          model: wagesMethod,
          required: false,
          attributes: ['methodName'],
        },
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
      'isExternalEmployee',
      'isOwner',
      'status',
      'userId',
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


  //   console.log("Result -------------->",result)

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

    console.log('Ã°Å¸Å¡â‚¬ ~ exports.employeeDetail= ~ worker:', worker)
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

  if (employeeData?.isExternalEmployee) {
    const workinghour = await employee.findOne({
      where: { userId: employeeData.userId, isOwner: true },
      attributes: ['id'],
      include: [
        {
          model: time,
          attributes: ['id', 'day', 'openingTime', 'closingTime', 'status'],
        },
      ],
    })

    employeeData.times = workinghour?.times
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
  return res.json(returnFunction('1', 'Employee details', employeeData, ''))
}

/*
            4.Update Employee Detail
    ________________________________________
*/
exports.updateEmployee = async (req, res, next) => {
  const { firstName, lastName, position, employeeId, countryCode, phoneNum } =
    req.body

  let employeeData = await employee.findByPk(employeeId, {
    include: {
      model: user,
      attributes: ['id', 'firstName', 'lastName', 'image'],
    },
    attributes: ['id', 'position', 'userId'],
  })
  const exist = await user.findOne({
    where: { countryCode, phoneNum, id: { [Op.ne]: employeeData?.userId } },
  })
  if (exist) {
    return next(
      new appError(
        'It appears this phone number is already associated with an account. Please use a different number.',
        200,
      ),
    )
  }
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
      fs.unlink(employeeData?.user?.image, async (err) => {
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
      countryCode,
      phoneNum,
    },
    {
      where: { id: employeeData.user.id },
    },
  )
    ; (employeeData.position = position ?? employeeData.position),
      await employeeData.save()

  return res.json(returnFunction('1', 'Employee updated successfully!', {}, ''))
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
    returnFunction('1', 'Employee timings updated successfully', {}, '')
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
    returnFunction('1', 'Employee services updated successfully!', {}, ''),
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
    returnFunction('1', 'Employee wages method updated successfully!', {}, ''),
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

  return res.json(returnFunction('1', 'Success', {}, ''))
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
  return res.json(returnFunction('1', 'Loaded', { accesslevels }, ''))
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
        access: 'Reschedule\nbookings',
        key: 'appointments',
        level: 'none',
      },
      {
        access: 'Team member\nmanagement',
        key: 'teamMember',
        level: 'none',
      },
      {
        access: 'Can add\nbookings',
        key: 'bookAppointments',
        level: 'none',
      },
      {
        access: 'Can apply discounts',
        key: 'applyDiscount',
        level: 'none',
      },
      {
        access: 'Customer information',
        key: 'client',
        level: 'none',
      },
      {
        access: 'Services',
        key: 'services',
        level: 'none',
      },
      {
        access: 'Customer\nfeedback',
        key: 'feedback',
        level: 'none',
      },
      {
        access: 'Coupons &\nloyalty',
        key: 'manageDeals',
        level: 'none',
      },
      {
        access: 'Shop profile',
        key: 'updateProfile',
        level: 'none',
      },
      {
        access: 'Send\nnotifications',
        key: 'sendNotification',
        level: 'none',
      },
      {
        access: 'Respond to\nenquiries',
        key: 'respondToEnquiries',
        level: 'none',
      },
      {
        access: 'Booking\nrequests',
        key: 'bookingRequests',
        level: 'none',
      },
    ]
  }

  return res.json(returnFunction('1', 'Success', { accesslevels }, ''))
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
  return res.json(returnFunction('1', 'Success', {}, ''))
}

// The caller's shop: the owner's own shop, or the shop a staff member works at.
async function callerShop(req) {
  const own = await salonDetail.findOne({
    where: { userId: req?.user?.id, deleted: false },
    attributes: ['id', 'teamSize', 'isExternalEmployee'],
  })
  if (own && !own.isExternalEmployee) return own
  const row = await employee.findOne({
    where: { userId: req?.user?.id, deleted: false, isExternalEmployee: false },
    attributes: ['salonDetailId'],
  })
  return row ? salonDetail.findByPk(row.salonDetailId, { attributes: ['id', 'teamSize'] }) : null
}

// A team member of the caller's shop only. A chair renter who has moved on is
// no longer on this shop's team, so the old shop cannot block or delete them.
const workerAtShop = (userId, salonDetailId) =>
  employee.findOne({
    where: { userId, salonDetailId, deleted: false },
    attributes: [
      ['userId', 'id'],
      'status',
      ['id', 'employeeId'],
      'isOwner',
      'isExternalEmployee',
    ],
  })

//*8.Active Block
exports.activeBlockEmployee = async (req, res, next) => {
  const userId = req.params.employee

  const salon = await callerShop(req)
  if (!salon) return next(new appError('Data not found', 404))
  const result = await workerAtShop(userId, salon.id)
  const worker = JSON.parse(JSON.stringify(result))

  if (!worker) return next(new appError('Data not found', 404))
  if (worker.isOwner) {
    return next(
      new appError('The shop owner cannot be restricted or blocked.', 200),
    )
  }
  const activeMembers = await employee.count({
    where: {
      isOwner: false,
      status: true,
      deleted: false,
      isExternalEmployee: false,
      salonDetailId: salon.id,
    },
  })
  console.log('🚀 ~ = ~ activeMembers >= salon?.teamSize:', activeMembers)
  console.log('🚀 ~ = ~ req.body.status:', salon?.teamSize)
  const teamLimit = salon?.teamSize;
  // A chair renter pays for their own plan, so unblocking one needs no free seat.
  if (!worker.isExternalEmployee && teamLimit !== UNLIMITED_TEAM_SIZE && activeMembers >= teamLimit && req.body.status) {
    return next(
      new appError(
        'Your team size must not exceed the limit of your subscription.',
        200,
      ),
    )
  }

  const employeeId = worker?.employeeId
  console.log('🚀 ~ exports.deleteEmployee ~ employeeId:', employeeId)
  if (!worker?.isExternalEmployee) {
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
  }
  if (worker?.isExternalEmployee) {
    // A chair renter has their own account and plan: the shop only blocks
    // them on its own team, never their login or their own page.
    await employee.update(
      { status: req.body?.status || false },
      { where: { id: employeeId } },
    )
    return res.json(returnFunction('1', 'Success', {}, ''))
  }
  await user.update(
    { status: req.body?.status || false },
    { where: { id: userId } },
  )
  employee.update(
    { status: req.body?.status || false },
    { where: { userId: userId } },
  )

  blockEmployees(req.body?.status || false, worker)
  return res.json(returnFunction('1', 'Success', {}, ''))
}

//*8. Delete Employee

exports.deleteEmployee = async (req, res, next) => {
  const userId = req.params.employee
  const shop = await callerShop(req)
  if (!shop) return next(new appError('Data not found', 404))
  const worker = await workerAtShop(userId, shop.id)
  if (!worker) return next(new appError('Data not found', 404))
  if (worker?.dataValues?.isOwner) {
    return next(new appError('The shop owner cannot be deleted.', 200))
  }
  // return res.json({ work, employeeId })

  if (worker?.isExternalEmployee) {
    // A chair renter pays for their own plan: removing them from the team
    // keeps their account, clients and bookings (they become "between shops").
    await renterMove.removeFromShop({ hostSalonId: shop.id, renterUserId: Number(userId), createdBy: req.user.id })
    return res.json(returnFunction('1', 'Chair renter removed from your shop.', {}, ''))
  }

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
  user.update({ deleted: true }, { where: { id: userId } })
  employee.update({ deleted: true }, { where: { userId: userId } })
  deviceToken.destroy({ where: { userId } })
  return res.json(returnFunction('1', 'Success', {}, ''))
}

exports.addExternalEmployeeDefaultService = async (req, res, next) => {
  const { salon } = req.params
  const { serviceList } = req.body

  const uniqueCategoryIds = [
    ...new Set(serviceList.map((service) => service.categoryId)),
  ]

  const categoiesData = await category.findAll({
    where: { id: uniqueCategoryIds },
    attributes: [`id`, `categoryName`, `color`, `description`],
  })

  const newCategoriesInput = JSON.parse(JSON.stringify(categoiesData))

  newCategoriesInput.forEach((el) => {
    el.salonDetailId = salon
    delete el.id
  })

  const newCategories = await category.bulkCreate(newCategoriesInput)

  const newServicesInput = updateServiceCategoryIds({
    newCategories,
    oldCategories: categoiesData,
    serviceList,
    salonDetailId: salon,
  })

  const newServices = await service.bulkCreate(newServicesInput)

  const selfEmployee = await employee.findOne({
    where: { salonDetailId: salon, isOwner: true },
  })

  const employeeServicesList = newServices.map((el) => {
    return {
      serviceId: el.id,
      employeeId: selfEmployee.id,
      salonDetailId: salon,
      status: true,
    }
  })

  await employeeService.bulkCreate(employeeServicesList)

  return res.json(returnFunction('1', 'Success', {}, ''))
}
