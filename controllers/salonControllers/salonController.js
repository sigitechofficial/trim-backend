const { Op, literal, col, fn, where } = require('sequelize')
const { CURRENCY_UNIT } = process.env
const fs = require('fs').promises
const {
  salonDetail,
  user,
  addressDBS,
  serviceImage,
  employee,
  time,
  category,
  service,
  salonImage,
  serviceType,
  socialLink,
  employeeWagesMethod,
  wagesMethod,
  rating,
  coupon,
  cancellationPolicy,
  // paymentPolicy,
  noShowPolicy,
  jobs,
  booking,
  wallet,
  reschedulePolicy,
  paymentPolicy,
  defaultCategory,
  salonTimeHistory,
  employeeService,
  blockCustomer,
  pushNotification,
  announcement,
  deviceToken,
  cancelledSubscriptions,
  salonProfiles,
  allergies,
  clientNotes,
  deletedCustomer,
} = require('../../models')
const appError = require('../../utils/appError')
const factory = require('../handlerFactory')
const Convert = require('../../utils/dateManipulation')
const Stripe = require('../stripe')
const dateManipulation = require('../../utils/dateManipulation')
const CustomDate = require('../../utils/currentDay')
const { sendEvent } = require('../../socket_io')
const { employeeForSocket } = require('../../utils/socketUtilities')
const { response } = require('../../utils/response')
const ThrowNotification = require('../../utils/throwNotification')
const ThrowSalonPermotionalNotification = require('../../utils/throwNotificationBySalon')
const { deleteEmployeesAll } = require('../../utils/deleteEmployeesMultiple')

const {
  processAllAppointments,
  processAppointment,
} = require('../../utils/cancelMultipleBookings')

function formatDateTime(date) {
  // Format the date portion as 'YYYY-MM-DD'
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const formattedDate = `${year}-${month}-${day}`

  // Format the time portion as 'HH:mm:ss'
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const formattedTime = `${hours}:${minutes}:${seconds}`

  return { date: formattedDate, time: formattedTime }
}
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
            1. Registeration(Salon data)
    ________________________________________
*/
exports.addSalonDetail = async (req, res, next) => {
  const {
    salonName,
    onlinePayments,
    description,
    teamSize,
    userId,
    addressDetail,
    businessEmail,
    businessCountryCode,
    businessPhoneNum,
  } = req.body
  const salon = await salonDetail.findOne({ where: { userId } })
  if (salon) {
    console.log('---------------------> 2nd Attempt')
    return res.json(
      returnFunction('1', 'Salon Details Successfully Added!', salon, ''),
    )
  }
  const exist = await salonDetail.findOne({
    where: {
      [Op.or]: [{ businessEmail }, { businessCountryCode, businessPhoneNum }],
    },
  })
  if (exist) {
    let message = `It appears this phone number is already associated with an account. Please use a different number.`
    if (businessEmail == exist?.businessEmail) {
      message = `It appears that the business email is already associated with another salon. Please use a different email to continue.`
    }
    throw new appError(message, 200)
  }
  const addressData = await addressDBS.create(addressDetail)
  const newEntry = await salonDetail.create({
    salonName,
    description,
    teamSize,
    addressDBId: addressData.id,
    userId,
    onlinePayments,
    businessEmail,
    businessCountryCode,
    businessPhoneNum,
  })

  await employee.create({
    position: 'Salon Owner',
    userId,
    salonDetailId: newEntry.id,
    isOwner: true,
  })
  // const durations = [24, 48, 72] // Durations in hours
  // const cancelationPolicies = durations.map((duration) => {
  //   return {
  //     hoursBeforeBooking: duration,
  //     refundPercentage: 10,
  //     salonDetailId: newEntry.id,
  //   }
  // })
  cancellationPolicy.create({
    hoursBeforeBooking: 12,
    refundPercentage: 0,
    salonDetailId: newEntry.id,
  })

  //  paymentPolicy.create({
  //   salonDetailId: newEntry.id,
  // });

  paymentPolicy.create({
    salonDetailId: newEntry.id,
  })

  reschedulePolicy.create({
    salonDetailId: newEntry.id,
  })

  noShowPolicy.create({
    salonDetailId: newEntry.id,
  })
  await salonProfiles.update(
    {
      hasTeamMembers: true,
      hasBusinessDetails: true,
      hasBusinessAddress: true,
      salonDetailId: newEntry.id,
    },
    { where: { userId } },
  )
  return res.json(
    returnFunction('1', 'Salon Details Added Successfully!', newEntry, ''),
  )
}
/*
    Get All Subscription Plans
    __________________________
*/
exports.SubscriptionPlans = async (req, res, next) => {
  const listOfPlans = await Stripe.AllProducts(3)

  return res.json(
    returnFunction('1', 'All Subscription Plan', { listOfPlans }, ''),
  )
}
/*
    Add Card
    __________________________
*/
exports.addCard = async (req, res, next) => {
  const { userId, cardName, cardExpYear, cardExpMonth, cardNumber, cardCVC } =
    req.body
  let customerId = await user.findByPk(userId, {
    attributes: ['stripeCustomerId'],
  })
  customerId = customerId.stripeCustomerId
  const data = {
    customerId,
    userId,
    cardName,
    cardExpYear,
    cardExpMonth,
    cardNumber,
    cardCVC,
  }
  const payment_method = await Stripe.addCard(data)
  return res.json(returnFunction('1', 'Card Added Successfully!', {}, ''))
}
/*
            3.Choose SubsCription Plan 
    ________________________________________
*/
exports.choosePlan = async (req, res, next) => {
  const userId = req.user.id
  const { subscriptionId } = req.body
  let salonData = await salonDetail.findOne({
    where: { userId },
    include: [{ model: user, attributes: ['stripeCustomerId', 'email'] }],
  })
  const subscription = await Stripe.subscriptionsRetrieve(subscriptionId)
  let connectAccount
  if (!salonData.connectAccountId) {
    connectAccount = await Stripe.createConnectAccount(salonData.user.email)
    salonData.connectAccountId = connectAccount?.accountId
    await salonData.save()
  }
  const DT = new Date()
    ; (salonData.approvedByAdmin = true),
      (salonData.registrationDate = dateManipulation.stampToDate(
        subscription.current_period_start,
      )),
      (salonData.registrationExpiryDate = dateManipulation.stampToDate(
        subscription.current_period_end,
      ))
  salonData.subscriptionPlan = subscription.id
  await salonData.save()
  const check = await wallet.findOne({
    where: {
      salonDetailId: salonData.id,
    },
  })
  if (!check) {
    await wallet.create({
      salonDetailId: salonData.id,
    })
  }

  await salonProfiles.update(
    {
      hasSubscription: true,
    },
    { where: { salonDetailId: salonData.id } },
  )
  // const output = JSON.parse(JSON.stringify(salonData))
  // subscription.current_period_end

  return res.json(
    returnFunction(
      '1',
      'All Subscription Plans',
      { salonData, onboardingLink: connectAccount?.accountLink?.url },
      '',
    ),
  )
}
/*
            3.Choose SubsCription Plan 
    ________________________________________
*/
exports.createOnboardingLink = async (req, res, next) => {
  const userId = req.user.id
  let salonData = await salonDetail.findOne({
    where: { userId },
    include: [{ model: user, attributes: ['stripeCustomerId', 'email'] }],
  })
  let account = salonData.connectAccountId
  if (!salonData.connectAccountId) {
    connectAccount = await Stripe.createConnectAccount(salonData.user.email)
    salonData.connectAccountId = connectAccount.accountId
    await salonData.save()
    account = connectAccount
  }
  //! Cusing mutiple wallets of sigle employee
  // await wallet.upsert({
  //   salonDetailId: salonData.id,
  // })

  const onboardingLink = await Stripe.createStripeAccountLink(account)

  return res.json(
    returnFunction('1', ' Stripe Onboarding Link', { onboardingLink }, ''),
  )
}
/*
            3.Choose SubsCription Plan 
    ________________________________________
*/
exports.accountAdded = async (req, res, next) => {
  const userId = req.user.id

  let salonData = await salonDetail.findOne({
    where: { userId: userId },
    atrributes: ['connectAccountId', 'id'],
  })

  let msg = 'Information Incomplete account not added.'
  let status = '2'
  const isConnectAccountComplete = salonData?.connectAccountId
    ? await Stripe.isConnectAccountComplete(salonData?.connectAccountId)
    : false

  console.log(
    '🚀 ~ exports.accountAdded= ~ isConnectAccountComplete:',
    isConnectAccountComplete,
  )

  if (isConnectAccountComplete) {
    await wallet.update(
      { accountConnected: true },
      { where: { salonDetailId: salonData.id } },
    )

    await salonProfiles.update(
      {
        accountConnected: true,
      },
      { where: { userId } },
    )
    msg = `Account Connected Successfully!`
    status = '1'
  }

  if (req.body?.fromNext) status = '1'
  console.log(
    '🚀 ~ exports.accountAdded= ~ req.body.fromNext:',
    req.body?.fromNext,
  )

  return res.json(returnFunction(status, msg, {}, ''))
}
/*
            4.Salon Timing 
    ________________________________________
*/
exports.salonTiming = async (req, res, next) => {
  const { salonDetailId, timeData } = req.body

  // Find the employee related to the salon
  const selfEmployee = await employee.findOne({
    where: { userId: req.user?.id },
    attributes: ['id'],
  })

  // Create an array to hold the time objects
  let salonTimes = []

  // Single loop for both salonDetailId and employeeId timings
  timeData.forEach((dat) => {
    // Creating the common data attributes for the times
    const openingTime =
      dat.openingTime && dat.status
        ? Convert.convertTo24HourFormat(dat.openingTime)
        : !dat.status
          ? null
          : '00:00:01'

    const closingTime =
      dat.closingTime && dat.status
        ? Convert.convertTo24HourFormat(dat.closingTime)
        : !dat.status
          ? null
          : '24:00:00'

    const workingTime = dateManipulation.calculateMinutes(
      openingTime,
      closingTime,
      dat.status,
    )

    // Adding timing for salonDetailId
    salonTimes.push({
      openingTime,
      closingTime,
      day: dat.day,
      salonDetailId: salonDetailId,
      employeeId: selfEmployee?.id,
      status: dat.status,
      workingTime,
    })
  })

  // Bulk create all the times
  await time.bulkCreate(salonTimes)
  await salonProfiles.update(
    {
      hasWorkingHours: true,
    },
    { where: { salonDetailId } },
  )

  // Respond with a success message
  return res.json(
    returnFunction('1', 'Salon Timing Added Successfully!', {}, ''),
  )
}
/*
            4.Get Salon Timing 
    ________________________________________
*/

exports.getSalonTiming = async (req, res, next) => {
  const userId = req.user.id

  const salonTiming = await time.findAll({
    include: {
      model: salonDetail,
      where: {
        userId,
      },
      attributes: [],
    },
    attributes: {
      exclude: ['createdAt', 'updatedAt', 'salonDetailId', 'employeeId'],
    },
  })
  // Convert opening and closing times to 12-hour format
  salonTiming.forEach((timeSlot) => {
    timeSlot.openingTime = timeSlot.openingTime
      ? Convert.convertTo12HourFormat(timeSlot.openingTime)
      : ''
    timeSlot.closingTime = timeSlot.closingTime
      ? Convert.convertTo12HourFormat(timeSlot.closingTime)
      : ''
  })

  return res.json(returnFunction('1', 'Salon Timings', { salonTiming }, ''))
}
/*
            4.Serviece Images 
    ________________________________________
*/
exports.addImages = async (req, res, next) => {
  const { serviceId } = req.body
  if (!req.files.length) {
    return next(new appError('Images not uploaded, Please upload images', 200))
  }

  let imagesArr = req.files.map((ele) => {
    let tmpPath = ele.path
    let imagePath = tmpPath.replace(/\\/g, '/')
    let tmpObj = {
      imageUrl: imagePath,
      serviceId,
    }
    return tmpObj
  })

  const serviceImages = await serviceImage.bulkCreate(imagesArr)
  return res.json(
    returnFunction('1', 'Service Images Added Succesfully!', {}, ''),
  )
}
/*
            4.Serviece Images 
    ________________________________________
*/
exports.Types = async (req, res, next) => {
  const { salonDetailId } = req.body
  const serviceTypes = await serviceType.findAll({
    where: { deleted: 0, status: true },
  })
  const categories = await category.findAll({
    where: {
      salonDetailId,
    },
  })
  return res.json(
    returnFunction(
      '1',
      'Service & Category Types',
      { serviceTypes, categories },
      '',
    ),
  )
}
/*
            4.Add Social Links 
    ________________________________________
*/
exports.addSocialLinks = async (req, res, next) => {
  const { links } = req.body
  const addLinks = await socialLink.bulkCreate(links)
  return res.json(
    returnFunction('1', 'Social Links Added Successfully!', {}, ''),
  )
}
//* UPDATE SocialLinks
exports.updateSocialLinks = async (req, res, next) => {
  const { links } = req.body
  const salon = await salonDetail.findOne({ where: { userId: req.user.id } })
  const finalInput = links.map((ele) => ({ ...ele, salonDetailId: salon.id }))
  socialLink.destroy({ where: { salonDetailId: salon.id } })
  await socialLink.bulkCreate(finalInput)
  return res.json(
    returnFunction('1', 'Social Links Added Successfully!', {}, ''),
  )
}

/*
            4.Get All Services
    ________________________________________
*/
exports.getAllServices = async (req, res, next) => {
  const { salonDetailId } = req.body
  const formattedServices = await category.findAll({
    where: {
      salonDetailId,
    },
    include: {
      model: service,
      include: {
        model: category,
        attributes: ['categoryName', 'color'],
      },
      attributes: {
        exclude: ['createdAt', 'updatedAt'],
      },
    },
    attributes: {
      exclude: ['description', 'createdAt', 'updatedAt'],
    },
  })
  const allServices = formattedServices.map((category) => {
    const services = category.services.map((service) => {
      const {
        category: { categoryName, color },
        ...rest
      } = service.toJSON()
      return {
        ...rest,
        categoryName,
        color,
      }
    })

    return {
      ...category.toJSON(),
      services,
    }
  })
  return res.json(
    returnFunction('1', 'All Salon Services', { allServices }, ''),
  )
}
/*
            1. Registeration(Salon data)
    ________________________________________
*/
exports.updateSalonDetail = async (req, res, next) => {
  const userId = req.user.id
  const {
    salonName,
    description,
    businessEmail,
    businessCountryCode,
    businessPhoneNum,
  } = req.body
  const salonData = await salonDetail.findOne({
    where: {
      userId,
    },
  })

  const exist = await salonDetail.findOne({
    where: {
      [Op.or]: [{ businessEmail }, { businessCountryCode, businessPhoneNum }],
      userId: { [Op.ne]: userId },
    },
  })
  if (exist) {
    let message = `It appears this phone number is already associated with an account. Please use a different number.`
    if (businessEmail == exist?.businessEmail) {
      message = `It appears that the business email is already associated with another salon. Please use a different email to continue.`
    }
    throw new appError(message, 200)
  }
  if (req.file) {
    let tmpprofileImage = req.file.path
    let profileImageName = tmpprofileImage.replace(/\\/g, '/')
    fs.unlink(salonData.cover, async (err) => {
      if (err) {
        console.error(`Error deleting file: ${err.message}`)
      } else {
        console.log('Picture Deleted Successfully!')
      }
    })
    await user.update(
      { cover: profileImageName },
      { where: { id: salonData.id } },
    )
  }
  await salonDetail.update(
    {
      salonName,
      description,
      businessEmail,
      businessCountryCode,
      businessPhoneNum,
    },
    {
      where: {
        userId,
      },
    },
  )

  return res.json(
    returnFunction('1', 'Salon Details Updated Successfully!', {}, ''),
  )
}
//! Salon profile Edit /Location, Services and social links
/*
            4.Salon Profile 
    ________________________________________
*/
exports.salonProfile = async (req, res, next) => {
  const userId = req.user.id

  const salonData = await salonDetail.findOne({
    where: {
      userId,
    },
    include: [
      {
        model: user,
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: socialLink,
        attributes: ['id', 'platform', 'url'],
      },
      // {
      //   model: rating,
      //   include: {
      //     model: user,
      //     attributes: ['id', 'firstName', 'lastName', 'image'],
      //   },
      //   attributes: ['id', 'value', 'comment', 'at', 'salonDetailId', 'userId'],
      // },
      {
        model: salonImage,
        attributes: ['id', 'imageUrl', 'salonDetailId'],
      },
      {
        model: category,
        required: false,
        include: {
          model: service,
          include: {
            model: category,
            attributes: ['categoryName', 'color'],
          },
          attributes: {
            exclude: ['createdAt', 'updatedAt'],
          },
        },
        attributes: {
          exclude: ['description', 'createdAt', 'updatedAt'],
        },
      },
      // {
      //   model: time,
      //   attributes: ['id', 'day', 'openingTime', 'closingTime', 'status'],
      // },
      {
        model: addressDBS,
      },
      // {
      //   model: employee,
      //   include: [
      //     {
      //       model: employeeWagesMethod,
      //       include: { model: wagesMethod, attributes: ['methodName'] },
      //       attributes: ['id', 'value', 'cycle', 'cycleValue'],
      //     },
      //     {
      //       model: user,
      //       attributes: ['id', 'firstName', 'lastName', 'image'],
      //     },
      //   ],
      //   attributes: [
      //     'id',
      //     'position',
      //     'description',
      //     'coverImage',
      //     'createdAt',
      //     'updatedAt',
      //     'userId',
      //     'salonDetailId',
      //   ],
      // },
    ],
    attributes: {
      exclude: ['subscriptionPlanId'],
    },
  })
  if (!salonData) {
    return next(new appError('Not a salon', 200))
  }
  // const avgRating = await rating.aggregate('value', 'avg', {
  //   where: { salonDetailId: salonData.id },
  // })
  // const actualRating = parseFloat(avgRating).toFixed(1)
  // const review = {
  //   avgRating: `${actualRating}`,
  //   total: salonData.ratings.length,
  // }
  // salonData.times.forEach((timeSlot) => {
  //   timeSlot.openingTime =
  //     timeSlot.openingTime == '00:00:01'
  //       ? ''
  //       : timeSlot.openingTime == null
  //         ? ''
  //         : Convert.convertTo12HourFormat(timeSlot.openingTime)
  //   timeSlot.closingTime =
  //     timeSlot.closingTime == '24:00:00'
  //       ? ''
  //       : timeSlot.closingTime == null
  //         ? ''
  //         : Convert.convertTo12HourFormat(timeSlot.closingTime)
  // })
  if (salonData?.connectAccountId) {
    let link = salonData?.connectAccountId
      ? await Stripe.createStripeLoginLink(salonData?.connectAccountId)
      : ''

    console.log("LINK ------------------------------------------------------...", link)

    if (!link) link = await Stripe.createStripeAccountLink(salonData?.connectAccountId)
    const output = JSON.parse(JSON.stringify(salonData))
    output.stripeDashboardlink = link
    return res.json(returnFunction('1', 'Salon Profile', { salonData }, ''))

  } else {
    const output = JSON.parse(JSON.stringify(salonData))
    return res.json(returnFunction('1', 'Salon Profile', { salonData }, ''))

  }

}
/*
            4.Salon Gallery Images 
    ________________________________________
*/
exports.addGalleryImages = async (req, res, next) => {
  const { salonDetailId } = req.body
  if (!req.files) {
    return next(new appError('Images not uploaded, Please upload images', 200))
  }
  // in files one Object in which two arrays(coverImage & portfolioImage)
  if (typeof req.files.coverImage !== 'undefined') {
    let tmpLicFrontImage = req.files.coverImage[0].path
    let coverImage = tmpLicFrontImage.replace(/\\/g, '/')
    await salonDetail.update({ coverImage }, { where: { id: salonDetailId } })
  }

  if (typeof req.files.portfolioImages !== 'undefined') {
    let imagesArr = req.files.portfolioImages.map((ele) => {
      let tmpPath = ele.path
      let imagePath = tmpPath.replace(/\\/g, '/')
      let tmpObj = {
        imageUrl: imagePath,
        salonDetailId,
      }
      return tmpObj
    })
    const Gallery = await salonImage.bulkCreate(imagesArr)
  }

  return res.json(
    returnFunction('1', 'Gallery Images Added Succesfully!', {}, ''),
  )
}
/*
            4.Salon Gallery Images 
    ________________________________________
*/
exports.getGalleryImages = async (req, res, next) => {
  const userId = req.user.id
  const salonData = await salonDetail.findOne({
    where: {
      userId,
    },
  })
  const galleryImages = await salonImage.findAll({
    where: {
      salonDetailId: salonData.id,
    },
  })
  return res.json(
    returnFunction('1', 'All Gallery Images !', { galleryImages }, ''),
  )
}
/*
            4.Update Salon Gallery Images 
    ________________________________________
*/
exports.deleteGalleryImages = async (req, res, next) => {
  const { ImageId } = req.body
  let SalonImage = await salonImage.findByPk(ImageId)
  fs.unlink(SalonImage.imageUrl, async (err) => {
    if (err) {
      console.error(`Error deleting file: ${err.message}`)
    } else {
      console.log('Picture Deleted Successfully!')
    }
  })
  await salonImage.destroy({
    where: {
      id: ImageId,
    },
  })
  return res.json(returnFunction('1', 'Picture Deleted Successfully!', {}, ''))
}
/*
              4.Update Salon Gallery Images 
    ________________________________________
*/
exports.updateGalleryImages = async (req, res, next) => {
  const { salonDetailId } = req.body
  if (req.files.length > 0) {
    let imagesArr = req.files.map((ele) => {
      let tmpPath = ele.path
      let imagePath = tmpPath.replace(/\\/g, '/')
      let tmpObj = {
        imageUrl: imagePath,
        salonDetailId,
      }
      return tmpObj
    })
    const Gallery = await salonImage.bulkCreate(imagesArr)
  }
  return res.json(
    returnFunction('1', 'Gallery Images Updated Succesfully!', {}, ''),
  )
}
/*
            4.Update Salon Timings
    ________________________________________
*/
exports.updateSalonTimings = async (req, res, next) => {
  const { salonDetailId, timeData } = req.body

  timeData.map(async (dat) => {
    let timeTable = await time.findOne({
      where: [{ salonDetailId }, { day: dat.day }],
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
      newTime.salonDetailId = salonDetailId
      await newTime.save()
    }
  })
  return res.json(
    returnFunction('1', 'Salon Timings Updated Successfully!', {}, ''),
  )
}
/*
            4.Update Salon Timings
    ________________________________________
*/
exports.updateSalonAddress = async (req, res, next) => {
  const { addressDBId } = req.body

  const addressExist = await addressDBS.findOne({
    where: { id: addressDBId },
  })
  if (!addressExist) throw new CustomException('user address not Exist!')
  const updatedData = await addressDBS.update(req.body, {
    where: { id: addressDBId },
  })
  // userAddress.update({default: true}, {where: {id: attchedAddressId}});
  return res.json(returnFunction('1', 'Address updated successfully', {}, ''))
}
/*
            5.Update Salon Service
    ________________________________________
*/
exports.updateService = async (req, res, next) => {
  const {
    serviceId,
    salonDetailId,
    serviceName,
    price,
    duration,
    description,
    categoryId,
    serviceTypeId,
    discount,
  } = req.body
  console.log('🚀 ~ exports.updateService= ~ req.body:', req.body)
  let Service = await service.findByPk(serviceId)
  if (!Service) {
    return res.json(returnFunction('1', 'No Service Found!', {}, ''))
  }
  Service.serviceName = serviceName ? serviceName : Service.serviceName
  Service.price = price ? price : Service.price
  Service.duration = duration ? duration : Service.duration
  Service.description = description ? description : Service.description
  Service.categoryId = categoryId ? categoryId : Service.categoryId
  Service.serviceTypeId = serviceTypeId ? serviceTypeId : Service.serviceTypeId
  Service.discount = discount ? discount : Service.discount
  await Service.save()

  return res.json(
    returnFunction('1', 'Salon Services Updated Successfully!', {}, ''),
  )
}
/*
            5.Get Salon Categories
    ________________________________________
*/
//Default by admin
exports.defaultCategories = async (req, res, next) => {
  const categories = await defaultCategory.findAll({
    attributes: [`categoryName`, `color`],
  })
  const data = JSON.parse(JSON.stringify(categories))
  const output = data.map((cat) => ({ ...cat, isSelected: false }))

  return res.json(
    returnFunction('1', 'Categories.', { categories: output }, ''),
  )
}
//* Add multiple categories
exports.addMultipleCategories = async (req, res, next) => {
  const { categories } = req.body
  const salon = await salonDetail.findOne({ where: { userId: req?.user?.id } })
  console.log('------------', req?.user)
  const Input = categories.filter((cat) => cat.isSelected === true)
  let finalInput = Input.map((cat) => ({ ...cat, salonDetailId: salon?.id }))

  console.log('------------', finalInput)
  const categoriesExist = await category.findAll({
    where: { salonDetailId: salon.id },
  })

  finalInput =
    categoriesExist.length > 0
      ? finalInput.filter(
        (salonItem) =>
          !categoriesExist.some(
            (existItem) =>
              existItem.categoryName.toLowerCase() ==
              salonItem.categoryName.toLowerCase(),
          ),
      )
      : finalInput

  if (finalInput.length > 0) await category.bulkCreate(finalInput)

  return res.json(
    returnFunction('1', 'Categories have been successfully added!', {}, ''),
  )
}

// Salon's
exports.getCategories = async (req, res, next) => {
  const userId = req.user.id
  const categories = await category.findAll({
    include: {
      model: salonDetail,
      where: {
        userId,
      },
      attributes: [],
    },
  })
  return res.json(
    returnFunction('1', 'All Categories of Salon', { categories }, ''),
  )
}
/*
            5.Update Salon Category
    ________________________________________
*/
exports.updateCategory = async (req, res, next) => {
  const { categoryName, color, id } = req.body
  await category.update(
    {
      categoryName,
      color,
    },
    {
      where: { id },
    },
  )

  return res.json(
    returnFunction('1', 'Salon Category Updated Successfully!', {}, ''),
  )
}

exports.changeCategoryStatus = async (req, res, next) => {
  const { status,salonDetailId } = req.body
  console.log(" req.body------------------->>>", req.body)
  const { id } = req.params
    const activeCategoryCount = await category.count({
    where: {
      salonDetailId,
      status: true,
    },
  })
  console.log("🚀 ~ exports.changeCategoryStatus= ~ salonIdFound:", activeCategoryCount)
  
  if (!status && activeCategoryCount <= 1) {
    throw new appError("Salon must have one Category Associated with it",200)
  }

  await category.update(
    { status },
    {
      where: { id },
    },
  )

  await service.update(
    { status },
    {
      where: { categoryId: id },
    },
  )

  return res.json(
    returnFunction('1', 'Salon category status updated successfully!', {}, ''),
  )
}
//! Coupon
/*
            6.Fetch Coupons
    ________________________________________
*/
exports.fecthCoupons = async (req, res, next) => {
  const salon = await salonDetail.findOne({ where: { userId: req.user.id } })
  if (!salon) {
    return res.status(200).json(returnFunction('0', 'Data Not found.', {}, ''))
  }
  const results = await coupon.findAll({
    where: { salonDetailId: salon.id },
    attributes: [
      `id`,
      `promoCode`,
      `type`,
      `status`,
      `limit`,
      `from`,
      `till`,
      'value',
      `createdAt`,
    ],
    order: [['id', 'DESC']],
  })

  return res
    .status(200)
    .json(returnFunction('1', 'All Coupons.', { coupons: results }, ''))
}
/*
            6.Add Coupons
    ________________________________________
*/
exports.addCoupons = async (req, res, next) => {
  const input = req.body
  const salon = await salonDetail.findOne({ where: { userId: req.user.id } })
  if (!salon) {
    return res.status(200).json(returnFunction('0', 'Data Not found.', {}, ''))
  }
  const exist = await coupon.findOne({ where: { promoCode: input.promoCode } })
  if (exist) {
    return res
      .status(200)
      .json(returnFunction('0', 'Promo code already taken.', {}, ''))
  }

  input.salonDetailId = salon.id
  await coupon.create(input)

  return res
    .status(200)
    .json(returnFunction('1', 'Coupon created Successfully!', {}, ''))
}
//! Subscription
/*
    Get Customer Subscription Plans
    __________________________
*/
exports.customerSubscription = async (req, res, next) => {
  const userId = req.user.id
  const salonData = await salonDetail.findOne({
    where: {
      userId,
    },
  })
  if (!salonData?.subscriptionPlan) {
    return res.json(returnFunction('2', 'No Subcription Plan', {}, ''))
  }
  const customerSubscription = await Stripe.getSubscription(
    salonData.subscriptionPlan,
  )

  if (customerSubscription) {
    customerSubscription.expire = salonData?.registrationExpiryDate
    customerSubscription.start = salonData?.registrationDate
    customerSubscription.price = salonData?.subscriptionPrice
    customerSubscription.subscriptionLatestPaymentStatus =
      salonData?.subscriptionLatestPaymentStatus
    if (salonData.metadata) {
      customerSubscription.metaData = JSON.parse(salonData.metadata)
    } else {
      customerSubscription.metaData = {
        freeTrialDays: '',
        members: '',
        membersCount: 1,
        paymentMethodId: '',
        sloanId: '',
        subscriptionName: '',
      }
    }
  } else {
    return res.json(returnFunction('2', 'No Subcription Plan', {}, ''))
  }

  const currentDate = new Date()
  const expiryDate = new Date(salonData.registrationExpiryDate)

  if (customerSubscription.status == 'canceled' && expiryDate < currentDate) {
    return res.json(
      returnFunction('2', 'Subscription Expired', { customerSubscription }, ''),
    )
  }

  return res.json(
    returnFunction('1', 'All Subscription Plan', { customerSubscription }, ''),
  )
}
/*
    Cancel Customer Subscription Plans
    __________________________
*/
exports.cancelActiveSubscription = async (req, res, next) => {
  const { reason } = req.body
  const userId = req.user.id
  let salonData = await salonDetail.findOne({
    where: {
      userId,
    },
  })
  const cancelSubscription = await Stripe.cancelSubscription(
    salonData.subscriptionPlan,
  )
  //   {
  //     "members": "limited",
  //     "priceId": "price_1QMk38IUi1Nn55FG2GP2Oxoq",
  //     "sloanId": 964,
  //     "membersCount": 1,
  //     "freeTrialDays": 1,
  //     "paymentMethodId": "pm_1QQNsiIUi1Nn55FGzuokYWFA",
  //     "subscriptionName": "Owner only"subscriptionPrice
  // }
  if (cancelSubscription) {
    const input = {
      subscriptionId: salonData?.subscriptionPlan,
      amount: salonData?.subscriptionPrice,
      metadata: salonData.metadata,
      reason: req?.body?.reasonText,
      reasonId: req.body?.reasonId,
    }
    // `subscriptionId`, `name`, `amountPaid`, `priceId`, `teamSize`, `reason`,
    await cancelledSubscriptions.create(input)
    // salonData.approvedByAdmin = false;
    // await salonData.save()
    // cancelledSubscriptions.salonData.subscriptionPlan = null
    // await salonData.save()
  }
  return res.json(returnFunction('1', 'Subscription has been canceled', {}, ''))
}
/*
    Add Another Card
    __________________________
*/
exports.addAnotherCard = async (req, res, next) => {
  const userId = req.user.id
  const { cardName, cardExpYear, cardExpMonth, cardNumber, cardCVC } = req.body
  let customerId = await user.findByPk(userId, {
    attributes: ['stripeCustomerId'],
  })
  customerId = customerId.stripeCustomerId
  const data = {
    customerId,
    userId,
    cardName,
    cardExpYear,
    cardExpMonth,
    cardNumber,
    cardCVC,
  }
  const payment_method = await Stripe.addCard(data)
  return res.json(
    returnFunction('1', 'Card Added Successfully!', { payment_method }, ''),
  )
}
/*
    Renew Customer Subscription Plans
    __________________________
*/
exports.updateSubscription = async (req, res, next) => {
  const userId = req.user.id
  console.log('🚀 ~ exports.updateSubscription= ~ id:', req.body)
  const {
    newPriceId,
    paymentMethodId,
    newMemberCount,
    subscriptionName,
    members,
    subscriptionPrice,
  } = req.body
  let salonData = await salonDetail.findOne({
    where: {
      userId,
    },
    include: {
      model: user,
      attributes: ['stripeCustomerId'],
    },
  })
  const customerId = salonData?.user?.stripeCustomerId
  const subscriptionId = salonData.subscriptionPlan
  const metadata = {
    members: members,
    subscriptionName: subscriptionName,
    sloanId: salonData.id,
    membersCount: newMemberCount,
    paymentMethodId: paymentMethodId,
    priceId: newPriceId,
  }
  //   {
  // subscriptionId:'subs_823940182euwjd0qsx'
  //   newPriceId: 'price_1QMk38IUi1Nn55FG2GP2Oxoq',
  //   members: 'limited',
  //   newMemberCount: 3,
  //   paymentMethodId: 'pm_1QOybVIUi1Nn55FGghbBphUh',
  //   teamSize: 1,
  //   subscriptionName: 'Owner + 3 members'
  // }
  const updateSubscription = await Stripe.subscriptionUpgradeDowngrade(
    subscriptionId,
    newPriceId,
    newMemberCount,
    metadata,
    paymentMethodId,
  )

  const registrationDate = new Date(
    updateSubscription?.current_period_start * 1000,
  )
  const registrationExpiryDate = new Date(
    updateSubscription?.current_period_end * 1000,
  )
  console.log(
    '🚀 ~ exports.updateSubscription= ~ dateManipulation.stampToDate(updateSubscription.current_period_start):',
    registrationDate,
  )
  console.log(
    '🚀 ~ exports.updateSubscription= ~ dateManipulation.stampToDate(updateSubscription.current_period_end):',
    registrationExpiryDate,
  )

  salonData.registrationDate = registrationDate
  salonData.registrationExpiryDate = registrationExpiryDate

  salonData.subscriptionPlan = updateSubscription?.id
  salonData.metadata = metadata
  salonData.teamSize = newMemberCount
  salonData.subscriptionPrice = subscriptionPrice
  const updatedData = await salonData.save()

  return res.json(
    returnFunction(
      '1',
      'Update Subscription Plan',
      { availableTill: updatedData.registrationExpiryDate },
      '',
    ),
  )
}
//! Wallet
/*
            6.Fetch Wallet
    ________________________________________
*/
exports.billingDetail = async (req, res, next) => {
  const salon = await salonDetail.findOne({ where: { userId: req.user.id } })
  if (!salon) {
    return res.status(200).json(returnFunction('0', 'Data Not found.', {}, ''))
  }
  const results = await Stripe.subscriptionInvoices(salon.subscriptionPlan)

  return res
    .status(200)
    .json(
      returnFunction(
        '1',
        'All Coupons.',
        { Invoices: results, teamSize: salon.teamSize },
        '',
      ),
    )
}

//! Cancelation Policy
/*
    Get Cancellation Policies
    __________________________
*/

exports.getCancellationPolicies = async (req, res) => {
  const userId = req.user.id
  // Find the salon by ID
  const salon = await salonDetail.findOne({
    where: {
      userId,
    },
  })

  if (!salon) {
    return res.status(200).json(returnFunction('0', 'Salon not found', {}, ''))
  }

  const condition = {
    salonDetailId: salon.id,
  }

  if (req.params.version) {
    condition.version = req.params.version
  } else {
    condition.status = true
  }
  console.log('🚀 ~ exports.getCancellationPolicies= ~ condition:', condition)
  // Find cancellation policies associated with the salon
  const cancellationPolicies = await cancellationPolicy.findAll({
    where: condition,
  })

  const distinctVersions = await cancellationPolicy.findAll({
    where: {
      salonDetailId: salon.id,
    },
    attributes: [[fn('DISTINCT', col('version')), 'version']],
    raw: true,
  })

  const previousVersions =
    distinctVersions.length > 0
      ? distinctVersions.map((row) => row.version)
      : []

  const version =
    cancellationPolicies[0]?.status == false
      ? `${req.params.version}`
      : 'latest'

  const depositPolicies = await paymentPolicy.findOne({
    where: {
      salonDetailId: salon.id, // Assuming there's a foreign key in the CancellationPolicy model named salonId
      status: true,
    },
    atrributes: ['percentage'],
  })

  return res.status(200).json(
    returnFunction(
      '1',
      'Salon cancellation Policy',
      {
        previousVersions,
        cancellationPolicies,
        version,
        depositPercentage: depositPolicies?.percentage,
      },
      '',
    ),
  )
}

/*
    Update Cancellation Policies
    __________________________
*/

exports.updateCancellationPolicies = async (req, res) => {
  const { cancelationPolicies } = req.body
  const salon = await salonDetail.findOne({
    where: {
      userId: req.user.id,
    },
    attributes: ['id'],
  })

  const exist = await cancellationPolicy.findOne({
    where: { salonDetailId: salon.id, status: true },
  })

  await cancellationPolicy.update(
    { status: false },
    { where: { salonDetailId: exist.salonDetailId, status: true } },
  )
  const version = exist ? +exist?.version + 1 : 1
  const input = cancelationPolicies.map((el) => {
    el.salonDetailId = exist.salonDetailId
    el.version = version
    0
    delete el.id
    return el
  })

  await cancellationPolicy.bulkCreate(input)

  return res
    .status(200)
    .json(
      returnFunction(
        '1',
        'New version of the cancellation policy is applied!',
        {},
        '',
      ),
    )
}

//! Deposit Policy
/*
    Get Deposit Policies
    __________________________
*/

exports.getDepositPolicies = async (req, res) => {
  const userId = req.user.id
  // Find the salon by ID
  const salon = await salonDetail.findOne({
    where: {
      userId,
    },
  })

  if (!salon) {
    return res.status(200).json(returnFunction('0', 'Salon not found', {}, ''))
  }

  // Find cancellation policies associated with the salon
  const depositPolicies = await paymentPolicy.findOne({
    where: {
      salonDetailId: salon.id, // Assuming there's a foreign key in the CancellationPolicy model named salonId
      status: true,
    },
  })

  return res
    .status(200)
    .json(returnFunction('1', 'Salon Deposit Policy', { depositPolicies }, ''))
}

/*
    Update Cancellation Policies
    __________________________
*/

exports.updateDepositPolicies = async (req, res) => {
  const { id, refundPercentage } = req.body

  const exist = await paymentPolicy.findByPk(id)
  exist.status = false
  await exist.save()
  const input = {
    percentage: refundPercentage,
    salonDetailId: exist.salonDetailId,
  }

  input.version = exist.version + 1
  await paymentPolicy.create(input)

  return res
    .status(200)
    .json(
      returnFunction(
        '1',
        'New version of the deposit policy is applied!',
        {},
        '',
      ),
    )
}

exports.depositPolicyHistory = async (req, res) => {
  const userId = req.user.id
  // Find the salon by ID
  const salon = await salonDetail.findOne({
    where: {
      userId,
    },
  })

  if (!salon) {
    return res.status(200).json(returnFunction('0', 'Salon not found', {}, ''))
  }

  // Find cancellation policies associated with the salon
  const paymentPolicyHistroy = await paymentPolicy.findAll({
    where: {
      salonDetailId: salon.id, // Assuming there's a foreign key in the CancellationPolicy model named salonId
    },
    order: [['version', 'DESC']],
  })

  return res
    .status(200)
    .json(
      returnFunction(
        '1',
        'Deposit policy history',
        { histroy: paymentPolicyHistroy },
        '',
      ),
    )
}

//! No Show Policy

/*
    Get Deposit Policies
    __________________________
*/

exports.getNoShowPolicies = async (req, res) => {
  const userId = req.user.id
  // Find the salon by ID
  const salon = await salonDetail.findOne({
    where: {
      userId,
    },
  })

  if (!salon) {
    return res.status(200).json(returnFunction('0', 'Salon not found', {}, ''))
  }

  // Find cancellation policies associated with the salon
  const noShowPolicies = await noShowPolicy.findOne({
    where: {
      salonDetailId: salon.id, // Assuming there's a foreign key in the CancellationPolicy model named salonId
      status: true,
    },
  })
  const depositPolicies = await paymentPolicy.findOne({
    where: {
      salonDetailId: salon.id, // Assuming there's a foreign key in the CancellationPolicy model named salonId
      status: true,
    },
    atrributes: ['percentage'],
  })

  return res
    .status(200)
    .json(
      returnFunction(
        '1',
        'Salon No Show Policy',
        { noShowPolicies, depositPercentage: depositPolicies?.percentage },
        '',
      ),
    )
}

exports.noShowPolicyHistory = async (req, res) => {
  const userId = req.user.id
  // Find the salon by ID
  const salon = await salonDetail.findOne({
    where: {
      userId,
    },
  })

  if (!salon) {
    return res.status(200).json(returnFunction('0', 'Salon not found', {}, ''))
  }

  // Find cancellation policies associated with the salon
  const nowshowHistroy = await noShowPolicy.findAll({
    where: {
      salonDetailId: salon.id, // Assuming there's a foreign key in the CancellationPolicy model named salonId
    },
    order: [['version', 'DESC']],
  })

  return res
    .status(200)
    .json(
      returnFunction(
        '1',
        'No-Show policy history',
        { histroy: nowshowHistroy },
        '',
      ),
    )
}
/*
    Update Cancellation Policies
    __________________________
*/

exports.updateNoShowPolicies = async (req, res) => {
  const { id, refundPercentage } = req.body

  const policy = await noShowPolicy.findByPk(id)
  policy.status = false
  await policy.save()
  const version = +policy.version + 1

  await noShowPolicy.create({
    refundPercentage,
    version,
    salonDetailId: policy.salonDetailId,
  })

  return res
    .status(200)
    .json(
      returnFunction(
        '1',
        'New version of the no-show policy is applied!',
        {},
        '',
      ),
    )
}

//! Reschedule Policy

/*
    Get Deposit Policies
    __________________________
*/
exports.getreschedulePolicy = async (req, res) => {
  const userId = req.user.id
  // Find the salon by ID
  const salon = await salonDetail.findOne({
    where: {
      userId,
    },
  })

  if (!salon) {
    return res.status(200).json(returnFunction('0', 'Salon not found', {}, ''))
  }

  // Find cancellation policies associated with the salon
  const reschedulePolicies = await reschedulePolicy.findOne({
    where: {
      salonDetailId: salon.id, // Assuming there's a foreign key in the CancellationPolicy model named salonId
      status: true,
    },
  })

  return res
    .status(200)
    .json(
      returnFunction(
        '1',
        'Salon Reschedule Policy',
        { reschedulePolicy: reschedulePolicies },
        '',
      ),
    )
}

//*  Reschedule - Policies
exports.reschedulePolicyHistory = async (req, res) => {
  const userId = req.user.id
  // Find the salon by ID
  const salon = await salonDetail.findOne({
    where: {
      userId,
    },
  })

  if (!salon) {
    return res.status(200).json(returnFunction('0', 'Salon not found', {}, ''))
  }

  // Find cancellation policies associated with the salon
  const reschedulePolicies = await reschedulePolicy.findAll({
    where: {
      salonDetailId: salon.id, // Assuming there's a foreign key in the CancellationPolicy model named salonId
    },
    order: [['version', 'DESC']],
  })

  return res
    .status(200)
    .json(
      returnFunction(
        '1',
        'Reschedule policy history',
        { histroy: reschedulePolicies },
        '',
      ),
    )
}

/*
    Update Cancellation Policies
    __________________________
*/
exports.updatereschedulePolicy = async (req, res) => {
  const { id, hoursBeforeBooking, count } = req.body
  const policy = await reschedulePolicy.findByPk(id)

  policy.status = false
  await policy.save()
  const version = +policy.version + 1

  await reschedulePolicy.create({
    hoursBeforeBooking,
    count,
    version,
    salonDetailId: policy.salonDetailId,
  })

  return res
    .status(200)
    .json(
      returnFunction(
        '1',
        'New version of the reschedule policy is applied!',
        {},
        '',
      ),
    )
}

// ! Booking History
/*
   Salon Booking History
    __________________________
*/
exports.salonHistory = async (req, res) => {
  const userId = req.user.id
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })
  const { startDate, endDate, filter } = req.body

  const condition = {
    salonDetailId: salon?.id,
    status: {
      [Op.in]: ['complete', 'cancel', 'no-show', 'save-unpaid'],
    },
  }

  if (filter == 'Last 24 hours') {
    // Calculate the timestamp for 24 hours ago
    const last24 = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const now = new Date()

    const { date: last24Date, time: last24Time } = formatDateTime(last24)
    const { date: nowDate, time: nowTime } = formatDateTime(now)

    // Create combined ISO‑formatted datetime strings
    const last24Combined = `${last24Date} ${last24Time}`
    const nowCombined = `${nowDate} ${nowTime}`

    // Add an AND condition: the concatenated "on" and "startTime" must be between last24Combined and nowCombined.
    condition[Op.and] = [
      // Lower bound: greater than or equal to last24Combined
      where(fn('CONCAT', col('on'), ' ', col('startTime')), {
        [Op.gte]: last24Combined,
      }),
      // Upper bound: less than or equal to nowCombined
      where(fn('CONCAT', col('on'), ' ', col('startTime')), {
        [Op.lte]: nowCombined,
      }),
    ]
  } else if (filter == 'Daily') {
    condition.on = startDate
  } else if (filter == 'Upcomming') {
    const now = new Date()
    const { date: nowDate, time: nowTime } = formatDateTime(now)
    condition.on = { [Op.gte]: nowDate }
  } else {
    condition.on = {
      [Op.between]: [startDate, endDate],
    }
  }

  const salonHistory = await booking.findAll({
    where: condition,
    attributes: ['id', 'createdAt', 'total', 'status', 'on', 'startTime'],
  })

  return res
    .status(200)
    .json(returnFunction('1', 'Salon Booking History', { salonHistory }, ''))
}

/*
              4.Booking Details
      ________________________________________
*/

exports.saleDetails = async (req, res, next) => {
  const { bookingId } = req.body
  let bookings = []

  let bookingData = await booking.findOne({
    where: { id: bookingId },
    include: [
      {
        model: user,
        attributes: [
          'id',
          'firstName',
          'lastName',
          'countryCode',
          'phoneNum',
          'image',
          'email',
        ],
      },
      {
        model: jobs,
        include: [
          {
            model: service,
            required: false,
            attributes: ['serviceName', 'price'],
          },
          {
            model: employee,
            required: false,
            attributes: [
              'id',
              'position',
              [
                literal(
                  `(SELECT FORMAT(AVG(ratings.value), 1) FROM ratings WHERE ratings.employeeId = jobs.employeeId)`,
                ),
                'employeeAverageRating',
              ],
              [
                literal(
                  `(SELECT COUNT(ratings.id) FROM ratings WHERE ratings.employeeId = jobs.employeeId)`,
                ),
                'totalRatings',
              ],
            ],
            include: [
              {
                model: user,
                attributes: ['id', 'firstName', 'lastName', 'image'],
              },
            ],
          },
        ],
      },
    ],
  })
  // return res.json(bookingData)

  const employeeMap = bookingData.jobs.reduce((acc, ele) => {
    const employeeId = ele.employee ? ele.employee.id : 'AnyOne'
    if (!acc[employeeId]) {
      acc[employeeId] = {
        employee: ele.employee,
        services: [],
      }
    }

    acc[employeeId].services.push({
      id: ele.id,
      status: ele.status,
      serviceName: ele.service.serviceName,
      price: ele.total,
      discount: ele.serviceDiscount,
      extraDiscount: ele.extraDiscount,
      startTime: dateManipulation.convertTo12HourFormat(ele.startTime),
      duration: ele.duration,
      endTime: dateManipulation.convertTo12HourFormat(ele.endTime),
      extra: ele.Extra,
    })

    return acc
  }, {})

  const promises = Object.values(employeeMap).map(async (employeeObj) => {
    return employeeObj
  })
  const finalPayment = parseFloat(
    (bookingData.subTotal - bookingData.initialPayment).toFixed(2),
  )
  const remainingAmount =
    bookingData.status === 'save-unpaid'
      ? parseFloat(
        (bookingData.subTotal - bookingData.actualCapturedAmount).toFixed(2),
      )
      : 0.0

  const employees = await Promise.all(promises)

  let cardLast4digits
  if (bookingData.stripeCardId) {
    const card = await Stripe.fetchSingleCard(bookingData.stripeCardId)
    cardLast4digits = card?.card?.last4
  }
  let bookingDetail = {
    id: bookingData.id,
    status: bookingData.status,
    actualCapturedAmount: bookingData.actualCapturedAmount,
    noshowCharges: bookingData.noshowCharges,
    cancellationCharges: bookingData.cancellationCharges,
    refundAmount: bookingData.refundAmount,
    penaltyAmount: bookingData.penaltyAmount,
    scheduleDate: bookingData.on,
    appointmentNote: bookingData?.note || '',
    client: `${bookingData?.user?.firstName || bookingData.clientFirstName} ${bookingData?.user?.lastName || bookingData.clientLastName}`,
    profile: bookingData?.user?.image,
    email: bookingData?.user?.email,
    Phone: `${bookingData?.user?.countryCode || bookingData.countryCode}${bookingData?.user?.phoneNum || bookingData.phoneNum}`,
    Upfront: bookingData.initialPayment,
    finalPayment: finalPayment,
    remainingAmount: remainingAmount,
    paymentBy: bookingData.paymentMethod,
    paymentStatus: bookingData.finalPayment,
    duration: bookingData.duration,
    initialPayment: bookingData.initialPayment,
    subTotal: bookingData.subTotal,
    total: bookingData.total,
    initialPaymentIntend: bookingData.initialPaymentIntend,
    finalPaymentIntend: bookingData.finalPaymentIntend,
    customerId: bookingData.customerId,
    cardLast4digits: cardLast4digits,
    employees,
  }
  return res.json(returnFunction('1', 'Booking Details', { bookingDetail }, ''))
}

/*
              4.Booking Details
      ________________________________________
  */
exports.salonWallet = async (req, res, next) => {
  const userId = req.user.id
  const salonData = await salonDetail.findOne({
    where: {
      userId,
    },
    attributes: ['id'],
  })

  const result = await wallet.findOne({
    where: {
      salonDetailId: salonData.id,
    },
    attributes: {
      exclude: ['salonDetailId', 'updatedAt', 'createdAt', 'employeeId'],
    },
  })

  let salonWallet = result ? JSON.parse(JSON.stringify(result)) : null

  if (salonWallet) {
    salonWallet.totalAmount =
      parseFloat(salonWallet.onlineAmount || 0) +
      parseFloat(salonWallet.cashAmount || 0) +
      parseFloat(salonWallet.tipAmount || 0) +
      parseFloat(salonWallet.accruedRent || 0)

    salonWallet.totalAmount =
      parseFloat(salonWallet.totalAmount) -
      parseFloat(salonWallet.totalPayout || 0)

    salonWallet.totalAmount =
      parseFloat(salonWallet.totalAmount) -
      parseFloat(salonWallet.tipPayout || 0)
  }

  return res.json(
    returnFunction(
      '1',
      'Salon Wallet',
      { currencyUnit: CURRENCY_UNIT, salonWallet, salonWallet },
      '',
    ),
  )
}

function getSalonTimesArray(salonTimes, salonId, startDate) {
  const resultArray = []
  const start = new Date(startDate)
  const end = new Date() // Current date

  // Helper function to get the day name from a date
  function getDayName(date) {
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }

  // Loop through each day from start to end date
  while (start <= end) {
    const dayName = getDayName(start)
    const dayInfo = salonTimes.find((time) => time.day === dayName) || {
      day: dayName,
      openingTime: null,
      closingTime: null,
      workingTime: 0,
      on: start.toISOString().split('T')[0],
      salonDetailId: salonId,
    }
    resultArray.push({
      on: start.toISOString().split('T')[0],
      salonDetailId: salonId,
      ...dayInfo,
    })
    start.setDate(start.getDate() + 1) // Move to the next day
  }
  return resultArray
}

exports.savingTimeHistory = async (req, res, next) => {
  const userId = req.user.id

  const salon = await salonDetail.findOne({
    where: { userId },
    attributes: [
      'id',
      [
        literal(
          '(SELECT `on` FROM salonTimeHistories WHERE salonTimeHistories.salonDetailId = salonDetail.id ORDER BY createdAt DESC LIMIT 1)',
        ),
        'lastOn',
      ],
    ],
    include: {
      model: time,
      where: { active: true },
      required: false,
      attributes: ['day', 'openingTime', 'closingTime', 'workingTime'],
    },
  })

  const date = CustomDate.currentDay()
  const input = JSON.parse(JSON.stringify(salon))

  // console.log('🚀 ~ exports.savingTimeHistory= ~ input:', input)
  if (date.currentDateOnly == input.lastOn) {
    return res.json(returnFunction('1', 'success', {}, ''))
  }

  const lastDate = input.lastOn || date.currentDateOnly
  const result = getSalonTimesArray(input.times, input.id, lastDate)

  salonTimeHistory.bulkCreate(result)

  return res.json(returnFunction('1', 'success', { result }, ''))
}

exports.addCategory = async (req, res, next) => {
  let { categoryName, salonDetailId } = req.body

  const exist = await category.findOne({
    where: {
      categoryName: categoryName,
      salonDetailId: salonDetailId,
    },
  })
  if (exist) {
    res
      .status(200)
      .json(
        returnFunction(
          '1',
          `The "${categoryName}" category already exists`,
          {},
          '',
        ),
      )
  }

  req.body.status = true
  await category.create(req.body)

  return res
    .status(200)
    .json(returnFunction('1', 'Category added successfully', {}, ''))
}

exports.addServices = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })
  let { serviceData, employees } = req.body
  const selfEmployee = await employee.findOne({
    where: { userId: req.user?.id },
    attributes: ['id'],
  })
  if (selfEmployee) employees.push({ employeeId: selfEmployee.id })
  employees = [
    ...new Map(employees.map((item) => [item.employeeId, item])).values(),
  ]

  const exist = await service.findOne({
    where: {
      serviceName: serviceData.serviceName,
      salonDetailId: serviceData.salonDetailId,
    },
  })
  if (exist) {
    return next(new appError('A service with this name already exists..', 200))
  }
  const newService = await service.create(serviceData)
  const input =
    employees &&
    employees.map((employee) => {
      employee.serviceId = newService.id
      employee.salonDetailId = serviceData.salonDetailId
      return employee
    })
  console.log('🚀 ~ exports.addServices= ~ input:', input)
  if (input.length > 0) await employeeService.bulkCreate(input)

  await salonProfiles.update(
    {
      hasServiceList: true,
    },
    { where: { salonDetailId: serviceData.salonDetailId } },
  )

  return res
    .status(200)
    .json(returnFunction('1', 'Service added successfully', {}, ''))
}

exports.activeBlockCustomer = async (req, res, next) => {
  const { userId, status } = req.body
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  if (status === 'block') {
    await blockCustomer.create({ userId, salonDetailId: salon.id })
  } else {
    await blockCustomer.destroy({ where: { salonDetailId: salon.id, userId } })
  }

  return res
    .status(200)
    .json(returnFunction('1', `Customer ${status} success`, {}, ''))
}

exports.salonOnlineOffline = async (req, res, next) => {
  const { isOnline } = req.body
  await salonDetail.update({ isOnline }, { where: { userId: req.user.id } })
  const status = isOnline ? 'Online' : 'Offline'

  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  const socketInput = {
    event: 'online-offline',
    data: { status: status },
    bookingId: null,
  }
  sendEvent(`${salon?.id}S`, socketInput)
  const workers = await employeeForSocket(salon?.id)
  workers.forEach((el) => sendEvent(`${el}E`, socketInput))
  return res.status(200).json(returnFunction('1', `${status}`, {}, ''))
}

exports.salonLiveStatus = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: [
      'isOnline',
      'coverImage',
      [
        literal(
          '(SELECT FORMAT(AVG(ratings.value), 1) FROM ratings WHERE ratings.salonDetailId = salonDetail.id)',
        ),
        'salonAverageRating',
      ],
      [
        literal(
          '(SELECT COUNT(ratings.id) FROM ratings WHERE ratings.salonDetailId = salonDetail.id)',
        ),
        'ratingCount',
      ],
      'liveStatusChangedAt',
      'salonName',
    ],
    include: { model: addressDBS },
  })
  const status = salon.isOnline ? 'Online' : 'Offline'
  return res
    .status(200)
    .json(returnFunction('1', `success`, { status, salon: salon }, ''))
}

exports.makeAnnouncement = async (req, res, next) => {
  const newEntry = await announcement.create(req.body)
  return res.status(200).json(returnFunction('1', `success`, {}, ''))
}

exports.updateAnnouncement = async (req, res, next) => {
  await announcement.update(req.body, { where: { id: req.params.id } })
  return res.status(200).json(returnFunction('1', `success`, {}, ''))
}

exports.fetchAnnouncements = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user.id },
    attributes: ['id'],
  })

  const currentDay = CustomDate.currentDay()
  await announcement.update(
    { status: false },
    {
      where: {
        [Op.and]: [
          { to: { [Op.lt]: currentDay.currentDateOnly } },
          { status: true },
        ],
      },
    },
  )

  const data = await announcement.findAll({
    where: { salonDetailId: salon.id, status: true },
    attributes: {
      exclude: ['updatedAt', 'salonDetailId'],
    },
  })

  return res
    .status(200)
    .json(returnFunction('1', `success`, { announcements: data }, ''))
}

exports.fetchNotifications = async (req, res, next) => {
  const id = req.user.id
  const salon = await user.findByPk(id, { attributes: ['verifiedAt'] })
  const notifications = await pushNotification.findAll({
    where: {
      [Op.or]: [
        { userId: id, createdAt: { [Op.gte]: salon?.verifiedAt } },
        {
          to: { [Op.or]: ['salon', 'all'] },
          createdAt: { [Op.gte]: salon?.verifiedAt },
        },
      ],
    },
    attributes: [
      `id`,
      `at`,
      `to`,
      `title`,
      `body`,
      `data`,
      'type',
      'repliedAt',
    ],
  })

  const groupedNotifications = notifications.reduce(
    (accumulator, notification) => {
      const { type, to } = notification

      if (type === 'appointment' && to === 'regular') {
        accumulator.appointmentNotifications.push(notification)
      } else if (type === 'rating') {
        accumulator.reviewNotifications.push(notification)
      } else {
        //All other notifications from admin side ... we can use thrid arry as well
        accumulator.otherNotifications.push(notification)
      }

      return accumulator
    },
    {
      appointmentNotifications: [],
      reviewNotifications: [],
      otherNotifications: [],
    }, // Initial accumulator
  )

  return res.json(
    response({
      message: 'Notifications.',
      data: { notifications: groupedNotifications },
    }),
  )
}

//! GET Subscription Price
exports.fetchSubscriptionPrice = async (req, res, next) => {
  const salon = await user.findOne({
    where: { id: req.user.id },
    attributes: [
      'id',
      'stripeCustomerId',
      'firstName',
      'lastName',
      'email',
      [
        literal(
          `(SELECT COUNT(employees.id) FROM employees 
            WHERE employees.salonDetailId = (
              SELECT id FROM salonDetails 
              WHERE salonDetails.userId = user.id 
              ORDER BY createdAt DESC 
              LIMIT 1
            ) 
            AND employees.status = true 
            AND employees.isOwner = false 
            AND employees.deleted = false)`,
        ),
        'teamSize',
      ],
    ],
  })
  if (!salon) throw new appError('resource not found', 200)

  console.log('ðŸš€ ~ exports.forSubcription= ~ salonsalonsalona:', salon)
  let stripeCustomer = salon?.stripeCustomerId
  if (!salon?.stripeCustomerId) {
    const stripeCustomerId = await Stripe.addCustomer(
      salon.fullName,
      salon.email,
    )
    stripeCustomer = stripeCustomerId
    await user.update({ stripeCustomerId }, { where: { id: salon.id } })
  }

  const price = await Stripe.getPriceById('price_1Qwj3FCmsFtCbz25grLeLSn0')
  const setupIntent = await Stripe.setupIntent(stripeCustomer)
  const ephemeralKey = await Stripe.createEphemeralKey(stripeCustomer)

  const { livemode, product, currency, billing_scheme, active, object } = price
  const output = { livemode, product, currency, billing_scheme, active, object }
  const limited = price.tiers[0]

  output.priceId = price.id
  output.unlimitedMembersAmount = price.tiers[1].flat_amount / 100
  output.ownerAmount = limited.flat_amount / 100
  output.memberAmount = limited.unit_amount / 100
  output.upTo = limited.up_to
  output.freeTrialDays = 30
  output.stripeCustomer = stripeCustomer
  output.clientSecret = setupIntent.client_secret
  output.teamSize = salon?.dataValues?.teamSize || 0
  output.ephemeralKeySecret = ephemeralKey.secret

  console.log(
    '🚀 ~ exports.fetchSubscriptionPrice= ~ setupIntent:',
    setupIntent,
  )

  return res.json(
    response({
      message: 'Subscription.',
      data: { price: output },
    }),
  )
}

exports.updateCoverImage = async (req, res, next) => {
  const image = await salonImage.findOne({
    where: { id: req.body.coverImageId },
  })

  await salonDetail.update(
    { coverImage: image.imageUrl },
    { where: { userId: req.user.id } },
  )
  return res.status(200).json(returnFunction('1', `success`, {}, ''))
}

exports.clientFeedBackSalon = async (req, res, next) => {
  let limit = 2
  const condition = { status: 'complete', rating: 'done' }
  if (req.query.limit) limit = req.query.limit * 1
  if (req.params.salon) {
    condition.salonDetailId = req.params.salon
  }

  const feedbacks = await booking.findAll({
    where: condition,
    attributes: [
      'id',
      'feedback',
      'createdAt',
      [
        literal(
          '(SELECT FORMAT(AVG(ratings.value), 1) FROM ratings WHERE ratings.bookingId = booking.id)',
        ),
        'averageRatingPerBooking',
      ],
    ],
    include: {
      model: user,
      attributes: ['firstName', 'lastName', 'image'],
    },
    order: [['id', 'DESC']],
  })

  const feedbackCount = await rating.count({
    distinct: true,
    col: 'bookingId',
    where: {
      salonDetailId: req.params?.salon,
    },
  })

  return res.json(
    response({
      message: 'Client Feedbacks.',
      data: { limit, feedbacks, feedbackCount },
    }),
  )
}

exports.reviewReply = async (req, res, next) => {
  const client = await booking.findOne({
    where: { id: req.body?.appointmentId },
    attributes: [
      'id',
      'customerId',
      'feedback',
      [
        literal(
          '(SELECT `salonName` FROM salonDetails WHERE salonDetails.id = booking.salonDetailId ORDER BY createdAt ASC LIMIT 1)',
        ),
        'salonName',
      ],
      [
        literal(
          '(SELECT `coverImage` FROM salonDetails WHERE salonDetails.id = booking.salonDetailId ORDER BY createdAt ASC LIMIT 1)',
        ),
        'image',
      ],
    ],
  })
  console.log('🚀 ~ exports.reviewReply= ~ client:', client)
  if (client) {
    await pushNotification.update(
      { feedback: req.body.reply },
      { where: { id: client?.id } },
    )
    await pushNotification.update(
      { repliedAt: new Date() },
      { where: { id: req.body?.reviewId } },
    )
  }
  const dvTokens = await deviceToken.findAll({
    where: { userId: client?.customerId },
  })

  if (dvTokens && dvTokens.length > 0) {
    const tokens = dvTokens?.map((ele) => {
      return ele?.tokenId
    })

    const customerNotification = {
      title: `Salon Reply`,
      body: `${req.body?.reply}. From  ${client?.dataValues?.salonName}`,
    }

    const data = {
      appointment: client?.id,
      name: `${client?.dataValues?.salonName}`,
      image: `${client?.dataValues?.image}`,
    }
    ThrowNotification(tokens, customerNotification, data, client?.customerId)
  }

  return res.status(200).json(returnFunction('1', `success`, {}, ''))
}

//* Salon custom notification

exports.customPermotionalNotificaiton = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req?.user?.id },
    attributes: ['id', 'coverImage', 'salonName'],
  })
  console.log(
    '🚀 ~ exports.customPermotionalNotificaiton= ~ req.body:',
    req.body,
  )
  const Notification = {
    title: `${req.body.title}`,
    body: `${req.body?.body}`,
  }

  const data = {
    name: `${salon?.salonName}`,
    image: `${salon?.coverImage}`,
  }
  let customerIds = []
  let clientList = []

  if (req.body?.clientType) {
    //TODO because Danish already uploaded app using (All clients .... ) wrong keys will change next monday
    let { clientType } = req.body
    if (clientType === 'All clients') req.body.clientType = 'all'
    else if (clientType === 'Recent clients') req.body.clientType = 'recent'
    else if (clientType === 'Frequent clients') req.body.clientType = 'frequent'
    else if (clientType === 'Custom clients') req.body.clientType = 'custom'
  }
  if (
    req.params?.audienceType == 'client' &&
    req.body?.clientType != 'custom' &&
    req.body.ids?.length < 1
  ) {
    let { ids, clientType } = req.body
    if (clientType == 'all') {
      clientList = await booking.findAll({
        where: { salonDetailId: salon.id, customerId: { [Op.ne]: null } },
        attributes: [[fn('DISTINCT', col('customerId')), 'customerId']],
      })
    } else if (clientType == 'recent') {
      const { today, last30Days } = dateManipulation.getDateRange()
      clientList = await booking.findAll({
        where: {
          salonDetailId: salon.id,
          customerId: { [Op.ne]: null },
          customerStatus: 'new',
          on: {
            [Op.between]: [last30Days, today],
          },
        },
        attributes: [[fn('DISTINCT', col('customerId')), 'customerId']],
      })
    } else if (clientType == 'frequent') {
      const { today, last30Days } = dateManipulation.getDateRange()
      clientList = await booking.findAll({
        where: {
          salonDetailId: salon.id,
          customerId: { [Op.ne]: null },
          on: {
            [Op.between]: [last30Days, today],
          },
        },
        attributes: [
          'customerId',
          [fn('COUNT', col('customerId')), 'bookingCount'],
        ],
        group: ['customerId'],
        having: where(fn('COUNT', col('customerId')), {
          [Op.gte]: 2, // At least 2 bookings
        }),
      })
    }

    customerIds =
      clientList && clientList.length > 0
        ? clientList?.map((ele) => {
          return ele?.customerId
        })
        : []
    req.body.ids = customerIds
    // return res.json(req.body.ids)
  }
  console.log(
    '🚀 ~ exports.customPermotionalNotificaiton= ~ req.body?.ids:',
    req.body?.ids,
  )
  if (req.params?.audienceType == 'staff' || req.body?.ids?.length > 0) {
    const userIds = [...new Set(req?.body?.ids || [])]
    if (userIds.length > 0) {
      const userTokens = await deviceToken.findAll({
        where: { userId: userIds },
      })
      console.log(
        '🚀 ~ exports.customPermotionalNotificaiton= ~ userIds:',
        userIds,
      )
      if (userTokens && userTokens.length > 0) {
        const tokens = userTokens?.map((ele) => {
          return ele?.tokenId
        })

        console.log(
          '🚀 ~ exports.customPermotionalNotificaiton= ~ tokens:',
          tokens,
        )

        const notificationInput =
          userIds.length > 0
            ? userIds.map((id) => ({
              userId: id,
              type: 'permotional',
              at: Date.now(),
              title: Notification.title,
              body: Notification.body,
            }))
            : []

        if (notificationInput.length > 0)
          pushNotification.bulkCreate(notificationInput)

        ThrowSalonPermotionalNotification(tokens, Notification, data)
      }
    }
  }
  // console.log('🚀 ~ exports.reviewReply= ~ client:', client)

  return res.status(200).json(returnFunction('1', `success`, {}, ''))
}

//* Add Client's allergies

exports.addAllergies = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user?.id },
    attributes: ['id', 'userId'],
  })
  if (!salon) {
    return next(new appError('Salon not found!', 200))
  }
  req.body.salonDetailId = salon?.id

  const newAllergy = await allergies.create(req.body)

  return res.json(returnFunction('1', 'success', { newAllergy }, ''))
}

//* Get Client's allergies

exports.fetchAllergies = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user?.id },
    attributes: ['id', 'userId'],
  })
  if (!salon) {
    return next(new appError('Salon not found!', 200))
  }

  const allergiesList = await allergies.findAll({
    where: { userId: req.params.id, salonDetailId: salon?.id },
    attributes: {
      exclude: ['updatedAt', 'salonDetailId', 'userId'],
    },
  })

  return res.json(returnFunction('1', 'success', { allergiesList }, ''))
}

//* Remove Client's allergies

exports.removeAllergies = async (req, res, next) => {
  const newAllergy = await allergies.destroy({
    where: { id: req.params?.id },
  })
  return res.json(returnFunction('1', 'success', { newAllergy }, ''))
}

//* Client Note

exports.addUpdateClientNote = async (req, res, next) => {
  const salon = await salonDetail.findOne({
    where: { userId: req.user?.id },
    attributes: ['id'],
  })
  const { customerNote } = req.body
  const hasNote = await clientNotes.findOne({
    where: { userId: req.params?.id, salonDetailId: salon.id },
  })
  if (hasNote) {
    await clientNotes.update(
      { customerNote: customerNote },
      { where: { userId: req.params?.id, salonDetailId: salon.id } },
    )
  } else {
    await clientNotes.create({
      customerNote: customerNote,
      userId: req.params?.id,
      salonDetailId: salon.id,
    })
  }

  const output = response({
    message: 'Success.',
    data: {},
  })
  return res.status(200).json(output)
}

//* Online Payments

exports.onlinePayments = async (req, res, next) => {
  const userId = req.user.id
  const { onlinePayments } = req.body
  const salonData = await salonDetail.findOne({
    where: {
      userId,
    },
    attributes: ['id', 'onlinePayments'],
  })
  salonData.onlinePayments = onlinePayments
  await salonData.save()
  return res.json(returnFunction('1', 'success', {}, ''))
}

// TO change PaymentMethods
exports.attachPaymentMethodsForSubscription = async (req, res, next) => {
  const salon = await user.findOne({
    where: { id: req.user.id },
    attributes: ['id', 'stripeCustomerId', 'firstName', 'lastName', 'email'],
    include: {
      model: salonDetail,
      attributes: ['subscriptionPlan'],
    },
  })
  if (!salon) throw new appError('resource not found', 200)

  console.log('ðŸš€ ~ exports.forSubcription= ~ salonsalonsalona:', salon)
  await Stripe.updateSubscriptionPaymentMethod(
    salon?.stripeCustomerId,
    req.body?.paymentMethodId,
    salon.salonDetails[0].subscriptionPlan,
  )

  return res.json(
    response({
      message: 'Subscription.',
      data: {},
    }),
  )
}

exports.changePaymentMethodsForSubscription = async (req, res, next) => {
  const salon = await user.findOne({
    where: { id: req.user.id },
    attributes: ['id', 'stripeCustomerId', 'firstName', 'lastName', 'email'],
  })
  if (!salon) throw new appError('resource not found', 200)

  console.log('ðŸš€ ~ exports.forSubcription= ~ salonsalonsalona:', salon)
  let stripeCustomer = salon?.stripeCustomerId
  if (!salon?.stripeCustomerId) {
    const stripeCustomerId = await Stripe.addCustomer(
      salon.fullName,
      salon.email,
    )
    stripeCustomer = stripeCustomerId
    await user.update({ stripeCustomerId }, { where: { id: salon.id } })
  }

  const setupIntent = await Stripe.setupIntent(stripeCustomer)
  const ephemeralKey = await Stripe.createEphemeralKey(stripeCustomer)

  const output = {}

  output.stripeCustomer = stripeCustomer
  output.clientSecret = setupIntent.client_secret
  output.ephemeralKeySecret = ephemeralKey.secret

  return res.json(
    response({
      message: 'Subscription.',
      data: { price: output },
    }),
  )
}

//!Account Delete
//* 1. SALON Account Delete
exports.accountDelete = async (req, res, next) => {
  const id = req.user.id

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

  if (!data || !salon) throw new appError('resource not found', 200)

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

  Stripe.deleteCustomer(data?.stripeCustomerId, 'salon')
  deviceToken.destroy({ where: { userId: id } })
  deleteEmployeesAll(salon?.id)
  return res.json(response({ message: 'Account Deleted.', data: { data } }))
}
