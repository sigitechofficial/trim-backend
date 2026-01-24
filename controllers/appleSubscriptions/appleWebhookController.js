const crypto = require('crypto');
const AppError = require('../../utils/appError');
const { user, subscriptions, salonDetail } = require('../../models');
const { Op } = require('sequelize');

/**
 * Handle Apple Server-to-Server Notifications
 * Documentation: https://developer.apple.com/documentation/appstoreservernotifications
 */
exports.handleAppleWebhook = async (req, res) => {
  try {
    console.log('📱 Apple Webhook Received');
    
    // ============================================
    // STEP 1: Verify Webhook Signature (SECURITY)
    // ============================================
    const appleSecret = process.env.APPLE_WEBHOOK_SECRET;
    
    if (!appleSecret) {
      console.error('❌ APPLE_WEBHOOK_SECRET not configured in .env file');
      return res.status(500).json({ 
        received: false, 
        error: 'Webhook secret not configured' 
      });
    }
    
    // Apple sends signature in x-apple-signature header (V1) or x-apple-signature-v2 (V2)
    const receivedSignature = req.headers['x-apple-signature'] || req.headers['x-apple-signature-v2'];
    
    if (receivedSignature && process.env.NODE_ENV === 'test') {
      // Get raw body (should be Buffer from bodyParser.raw)
      const rawBody = req.body;
      
      // Calculate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', appleSecret)
        .update(rawBody)
        .digest('base64');
      
      // Verify signature
      if (receivedSignature !== expectedSignature) {
        console.error('❌ Invalid webhook signature - possible fake webhook!');
        console.log('Received:', receivedSignature);
        console.log('Expected:', expectedSignature);
        return res.status(401).json({ 
          received: false, 
          error: 'Invalid signature' 
        });
      }
      
      console.log('✅ Webhook signature verified');
    } else if (process.env.NODE_ENV === 'test') {
      console.warn('⚠️ No signature provided in production!');
    } else {
      console.log('🔓 Skipping signature verification (dev/staging mode)');
    }
    
    // ============================================
    // STEP 2: Parse Notification
    // ============================================
    // Parse JSON if it's a Buffer (from raw body parser)
    const notification = typeof req.body === 'string' ? JSON.parse(req.body) : 
                        Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : 
                        req.body;
    
    console.log('📱 Full Payload:', JSON.stringify(notification, null, 2));
    
    // ============================================
    // STEP 3: Detect V1 vs V2 Format
    // ============================================
    const isV2 = notification.signedPayload || notification.notificationType;
    
    if (isV2) {
      console.log('📱 Detected V2 Notification Format');
      return await handleV2Webhook(notification, res);
    } else {
      console.log('📱 Detected V1 Notification Format');
      return await handleV1Webhook(notification, res);
    }
  } catch (error) {
    console.error('❌ Error handling Apple webhook:', error);
    // Always return 200 to Apple to prevent retries
    return res.status(200).json({ received: true, error: error.message });
  }
};




// ============================================
// V2 Webhook Handler (JWT-based)
// ============================================
async function handleV2Webhook(notification, res) {
  try {
    const notificationType = notification.notificationType;
    const subtype = notification.subtype;
    
    console.log('📱 Notification Type:', notificationType);
    console.log('📱 Subtype:', subtype);
    
    // Extract transaction info from JWT (simplified - in production you should verify JWT)
    const transactionJWT = notification.data?.signedTransactionInfo;
    const renewalJWT = notification.data?.signedRenewalInfo;
    
    if (!transactionJWT) {
      console.warn('⚠️ No transaction info in V2 notification');
      return res.status(200).json({ received: true });
    }
    
    // Decode JWT (base64 decode the payload part)
    // JWT format: header.payload.signature
    const transactionPayload = JSON.parse(
      Buffer.from(transactionJWT.split('.')[1], 'base64').toString()
    );
    
    console.log('📱 Transaction Info:', transactionPayload);
    
    const originalTransactionId = transactionPayload.originalTransactionId;
    const transactionId = transactionPayload.transactionId;
    const productId = transactionPayload.productId;
    const purchaseDate = new Date(transactionPayload.purchaseDate);
    const expiresDate = new Date(transactionPayload.expiresDate);
    const environment = notification.data?.environment || 'Sandbox';
    
    // Find user by original transaction ID
    const salonUser = await user.findOne({
      where: { appleOriginalTransactionId: originalTransactionId },
    });
    
    if (!salonUser) {
      console.warn(`⚠️ User not found for Apple transaction: ${originalTransactionId}`);
      return res.status(200).json({ received: true });
    }
    
    const salon = await salonDetail.findOne({
      where: { userId: salonUser.id },
    });
    
    if (!salon) {
      console.warn(`⚠️ Salon not found for user: ${salonUser.id}`);
      return res.status(200).json({ received: true });
    }
    
    // Map V2 notification types to actions
    const transactionData = {
      original_transaction_id: originalTransactionId,
      transaction_id: transactionId,
      product_id: productId,
      purchase_date_ms: transactionPayload.purchaseDate,
      expires_date_ms: transactionPayload.expiresDate,
      price: transactionPayload.price || 0,
      currency: transactionPayload.currency || 'USD',
    };
    
    // Handle different V2 notification types
    switch (notificationType) {
      case 'SUBSCRIBED':
        if (subtype === 'INITIAL_BUY') {
          await handleInitialBuy(transactionData, salonUser, salon);
        }
        break;
        
      case 'DID_RENEW':
      case 'RENEWAL':
        await handleRenewal(transactionData, salonUser, salon);
        break;
        
      case 'DID_FAIL_TO_RENEW':
      case 'EXPIRED':
        if (subtype === 'BILLING_RETRY' || notificationType === 'DID_FAIL_TO_RENEW') {
          await handleRenewalFailure(transactionData, salonUser, salon);
        } else {
          await handleGracePeriodExpired(transactionData, salonUser, salon);
        }
        break;
        
      case 'DID_CHANGE_RENEWAL_STATUS':
        if (subtype === 'AUTO_RENEW_DISABLED') {
          await handleCancellation(transactionData, salonUser, salon);
        }
        break;
        
      case 'REFUND':
        await handleRefund(transactionData, salonUser, salon);
        break;
        
      case 'GRACE_PERIOD_EXPIRED':
        await handleGracePeriodExpired(transactionData, salonUser, salon);
        break;
        
      case 'PRICE_INCREASE':
        await handlePriceIncrease(transactionData, salonUser, salon);
        break;
        
      case 'RENEWAL_EXTENDED':
        await handleRenewalExtended(transactionData, salonUser, salon);
        break;
        
      case 'TEST':
        console.log('✅ Test notification received');
        break;
        
      default:
        console.log(`ℹ️ Unhandled V2 notification type: ${notificationType} (${subtype})`);
    }
    
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error handling V2 webhook:', error);
    return res.status(200).json({ received: true, error: error.message });
  }
}

// ============================================
// V1 Webhook Handler (Legacy)
// ============================================
async function handleV1Webhook(notification, res) {
  try {
    const notificationType = notification.notification_type;
    console.log('📱 Notification Type:', notificationType);
    
    const unifiedReceipt = notification.unified_receipt;
    const latestReceiptInfo = unifiedReceipt?.latest_receipt_info || [];
    
    if (latestReceiptInfo.length === 0) {
      console.warn('⚠️ No receipt info in V1 notification');
      return res.status(200).json({ received: true });
    }
    
    // Get the latest transaction
    const latestTransaction = latestReceiptInfo[latestReceiptInfo.length - 1];
    const originalTransactionId = latestTransaction.original_transaction_id;
    const transactionId = latestTransaction.transaction_id;
    
    // Find user by original transaction ID
    const salonUser = await user.findOne({
      where: { appleOriginalTransactionId: originalTransactionId },
    });
    
    if (!salonUser) {
      console.warn(`⚠️ User not found for Apple transaction: ${originalTransactionId}`);
      return res.status(200).json({ received: true });
    }
    
    const salon = await salonDetail.findOne({
      where: { userId: salonUser.id },
    });
    
    if (!salon) {
      console.warn(`⚠️ Salon not found for user: ${salonUser.id}`);
      return res.status(200).json({ received: true });
    }
    
    // Handle different V1 notification types
    switch (notificationType) {
      case 'INITIAL_BUY':
        await handleInitialBuy(latestTransaction, salonUser, salon);
        break;
        
      case 'DID_RENEW':
        await handleRenewal(latestTransaction, salonUser, salon);
        break;
        
      case 'DID_FAIL_TO_RENEW':
        await handleRenewalFailure(latestTransaction, salonUser, salon);
        break;
        
      case 'CANCEL':
        await handleCancellation(latestTransaction, salonUser, salon);
        break;
        
      case 'REFUND':
        await handleRefund(latestTransaction, salonUser, salon);
        break;
        
      case 'GRACE_PERIOD_EXPIRED':
        await handleGracePeriodExpired(latestTransaction, salonUser, salon);
        break;
        
      case 'PRICE_INCREASE':
        await handlePriceIncrease(latestTransaction, salonUser, salon);
        break;
        
      case 'RENEWAL_EXTENDED':
        await handleRenewalExtended(latestTransaction, salonUser, salon);
        break;
        
      default:
        console.log(`ℹ️ Unhandled V1 notification type: ${notificationType}`);
    }
    
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error handling V1 webhook:', error);
    return res.status(200).json({ received: true, error: error.message });
  }
}

async function handleInitialBuy(transaction, salonUser, salon) {
  console.log('🆕 Handling INITIAL_BUY');
  const purchaseDate = new Date(parseInt(transaction.purchase_date_ms));
  const expiresDate = new Date(parseInt(transaction.expires_date_ms));
  
  const [subscription, created] = await subscriptions.findOrCreate({
    where: {
      appleOriginalTransactionId: transaction.original_transaction_id,
      subscriptionSource: 'apple',
    },
    defaults: {
      userId: salonUser.id,
      salonDetailId: salon.id,
      subscriptionId: transaction.transaction_id,
      appleTransactionId: transaction.transaction_id,
      appleOriginalTransactionId: transaction.original_transaction_id,
      appleProductId: transaction.product_id,
      subscriptionSource: 'apple',
      status: 'active',
      periodStart: purchaseDate,
      periodEnd: expiresDate,
      priceId: transaction.product_id,
      customerId: salonUser.id.toString(),
      name: 'Apple Subscription',
      amountPaid: parseFloat(transaction.price || 0),
      currency: transaction.currency || 'USD',
      appleEnvironment: 'Production',
    },
  });
  
  if (!created) {
    subscription.status = 'active';
    subscription.periodStart = purchaseDate;
    subscription.periodEnd = expiresDate;
    subscription.appleTransactionId = transaction.transaction_id;
    await subscription.save();
  }
  
  salon.approvedByAdmin = true;
  salon.subscriptionPlan = transaction.transaction_id;
  salon.registrationExpiryDate = expiresDate;
  salon.registrationDate = purchaseDate;
  salon.hasObtainedFreeTrial = 1;
  salon.subscriptionLatestPaymentStatus = 'payment_succeeded';
  await salon.save();
  
  console.log(`✅ Initial purchase processed for salon ${salon.id}`);
}

async function handleRenewal(transaction, salonUser, salon) {
  console.log('🔄 Handling DID_RENEW');
  const purchaseDate = new Date(parseInt(transaction.purchase_date_ms));
  const expiresDate = new Date(parseInt(transaction.expires_date_ms));
  
  const subscription = await subscriptions.findOne({
    where: {
      appleOriginalTransactionId: transaction.original_transaction_id,
      subscriptionSource: 'apple',
    },
    order: [['createdAt', 'DESC']],
  });
  
  if (subscription) {
    subscription.status = 'active';
    subscription.periodStart = purchaseDate;
    subscription.periodEnd = expiresDate;
    subscription.appleTransactionId = transaction.transaction_id;
    subscription.subscriptionId = transaction.transaction_id;
    await subscription.save();
  } else {
    // Create new subscription record for renewal
    await subscriptions.create({
      userId: salonUser.id,
      salonDetailId: salon.id,
      subscriptionId: transaction.transaction_id,
      appleTransactionId: transaction.transaction_id,
      appleOriginalTransactionId: transaction.original_transaction_id,
      appleProductId: transaction.product_id,
      subscriptionSource: 'apple',
      status: 'active',
      periodStart: purchaseDate,
      periodEnd: expiresDate,
      priceId: transaction.product_id,
      customerId: salonUser.id.toString(),
      name: 'Apple Subscription',
      amountPaid: parseFloat(transaction.price || 0),
      currency: transaction.currency || 'USD',
      appleEnvironment: 'Production',
    });
  }
  
  salon.subscriptionPlan = transaction.transaction_id;
  salon.registrationExpiryDate = expiresDate;
  salon.registrationDate = purchaseDate;
  salon.subscriptionLatestPaymentStatus = 'payment_succeeded';
  await salon.save();
  
  console.log(`✅ Renewal processed for salon ${salon.id}`);
}

async function handleRenewalFailure(transaction, salonUser, salon) {
  console.log('❌ Handling DID_FAIL_TO_RENEW');
  const subscription = await subscriptions.findOne({
    where: {
      appleOriginalTransactionId: transaction.original_transaction_id,
      subscriptionSource: 'apple',
    },
    order: [['createdAt', 'DESC']],
  });
  
  if (subscription) {
    subscription.status = 'past_due';
    await subscription.save();
  }
  
  salon.subscriptionLatestPaymentStatus = 'payment_failed';
  await salon.save();
  
  console.log(`⚠️ Renewal failure processed for salon ${salon.id}`);
}

async function handleCancellation(transaction, salonUser, salon) {
  console.log('🚫 Handling CANCEL');
  const subscription = await subscriptions.findOne({
    where: {
      appleOriginalTransactionId: transaction.original_transaction_id,
      subscriptionSource: 'apple',
    },
    order: [['createdAt', 'DESC']],
  });
  
  if (subscription) {
    subscription.status = 'canceled';
    await subscription.save();
  }
  
  salon.subscriptionLatestPaymentStatus = 'canceled';
  await salon.save();
  
  console.log(`🚫 Cancellation processed for salon ${salon.id}`);
}

async function handleRefund(transaction, salonUser, salon) {
  console.log('💰 Handling REFUND');
  const subscription = await subscriptions.findOne({
    where: {
      appleOriginalTransactionId: transaction.original_transaction_id,
      subscriptionSource: 'apple',
    },
    order: [['createdAt', 'DESC']],
  });
  
  if (subscription) {
    subscription.status = 'refunded';
    await subscription.save();
  }
  
  salon.subscriptionLatestPaymentStatus = 'refunded';
  salon.approvedByAdmin = false;
  await salon.save();
  
  console.log(`💰 Refund processed for salon ${salon.id}`);
}

async function handleGracePeriodExpired(transaction, salonUser, salon) {
  console.log('⏰ Handling GRACE_PERIOD_EXPIRED');
  const subscription = await subscriptions.findOne({
    where: {
      appleOriginalTransactionId: transaction.original_transaction_id,
      subscriptionSource: 'apple',
    },
    order: [['createdAt', 'DESC']],
  });
  
  if (subscription) {
    subscription.status = 'expired';
    await subscription.save();
  }
  
  salon.approvedByAdmin = false;
  salon.subscriptionLatestPaymentStatus = 'expired';
  await salon.save();
  
  console.log(`⏰ Grace period expired for salon ${salon.id}`);
}

async function handlePriceIncrease(transaction, salonUser, salon) {
  console.log('📈 Handling PRICE_INCREASE');
  // Update subscription with new price
  const subscription = await subscriptions.findOne({
    where: {
      appleOriginalTransactionId: transaction.original_transaction_id,
      subscriptionSource: 'apple',
    },
    order: [['createdAt', 'DESC']],
  });
  
  if (subscription) {
    subscription.amountPaid = parseFloat(transaction.price || 0);
    await subscription.save();
  }
  
  console.log(`📈 Price increase processed for salon ${salon.id}`);
}

async function handleRenewalExtended(transaction, salonUser, salon) {
  console.log('⏳ Handling RENEWAL_EXTENDED');
  const expiresDate = new Date(parseInt(transaction.expires_date_ms));
  
  const subscription = await subscriptions.findOne({
    where: {
      appleOriginalTransactionId: transaction.original_transaction_id,
      subscriptionSource: 'apple',
    },
    order: [['createdAt', 'DESC']],
  });
  
  if (subscription) {
    subscription.periodEnd = expiresDate;
    await subscription.save();
  }
  
  salon.registrationExpiryDate = expiresDate;
  await salon.save();
  
  console.log(`⏳ Renewal extended for salon ${salon.id}`);
}

