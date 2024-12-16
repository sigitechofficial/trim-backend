const { STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } = process.env
const stripe = require('stripe')(STRIPE_SECRET_KEY)
const { Op, literal, col, fn, where } = require('sequelize')
const StripeHandler = require('../stripe')
const AppError = require('../../utils/appError')
const dateManipulation = require('../../utils/dateManipulation')
const { salonDetail, user, subscriptions } = require('../../models')

// const subscriptions = require('../models/subscriptions')

const endpointSecret = `whsec_4UTYsBGVUlQ2Ej4TKuvdNxGn0lvcuOxu`

exports.stripeSubscriptionWebhookEventHandler = async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event
  console.log('⚠️⚠️⚠️ Webhook signature verification.')

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    console.log(
      '🚀 ~~~~~~~~~~~ exports.stripeSubscriptionWebhookEventHandler= ~ event:',
      JSON.stringify(event),
    )
  } catch (err) {
    console.error('⚠️⚠️⚠️ Webhook signature verification failed.', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
  // invoice.paid
  // invoice.payment_failed
  // invoice.payment_succeeded
  // invoice.updated
  // subscription_schedule.canceled
  // subscription_schedule.created
  // subscription_schedule.updated
  // Handle the event
  console.log('🚀🚀🚀 ~~~~~~~~~~ >  EVENT TYPE }:', event.type)
  switch (event.type) {
    case 'invoice.payment_succeeded':
      await handleInvoicePayment(event.data.object, 'success', event.type)
      break
    case 'invoice.payment_failed':
      await handleInvoicePayment(event.data.object, 'fail', event.type)
      break
    // case 'customer.subscription.created':
    //   await handleSubscriptionCreated(event.data.object)
    //   break
    // case 'customer.subscription.updated':
    //   await handleSubscriptionUpdated(event.data.object)
    //   break
    // case 'customer.subscription.cancel':
    //   await handleSubscriptionDeleted(event.data.object)
    //   break
    // Add other events as needed
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  // Acknowledge receipt of the event
  res.json({ received: true })
}
const handleInvoicePayment = async (invoice, state, status) => {
  try {
    const subscriptionId = invoice.subscription
    const customerId = invoice.customer
    const amountPaid = invoice.amount_paid / 100
    const currency = invoice.currency
    const name =
      invoice.lines?.data.length > 0
        ? invoice.lines?.data[invoice.lines?.data.length - 1]?.metadata
            ?.subscriptionName ||
          invoice.lines?.data[invoice.lines?.data.length - 1]?.description
        : ''

    const invoiceId = invoice.id
    const subscribtionData =
      await StripeHandler.subscriptionsRetrieve(subscriptionId)

    const periodEnd = new Date(subscribtionData?.current_period_end * 1000)
    const periodStart = new Date(subscribtionData?.current_period_start * 1000)

    const input = {
      status: status,
      name,
      periodStart,
      periodEnd,
      invoice: invoice.invoice_pdf,
      currency,
      amountPaid,
      customerId,
      subscriptionId,
      invoiceId,
    }
    console.log('🚀 ~ handleInvoicePaymentSucceeded ~ input:', input)
    // Find the user by Stripe Customer ID
    const salon = await salonDetail.findOne({
      where: {
        userId: {
          [Op.in]: literal(`(
        SELECT id FROM users WHERE stripeCustomerId = '${customerId}'
      )`),
        },
      },
      attributes: [
        'id',
        'registrationDate',
        'salonName',
        'approvedByAdmin',
        'subscriptionPlan',
        'registrationExpiryDate',
      ],
    })

    if (!salon) {
      console.warn(`User or subscriptions not found for Customer ID: ${salon}`)
      return 0
    }
    if (state && state == 'success') {
      salon.approvedByAdmin = true
      salon.subscriptionPlan = subscriptionId
      salon.registrationExpiryDate = periodEnd
      salon.registrationDate = periodStart
      salon.hasObtainedFreeTrial = 1
      salon.subscriptionLatestPaymentStatus = status
      await salon.save()
    }

    input.salonDetailId = salon.id
    subscriptions.create(input)

    console.log(
      `Payment succeeded for user ${salon.salonName} with ID ${salon.id}, subscriptions ID: ${subscriptionId}`,
    )
  } catch (error) {
    console.error('Error handling invoice.payment_succeeded:', error)
  }
}

const handleInvoicePaymentFailed = async (invoice) => {
  try {
    const subscriptionId = invoice.subscription
    const customerId = invoice.customer

    // Find the user by Stripe Customer ID
    const user = await user.findOne({
      where: { stripeCustomerId: customerId },
      include: subscriptions,
    })

    if (!user || !user.subscriptions) {
      console.warn(
        `User or subscriptions not found for Customer ID: ${customerId}`,
      )
      return
    }

    // Update subscription status
    user.subscriptions.status = 'past_due'
    await user.subscriptions.save()

    console.log(
      `Payment failed for user ${user.email}, subscriptions ID: ${subscriptionId}`,
    )
  } catch (error) {
    console.error('Error handling invoice.payment_failed:', error)
  }
}

const handleSubscriptionCreated = async (subscription) => {
  try {
    const customerId = subscription.customer
    const stripeSubscriptionId = subscription.id
    const status = subscription.status
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
    const priceId = subscription.items.data[0].price.id

    // Find the user by Stripe Customer ID
    const user = await user.findOne({ where: { stripeCustomerId: customerId } })

    if (!user) {
      console.warn(`User not found for Customer ID: ${customerId}`)
      return
    }

    // Create or update the subscription in the database
    const [sub, created] = await subscriptions.findOrCreate({
      where: { stripeSubscriptionId },
      defaults: {
        userId: user.id,
        status,
        currentPeriodEnd,
        priceId,
      },
    })

    if (!created) {
      // If subscription already exists, update it
      sub.status = status
      sub.currentPeriodEnd = currentPeriodEnd
      sub.priceId = priceId
      await sub.save()
    }

    console.log(
      `subscriptions created for user ${user.email}, subscriptions ID: ${stripeSubscriptionId}`,
    )
  } catch (error) {
    console.error('Error handling customer.subscription.created:', error)
  }
}

const handleSubscriptionUpdated = async (subscription) => {
  try {
    const customerId = subscription.customer
    const stripeSubscriptionId = subscription.id
    const status = subscription.status
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
    const priceId = subscription.items.data[0].price.id

    // Find the user by Stripe Customer ID
    const user = await user.findOne({
      where: { stripeCustomerId: customerId },
      include: subscriptions,
    })

    if (!user || !user.subscriptions) {
      console.warn(
        `User or subscriptions not found for Customer ID: ${customerId}`,
      )
      return
    }

    // Update subscription details
    user.subscriptions.status = status
    user.subscriptions.currentPeriodEnd = currentPeriodEnd
    user.subscriptions.priceId = priceId
    await user.subscriptions.save()

    console.log(
      `subscriptions updated for user ${user.email}, subscriptions ID: ${stripeSubscriptionId}`,
    )
  } catch (error) {
    console.error('Error handling customer.subscription.updated:', error)
  }
}

const handleSubscriptionDeleted = async (subscription) => {
  try {
    const customerId = subscription.customer
    const stripeSubscriptionId = subscription.id
    const status = subscription.status

    // Find the user by Stripe Customer ID
    const user = await user.findOne({
      where: { stripeCustomerId: customerId },
      include: subscriptions,
    })

    if (!user || !user.subscriptions) {
      console.warn(
        `User or subscriptions not found for Customer ID: ${customerId}`,
      )
      return
    }

    // Update subscription status or remove subscription
    user.subscriptions.status = status
    await user.subscriptions.save()

    console.log(
      `subscriptions deleted for user ${user.email}, subscriptions ID: ${stripeSubscriptionId}`,
    )
  } catch (error) {
    console.error('Error handling customer.subscription.deleted:', error)
  }
}

// TODO Work Pending if auto payment failed then we have to change default payment method then make payments fro subscribtions

// router.post('/update-payment-method', async (req, res) => {
//   const { paymentMethodId } = req.body
//   const userId = req.user.id // Assuming user is authenticated and user ID is available

//   try {
//     // Retrieve user from the database
//     const user = await User.findByPk(userId, {
//       include: Subscription,
//     })

//     if (!user || !user.Subscription) {
//       return res.status(404).json({ error: 'User or Subscription not found.' })
//     }

//     const customerId = user.stripeCustomerId
//     const subscriptionId = user.Subscription.stripeSubscriptionId

//     // Attach the new PaymentMethod to the customer
//     await stripe.paymentMethods.attach(paymentMethodId, {
//       customer: customerId,
//     })

//     // Set the new PaymentMethod as the default for the customer
//     await stripe.customers.update(customerId, {
//       invoice_settings: {
//         default_payment_method: paymentMethodId,
//       },
//     })

//     // Update the subscription to use the new PaymentMethod
//     await stripe.subscriptions.update(subscriptionId, {
//       default_payment_method: paymentMethodId,
//     })

//     res.json({ success: true })
//   } catch (error) {
//     console.error('Error updating payment method:', error)
//     res.status(400).json({ error: error.message })
//   }
// })

//! For subscribtion from backend

// router.post('/create-subscription', async (req, res) => {
//   const { userId, paymentMethodId, promoCode, memberCount } = req.body;

//   try {
//       // Fetch user from DB
//       const user = await User.findByPk(userId, { include: Subscription });
//       if (!user) return res.status(404).json({ error: 'User not found' });

//       // Determine Price ID based on member count
//       const priceId = memberCount >= 13 ? 'price_fixed_250' : 'price_per_person_20'; // Replace with your Price IDs
//       const quantity = memberCount >= 13 ? 1 : memberCount;

//       // Create or update Stripe customer
//       let customer;
//       if (user.stripeCustomerId) {
//           customer = await stripe.customers.retrieve(user.stripeCustomerId);
//       } else {
//           customer = await stripe.customers.create({
//               email: user.email,
//               payment_method: paymentMethodId,
//               invoice_settings: { default_payment_method: paymentMethodId },
//           });
//           user.stripeCustomerId = customer.id;
//           await user.save();
//       }

//       // Apply promo code if provided
//       let promotionCode = null;
//       if (promoCode) {
//           const promo = await stripe.promotionCodes.list({
//               code: promoCode,
//               active: true,
//               limit: 1,
//           });
//           if (promo.data.length > 0) {
//               promotionCode = promo.data[0].id;
//           } else {
//               return res.status(400).json({ error: 'Invalid promo code' });
//           }
//       }

//       // Create Subscription with metadata
//       const subscription = await stripe.subscriptions.create({
//           customer: customer.id,
//           items: [{ price: priceId, quantity: quantity }],
//           expand: ['latest_invoice.payment_intent'],
//           promotion_code: promotionCode || undefined,
//           trial_period_days: 30, // Free trial period
//           metadata: {
//               userId: userId,
//           },
//       });

//       // Save subscription details to DB
//       await Subscription.create({
//           userId: user.id,
//           stripeSubscriptionId: subscription.id,
//           status: subscription.status,
//           currentPeriodEnd: new Date(subscription.current_period_end * 1000),
//           priceId: priceId,
//           memberCount: memberCount,
//           promotionCode: promoCode || null,
//       });

//       res.json({ success: true, subscription });
//   } catch (error) {
//       console.error('Error creating subscription:', error);
//       res.status(500).json({ error: 'Internal Server Error' });
//   }
// });
