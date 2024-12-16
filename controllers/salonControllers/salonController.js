const { Op, literal, col, fn, where } = require('sequelize')
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
  cancelledSubscriptions,
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
  } = req.body
  const addressData = await addressDBS.create(addressDetail)
  const newEntry = await salonDetail.create({
    salonName,
    description,
    teamSize,
    addressDBId: addressData.id,
    userId,
    onlinePayments,
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
  await cancellationPolicy.create({
    hoursBeforeBooking: 12,
    refundPercentage: 0,
    salonDetailId: newEntry.id,
  })

  // await paymentPolicy.create({
  //   salonDetailId: newEntry.id,
  // });

  await paymentPolicy.create({
    salonDetailId: newEntry.id,
  })

  await reschedulePolicy.create({
    salonDetailId: newEntry.id,
  })

  await noShowPolicy.create({
    salonDetailId: newEntry.id,
  })
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
  ;(salonData.approvedByAdmin = true),
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

  await wallet.upsert({
    salonDetailId: salonData.id,
  })
  const onboardingLink = await Stripe.createStripeAccountLink(account)

  return res.json(
    returnFunction('1', 'Onboarding Link', { onboardingLink }, ''),
  )
}
/*
            3.Choose SubsCription Plan 
    ________________________________________
*/
exports.accountAdded = async (req, res, next) => {
  const userId = req.user.id

  let salonData = await salonDetail.findOne({
    where: { userId },
    include: [{ model: user, attributes: ['stripeCustomerId', 'email'] }],
  })

  let salonWallet = await wallet.findOne({
    where: {
      salonDetailId: salonData.id,
    },
  })

  salonWallet.accountConnected = true
  await salonWallet.save()

  return res.json(
    returnFunction('1', 'Account Connected Successfully!', {}, ''),
  )
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
      status: dat.status,
      workingTime,
    })

    // Adding timing for employeeId if available
    if (selfEmployee) {
      salonTimes.push({
        openingTime,
        closingTime,
        day: dat.day,
        employeeId: selfEmployee.id,
        status: dat.status,
        workingTime,
      })
    }
  })

  // Bulk create all the times
  await time.bulkCreate(salonTimes)

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
  const serviceTypes = await serviceType.findAll({ where: { deleted: false } })
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
  const { salonName, description } = req.body
  const salonData = await salonDetail.findOne({
    where: {
      userId,
    },
  })
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
  return res.json(returnFunction('1', 'Salon Profile', { salonData }, ''))
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
  const salon = await salonDetail.findOne({ where: { userId: req.user.id } })
  const Input = categories.filter((cat) => cat.isSelected === true)
  const finalInput = Input.map((cat) => ({ ...cat, salonDetailId: salon.id }))
  const categoriesData = await category.bulkCreate(finalInput)
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
  const exist = await coupon.findOne({ where: { promoCode: input.promoCode } })
  if (exist) {
    return res
      .status(200)
      .json(returnFunction('0', 'Promo code already taken.', {}, ''))
  }
  if (!salon) {
    return res.status(200).json(returnFunction('0', 'Data Not found.', {}, ''))
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
    if (salonData.metadata) customerSubscription.metaData = salonData.metadata
  } else {
    return res.json(returnFunction('2', 'No Subcription Plan', {}, ''))
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
  const { time } = req.body

  // Calculate the date one week ago
  const timeAgo = new Date()
  timeAgo.setDate(timeAgo.getDate() - time)

  const salonHistory = await booking.findAll({
    where: {
      createdAt: {
        [Op.gte]: timeAgo,
      },
      status: {
        [Op.in]: ['complete', 'cancel', 'no-show', 'save-unpaid'],
      },
    },
    include: [
      {
        model: salonDetail,
        where: {
          userId,
        },
        attributes: [],
      },
    ],
    attributes: ['id', 'createdAt', 'total', 'status', 'on'],
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
          { model: service, attributes: ['serviceName', 'price'] },
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
  let bookingDetail = {
    id: bookingData.id,
    status: bookingData.status,
    actualCapturedAmount: bookingData.actualCapturedAmount,
    noshowCharges: bookingData.noshowCharges,
    cancellationCharges: bookingData.cancellationCharges,
    refundAmount: bookingData.refundAmount,
    penaltyAmount: bookingData.penaltyAmount,
    scheduleDate: bookingData.on,
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
    customerId: bookingData.customerId,
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
  })

  const salonWallet = await wallet.findOne({
    where: {
      salonDetailId: salonData.id,
    },
  })

  return res.json(returnFunction('1', 'Salon Wallet', { salonWallet }, ''))
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

exports.addServices = async (req, res, next) => {
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
    return next(new appError('Service With Same Name already Exist.', 200))
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

  const notifications = await pushNotification.findAll({
    where: { userId: id },
    attributes: [`id`, `at`, `to`, `title`, `body`, `data`, 'type'],
  })

  const groupedNotifications = notifications.reduce(
    (accumulator, notification) => {
      const { type } = notification

      if (type === 'appointment') {
        accumulator.appointmentNotifications.push(notification)
      } else if (type === 'review') {
        accumulator.reviewNotifications.push(notification)
      }

      return accumulator
    },
    { appointmentNotifications: [], reviewNotifications: [] }, // Initial accumulator
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

  const price = await Stripe.getPriceById('price_1QMk38IUi1Nn55FG2GP2Oxoq')
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
  output.freeTrialDays = 1
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
