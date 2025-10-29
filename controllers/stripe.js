const { STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } = process.env;

const stripe = require('stripe')(STRIPE_SECRET_KEY)

const AppError = require("../utils/appError");
const dateManipulation = require("../utils/dateManipulation");

// Amount to Cents
function convertToCents(amount) {
  return Math.round(amount * 100);
}

//! Customers
/*
 *  1:  Create Customer ________________________
 */
async function addCustomer(name, email, accountId = null) {
  try {
    let customer;
    if (accountId) {
      customer = await stripe.customers.create(
        { name, email },
        { stripeAccount: accountId }
      );
    } else {
      customer = await stripe.customers.create({ name, email });
    }

    console.log("✅ Customer created:", customer.id);
    return customer.id;
  } catch (error) {
    console.error("❌ Stripe error:", error);
    throw new AppError(`${error.message}`, 200);
  }
}


async function getCustomer(customerId, accountId) {
  console.log("customerId===========================>>>>", customerId)
  try {
    const customer = await stripe.customers.retrieve(customerId, {
      stripeAccount: accountId,
    });
    if (customer && !customer.deleted) {
      console.log("✅ Found existing customer:", customer.id);
      return customer.id;
    }
  } catch (error) {
    console.error("❌ Stripe error:", error);
    //throw new AppError(`${error.message}`, 200);
  }
}


async function getPlatformAccountId() {
  try {
    const account = await stripe.accounts.retrieve()
    console.log('✅ Platform Account ID:', account.id)
    return account.id
  } catch (error) {
    console.error('❌ Failed to get platform account ID', error)
    throw error
  }
}

async function transferToPlatform(amountPounds, connectedAccountId, meta = {}) {
  try {
    const platformAccountId = await getPlatformAccountId();

    const transfer = await stripe.transfers.create(
      {
        amount: Math.round(amountPounds * 100),
        currency: "gbp",
        destination: platformAccountId,
        //description: `Booking #${meta.bookingId} | Salon: ${meta.salonName} (${meta.salonId}) | Customer: ${meta.customerName} (${meta.customerId})`,
        // metadata: {
        //   bookingId: meta.bookingId,
        //   salonId: meta.salonId,
        //   salonName: meta.salonName,
        //   customerName: meta.customerName,
        //   customerId: meta.customerId,
        // }
      },
      { stripeAccount: connectedAccountId }
    );

    return {
      transferId: transfer.id,
      transfer: transfer
    };
  } catch (error) {
    console.error("❌ transferToPlatform error:", error.message);
    throw new AppError(`${error.message}`, 200);
  }
}

/*
* Attach Meta Data to Transfer
*/
async function updateTransferMetadata(transferId, bookingId, connectedAccountId, meta = {}) {
  try {
    const updated = await stripe.transfers.update(transferId, {
      description: `Platform fee for booking ${bookingId}`,
      metadata: {
        bookingId: bookingId?.toString() || "",
        ...meta,
      },
    }, {
      stripeAccount: connectedAccountId
    });
    return updated;
  } catch (error) {
    console.error("❌ Stripe error (updateTransferMetadata):", error);
    throw new AppError(`${error.message}`, 200);
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
    } = data;
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      billing_details: { name: cardName },
      // customer: customerId, //We Can also Use This instead of Attach
      card: {
        number: cardNumber,
        exp_month: cardExpMonth,
        exp_year: cardExpYear,
        cvc: cardCVC,
      },
    });
    //   Attact payment Method to Customer (Alternate)
    const attachToCustomer = await stripe.paymentMethods.attach(
      paymentMethod.id,
      { customer: customerId }
    );

    return attachToCustomer.id;
  } catch (error) {
    throw new AppError(`${error.message}`, 200);
  }
}
//* attch Payment Method
async function attchPaymentMethod(paymentMethod, customerId) {
  console.log(
    "ðŸš€ ~ attchPaymentMethod ~ paymentMethod, customerId:",
    paymentMethod,
    customerId
  );
  try {
    //   Attact payment Method to Customer (Alternate)
    await stripe.paymentMethods.attach(paymentMethod, {
      customer: customerId,
    });
    return true;
  } catch (error) {
    console.error(`${error.message}`);
  }
}
/*
 *  1:  Create Payment method ________________________
 */
async function createPaymentMethod(paymentMethodToken) {
  try {
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        token: paymentMethodToken,
      },
    });

    const paymentMethodId = paymentMethod.id;

    return paymentMethodId;
  } catch (error) {
    throw new AppError(`${error.message} `, 200);
  }
}
/*
 * 2 :  Get All Card ________________________
 */

async function cards(customerId) {
  try {
    const paymentMethods = await stripe.customers.listPaymentMethods(
      customerId,
      { type: "card" }
    );
    return paymentMethods;
  } catch (error) {
    throw new AppError(`${error.message} `, 200);
  }
}

//* 2 :  Get All Card ________________________

async function fetchSingleCard(paymentMethodId, connectAccountId = null) {
  try {
    const options = connectAccountId ? { stripeAccount: connectAccountId } : undefined;
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId, options);
    return paymentMethod;
  } catch (error) {
    throw new AppError(`${error.message}`, 200);
  }
}
/*
 * 3 :  Detach Card ________________________
 */

async function cardDetach(paymentMethodId) {
  try {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
    return paymentMethod;
  } catch (error) {
    throw new AppError(`${error.message} `, 200);
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
  console.log('Ã°Å¸Å¡â‚¬ ~ amount:', amount)
  console.log('ÃƒÂ°Ã…Â¸Ã…Â¡Ã¢â€šÂ¬ ~ accountId:', accountId)
  console.log('ÃƒÂ°Ã…Â¸Ã…Â¡Ã¢â€šÂ¬ ~ customerId ====================================>>>>>>>>>>NEWNEW:', customerId)
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: convertToCents(amount + 0.50),
      currency: 'gbp',
      //customer: customerId,
      //payment_method: 'pm_1RpnnUCwrlf25ZndWHZGWJ3B',
      //confirm:true,
      setup_future_usage: 'off_session', // optional, only if you're saving card
      //application_fee_amount: 50, // platform fee
      payment_method_types: ['card'], // âœ… key fix
      transfer_data: {
        destination: accountId, // salon's connected account
      },
    })
    return paymentIntent
  } catch (error) {
    throw new AppError(`${error.message} `, 200)
  }
}

async function  createDirectCharge(amount, customerId, connectedAccountId) {
  console.log("connectedAccountId========Stripe===>", connectedAccountId)
  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: convertToCents(amount),
        currency: 'gbp',
        customer: customerId,
        setup_future_usage: 'off_session',
        payment_method_types: ['card'],
      },
      {
        stripeAccount: connectedAccountId,
      }
    );
    return paymentIntent;
  }
  catch (error) {
    throw new AppError(`${error.message} `, 200);
  }
}

async function  createOneTapePayment(amount, connectedAccountId) {
  console.log("createOneTapePayment--------------------connectedAccountId========Stripe===>", connectedAccountId)
  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: convertToCents(amount),
        currency: 'gbp',
        payment_method_types: ['card_present'],
      },
      {
        stripeAccount: connectedAccountId,
      }
    );
    return paymentIntent;
  }
  catch (error) {
    throw new AppError(`${error.message} `, 200);
  }
}

/*
 *  1:  Create PaymenIntend
 */
async function createPaymentIntend(amount, customerId, paymentMethodId) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: convertToCents(amount),
      currency: "gbp",
      payment_method: paymentMethodId,
      customer: customerId,
      capture_method: "manual",
    });
    //Confirm
    const confirmIntent = await stripe.paymentIntents.confirm(
      paymentIntent.id,
      { payment_method: paymentMethodId }
    );
    return confirmIntent.id;
  } catch (error) {
    throw new AppError(`${error.message} `, 200);
  }
}

/*
 *  2:  GET PaymenIntend
 */
async function paymenIntend(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentMethods.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    throw new AppError(`${error.message} `, 200);
  }
}

/*
 *  3:  Confirm PaymenIntend
 */
async function confirmIntend(paymentIntentId, paymentMethodId) {
  try {
    const confirmIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
    return confirmIntent;
  } catch (error) {
    throw new AppError(`${error.message} `, 200);
  }
}

/*
 *  4:  On counter offer I payment incremented Payment intent
 */
async function finalizePayment(total, paymentIntentId) {
  try {
    let amount = total * 100; // convert to cents
    amount = parseInt(amount);
    const paymentIntent = await stripe.paymentIntents.retrieve(
      `${paymentIntentId}`
    );
    if (!paymentIntent)
      throw new AppError("Intent Not Found", "Payment Not Confirmed Yet");
    //^ Case 1 ( Counter offer amount is Greater then the Actual Amount)
    if (amount > paymentIntent.amount) {
      let newAmount = amount - paymentIntent.amount;
      //Create a new intent
      const newPaymentIntent = await stripe.paymentIntents.create({
        amount: newAmount,
        currency: paymentIntent.currency,
        payment_method: paymentIntent.payment_method,
        customer: paymentIntent.customer,
        capture_method: "manual",
      });
      //confirm new payment intent
      const confirmNewIntent = await stripe.paymentIntents.confirm(
        newPaymentIntent.id,
        {
          payment_method: paymentIntent.payment_method,
        }
      );
      // Check if not confirmed
      if (confirmNewIntent.status === "requires_capture") {
        const capturePreIntent = await stripe.paymentIntents.capture(
          paymentIntent.id
        );
        const captureNewIntent = await stripe.paymentIntents.capture(
          confirmNewIntent.id
        );
        return {
          actual: capturePreIntent.id,
          increment: captureNewIntent.id,
          capturedAmount:
            (captureNewIntent.amount_received +
              capturePreIntent.amount_received) /
            100,
        };
      } else {
        throw new AppError(
          "Extra Payment Not Confirmed",
          "Counter Offer Not Accpeted"
        );
      }
    }
    //^ Case (  Counter offer amount is equal to Actual Amount)
    else if (amount === paymentIntent.amount) {
      const captureIntent = await stripe.paymentIntents.capture(
        paymentIntent.id
      );
      return {
        captureIntent: captureIntent.id,
        capturedAmount: captureIntent.amount_received / 100,
      };
    }
    //^ Case (  Counter offer amount is equal to Actual Amount)
    else if (amount < paymentIntent.amount) {
      const captureIntent = await stripe.paymentIntents.capture(
        paymentIntent.id,
        { amount_to_capture: amount }
      );
      const remainingToRefund =
        captureIntent.amount * 1 - captureIntent.amount_received * 1;
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntent.id,
        amount: remainingToRefund,
      });

      return {
        captureIntent: captureIntent.id,
        capturedAmount: captureIntent.amount_received / 100,
        refund: refund.amount / 100,
      };
    }
  } catch (error) {
    throw new AppError(`${error.message} `, 200);
  }
}

async function AllProducts(limit) {
  const products = await stripe.products.list({
    limit,
  });
  let listOfPlans = [];
  const productsWithPrices = await Promise.all(
    products.data.map(async (product) => {
      console.log("Ã°Å¸Å¡â‚¬ ~ exports.AllProducts= ~ product:", product);
      const prices = await stripe.prices.list({ product: product.id });
      const price = prices.data[0]; // Assume the first price is associated with the product
      if (!price) {
        //TODO Skip this product if there's no price (manage prices for each Product)
        return undefined;
      }
      console.log("Ã°Å¸Å¡â‚¬ ~ exports.AllProducts= ~ price:", prices);
      const features = product.features || [];
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: price?.unit_amount / 100,
        PriceId: price?.id,
        duration: price?.recurring.interval,
        features,
      };
    })
  );
  return productsWithPrices.filter((product) => product !== undefined);
}

async function createSubscription(
  customerId,
  priceId,
  trialDays,
  paymentMethodId
) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: trialDays,
    payment_method: paymentMethodId,
  });
  return subscription;
}

async function getSubscription(subscriptionPlan) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionPlan);
    console.log("ðŸš€ ~ getSubscription ~ subscription:", subscription);

    const product = await stripe.products.retrieve(subscription.plan.product);
    const prices = await stripe.prices.list({ product: product.id });
    const price = prices.data[0]; // Assume the first price is associated with the product
    // const features = product.features || []

    const paymentMethods = await stripe.customers.listPaymentMethods(
      subscription.customer,
      {
        limit: 3,
      }
    );
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
    };
  } catch (error) {
    console.log("Ã°Å¸Å¡â‚¬ ~ getSubscription ~ error:", error);
    return false;
  }
}


//Get Subscription Status
async function getSubscriptionStatus(subscriptionId) {
  console.log("Going into this -------------->", subscriptionId)
  if (!subscriptionId) return 'Unavailable';

  try {
    const stripeSub = await getSubscription(subscriptionId);
    console.log("stripeSub+++_+_+_+_+_+_+_++++++++++++++++++_________", stripeSub.status)
    return stripeSub?.status || 'Unavailable';
  } catch (e) {
    console.warn(`⚠️ Stripe fetch failed for ${subscriptionId}: ${e.message}`);
    return 'Unavailable';
  }
};


async function cancelSubscription(subscriptionPlan) {
  const subscription = await stripe.subscriptions.cancel(`${subscriptionPlan}`);
  return subscription;
}

async function updateSubscription(
  subscriptionId,
  newPriceId,
  customerId,
  paymentMethodId
) {
  if (paymentMethodId) {
    // Set the new payment method as the default for future invoices
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  // Retrieve the subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update subscription items with the new product
  const updatedItems = subscription.items.data.map((item) => ({
    id: item.id,
    price: newPriceId,
  }));

  // Save changes by updating the subscription
  const updatedSubscription = await stripe.subscriptions.update(
    subscriptionId,
    {
      items: updatedItems,
    }
  );

  console.log("Ã°Å¸Å¡â‚¬ ~ updatedSubscription:", updatedSubscription);
  return updatedSubscription;
}

async function subscriptionInvoices(subscriptionPlan) {
  console.log(
    "Ã°Å¸Å¡â‚¬ ~ subscriptionInvoices ~ subscriptionPlan:",
    subscriptionPlan
  );
  const subscription = await stripe.subscriptions.retrieve(subscriptionPlan);

  // Retrieve product details
  const product = await stripe.products.retrieve(subscription.plan.product);

  // Retrieve price details
  const prices = await stripe.prices.list({ product: product.id });
  const price = prices.data[0]; // Assume the first price is associated with the product

  // Retrieve payment methods associated with the customer
  const paymentMethods = await stripe.paymentMethods.list({
    customer: subscription.customer,
    type: "card",
    limit: 3,
  });

  // Retrieve invoice details
  const invoices = await stripe.invoices.list({
    subscription: subscriptionPlan,
    limit: 1, // Limit to retrieve only the latest invoice
  });

  // Extract invoice data
  console.log("Ã°Å¸Å¡â‚¬ ~ invoiceData ~ invoice.period_start:", invoices.data);
  const invoiceData = invoices.data.map((invoice) => ({
    startDate: dateManipulation.stampToDate(subscription.current_period_start), //TODO Study the invocies and start end dates how they work
    endDate: dateManipulation.stampToDate(subscription.current_period_end),
    deductedAmount: invoice.amount_paid / 100, // Amount is in cents, so divide by 100 to get dollars
    productName: product.name,
    price: price.unit_amount / 100,
    duration: price.recurring.interval,
    cardLastFourDigits: paymentMethods.data[0].card.last4,
  }));

  // Return the formatted subscription data
  return invoiceData;
}

//update Subscription
async function updateProduct(productId, name, description, features) {
  const updatedProduct = await stripe.products.update(productId, {
    name,
    description,
    features,
  });
  return updatedProduct;
}

async function createConnectAccount(email, country) {
  const account = await stripe.accounts.create({
    type: "express", // You can use 'express', 'standard', or 'custom' depending on your needs
    country: country, // The country code for the account
    email, // The email address of the account holder
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: "https://example.com/reauth",
    return_url:
      "https://backend.trimworldwide.com/StripeAccountSuccessfulScreen",
    type: "account_onboarding",
  });
  return { accountLink, accountId: account.id };
}

async function createCheckoutSession(line_items, accountId, applicationFee) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: line_items,
    mode: "payment",
    success_url: "https://example.com/success",
    cancel_url: "https://example.com/cancel",
    payment_intent_data: {
      application_fee_amount: applicationFee, // Fee amount in cents
      transfer_data: {
        destination: accountId, // Replace with the Connect account ID
      },
    },
  });
  // return session;
  return {
    url: session.url,
    total: session.amount_total,
    status: session.payment_status,
  };
}

// async function retrievePaymentMethod(paymentMethodId) {
//   const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
//   return paymentMethod.card;
// }

async function retrievePaymentMethod(paymentMethodId, connectedAccountId = null) {
  try {
    const options = connectedAccountId ? { stripeAccount: connectedAccountId } : {};
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId, options);
    console.log("paymentMethod-------------====================>>>", paymentMethod)
    return paymentMethod.card;
  } catch (error) {
    throw new AppError(`${error.message}`, 200);
  }
}

/*
 *  1:  Create PaymenIntend
 */
// async function capturePayment(amount, customerId, paymentMethodId, accountId) {
//   try {
//     console.log('Ã°Å¸Å¡â‚¬ ~ capturePayment ~ accountId:', accountId)
//     // Create a Payment Intent with the provided parameters
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: convertToCents(amount), // Convert amount to cents
//       currency: 'gbp',
//       payment_method: paymentMethodId,
//       customer: customerId,
//       capture_method: 'manual', // Payment needs to be captured manually
//       confirm: true, // Confirm the Payment Intent immediately
//       return_url: 'https://example.com/reauth',
//       transfer_data: {
//         destination: accountId, // Replace with the Connect account ID
//       },
//     })

//     const paymentIntents = await stripe.paymentIntents.capture(paymentIntent.id)
//     return paymentIntents
//   } catch (error) {
//     // Handle any errors that occur during the process
//     throw new AppError(`${error.message} `, 200)
//   }
// }

async function capturePayment(
  amount,
  customerId,
  paymentMethodId,
  accountId,
  booking,
  targetAmount,
) {
  try {
    console.log("🔌 capturePayment accountId:", accountId);
    console.log("Amount==================>>", amount);

    if (!amount || amount === 0) {
      throw new AppError("Amount is zero, nothing to process.", 200);
    }

    const stripeOptions = accountId ? { stripeAccount: accountId } : {};

    // CASE 1: 🔄 Charge customer (Direct charge to connected account)
    if (amount > 0) {
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: convertToCents(amount),
          currency: "gbp",
          customer: customerId,
          payment_method: paymentMethodId,
          capture_method: "manual",
          confirm: true,
          return_url: "https://example.com/reauth",
          description: `Penalty for No-Show Booking BK-${booking.id}`,
          metadata: {
            bookingId: booking.id,
            shopId: booking.salonDetailId,
            customerId: booking.customerId,
            payment_Type: "no-show",
          },
        },
        stripeOptions // ✅ run on behalf of connected account
      );

      const capturedIntent = await stripe.paymentIntents.capture(
        paymentIntent.id,
        {},
        stripeOptions // ✅ also capture from connected account's context
      );

      return capturedIntent;
    }

    // CASE 2: 💸 Refund to customer
    if (amount < 0) {
      const lastPaymentIntent =
        await getMatchingPaymentIntentForCustomer(customerId, targetAmount, accountId);

      if (!lastPaymentIntent) {
        throw new AppError("No previous payment found to refund.", 200);
      }

      const refund = await stripe.refunds.create(
        {
          payment_intent: lastPaymentIntent.id,
          amount: convertToCents(Math.abs(amount)),
          description: `Refund for No-Show Booking BK-${booking.id}`,
          metadata: {
            bookingId: booking.id,
            shopId: booking.salonDetailId,
            customerId: booking.customerId,
            payment_Type: "no-show",
          },
        },
        stripeOptions // ✅ refund scoped to connected account
      );

      return refund;
    }
  } catch (error) {
    throw new AppError(`${error.message} `, 200);
  }
}



async function getMatchingPaymentIntentForCustomer(customerId, targetAmount, connectAccountId) {
  const stripeOptions = connectAccountId ? { stripeAccount: connectAccountId } : {};

  const intents = await stripe.paymentIntents.list(
    {
      customer: customerId,
      limit: 10,
    },
    stripeOptions // ✅ Scoped to connected account
  );

  console.log("🔍 Matching PaymentIntents from Connect Account:", intents);

  const cents = convertToCents(targetAmount);

  const match = intents.data.find((intent) => {
    return (
      intent.status === "succeeded" &&
      intent.amount === cents &&
      !intent.charges?.data?.[0]?.refunded
    );
  });

  return match || null;
}


async function createStripeAccountLink(accountId) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: "https://example.com/reauth",
    return_url:
      "https://backend.trimworldwide.com/StripeAccountSuccessfulScreen",
    type: "account_onboarding",
  });
  return accountLink.url;
}

// create Ephemeral Key to open Stripe sheet on mobile app
async function createEphemeralKey(customerId, accountId) {
  const key = await stripe.ephemeralKeys.create(
    { customer: customerId },
    {
      apiVersion: '2022-11-15', // ✅ correct key
      stripeAccount: accountId,
    }
  );
  return key;
}


async function subscriptionsRetrieve(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log("Subscription created. Status is:", subscription);
    return subscription;
  } catch (error) {
    console.error(error);
    throw new AppError(`${error.message} `, 200);
  }
}

async function createSubscriptionWithPriceId(
  customerId,
  priceId,
  metadata,
  memberCount,
  trial_period_days,
  paymentMethodId
) {
  try {
    //  Attach a payment method to the customer using clientSecret (assuming client has already set this up)
    // Note: This step might actually involve the mobile client confirming the PaymentIntent or SetupIntent.
    // Here, we're assuming that the client has completed necessary front-end steps to authorize usage of the payment method.
    // Create a subscription using the provided priceId
    console.log(
      "Ã°Å¸Å¡â‚¬ ~~~~~~~~~~~~~~~~~ metadata:",
      customerId,
      priceId,
      metadata,
      memberCount,
      trial_period_days,
      paymentMethodId
    );

    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
      description: `Salon subscription purchase - SalonDetailId: ${metadata.salonDetailId || 'N/A'}`,
    });

    const input = {
      customer: customerId,
      items: [{ price: priceId, quantity: memberCount }],
      // payment_behavior: 'default_incomplete', // Ensures subscription awaits payment // used when create subscription then capture payment
      payment_behavior: "error_if_incomplete", //Automatically attempt to pay
      expand: ["latest_invoice.payment_intent"], // Retrieve payment intent details
      //automatic_tax: { enabled: true },
      metadata: metadata,
      default_payment_method: paymentMethodId, // Attach the default payment method
    };

    //  if their is a free trial then we can not get a seceret key because no payment captured i must need a payment method to proceed

    if (trial_period_days && trial_period_days > 0) {
      input.trial_period_days = trial_period_days;
    }

    const subscription = await stripe.subscriptions.create(input);

    const paymentIntent = subscription?.latest_invoice?.payment_intent;

    console.log("Ã°Å¸Å¡â‚¬ ~ paymentIntent?.status:", paymentIntent?.status);
    if (paymentIntent?.status === "requires_action") {
      // Handle additional authentication if required (e.g., 3D Secure)
      // This typically involves client-side handling
      console.log("Additional authentication required.");
    } else if (paymentIntent?.status === "succeeded") {
      console.log("Payment succeeded and subscription is active.");
    }

    return subscription;
  } catch (error) {
    console.error(error);
    throw new AppError(`${error.message} `, 200);
  }
}

// for web
async function upgradeDowngradeSubscriptionQuantity(
  subscriptionId,
  newQuantity
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
        proration_behavior: "create_prorations", // Adjust based on your proration needs
        expand: ["latest_invoice.payment_intent"],
      }
    );

    const paymentIntent = updatedSubscription.latest_invoice.payment_intent;

    console.log("Ã°Å¸Å¡â‚¬ ~ Updated Subscription:", updatedSubscription.id);
    console.log("Ã°Å¸Å¡â‚¬ ~ Payment Intent Status:", paymentIntent.status);

    if (paymentIntent.status === "requires_action") {
      // Handle additional authentication if required (e.g., 3D Secure)
      console.log("Additional authentication required.");
      // Frontend should handle the authentication using the client secret
    } else if (paymentIntent.status === "succeeded") {
      console.log("Payment succeeded and subscription is active.");
      // Update your database or notify the user as needed
    }

    return updatedSubscription;
  } catch (error) {
    console.error("Error updating subscription quantity:", error);
    throw new Error(`Failed to update subscription: ${error.message}`);
  }
}

async function sessionCheckoutPaymnet(amount, success_url, cancel_url) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: "Book appointment in salon.",
            },
            unit_amount: convertToCents(amount), // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: success_url,
      cancel_url: cancel_url,
    });

    return session;
  } catch (error) {
    throw new AppError(`${error.message}`, 200);
  }
}
// refund Payment
async function refundPartialPayment(paymentIntentId, amountToRefund, connectAccountId, metadata = null) {
  console.log("🚀 ~ refundPartialPayment ~ amountToRefund:", amountToRefund);
  try {
    const stripeOptions = connectAccountId ? { stripeAccount: connectAccountId } : {};

    // ✅ Retrieve PaymentIntent from connected account
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId,
      stripeOptions
    );
    console.log("⚡️ ~ paymentIntent:", JSON.stringify(paymentIntent));

    const chargeId = paymentIntent.latest_charge;
    if (!chargeId) throw new AppError("No charge found for PaymentIntent", 200);

    console.log("⚡️ ~ chargeId:", chargeId);

    const refundData = {
      charge: chargeId,
      amount: convertToCents(amountToRefund),
    };

    // Add metadata and description if provided
    if (metadata) {
      //refundData.description = metadata.description;
      refundData.metadata = metadata;
    }

    // ✅ Create refund in the context of the connected account
    const refund = await stripe.refunds.create(refundData, stripeOptions);

    console.log(`✅ Partial refund successful: ${amountToRefund}`, refund.id);
    return refund;
  } catch (error) {
    console.error("❌ refundPartialPayment error:", error);
    throw new AppError(`${error.message}`, 200);
  }
}



async function refundFullPayment(paymentIntentId, connectAccountId = null, metadata = null) {
  try {
    const stripeOptions = connectAccountId ? { stripeAccount: connectAccountId } : {};

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, stripeOptions);
    console.log("⚡ refundFullPayment ~ paymentIntent:", JSON.stringify(paymentIntent));

    const chargeId = paymentIntent.latest_charge;
    console.log("⚡ refundFullPayment ~ chargeId:", chargeId);

    const refundData = {
      charge: chargeId,
      amount: paymentIntent.amount,
    };

    // Add metadata if provided
    if (metadata) {
      refundData.metadata = metadata;
    }

    const refund = await stripe.refunds.create(refundData, stripeOptions); // ✅ refund within connected account context

    console.log(`✅ Full refund successful: ${paymentIntent.amount / 100}`, refund.id);
    return refund;
  } catch (error) {
    console.error("❌ refundFullPayment ~ error:", error);
    throw new AppError(`${error.message}`, 200);
  }
}


const getPriceById = async (priceId) => {
  try {
    const price = await stripe.prices.retrieve(priceId, {
      expand: ["tiers", "upsell.upsells_to", "upsell.upsells_to.tiers"],
    });
    return price;
  } catch (error) {
    console.error(`Error retrieving price with ID ${priceId}:`, error.message);
    throw error;
  }
};

const createTieredPrice = async (priceId) => {
  try {
    const price = await stripe.prices.create({
      currency: "gbp",
      product: productId,
      recurring: { interval: "month" },
      billing_scheme: "tiered",
      tiers_mode: "volume", // or 'graduated'
      tiers: [
        { up_to: 12, unit_amount: 2000 }, // Tier 1: Up to 12 members @ Ã‚Â£20 each
        { up_to: null, unit_amount: 25000 }, // Tier 2: 13+ members @ Ã‚Â£250 fixed
      ],
    });
    console.log("Created tiered price:", price.id);
    return price;
  } catch (error) {
    console.error("Error creating tiered price:", error);
    throw error;
  }
};

const setupIntent = async (customerId, accountId = null) => {
  try {
    const setupIntentData = {
      customer: customerId,
    };

    let setupIntent;
    if (accountId) {
      setupIntent = await stripe.setupIntents.create(setupIntentData, {
        stripeAccount: accountId
      });
    } else {
      setupIntent = await stripe.setupIntents.create(setupIntentData);
    }
    
    return setupIntent;
  } catch (error) {
    console.error("Error creating setup intent:", error);
    throw error;
  }
};

async function subscriptionUpgradeDowngrade(
  subscriptionId,
  newPriceId,
  newQuantity = 0,
  metadata = {},
  paymentMethodId = null
) {
  try {
    console.log("ðŸš€ ~ Updating subscription with parameters:", {
      subscriptionId,
      newPriceId,
      newQuantity,
      metadata,
      paymentMethodId,
    });

    // Retrieve the current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription) {
      throw new AppError("Subscription not found.", 404);
    }

    // Assuming there's only one subscription item. Adjust if multiple items exist.
    const subscriptionItemId = subscription?.items?.data[0]?.id;

    // Prepare the update parameters
    const updateParams = {
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
          quantity: newQuantity,
        },
      ],
      expand: ["latest_invoice.payment_intent"],
    };

    // Update metadata if provided
    if (Object.keys(metadata).length > 0) {
      updateParams.metadata = metadata;
    }

    // Update the payment method if provided
    if (paymentMethodId) {
      updateParams.default_payment_method = paymentMethodId;
    }

    // Determine proration behavior
    // 'create_prorations' will prorate the billing based on the time left in the billing cycle
    // 'none' will apply the change immediately without proration
    updateParams.proration_behavior = "create_prorations"; // or 'none' based on your preference

    // Update the subscription
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      updateParams
    );

    // console.log(
    //   'Subscription updated successfully:',
    //   JSON.stringify(updatedSubscription, null, 2),
    // )

    // Handle payment intent status
    const paymentIntent = updatedSubscription?.latest_invoice?.payment_intent;

    if (
      paymentIntent?.status === "requires_action" ||
      paymentIntent?.status === "requires_confirmation"
    ) {
      // Payment requires additional actions (e.g., 3D Secure)
      console.warn("Payment requires additional actions:", paymentIntent);
      // Notify the client to handle the next steps (e.g., redirect for authentication)
      // This could involve sending the client_secret to the frontend
    } else if (paymentIntent?.status === "succeeded") {
      console.log("Payment succeeded and subscription is updated.");
    } else {
      console.warn("Unhandled payment intent status:", paymentIntent?.status);
    }

    return updatedSubscription;
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw new AppError(`${error?.message}`, error?.statusCode || 200);
  }
}

async function isConnectAccountComplete(accountId) {
  try {
    const account = await stripe.accounts.retrieve(accountId);

    if (account.charges_enabled && account.payouts_enabled) {
      return true;
    }

    const { requirements } = account;

    if (!requirements) {
      return true;
    }

    const { currently_due, eventually_due, past_due } = requirements;

    if (
      (!currently_due || currently_due.length === 0) &&
      (!eventually_due || eventually_due.length === 0) &&
      (!past_due || past_due.length === 0)
    ) {
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error retrieving Stripe account ${accountId}:`, error);
    throw error;
  }
}

async function expireManually(subscription_id) {
  try {
    // Get the current date
    const currentDate = new Date();

    // Subtract 1 day from the current date (you can adjust this for a different period)
    const previousDate = new Date(currentDate);
    previousDate.setDate(currentDate.getDate() - 1); // 1 day before current date

    // Convert the previous date to a Unix timestamp in seconds
    const previousTimestamp = Math.floor(previousDate.getTime() / 1000);

    // Update the subscription with the expired date
    const expiredSubscription = await stripe.subscriptions.update(
      subscription_id, // Replace with your subscription ID
      {
        current_period_end: previousTimestamp, // Set to previous timestamp
      }
    );

    console.log("Subscription expired:", expiredSubscription);
    return false;
  } catch (error) {
    console.error(
      `Error retrieving Stripe subscription ${subscription_id}:`,
      error
    );
    throw new AppError(`${error.message}`, 200);
  }
}

async function updateSubscriptionPaymentMethod(
  customerId,
  newPaymentMethodId,
  subscriptionId
) {
  try {
    // // Step 1: Attach the new payment method to the customer
    // await stripe.paymentMethods.attach(newPaymentMethodId, {
    //   customer: customerId,
    // })

    // Step 2: Set the new payment method as the default for the customer
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: newPaymentMethodId,
      },
    });

    // Step 3: Update the subscription to use the new payment method
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        default_payment_method: newPaymentMethodId,
      }
    );

    // Optional: If you want to ensure the payment goes through immediately
    await stripe.subscriptions.update(subscriptionId, {
      billing_cycle_anchor: "now",
      proration_behavior: "create_prorations",
    });

    return updatedSubscription;
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw new AppError(`${error.message}`, 200);
  }
}

async function deleteCustomer(customerId, type) {
  try {
    if (!customerId) return 0;
    // First, retrieve the customer to get their subscriptions and cards
    if (type == "salon") {
      const customer = await stripe.customers.retrieve(customerId);

      // Cancel all subscriptions associated with the customer
      await Promise.all(
        customer.subscriptions.data.map(async (subscription) => {
          await stripe.subscriptions.del(subscription.id);
        })
      );
    }

    // Finally, delete the customer itself
    await stripe.customers.del(customerId);

    console.log(
      `Customer ${customerId} and associated subscriptions cancelled/deleted successfully`
    );
  } catch (error) {
    console.error(error);
    throw new AppError(`${error.message}`, 200);
  }
}

async function retrieveConnectAccount(accountId) {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return account;
  } catch (error) {
    console.error(error);
    throw new AppError(`${error.message}`, 200);
  }
}

async function createStripeLoginLink(accountId) {
  try {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return loginLink.url;
  } catch (error) {
    console.error("Error creating login link:", error);
    return null;
  }
}




// controllers/stripe.js
async function listInvoicesForSubscription(subscriptionId, limit = 30) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method'],
  });
  const item = sub.items.data[0];

  const invoices = await stripe.invoices.list({
    subscription: subscriptionId,
    limit,
    expand: ['data.payment_intent.payment_method'],
  });

  function formatDate(unix) {
    if (!unix) return null;
    const ts = typeof unix === 'string' ? parseInt(unix, 10) : unix;
    return new Date(ts * 1000).toISOString().split('T')[0];
  }

  return {
    invoices: invoices.data.map(inv => {
      const pm = inv.payment_intent?.payment_method;
      const card = pm?.card;

      return {
        id: inv.id,
        number: inv.number,
        status: inv.status,
        created: formatDate(inv.created),
        hostedInvoiceUrl: inv.hosted_invoice_url,
        invoicePdf: inv.invoice_pdf,
        amountPaid: (inv.amount_paid ?? 0) / 100,
        currency: (inv.currency || 'gbp').toUpperCase(),
        vatAmount: (inv.tax ?? 0) / 100,
        vatPercent: inv.total_tax_amounts?.[0]?.percentage ?? null,
        paymentMethodBrand: card?.brand || null,
        paymentMethodLast4: card?.last4 || null,
      };
    }),
  };
}


async function listSubscriptionsForCustomer(customerId, limit = 30) {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit,
    expand: ['data.items.data.price', 'data.latest_invoice'], // add latest_invoice too
  });

  const formatDate = (unix) => !unix ? null :
    new Date((typeof unix === 'string' ? parseInt(unix, 10) : unix) * 1000)
      .toISOString().split('T')[0];

  const results = [];

  for (const sub of subs.data) {
    const items = sub.items?.data ?? [];

    // Sum all item prices (unit_amount * quantity). Missing unit_amount => 0
    const totalUnitAmount = items.reduce((sum, it) => {
      const ua = it.price?.unit_amount ?? 0;   // in smallest currency unit
      const qty = it.quantity ?? 1;
      return sum + ua * qty;
    }, 0);

    // Optionally add latest invoice total as a fallback (covers tiered/metered)
    const latestInvoiceTotal = sub.latest_invoice?.total ?? null;

    // choose currency from first item (assuming same currency)
    const currency = items[0]?.price?.currency ?? sub.currency ?? 'gbp';

    // Decide what to expose as “priceUnitAmount”
    const priceUnitAmount = (totalUnitAmount > 0)
      ? totalUnitAmount
      : (latestInvoiceTotal ?? null); // fallback if unit_amounts are null

    // pick a display name
    const firstPrice = items[0]?.price;
    let productName = firstPrice?.nickname;
    if (!productName && firstPrice?.product) {
      try {
        const product = await stripe.products.retrieve(firstPrice.product);
        productName = product?.name || product?.metadata?.subscriptionName || 'Subscription';
      } catch (e) {
        productName = 'Subscription';
      }
    }

    results.push({
      id: sub.id,
      status: sub.status,
      planName: productName || 'Subscription',
      priceUnitAmount,               // still in cents; your controller divides by 100
      priceCurrency: currency,
      interval: firstPrice?.recurring?.interval,
      currentPeriodStart: formatDate(sub.current_period_start),
      currentPeriodEnd: formatDate(sub.current_period_end),
      teamSize: sub.metadata?.teamSize ?? null,
      VAT: sub.metadata?.VAT ?? null,
    });
  }

  return results;
}

/*
 *  Check The Connect Account Status
*/
async function checkStripeAccountStatus(connectAccountId) {
  try {
    const account = await stripe.accounts.retrieve(connectAccountId);

    const isConnected =
      account.charges_enabled &&
      account.payouts_enabled &&
      (!account.requirements?.disabled_reason) &&
      (account.requirements?.currently_due?.length === 0);

    return {
      isConnected,
      reason: account.requirements?.disabled_reason || null,
      currentlyDue: account.requirements?.currently_due || [],
    };
  } catch (err) {
    console.error("❌ Stripe account check failed:", err.message);
    return { isConnected: false, reason: "api_error" };
  }
}


/*
 * Update Booking Description
*/
async function updatePaymentIntentDescription(paymentIntentId, booking, connectAccountId) {
  try {
    const updated = await stripe.paymentIntents.update(
      paymentIntentId,
      {
        description: `Payment for Booking BK-${booking.id}`,
      },
      {
        stripeAccount: connectAccountId, // 👈 tells Stripe which account owns the PI
      }
    );
    console.log("✅ Description updated for PI:", updated.id, updated.description);
    return updated;
  } catch (err) {
    console.error("❌ Failed to update PaymentIntent description:", err.message);
    throw err;
  }
}
    
/*
 * Get Invoice History
*/
async function getInvoiceDetails(invoiceId) {
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);

    const lineItems = await stripe.invoiceItems.list({
      invoice: invoiceId,
    });

    const lineItemsData = lineItems.data.map(item => ({
      description: item.description,
      quantity: item.quantity,
      amount: item.amount / 100,
    }));

    return {
      invoiceNumber: invoice.number,
      amountDue: invoice.amount_due / 100,
      amountPaid: invoice.amount_paid / 100,
      amountRemaining: invoice.amount_remaining / 100,
      currency: invoice.currency,
      status: invoice.status,
      customerId: invoice.customer,
      billingReason: invoice.billing_reason,
      subscriptionId: invoice.subscription,
      lineItems: lineItemsData,
      paymentMethod: invoice.payment_method,
      receiptNumber: invoice.receipt_number,
      created: new Date(invoice.created * 1000).toISOString(),
      dueDate: new Date(invoice.due_date * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    throw new AppError('Failed to fetch invoice details');
  }
}

//! Terminal
/*
 *  1:  Create Connection Token ________________________
 */
async function createConnectionToken(connectAccountId, locationId ='tml_GP5oQgqIvzs3VW') {
  try {
    const tokenParams = {};
    
    // Only include location parameter in live mode
    if (locationId) {
      tokenParams.location = locationId;
    }
    
    const token = await stripe.terminal.connectionTokens.create(
      tokenParams,
      {
        stripeAccount: connectAccountId, // Pass the connected account ID here
      }
    );
    console.log("✅ Connection token created successfully");
    return token.secret;
  } catch (error) {
    console.error("❌ Stripe Terminal error:", error);
    throw new AppError(`${error.message}`, 200);
  }
}

async function getTerminalLocation(
  locationId='tml_GP5oQgqIvzs3VW',
  stripeAccount=null
) {
  console.log("getTerminalLocation--------------------locationId========Stripe===>", locationId)
  console.log("getTerminalLocation--------------------stripeAccount========Stripe===>", stripeAccount)
  try {
    // If using Connect, pass { stripeAccount } as the 3rd arg
    const location = await stripe.terminal.locations.retrieve(
      locationId,
      { stripeAccount }
    );
    return { ok: true, data: location };
  } catch (err) {
    return {
      ok: false,
      status: err.statusCode ?? 500,
      code: err.code,
      message: err.message,
    };
  }
}


module.exports = {
  createStripeLoginLink,
  retrieveConnectAccount,
  updateSubscriptionPaymentMethod,
  sessionCheckoutPaymnet,
  // customer
  deleteCustomer,
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
  expireManually,
  fetchSingleCard,
  createDirectCharge,
  getCustomer,
  getPlatformAccountId,
  getSubscriptionStatus,
  transferToPlatform,
  listInvoicesForSubscription,
  listSubscriptionsForCustomer,
  checkStripeAccountStatus,
  updateTransferMetadata,
  updatePaymentIntentDescription,
  getInvoiceDetails,
  createConnectionToken,
  createOneTapePayment,
  getTerminalLocation
};
// sessionCheckoutPaymnet --- check payment destination
// sessionCheckoutPaymnet --- check payment destination
