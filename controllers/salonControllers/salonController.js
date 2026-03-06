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
  subscriptions,
  couponTimeSlot,
  customerOnConnectAccount,
  cities,
  countries,
  zones
} = require('../../models')
const appError = require('../../utils/appError')
const factory = require('../handlerFactory')
const Convert = require('../../utils/dateManipulation')
const Stripe = require('../stripe')
const dateManipulation = require('../../utils/dateManipulation')
const CustomDate = require('../../utils/currentDay')
const { sendEvent } = require('../../socket_io')
const { employeeForSocket } = require('../../utils/socketUtilities')
const { sendCouponNotificationToCustomers } = require('../eventDrivenCommunication/couponNotification');
const { response } = require('../../utils/response')
const ThrowNotification = require('../../utils/throwNotification')
const ThrowSalonPermotionalNotification = require('../../utils/throwNotificationBySalon')
const { findZones } = require('../../utils/zoneFind');

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
    isVATRegistered,
    vatType,
  } = req.body;

  const salon = await salonDetail.findOne({ where: { userId } });
  if (salon) {
    console.log('---------------------> 2nd Attempt');
    return res.json(
      returnFunction('1', 'Salon details successfully added!', salon, ''),
    );
  }

  const exist = await salonDetail.findOne({
    where: {
      [Op.or]: [{ businessEmail }, { businessCountryCode, businessPhoneNum }],
    },
  });
  if (exist) {
    let message = `It appears this phone number is already associated with an account. Please use a different number.`;
    if (businessEmail == exist?.businessEmail) {
      message = `It appears that the business email is already associated with another salon. Please use a different email to continue.`;
    }
    throw new appError(message, 200);
  }

  // const zone = await findZones(addressDetail.lat, addressDetail.lng);
  // console.log("Zone:", zone);
  // let zoneId = zone[0].id

  const addressData = await addressDBS.create(addressDetail);
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
    isVATRegistered,
    vatType,
  });

  await employee.create({
    position: 'Owner',
    userId,
    salonDetailId: newEntry.id,
    isOwner: true,
  });

  // --------------- UPDATED CANCELLATION POLICY -----------------
  console.log("Create Cancellation Policy +++++++++++++++++++++++++");
  await cancellationPolicy.bulkCreate([
    {
      hoursBeforeBooking: "0-6",
      refundPercentage: 25,
      salonDetailId: newEntry.id,
    },
    {
      hoursBeforeBooking: "6-24",
      refundPercentage: 0,
      salonDetailId: newEntry.id,
    },
    {
      hoursBeforeBooking: "24-48",
      refundPercentage: 0,
      salonDetailId: newEntry.id,
    },
  ]);

  // Other policies remain the same
  paymentPolicy.create({
    salonDetailId: newEntry.id,
  });

  reschedulePolicy.create({
    salonDetailId: newEntry.id,
  });

  noShowPolicy.create({
    salonDetailId: newEntry.id,
  });

  await salonProfiles.update(
    {
      hasTeamMembers: true,
      hasBusinessDetails: true,
      hasBusinessAddress: true,
      salonDetailId: newEntry.id,
    },
    { where: { userId } },
  );

//   await addressDBS.update({ zoneId: zoneId }, { where: { id: addressData.id } })

  //await salonDetail.update({ zoneId: zoneId }, { where: { id: newEntry.id } })

  return res.json(
    returnFunction('1', 'Salon details added successfully!', newEntry, ''),
  );
};

/*
    Get All Subscription Plans
    __________________________
*/
exports.SubscriptionPlans = async (req, res, next) => {
  const listOfPlans = await Stripe.AllProducts(3)

  return res.json(
    returnFunction('1', 'All subscription plan', { listOfPlans }, ''),
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
  return res.json(returnFunction('1', 'Card added successfully!', {}, ''))
}
/*
            3.Choose SubsCription Plan 
    ________________________________________
*/
/*
  Unified Choose Plan API
  Supports both Stripe and Apple subscriptions
  Request body: {
    subscriptionId: string (required),
    subscriptionSource: 'stripe' | 'apple' (optional, defaults to 'stripe')
  }
*/
exports.choosePlan = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { subscriptionId, subscriptionSource = 'stripe' } = req.body

    console.log('\n🎯 Choose Plan API Called')
    console.log('  User ID:', userId)
    console.log('  Subscription ID:', subscriptionId)
    console.log('  Source:', subscriptionSource)

    // Validate input
    if (!subscriptionId) {
      return res.json(
        returnFunction('0', 'Subscription ID is required', {}, '')
      )
    }

    // Get salon data
    let salonData = await salonDetail.findOne({
      where: { userId },
      include: [{ model: user, attributes: ['stripeCustomerId', 'email'] }],
    })

    if (!salonData) {
      return res.json(
        returnFunction('0', 'Salon not found for this user', {}, '')
      )
    }

    let periodStart
    let periodEnd
    let subscriptionPlanId
    let connectAccount

    // ============================================
    // Handle based on subscription source
    // ============================================
    if (subscriptionSource === 'apple') {
      console.log('📱 Processing Apple subscription...')

      // Get Apple subscription from database
      // Search by multiple fields: subscriptionId, appleTransactionId, or appleOriginalTransactionId
      const appleSubscription = await subscriptions.findOne({
        where: {
          [Op.or]: [
            { subscriptionId: subscriptionId },
            { appleTransactionId: subscriptionId },
            { appleOriginalTransactionId: subscriptionId }
          ],
          customerId: userId.toString(),
          subscriptionSource: 'apple',
        },
      })

      if (!appleSubscription) {
        return res.json(
          returnFunction(
            '0',
            'Apple subscription not found. Please verify purchase first.',
            {},
            ''
          )
        )
      }

      console.log('  ✅ Apple subscription found')
      console.log('  Status:', appleSubscription.status)
      console.log('  Period End:', appleSubscription.periodEnd)
      console.log('  Product ID:', appleSubscription.appleProductId)

      // Use dates from Apple subscription (grace period already added during verification)
      periodStart = Math.floor(new Date(appleSubscription.periodStart).getTime() / 1000)
      periodEnd = Math.floor(new Date(appleSubscription.periodEnd).getTime() / 1000)
      subscriptionPlanId = appleSubscription.subscriptionId

      // ✅ Extract and update plan metadata from product ID
      if (appleSubscription.appleProductId) {
        // Helper function to get subscription name from product ID
        const getSubscriptionName = (productId) => {
          const productMapping = {
            'trimbiz_monthly_owner': 'Owner',
            'trimbiz_owner_one_staff': 'Owner + 1 staff member',
            'trimbiz_owner_two_staff': 'Owner + 2 staff member',
            'trimbiz_owner_three_staff': 'Owner + 3 staff member',
            'trimbiz_owner_four_staff': 'Owner + 4 staff member',
            'trimbiz_owner_five_staff': 'Owner + 5 staff member',
            'trimbiz_owner_unlimited_staff': 'Owner + unlimited staff member',
          };
          return productMapping[productId] || 'Apple Subscription';
        };

        // Helper function to get team size from product ID
        const getTeamSizeFromAppleProduct = (productId) => {
          const productTeamSizeMapping = {
            'trimbiz_monthly_owner': 1,
            'trimbiz_owner_one_staff': 2,
            'trimbiz_owner_two_staff': 3,
            'trimbiz_owner_three_staff': 4,
            'trimbiz_owner_four_staff': 5,
            'trimbiz_owner_five_staff': 6,
            'trimbiz_owner_unlimited_staff': 999,
          };
          return productTeamSizeMapping[productId] || null;
        };

        const productId = appleSubscription.appleProductId;
        const subscriptionName = getSubscriptionName(productId);
        const teamSize = getTeamSizeFromAppleProduct(productId);
        const membersCount = teamSize ? (teamSize - 1) : null; // Subtract 1 for owner

        console.log('  📦 Plan Details:');
        console.log('    - Product ID:', productId);
        console.log('    - Subscription Name:', subscriptionName);
        console.log('    - Team Size:', teamSize);
        console.log('    - Members Count:', membersCount);

        // Update salon metadata with plan details
        // Safely extract and convert metadata to plain object to avoid serialization errors
        let currentMetadata = {};
        try {
          // Safely get metadata using getDataValue to avoid getters that might cause issues
          const rawMetadata = salonData.getDataValue ? salonData.getDataValue('metadata') : salonData.metadata;
          
          if (rawMetadata) {
            // If metadata is a string, parse it
            if (typeof rawMetadata === 'string') {
              try {
                currentMetadata = JSON.parse(rawMetadata);
              } catch (e) {
                currentMetadata = {};
              }
            } 
            // If metadata is an object, convert to plain object
            else if (typeof rawMetadata === 'object' && rawMetadata !== null) {
              // Use JSON.parse(JSON.stringify()) to create a deep copy and remove any Sequelize internals
              try {
                currentMetadata = JSON.parse(JSON.stringify(rawMetadata));
              } catch (e) {
                // If that fails, try to extract only essential properties safely
                try {
                  currentMetadata = {
                    subscriptionName: rawMetadata.subscriptionName || null,
                    membersCount: rawMetadata.membersCount || null,
                    freeTrialDays: rawMetadata.freeTrialDays || null,
                    members: rawMetadata.members || null,
                    paymentMethodId: rawMetadata.paymentMethodId || null,
                    sloanId: rawMetadata.sloanId || null,
                  };
                } catch (extractError) {
                  // If even that fails, use empty object
                  currentMetadata = {};
                }
              }
            }
          }
        } catch (error) {
          console.error('⚠️ Error extracting metadata:', error.message);
          currentMetadata = {};
        }
        
        // Now safely update metadata
        salonData.metadata = {
          ...currentMetadata,
          subscriptionName: subscriptionName,
          membersCount: membersCount?.toString() || '',
        };
        
        // Update team size
        if (teamSize !== null) {
          salonData.teamSize = teamSize;
        }
        
        // Update subscription price if available
        if (appleSubscription.amountPaid) {
          salonData.subscriptionPrice = parseFloat(appleSubscription.amountPaid);
        }

        console.log('  ✅ Plan metadata updated');
      }

    } else {
      console.log('💳 Processing Stripe subscription...')

      // Get Stripe subscription from Stripe API
      const stripeSubscription = await Stripe.subscriptionsRetrieve(subscriptionId)

      if (!stripeSubscription) {
        return res.json(
          returnFunction('0', 'Stripe subscription not found', {}, '')
        )
      }

      console.log('  ✅ Stripe subscription found')
      console.log('  Status:', stripeSubscription.status)

      // Create connect account if needed (Stripe only)
      if (!salonData.connectAccountId) {
        console.log('  Creating Stripe Connect account...')
        connectAccount = await Stripe.createConnectAccount(salonData.user.email)
        salonData.connectAccountId = connectAccount?.accountId
        await salonData.save()
        console.log('  ✅ Connect account created')
      }

      periodStart = stripeSubscription.current_period_start
      
      // Add 3 days grace period for Stripe
      const expiryDate = new Date(stripeSubscription.current_period_end * 1000)
      expiryDate.setDate(expiryDate.getDate() + 3)
      periodEnd = Math.floor(expiryDate.getTime() / 1000)
      
      subscriptionPlanId = stripeSubscription.id
    }

    // ============================================
    // Common setup for both Stripe and Apple
    // ============================================
    console.log('\n🏢 Setting up salon...')

    // Update salon details
    salonData.approvedByAdmin = true
    salonData.registrationDate = dateManipulation.stampToDate(periodStart)
    salonData.registrationExpiryDate = dateManipulation.stampToDate(periodEnd)
    salonData.subscriptionPlan = subscriptionPlanId
    
    // Ensure metadata is a plain object (not a Sequelize instance or complex object)
    // Sequelize will handle JSON serialization automatically since metadata is DataTypes.JSON
    if (salonData.metadata && typeof salonData.metadata === 'object') {
      try {
        // Deep clone to ensure it's a plain object without any Sequelize internals
        salonData.metadata = JSON.parse(JSON.stringify(salonData.metadata))
      } catch (e) {
        console.error('⚠️ Error ensuring metadata is plain object:', e.message)
        // If that fails, create a minimal safe object
        salonData.metadata = {
          subscriptionName: salonData.metadata?.subscriptionName || null,
          membersCount: salonData.metadata?.membersCount || null,
        }
      }
    }
    
    try {
      await salonData.save()
    } catch (saveError) {
      console.error('❌ Error saving salon data:', saveError.message)
      // If save fails due to serialization, try to save with minimal metadata
      if (saveError.message.includes('Too many properties') || saveError.message.includes('enumerate')) {
        salonData.metadata = {
          subscriptionName: null,
          membersCount: null,
        }
        await salonData.save()
      } else {
        throw saveError
      }
    }

    console.log('  ✅ Salon details updated')
    console.log('    - Approved: true')
    console.log('    - Registration Date:', salonData.registrationDate)
    console.log('    - Expiry Date:', salonData.registrationExpiryDate)

    // Create wallet if not exists
    const check = await wallet.findOne({
      where: {
        salonDetailId: salonData.id,
      },
    })
    
    if (!check) {
      await wallet.create({
        salonDetailId: salonData.id,
      })
      console.log('  ✅ Wallet created')
    } else {
      console.log('  ✅ Wallet already exists')
    }

    // Update salon profile
    await salonProfiles.update(
      {
        hasSubscription: true,
      },
      { where: { salonDetailId: salonData.id } }
    )

    console.log('  ✅ Salon profile updated')
    console.log('\n✅ Choose Plan Complete!')

    // Convert salonData to plain object to avoid serialization errors
    // This prevents "Too many properties to enumerate" error
    let salonDataPlain = null
    try {
      if (salonData) {
        // Use Sequelize's toJSON() method to get plain object
        salonDataPlain = salonData.toJSON ? salonData.toJSON() : JSON.parse(JSON.stringify(salonData))
        
        // Clean up metadata if it's too complex
        if (salonDataPlain.metadata) {
          // If metadata is a string, try to parse it
          if (typeof salonDataPlain.metadata === 'string') {
            try {
              salonDataPlain.metadata = JSON.parse(salonDataPlain.metadata)
            } catch (e) {
              // If parsing fails, set to empty object
              salonDataPlain.metadata = {}
            }
          }
          
          // If metadata is an object, limit to essential fields only
          if (typeof salonDataPlain.metadata === 'object' && salonDataPlain.metadata !== null) {
            const essentialMetadata = {
              subscriptionName: salonDataPlain.metadata.subscriptionName || null,
              membersCount: salonDataPlain.metadata.membersCount || null,
            }
            salonDataPlain.metadata = essentialMetadata
          }
        }
      }
    } catch (serializationError) {
      console.error('⚠️ Error serializing salonData:', serializationError.message)
      // Return only essential fields if full serialization fails
      salonDataPlain = {
        id: salonData?.id,
        salonName: salonData?.salonName,
        approvedByAdmin: salonData?.approvedByAdmin,
        registrationDate: salonData?.registrationDate,
        registrationExpiryDate: salonData?.registrationExpiryDate,
        subscriptionPlan: salonData?.subscriptionPlan,
      }
    }

    return res.json(
      returnFunction(
        '1',
        'Subscription activated successfully',
        { 
          salonData: salonDataPlain, 
          onboardingLink: connectAccount?.accountLink?.url,
          subscriptionSource: subscriptionSource 
        },
        '',
      ),
    )
  } catch (error) {
    console.error('\n❌ Error in choosePlan:', error.message)
    next(error)
  }
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
    returnFunction('1', 'Salon timing added successfully!', {}, '')
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

  return res.json(returnFunction('1', 'Salon timings', { salonTiming }, ''))
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
    returnFunction('1', 'Service images added successfully!', {}, ''),
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
    returnFunction('1', 'Social links added successfully!', {}, '')
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
    returnFunction('1', 'Social links added successfully!', {}, '')
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
    returnFunction('1', 'All salon services', { allServices }, ''),
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
    isVATRegistered,
    vatType,
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
      isVATRegistered,
      vatType,
    },
    {
      where: {
        userId,
      },
    },
  )

  return res.json(
    returnFunction('1', 'Salon details updated successfully!', {}, ''),
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
        attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNum', 'countryCode'],
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

  console.log('Trying to create Stripe login link for accountId:', salonData?.connectAccountId)

  if (salonData?.connectAccountId) {
    let link = salonData?.connectAccountId
      ? await Stripe.createStripeLoginLink(salonData?.connectAccountId)
      : ''

    console.log("LINK ------------------------------------------------------...", link)

    if (!link) link = await Stripe.createStripeAccountLink(salonData?.connectAccountId)
    const output = JSON.parse(JSON.stringify(salonData))
    let stripeDashboardlink = link
    return res.json(returnFunction('1', 'Salon profile', { salonData, stripeDashboardlink }, ''))

  } else {
    const output = JSON.parse(JSON.stringify(salonData))
    return res.json(returnFunction('1', 'Salon profile', { salonData }, ''))

  }

}



/*
            4.Update Salon VAT Details 
    ________________________________________
*/
exports.updateSalonVATDetails = async (req, res, next) => {
  const { salonDetailId, isVATRegistered, vatType } = req.body
  const salon = await salonDetail.findOne({ where: { id: salonDetailId } })
  if (!salon) {
    return next(new appError('Salon not found!', 200))
  }
  await salonDetail.update(
    { isVATRegistered, vatType }, { where: { id: salonDetailId } })
  return res.json(returnFunction('1', 'Salon VAT details updated successfully!', {}, ''))
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
    returnFunction('1', 'Gallery images added successfully!', {}, ''),
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
    returnFunction('1', 'All gallery images!', { galleryImages }, ''),
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
  return res.json(returnFunction('1', 'Picture deleted successfully!', {}, ''))
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
    returnFunction('1', 'Gallery images updated successfully!', {}, ''),
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
    returnFunction('1', 'Salon timings updated successfully!', {}, ''),
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
    return res.json(returnFunction('1', 'No service found!', {}, ''))
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
    returnFunction('1', 'Salon services updated successfully!', {}, ''),
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
    returnFunction('1', 'Categories.', { categories: output }, '')
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
    returnFunction('1', 'Categories have been successfully added!', {}, '')
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
    returnFunction('1', 'All categories of salon', { categories }, ''),
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
    returnFunction('1', 'Salon category updated successfully!', {}, ''),
  )
}

exports.changeCategoryStatus = async (req, res, next) => {
  const { status, salonDetailId } = req.body
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
    throw new appError("Salon must have one Category Associated with it", 200)
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
    returnFunction('1', 'Salon category status updated successfully!', {}, '')
  )
}
//! Coupon
/*
            6.Fetch Coupons
    ________________________________________
*/
// exports.fecthCoupons = async (req, res, next) => {
//   const salon = await salonDetail.findOne({ where: { userId: req.user.id } })
//   if (!salon) {
//     return res.status(200).json(returnFunction('0', 'Data not found.', {}, ''))
//   }
//   const results = await coupon.findAll({
//     where: { salonDetailId: salon.id },
//     attributes: [
//       `id`,
//       `promoCode`,
//       `type`,
//       `status`,
//       `limit`,
//       `from`,
//       `till`,
//       'value',
//       `createdAt`,
//     ],
//     order: [['id', 'DESC']],
//   })

//   return res
//     .status(200)
//     .json(returnFunction('1', 'All coupons.', { coupons: results }, ''))
// }

exports.fetchCoupons = async (req, res, next) => {
  const salon = await salonDetail.findOne({ where: { userId: req.user.id } });
  if (!salon) {
    return res
      .status(200)
      .json(returnFunction('0', 'Data not found.', {}, ''));
  }

  const results = await coupon.findAll({
    where: { salonDetailId: salon.id },
    attributes: [
      'id',
      'promoCode',
      'type',
      'status',
      'limit',
      'from',
      'till',
      'value',
      'createdAt',
    ],
    include: [
      {
        model: couponTimeSlot,
        attributes: ['day', 'timeFrom', 'timeTo'],
      },
    ],
    order: [['id', 'DESC']],
  });

  //return res.json(results)

  // Transform the response so slots are grouped by day
  const coupons = results.map(c => {
    const couponData = c.toJSON();

    // Group slots by day
    const groupedDays = {};
    couponData.couponTimeSlots.forEach(slot => {
      if (!groupedDays[slot.day]) groupedDays[slot.day] = [];
      groupedDays[slot.day].push({
        from: slot.timeFrom,
        to: slot.timeTo,
      });
    });

    return {
      id: couponData.id,
      promoCode: couponData.promoCode,
      type: couponData.type,
      status: couponData.status,
      limit: couponData.limit,
      from: couponData.from,
      till: couponData.till,
      value: couponData.value,
      createdAt: couponData.createdAt,
      validDays: groupedDays, // 👈 Days with their multiple time ranges
    };
  });

  return res
    .status(200)
    .json(returnFunction('1', 'All coupons.', { coupons }, ''));
};

/*
            6.Add Coupons
    ________________________________________
*/
// exports.addCoupons = async (req, res, next) => {
//   const input = req.body
//   const salon = await salonDetail.findOne({ where: { userId: req.user.id } })
//   if (!salon) {
//     return res.status(200).json(returnFunction('0', 'Data not found.', {}, ''))
//   }
//   const exist = await coupon.findOne({ where: { promoCode: input.promoCode } })
//   if (exist) {
//     return res
//       .status(200)
//       .json(returnFunction('0', 'Promo code already taken.', {}, ''))
//   }

//   input.salonDetailId = salon.id
//   await coupon.create(input)

//   return res
//     .status(200)
//     .json(returnFunction('1', 'Coupon created successfully!', {}, ''))
// }


exports.addCoupons = async (req, res, next) => {
  const { promoCode, limit, from, till, value, days, timeRanges } = req.body;

  const salon = await salonDetail.findOne({ where: { userId: req.user.id } });
  if (!salon)
  {
    return res.status(200).json({
      statusCode:200,
      message:"Data not found",
      data:{}
    })
  }


  const exist = await coupon.findOne({ where: { promoCode } });
  if (exist)
  {
    return res.status(200).json({
      statusCode:200,
      message:"Promo code already taken",
      data:{}
    })
  }
  // 1️⃣ Create coupon
  const newCoupon = await coupon.create({
    promoCode,
    limit,
    from,
    till,
    value,
    salonDetailId: salon.id,
  });

  // 2️⃣ Define default days & time range
  const validWeekDays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const selectedDays = days && days.length > 0 ? days : validWeekDays;
  const selectedTimeRanges =
    timeRanges && timeRanges.length > 0
      ? timeRanges
      : [{ from: '12:00 AM', to: '11:59 PM' }];

  // 3️⃣ Validate time format (12-hour format)
  const validTimeFormat = /^(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/;
  for (const range of selectedTimeRanges) {
    if (!validTimeFormat.test(range.from) || !validTimeFormat.test(range.to)) {
      return next(
        new appError(
          'Invalid time format. Use HH:mm AM/PM format (e.g., 01:30 PM)',
          400
        )
      );
    }
  }

  // 4️⃣ Create time slots
  for (const day of selectedDays) {
    if (!validWeekDays.includes(day)) continue;
    for (const range of selectedTimeRanges) {
      await couponTimeSlot.create({
        couponId: newCoupon.id,
        day,
        timeFrom: range.from,
        timeTo: range.to,
      });
    }
  }

  // 5️⃣ Send notifications to customers
  sendCouponNotificationToCustomers(newCoupon, salon.id);

  return res
    .status(200)
    .json(returnFunction('1', 'Coupon created successfully!', {}, ''));
};

/*

            6.Update Coupons
    ________________________________________
*/
exports.updateCoupon = async (req, res, next) => {
  const { couponId } = req.params;
  const { promoCode, limit, from, till, value, days, timeRanges } = req.body;

  const salon = await salonDetail.findOne({ where: { userId: req.user.id } });
  if (!salon)
    return res
      .status(200)
      .json(returnFunction('0', 'Data not found', {}, ''));

  // 1️⃣ Check coupon exists
  const existingCoupon = await coupon.findOne({
    where: { id: couponId, salonDetailId: salon.id },
  });
  if (!existingCoupon) {
    return res
      .status(200)
      .json(returnFunction('0', 'Coupon not found', {}, ''));
  }

  // 2️⃣ Update main coupon fields
  await existingCoupon.update({
    promoCode: promoCode ?? existingCoupon.promoCode,
    limit: limit ?? existingCoupon.limit,
    from: from ?? existingCoupon.from,
    till: till ?? existingCoupon.till,
    value: value ?? existingCoupon.value,
  });

  // 3️⃣ Handle days + time ranges update
  const validWeekDays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  // If no days or times provided → default all days, full day
  const selectedDays = days && days.length > 0 ? days : validWeekDays;
  const selectedTimeRanges =
    timeRanges && timeRanges.length > 0
      ? timeRanges
      : [{ from: '12:00 AM', to: '11:59 PM' }];

  // Validate time format
  const validTimeFormat = /^(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/;
  for (const range of selectedTimeRanges) {
    if (!validTimeFormat.test(range.from) || !validTimeFormat.test(range.to)) {
      return next(
        new appError(
          'Invalid time format. Use HH:mm AM/PM format (e.g., 01:30 PM)',
          400
        )
      );
    }
  }

  // 4️⃣ Delete old time slots & insert new ones
  await couponTimeSlot.destroy({ where: { couponId: existingCoupon.id } });

  for (const day of selectedDays) {
    if (!validWeekDays.includes(day)) continue;

    for (const range of selectedTimeRanges) {
      await couponTimeSlot.create({
        couponId: existingCoupon.id,
        day,
        timeFrom: range.from,
        timeTo: range.to,
      });
    }
  }

  return res
    .status(200)
    .json(returnFunction('1', 'Coupon updated successfully!', {}, ''));
};


/*

            6.Delete Coupons
    ________________________________________
*/
exports.deleteCoupon = async (req, res, next) => {
  const { couponId } = req.params;

  const salon = await salonDetail.findOne({ where: { userId: req.user.id } });
  if (!salon) {
    return res
      .status(200)
      .json(returnFunction('0', 'Data not found', {}, ''));
  }

  // 1️⃣ Check coupon exists
  const existingCoupon = await coupon.findOne({
    where: { id: couponId, salonDetailId: salon.id },
  });

  if (!existingCoupon) {
    return res
      .status(200)
      .json(returnFunction('0', 'Coupon not found', {}, ''));
  }

  // 2️⃣ Delete related time slots
  await couponTimeSlot.destroy({ where: { couponId: existingCoupon.id } });

  // 3️⃣ Delete the coupon
  await existingCoupon.destroy();

  return res
    .status(200)
    .json(returnFunction('1', 'Coupon deleted successfully!', {}, ''));
};


//! Subscription
/*
    Get Customer Subscription Plans
    __________________________
*/
exports.customerSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get salon data with subscription info
    const salonData = await salonDetail.findOne({
      where: { userId },
      attributes: [
        'id',
        'subscriptionPlan',
        'registrationExpiryDate',
        'registrationDate',
        'subscriptionPrice',
        'subscriptionLatestPaymentStatus',
        'metadata',
      ],
    });

    console.log('🚀 ~ customerSubscription ~ salonData:', salonData ? {
      id: salonData.id,
      subscriptionPlan: salonData.subscriptionPlan,
      hasSubscriptionPlan: !!salonData.subscriptionPlan,
    } : 'salonData is null');

    if (!salonData) {
      return res.json(returnFunction('2', 'Salon not found', {}, ''));
    }

    // ============================================
    // Detect subscription source and ensure we have a plan (from salonDetail or subscriptions table)
    // ============================================
    let subscriptionSource = req.body.source || req.query.source;
     const latestSubscription = await subscriptions.findOne({
      where: { salonDetailId: salonData.id },
      order: [['createdAt', 'DESC']],
      attributes: ['subscriptionSource', 'subscriptionId', 'priceId', 'appleOriginalTransactionId'],
    });

    if (!subscriptionSource) {
      subscriptionSource = latestSubscription?.subscriptionSource || 'stripe';
      console.log('🔍 Auto-detected subscription source:', subscriptionSource);
    }

    // If salonDetail.subscriptionPlan is empty, use plan from subscriptions table (e.g. cancelled/expired still have a record)
    const hasPlanOnSalon = salonData.subscriptionPlan &&
      (typeof salonData.subscriptionPlan !== 'string' || salonData.subscriptionPlan.trim() !== '');
    if (!hasPlanOnSalon && latestSubscription?.subscriptionId) {
      salonData.subscriptionPlan = latestSubscription.subscriptionId || latestSubscription.priceId;
      console.log('🔍 Using plan from subscriptions table:', salonData.subscriptionPlan);
    }

    if (!salonData.subscriptionPlan ||
        (typeof salonData.subscriptionPlan === 'string' && salonData.subscriptionPlan.trim() === '')) {
      return res.json(returnFunction('2', 'No subscription plan', {}, ''));
    }

    let customerSubscription;
    
    // ============================================
    // Route to appropriate payment provider
    // ============================================
    
    if (subscriptionSource === 'revenuecat') {
      // ===== REVENUECAT SUBSCRIPTION =====
      console.log('📱 Fetching RevenueCat subscription...');
      
      // Get the latest RevenueCat subscription record
      const revenueCatSubscription = await subscriptions.findOne({
        where: { 
          salonDetailId: salonData.id,
          subscriptionSource: 'revenuecat'
        },
        order: [['createdAt', 'DESC']],
        attributes: [
          'id',
          'subscriptionId',
          'name',
          'amountPaid',
          'currency',
          'priceId',
          'status',
          'periodStart',
          'periodEnd',
          'VAT',
          'revenueCatUserId',
          'revenueCatOriginalTransactionId',
          'revenueCatStore',
        ],
      });

      if (!revenueCatSubscription) {
        return res.json(returnFunction('2', 'No RevenueCat subscription found', {}, ''));
      }

      // Map RevenueCat status to standard status
      const statusMap = {
        'payment_succeeded': 'active',
        'active': 'active',
        'cancelled': 'canceled',
        'canceled': 'canceled',
        'expired': 'expired',
        'payment_failed': 'past_due',
        'paused': 'paused',
      };
      
      const mappedStatus = statusMap[revenueCatSubscription.status?.toLowerCase()] || 'active';
      
      // Check if subscription is actually expired based on periodEnd
      const now = new Date();
      const periodEnd = revenueCatSubscription.periodEnd ? new Date(revenueCatSubscription.periodEnd) : null;
      let finalStatus = mappedStatus;
      
      if (periodEnd && periodEnd < now && mappedStatus !== 'canceled') {
        finalStatus = 'expired';
      } else if (periodEnd && periodEnd > now && mappedStatus === 'expired') {
        // Still valid, override expired status
        finalStatus = 'active';
      }

      // Build response matching Stripe/Apple format
      customerSubscription = {
        id: revenueCatSubscription.subscriptionId || revenueCatSubscription.priceId,
        status: finalStatus,
        name: revenueCatSubscription.name || revenueCatSubscription.priceId || 'RevenueCat Subscription',
        description: revenueCatSubscription.name || revenueCatSubscription.priceId,
        price: revenueCatSubscription.amountPaid || salonData.subscriptionPrice || 0,
        PriceId: revenueCatSubscription.priceId || revenueCatSubscription.subscriptionId,
        duration: 'month', // Default, could be extracted from product_id if needed
        paymentMethods: revenueCatSubscription.revenueCatStore === 'APP_STORE' ? 'Apple Pay' : 'RevenueCat',
        expire: salonData.registrationExpiryDate || revenueCatSubscription.periodEnd,
        start: salonData.registrationDate || revenueCatSubscription.periodStart,
        subscriptionLatestPaymentStatus: salonData.subscriptionLatestPaymentStatus || revenueCatSubscription.status,
        source: 'revenuecat',
        subscriptionSource: 'revenuecat',
        currency: revenueCatSubscription.currency || 'gbp',
        VAT: revenueCatSubscription.VAT || 0,
        revenueCatUserId: revenueCatSubscription.revenueCatUserId,
        revenueCatOriginalTransactionId: revenueCatSubscription.revenueCatOriginalTransactionId,
        revenueCatStore: revenueCatSubscription.revenueCatStore,
        periodStart: revenueCatSubscription.periodStart,
        periodEnd: revenueCatSubscription.periodEnd,
      };
      
      console.log('✅ RevenueCat subscription retrieved');
      
    } else if (subscriptionSource === 'apple') {
      // ===== APPLE IN-APP PURCHASE =====
      console.log('🍎 Fetching Apple subscription...');
      
      // Get user's Apple original transaction ID
      const userRecord = await user.findByPk(userId, {
        attributes: ['appleOriginalTransactionId'],
      });
      
      if (!userRecord?.appleOriginalTransactionId) {
        return res.json(returnFunction('2', 'No Apple subscription found', {}, ''));
      }
      
      // Import Apple IAP functions
      const { 
        generateAppStoreServerJWT 
      } = require('../appleSubscriptions/appleSubscriptionController');
      
      const jwt = require('jsonwebtoken');
      const axios = require('axios');
      
      try {
        // Call Apple API to get subscription status
        const token = generateAppStoreServerJWT();
        const baseUrl = process.env.NODE_ENV === 'production'
          ? 'https://api.storekit.itunes.apple.com'
          : 'https://api.storekit-sandbox.itunes.apple.com';
        
        const response = await axios.get(
          `${baseUrl}/inApps/v1/subscriptions/${userRecord.appleOriginalTransactionId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

        const subscriptionData = response.data.data[0];
        const lastTransaction = subscriptionData.lastTransactions[0];
        
        // Decode JWTs
        const transactionInfo = jwt.decode(lastTransaction.signedTransactionInfo);
        const renewalInfo = jwt.decode(lastTransaction.signedRenewalInfo);
        
        // Map status
        const statusMap = {
          1: 'active',
          2: 'expired',
          3: 'billing_retry',
          4: 'billing_grace_period',
          5: 'revoked',
        };
        
        let appleStatus = statusMap[lastTransaction.status] || 'unknown';
        
        // Smart status check: Verify against actual expiry date
        const appleExpiryDate = new Date(transactionInfo.expiresDate);
        const now = new Date();
        
        // If Apple says expired but date hasn't passed, check if it's really expired
        if (appleStatus === 'expired' && appleExpiryDate > now) {
          // Still within valid period - check auto-renew status
          if (renewalInfo.autoRenewStatus === 0) {
            // User canceled, but still valid until expiry
            appleStatus = 'canceled'; // Will expire but still active
          } else {
            // Should still be active
            appleStatus = 'active';
          }
          console.log('⚠️ Apple status corrected from expired to:', appleStatus);
        }
        
        // Transform Apple response to match Stripe format
        customerSubscription = {
          id: transactionInfo.originalTransactionId,
          status: appleStatus,
          name: 'Apple Subscription',
          description: `Apple ${transactionInfo.productId}`,
          price: salonData.subscriptionPrice || 0,
          PriceId: transactionInfo.productId,
          duration: 'month',
          paymentMethods: 'Apple Pay',
          expire: salonData.registrationExpiryDate,
          start: salonData.registrationDate,
          subscriptionLatestPaymentStatus: salonData.subscriptionLatestPaymentStatus,
          source: 'apple',
          subscriptionSource: 'apple',
          willAutoRenew: renewalInfo.autoRenewStatus === 1,
          environment: transactionInfo.environment,
          originalTransactionId: transactionInfo.originalTransactionId,
          productId: transactionInfo.productId,
          appleRawStatus: lastTransaction.status, // Keep original for debugging
        };
        
        console.log('✅ Apple subscription retrieved');
        
      } catch (appleError) {
        console.error('❌ Apple API error:', appleError.message);
        return res.json(
          returnFunction('2', 'Could not retrieve Apple subscription', {}, appleError.message)
        );
      }
      
    } else {
      // ===== STRIPE (EXISTING CODE) =====
      console.log('💳 Fetching Stripe subscription...');
      
      customerSubscription = await Stripe.getSubscription(
        salonData.subscriptionPlan,
      );

      if (customerSubscription) {
        customerSubscription.expire = salonData?.registrationExpiryDate;
        customerSubscription.start = salonData?.registrationDate;
        customerSubscription.price = salonData?.subscriptionPrice;
        customerSubscription.subscriptionLatestPaymentStatus =
          salonData?.subscriptionLatestPaymentStatus;
        customerSubscription.source = 'stripe';
        customerSubscription.subscriptionSource = 'stripe';
      } else {
        return res.json(returnFunction('2', 'No subscription plan', {}, ''));
      }
    }

    // ============================================
    // Add metadata (fetch from subscriptions table)
    // ============================================
    
    // Fetch the latest subscription record
    const subscriptionRecord = await subscriptions.findOne({
      where: { salonDetailId: salonData.id },
      order: [['createdAt', 'DESC']],
      attributes: ['name', 'amountPaid', 'priceId', 'customerId', 'subscriptionSource'],
    });

    if (subscriptionRecord) {
      // Extract member count from subscription name
      const extractMemberCount = (name) => {
        if (!name) return 1;
        const nameLower = name.toLowerCase();
        if (nameLower.includes('one_staff')) return 2;
        if (nameLower.includes('two_staff')) return 3;
        if (nameLower.includes('three_staff')) return 4;
        if (nameLower.includes('four_staff')) return 5;
        if (nameLower.includes('five_staff')) return 6;
        return 1;
      };

      const memberCount = extractMemberCount(subscriptionRecord.name);

      // Update price from subscription record
      customerSubscription.price = subscriptionRecord.amountPaid || customerSubscription.price || 0;

      // Preserve existing metadata from Stripe (includes paymentMethodId)
      const existingMetaData = customerSubscription.metaData || {};
      
      // Determine paymentMethodId: 
      // 1. Use from Stripe metadata if exists (for Stripe subscriptions)
      // 2. Use defaultPaymentMethodId from subscription if metadata doesn't have it
      // 3. Use 'apple_pay' for Apple subscriptions
      // 4. Use 'revenuecat' or store-specific for RevenueCat subscriptions
      // 5. Otherwise empty string
      let paymentMethodId = '';
      if (subscriptionRecord.subscriptionSource === 'apple') {
        paymentMethodId = 'apple_pay';
      } else if (subscriptionRecord.subscriptionSource === 'revenuecat') {
        // For RevenueCat: use store type (APP_STORE = apple_pay, GOOGLE_PLAY = google_pay)
        if (customerSubscription.revenueCatStore === 'APP_STORE') {
          paymentMethodId = 'apple_pay';
        } else if (customerSubscription.revenueCatStore === 'PLAY_STORE') {
          paymentMethodId = 'google_pay';
        } else {
          paymentMethodId = 'revenuecat';
        }
      } else if (subscriptionSource === 'stripe') {
        // For Stripe: try metadata first, then defaultPaymentMethodId
        paymentMethodId = existingMetaData.paymentMethodId || customerSubscription.defaultPaymentMethodId || '';
      }

      // Merge metadata: preserve Stripe metadata, add/override with our fields
      customerSubscription.metaData = {
        ...existingMetaData, // Preserve all Stripe metadata (including paymentMethodId)
        freeTrialDays: salonData.hasObtainedFreeTrial ? 0 : 7,
        members: memberCount,
        membersCount: memberCount,
        paymentMethodId: paymentMethodId || existingMetaData.paymentMethodId || '', // Use determined value or existing
        sloanId: salonData.id.toString(),
        subscriptionName: subscriptionRecord.name || subscriptionRecord.priceId,
      };
    } else {
      // Fallback if no subscription found
      // Preserve existing metadata from Stripe (includes paymentMethodId)
      const existingMetaData = customerSubscription.metaData || {};
      
      // Determine paymentMethodId based on subscription source
      let paymentMethodId = '';
      if (subscriptionSource === 'apple') {
        paymentMethodId = 'apple_pay';
      } else if (subscriptionSource === 'revenuecat') {
        // For RevenueCat: use store type
        if (customerSubscription.revenueCatStore === 'APP_STORE') {
          paymentMethodId = 'apple_pay';
        } else if (customerSubscription.revenueCatStore === 'PLAY_STORE') {
          paymentMethodId = 'google_pay';
        } else {
          paymentMethodId = 'revenuecat';
        }
      } else if (subscriptionSource === 'stripe') {
        // For Stripe: try metadata first, then defaultPaymentMethodId
        paymentMethodId = existingMetaData.paymentMethodId || customerSubscription.defaultPaymentMethodId || '';
      }
      
      customerSubscription.metaData = {
        ...existingMetaData, // Preserve all Stripe metadata (including paymentMethodId)
        freeTrialDays: '',
        members: 1,
        membersCount: 1,
        paymentMethodId: paymentMethodId, // Use from Stripe metadata or defaultPaymentMethodId
        sloanId: salonData.id.toString(),
        subscriptionName: '',
      };
    }

    // ============================================
    // Check expiry status (common for both)
    // ============================================
    const currentDate = new Date();
    const expiryDate = new Date(salonData.registrationExpiryDate);

    if (customerSubscription.status == 'canceled' && expiryDate < currentDate) {
      return res.json(
        returnFunction('2', 'Subscription expired', { customerSubscription }, ''),
      );
    }

    console.log('✅ Subscription retrieved successfully');
    
    return res.json(
      returnFunction('1', 'All subscription plan', { customerSubscription }, ''),
    );

  } catch (error) {
    console.error('❌ customerSubscription error:', error);
    return res.json(returnFunction('0', 'Error retrieving subscription', {}, error.message));
  }
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
    returnFunction('1', 'Card added successfully!', { payment_method }, ''),
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
    teamSize: newMemberCount
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

  // ============================================
  // Create or Update Subscription Record
  // ============================================
  try {
    // Extract data from updateSubscription object (which has latest_invoice expanded)
    const latestInvoice = updateSubscription?.latest_invoice
    
    // Get invoice details if available
    let invoiceId = null
    let invoicePdfUrl = null
    let amountPaid = parseFloat(subscriptionPrice) || 0
    let currency = updateSubscription?.currency || 'gbp'
    let vatAmount = 0

    if (latestInvoice) {
      // If latest_invoice is an object (expanded), use it directly
      if (typeof latestInvoice === 'object' && latestInvoice.id) {
        invoiceId = latestInvoice.id
        invoicePdfUrl = latestInvoice.invoice_pdf || null
        amountPaid = (latestInvoice.amount_paid || 0) / 100 // Convert from cents
        currency = latestInvoice.currency || currency
        
        // Extract VAT from invoice metadata or tax amounts
        if (latestInvoice.metadata?.VAT) {
          vatAmount = parseFloat(latestInvoice.metadata.VAT) || 0
        } else if (latestInvoice.tax) {
          vatAmount = (latestInvoice.tax || 0) / 100
        } else if (latestInvoice.total_tax_amounts && latestInvoice.total_tax_amounts.length > 0) {
          // Sum all tax amounts
          vatAmount = latestInvoice.total_tax_amounts.reduce((sum, tax) => sum + (tax.amount || 0), 0) / 100
        }
      } else if (typeof latestInvoice === 'string') {
        // If it's just an ID string, try to retrieve it
        invoiceId = latestInvoice
        try {
          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
          const retrievedInvoice = await stripe.invoices.retrieve(latestInvoice)
          if (retrievedInvoice) {
            invoicePdfUrl = retrievedInvoice.invoice_pdf || null
            amountPaid = (retrievedInvoice.amount_paid || 0) / 100
            currency = retrievedInvoice.currency || currency
            
            // Extract VAT
            if (retrievedInvoice.metadata?.VAT) {
              vatAmount = parseFloat(retrievedInvoice.metadata.VAT) || 0
            } else if (retrievedInvoice.total_tax_amounts && retrievedInvoice.total_tax_amounts.length > 0) {
              vatAmount = retrievedInvoice.total_tax_amounts.reduce((sum, tax) => sum + (tax.amount || 0), 0) / 100
            }
          }
        } catch (invoiceError) {
          console.warn('⚠️ Could not retrieve invoice details:', invoiceError.message)
          // Fallback to subscriptionPrice
          amountPaid = parseFloat(subscriptionPrice) || 0
        }
      }
    } else {
      // No invoice yet, use subscriptionPrice as fallback
      amountPaid = parseFloat(subscriptionPrice) || 0
    }

    // Extract priceId from subscription items or use newPriceId
    const priceId = updateSubscription?.items?.data?.[0]?.price?.id || newPriceId || null
    
    // Get subscription name from metadata or request
    const subscriptionNameValue = subscriptionName || 
                                   updateSubscription?.metadata?.subscriptionName || 
                                   updateSubscription?.items?.data?.[0]?.price?.nickname || 
                                   'Subscription'

    // Get subscription status
    const subscriptionStatus = updateSubscription?.status || 'active'

    // Prepare subscription data with all columns
    const subscriptionData = {
      subscriptionId: updateSubscription?.id,
      invoiceId: invoiceId,
      name: subscriptionNameValue,
      customerId: customerId,
      amountPaid: amountPaid,
      currency: currency,
      priceId: priceId,
      invoice: invoicePdfUrl,
      periodStart: registrationDate,
      periodEnd: registrationExpiryDate,
      status: subscriptionStatus,
      VAT: vatAmount,
      salonDetailId: salonData.id,
      subscriptionSource: 'stripe',
      // Apple fields should be null for Stripe subscriptions
      appleTransactionId: null,
      appleOriginalTransactionId: null,
      appleProductId: null,
      appleEnvironment: null,
    }

    // Check if subscription record already exists
    const existingSubscription = await subscriptions.findOne({
      where: {
        salonDetailId: salonData.id,
        subscriptionId: updateSubscription?.id,
        subscriptionSource: 'stripe',
      },
    })

    let subscriptionRecord
    if (existingSubscription) {
      // Update existing subscription
      await existingSubscription.update(subscriptionData)
      subscriptionRecord = existingSubscription
      console.log('✅ Updated existing subscription record:', subscriptionRecord.id)
    } else {
      // Create new subscription record
      subscriptionRecord = await subscriptions.create(subscriptionData)
      console.log('✅ Created new subscription record:', subscriptionRecord.id)
    }

    console.log('📝 Subscription record saved successfully:', {
      id: subscriptionRecord.id,
      subscriptionId: subscriptionRecord.subscriptionId,
      salonDetailId: subscriptionRecord.salonDetailId,
      amountPaid: subscriptionRecord.amountPaid,
      status: subscriptionRecord.status,
      invoiceId: subscriptionRecord.invoiceId,
    })
  } catch (subscriptionError) {
    // Log error but don't fail the entire request
    console.error('⚠️ Error creating/updating subscription record:', subscriptionError)
    console.error('⚠️ Error stack:', subscriptionError.stack)
    // Continue with the response even if subscription record creation fails
  }

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
  const { bookingId } = req.body;
  let bookings = [];

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
                  `(SELECT FORMAT(AVG(ratings.value), 1) FROM ratings WHERE ratings.employeeId = jobs.employeeId)`
                ),
                'employeeAverageRating',
              ],
              [
                literal(
                  `(SELECT COUNT(ratings.id) FROM ratings WHERE ratings.employeeId = jobs.employeeId)`
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
  });

  const employeeMap = bookingData.jobs.reduce((acc, ele) => {
    const employeeId = ele.employee ? ele.employee.id : 'AnyOne';
    if (!acc[employeeId]) {
      acc[employeeId] = {
        employee: ele.employee,
        services: [],
      };
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
    });

    return acc;
  }, {});

  const promises = Object.values(employeeMap).map(async (employeeObj) => {
    return employeeObj;
  });

  const finalPayment = parseFloat(
    (bookingData.subTotal - bookingData.initialPayment).toFixed(2)
  );

  const remainingAmount =
    bookingData.status === 'save-unpaid'
      ? parseFloat(
        (bookingData.subTotal - bookingData.actualCapturedAmount).toFixed(2)
      )
      : 0.0;

  const employees = await Promise.all(promises);

  // ✅ Fetch connectAccountId from salonDetail
  const salon = await salonDetail.findOne({
    where: { id: bookingData.salonDetailId },
    attributes: ['connectAccountId'],
  });

  const connectAccountId = salon?.connectAccountId;

  let cardLast4digits;
  if (bookingData.stripeCardId) {
    const card = await Stripe.fetchSingleCard(
      bookingData.stripeCardId,
      connectAccountId // ✅ Pass connect account to Stripe
    );
    cardLast4digits = card?.card?.last4;
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
    vatAmount: bookingData?.vatAmount,
    tip:bookingData?.tip ?? 0.00,
    platformFee: bookingData?.platformFee ?? 0.00,
    discount:bookingData?.discount ?? 0.00,
    initialPaymentIntend: bookingData.initialPaymentIntend,
    finalPaymentIntend: bookingData.finalPaymentIntend,
    customerId: bookingData.customerId,
    cardLast4digits: cardLast4digits,
    employees,
  };

  return res.json(
    returnFunction('1', 'Booking details', { bookingDetail }, '')
  );
};

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
    attributes: ['id', 'vatType'],
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

  // Calculate total VAT amount if salon's vatType is 'exclusive'
  let totalVatAmount = 0
  if (salonData?.vatType === 'Exclusive') {
    const bookings = await booking.findAll({
      where: {
        salonDetailId: salonData.id,
      },
      attributes: ['vatAmount'],
    })

    totalVatAmount = bookings.reduce((sum, booking) => {
      const vatAmount = parseFloat(booking.vatAmount || 0)
      return sum + vatAmount
    }, 0)
    
    // Round to 2 decimal places
    totalVatAmount = Math.round(totalVatAmount * 100) / 100
  }

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

    // Add total VAT amount to salon wallet
    salonWallet.totalVatAmount = totalVatAmount
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
            AND employees.deleted = false)`
        ),
        'teamSize',
      ],
    ],
  });

  if (!salon) throw new appError('resource not found', 200);

  // ✅ Fetch from salonDetails for free trial flag
  const salonDetails = await salonDetail.findOne({
    where: { userId: salon.id },
    attributes: ['hasObtainedFreeTrial'],
  });

  let stripeCustomer = salon?.stripeCustomerId;
  if (!stripeCustomer) {
    const stripeCustomerId = await Stripe.addCustomer(
      salon.fullName,
      salon.email
    );
    stripeCustomer = stripeCustomerId;
    await user.update({ stripeCustomerId }, { where: { id: salon.id } });
  }

  let priceId;
  if (process.env.NODE_ENV === 'test') {
    priceId = process.env.stage_PriceId;
  } else {
    priceId = process.env.live_price_Id;
  }

  const price = await Stripe.getPriceById(priceId);
  const setupIntent = await Stripe.setupIntent(stripeCustomer);
  const ephemeralKey = await Stripe.createEphemeralKey(stripeCustomer);

  const { livemode, product, currency, billing_scheme, active, object } = price;
  const limited = price.tiers[0];

  const output = {
    livemode,
    product,
    currency,
    billing_scheme,
    active,
    object,
    priceId: price.id,
    unlimitedMembersAmount: price.tiers[1].flat_amount / 100,
    ownerAmount: limited.flat_amount / 100,
    memberAmount: limited.unit_amount / 100,
    upTo: limited.up_to,
    freeTrialDays: 30,
    hasObtainedFreeTrial: salonDetails?.hasObtainedFreeTrial || false,
    stripeCustomer,
    clientSecret: setupIntent.client_secret,
    teamSize: salon?.dataValues?.teamSize || 0,
    ephemeralKeySecret: ephemeralKey.secret,
  };

  return res.json(
    response({
      message: 'Subscription',
      data: { price: output },
    })
  );
};

exports.updateCoverImage = async (req, res, next) => {
  const image = await salonImage.findOne({
    where: { id: req.body.coverImageId },
  })

  await salonDetail.update(
    { coverImage: image.imageUrl },
    { where: { userId: req.user.id } },
  )
  return res.status(200).json(returnFunction('1', `Success`, {}, ''))
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
      message: 'Client feedbacks',
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
      title: `Shop reply`,
      body: `${req.body?.reply}. From  ${client?.dataValues?.salonName}`,
    }

    const data = {
      appointment: client?.id,
      name: `${client?.dataValues?.salonName}`,
      image: `${client?.dataValues?.image}`,
    }
    ThrowNotification(tokens, customerNotification, data, client?.customerId)
  }

  return res.status(200).json(returnFunction('1', `Success`, {}, ''))
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

  return res.status(200).json(returnFunction('1', `Success`, {}, ''))
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

  return res.json(returnFunction('1', 'Success', { newAllergy }, ''))
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

  return res.json(returnFunction('1', 'Success', { allergiesList }, ''))
}

//* Remove Client's allergies

exports.removeAllergies = async (req, res, next) => {
  const newAllergy = await allergies.destroy({
    where: { id: req.params?.id },
  })
  return res.json(returnFunction('1', 'Success', { newAllergy }, ''))
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
  return res.json(returnFunction('1', 'Success', {}, ''))
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
      message: 'Subscription',
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
      message: 'Subscription',
      data: { price: output },
    }),
  )
}

//!Account Delete
//* 1. SALON Account Delete
exports.accountDelete = async (req, res, next) => {
  const id = req.user.id

  // Fetch salon (extra fields needed for subscription cancellation) and user in parallel
  const [salon, data] = await Promise.all([
    salonDetail.findOne({
      where: { userId: id },
      attributes: ['id', 'subscriptionPlan', 'subscriptionPrice', 'metadata'],
    }),
    user.findOne({
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
    }),
  ])

  if (!data || !salon) throw new appError('resource not found', 200)

  // ─── CHECK 1: Block if an active RevenueCat subscription exists ──────────
  // RevenueCat subscriptions are managed by the App Store / Play Store.
  // We cannot cancel them server-side — the user must cancel from their device.
  const revenueCatSub = await subscriptions.findOne({
    where: {
      salonDetailId: salon.id,
      subscriptionSource: 'revenuecat',
      status: { [Op.notIn]: ['cancelled', 'canceled', 'expired'] },
    },
    attributes: ['id', 'status'],
    order: [['createdAt', 'DESC']],
  })

  if (revenueCatSub) {
    return res.json(
      returnFunction(
        '2',
        'You have an active subscription purchased through the app store. Please cancel your subscription first before deleting your account. If you do not cancel, you will continue to be charged even after deletion.',
        {},
        ''
      )
    )
  }

  // ─── CHECK 2: Block if salon has active or upcoming bookings ─────────────
  const activeBookingsCount = await booking.count({
    where: {
      salonDetailId: salon.id,
      status: { [Op.in]: ['assign', 'pending'] },
    },
  })

  if (activeBookingsCount > 0) {
    return res.json(
      returnFunction(
        '2',
        `Your salon has ${activeBookingsCount} active or upcoming appointment(s). Please complete or cancel all bookings before deleting your account.`,
        { activeBookingsCount },
        ''
      )
    )
  }

  // ─── STEP 3: Auto-cancel Stripe subscription if active ───────────────────
  // We have full API control over Stripe, so cancel it on behalf of the user.
  const stripeSub = await subscriptions.findOne({
    where: {
      salonDetailId: salon.id,
      subscriptionSource: { [Op.notIn]: ['revenuecat', 'apple'] },
      status: { [Op.notIn]: ['canceled', 'cancelled', 'expired'] },
    },
    attributes: ['id', 'status'],
    order: [['createdAt', 'DESC']],
  })

  if (stripeSub && salon.subscriptionPlan) {
    try {
      const cancelResult = await Stripe.cancelSubscription(salon.subscriptionPlan)
      if (cancelResult) {
        await cancelledSubscriptions.create({
          subscriptionId: salon.subscriptionPlan,
          amount: salon.subscriptionPrice,
          metadata: salon.metadata,
          reason: 'Account deleted by user',
        })
        console.log(`✅ Stripe subscription cancelled for salon ${salon.id} during account deletion`)
      }
    } catch (stripeErr) {
      // Log but do NOT block deletion — subscription may already be cancelled on Stripe's side
      console.error(`⚠️ Stripe cancellation error during account delete for salon ${salon.id}:`, stripeErr.message)
    }
  }

  // ─── STEP 4: Cancel any remaining in-progress bookings (fire-and-forget) ─
  //TODO using Customer table for salon as well. will change in future if needed
  const work = await booking.findAll({
    where: {
      salonDetailId: salon.id,
      status: { [Op.in]: ['assign', 'pending'] },
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

  // ─── STEP 5: Archive user data and anonymise the account ─────────────────
  await deletedCustomer.create({
    userId: id,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    countryCode: data.countryCode,
    phoneNum: data.phoneNum,
    image: data.image,
    stripeCustomerId: data.stripeCustomerId,
    deletedAt: new Date(),
    recovered: false,
    permanentlyDeleted: false,
  })

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

  await subscriptions.destroy({ where: { salonDetailId: salon.id } })
  await salonDetail.update({ approvedByAdmin: false }, { where: { id: salon.id } })

  //Stripe.deleteCustomer(data?.stripeCustomerId, 'salon')
  deviceToken.destroy({ where: { userId: id } })
  deleteEmployeesAll(salon.id)
  return res.json(response({ message: 'Account deleted', data: { data } }))
}

exports.updateSubscriptionsPriceId = async (req, res, next) => {
  // Dynamically import p-limit
  const { default: pLimit } = await import('p-limit');

  const latestPriceId = process.env.stage_PriceId;

  const subsToUpdate = await subscriptions.findAll({
    where: {
      [Op.or]: [
        { priceId: { [Op.ne]: latestPriceId } },
        { priceId: null }
      ]
    }
  });

  console.log(`🔍 Found ${subsToUpdate.length} subscriptions to update.`);

  const limit = pLimit(15);

  const updateJobs = subsToUpdate.map(sub =>
    limit(async () => {
      try {
        const stripeSub = await Stripe.subscriptionsRetrieve(sub.subscriptionId);
        const itemId = stripeSub?.items?.data?.[0]?.id;

        if (!itemId) {
          console.warn(`⚠️ No subscription item found for ${sub.subscriptionId}`);
          return { success: false, id: sub.subscriptionId, reason: 'No item ID' };
        }

        await Stripe.updateSubscription(sub.subscriptionId, latestPriceId, stripeSub.customer, null);

        sub.priceId = latestPriceId;
        await sub.save();

        console.log(`✅ Updated subscription ${sub.subscriptionId}`);
        return { success: true, id: sub.subscriptionId };
      } catch (err) {
        console.error(`❌ Failed to update subscription ${sub.subscriptionId}:`, err.message);
        return { success: false, id: sub.subscriptionId, reason: err.message };
      }
    })
  );

  const results = await Promise.allSettled(updateJobs);

  const summary = results.map(r => (r.status === 'fulfilled' ? r.value : { success: false, reason: r.reason }));

  return res.json(response({ message: 'Subscriptions updated', data: summary }));

};


/*
 * Get Invoice Details
*/
exports.fetchInvoice = async (req, res, next) => {
  const { invoiceId } = req.params;

  if (!invoiceId) {
    return next(new appError('Invoice ID is required', 400));
  }

  try {

    const invoiceData = await Stripe.getInvoiceDetails(invoiceId);


    return res.status(200).json({
      status: 'success',
      data: {
        invoiceNumber: invoiceData.invoiceNumber,
        amountDue: invoiceData.amountDue,
        amountPaid: invoiceData.amountPaid,
        amountRemaining: invoiceData.amountRemaining,
        currency: invoiceData.currency,
        status: invoiceData.status,
        customerId: invoiceData.customerId,
        billingReason: invoiceData.billingReason,
        subscriptionId: invoiceData.subscriptionId,
        lineItems: invoiceData.lineItems,
        paymentMethod: invoiceData.paymentMethod,
        receiptNumber: invoiceData.receiptNumber,
        created: invoiceData.created,
        dueDate: invoiceData.dueDate,
      },
    });
  } catch (error) {
    return next(new appError('Failed to fetch invoice details', 500));
  }
};

/*
 * Create Connection Token and Client Secret
 * ________________________________________
 */
// exports.createConnectionToken = async (req, res, next) => {
//   try {
//     const userId = req.user.id;

//     const { amount } = req.body;
//     // Find the salon and get the connect account ID
//     const salonData = await salonDetail.findOne({
//       where: { userId },
//       include: [{ model: user, attributes: ['id', 'stripeCustomerId', 'email', 'firstName', 'lastName'] }],
//     });
    
//     console.log("salonData=======================+++++",salonData.connectAccountId)
    
//     let salonConnectId=salonData.connectAccountId

//     if (!salonData) {
//       return next(new appError('Salon not found', 404));
//     }

//     if (!salonData.connectAccountId) {
//       return next(new appError('Salon connect account not found. Please complete onboarding first.', 400));
//     }

//     // Check if customer exists in customerOnConnectAccount table
//     let customerOnConnect = await customerOnConnectAccount.findOne({
//       where: { 
//         salonDetailId: salonData.id,
//         connectAccountId: salonData.connectAccountId,
//         userId: salonData.user.id
//       }
//     });

//     let customerId;
    
//     console.log("customerId===++++=======++++++++++++======",customerId)

//     if (!customerOnConnect) {
//       // Create customer in the connect account
      
//       console.log("Going into this =============================+++++")
//       customerId = await Stripe.addCustomer(
//         `${salonData.user.firstName} ${salonData.user.lastName}`,
//         salonData.user.email,
//         salonData.connectAccountId
//       );

//       // Save customer in customerOnConnectAccount table
//       await customerOnConnectAccount.create({
//         customerId: customerId,
//         connectAccountId: salonData.connectAccountId,
//         salonDetailId: salonData.id,
//         userId: salonData.user.id,
//         status: true
//       });
//     } else {
//       customerId = customerOnConnect.customerId;
//     }

//     // Create connection token for Stripe Terminal
//     // In live mode, you need to pass a location ID
//     // For now, we're passing null which works in test mode
//     // In production, you'll need to provide an actual location ID from your database
//     const connectionToken = await Stripe.createConnectionToken(salonData.connectAccountId, null);
    
//     // Create setup intent for client secret using the connect account
//     const directCharge = await Stripe.createOneTapePayment(amount,salonConnectId);
//     console.log('directCharge', directCharge)
//     return res.json(
//       returnFunction('1', 'Connection token and client secret created successfully', {
//         connectionToken,
//         clientSecret: directCharge.client_secret,
//         paymentIntentId: directCharge.id,
//         customerId,
//         connectAccountId: salonData.connectAccountId
//       }, '')
//     );
//   } catch (error) {
//     console.error('Error creating connection token:', error);
//     return next(new appError('Failed to create connection token and client secret', 500));
//   }
// };


exports.createConnectionToken = async (req, res, next) => {
    const userId = req.user.id;
    
    console.log("CALING THE API  OF CREATE TOKEN")

    const { amount } = req.body;
    // Find the salon and get the connect account ID
    const salonData = await salonDetail.findOne({
      where: { userId },
      include: [{ model: user, attributes: ['id', 'stripeCustomerId', 'email', 'firstName', 'lastName'] }],
    });
    
    //console.log("salonData=======================+++++",salonData.connectAccountId)
    
    // let salonConnectId=salonData.connectAccountId
    let salonConnectId='acct_1R64stEFgyBEZR5p';

    // if (!salonData) {
    //   return next(new appError('Salon not found', 404));
    // }

    // if (!salonData.connectAccountId) {
    //   return next(new appError('Salon connect account not found. Please complete onboarding first.', 400));
    // }

    // Check if customer exists in customerOnConnectAccount table
    let customerOnConnect = await customerOnConnectAccount.findOne({
      where: { 
        salonDetailId: salonData.id,
        connectAccountId: salonData.connectAccountId,
        userId: salonData.user.id
      }
    });

    let customerId;
    
    console.log("customerId===++++=======++++++++++++======",customerId)

    if (!customerOnConnect) {
      // Create customer in the connect account
      
      console.log("Going into this =============================+++++")
      customerId = await Stripe.addCustomer(
        `${salonData.user.firstName} ${salonData.user.lastName}`,
        salonData.user.email,
        salonData.connectAccountId
      );

      // Save customer in customerOnConnectAccount table
      await customerOnConnectAccount.create({
        customerId: customerId,
        connectAccountId: salonConnectId,
        salonDetailId: salonData.id,
        userId: salonData.user.id,
        status: true
      });
    } else {
      customerId = customerOnConnect.customerId;
    }

    // Create connection token for Stripe Terminal
    // In live mode, you need to pass a location ID
    // For now, we're passing null which works in test mode
    // In production, you'll need to provide an actual location ID from your database
    const connectionToken = await Stripe.createConnectionToken('tml_GP5oQgqIvzs3VW');
    
    // Create setup intent for client secret using the connect account
    const directCharge = await Stripe.createOneTapePayment(amount,salonConnectId);
    console.log('directCharge', directCharge)
    
     let outObj={
        connectionToken,
        clientSecret: directCharge.client_secret,
        paymentIntentId: directCharge.id,
        customerId,
        connectAccountId: salonData.connectAccountId
    }
   
     console.log('outObj========================+++++++', outObj)
    return res.json(
      returnFunction('1', 'Connection token and client secret created successfully', {
        connectionToken,
        clientSecret: directCharge.client_secret,
        paymentIntentId: directCharge.id,
        customerId,
        connectAccountId: salonData.connectAccountId
      }, '')
    );
};