require('dotenv').config
const { STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } = process.env
const stripe = require('stripe')(STRIPE_SECRET_KEY)
const { Op, literal, col, fn, where } = require('sequelize')
const StripeHandler = require('../stripe')
const AppError = require('../../utils/appError')
const dateManipulation = require('../../utils/dateManipulation')
const ThrowNotification = require('../../utils/throwNotification')
const PayoutBlockedEmail = require('../../helper/PayoutBlockedEmail')
const { salonDetail, user, subscriptions, deviceToken } = require('../../models')

// const subscriptions = require('../models/subscriptions')
const DEMO = require('../../helper/demo')
let endpointSecret;

if (process.env.NODE_ENV === 'test') {
  endpointSecret = process.env.stage_signature
} else {
  endpointSecret = process.env.live_signature
}
console.log("ЁЯЪА ~ endpointSecret:", endpointSecret)

exports.stripeSubscriptionWebhookEventHandler = async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event
  console.log('тЪая╕ПтЪая╕ПтЪая╕П Webhook signature verification.')

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    console.log(
      'ЁЯЪА ~~~~~~~~~~~ exports.stripeSubscriptionWebhookEventHandler= ~ event:',
      JSON.stringify(event),
    )
  } catch (err) {
    console.error('тЪая╕ПтЪая╕ПтЪая╕П Webhook signature verification failed.', err.message)
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
  console.log('ЁЯЪАЁЯЪАЁЯЪА ~~~~~~~~~~ >  EVENT TYPE }:', event.type)
  switch (event.type) {
    case 'invoice.payment_succeeded':
      await handleInvoicePayment(
        event.data.object,
        'success',
        'payment_succeeded',
      )
      break
    case 'invoice.payment_failed':
      await handleInvoicePayment(event.data.object, 'fail', 'payment_failed')
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
    const subscriptionId = invoice.subscription;
    const customerId = invoice.customer;
    const currency = invoice.currency;
    const name =
      invoice.lines?.data.length > 0
        ? invoice.lines?.data[invoice.lines?.data.length - 1]?.metadata
          ?.subscriptionName ||
        invoice.lines?.data[invoice.lines?.data.length - 1]?.description
        : '';

    const invoiceId = invoice.id;

    // Step 1: Fetch subscription data, including metadata
    const subscribtionData = await StripeHandler.subscriptionsRetrieve(subscriptionId);
    
    // Step 2: Extract the metadata from the subscription
    const metadata = subscribtionData.metadata || {};
    console.log("Subscription Metadata =====================>>>>", metadata);

    // Use real amount if paid, otherwise fall back to subscriptionPrice from metadata (e.g. free trial invoices have amount_paid = 0)
    const amountPaid = invoice.amount_paid > 0
      ? invoice.amount_paid / 100
      : parseFloat(metadata?.subscriptionPrice || 0);

    // Step 3: Process the period data (add 3-day Stripe grace period)
    const periodEnd = new Date(subscribtionData?.current_period_end * 1000);
    periodEnd.setDate(periodEnd.getDate() + 3);
    const periodStart = new Date(subscribtionData?.current_period_start * 1000);
    const priceId = subscribtionData?.items?.data?.[0]?.price?.id || null;

    // Step 4: Prepare the input for the subscription (already done in your code)
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
      priceId,
      VAT: parseFloat(metadata?.VAT || '0'),
    };

    console.log('🚀 ~ handleInvoicePaymentSucceeded ~ input:', input);

    // Step 5: Find the salon details
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
    });

    if (!salon) {
      console.warn(`User or subscriptions not found for Customer ID: ${salon}`);
      return 0;
    }

    if (state && state === 'success') {
      salon.approvedByAdmin = true;
      salon.subscriptionPlan = subscriptionId;
      salon.registrationExpiryDate = periodEnd;
      salon.registrationDate = periodStart;
      salon.hasObtainedFreeTrial = 1;
      salon.subscriptionLatestPaymentStatus = status;
      await salon.save();
    } else {
      salon.hasObtainedFreeTrial = 1;
      salon.subscriptionLatestPaymentStatus = status;
      await salon.save();
    }

    input.salonDetailId = salon.id;
    input.subscriptionSource = 'stripe';
    // Apple fields should be null for Stripe subscriptions
    input.appleTransactionId = null;
    input.appleOriginalTransactionId = null;
    input.appleProductId = null;
    input.appleEnvironment = null;

    // Check if subscription record already exists
    const existingSubscription = await subscriptions.findOne({
      where: {
        salonDetailId: salon.id,
        subscriptionId: subscriptionId,
        subscriptionSource: 'stripe',
      },
    });

    if (existingSubscription) {
      // Update existing subscription with invoice data
      await existingSubscription.update(input);
      console.log(`✅ Updated subscription record with invoice: ${existingSubscription.id}`);
    } else {
      // Create new subscription record
      await subscriptions.create(input);
      console.log(`✅ Created new subscription record with invoice for salon: ${salon.id}`);
    }

    console.log(
      `Payment succeeded for user ${salon.salonName} with ID ${salon.id}, subscriptions ID: ${subscriptionId}`,
    );

    // Step 6: Update invoice metadata
    const updatedInvoice = await stripe.invoices.update(invoiceId, {
      metadata: {
        // Use the same metadata from the subscription here
        ...metadata,
      },
    });

    console.log('Updated Invoice Metadata:', updatedInvoice.metadata);

  } catch (error) {
    console.error('Error handling invoice.payment_succeeded:', error);
  }
};

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

exports.emailtesting = async (req, res, next) => {
  // If sent via a standard form (application/x-www-form-urlencoded)
  const htmlContentForm = req.body.htmlContent

  // If sent via JSON (application/json)
  const htmlContentJSON = req.body.htmlContent

  // Decide which one to use based on your client-side implementation
  const htmlContent = htmlContentForm || htmlContentJSON

  if (htmlContent) {
    console.log('Received HTML Content:')
    console.log(htmlContent)
  } else {
    res.status(400).send('No HTML content received.')
  }
  const data = DEMO(html)

  return res.status(200).json(response({ data: { data } }))
}


//====================================================================================================//


let connectEndpointSecret;

if (process.env.NODE_ENV === 'test') {
  connectEndpointSecret = process.env.connect_stage_signature
} else {
  connectEndpointSecret = process.env.connect_live_signature
}
console.log("ЁЯЪА ~ endpointSecret:", endpointSecret)
exports.stripeConnectWebhookEventHandler = async (req, res) => {
  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, sig, connectEndpointSecret);
    console.log('тЪая╕ПтЪая╕ПтЪая╕П Webhook signature verification DONE =====================>>>.')
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
case 'account.updated': {
  const account = event.data.object;

  const salon = await salonDetail.findOne({
    where: { connectAccountId: account.id },
    include: [
      {
        model: user,
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
  });

  if (!salon) break;

  // Always fetch tokens once
  const tokens = await deviceToken.findAll({
    where: { userId: salon.userId },
    attributes: ['tokenId'],
  });
  const tokenArray = tokens.map(t => t.tokenId);

  // 🔹 Check if payouts are paused/blocked
  if (account.payouts_enabled === false) {
    console.log('⚠️ Payouts are blocked for account:', account.id);
    
    // Update salon account status
    await salon.update({ accountConnected: false });

    // Get salon owner details for email
    const salonOwner = salon.user || await user.findByPk(salon.userId, {
      attributes: ['id', 'firstName', 'lastName', 'email'],
    });

    // Send push notification
    if (tokenArray.length > 0) {
      ThrowNotification(tokenArray, {
        title: 'Payouts Blocked',
        body: 'Your payouts have been temporarily paused. Please check your Stripe account for more details.',
      });
    }

            // Send email notification
            if (salonOwner?.email) {
              try {
                const emailData = {
                  firstName: salonOwner.firstName,
                  lastName: salonOwner.lastName,
                  email: salonOwner.email,
                  salonName: salon.salonName || 'Your Shop',
                  disabledReason: account.requirements?.disabled_reason || 'Account restrictions',
                };
                
                PayoutBlockedEmail(emailData);
                console.log('✅ Payout blocked email sent to:', salonOwner.email);
              } catch (emailError) {
                console.error('❌ Error sending payout blocked email:', emailError.message);
              }
            }

    // Log the event
    console.log('🚨 Payouts blocked for salon:', {
      salonId: salon.id,
      salonName: salon.salonName,
      connectAccountId: account.id,
      disabledReason: account.requirements?.disabled_reason,
    });
  }

  // Check for additional requirements
  if (account.requirements?.currently_due?.length > 0) {
    await salon.update({ accountConnected: false });

    const onboardingLink = await StripeHandler.createStripeAccountLink(account.id);

    ThrowNotification(tokenArray, {
      title: 'Action Required',
      body: 'Your payout account needs additional documents.',
      link: onboardingLink?.url,
    });
  }

  // Check if account is fully verified and payouts are enabled
  if (
    account.payouts_enabled === true &&
    account.requirements?.currently_due?.length === 0 &&
    !account.requirements?.disabled_reason
  ) {
    await salon.update({ accountConnected: true });
    ThrowNotification(tokenArray, {
      title: 'Account Verified',
      body: 'Your payout account is fully verified.',
    });
  }
  break;
}

      case 'capability.updated': {
        const capability = event.data.object;
        const accountId = event.account; // Connect account ID

        // Only handle payout capability changes
        if (capability.id === 'payouts') {
          const salon = await salonDetail.findOne({
            where: { connectAccountId: accountId },
            include: [
              {
                model: user,
                attributes: ['id', 'firstName', 'lastName', 'email'],
              },
            ],
          });

          if (!salon) break;

          // Fetch tokens for notifications
          const tokens = await deviceToken.findAll({
            where: { userId: salon.userId },
            attributes: ['tokenId'],
          });
          const tokenArray = tokens.map(t => t.tokenId);

          // Check if payout capability is inactive or pending
          if (capability.status === 'inactive' || capability.status === 'pending') {
            console.log('⚠️ Payout capability is inactive/pending for account:', accountId);

            // Update salon account status
            await salon.update({ accountConnected: false });

            // Get salon owner details
            const salonOwner = salon.user || await user.findByPk(salon.userId, {
              attributes: ['id', 'firstName', 'lastName', 'email'],
            });

            // Send push notification
            if (tokenArray.length > 0) {
              ThrowNotification(tokenArray, {
                title: 'Payouts Blocked',
                body: 'Your payouts have been temporarily paused. Please check your Stripe account for more details.',
              });
            }

            // Send email notification
            if (salonOwner?.email) {
              try {
                const emailData = {
                  firstName: salonOwner.firstName,
                  lastName: salonOwner.lastName,
                  email: salonOwner.email,
                  salonName: salon.salonName || 'Your Shop',
                  disabledReason: 'Capability restrictions',
                  capabilityStatus: capability.status === 'inactive' ? 'inactive' : 'pending verification',
                };
                
                PayoutBlockedEmail(emailData);
                console.log('✅ Payout capability blocked email sent to:', salonOwner.email);
              } catch (emailError) {
                console.error('❌ Error sending payout capability blocked email:', emailError.message);
              }
            }

            // Log the event
            console.log('🚨 Payout capability blocked for salon:', {
              salonId: salon.id,
              salonName: salon.salonName,
              connectAccountId: accountId,
              capabilityStatus: capability.status,
            });
          } else if (capability.status === 'active') {
            // Payouts are active - update account status
            await salon.update({ accountConnected: true });
            console.log('✅ Payout capability is active for salon:', salon.id);
          }
        }
        break;
      }

      case 'account.application.deauthorized':
        console.log('⚠️ Account disconnected:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('❌ Error in Connect webhook:', err);
    res.status(500).send('Webhook handler failed');
  }
};
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
