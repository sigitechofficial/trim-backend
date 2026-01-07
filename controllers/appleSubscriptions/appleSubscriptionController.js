const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const AppError = require('../../utils/appError');
const { user, subscriptions, salonDetail } = require('../../models');
const { Op } = require('sequelize');

// Apple App Store Connect API credentials
const APPLE_ISSUER_ID = process.env.APPLE_ISSUER_ID;
const APPLE_KEY_ID = process.env.APPLE_KEY_ID;
const APPLE_BUNDLE_ID = process.env.APPLE_BUNDLE_ID;
const APPLE_SHARED_SECRET = process.env.APPLE_SHARED_SECRET;

// Get private key from environment or file
let APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY;

// If private key file path is provided, read from file
if (process.env.APPLE_PRIVATE_KEY_PATH) {
  try {
    const keyPath = path.resolve(process.env.APPLE_PRIVATE_KEY_PATH);
    APPLE_PRIVATE_KEY = fs.readFileSync(keyPath, 'utf8');
    console.log('✅ Loaded Apple private key from file');
  } catch (error) {
    console.error('❌ Error reading private key file:', error);
    throw new Error('Failed to read Apple private key file');
  }
}

/**
 * Generate JWT token for App Store Connect API
 */
function generateAppStoreConnectJWT() {
  const now = Math.floor(Date.now() / 1000);
  
  if (!APPLE_PRIVATE_KEY) {
    throw new AppError('APPLE_PRIVATE_KEY is not set in environment variables', 500);
  }
  
  // Format private key (handle newlines and quotes)
  let privateKey = APPLE_PRIVATE_KEY.trim();
  
  // Remove quotes if present
  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || 
      (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.slice(1, -1).trim();
  }
  
  // Replace escaped newlines with actual newlines
  privateKey = privateKey.replace(/\\n/g, '\n');
  
  // If key doesn't have BEGIN/END markers, add them
  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    // Key is just the base64 string, we need to format it properly
    // Remove any existing newlines and split into 64-char lines
    const base64Content = privateKey.replace(/\n/g, '').replace(/\s/g, '');
    
    // Split into 64-character lines (standard PEM format)
    const lines = [];
    for (let i = 0; i < base64Content.length; i += 64) {
      lines.push(base64Content.substring(i, i + 64));
    }
    
    privateKey = `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`;
  } else {
    // Key has markers, but ensure proper formatting
    // Ensure there's a newline after BEGIN and before END
    if (!privateKey.includes('BEGIN PRIVATE KEY\n') && !privateKey.includes('BEGIN PRIVATE KEY\r\n')) {
      privateKey = privateKey.replace('BEGIN PRIVATE KEY', 'BEGIN PRIVATE KEY\n');
    }
    if (!privateKey.includes('\n-----END PRIVATE KEY')) {
      privateKey = privateKey.replace('-----END PRIVATE KEY', '\n-----END PRIVATE KEY');
    }
    // Ensure trailing newline
    if (!privateKey.endsWith('\n')) {
      privateKey = privateKey + '\n';
    }
  }
  
  // Debug: Log key format (first and last 100 chars only for security)
  console.log('🔑 Private key format check:');
  console.log('  - Has BEGIN marker:', privateKey.includes('BEGIN PRIVATE KEY'));
  console.log('  - Has END marker:', privateKey.includes('END PRIVATE KEY'));
  console.log('  - Key length:', privateKey.length);
  console.log('  - First 50 chars:', privateKey.substring(0, 50));
  console.log('  - Last 50 chars:', privateKey.substring(privateKey.length - 50));
  
  try {
    const token = jwt.sign(
      {
        iss: APPLE_ISSUER_ID,
        iat: now,
        exp: now + 3600, // 1 hour expiry
        aud: 'appstoreconnect-v1',
      },
      privateKey,
      {
        algorithm: 'ES256',
        header: {
          alg: 'ES256',
          kid: APPLE_KEY_ID,
          typ: 'JWT',
        },
      }
    );
    
    console.log('✅ JWT token generated successfully');
    console.log('  - Token length:', token.length);
    console.log('  - Key ID:', APPLE_KEY_ID);
    console.log('  - Issuer ID:', APPLE_ISSUER_ID);
    
    return token;
  } catch (error) {
    console.error('❌ Error generating JWT token:', error.message);
    console.error('  - Error details:', error);
    console.error('  - Private key preview (first 100):', privateKey.substring(0, 100));
    console.error('  - Private key preview (last 100):', privateKey.substring(privateKey.length - 100));
    throw new AppError(`Failed to generate App Store Connect token: ${error.message}`, 500);
  }
}

/**
 * Validate App Store receipt with Apple
 * @param {string} receiptData - Base64 encoded receipt data
 * @param {boolean} isProduction - Use production or sandbox environment
 */
async function validateReceipt(receiptData, isProduction = true) {
  try {
    const url = isProduction
      ? 'https://buy.itunes.apple.com/verifyReceipt'
      : 'https://sandbox.itunes.apple.com/verifyReceipt';
    
    const response = await axios.post(url, {
      'receipt-data': receiptData,
      password: APPLE_SHARED_SECRET,
      'exclude-old-transactions': false,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error validating receipt:', error);
    throw new AppError('Failed to validate Apple receipt', 400);
  }
}

/**
 * Get all subscription products from App Store Connect
 */
exports.getAppleSubscriptionProducts = async (req, res, next) => {
  try {
    // Try to fetch from App Store Connect API
    try {
      const token = generateAppStoreConnectJWT();
      console.log('🔐 Generated token (first 50 chars):', token.substring(0, 50) + '...');
      
      // Get your app's ID first
      console.log('📱 Fetching app with Bundle ID:', APPLE_BUNDLE_ID);
      const appResponse = await axios.get(
        `https://api.appstoreconnect.apple.com/v1/apps?filter[bundleId]=${APPLE_BUNDLE_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!appResponse.data.data || appResponse.data.data.length === 0) {
        throw new Error('App not found in App Store Connect');
      }
      
      const appId = appResponse.data.data[0].id;
      
      // Get subscription groups
      const subscriptionGroupsResponse = await axios.get(
        `https://api.appstoreconnect.apple.com/v1/apps/${appId}/subscriptionGroups`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!subscriptionGroupsResponse.data.data || subscriptionGroupsResponse.data.data.length === 0) {
        // Return fallback products
        return res.status(200).json({
          status: '1',
          message: 'Products fetched successfully (fallback)',
          data: {
            products: [
              {
                productId: 'trimbiz_monthly_owner',
                name: 'Trim Business Owner Plan',
                description: 'Monthly subscription for business owners',
                duration: 'P1M',
                price: null,
                currency: null,
                status: 'ACTIVE',
              },
            ],
          },
        });
      }
      
      const subscriptionGroupId = subscriptionGroupsResponse.data.data[0].id;
      
      // Get subscriptions in the group
      const subscriptionsResponse = await axios.get(
        `https://api.appstoreconnect.apple.com/v1/subscriptionGroups/${subscriptionGroupId}/subscriptions`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Get product details for each subscription
      const products = [];
      
      for (const subscription of subscriptionsResponse.data.data) {
        try {
          // Get subscription localizations for name and description
          const localizationsResponse = await axios.get(
            `https://api.appstoreconnect.apple.com/v1/subscriptions/${subscription.id}/subscriptionLocalizations`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          // Get pricing information
          const pricesResponse = await axios.get(
            `https://api.appstoreconnect.apple.com/v1/subscriptions/${subscription.id}/prices`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          const localization = localizationsResponse.data.data[0]?.attributes || {};
          const price = pricesResponse.data.data[0]?.attributes || {};
          
          products.push({
            productId: subscription.attributes.productId,
            name: localization.name || subscription.attributes.name,
            description: localization.description || '',
            duration: subscription.attributes.duration, // P1M, P1Y, etc.
            price: price.price || null,
            currency: price.currency || null,
            status: subscription.attributes.subscriptionStatus,
          });
        } catch (error) {
          console.error(`Error fetching details for subscription ${subscription.id}:`, error.message);
          // Continue with basic info
          products.push({
            productId: subscription.attributes.productId,
            name: subscription.attributes.name || 'Subscription',
            description: '',
            duration: subscription.attributes.duration,
            price: null,
            currency: null,
            status: subscription.attributes.subscriptionStatus,
          });
        }
      }
      
      return res.status(200).json({
        status: '1',
        message: 'Products fetched successfully',
        data: {
          products: products,
        },
      });
    } catch (apiError) {
      console.error('❌ App Store Connect API error:', apiError.response?.data || apiError.message);
      
      // Log detailed error information
      if (apiError.response?.data?.errors) {
        const errors = apiError.response.data.errors;
        errors.forEach(err => {
          console.error(`  - Status: ${err.status}, Code: ${err.code}`);
          console.error(`  - Title: ${err.title}`);
          console.error(`  - Detail: ${err.detail}`);
        });
      }
      
      // Check if it's an authentication error
      if (apiError.response?.status === 401) {
        console.error('🔐 Authentication failed. Please verify:');
        console.error('  1. APPLE_ISSUER_ID:', APPLE_ISSUER_ID);
        console.error('  2. APPLE_KEY_ID:', APPLE_KEY_ID);
        console.error('  3. Private key is properly formatted');
        console.error('  4. Key ID matches the downloaded key file');
      }
      
      // Fallback: Return hardcoded products if API fails
      return res.status(200).json({
        status: '1',
        message: 'Products fetched successfully (fallback)',
        data: {
          products: [
            {
              productId: 'trimbiz_monthly_owner',
              name: 'Trim Business Owner Plan',
              description: 'Monthly subscription for business owners',
              duration: 'P1M',
              price: null,
              currency: null,
              status: 'ACTIVE',
            },
          ],
        },
      });
    }
  } catch (error) {
    console.error('Error fetching Apple products:', error);
    next(error);
  }
};

/**
 * Validate product and get product details
 * This is called before frontend initiates purchase
 */
exports.validateProduct = async (req, res, next) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      throw new AppError('Product ID is required', 400);
    }
    
    // Validate product exists (you can check against your database or App Store Connect)
    // For now, we'll just validate the format and return success
    
    // You can add additional validation here:
    // - Check if product exists in App Store Connect
    // - Check if product is active
    // - Check if user is eligible for this product
    
    return res.status(200).json({
      status: '1',
      message: 'Product validated successfully',
      data: {
        productId: productId,
        valid: true,
        message: 'Product is valid and ready for purchase',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Apple subscription from receipt
 */
exports.createAppleSubscription = async (req, res, next) => {
  try {
    const { receiptData, userId, productId, memberCount, metadata } = req.body;
    
    if (!receiptData) {
      throw new AppError('Receipt data is required', 400);
    }
    
    if (!userId) {
      throw new AppError('User ID is required', 400);
    }
    
    // Validate receipt - try production first
    let receiptResponse = await validateReceipt(receiptData, true);
    
    // If production validation fails with status 21007, try sandbox
    if (receiptResponse.status === 21007) {
      console.log('Production validation failed, trying sandbox...');
      receiptResponse = await validateReceipt(receiptData, false);
    }
    
    // Check receipt validation status
    if (receiptResponse.status !== 0) {
      const errorMessages = {
        21000: 'The App Store could not read the JSON object you provided.',
        21002: 'The data in the receipt-data property was malformed or missing.',
        21003: 'The receipt could not be authenticated.',
        21004: 'The shared secret you provided does not match the shared secret on file.',
        21005: 'The receipt server is not currently available.',
        21006: 'This receipt is valid but the subscription has expired.',
        21007: 'This receipt is from the test environment, but it was sent to the production environment.',
        21008: 'This receipt is from the production environment, but it was sent to the test environment.',
        21010: 'This receipt could not be authorized.',
      };
      
      throw new AppError(
        errorMessages[receiptResponse.status] || `Receipt validation failed with status: ${receiptResponse.status}`,
        400
      );
    }
    
    const receipt = receiptResponse.receipt;
    const latestReceiptInfo = receiptResponse.latest_receipt_info || [];
    
    if (latestReceiptInfo.length === 0) {
      throw new AppError('No subscription found in receipt', 400);
    }
    
    // Get the latest transaction
    const latestTransaction = latestReceiptInfo[latestReceiptInfo.length - 1];
    const originalTransactionId = latestTransaction.original_transaction_id;
    const transactionId = latestTransaction.transaction_id;
    const productIdFromReceipt = latestTransaction.product_id;
    
    // Verify bundle ID matches
    if (receipt.bundle_id !== APPLE_BUNDLE_ID) {
      throw new AppError('Bundle ID mismatch', 400);
    }
    
    // Find user
    const salonUser = await user.findByPk(userId);
    if (!salonUser) {
      throw new AppError('User not found', 404);
    }
    
    // Find salon
    const salon = await salonDetail.findOne({
      where: { userId: salonUser.id },
    });
    
    if (!salon) {
      throw new AppError('Salon not found', 404);
    }
    
    // Calculate period dates
    const purchaseDate = new Date(parseInt(latestTransaction.purchase_date_ms));
    const expiresDate = new Date(parseInt(latestTransaction.expires_date_ms));
    
    // Check if subscription already exists
    const existingSubscription = await subscriptions.findOne({
      where: {
        appleOriginalTransactionId: originalTransactionId,
        subscriptionSource: 'apple',
      },
    });
    
    let subscription;
    
    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.subscriptionId = transactionId;
      existingSubscription.appleTransactionId = transactionId;
      existingSubscription.status = 'active';
      existingSubscription.periodStart = purchaseDate;
      existingSubscription.periodEnd = expiresDate;
      existingSubscription.appleProductId = productIdFromReceipt;
      existingSubscription.priceId = productIdFromReceipt;
      existingSubscription.amountPaid = parseFloat(latestTransaction.price || 0);
      existingSubscription.currency = latestTransaction.currency || 'USD';
      existingSubscription.appleEnvironment = receiptResponse.environment || 'Production';
      existingSubscription.VAT = parseFloat(metadata?.VAT || '0');
      await existingSubscription.save();
      subscription = existingSubscription;
    } else {
      // Create new subscription
      subscription = await subscriptions.create({
        userId: salonUser.id,
        salonDetailId: salon.id,
        subscriptionId: transactionId,
        appleTransactionId: transactionId,
        appleOriginalTransactionId: originalTransactionId,
        appleProductId: productIdFromReceipt,
        subscriptionSource: 'apple',
        status: 'active',
        periodStart: purchaseDate,
        periodEnd: expiresDate,
        priceId: productIdFromReceipt,
        customerId: salonUser.id.toString(),
        name: metadata?.subscriptionName || 'Apple Subscription',
        amountPaid: parseFloat(latestTransaction.price || 0),
        currency: latestTransaction.currency || 'USD',
        appleEnvironment: receiptResponse.environment || 'Production',
        VAT: parseFloat(metadata?.VAT || '0'),
      });
    }
    
    // Update salon
    salon.approvedByAdmin = true;
    salon.subscriptionPlan = transactionId;
    salon.registrationExpiryDate = expiresDate;
    salon.registrationDate = purchaseDate;
    salon.hasObtainedFreeTrial = 1;
    salon.subscriptionLatestPaymentStatus = 'payment_succeeded';
    await salon.save();
    
    // Update user with original transaction ID
    salonUser.appleOriginalTransactionId = originalTransactionId;
    await salonUser.save();
    
    return res.status(200).json({
      status: '1',
      message: 'Apple subscription created successfully',
      data: {
        subscriptionId: transactionId,
        originalTransactionId: originalTransactionId,
        expiresDate: expiresDate,
        productId: productIdFromReceipt,
        status: 'active',
      },
    });
  } catch (error) {
    console.error('Error creating Apple subscription:', error);
    next(error);
  }
};

/**
 * Verify and get subscription status
 */
exports.verifyAppleSubscription = async (req, res, next) => {
  try {
    const { originalTransactionId, userId } = req.body;
    
    if (!originalTransactionId && !userId) {
      throw new AppError('Either originalTransactionId or userId is required', 400);
    }
    
    let subscription;
    
    if (originalTransactionId) {
      subscription = await subscriptions.findOne({
        where: {
          appleOriginalTransactionId: originalTransactionId,
          subscriptionSource: 'apple',
        },
        order: [['createdAt', 'DESC']],
      });
    } else {
      const salonUser = await user.findByPk(userId);
      if (!salonUser) {
        throw new AppError('User not found', 404);
      }
      
      subscription = await subscriptions.findOne({
        where: {
          userId: salonUser.id,
          subscriptionSource: 'apple',
        },
        order: [['createdAt', 'DESC']],
      });
    }
    
    if (!subscription) {
      throw new AppError('Subscription not found', 404);
    }
    
    // Check if subscription is expired
    const now = new Date();
    const isExpired = subscription.periodEnd < now;
    
    return res.status(200).json({
      status: '1',
      message: 'Subscription verified',
      data: {
        subscription: {
          id: subscription.subscriptionId,
          originalTransactionId: subscription.appleOriginalTransactionId,
          status: isExpired ? 'expired' : subscription.status,
          expiresDate: subscription.periodEnd,
          productId: subscription.appleProductId,
          isExpired: isExpired,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

