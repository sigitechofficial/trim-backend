const AppError = require('../../utils/appError');
const { user, subscriptions, salonDetail } = require('../../models');
const { Op } = require('sequelize');

/**
 * Handle Apple Server-to-Server Notifications
 * Documentation: https://developer.apple.com/documentation/appstoreservernotifications
 */
exports.handleAppleWebhook = async (req, res) => {
  try {
    // Apple sends notifications as JSON
    const notification = req.body;
    
    console.log('📱 Apple Webhook Received:', JSON.stringify(notification, null, 2));
    
    // Extract notification data
    const notificationType = notification.notification_type;
    const unifiedReceipt = notification.unified_receipt;
    const latestReceiptInfo = unifiedReceipt?.latest_receipt_info || [];
    
    if (latestReceiptInfo.length === 0) {
      console.warn('No receipt info in notification');
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
      console.warn(`User not found for Apple transaction: ${originalTransactionId}`);
      return res.status(200).json({ received: true });
    }
    
    const salon = await salonDetail.findOne({
      where: { userId: salonUser.id },
    });
    
    if (!salon) {
      console.warn(`Salon not found for user: ${salonUser.id}`);
      return res.status(200).json({ received: true });
    }
    
    // Handle different notification types
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
        console.log(`Unhandled notification type: ${notificationType}`);
    }
    
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error handling Apple webhook:', error);
    // Always return 200 to Apple to prevent retries
    return res.status(200).json({ received: true, error: error.message });
  }
};

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

