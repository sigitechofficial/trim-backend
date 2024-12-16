const { STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } = process.env
const stripe = require('stripe')(STRIPE_SECRET_KEY)
const AppError = require('../utils/appError')
const dateManipulation = require('../utils/dateManipulation')

// Amount to Cents
function convertToCents(amount) {
  return Math.round(amount * 100)
}

//! Customers
/*
 *  1:  Create Customer ________________________
 */
async function addCustomer(name, email) {
  try {
    const customer = await stripe.customers.create({ name, email })
    console.log('ðŸš€ ~ addCustomer ~ customer:', customer.id)
    return customer.id
  } catch (error) {
    console.error(error)
    throw new AppError(`${error.message} `, 200)
  }
}

//! Cards ____________________________________________________________________________
/*
 *  1:  Create Card ________________________
 */
async function addCard(data) {
  try {
    const {
      customerId,
      cardName,
      cardExpYear,
      cardExpMonth,
      cardNumber,
      cardCVC,
    } = data
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      billing_details: { name: cardName },
      // customer: customerId, //We Can also Use This instead of Attach
      card: {
        number: cardNumber,
        exp_month: cardExpMonth,
        exp_year: cardExpYear,
        cvc: cardCVC,
      },
    })
    //   Attact payment Method to Customer (Alternate)
    const attachToCustomer = await stripe.paymentMethods.attach(
      paymentMethod.id,
      { customer: customerId },
    )

    return attachToCustomer.id
  } catch (error) {
    throw new AppError(`${error.message}`, 200)
  }
}
//* attch Payment Method
async function attchPaymentMethod(paymentMethod, customerId) {
  try {
    //   Attact payment Method to Customer (Alternate)
    await stripe.paymentMethods.attach(paymentMethod, {
      customer: customerId,
    })
    return true
  } catch (error) {
    console.error(`${error.message}`)
  }
}
/*
 *  1:  Create Payment method ________________________
 */
async function createPaymentMethod(paymentMethodToken) {
  try {
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: paymentMethodToken,
      },
    })

    const paymentMethodId = paymentMethod.id

    return paymentMethodId
  } catch (error) {
    throw new AppError(`${error.message} `, 200)
  }
}
/*
 * 2 :  Get All Card ________________________
 */

async function cards(customerId) {
  try {
    const paymentMethods = await stripe.customers.listPaymentMethods(
      customerId,
      { type: 'card' },
    )
    return paymentMethods
  } catch (error) {
    throw new AppError(`${error.message} `, 200)
  }
}
/*
 * 3 :  Detach Card ________________________
 */

async function cardDetach(paymentMethodId) {
  try {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId)
    return paymentMethod
  } catch (error) {
    throw new AppError(`${error.message} `, 200)
  }
}

//! PaymenIntend _______________________________________________________

/*
 *  1:  Create PaymenIntend for Upfront Payments
 */
async function createPaymentIntendForUpFrontPayments(
  amount,
  customerId,
  accountId,
) {
  console.log('ðŸš€ ~ accountId:', accountId)
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: convertToCents(amount),
      currency: 'gbp', //Specify British pounds (GBP)  as the currency
      //setup_future_usage: 'off_session',
      customer: customerId,
      // capture_method: "manual",
      automatic_payment_methods: {
        enabled: true,
      },
      transfer_data: {
        destination: accountId, // Replace with the Connect account ID
      },
    })

    return paymentIntent
  } catch (error) {
    throw new AppError(`${error.message} `, 200)
  }
}

/*
 *  1:  Create PaymenIntend
 */
async function createPaymentIntend(amount, customerId, paymentMethodId) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: convertToCents(amount),
      currency: 'usd',
      payment_method: paymentMethodId,
      customer: customerId,
      capture_method: 'manual',
    })
    //Confirm
    const confirmIntent = await stripe.paymentIntents.confirm(
      paymentIntent.id,
      { payment_method: paymentMethodId },
    )
    return confirmIntent.id
  } catch (error) {
    throw new AppError(`${error.message} `, 200)
  }
}

/*
 *  2:  GET PaymenIntend
 */
async function paymenIntend(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentMethods.retrieve(paymentIntentId)
    return paymentIntent
  } catch (error) {
    throw new AppError(`${error.message} `, 200)
  }
}

/*
 *  3:  Confirm PaymenIntend
 */
async function confirmIntend(paymentIntentId, paymentMethodId) {
  try {
    const confirmIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    })
    return confirmIntent
  } catch (error) {
    throw new AppError(`${error.message} `, 200)
  }
}

/*
 *  4:  On counter offer I payment incremented Payment intent
 */
async function finalizePayment(total, paymentIntentId) {
  try {
    let amount = total * 100 // convert to cents
    amount = parseInt(amount)
    const paymentIntent = await stripe.paymentIntents.retrieve(
      `${paymentIntentId}`,
    )
    if (!paymentIntent)
      throw new AppError('Intent Not Found', 'Payment Not Confirmed Yet')
    //^ Case 1 ( Counter offer amount is Greater then the Actual Amount)
    if (amount > paymentIntent.amount) {
      let newAmount = amount - paymentIntent.amount
      //Create a new intent
      const newPaymentIntent = await stripe.paymentIntents.create({
        amount: newAmount,
        currency: paymentIntent.currency,
        payment_method: paymentIntent.payment_method,
        customer: paymentIntent.customer,
        capture_method: 'manual',
      })
      //confirm new payment intent
      const confirmNewIntent = await stripe.paymentIntents.confirm(
        newPaymentIntent.id,
        {
          payment_method: paymentIntent.payment_method,
        },
      )
      // Check if not confirmed
      if (confirmNewIntent.status === 'requires_capture') {
        const capturePreIntent = await stripe.paymentIntents.capture(
          paymentIntent.id,
        )
        const captureNewIntent = await stripe.paymentIntents.capture(
          confirmNewIntent.id,
        )
        return {
          actual: capturePreIntent.id,
          increment: captureNewIntent.id,
          capturedAmount:
            (captureNewIntent.amount_received +
              capturePreIntent.amount_received) /
            100,
        }
      } else {
        throw new AppError(
          'Extra Payment Not Confirmed',
          'Counter Offer Not Accpeted',
        )
      }
    }
    //^ Case (  Counter offer amount is equal to Actual Amount)
    else if (amount === paymentIntent.amount) {
      const captureIntent = await stripe.paymentIntents.capture(
        paymentIntent.id,
      )
      return {
        captureIntent: captureIntent.id,
        capturedAmount: captureIntent.amount_received / 100,
      }
    }
    //^ Case (  Counter offer amount is equal to Actual Amount)
    else if (amount < paymentIntent.amount) {
      const captureIntent = await stripe.paymentIntents.capture(
        paymentIntent.id,
        { amount_to_capture: amount },
      )
      const remainingToRefund =
        captureIntent.amount * 1 - captureIntent.amount_received * 1
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntent.id,
        amount: remainingToRefund,
      })

      return {
        captureIntent: captureIntent.id,
        capturedAmount: captureIntent.amount_received / 100,
        refund: refund.amount / 100,
      }
    }
  } catch (error) {
    throw new AppError(`${error.message} `, 200)
  }
}

async function AllProducts(limit) {
  const products = await stripe.products.list({
    limit,
  })
  let listOfPlans = []
  const productsWithPrices = await Promise.all(
    products.data.map(async (product) => {
      console.log('ðŸš€ ~ exports.AllProducts= ~ product:', product)
      const prices = await stripe.prices.list({ product: product.id })
      const price = prices.data[0] // Assume the first price is associated with the product
      if (!price) {
        //TODO Skip this product if there's no price (manage prices for each Product)
        return undefined
      }
      console.log('ðŸš€ ~ exports.AllProducts= ~ price:', prices)
      const features = product.features || []
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: price?.unit_amount / 100,
        PriceId: price?.id,
        duration: price?.recurring.interval,
        features,
      }
    }),
  )
  return productsWithPrices.filter((product) => product !== undefined)
}

async function createSubscription(
  customerId,
  priceId,
  trialDays,
  paymentMethodId,
) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: trialDays,
    payment_method: paymentMethodId,
  })
  return subscription
}

async function getSubscription(subscriptionPlan) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionPlan)

    const product = await stripe.products.retrieve(subscription.plan.product)
    const prices = await stripe.prices.list({ product: product.id })
    const price = prices.data[0] // Assume the first price is associated with the product
    // const features = product.features || []

    const paymentMethods = await stripe.customers.listPaymentMethods(
      subscription.customer,
      {
        limit: 3,
      },
    )
    // return subscription
    return {
      id: subscription.id,
      status: subscription.status,
      name: product.name,
      description: product.description,
      price: price.unit_amount / 100,
      PriceId: price.id,
      duration: price.recurring.interval,
      paymentMethods: paymentMethods?.data[0]?.card?.last4,
      expire: subscription.current_period_end,
      metaData: subscription.metadata,
    }
  } catch (error) {
    console.log('ðŸš€ ~ getSubscription ~ error:', error)
    return false
  }
}

async function cancelSubscription(subscriptionPlan) {
  const subscription = await stripe.subscriptions.cancel(`${subscriptionPlan}`)
  return subscription
}

async function updateSubscription(
  subscriptionId,
  newPriceId,
  customerId,
  paymentMethodId,
) {
  if (paymentMethodId) {
    // Set the new payment method as the default for future invoices
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })
  }

  // Retrieve the subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Update subscription items with the new product
  const updatedItems = subscription.items.data.map((item) => ({
    id: item.id,
    price: newPriceId,
  }))

  // Save changes by updating the subscription
  const updatedSubscription = await stripe.subscriptions.update(
    subscriptionId,
    {
      items: updatedItems,
    },
  )

  console.log('ðŸš€ ~ updatedSubscription:', updatedSubscription)
  return updatedSubscription
}

async function subscriptionInvoices(subscriptionPlan) {
  console.log(
    'ðŸš€ ~ subscriptionInvoices ~ subscriptionPlan:',
    subscriptionPlan,
  )
  const subscription = await stripe.subscriptions.retrieve(subscriptionPlan)

  // Retrieve product details
  const product = await stripe.products.retrieve(subscription.plan.product)

  // Retrieve price details
  const prices = await stripe.prices.list({ product: product.id })
  const price = prices.data[0] // Assume the first price is associated with the product

  // Retrieve payment methods associated with the customer
  const paymentMethods = await stripe.paymentMethods.list({
    customer: subscription.customer,
    type: 'card',
    limit: 3,
  })

  // Retrieve invoice details
  const invoices = await stripe.invoices.list({
    subscription: subscriptionPlan,
    limit: 1, // Limit to retrieve only the latest invoice
  })

  // Extract invoice data
  console.log('ðŸš€ ~ invoiceData ~ invoice.period_start:', invoices.data)
  const invoiceData = invoices.data.map((invoice) => ({
    startDate: dateManipulation.stampToDate(subscription.current_period_start), //TODO Study the invocies and start end dates how they work
    endDate: dateManipulation.stampToDate(subscription.current_period_end),
    deductedAmount: invoice.amount_paid / 100, // Amount is in cents, so divide by 100 to get dollars
    productName: product.name,
    price: price.unit_amount / 100,
    duration: price.recurring.interval,
    cardLastFourDigits: paymentMethods.data[0].card.last4,
  }))

  // Return the formatted subscription data
  return invoiceData
}

//update Subscription
async function updateProduct(productId, name, description, features) {
  const updatedProduct = await stripe.products.update(productId, {
    name,
    description,
    features,
  })
  return updatedProduct
}

async function createConnectAccount(email, country) {
  const account = await stripe.accounts.create({
    type: 'express', // You can use 'express', 'standard', or 'custom' depending on your needs
    country: country, // The country code for the account
    email, // The email address of the account holder
    capabilities: {
      transfers: { requested: true },
    },
  })

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: 'https://example.com/reauth',
    return_url:
      'https://backend.trimworldwide.com/StripeAccountSuccessfulScreen',
    type: 'account_onboarding',
  })
  return { accountLink, accountId: account.id }
}

async function createCheckoutSession(line_items, accountId, applicationFee) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: line_items,
    mode: 'payment',
    success_url: 'https://example.com/success',
    cancel_url: 'https://example.com/cancel',
    payment_intent_data: {
      application_fee_amount: applicationFee, // Fee amount in cents
      transfer_data: {
        destination: accountId, // Replace with the Connect account ID
      },
    },
  })
  // return session;
  return {
    url: session.url,
    total: session.amount_total,
    status: session.payment_status,
  }
}

async function retrievePaymentMethod(paymentMethodId) {
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
  return paymentMethod.card
}

/*
 *  1:  Create PaymenIntend
 */
async function capturePayment(amount, customerId, paymentMethodId, accountId) {
  try {
    console.log('ðŸš€ ~ capturePayment ~ accountId:', accountId)
    // Create a Payment Intent with the provided parameters
    const paymentIntent = await stripe.paymentIntents.create({
      amount: convertToCents(amount), // Convert amount to cents
      currency: 'gbp',
      payment_method: paymentMethodId,
      customer: customerId,
      capture_method: 'manual', // Payment needs to be captured manually
      confirm: true, // Confirm the Payment Intent immediately
      return_url: 'https://example.com/reauth',
      transfer_data: {
        destination: accountId, // Replace with the Connect account ID
      },
    })

    const paymentIntents = await stripe.paymentIntents.capture(paymentIntent.id)
    return paymentIntents
  } catch (error) {
    // Handle any errors that occur during the process
    throw new AppError(`${error.message} `, 200)
  }
}

async function createStripeAccountLink(accountId) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: 'https://example.com/reauth',
    return_url:
      'https://backend.trimworldwide.com/StripeAccountSuccessfulScreen',
    type: 'account_onboarding',
  })
  return accountLink.url
}

// create Ephemeral Key to open Stripe sheet on mobile app
async function createEphemeralKey(customerId, stripe_version) {
  const key = await stripe.ephemeralKeys.create(
    { customer: customerId },
    {
      apiVersion: '2020-08-27', //stripe_version
    },
  )
  return key
}

async function subscriptionsRetrieve(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    console.log('Subscription created. Status is:', subscription)
    return subscription
  } catch (error) {
    console.error(error)
    throw new AppError(`${error.message} `, 200)
  }
}

async function createSubscriptionWithPriceId(
  customerId,
  priceId,
  metadata,
  memberCount,
  trial_period_days,
  paymentMethodId,
) {
  try {
    //  Attach a payment method to the customer using clientSecret (assuming client has already set this up)
    // Note: This step might actually involve the mobile client confirming the PaymentIntent or SetupIntent.
    // Here, we're assuming that the client has completed necessary front-end steps to authorize usage of the payment method.
    // Create a subscription using the provided priceId
    console.log(
      'ðŸš€ ~~~~~~~~~~~~~~~~~ metadata:',
      customerId,
      priceId,
      metadata,
      memberCount,
      trial_period_days,
      paymentMethodId,
    )

    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    const input = {
      customer: customerId,
      items: [{ price: priceId, quantity: memberCount }],
      // payment_behavior: 'default_incomplete', // Ensures subscription awaits payment // used when create subscription then capture payment
      payment_behavior: 'error_if_incomplete', //Automatically attempt to pay
      expand: ['latest_invoice.payment_intent'], // Retrieve payment intent details
      metadata: metadata,
      default_payment_method: paymentMethodId, // Attach the default payment method
    }

    //  if their is a free trial then we can not get a seceret key because no payment captured i must need a payment method to proceed

    if (trial_period_days && trial_period_days > 0) {
      input.trial_period_days = trial_period_days
    }

    const subscription = await stripe.subscriptions.create(input)

    const paymentIntent = subscription?.latest_invoice?.payment_intent

    console.log('ðŸš€ ~ paymentIntent?.status:', paymentIntent?.status)
    if (paymentIntent?.status === 'requires_action') {
      // Handle additional authentication if required (e.g., 3D Secure)
      // This typically involves client-side handling
      console.log('Additional authentication required.')
    } else if (paymentIntent?.status === 'succeeded') {
      console.log('Payment succeeded and subscription is active.')
    }

    return subscription
  } catch (error) {
    console.error(error)
    throw new AppError(`${error.message} `, 200)
  }
}

// for web
async function upgradeDowngradeSubscriptionQuantity(
  subscriptionId,
  newQuantity,
) {
  try {
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            // Assumes there's only one subscription item. If multiple, adjust accordingly.
            id: (await stripe.subscriptions.retrieve(subscriptionId)).items
              .data[0].id,
            quantity: newQuantity,
          },
        ],
        proration_behavior: 'create_prorations', // Adjust based on your proration needs
        expand: ['latest_invoice.payment_intent'],
      },
    )

    const paymentIntent = updatedSubscription.latest_invoice.payment_intent

    console.log('ðŸš€ ~ Updated Subscription:', updatedSubscription.id)
    console.log('ðŸš€ ~ Payment Intent Status:', paymentIntent.status)

    if (paymentIntent.status === 'requires_action') {
      // Handle additional authentication if required (e.g., 3D Secure)
      console.log('Additional authentication required.')
      // Frontend should handle the authentication using the client secret
    } else if (paymentIntent.status === 'succeeded') {
      console.log('Payment succeeded and subscription is active.')
      // Update your database or notify the user as needed
    }

    return updatedSubscription
  } catch (error) {
    console.error('Error updating subscription quantity:', error)
    throw new Error(`Failed to update subscription: ${error.message}`)
  }
}

async function sessionCheckoutPaymnet(amount, success_url, cancel_url) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Book appointment in salon.',
            },
            unit_amount: convertToCents(amount), // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url,
      cancel_url: cancel_url,
    })

    return session
  } catch (error) {
    throw new AppError(`${error.message}`, 200)
  }
}
// refund Payment
async function refundPartialPayment(paymentIntentId, amountToRefund) {
  try {
    // Retrieve the PaymentIntent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    console.log(
      'ðŸš€ ~ refundPartialPayment ~ paymentIntent:',
      JSON.stringify(paymentIntent),
    )

    // Get the Charge ID from the PaymentIntent
    const chargeId = paymentIntent.latest_charge
    console.log('ðŸš€ ~ refundPartialPayment ~ chargeId:', chargeId)

    // Create a partial refund for the charge
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: convertToCents(amountToRefund), // Amount in the smallest currency unit
    })

    console.log(`Partial refund successful:${amountToRefund}`, refund.id)
    return refund
  } catch (error) {
    console.log('ðŸš€ ~ refundPartialPayment ~ error:', error)
    throw new AppError(`${error.message}`, 200)
  }
}

async function refundFullPayment(paymentIntentId) {
  try {
    // Retrieve the PaymentIntent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    console.log(
      'ðŸš€ ~ refundFullPayment ~ paymentIntent:',
      JSON.stringify(paymentIntent),
    )

    // Get the Charge ID from the PaymentIntent
    const chargeId = paymentIntent.latest_charge
    console.log('ðŸš€ ~ refundFullPayment ~ chargeId:', chargeId)

    // Create a full refund for the charge
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: paymentIntent.amount, // Full amount of the PaymentIntent in the smallest currency unit
    })

    console.log(
      `Full refund successful: ${paymentIntent.amount / 100}`,
      refund.id,
    )
    return refund
  } catch (error) {
    console.log('ðŸš€ ~ refundFullPayment ~ error:', error)
    throw new AppError(`${error.message}`, 200)
  }
}

const getPriceById = async (priceId) => {
  try {
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['tiers', 'upsell.upsells_to', 'upsell.upsells_to.tiers'],
    })
    return price
  } catch (error) {
    console.error(`Error retrieving price with ID ${priceId}:`, error.message)
    throw error
  }
}

const createTieredPrice = async (priceId) => {
  try {
    const price = await stripe.prices.create({
      currency: 'gbp',
      product: productId,
      recurring: { interval: 'month' },
      billing_scheme: 'tiered',
      tiers_mode: 'volume', // or 'graduated'
      tiers: [
        { up_to: 12, unit_amount: 2000 }, // Tier 1: Up to 12 members @ Â£20 each
        { up_to: null, unit_amount: 25000 }, // Tier 2: 13+ members @ Â£250 fixed
      ],
    })
    console.log('Created tiered price:', price.id)
    return price
  } catch (error) {
    console.error('Error creating tiered price:', error)
    throw error
  }
}

const setupIntent = async (customerId) => {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
    })
    return setupIntent
  } catch (error) {
    console.error('Error creating tiered price:', error)
    throw error
  }
}

async function subscriptionUpgradeDowngrade(
  subscriptionId,
  newPriceId,
  newQuantity = 0,
  metadata = {},
  paymentMethodId = null,
) {
  try {
    console.log('🚀 ~ Updating subscription with parameters:', {
      subscriptionId,
      newPriceId,
      newQuantity,
      metadata,
      paymentMethodId,
    })

    // Retrieve the current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    if (!subscription) {
      throw new AppError('Subscription not found.', 404)
    }

    // Assuming there's only one subscription item. Adjust if multiple items exist.
    const subscriptionItemId = subscription?.items?.data[0]?.id

    // Prepare the update parameters
    const updateParams = {
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
          quantity: newQuantity,
        },
      ],
      expand: ['latest_invoice.payment_intent'],
    }

    // Update metadata if provided
    if (Object.keys(metadata).length > 0) {
      updateParams.metadata = metadata
    }

    // Update the payment method if provided
    if (paymentMethodId) {
      updateParams.default_payment_method = paymentMethodId
    }

    // Determine proration behavior
    // 'create_prorations' will prorate the billing based on the time left in the billing cycle
    // 'none' will apply the change immediately without proration
    updateParams.proration_behavior = 'create_prorations' // or 'none' based on your preference

    // Update the subscription
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      updateParams,
    )

    // console.log(
    //   'Subscription updated successfully:',
    //   JSON.stringify(updatedSubscription, null, 2),
    // )

    // Handle payment intent status
    const paymentIntent = updatedSubscription?.latest_invoice?.payment_intent

    if (
      paymentIntent?.status === 'requires_action' ||
      paymentIntent?.status === 'requires_confirmation'
    ) {
      // Payment requires additional actions (e.g., 3D Secure)
      console.warn('Payment requires additional actions:', paymentIntent)
      // Notify the client to handle the next steps (e.g., redirect for authentication)
      // This could involve sending the client_secret to the frontend
    } else if (paymentIntent?.status === 'succeeded') {
      console.log('Payment succeeded and subscription is updated.')
    } else {
      console.warn('Unhandled payment intent status:', paymentIntent?.status)
    }

    return updatedSubscription
  } catch (error) {
    console.error('Error updating subscription:', error)
    throw new AppError(`${error?.message}`, error?.statusCode || 200)
  }
}

async function isConnectAccountComplete(accountId) {
  try {
    const account = await stripe.accounts.retrieve(accountId)

    if (account.charges_enabled && account.payouts_enabled) {
      return true
    }

    const { requirements } = account

    if (!requirements) {
      return true
    }

    const { currently_due, eventually_due, past_due } = requirements

    if (
      (!currently_due || currently_due.length === 0) &&
      (!eventually_due || eventually_due.length === 0) &&
      (!past_due || past_due.length === 0)
    ) {
      return true
    }

    return false
  } catch (error) {
    console.error(`Error retrieving Stripe account ${accountId}:`, error)
    throw error
  }
}
module.exports = {
  sessionCheckoutPaymnet,
  // customer
  addCustomer,
  // payment Mehtods
  addCard,
  createPaymentMethod,
  cards,
  cardDetach,
  // payment Intents
  createPaymentIntend,
  createPaymentIntendForUpFrontPayments,
  paymenIntend,
  confirmIntend,
  finalizePayment,
  //Products & Subscription Plans
  AllProducts,
  createSubscription,
  getSubscription,
  cancelSubscription,
  updateSubscription,
  subscriptionInvoices,
  updateProduct,
  createConnectAccount,
  createCheckoutSession,
  retrievePaymentMethod,
  capturePayment,
  createStripeAccountLink,
  createEphemeralKey,
  createSubscriptionWithPriceId,
  subscriptionUpgradeDowngrade,
  isConnectAccountComplete,
  subscriptionsRetrieve,
  attchPaymentMethod,
  refundPartialPayment,
  refundFullPayment,
  getPriceById,
  createTieredPrice,
  setupIntent,
}
// sessionCheckoutPaymnet --- check payment destination
// sessionCheckoutPaymnet --- check payment destination
