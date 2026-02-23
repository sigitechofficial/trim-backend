require('dotenv').config();
const { Op, literal } = require('sequelize');
const axios = require('axios');
const { salonDetail, user, subscriptions } = require('../../models');

// RevenueCat webhook authorization secret
const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;
// RevenueCat API key for fetching product prices
const REVENUECAT_SECRET_API_KEY = process.env.REVENUECAT_SECRET_API_KEY;

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
 * Find salon by salonDetailId from subscriber attributes or RevenueCat app_user_id
 * Priority:
 * 1. Check subscriber_attributes for salonDetailId (sent by frontend)
 * 2. Try to find by app_user_id (could be salonDetailId, user ID, email, or anonymous ID)
 * 3. Look up by existing subscription with RevenueCat user ID
 */
const findSalonByAppUserId = async (appUserId, event = null) => {
  try {
    // First, check if salonDetailId is in subscriber_attributes (sent by frontend)
    if (event?.subscriber_attributes?.salonDetailId?.value) {
      const salonDetailId = event.subscriber_attributes.salonDetailId.value;
      const salon = await salonDetail.findOne({
        where: { id: salonDetailId },
        attributes: [
          'id',
          'userId',
          'registrationDate',
          'salonName',
          'approvedByAdmin',
          'subscriptionPlan',
          'registrationExpiryDate',
          'subscriptionLatestPaymentStatus',
        ],
        include: [
          {
            model: user,
            attributes: ['id', 'email', 'stripeCustomerId'],
          },
        ],
      });

      if (salon) {
        console.log(`✅ Found salon via subscriber_attributes.salonDetailId: ${salonDetailId}`);
        return salon;
      }
    }

    // Try to find salon by app_user_id if it's a salonDetailId (numeric)
    if (appUserId && !isNaN(appUserId) && !appUserId.startsWith('$RCAnonymousID:')) {
      const salon = await salonDetail.findOne({
        where: { id: appUserId },
        attributes: [
          'id',
          'userId',
          'registrationDate',
          'salonName',
          'approvedByAdmin',
          'subscriptionPlan',
          'registrationExpiryDate',
          'subscriptionLatestPaymentStatus',
        ],
        include: [
          {
            model: user,
            attributes: ['id', 'email', 'stripeCustomerId'],
          },
        ],
      });

      if (salon) {
        console.log(`✅ Found salon by app_user_id (salonDetailId): ${appUserId}`);
        return salon;
      }
    }

    // If anonymous ID or not found, try to find by existing subscription with this RevenueCat user ID
    const existingSubscription = await subscriptions.findOne({
      where: {
        revenueCatUserId: appUserId,
        subscriptionSource: 'revenuecat',
      },
      include: [
        {
          model: salonDetail,
          attributes: [
            'id',
            'userId',
            'registrationDate',
            'salonName',
            'approvedByAdmin',
            'subscriptionPlan',
            'registrationExpiryDate',
            'subscriptionLatestPaymentStatus',
          ],
          include: [
            {
              model: user,
              attributes: ['id', 'email', 'stripeCustomerId'],
            },
          ],
        },
      ],
    });

    if (existingSubscription?.salonDetail) {
      console.log(`✅ Found salon via existing subscription for RevenueCat ID: ${appUserId}`);
      return existingSubscription.salonDetail;
    }

    // Also check aliases if provided in event
    if (event?.aliases && Array.isArray(event.aliases)) {
      for (const alias of event.aliases) {
        if (alias && !alias.startsWith('$RCAnonymousID:')) {
          // Try to find by this alias (could be salonDetailId)
          if (!isNaN(alias)) {
            const salon = await salonDetail.findOne({
              where: { id: alias },
              attributes: [
                'id',
                'userId',
                'registrationDate',
                'salonName',
                'approvedByAdmin',
                'subscriptionPlan',
                'registrationExpiryDate',
                'subscriptionLatestPaymentStatus',
              ],
              include: [
                {
                  model: user,
                  attributes: ['id', 'email', 'stripeCustomerId'],
                },
              ],
            });

            if (salon) {
              console.log(`✅ Found salon via alias (salonDetailId): ${alias}`);
              return salon;
            }
          }
        }
      }
    }

    // Check original_app_user_id if available
    if (event?.original_app_user_id && !event.original_app_user_id.startsWith('$RCAnonymousID:')) {
      if (!isNaN(event.original_app_user_id)) {
        const salon = await salonDetail.findOne({
          where: { id: event.original_app_user_id },
          attributes: [
            'id',
            'userId',
            'registrationDate',
            'salonName',
            'approvedByAdmin',
            'subscriptionPlan',
            'registrationExpiryDate',
            'subscriptionLatestPaymentStatus',
          ],
          include: [
            {
              model: user,
              attributes: ['id', 'email', 'stripeCustomerId'],
            },
          ],
        });

        if (salon) {
          console.log(`✅ Found salon via original_app_user_id (salonDetailId): ${event.original_app_user_id}`);
          return salon;
        }
      }
    }

    // Last resort: Try to find by original_transaction_id in existing subscriptions
    if (event?.original_transaction_id) {
      const subscriptionByTransaction = await subscriptions.findOne({
        where: {
          revenueCatOriginalTransactionId: event.original_transaction_id,
          subscriptionSource: 'revenuecat',
        },
        include: [
          {
            model: salonDetail,
            attributes: [
              'id',
              'userId',
              'registrationDate',
              'salonName',
              'approvedByAdmin',
              'subscriptionPlan',
              'registrationExpiryDate',
              'subscriptionLatestPaymentStatus',
            ],
            include: [
              {
                model: user,
                attributes: ['id', 'email', 'stripeCustomerId'],
              },
            ],
          },
        ],
      });

      if (subscriptionByTransaction?.salonDetail) {
        console.log(`✅ Found salon via original_transaction_id: ${event.original_transaction_id}`);
        return subscriptionByTransaction.salonDetail;
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding salon by app_user_id:', error);
    return null;
  }
};

/**
 * Find user by RevenueCat app_user_id (kept for backward compatibility and TRANSFER events)
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
 * Fetch product price from RevenueCat by checking subscriber's product history
 * RevenueCat API v1: https://docs.revenuecat.com/reference/get_v1-subscribers-app_user_id
 */
const fetchProductPriceFromRevenueCat = async (appUserId, productId) => {
  try {
    if (!REVENUECAT_SECRET_API_KEY) {
      console.warn('⚠️ REVENUECAT_SECRET_API_KEY not configured, cannot fetch product price from API');
      return null;
    }

    // RevenueCat REST API uses v1 in the URL path
    const response = await axios.get(
      `https://api.revenuecat.com/v1/subscribers/${appUserId}`,
      {
        headers: {
          'Authorization': `Bearer ${REVENUECAT_SECRET_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    const subscriber = response.data?.subscriber;
    if (!subscriber) {
      console.warn(`⚠️ No subscriber data found for app_user_id: ${appUserId}`);
      return null;
    }

    // Check subscriptions for the product
    const subscriptions = subscriber.subscriptions || {};
    if (subscriptions[productId]) {
      const subscription = subscriptions[productId];
      
      // Check store transactions for price
      if (subscription.store_transactions && subscription.store_transactions.length > 0) {
        // Get the most recent transaction
        const latestTransaction = subscription.store_transactions
          .sort((a, b) => (b.purchase_date_ms || 0) - (a.purchase_date_ms || 0))[0];
        
        if (latestTransaction.price && latestTransaction.price > 0) {
          console.log(`✅ Found product price from RevenueCat API: ${latestTransaction.price} for product ${productId}`);
          return latestTransaction.price;
        }
      }
      
      // Check non-subscriptions (one-time purchases)
      const nonSubscriptions = subscriber.non_subscriptions || {};
      if (nonSubscriptions[productId] && nonSubscriptions[productId].length > 0) {
        const purchase = nonSubscriptions[productId]
          .sort((a, b) => (b.purchase_date_ms || 0) - (a.purchase_date_ms || 0))[0];
        if (purchase.price && purchase.price > 0) {
          console.log(`✅ Found product price from RevenueCat API (non-subscription): ${purchase.price}`);
          return purchase.price;
        }
      }
    }

    console.warn(`⚠️ Product ${productId} price not found in RevenueCat subscriber data`);
    return null;
  } catch (error) {
    console.error(`❌ Error fetching product price from RevenueCat API:`, error.message);
    if (error.response) {
      console.error(`❌ RevenueCat API response:`, error.response.status, error.response.data);
    }
    return null;
  }
};

/**
 * Map RevenueCat product ID to display name
 * Converts product IDs like "trimbiz_monthly_owner" to "Owner Only"
 */
const getSubscriptionDisplayName = (productId) => {
  if (!productId) return null;
  
  const productNameMap = {
    'trimbiz_monthly_owner': 'Owner Only',
    'trimbiz_owner_one_staff': 'Owner + 1 staff member',
    'trimbiz_owner_two_staff': 'Owner + 2 staff members',
    'trimbiz_owner_three_staff': 'Owner + 3 staff members',
    'trimbiz_owner_four_staff': 'Owner + 4 staff members',
    'trimbiz_owner_five_staff': 'Owner + 5 staff members',
  };
  
  // Return mapped name or fallback to product ID if not found
  return productNameMap[productId] || productId;
};

/**
 * Extract teamSize from RevenueCat product ID
 * teamSize = owner (1) + number of staff
 */
const getTeamSizeFromProductId = (productId) => {
  if (!productId) return 1; // Default to owner only
  
  const teamSizeMap = {
    'trimbiz_monthly_owner': 1,      // Owner only
    'trimbiz_owner_one_staff': 2,    // Owner + 1 staff
    'trimbiz_owner_two_staff': 3,    // Owner + 2 staff
    'trimbiz_owner_three_staff': 4,  // Owner + 3 staff
    'trimbiz_owner_four_staff': 5,   // Owner + 4 staff
    'trimbiz_owner_five_staff': 6,   // Owner + 5 staff
  };
  
  return teamSizeMap[productId] || 1; // Default to 1 if not found
};

/**
 * Build metadata object for salonDetail
 * Preserves existing metadata and updates subscription-related fields
 */
const buildSalonMetadata = (salon, productId, teamSize, store) => {
  try {
    // Get existing metadata safely
    let existingMetadata = {};
    if (salon.metadata) {
      if (typeof salon.metadata === 'string') {
        try {
          existingMetadata = JSON.parse(salon.metadata);
        } catch (e) {
          existingMetadata = {};
        }
      } else if (typeof salon.metadata === 'object' && salon.metadata !== null) {
        existingMetadata = JSON.parse(JSON.stringify(salon.metadata));
      }
    }

    // Get subscription display name
    const subscriptionDisplayName = getSubscriptionDisplayName(productId);
    
    // Determine payment method ID based on store
    let paymentMethodId = existingMetadata.paymentMethodId || '';
    if (store === 'APP_STORE') {
      paymentMethodId = 'apple_pay';
    } else if (store === 'PLAY_STORE') {
      paymentMethodId = 'google_pay';
    } else if (store && !paymentMethodId) {
      paymentMethodId = 'revenuecat';
    }

    // Build new metadata object
    const newMetadata = {
      ...existingMetadata, // Preserve existing fields
      subscriptionName: subscriptionDisplayName || productId || '',
      membersCount: teamSize?.toString() || existingMetadata.membersCount || '1',
      members: teamSize?.toString() || existingMetadata.members || '1',
      paymentMethodId: paymentMethodId,
      sloanId: salon.id?.toString() || existingMetadata.sloanId || '',
      freeTrialDays: salon.hasObtainedFreeTrial ? '0' : (existingMetadata.freeTrialDays || '7'),
    };

    return newMetadata;
  } catch (error) {
    console.error('❌ Error building salon metadata:', error);
    // Return minimal safe metadata
    return {
      subscriptionName: getSubscriptionDisplayName(productId) || productId || '',
      membersCount: teamSize?.toString() || '1',
      members: teamSize?.toString() || '1',
      paymentMethodId: store === 'APP_STORE' ? 'apple_pay' : (store === 'PLAY_STORE' ? 'google_pay' : 'revenuecat'),
      sloanId: salon.id?.toString() || '',
      freeTrialDays: salon.hasObtainedFreeTrial ? '0' : '7',
    };
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

    // ⚡ CRITICAL: Return 200 immediately to RevenueCat
    // Process webhook asynchronously to avoid delays
    res.status(200).json({ received: true });

    // Process event asynchronously (fire and forget)
    // This prevents RevenueCat from waiting for database operations
    setImmediate(async () => {
      try {
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
          
          case 'TRANSFER':
            await handleTransfer(event);
            break;
          
          default:
            console.log(`⚠️ Unhandled RevenueCat event type: ${event.type}`);
        }
      } catch (error) {
        console.error('❌ Error processing webhook event asynchronously:', error);
      }
    });
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
      entitlement_id,
      price,
      price_in_purchased_currency,
      currency,
      period_type,
      purchased_at_ms,
      subscriptionId: product_id || entitlement_id
    });

    // Find salon by salonDetailId (from subscriber_attributes or app_user_id)
    const salon = await findSalonByAppUserId(app_user_id, event);
    if (!salon) {
      console.warn(`⚠️ Salon not found for app_user_id: ${app_user_id}`);
      console.warn(`⚠️ Event aliases: ${JSON.stringify(event.aliases)}`);
      console.warn(`⚠️ Original app_user_id: ${event.original_app_user_id}`);
      console.warn(`⚠️ Subscriber attributes: ${JSON.stringify(event.subscriber_attributes)}`);
      return;
    }

    // Calculate period dates
    const periodStart = new Date(purchased_at_ms);
    const periodEnd = calculatePeriodEnd(periodStart, period_type);

    // Extract VAT
    const vatAmount = extractVAT(event);

    // Calculate amount paid (RevenueCat sends prices in decimal format, not cents)
    const calculatedAmountPaid = price_in_purchased_currency 
      ? price_in_purchased_currency 
      : (price || 0);

    // Log price debugging info for INITIAL_PURCHASE
    if (calculatedAmountPaid === 0) {
      console.warn(`⚠️ INITIAL_PURCHASE: Price is 0!`, {
        price_in_purchased_currency,
        price,
        product_id,
        event_keys: Object.keys(event).filter(k => k.includes('price') || k.includes('amount') || k.includes('cost'))
      });
    }

    // Get display name for subscription
    const subscriptionDisplayName = getSubscriptionDisplayName(product_id);

    // Prepare subscription data
    const subscriptionData = {
      salonDetailId: salon.id,
      subscriptionId: product_id || entitlement_id, // Keep product ID here
      customerId: salon.userId ? salon.userId.toString() : salon.id.toString(),
      subscriptionSource: 'revenuecat',
      status: 'payment_succeeded',
      name: subscriptionDisplayName || product_id || entitlement_id, // Use display name
      periodStart: periodStart,
      periodEnd: periodEnd,
      currency: currency || 'gbp',
      amountPaid: calculatedAmountPaid,
      invoice: null,
      invoiceId: null,
      priceId: product_id, // Keep product ID here
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

    console.log('💰 Subscription Data Prepared:', {
      subscriptionId: subscriptionData.subscriptionId,
      name: subscriptionData.name,
      amountPaid: subscriptionData.amountPaid,
      currency: subscriptionData.currency,
      price_in_purchased_currency,
      price,
      VAT: subscriptionData.VAT,
      salonDetailId: subscriptionData.salonDetailId
    });

    // Get teamSize from product ID
    const teamSize = getTeamSizeFromProductId(product_id);
    
    // Build and update metadata
    salon.metadata = buildSalonMetadata(salon, product_id, teamSize, store);
    
    // Update salon details
    salon.approvedByAdmin = true;
    salon.subscriptionPlan = product_id || entitlement_id;
    salon.registrationExpiryDate = periodEnd;
    salon.registrationDate = periodStart;
    salon.hasObtainedFreeTrial = 1;
    salon.subscriptionLatestPaymentStatus = 'payment_succeeded';
    salon.teamSize = teamSize;
    salon.subscriptionPrice = calculatedAmountPaid;
    await salon.save();

    // Always find by salonDetailId and subscriptionSource only (not subscriptionId)
    // This ensures we update the same record even when product changes
    const existingSubscription = await subscriptions.findOne({
      where: {
        salonDetailId: salon.id,
        subscriptionSource: 'revenuecat',
      },
      order: [['createdAt', 'DESC']], // Get the latest one if multiple exist
    });

    if (existingSubscription) {
      // If new amountPaid is 0 but existing has a price, preserve the existing price
      if (calculatedAmountPaid === 0 && existingSubscription.amountPaid > 0) {
        subscriptionData.amountPaid = existingSubscription.amountPaid;
        console.log(`⚠️ Preserving existing price ${existingSubscription.amountPaid} (new price was 0)`);
      }
      
      await existingSubscription.update(subscriptionData);
      console.log(`✅ Updated subscription record: ${existingSubscription.id}`);
    } else {
      // Only create if we have a valid price, or if it's truly a new subscription
      if (calculatedAmountPaid === 0) {
        console.warn(`⚠️ Initial purchase has 0 price - this might be a free trial or issue with webhook data`);
        console.warn(`⚠️ Price values: price_in_purchased_currency=${price_in_purchased_currency}, price=${price}`);
      }
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
    
    console.log('🔄 Renewal Event:', { 
      app_user_id, 
      product_id, 
      entitlement_id,
      price,
      price_in_purchased_currency,
      currency,
      subscriptionId: product_id || entitlement_id
    });

    // Find salon by salonDetailId (from subscriber_attributes or app_user_id)
    const salon = await findSalonByAppUserId(app_user_id, event);
    if (!salon) {
      console.warn(`⚠️ Salon not found for app_user_id: ${app_user_id}`);
      console.warn(`⚠️ Event aliases: ${JSON.stringify(event.aliases)}`);
      console.warn(`⚠️ Original app_user_id: ${event.original_app_user_id}`);
      console.warn(`⚠️ Original transaction_id: ${event.original_transaction_id}`);
      console.warn(`⚠️ Subscriber attributes: ${JSON.stringify(event.subscriber_attributes)}`);
      return;
    }

    // Calculate new period
    const periodStart = new Date(purchased_at_ms);
    const periodEnd = calculatePeriodEnd(periodStart, period_type);

    // Extract VAT
    const vatAmount = extractVAT(event);

    // Calculate amount paid (RevenueCat sends prices in decimal format, not cents)
    const calculatedAmountPaid = price_in_purchased_currency 
      ? price_in_purchased_currency 
      : (price || 0);

    // Get display name for subscription
    const subscriptionDisplayName = getSubscriptionDisplayName(product_id);

    // Prepare subscription data
    const subscriptionData = {
      salonDetailId: salon.id,
      subscriptionId: product_id || entitlement_id, // Keep product ID here
      customerId: salon.userId ? salon.userId.toString() : salon.id.toString(),
      subscriptionSource: 'revenuecat',
      status: 'payment_succeeded',
      name: subscriptionDisplayName || product_id || entitlement_id, // Use display name
      periodStart: periodStart,
      periodEnd: periodEnd,
      currency: currency || 'gbp',
      amountPaid: calculatedAmountPaid,
      invoice: null,
      invoiceId: null,
      priceId: product_id, // Keep product ID here
      VAT: vatAmount,
      revenueCatUserId: app_user_id,
      revenueCatOriginalTransactionId: event.original_transaction_id || null,
      revenueCatStore: store || null,
      appleTransactionId: null,
      appleOriginalTransactionId: null,
      appleProductId: null,
      appleEnvironment: null,
    };

    console.log('💰 Renewal Subscription Data Prepared:', {
      subscriptionId: subscriptionData.subscriptionId,
      amountPaid: subscriptionData.amountPaid,
      currency: subscriptionData.currency,
      price_in_purchased_currency,
      price,
      VAT: subscriptionData.VAT,
      salonDetailId: subscriptionData.salonDetailId
    });

    // Get teamSize from product ID
    const teamSize = getTeamSizeFromProductId(product_id);
    
    // Build and update metadata
    salon.metadata = buildSalonMetadata(salon, product_id, teamSize, store);
    
    // Update salon
    salon.registrationExpiryDate = periodEnd;
    salon.registrationDate = periodStart;
    salon.subscriptionLatestPaymentStatus = 'payment_succeeded';
    salon.approvedByAdmin = true;
    salon.teamSize = teamSize;
    salon.subscriptionPrice = calculatedAmountPaid;
    salon.subscriptionPlan = product_id || entitlement_id; // Update subscription plan
    await salon.save();

    // Always find by salonDetailId and subscriptionSource only
    const existingSubscription = await subscriptions.findOne({
      where: {
        salonDetailId: salon.id,
        subscriptionSource: 'revenuecat',
      },
      order: [['createdAt', 'DESC']], // Get the latest one if multiple exist
    });

    if (existingSubscription) {
      // If existing subscription has 0 price but renewal has a price, update it
      if (existingSubscription.amountPaid === 0 && calculatedAmountPaid > 0) {
        console.log(`✅ Backfilling price from ${existingSubscription.amountPaid} to ${calculatedAmountPaid}`);
      }
      // If renewal has 0 price but existing has a price, preserve existing price
      else if (calculatedAmountPaid === 0 && existingSubscription.amountPaid > 0) {
        subscriptionData.amountPaid = existingSubscription.amountPaid;
        console.log(`⚠️ Preserving existing price ${existingSubscription.amountPaid} (renewal price was 0)`);
      }
      
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

    const salon = await findSalonByAppUserId(app_user_id, event);
    if (!salon) {
      console.warn(`⚠️ Salon not found for app_user_id: ${app_user_id}`);
      console.warn(`⚠️ Subscriber attributes: ${JSON.stringify(event.subscriber_attributes)}`);
      return;
    }

    // Keep approvedByAdmin as true (don't change it on cancellation)
    salon.subscriptionLatestPaymentStatus = 'cancelled';
    await salon.save();

    // Always find by salonDetailId and subscriptionSource only
    const existingSubscription = await subscriptions.findOne({
      where: {
        salonDetailId: salon.id,
        subscriptionSource: 'revenuecat',
      },
      order: [['createdAt', 'DESC']], // Get the latest one if multiple exist
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

    const salon = await findSalonByAppUserId(app_user_id, event);
    if (!salon) {
      console.warn(`⚠️ Salon not found for app_user_id: ${app_user_id}`);
      console.warn(`⚠️ Subscriber attributes: ${JSON.stringify(event.subscriber_attributes)}`);
      return;
    }

    // Keep approvedByAdmin as true (don't change it on expiration)
    salon.subscriptionLatestPaymentStatus = 'expired';
    await salon.save();

    // Always find by salonDetailId and subscriptionSource only
    const existingSubscription = await subscriptions.findOne({
      where: {
        salonDetailId: salon.id,
        subscriptionSource: 'revenuecat',
      },
      order: [['createdAt', 'DESC']], // Get the latest one if multiple exist
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

    const salon = await findSalonByAppUserId(app_user_id, event);
    if (!salon) {
      console.warn(`⚠️ Salon not found for app_user_id: ${app_user_id}`);
      console.warn(`⚠️ Subscriber attributes: ${JSON.stringify(event.subscriber_attributes)}`);
      return;
    }

    salon.subscriptionLatestPaymentStatus = 'payment_failed';
    await salon.save();

    // Always find by salonDetailId and subscriptionSource only
    const existingSubscription = await subscriptions.findOne({
      where: {
        salonDetailId: salon.id,
        subscriptionSource: 'revenuecat',
      },
      order: [['createdAt', 'DESC']], // Get the latest one if multiple exist
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
      product_id,        // OLD product ID
      new_product_id,    // NEW product ID (use this!)
      price, 
      price_in_purchased_currency,
      currency, 
      period_type, 
      purchased_at_ms,
      store,
      entitlement_id
    } = event;
    
    // Use new_product_id for the new subscription, fallback to product_id
    const activeProductId = new_product_id || product_id;
    
    // Log all price-related fields from the event for debugging
    console.log('🔄 Product Change Event:', { 
      app_user_id, 
      product_id,        // Old product
      new_product_id,    // New product
      activeProductId,   // Product we're using
      entitlement_id,
      price,
      price_in_purchased_currency,
      currency,
      subscriptionId: activeProductId || entitlement_id,
      // Log full event to see all available fields
      fullEventPriceFields: {
        price: event.price,
        price_in_purchased_currency: event.price_in_purchased_currency,
        currency: event.currency,
        takehome_percentage: event.takehome_percentage,
        tax_percentage: event.tax_percentage,
        commission_percentage: event.commission_percentage,
      }
    });

    const salon = await findSalonByAppUserId(app_user_id, event);
    if (!salon) {
      console.warn(`⚠️ Salon not found for app_user_id: ${app_user_id}`);
      console.warn(`⚠️ Subscriber attributes: ${JSON.stringify(event.subscriber_attributes)}`);
      return;
    }

    const periodStart = new Date(purchased_at_ms);
    const periodEnd = calculatePeriodEnd(periodStart, period_type);
    const vatAmount = extractVAT(event);

    // Always find existing subscription first to preserve price if needed
    const existingSubscription = await subscriptions.findOne({
      where: {
        salonDetailId: salon.id,
        subscriptionSource: 'revenuecat',
      },
      order: [['createdAt', 'DESC']], // Get the latest one if multiple exist
    });

    // Calculate amount paid (RevenueCat sends prices in decimal format, not cents)
    // Check both price_in_purchased_currency and price fields
    let calculatedAmountPaid = 0;
    
    if (price_in_purchased_currency && price_in_purchased_currency > 0) {
      calculatedAmountPaid = price_in_purchased_currency;
      console.log(`✅ Using price_in_purchased_currency from event: ${calculatedAmountPaid}`);
    } else if (price && price > 0) {
      calculatedAmountPaid = price;
      console.log(`✅ Using price from event: ${calculatedAmountPaid}`);
    } else {
      console.log(`⚠️ No price in PRODUCT_CHANGE event (price: ${price}, price_in_purchased_currency: ${price_in_purchased_currency})`);
      
      // Priority 1: Try to fetch from RevenueCat API
      console.log(`🔍 Fetching product price from RevenueCat API for product: ${activeProductId}`);
      const apiPrice = await fetchProductPriceFromRevenueCat(app_user_id, activeProductId);
      
      if (apiPrice && apiPrice > 0) {
        calculatedAmountPaid = apiPrice;
        console.log(`✅ Using price from RevenueCat API: ${calculatedAmountPaid}`);
      } 
      // Priority 2: Try to find from database
      else {
        const newProductSubscription = await subscriptions.findOne({
          where: {
            subscriptionId: activeProductId,
            subscriptionSource: 'revenuecat',
            amountPaid: { [Op.gt]: 0 }, // Only get subscriptions with valid prices
          },
          order: [['createdAt', 'DESC']], // Get the most recent one
        });

        if (newProductSubscription && newProductSubscription.amountPaid > 0) {
          calculatedAmountPaid = newProductSubscription.amountPaid;
          console.log(`✅ Found new product price from database: ${calculatedAmountPaid} for product ${activeProductId}`);
        } 
        // Priority 3: Preserve existing subscription price as fallback
        else if (existingSubscription && existingSubscription.amountPaid > 0) {
          calculatedAmountPaid = existingSubscription.amountPaid;
          console.log(`⚠️ Preserving existing subscription price: ${calculatedAmountPaid} (new product price not found)`);
        } else {
          console.log(`⚠️ Product change has price 0 and no price found for product ${activeProductId}`);
          console.log(`⚠️ The price will be updated when the RENEWAL event is received`);
        }
      }
    }

    // Get display name for subscription (use NEW product ID)
    const subscriptionDisplayName = getSubscriptionDisplayName(activeProductId);
    
    // Get teamSize from product ID (use NEW product ID)
    const teamSize = getTeamSizeFromProductId(activeProductId);

    // Build and update metadata (use NEW product ID)
    salon.metadata = buildSalonMetadata(salon, activeProductId, teamSize, store);

    const subscriptionData = {
      salonDetailId: salon.id,
      subscriptionId: activeProductId || entitlement_id, // Use NEW product ID
      customerId: salon.userId ? salon.userId.toString() : salon.id.toString(),
      subscriptionSource: 'revenuecat',
      status: 'payment_succeeded',
      name: subscriptionDisplayName || activeProductId || entitlement_id, // Use display name
      periodStart: periodStart,
      periodEnd: periodEnd,
      currency: currency || 'gbp',
      amountPaid: calculatedAmountPaid,
      priceId: activeProductId, // Use NEW product ID
      VAT: vatAmount,
      revenueCatUserId: app_user_id,
      revenueCatOriginalTransactionId: event.original_transaction_id || null,
      revenueCatStore: store || null,
      appleTransactionId: null,
      appleOriginalTransactionId: null,
      appleProductId: null,
      appleEnvironment: null,
    };

    console.log('💰 Product Change Subscription Data Prepared:', {
      subscriptionId: subscriptionData.subscriptionId,
      amountPaid: subscriptionData.amountPaid,
      currency: subscriptionData.currency,
      price_in_purchased_currency,
      price,
      existingPrice: existingSubscription ? existingSubscription.amountPaid : null,
      VAT: subscriptionData.VAT,
      salonDetailId: subscriptionData.salonDetailId
    });

    // Update salon with NEW subscription details
    // Use the calculated price (which may have been looked up from DB)
    salon.subscriptionPlan = activeProductId || entitlement_id; // Use NEW product ID
    salon.registrationExpiryDate = periodEnd;
    salon.registrationDate = periodStart;
    salon.subscriptionLatestPaymentStatus = 'payment_succeeded';
    salon.approvedByAdmin = true;
    salon.teamSize = teamSize;
    salon.subscriptionPrice = calculatedAmountPaid; // Use calculated price (may be from DB lookup)
    await salon.save();

    // Update or create subscription record
    if (existingSubscription) {
      await existingSubscription.update(subscriptionData);
      console.log(`✅ Updated product change subscription: ${existingSubscription.id}`);
    } else {
      await subscriptions.create(subscriptionData);
      console.log(`✅ Created product change subscription for salon: ${salon.id}`);
    }

    console.log(`✅ Product change processed: ${product_id} → ${activeProductId} for salon ${salon.salonName}`);
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

    const salon = await findSalonByAppUserId(app_user_id, event);
    if (!salon) {
      console.warn(`⚠️ Salon not found for app_user_id: ${app_user_id}`);
      console.warn(`⚠️ Subscriber attributes: ${JSON.stringify(event.subscriber_attributes)}`);
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
    
    console.log('✅ Uncancellation Event:', { 
      app_user_id, 
      product_id,
      entitlement_id,
      price,
      price_in_purchased_currency,
      currency,
      subscriptionId: product_id || entitlement_id
    });

    const salon = await findSalonByAppUserId(app_user_id, event);
    if (!salon) {
      console.warn(`⚠️ Salon not found for app_user_id: ${app_user_id}`);
      console.warn(`⚠️ Subscriber attributes: ${JSON.stringify(event.subscriber_attributes)}`);
      return;
    }

    const periodStart = new Date(purchased_at_ms);
    const periodEnd = calculatePeriodEnd(periodStart, period_type);
    const vatAmount = extractVAT(event);

    // Calculate amount paid (RevenueCat sends prices in decimal format, not cents)
    const calculatedAmountPaid = price_in_purchased_currency 
      ? price_in_purchased_currency 
      : (price || 0);

    // Get display name for subscription
    const subscriptionDisplayName = getSubscriptionDisplayName(product_id);
    
    // Get teamSize from product ID
    const teamSize = getTeamSizeFromProductId(product_id);

    // Build and update metadata
    salon.metadata = buildSalonMetadata(salon, product_id, teamSize, event.store);

    const subscriptionData = {
      salonDetailId: salon.id,
      subscriptionId: product_id || entitlement_id, // Keep product ID here
      customerId: salon.userId ? salon.userId.toString() : salon.id.toString(),
      subscriptionSource: 'revenuecat',
      status: 'payment_succeeded',
      name: subscriptionDisplayName || product_id || entitlement_id, // Use display name
      periodStart: periodStart,
      periodEnd: periodEnd,
      currency: currency || 'gbp',
      amountPaid: calculatedAmountPaid,
      priceId: product_id, // Keep product ID here
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
    salon.teamSize = teamSize;
    salon.subscriptionPrice = calculatedAmountPaid;
    await salon.save();

    // Always find by salonDetailId and subscriptionSource only
    const existingSubscription = await subscriptions.findOne({
      where: {
        salonDetailId: salon.id,
        subscriptionSource: 'revenuecat',
      },
      order: [['createdAt', 'DESC']], // Get the latest one if multiple exist
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

/**
 * Update subscriptions by RevenueCat user ID (when we don't know the salon)
 */
const updateSubscriptionsByRevenueCatUserId = async (oldRevenueCatUserId, newRevenueCatUserId) => {
  try {
    const subscriptionsToUpdate = await subscriptions.findAll({
      where: {
        revenueCatUserId: oldRevenueCatUserId,
        subscriptionSource: 'revenuecat',
      },
    });

    for (const subscription of subscriptionsToUpdate) {
      subscription.revenueCatUserId = newRevenueCatUserId;
      await subscription.save();
      console.log(`✅ Updated subscription ${subscription.id} RevenueCat user ID from ${oldRevenueCatUserId} to ${newRevenueCatUserId}`);
    }

    return subscriptionsToUpdate.length;
  } catch (error) {
    console.error('❌ Error updating subscriptions by RevenueCat user ID:', error);
    return 0;
  }
};

/**
 * Update subscriptions for a specific salon with new RevenueCat user ID
 */
const updateSubscriptionsByRevenueCatUserIdForSalon = async (salonDetailId, newRevenueCatUserId) => {
  try {
    const subscriptionsToUpdate = await subscriptions.findAll({
      where: {
        salonDetailId: salonDetailId,
        subscriptionSource: 'revenuecat',
      },
    });

    for (const subscription of subscriptionsToUpdate) {
      subscription.revenueCatUserId = newRevenueCatUserId;
      await subscription.save();
      console.log(`✅ Updated subscription ${subscription.id} RevenueCat user ID to ${newRevenueCatUserId}`);
    }

    return subscriptionsToUpdate.length;
  } catch (error) {
    console.error('❌ Error updating subscriptions for salon:', error);
    return 0;
  }
};

/**
 * Handle TRANSFER - Subscription transferred from one user to another
 * This happens when a user restores purchases or transfers subscription to a new account
 */
const handleTransfer = async (event) => {
  try {
    const { 
      transferred_from, 
      transferred_to,
      environment
    } = event;
    
    console.log('🔄 Transfer Event:', { 
      transferred_from, 
      transferred_to,
      environment 
    });

    if (!transferred_from || !Array.isArray(transferred_from) || transferred_from.length === 0) {
      console.warn('⚠️ Transfer event missing transferred_from');
      return;
    }

    if (!transferred_to || !Array.isArray(transferred_to) || transferred_to.length === 0) {
      console.warn('⚠️ Transfer event missing transferred_to');
      return;
    }

    // Find salons by salonDetailId (priority) or via subscriptions
    let fromSalon = null;
    let toSalon = null;

    // Extract salon IDs from transferred_from (skip anonymous IDs)
    for (const id of transferred_from) {
      if (id && !id.startsWith('$RCAnonymousID:')) {
        // Try to find salon by salonDetailId (if numeric)
        if (!isNaN(id)) {
          const salon = await salonDetail.findOne({
            where: { id: id },
            attributes: [
              'id',
              'userId',
              'salonName',
              'subscriptionPlan',
              'registrationExpiryDate',
              'registrationDate',
              'approvedByAdmin',
              'subscriptionLatestPaymentStatus',
            ],
          });

          if (salon) {
            fromSalon = salon;
            console.log(`✅ Found source salon: ${salon.id} (${salon.salonName})`);
            break;
          }
        }
      }
    }

    // Extract salon IDs from transferred_to (skip anonymous IDs)
    for (const id of transferred_to) {
      if (id && !id.startsWith('$RCAnonymousID:')) {
        // Try to find salon by salonDetailId (if numeric)
        if (!isNaN(id)) {
          const salon = await salonDetail.findOne({
            where: { id: id },
            attributes: [
              'id',
              'userId',
              'salonName',
              'subscriptionPlan',
              'registrationExpiryDate',
              'registrationDate',
              'approvedByAdmin',
              'subscriptionLatestPaymentStatus',
            ],
          });

          if (salon) {
            toSalon = salon;
            console.log(`✅ Found destination salon: ${salon.id} (${salon.salonName})`);
            break;
          }
        }
      }
    }

    // If we couldn't find salons by direct IDs, try to find via existing subscriptions
    if (!fromSalon) {
      // Try to find subscriptions with the old RevenueCat user IDs
      for (const oldId of transferred_from) {
        const oldSubscription = await subscriptions.findOne({
          where: {
            revenueCatUserId: oldId,
            subscriptionSource: 'revenuecat',
          },
          include: [
            {
              model: salonDetail,
              attributes: [
                'id',
                'userId',
                'salonName',
                'subscriptionPlan',
                'registrationExpiryDate',
                'registrationDate',
                'approvedByAdmin',
                'subscriptionLatestPaymentStatus',
              ],
            },
          ],
        });

        if (oldSubscription?.salonDetail) {
          fromSalon = oldSubscription.salonDetail;
          console.log(`✅ Found source salon via subscription: ${fromSalon.id}`);
          break;
        }
      }
    }

    if (!toSalon) {
      // Try to find subscriptions with the new RevenueCat user IDs
      for (const newId of transferred_to) {
        const newSubscription = await subscriptions.findOne({
          where: {
            revenueCatUserId: newId,
            subscriptionSource: 'revenuecat',
          },
          include: [
            {
              model: salonDetail,
              attributes: [
                'id',
                'userId',
                'salonName',
                'subscriptionPlan',
                'registrationExpiryDate',
                'registrationDate',
                'approvedByAdmin',
                'subscriptionLatestPaymentStatus',
              ],
            },
          ],
        });

        if (newSubscription?.salonDetail) {
          toSalon = newSubscription.salonDetail;
          console.log(`✅ Found destination salon via subscription: ${toSalon.id}`);
          break;
        }
      }
    }

    // Get the new RevenueCat user ID (could be anonymous)
    const newRevenueCatUserId = transferred_to && transferred_to.length > 0 ? transferred_to[0] : null;

    if (!fromSalon) {
      console.warn(`⚠️ Could not find source salon from: ${JSON.stringify(transferred_from)}`);
      // Even if we can't find the source salon, try to update subscriptions by RevenueCat user ID
      if (transferred_from && transferred_from.length > 0 && newRevenueCatUserId) {
        const oldRevenueCatUserId = transferred_from.find(id => id && id.startsWith('$RCAnonymousID:')) || transferred_from[0];
        await updateSubscriptionsByRevenueCatUserId(oldRevenueCatUserId, newRevenueCatUserId);
      }
      return;
    }

    // If destination salon found, transfer subscriptions
    if (toSalon) {
      if (fromSalon.id === toSalon.id) {
        console.log(`ℹ️ Transfer source and destination are the same salon: ${fromSalon.id}`);
        // Still update RevenueCat user ID even if same salon
        if (newRevenueCatUserId) {
          await updateSubscriptionsByRevenueCatUserIdForSalon(fromSalon.id, newRevenueCatUserId);
        }
        return;
      }

      // Update all subscriptions from source user to destination user
      const subscriptionsToTransfer = await subscriptions.findAll({
        where: {
          salonDetailId: fromSalon.id,
          subscriptionSource: 'revenuecat',
        },
      });

      console.log(`📦 Found ${subscriptionsToTransfer.length} subscriptions to transfer`);

      for (const subscription of subscriptionsToTransfer) {
        // Update subscription to point to destination salon
        subscription.salonDetailId = toSalon.id;
        subscription.customerId = toSalon.userId ? toSalon.userId.toString() : toSalon.id.toString();
        
        // Update RevenueCat user ID to the new one
        if (newRevenueCatUserId) {
          subscription.revenueCatUserId = newRevenueCatUserId;
        }
        
        await subscription.save();
        console.log(`✅ Transferred subscription ${subscription.id} from salon ${fromSalon.id} to salon ${toSalon.id}`);
      }

      // Transfer salon subscription details if source salon has active subscription
      if (fromSalon.subscriptionPlan && fromSalon.registrationExpiryDate && new Date(fromSalon.registrationExpiryDate) > new Date()) {
        toSalon.subscriptionPlan = fromSalon.subscriptionPlan;
        toSalon.registrationExpiryDate = fromSalon.registrationExpiryDate;
        toSalon.registrationDate = fromSalon.registrationDate;
        toSalon.approvedByAdmin = fromSalon.approvedByAdmin;
        toSalon.subscriptionLatestPaymentStatus = fromSalon.subscriptionLatestPaymentStatus;
        await toSalon.save();
        console.log(`✅ Transferred subscription plan details to destination salon`);
      }
    } else {
      // Destination is anonymous ID - just update RevenueCat user ID on existing subscriptions
      // This allows future RENEWAL events to find the salon via subscription lookup
      console.log(`ℹ️ Destination is anonymous ID, updating RevenueCat user ID on existing subscriptions`);
      if (newRevenueCatUserId) {
        await updateSubscriptionsByRevenueCatUserIdForSalon(fromSalon.id, newRevenueCatUserId);
      }
    }

    console.log(`✅ Transfer completed: Subscriptions updated for salon ${fromSalon.id}${toSalon ? ` to salon ${toSalon.id}` : ' (anonymous destination)'}`);
  } catch (error) {
    console.error('❌ Error handling TRANSFER:', error);
  }
};

