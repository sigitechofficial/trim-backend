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
    // First, decode the signedPayload JWT to get the actual notification data
    const signedPayload = notification.signedPayload;
    
    if (!signedPayload) {
      console.warn('⚠️ No signedPayload in V2 notification');
      return res.status(200).json({ received: true });
    }
    
    // Decode the JWT (base64 decode the payload part)
    // JWT format: header.payload.signature
    const payloadData = JSON.parse(
      Buffer.from(signedPayload.split('.')[1], 'base64').toString()
    );
    
    console.log('📱 Decoded Payload:', JSON.stringify(payloadData, null, 2));
    
    const notificationType = payloadData.notificationType;
    const subtype = payloadData.subtype;
    const data = payloadData.data;
    
    console.log('📱 Notification Type:', notificationType);
    console.log('📱 Subtype:', subtype);
    
    // Extract transaction info from JWT (simplified - in production you should verify JWT)
    const transactionJWT = data?.signedTransactionInfo;
    const renewalJWT = data?.signedRenewalInfo;
    
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
    const environment = data?.environment || 'Sandbox';
    
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
        } else if (subtype === 'RESUBSCRIBE') {
          await handleRenewal(transactionData, salonUser, salon);
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
        } else if (subtype === 'AUTO_RENEW_ENABLED') {
          await handleRenewal(transactionData, salonUser, salon);
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
        
      case 'OFFER_REDEEMED':
        console.log('🎁 Handling OFFER_REDEEMED (promotional offer)');
        await handleRenewal(transactionData, salonUser, salon);
        break;
        
      case 'REVOKE':
        console.log('❌ Handling REVOKE (subscription revoked)');
        await handleRefund(transactionData, salonUser, salon);
        break;
        
      case 'DID_CHANGE_RENEWAL_PREF':
        if (renewalJWT) {
          await handleRenewalPreferenceChange(transactionData, renewalJWT, subtype, salonUser, salon);
        }
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

// Helper function to convert Apple price to actual currency amount
// Apple sends prices in minor units (e.g., PKR 2200 is sent as 2200000)
// This divides by 1000 to get the actual amount
function convertApplePrice(applePrice) {
  const price = parseFloat(applePrice || 0);
  return price / 1000; // Convert from Apple's minor units to actual currency
}

// Helper function to get subscription name based on product ID
function getSubscriptionName(productId) {
  if (!productId) return 'Apple Subscription';
  
  // Map product IDs to their reference names from App Store Connect
  const productMapping = {
    'trimbiz_monthly_owner': 'Owner only',
    'trimbiz_owner_one_staff': 'Owner + 1 staff member',
    'trimbiz_owner_two_staff': 'Owner + 2 staff member',
    'trimbiz_owner_three_staff': 'Owner + 3 staff member',
    'trimbiz_owner_four_staff': 'Owner + 4 staff member',
    'trimbiz_owner_five_staff': 'Owner + 5 staff member',
    'trimbiz_owner_unlimited_staff': 'Owner + unlimited staff member',
  };
  
  // Return the mapped name, or default if not found
  return productMapping[productId] || 'Apple Subscription';
}

// Helper function to get team size (total members including owner) from product ID
function getTeamSizeFromAppleProduct(productId) {
  if (!productId) return null;
  
  const productTeamSizeMapping = {
    'trimbiz_monthly_owner': 1,                    // Owner only
    'trimbiz_owner_one_staff': 2,                   // Owner + 1 staff = 2 total
    'trimbiz_owner_two_staff': 3,                   // Owner + 2 staff = 3 total
    'trimbiz_owner_three_staff': 4,                 // Owner + 3 staff = 4 total
    'trimbiz_owner_four_staff': 5,                  // Owner + 4 staff = 5 total
    'trimbiz_owner_five_staff': 6,                  // Owner + 5 staff = 6 total
    'trimbiz_owner_unlimited_staff': 999,           // Unlimited
    'trimbiz_monthly_renter': 0,                    // Chair renter's own plan: no staff
  };
  
  return productTeamSizeMapping[productId] ?? null;
}

// Helper function to get staff member count (excluding owner) from product ID
function getStaffMemberCountFromProduct(productId) {
  const teamSize = getTeamSizeFromAppleProduct(productId);
  if (teamSize === null) return null;
  if (teamSize === 999) return 999; // Unlimited
  return teamSize - 1; // Subtract 1 for owner
}

/**
 * Handle subscription plan changes and block excess employees
 * @param {Object} salon - Salon detail instance
 * @param {string} oldProductId - Previous product ID
 * @param {string} newProductId - New product ID
 */
async function handleSubscriptionPlanChange(salon, oldProductId, newProductId) {
  try {
    // Import models - ensure both employee and user are available
    // user is imported at top level, but let's also get it here to be safe
    const { employee, user: userModel } = require('../../models');
    // Use userModel to ensure we have the right reference
    const userToUpdate = userModel || user; // Fallback to top-level import if needed
    const { blockEmployees } = require('../eventDrivenCommunication/blockEmployees');
    
    // Get old and new member counts
    let oldTeamSize = getTeamSizeFromAppleProduct(oldProductId);
    let newTeamSize = getTeamSizeFromAppleProduct(newProductId);
    
    // ✅ FALLBACK: If we can't determine from product IDs, use salon's current teamSize
    if (!oldTeamSize && salon.teamSize) {
      oldTeamSize = salon.teamSize;
      console.log(`   ⚠️ Could not determine old team size from product ID, using salon.teamSize: ${oldTeamSize}`);
    }
    
    if (newTeamSize === null || newTeamSize === undefined) { // 0 = the renter plan (no staff)
      console.error(`   ❌ Could not determine new team size from product ID: ${newProductId}`);
      return;
    }
    
    // Ensure we have valid numbers
    oldTeamSize = oldTeamSize || 0;
    newTeamSize = newTeamSize || 0;
    const oldStaffCount = oldTeamSize > 0 ? oldTeamSize - 1 : 0;
    const newStaffCount = newTeamSize > 0 ? newTeamSize - 1 : 0;
    
    console.log(`📊 Subscription Plan Change:`);
    console.log(`   Old: ${oldProductId} (${oldTeamSize} total, ${oldStaffCount} staff)`);
    console.log(`   New: ${newProductId} (${newTeamSize} total, ${newStaffCount} staff)`);
    console.log(`   Salon current teamSize: ${salon.teamSize || 'not set'}`);
    
    // Only proceed if this is a downgrade (new limit is less than old)
    if (newTeamSize >= oldTeamSize || newTeamSize === 999) {
      console.log(`   ✅ Upgrade or same level - no action needed`);
      console.log(`   📊 Comparison: newTeamSize (${newTeamSize}) >= oldTeamSize (${oldTeamSize})`);
      return;
    }
    
    console.log(`   ⚠️ DOWNGRADE detected: ${oldTeamSize} → ${newTeamSize} (${oldStaffCount} → ${newStaffCount} staff)`);
    
    // Get all staff (excluding owner) for this salon. Chair renters pay for
    // their own plan, so a downgrade never blocks them.
    const allEmployees = await employee.findAll({
      where: {
        salonDetailId: salon.id,
        isOwner: false,
        isExternalEmployee: false,
        deleted: false,
      },
      include: [{
        model: user,
        attributes: ['id', 'firstName', 'lastName', 'status'],
        required: false, // LEFT JOIN - include employees even if user is missing
      }],
      order: [['createdAt', 'DESC']], // Most recently added first
    });
    
    console.log(`   📋 Total employees found (excluding owner): ${allEmployees.length}`);
    
    // Log all employees for debugging
    if (allEmployees.length > 0) {
      console.log(`   📋 Employee details:`);
      allEmployees.forEach((emp, idx) => {
        const empStatus = emp.status ? 'active' : 'blocked';
        const userStatus = emp.user?.status !== false ? 'active' : 'blocked';
        const userName = emp.user ? `${emp.user.firstName || ''} ${emp.user.lastName || ''}`.trim() : 'No user';
        console.log(`      ${idx + 1}. Employee ID: ${emp.id}, User ID: ${emp.userId || emp.user?.id || 'N/A'}, Name: ${userName}, Employee Status: ${empStatus}, User Status: ${userStatus}`);
      });
    }
    
    // Count currently active employees (both employee.status AND user.status must be true/not false)
    const activeEmployees = allEmployees.filter(emp => 
      emp.status === true && emp.user?.status !== false
    );
    
    const activeCount = activeEmployees.length;
    console.log(`   ✅ Current active staff: ${activeCount}`);
    console.log(`   📊 New limit: ${newStaffCount} staff`);
    
    // Calculate how many employees need to be blocked
    const excessCount = activeCount - newStaffCount;
    
    if (excessCount <= 0) {
      console.log(`   ✅ No excess employees - all can remain active`);
      return;
    }
    
    console.log(`   ⚠️ Need to block ${excessCount} employee(s)`);
    
    // Block the most recently added employees (they're already sorted by createdAt DESC)
    const employeesToBlock = activeEmployees.slice(0, excessCount);
    
    const blockedEmployeesList = [];
    
    for (const emp of employeesToBlock) {
      try {
        const userId = emp.userId || emp.user?.id;
        const employeeName = emp.user ? `${emp.user.firstName || ''} ${emp.user.lastName || ''}`.trim() : 'Unknown';
        
        if (!userId) {
          console.warn(`   ⚠️ Employee ${emp.id} has no userId, skipping`);
          continue;
        }
        
        // CRITICAL: Block BOTH employee and user status
        // Step 1: Update employee status in employee table
        // Use findByPk + save() method for more reliable updates
        let employeeUpdateSuccess = false;
        try {
          const employeeRecord = await employee.findByPk(emp.id);
          if (employeeRecord) {
            employeeRecord.status = false;
            await employeeRecord.save();
            employeeUpdateSuccess = true;
            console.log(`   ✅ Employee ${emp.id} status set to false in employee table (via save())`);
          } else {
            console.error(`   ❌ Employee ${emp.id} not found in database`);
          }
        } catch (employeeError) {
          console.error(`   ❌ Error updating employee ${emp.id} via save():`, employeeError.message);
          // Fallback to update() method
          try {
            const employeeUpdateResult = await employee.update(
              { status: false },
              { where: { id: emp.id } }
            );
            if (employeeUpdateResult[0] > 0) {
              employeeUpdateSuccess = true;
              console.log(`   ✅ Employee ${emp.id} status set to false via update() fallback`);
            } else {
              console.error(`   ❌ FAILED to update employee ${emp.id} status (both methods failed)`);
            }
          } catch (updateError) {
            console.error(`   ❌ Fallback update() also failed:`, updateError.message);
          }
        }
        
        // Step 2: Update user status in user table - CRITICAL
        // Use findByPk + save() method for more reliable updates
        let userUpdateSuccess = false;
        try {
          const userRecord = await userToUpdate.findByPk(userId);
          if (userRecord) {
            userRecord.status = false;
            await userRecord.save();
            userUpdateSuccess = true;
            console.log(`   ✅ User ${userId} status set to false in user table (via save())`);
          } else {
            console.error(`   ❌ User ${userId} not found in database`);
          }
        } catch (userError) {
          console.error(`   ❌ Error updating user ${userId} via save():`, userError.message);
          // Fallback to update() method
          try {
            const userUpdateResult = await userToUpdate.update(
              { status: false },
              { where: { id: userId } }
            );
            if (userUpdateResult[0] > 0) {
              userUpdateSuccess = true;
              console.log(`   ✅ User ${userId} status set to false via update() fallback`);
            } else {
              console.error(`   ❌ FAILED to update user ${userId} status (both methods failed)`);
            }
          } catch (updateError) {
            console.error(`   ❌ Fallback update() also failed:`, updateError.message);
          }
        }
        
        // Step 3: Verify both updates succeeded by checking database
        // Wait a moment for database to sync
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const verifyEmployee = await employee.findByPk(emp.id, { 
          attributes: ['id', 'status'],
          raw: false // Get model instance, not plain object
        });
        const verifyUser = await userToUpdate.findByPk(userId, { 
          attributes: ['id', 'status'],
          raw: false // Get model instance, not plain object
        });
        
        const employeeStatus = verifyEmployee?.getDataValue ? verifyEmployee.getDataValue('status') : verifyEmployee?.status;
        const userStatus = verifyUser?.getDataValue ? verifyUser.getDataValue('status') : verifyUser?.status;
        
        const employeeBlocked = employeeStatus === false;
        const userBlocked = userStatus === false;
        
        console.log(`   🔍 Verification Results:`);
        console.log(`      Employee ${emp.id}: status = ${employeeStatus} (expected: false, success: ${employeeBlocked})`);
        console.log(`      User ${userId}: status = ${userStatus} (expected: false, success: ${userBlocked})`);
        
        if (!employeeBlocked) {
          console.error(`   ❌ CRITICAL: Employee ${emp.id} status is still ${employeeStatus}, NOT blocked!`);
          // Final attempt - force update with individualHooks disabled
          try {
            await employee.update(
              { status: false },
              { 
                where: { id: emp.id },
                individualHooks: false,
                hooks: false
              }
            );
            console.log(`   🔄 Final force update attempt for employee ${emp.id}`);
            // Verify again
            const recheck = await employee.findByPk(emp.id, { attributes: ['id', 'status'] });
            console.log(`   🔍 Re-check employee ${emp.id} status: ${recheck?.status}`);
          } catch (finalError) {
            console.error(`   ❌ Final employee update attempt failed:`, finalError.message);
          }
        }
        
        if (!userBlocked) {
          console.error(`   ❌ CRITICAL: User ${userId} status is still ${userStatus}, NOT blocked!`);
          // Final attempt - force update with individualHooks disabled
          try {
            await userToUpdate.update(
              { status: false },
              { 
                where: { id: userId },
                individualHooks: false,
                hooks: false
              }
            );
            console.log(`   🔄 Final force update attempt for user ${userId}`);
            // Verify again
            const recheck = await userToUpdate.findByPk(userId, { attributes: ['id', 'status'] });
            console.log(`   🔍 Re-check user ${userId} status: ${recheck?.status}`);
          } catch (finalError) {
            console.error(`   ❌ Final user update attempt failed:`, finalError.message);
          }
        }
        
        if (employeeBlocked && userBlocked) {
          console.log(`   ✅ SUCCESS: Both employee ${emp.id} and user ${userId} are blocked`);
        } else {
          console.error(`   ⚠️ WARNING: Blocking incomplete - Employee blocked: ${employeeBlocked}, User blocked: ${userBlocked}`);
        }
        
        // Send socket event to notify employee
        await blockEmployees(false, {
          id: userId,
          employeeId: emp.id,
          isExternalEmployee: emp.isExternalEmployee || false,
        });
        
        blockedEmployeesList.push({
          employeeId: emp.id,
          userId: userId,
          name: employeeName,
          position: emp.position || 'N/A',
          createdAt: emp.createdAt,
          employeeStatus: verifyEmployee?.status,
          userStatus: verifyUser?.status,
        });
        
        console.log(`   🚫 Blocked employee ${emp.id} (user ${userId}) - ${employeeName}`);
        console.log(`      Employee status: ${verifyEmployee?.status}, User status: ${verifyUser?.status}`);
      } catch (error) {
        console.error(`   ❌ Error blocking employee ${emp.id}:`, error.message);
      }
    }
    
    // Update salon metadata with new member count
    let currentMetadata = {};
    try {
      const rawMetadata = salon.getDataValue ? salon.getDataValue('metadata') : salon.metadata;
      if (rawMetadata) {
        if (typeof rawMetadata === 'string') {
          currentMetadata = JSON.parse(rawMetadata);
        } else if (typeof rawMetadata === 'object' && rawMetadata !== null) {
          currentMetadata = JSON.parse(JSON.stringify(rawMetadata));
        }
      }
    } catch (e) {
      currentMetadata = {};
    }
    
    currentMetadata.membersCount = newStaffCount.toString();
    currentMetadata.subscriptionName = getSubscriptionName(newProductId);
    
    salon.metadata = currentMetadata;
    salon.teamSize = newTeamSize;
    await salon.save();
    
    console.log(`   ✅ Blocked ${employeesToBlock.length} employee(s) and updated salon metadata`);
    console.log(`   📋 Blocked Employees List:`);
    blockedEmployeesList.forEach((emp, index) => {
      console.log(`      ${index + 1}. ${emp.name} (Employee ID: ${emp.employeeId}, User ID: ${emp.userId})`);
    });
    
  } catch (error) {
    console.error('❌ Error handling subscription plan change:', error);
    throw error;
  }
}

async function handleInitialBuy(transaction, salonUser, salon) {
  console.log('🆕 Handling INITIAL_BUY');
  const purchaseDate = new Date(parseInt(transaction.purchase_date_ms));
  let expiresDate = new Date(parseInt(transaction.expires_date_ms));
  
  // FREE TRIAL LOGIC - Add 3 days if user hasn't used free trial yet
  const FREE_TRIAL_DAYS = 3;
  const hasUsedFreeTrial = salon.hasObtainedFreeTrial === 1 || salon.hasObtainedFreeTrial === true;
  
  if (!hasUsedFreeTrial) {
    console.log(`🎁 Adding ${FREE_TRIAL_DAYS} days free trial for salon ${salon.id}`);
    expiresDate.setDate(expiresDate.getDate() + FREE_TRIAL_DAYS);
  }
  
  // Get subscription name based on product ID
  const subscriptionName = getSubscriptionName(transaction.product_id);
  
  const [subscription, created] = await subscriptions.findOrCreate({
    where: {
      appleOriginalTransactionId: transaction.original_transaction_id,
      subscriptionSource: 'apple',
    },
    defaults: {
      userId: salonUser.id,
      salonDetailId: salon.id,
      // ✅ FIXED: Use backend-generated subscriptionId instead of Apple transaction ID
      subscriptionId: `sub_apple_${Date.now()}_${transaction.transaction_id.slice(-8)}`,
      appleTransactionId: transaction.transaction_id,
      appleOriginalTransactionId: transaction.original_transaction_id,
      appleProductId: transaction.product_id,
      subscriptionSource: 'apple',
      status: 'active',
      periodStart: purchaseDate,
      periodEnd: expiresDate,
      priceId: transaction.product_id,
      customerId: salonUser.id.toString(),
      name: subscriptionName,
      amountPaid: convertApplePrice(transaction.price),
      currency: transaction.currency || 'USD',
      appleEnvironment: 'Production',
    },
  });
  
  if (!created) {
    subscription.status = 'active';
    subscription.periodStart = purchaseDate;
    subscription.periodEnd = expiresDate;
    subscription.appleTransactionId = transaction.transaction_id;
    subscription.name = subscriptionName;
    await subscription.save();
  }
  
  salon.approvedByAdmin = true;
  salon.subscriptionPlan = transaction.transaction_id;
  salon.registrationExpiryDate = expiresDate;
  salon.registrationDate = purchaseDate;
  salon.hasObtainedFreeTrial = 1;
  salon.subscriptionLatestPaymentStatus = 'payment_succeeded';
  
  // ✅ Update salon metadata with member count
  const staffCount = getStaffMemberCountFromProduct(transaction.product_id);
  if (staffCount !== null) {
    let currentMetadata = {};
    try {
      const rawMetadata = salon.getDataValue ? salon.getDataValue('metadata') : salon.metadata;
      if (rawMetadata) {
        if (typeof rawMetadata === 'string') {
          currentMetadata = JSON.parse(rawMetadata);
        } else if (typeof rawMetadata === 'object' && rawMetadata !== null) {
          currentMetadata = JSON.parse(JSON.stringify(rawMetadata));
        }
      }
    } catch (e) {
      currentMetadata = {};
    }
    
    currentMetadata.membersCount = staffCount.toString();
    currentMetadata.subscriptionName = subscriptionName;
    salon.metadata = currentMetadata;
    salon.teamSize = getTeamSizeFromAppleProduct(transaction.product_id);
  }
  
  await salon.save();
  
  console.log(`✅ Initial purchase processed for salon ${salon.id}`);
  console.log(`   Subscription: ${subscriptionName}`);
  if (!hasUsedFreeTrial) {
    console.log(`🎁 Free trial granted: ${FREE_TRIAL_DAYS} days added`);
  }
}

async function handleRenewal(transaction, salonUser, salon) {
  console.log('🔄 Handling DID_RENEW');
  const purchaseDate = new Date(parseInt(transaction.purchase_date_ms));
  const expiresDate = new Date(parseInt(transaction.expires_date_ms));
  
  // Get subscription name based on product ID
  const subscriptionName = getSubscriptionName(transaction.product_id);
  const newProductId = transaction.product_id;
  
  const subscription = await subscriptions.findOne({
    where: {
      appleOriginalTransactionId: transaction.original_transaction_id,
      subscriptionSource: 'apple',
    },
    order: [['createdAt', 'DESC']],
  });
  
  // ✅ ENHANCED: Detect subscription plan change by comparing with:
  // 1. Subscription record's product ID (if exists)
  // 2. Salon's current metadata subscription name
  // 3. Salon's current team size
  
  let oldProductId = null;
  let planChanged = false;
  
  // Method 1: Check subscription record
  if (subscription && subscription.appleProductId && subscription.appleProductId !== newProductId) {
    oldProductId = subscription.appleProductId;
    planChanged = true;
    console.log(`  🔄 Plan change detected from subscription record: ${oldProductId} → ${newProductId}`);
  }
  
  // Method 2: Check salon's current metadata/subscription name (fallback if subscription record doesn't have product ID)
  if (!planChanged) {
    try {
      const rawMetadata = salon.getDataValue ? salon.getDataValue('metadata') : salon.metadata;
      let currentMetadata = {};
      
      if (rawMetadata) {
        if (typeof rawMetadata === 'string') {
          currentMetadata = JSON.parse(rawMetadata);
        } else if (typeof rawMetadata === 'object' && rawMetadata !== null) {
          currentMetadata = JSON.parse(JSON.stringify(rawMetadata));
        }
      }
      
      const currentSubscriptionName = currentMetadata.subscriptionName;
      const newSubscriptionName = subscriptionName;
      
      // If subscription names are different, it's a plan change
      if (currentSubscriptionName && currentSubscriptionName !== newSubscriptionName) {
        // Try to find the old product ID from the subscription name
        // Reverse lookup: subscription name -> product ID
        const productIdMap = {
          'Owner Only': 'trimbiz_monthly_owner',
          'Owner + 1 Staff': 'trimbiz_owner_one_staff',
          'Owner + 2 Staff': 'trimbiz_owner_two_staff',
          'Owner + 3 Staff': 'trimbiz_owner_three_staff',
          'Owner + 4 Staff': 'trimbiz_owner_four_staff',
          'Owner + 5 Staff': 'trimbiz_owner_five_staff',
          'Owner + Unlimited Staff': 'trimbiz_owner_unlimited_staff',
        };
        
        oldProductId = productIdMap[currentSubscriptionName] || null;
        
        if (oldProductId && oldProductId !== newProductId) {
          planChanged = true;
          console.log(`  🔄 Plan change detected from salon metadata: ${oldProductId} → ${newProductId}`);
        }
      }
      
      // Method 3: Compare team sizes as additional check
      const currentTeamSize = salon.teamSize || getTeamSizeFromAppleProduct(oldProductId);
      const newTeamSize = getTeamSizeFromAppleProduct(newProductId);
      
      if (currentTeamSize && newTeamSize && currentTeamSize !== newTeamSize) {
        if (!oldProductId) {
          // Try to find old product ID from team size
          const teamSizeToProductMap = {
            1: 'trimbiz_monthly_owner',
            2: 'trimbiz_owner_one_staff',
            3: 'trimbiz_owner_two_staff',
            4: 'trimbiz_owner_three_staff',
            5: 'trimbiz_owner_four_staff',
            6: 'trimbiz_owner_five_staff',
            999: 'trimbiz_owner_unlimited_staff',
          };
          oldProductId = teamSizeToProductMap[currentTeamSize] || null;
        }
        
        if (oldProductId && oldProductId !== newProductId) {
          planChanged = true;
          console.log(`  🔄 Plan change detected from team size comparison: ${oldProductId} (team size: ${currentTeamSize}) → ${newProductId} (team size: ${newTeamSize})`);
        }
      }
    } catch (error) {
      console.error('  ⚠️ Error checking salon metadata for plan change:', error.message);
    }
  }
  
  // If plan changed, handle the subscription plan change (block employees if downgrade)
  if (planChanged && oldProductId && oldProductId !== newProductId) {
    console.log(`  📊 Processing subscription plan change: ${oldProductId} → ${newProductId}`);
    await handleSubscriptionPlanChange(salon, oldProductId, newProductId);
    // Reload salon to get the latest data after plan change (metadata, teamSize updated)
    await salon.reload();
  }
  
  if (subscription) {
    subscription.status = 'active';
    subscription.periodStart = purchaseDate;
    subscription.periodEnd = expiresDate;
    subscription.appleTransactionId = transaction.transaction_id;
    // ✅ FIXED: Don't overwrite subscriptionId - keep the backend-generated ID
    // subscription.subscriptionId = transaction.transaction_id; // REMOVED
    subscription.appleProductId = transaction.product_id;
    subscription.priceId = transaction.product_id;
    subscription.name = subscriptionName;
    subscription.amountPaid = convertApplePrice(transaction.price);
    subscription.currency = transaction.currency || 'USD';
    await subscription.save();
  } else {
    // Create new subscription record for renewal
    await subscriptions.create({
      userId: salonUser.id,
      salonDetailId: salon.id,
      // ✅ FIXED: Use backend-generated subscriptionId instead of Apple transaction ID
      subscriptionId: `sub_apple_${Date.now()}_${transaction.transaction_id.slice(-8)}`,
      appleTransactionId: transaction.transaction_id,
      appleOriginalTransactionId: transaction.original_transaction_id,
      appleProductId: transaction.product_id,
      subscriptionSource: 'apple',
      status: 'active',
      periodStart: purchaseDate,
      periodEnd: expiresDate,
      priceId: transaction.product_id,
      customerId: salonUser.id.toString(),
      name: subscriptionName,
      amountPaid: convertApplePrice(transaction.price),
      currency: transaction.currency || 'USD',
      appleEnvironment: 'Production',
    });
  }
  
  salon.subscriptionPlan = transaction.transaction_id;
  salon.registrationExpiryDate = expiresDate;
  salon.registrationDate = purchaseDate;
  salon.subscriptionLatestPaymentStatus = 'payment_succeeded';
  salon.approvedByAdmin = true;
  
  // ✅ Update salon metadata with member count
  const staffCount = getStaffMemberCountFromProduct(transaction.product_id);
  if (staffCount !== null) {
    let currentMetadata = {};
    try {
      const rawMetadata = salon.getDataValue ? salon.getDataValue('metadata') : salon.metadata;
      if (rawMetadata) {
        if (typeof rawMetadata === 'string') {
          currentMetadata = JSON.parse(rawMetadata);
        } else if (typeof rawMetadata === 'object' && rawMetadata !== null) {
          currentMetadata = JSON.parse(JSON.stringify(rawMetadata));
        }
      }
    } catch (e) {
      currentMetadata = {};
    }
    
    currentMetadata.membersCount = staffCount.toString();
    currentMetadata.subscriptionName = subscriptionName;
    salon.metadata = currentMetadata;
    salon.teamSize = getTeamSizeFromAppleProduct(transaction.product_id);
  }
  
  await salon.save();
  
  console.log(`✅ Renewal processed for salon ${salon.id}`);
  console.log(`   Subscription: ${subscriptionName}`);
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
  salon.approvedByAdmin = false;
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

  salon.hasObtainedFreeTrial = 0;
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

async function handleRenewalPreferenceChange(transaction, renewalJWT, subtype, salonUser, salon) {
  console.log(`📝 Handling DID_CHANGE_RENEWAL_PREF (${subtype})`);
  
  try {
    // Decode renewal info to get future subscription details
    const renewalPayload = JSON.parse(
      Buffer.from(renewalJWT.split('.')[1], 'base64').toString()
    );
    
    // Find the subscription FIRST to get the ACTUAL current product ID
    const subscription = await subscriptions.findOne({
      where: {
        appleOriginalTransactionId: transaction.original_transaction_id,
        subscriptionSource: 'apple',
      },
      order: [['createdAt', 'DESC']],
    });
    
    // ✅ IMPORTANT: Determine the ACTUAL current product ID from multiple sources
    // Priority: 1) Subscription record, 2) Salon metadata, 3) Transaction product_id
    let currentProductId = subscription?.appleProductId || transaction.product_id;
    
    // Also check salon metadata for current subscription name to reverse-lookup product ID
    try {
      const rawMetadata = salon.getDataValue ? salon.getDataValue('metadata') : salon.metadata;
      let currentMetadata = {};
      
      if (rawMetadata) {
        if (typeof rawMetadata === 'string') {
          currentMetadata = JSON.parse(rawMetadata);
        } else if (typeof rawMetadata === 'object' && rawMetadata !== null) {
          currentMetadata = JSON.parse(JSON.stringify(rawMetadata));
        }
      }
      
      const currentSubscriptionName = currentMetadata.subscriptionName;
      if (currentSubscriptionName && !currentProductId) {
        // Reverse lookup: subscription name -> product ID
        const productIdMap = {
          'Owner Only': 'trimbiz_monthly_owner',
          'Owner + 1 Staff': 'trimbiz_owner_one_staff',
          'Owner + 2 Staff': 'trimbiz_owner_two_staff',
          'Owner + 3 Staff': 'trimbiz_owner_three_staff',
          'Owner + 4 Staff': 'trimbiz_owner_four_staff',
          'Owner + 5 Staff': 'trimbiz_owner_five_staff',
          'Owner + Unlimited Staff': 'trimbiz_owner_unlimited_staff',
        };
        currentProductId = productIdMap[currentSubscriptionName] || currentProductId;
      }
    } catch (e) {
      console.warn('  ⚠️ Error reading salon metadata for current product:', e.message);
    }
    
    const futureProductId = renewalPayload.autoRenewProductId;
    const currentPrice = convertApplePrice(transaction.price);
    const futurePrice = convertApplePrice(renewalPayload.renewalPrice);
    const currency = renewalPayload.currency || transaction.currency || 'USD';
    
    console.log(`  Current product (from DB): ${currentProductId} (${currentPrice} ${transaction.currency})`);
    console.log(`  Future product: ${futureProductId} (${futurePrice} ${currency})`);
    console.log(`  Change type: ${subtype}`);
    
    if (subscription) {
      // ✅ Handle subscription plan change (upgrade/downgrade) - apply immediately
      // Only process if we have both product IDs and they're different
      if (currentProductId && futureProductId && currentProductId !== futureProductId) {
        console.log(`  🔄 Subscription plan changing: ${currentProductId} → ${futureProductId}`);
        await handleSubscriptionPlanChange(salon, currentProductId, futureProductId);
      } else if (!currentProductId || !futureProductId) {
        console.warn(`  ⚠️ Cannot process plan change - missing product IDs. Current: ${currentProductId}, Future: ${futureProductId}`);
      }
      
      // Update subscription with NEW product information for next renewal
      subscription.appleProductId = futureProductId;
      subscription.priceId = futureProductId;
      subscription.amountPaid = futurePrice;
      subscription.currency = currency;
      
      // Update subscription name based on product ID
      const subscriptionName = getSubscriptionName(futureProductId);
      subscription.name = subscriptionName;
      
      await subscription.save();
      
      console.log(`✅ Subscription updated for salon ${salon.id}`);
      console.log(`   Product: ${currentProductId} → ${futureProductId}`);
      console.log(`   Price: ${currentPrice} → ${futurePrice} ${currency}`);
      console.log(`   Name: ${subscriptionName}`);
      console.log(`   Changes will apply on next renewal`);
    } else {
      console.warn(`⚠️ Subscription not found for original transaction: ${transaction.original_transaction_id}`);
    }
    
  } catch (error) {
    console.error('❌ Error handling renewal preference change:', error);
  }
}


// ============================================
// App Store Connect Version Webhook
// Handles APP_STORE_VERSION_APP_VERSION_STATE_UPDATED
// Fires when a new app version goes READY_FOR_SALE
// ============================================
const { fetchFromAppStore, checkAndUpdateVersion } = require('../../services/appVersionService')

exports.handleAppStoreConnectVersionWebhook = async (req, res) => {
  // Always respond 200 immediately — Apple retries if it doesn't get 200
  res.status(200).json({ received: true })

  try {
    const appType = req.params.appType // 'client' or 'business'
    console.log(`[AppVersion] Apple App Store Connect webhook received for [${appType}]`)

    // ─── Signature verification ───────────────────────────────────────────────
    const secret = process.env.APPLE_APP_CONNECT_WEBHOOK_SECRET
    const signature = req.headers['x-apple-signature'] || req.headers['x-apple-signature-v2']

    if (secret && signature) {
      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body))
      const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('base64')

      if (signature !== expected) {
        console.error('[AppVersion] Apple Connect webhook signature mismatch — ignoring')
        return
      }
      console.log('[AppVersion] Apple Connect webhook signature verified ✅')
    } else {
      console.warn('[AppVersion] Apple Connect webhook: no secret or signature — skipping verification')
    }

    // ─── Parse payload ────────────────────────────────────────────────────────
    const body = Buffer.isBuffer(req.body)
      ? JSON.parse(req.body.toString())
      : typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body

    console.log('[AppVersion] Apple Connect payload:', JSON.stringify(body, null, 2))

    const eventType = body?.type || body?.data?.type
    const newValue = body?.data?.attributes?.newValue

    console.log(`[AppVersion] Event type: ${eventType}, newValue: ${newValue}`)

    // ─── Only act when the app version is READY_FOR_SALE ─────────────────────
    if (
      eventType !== 'APP_STORE_VERSION_APP_VERSION_STATE_UPDATED' &&
      eventType !== 'appStoreVersionAppVersionStateUpdated'
    ) {
      console.log(`[AppVersion] Ignoring event type: ${eventType}`)
      return
    }

    if (newValue !== 'READY_FOR_SALE') {
      console.log(`[AppVersion] App not yet live (state: ${newValue}) — ignoring`)
      return
    }

    // ─── Fetch latest version from iTunes and update DB ───────────────────────
    const bundleId =
      appType === 'client'
        ? process.env.CLIENT_IOS_BUNDLE_ID
        : process.env.BUSINESS_IOS_BUNDLE_ID

    if (!bundleId) {
      console.error(`[AppVersion] No bundle ID configured for appType: ${appType}`)
      return
    }

    console.log(`[AppVersion] [${appType}] [ios] App is READY_FOR_SALE — fetching version from iTunes`)
    const version = await fetchFromAppStore(bundleId)
    await checkAndUpdateVersion(appType, 'ios', version)

  } catch (err) {
    console.error('[AppVersion] Apple Connect version webhook error:', err.message)
  }
}

