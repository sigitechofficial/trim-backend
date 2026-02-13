require('dotenv').config();
const { Op, literal } = require('sequelize');
const { salonDetail, user, subscriptions } = require('../../models');

// RevenueCat webhook authorization secret
const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;

/**
 * Verify RevenueCat webhook authorization
 */
const verifyRevenueCatWebhook = (req) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  if (token !== REVENUECAT_WEBHOOK_SECRET) {
    throw new Error('Invalid webhook authorization');
  }

  return true;
};

/**
 * Calculate period end date based on period type
 */
const calculatePeriodEnd = (startDate, periodType) => {
  const endDate = new Date(startDate);
  
  switch (periodType?.toUpperCase()) {
    case 'NORMAL':
    case 'MONTHLY':
    case 'MONTH':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'ANNUAL':
    case 'YEARLY':
    case 'YEAR':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    case 'WEEKLY':
    case 'WEEK':
      endDate.setDate(endDate.getDate() + 7);
      break;
    case 'TRIAL':
      endDate.setDate(endDate.getDate() + 30);
      break;
    default:
      endDate.setMonth(endDate.getMonth() + 1);
  }
  
  return endDate;
};

/**
 * Find user by RevenueCat app_user_id
 * RevenueCat app_user_id can be:
 * 1. User ID (if set via RevenueCat SDK identify())
 * 2. Email (if set via RevenueCat SDK identify())
 * 3. Anonymous ID ($RCAnonymousID:...) - in this case, we look up by existing subscription
 * 4. Aliases - check if user has any subscription with this RevenueCat user ID
 */
const findUserByAppUserId = async (appUserId, event = null) => {
  try {
    // Skip if it's an anonymous ID and we'll look it up via subscription
    const isAnonymousId = appUserId && appUserId.startsWith('$RCAnonymousID:');
    
    // Try by user ID (if app_user_id is set to actual user ID)
    if (!isAnonymousId) {
      let salonUser = await user.findOne({
        where: { id: appUserId },
        attributes: ['id', 'email', 'stripeCustomerId'],
      });

      // Try by email
      if (!salonUser) {
        salonUser = await user.findOne({
          where: { email: appUserId },
          attributes: ['id', 'email', 'stripeCustomerId'],
        });
      }

      if (salonUser) {
        return salonUser;
      }
    }

    // If anonymous ID or not found, try to find by existing subscription with this RevenueCat user ID
    // This handles cases where user purchased before we set app_user_id
    const existingSubscription = await subscriptions.findOne({
      where: {
        revenueCatUserId: appUserId,
        subscriptionSource: 'revenuecat',
      },
      include: [
        {
          model: salonDetail,
          attributes: ['userId'],
          include: [
            {
              model: user,
              attributes: ['id', 'email', 'stripeCustomerId'],
            },
          ],
        },
      ],
    });

    if (existingSubscription?.salonDetail?.user) {
      console.log(`✅ Found user via existing subscription for RevenueCat ID: ${appUserId}`);
      return existingSubscription.salonDetail.user;
    }

    // Also check aliases if provided in event
    if (event?.aliases && Array.isArray(event.aliases)) {
      for (const alias of event.aliases) {
        if (alias && !alias.startsWith('$RCAnonymousID:')) {
          // Try to find by this alias (could be user ID or email)
          let salonUser = await user.findOne({
            where: { id: alias },
            attributes: ['id', 'email', 'stripeCustomerId'],
          });

          if (!salonUser) {
            salonUser = await user.findOne({
              where: { email: alias },
              attributes: ['id', 'email', 'stripeCustomerId'],
            });
          }

          if (salonUser) {
            console.log(`✅ Found user via alias: ${alias}`);
            return salonUser;
          }
        }
      }
    }

    // Check original_app_user_id if available
    if (event?.original_app_user_id && !event.original_app_user_id.startsWith('$RCAnonymousID:')) {
      let salonUser = await user.findOne({
        where: { id: event.original_app_user_id },
        attributes: ['id', 'email', 'stripeCustomerId'],
      });

      if (!salonUser) {
        salonUser = await user.findOne({
          where: { email: event.original_app_user_id },
          attributes: ['id', 'email', 'stripeCustomerId'],
        });
      }

      if (salonUser) {
        console.log(`✅ Found user via original_app_user_id: ${event.original_app_user_id}`);
        return salonUser;
      }
    }

    // Last resort: Try to find by original_transaction_id in existing subscriptions
    // This helps when user has made previous purchases
    if (event?.original_transaction_id) {
      const subscriptionByTransaction = await subscriptions.findOne({
        where: {
          revenueCatOriginalTransactionId: event.original_transaction_id,
          subscriptionSource: 'revenuecat',
        },
        include: [
          {
            model: salonDetail,
            attributes: ['userId'],
            include: [
              {
                model: user,
                attributes: ['id', 'email', 'stripeCustomerId'],
              },
            ],
          },
        ],
      });

      if (subscriptionByTransaction?.salonDetail?.user) {
        console.log(`✅ Found user via original_transaction_id: ${event.original_transaction_id}`);
        return subscriptionByTransaction.salonDetail.user;
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding user by app_user_id:', error);
    return null;
  }
};

/**
 * Extract VAT from event metadata or subscriber attributes
 */
const extractVAT = (event) => {
  try {
    // Check event metadata
    if (event.subscriber_attributes?.VAT?.value) {
      return parseFloat(event.subscriber_attributes.VAT.value);
    }
    
    // Check event data
    if (event.vat_amount) {
      return parseFloat(event.vat_amount) / 100; // If in cents
    }
    
    return 0;
  } catch (error) {
    return 0;
  }
};

/**
 * Main RevenueCat webhook handler
 */
exports.revenueCatWebhookHandler = async (req, res) => {
  try {
    // Verify webhook authorization
    verifyRevenueCatWebhook(req);
    
    const webhookPayload = req.body;
    const event = webhookPayload.event; // Extract the event object from nested structure
    
    console.log('📦 RevenueCat Webhook Event Received');
    console.log('📦 Event Type:', event?.type);
    console.log('📦 Event Data:', JSON.stringify(webhookPayload, null, 2));

    if (!event || !event.type) {
      console.warn('⚠️ Invalid webhook payload - missing event or event.type');
      return res.status(200).json({ received: false, error: 'Invalid payload' });
    }

    // Handle different event types
    switch (event.type) {
      case 'INITIAL_PURCHASE':
        await handleInitialPurchase(event);
        break;
      
      case 'RENEWAL':
        await handleRenewal(event);
        break;
      
      case 'CANCELLATION':
        await handleCancellation(event);
        break;
      
      case 'EXPIRATION':
        await handleExpiration(event);
        break;
      
      case 'BILLING_ISSUE':
        await handleBillingIssue(event);
        break;
      
      case 'PRODUCT_CHANGE':
        await handleProductChange(event);
        break;
      
      case 'SUBSCRIPTION_PAUSED':
        await handleSubscriptionPaused(event);
        break;
      
      case 'UNCANCELLATION':
        await handleUncancellation(event);
        break;
      
      default:
        console.log(`⚠️ Unhandled RevenueCat event type: ${event.type}`);
    }

    // Always return 200 immediately
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ RevenueCat webhook error:', error.message);
    res.status(200).json({ received: false, error: error.message });
  }
};

/**
 * Handle INITIAL_PURCHASE - New subscription created
 */
const handleInitialPurchase = async (event) => {
  try {
    const { 
      app_user_id, 
      product_id, 
      price, 
      price_in_purchased_currency,
      currency, 
      period_type, 
      purchased_at_ms,
      store,
      entitlement_id,
      subscriber_attributes
    } = event;
    
    console.log('🆕 Initial Purchase Event:', {
      app_user_id,
      product_id,
      price,
      currency,
      period_type,
      purchased_at_ms
    });

    // Find user
    const salonUser = await findUserByAppUserId(app_user_id, event);
    if (!salonUser) {
      console.warn(`⚠️ User not found for app_user_id: ${app_user_id}`);
      console.warn(`⚠️ Event aliases: ${JSON.stringify(event.aliases)}`);
      console.warn(`⚠️ Original app_user_id: ${event.original_app_user_id}`);
      return;
    }

    // Find salon details
    const salon = await salonDetail.findOne({
      where: { userId: salonUser.id },
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
      console.warn(`⚠️ Salon not found for user: ${salonUser.id}`);
      return;
    }

    // Calculate period dates
    const periodStart = new Date(purchased_at_ms);
    const periodEnd = calculatePeriodEnd(periodStart, period_type);

    // Extract VAT
    const vatAmount = extractVAT(event);

    // Prepare subscription data
    const subscriptionData = {
      salonDetailId: salon.id,
      subscriptionId: product_id || entitlement_id,
      customerId: salonUser.id.toString(),
      subscriptionSource: 'revenuecat',
      status: 'payment_succeeded',
      name: product_id || entitlement_id,
      periodStart: periodStart,
      periodEnd: periodEnd,
      currency: currency || 'gbp',
      amountPaid: price_in_purchased_currency 
        ? price_in_purchased_currency / 100 
        : (price ? price / 100 : 0),
      invoice: null,
      invoiceId: null,
      priceId: product_id,
      VAT: vatAmount,
      // RevenueCat fields
      revenueCatUserId: app_user_id,
      revenueCatOriginalTransactionId: event.original_transaction_id || null,
      revenueCatStore: store || null,
      // Set Apple/Stripe fields to null
      appleTransactionId: null,
      appleOriginalTransactionId: null,
      appleProductId: null,
      appleEnvironment: null,
    };

    // Update salon details
    salon.approvedByAdmin = true;
    salon.subscriptionPlan = product_id || entitlement_id;
    salon.registrationExpiryDate = periodEnd;
    salon.registrationDate = periodStart;
    salon.hasObtainedFreeTrial = 1;
    salon.subscriptionLatestPaymentStatus = 'payment_succeeded';
    await salon.save();

    // Check if subscription already exists
    const existingSubscription = await subscriptions.findOne({
      where: {
        salonDetailId: salon.id,
        subscriptionId: product_id || entitlement_id,
        subscriptionSource: 'revenuecat',
      },
    });

    if (existingSubscription) {
      await existingSubscription.update(subscriptionData);
      console.log(`✅ Updated subscription record: ${existingSubscription.id}`);
    } else {
      await subscriptions.create(subscriptionData);
      console.log(`✅ Created new subscription record for salon: ${salon.id}`);
    }

    console.log(`✅ Initial purchase processed for salon ${salon.salonName} (ID: ${salon.id})`);
  } catch (error) {
    console.error('❌ Error handling INITIAL_PURCHASE:', error);
  }
};

/**
 * Handle RENEWAL - Subscription renewed
 */
const handleRenewal = async (event) => {
  try {
    const { 
      app_user_id, 
      product_id, 
      price, 
      price_in_purchased_currency,
      currency, 
      period_type, 
      purchased_at_ms,
      store,
      entitlement_id
    } = event;
    
    console.log('🔄 Renewal Event:', { app_user_id, product_id, price });

    // Find salon
    const salonUser = await findUserByAppUserId(app_user_id);
    if (!salonUser) {
      console.warn(`⚠️ User not found for app_user_id: ${app_user_id}`);
      return;
    }

    const salon = await salonDetail.findOne({
      where: { userId: salonUser.id },
      attributes: ['id', 'subscriptionPlan', 'registrationExpiryDate', 'salonName'],
    });

    if (!salon) {
      console.warn(`⚠️ Salon not found for user: ${salonUser.id}`);
      return;
    }

    // Calculate new period
    const periodStart = new Date(purchased_at_ms);
    const periodEnd = calculatePeriodEnd(periodStart, period_type);

    // Extract VAT
    const vatAmount = extractVAT(event);

    // Prepare subscription data
    const subscriptionData = {
      salonDetailId: salon.id,
      subscriptionId: product_id || entitlement_id,
      customerId: salonUser.id.toString(),
      subscriptionSource: 'revenuecat',
      status: 'payment_succeeded',
      name: product_id || entitlement_id,
      periodStart: periodStart,
      periodEnd: periodEnd,
      currency: currency || 'gbp',
      amountPaid: price_in_purchased_currency 
        ? price_in_purchased_currency / 100 
        : (price ? price / 100 : 0),
      invoice: null,
      invoiceId: null,
      priceId: product_id,
      VAT: vatAmount,
      revenueCatUserId: app_user_id,
      revenueCatOriginalTransactionId: event.original_transaction_id || null,
      revenueCatStore: store || null,
      appleTransactionId: null,
      appleOriginalTransactionId: null,
      appleProductId: null,
      appleEnvironment: null,
    };

    // Update salon
    salon.registrationExpiryDate = periodEnd;
    salon.registrationDate = periodStart;
    salon.subscriptionLatestPaymentStatus = 'payment_succeeded';
    salon.approvedByAdmin = true;
    await salon.save();

    // Create or update subscription record
    const existingSubscription = await subscriptions.findOne({
      where: {
        salonDetailId: salon.id,
        subscriptionId: product_id || entitlement_id,
        subscriptionSource: 'revenuecat',
      },
    });

    if (existingSubscription) {
      await existingSubscription.update(subscriptionData);
      console.log(`✅ Updated renewal subscription record: ${existingSubscription.id}`);
    } else {
      await subscriptions.create(subscriptionData);
      console.log(`✅ Created renewal subscription record for salon: ${salon.id}`);
    }

    console.log(`✅ Renewal processed for salon ${salon.salonName}`);
  } catch (error) {
    console.error('❌ Error handling RENEWAL:', error);
  }
};

/**
 * Handle CANCELLATION - Subscription cancelled
 */
const handleCancellation = async (event) => {
  try {
    const { app_user_id, product_id, entitlement_id } = event;
    
    console.log('🚫 Cancellation Event:', { app_user_id, product_id });

    const salonUser = await findUserByAppUserId(app_user_id);
    if (!salonUser) {
      console.warn(`⚠️ User not found for app_user_id: ${app_user_id}`);
      return;
    }

    const salon = await salonDetail.findOne({
      where: { userId: salonUser.id },
      attributes: ['id', 'salonName', 'subscriptionPlan'],
    });

    if (!salon) {
      console.warn(`⚠️ Salon not found for user: ${salonUser.id}`);
      return;
    }

    // Don't revoke access immediately - let it expire naturally
    salon.subscriptionLatestPaymentStatus = 'cancelled';
    await salon.save();

    // Update subscription record if exists
    const subscriptionId = product_id || entitlement_id;
    const existingSubscription = await subscriptions.findOne({
      where: {
        salonDetailId: salon.id,
        subscriptionId: subscriptionId,
        subscriptionSource: 'revenuecat',
      },
    });

    if (existingSubscription) {
      existingSubscription.status = 'cancelled';
      await existingSubscription.save();
      console.log(`✅ Updated subscription status to cancelled: ${existingSubscription.id}`);
    }

    console.log(`✅ Cancellation processed for salon ${salon.salonName}`);
  } catch (error) {
    console.error('❌ Error handling CANCELLATION:', error);
  }
};

/**
 * Handle EXPIRATION - Subscription expired (revoke access)
 */
const handleExpiration = async (event) => {
  try {
    const { app_user_id, product_id, entitlement_id } = event;
    
    console.log('⏰ Expiration Event:', { app_user_id, product_id });

    const salonUser = await findUserByAppUserId(app_user_id);
    if (!salonUser) {
      console.warn(`⚠️ User not found for app_user_id: ${app_user_id}`);
      return;
    }

    const salon = await salonDetail.findOne({
      where: { userId: salonUser.id },
      attributes: ['id', 'salonName', 'approvedByAdmin'],
    });

    if (!salon) {
      console.warn(`⚠️ Salon not found for user: ${salonUser.id}`);
      return;
    }

    // Revoke access
    salon.approvedByAdmin = false;
    salon.subscriptionLatestPaymentStatus = 'expired';
    await salon.save();

    // Update subscription record
    const subscriptionId = product_id || entitlement_id;
    const existingSubscription = await subscriptions.findOne({
      where: {
        salonDetailId: salon.id,
        subscriptionId: subscriptionId,
        subscriptionSource: 'revenuecat',
      },
    });

    if (existingSubscription) {
      existingSubscription.status = 'expired';
      await existingSubscription.save();
      console.log(`✅ Updated subscription status to expired: ${existingSubscription.id}`);
    }

    console.log(`✅ Expiration processed - access revoked for salon ${salon.salonName}`);
  } catch (error) {
    console.error('❌ Error handling EXPIRATION:', error);
  }
};

/**
 * Handle BILLING_ISSUE - Payment failed
 */
const handleBillingIssue = async (event) => {
  try {
    const { app_user_id, product_id, entitlement_id } = event;
    
    console.log('💳 Billing Issue Event:', { app_user_id, product_id });

    const salonUser = await findUserByAppUserId(app_user_id);
    if (!salonUser) {
      console.warn(`⚠️ User not found for app_user_id: ${app_user_id}`);
      return;
    }

    const salon = await salonDetail.findOne({
      where: { userId: salonUser.id },
      attributes: ['id', 'salonName'],
    });

    if (!salon) {
      console.warn(`⚠️ Salon not found for user: ${salonUser.id}`);
      return;
    }

    salon.subscriptionLatestPaymentStatus = 'payment_failed';
    await salon.save();

    // Update subscription record
    const subscriptionId = product_id || entitlement_id;
    const existingSubscription = await subscriptions.findOne({
      where: {
        salonDetailId: salon.id,
        subscriptionId: subscriptionId,
        subscriptionSource: 'revenuecat',
      },
    });

    if (existingSubscription) {
      existingSubscription.status = 'payment_failed';
      await existingSubscription.save();
      console.log(`✅ Updated subscription status to payment_failed: ${existingSubscription.id}`);
    }

    console.log(`✅ Billing issue processed for salon ${salon.salonName}`);
  } catch (error) {
    console.error('❌ Error handling BILLING_ISSUE:', error);
  }
};

/**
 * Handle PRODUCT_CHANGE - Customer changed subscription tier
 */
const handleProductChange = async (event) => {
  try {
    const { 
      app_user_id, 
      product_id, 
      price, 
      price_in_purchased_currency,
      currency, 
      period_type, 
      purchased_at_ms,
      store,
      entitlement_id
    } = event;
    
    console.log('🔄 Product Change Event:', { app_user_id, product_id });

    const salonUser = await findUserByAppUserId(app_user_id);
    if (!salonUser) {
      console.warn(`⚠️ User not found for app_user_id: ${app_user_id}`);
      return;
    }

    const salon = await salonDetail.findOne({
      where: { userId: salonUser.id },
      attributes: ['id', 'salonName', 'subscriptionPlan'],
    });

    if (!salon) {
      console.warn(`⚠️ Salon not found for user: ${salonUser.id}`);
      return;
    }

    const periodStart = new Date(purchased_at_ms);
    const periodEnd = calculatePeriodEnd(periodStart, period_type);
    const vatAmount = extractVAT(event);

    const subscriptionData = {
      salonDetailId: salon.id,
      subscriptionId: product_id || entitlement_id,
      customerId: salonUser.id.toString(),
      subscriptionSource: 'revenuecat',
      status: 'payment_succeeded',
      name: product_id || entitlement_id,
      periodStart: periodStart,
      periodEnd: periodEnd,
      currency: currency || 'gbp',
      amountPaid: price_in_purchased_currency 
        ? price_in_purchased_currency / 100 
        : (price ? price / 100 : 0),
      priceId: product_id,
      VAT: vatAmount,
      revenueCatUserId: app_user_id,
      revenueCatOriginalTransactionId: event.original_transaction_id || null,
      revenueCatStore: store || null,
      appleTransactionId: null,
      appleOriginalTransactionId: null,
      appleProductId: null,
      appleEnvironment: null,
    };

    // Update salon
    salon.subscriptionPlan = product_id || entitlement_id;
    salon.registrationExpiryDate = periodEnd;
    salon.registrationDate = periodStart;
    salon.subscriptionLatestPaymentStatus = 'payment_succeeded';
    salon.approvedByAdmin = true;
    await salon.save();

    // Create or update subscription
    const existingSubscription = await subscriptions.findOne({
      where: {
        salonDetailId: salon.id,
        subscriptionId: product_id || entitlement_id,
        subscriptionSource: 'revenuecat',
      },
    });

    if (existingSubscription) {
      await existingSubscription.update(subscriptionData);
      console.log(`✅ Updated product change subscription: ${existingSubscription.id}`);
    } else {
      await subscriptions.create(subscriptionData);
      console.log(`✅ Created product change subscription for salon: ${salon.id}`);
    }

    console.log(`✅ Product change processed for salon ${salon.salonName}`);
  } catch (error) {
    console.error('❌ Error handling PRODUCT_CHANGE:', error);
  }
};

/**
 * Handle SUBSCRIPTION_PAUSED
 */
const handleSubscriptionPaused = async (event) => {
  try {
    const { app_user_id, product_id } = event;
    
    console.log('⏸️ Subscription Paused Event:', { app_user_id, product_id });

    const salonUser = await findUserByAppUserId(app_user_id);
    if (!salonUser) {
      console.warn(`⚠️ User not found for app_user_id: ${app_user_id}`);
      return;
    }

    const salon = await salonDetail.findOne({
      where: { userId: salonUser.id },
      attributes: ['id', 'salonName'],
    });

    if (!salon) {
      console.warn(`⚠️ Salon not found for user: ${salonUser.id}`);
      return;
    }

    salon.subscriptionLatestPaymentStatus = 'paused';
    await salon.save();

    console.log(`✅ Subscription paused for salon ${salon.salonName}`);
  } catch (error) {
    console.error('❌ Error handling SUBSCRIPTION_PAUSED:', error);
  }
};

/**
 * Handle UNCANCELLATION - Subscription reactivated
 */
const handleUncancellation = async (event) => {
  try {
    const { 
      app_user_id, 
      product_id, 
      price, 
      price_in_purchased_currency,
      currency, 
      period_type, 
      purchased_at_ms,
      entitlement_id
    } = event;
    
    console.log('✅ Uncancellation Event:', { app_user_id, product_id });

    const salonUser = await findUserByAppUserId(app_user_id);
    if (!salonUser) {
      console.warn(`⚠️ User not found for app_user_id: ${app_user_id}`);
      return;
    }

    const salon = await salonDetail.findOne({
      where: { userId: salonUser.id },
      attributes: ['id', 'salonName'],
    });

    if (!salon) {
      console.warn(`⚠️ Salon not found for user: ${salonUser.id}`);
      return;
    }

    const periodStart = new Date(purchased_at_ms);
    const periodEnd = calculatePeriodEnd(periodStart, period_type);
    const vatAmount = extractVAT(event);

    const subscriptionData = {
      salonDetailId: salon.id,
      subscriptionId: product_id || entitlement_id,
      customerId: salonUser.id.toString(),
      subscriptionSource: 'revenuecat',
      status: 'payment_succeeded',
      name: product_id || entitlement_id,
      periodStart: periodStart,
      periodEnd: periodEnd,
      currency: currency || 'gbp',
      amountPaid: price_in_purchased_currency 
        ? price_in_purchased_currency / 100 
        : (price ? price / 100 : 0),
      priceId: product_id,
      VAT: vatAmount,
      revenueCatUserId: app_user_id,
      revenueCatOriginalTransactionId: event.original_transaction_id || null,
      appleTransactionId: null,
      appleOriginalTransactionId: null,
      appleProductId: null,
      appleEnvironment: null,
    };

    // Reactivate salon
    salon.approvedByAdmin = true;
    salon.subscriptionPlan = product_id || entitlement_id;
    salon.registrationExpiryDate = periodEnd;
    salon.registrationDate = periodStart;
    salon.subscriptionLatestPaymentStatus = 'payment_succeeded';
    await salon.save();

    // Create or update subscription
    const existingSubscription = await subscriptions.findOne({
      where: {
        salonDetailId: salon.id,
        subscriptionId: product_id || entitlement_id,
        subscriptionSource: 'revenuecat',
      },
    });

    if (existingSubscription) {
      await existingSubscription.update(subscriptionData);
      console.log(`✅ Updated uncancellation subscription: ${existingSubscription.id}`);
    } else {
      await subscriptions.create(subscriptionData);
      console.log(`✅ Created uncancellation subscription for salon: ${salon.id}`);
    }

    console.log(`✅ Uncancellation processed for salon ${salon.salonName}`);
  } catch (error) {
    console.error('❌ Error handling UNCANCELLATION:', error);
  }
};

