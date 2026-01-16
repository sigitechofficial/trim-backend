const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
  
  console.log('🔑 Starting key parsing...');
  
  // Step 1: Get raw key and handle quotes
  let rawKey = APPLE_PRIVATE_KEY.trim();
  console.log('  - Raw key length:', rawKey.length);
  console.log('  - Starts with quote:', rawKey.startsWith('"') || rawKey.startsWith("'"));
  
  // Remove surrounding quotes if present
  if ((rawKey.startsWith('"') && rawKey.endsWith('"')) || 
      (rawKey.startsWith("'") && rawKey.endsWith("'"))) {
    rawKey = rawKey.slice(1, -1).trim();
    console.log('  - Removed quotes, new length:', rawKey.length);
  }
  
  // Step 2: Replace escaped newlines with actual newlines
  rawKey = rawKey.replace(/\\n/g, '\n');
  
  // Step 3: Extract ONLY the base64 content (remove all markers and whitespace)
  let base64Content = rawKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/-{3,}/g, '')
    .replace(/\s+/g, '')
    .replace(/\r/g, '')
    .replace(/\n/g, '')
    .trim();
  
  console.log('  - Base64 content length:', base64Content.length);
  console.log('  - First 30 chars:', base64Content.substring(0, 30));
  console.log('  - Last 30 chars:', base64Content.substring(base64Content.length - 30));
  
  // Step 4: Validate base64 content
  if (base64Content.length < 100) {
    throw new AppError(`Private key base64 content is too short (${base64Content.length} chars). Expected ~120+ chars. Check APPLE_PRIVATE_KEY in .env`, 500);
  }
  
  // Step 5: Rebuild proper PEM format with 64-char lines
  const lines = [];
  for (let i = 0; i < base64Content.length; i += 64) {
    lines.push(base64Content.substring(i, i + 64));
  }
  
  const privateKey = `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
  
  console.log('  - Rebuilt key with', lines.length, 'lines');
  console.log('  - Total PEM length:', privateKey.length);
  
  // Step 6: VALIDATE the key using Node's crypto module
  try {
    console.log('  - Validating key with crypto module...');
    const keyObject = crypto.createPrivateKey({
      key: privateKey,
      format: 'pem',
      type: 'pkcs8'
    });
    
    console.log('  ✅ Key validation passed!');
    console.log('    - Key type:', keyObject.asymmetricKeyType);
    console.log('    - Key size:', keyObject.asymmetricKeySize);
    
    if (keyObject.asymmetricKeyType !== 'ec') {
      throw new AppError(`Wrong key type! Expected 'ec' (Elliptic Curve), got '${keyObject.asymmetricKeyType}'. Make sure you downloaded the correct .p8 key file from App Store Connect.`, 500);
    }
  } catch (cryptoError) {
    console.error('  ❌ Crypto validation failed:', cryptoError.message);
    console.error('  - This means the key content is invalid or corrupted');
    console.error('  - Please download the .p8 file again from App Store Connect');
    console.error('  - Copy the ENTIRE content including BEGIN/END markers');
    throw new AppError(`Invalid private key: ${cryptoError.message}. Please re-download from App Store Connect.`, 500);
  }
  
  // Step 7: Generate JWT token
  try {
    console.log('  - Generating JWT token...');
    const token = jwt.sign(
      {
        iss: APPLE_ISSUER_ID,
        iat: now,
        exp: now + 1200, // Apple recommends max 20 minutes (1200 seconds)
        aud: 'appstoreconnect-v1',
        bid: APPLE_BUNDLE_ID, // Bundle ID claim for StoreKit APIs
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
    
    console.log('✅ JWT token generated successfully!');
    console.log('  - Token length:', token.length);
    console.log('  - Key ID:', APPLE_KEY_ID);
    console.log('  - Issuer ID:', APPLE_ISSUER_ID);
    
    return token;
  } catch (error) {
    console.error('❌ JWT signing failed:', error.message);
    console.error('  - This is unexpected since crypto validation passed');
    throw new AppError(`JWT signing failed: ${error.message}`, 500);
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
    const token = generateAppStoreConnectJWT();
    console.log('🔐 JWT Token generated');
    console.log('  - Token preview:', token.substring(0, 50) + '...');
    
    // Step 1: Get all apps (not filtered by bundle ID first)
    console.log('\n📱 Step 1: Fetching all apps from App Store Connect');
    let appsResponse;
    try {
      appsResponse = await axios.get(
        'https://api.appstoreconnect.apple.com/v1/apps',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      
      console.log('✅ Successfully fetched apps');
      console.log('  - Total apps found:', appsResponse.data.data?.length || 0);
      
      // Log all bundle IDs to help debug
      if (appsResponse.data.data && appsResponse.data.data.length > 0) {
        console.log('\n📋 Apps in your account:');
        appsResponse.data.data.forEach((app, index) => {
          console.log(`  ${index + 1}. ${app.attributes.name}`);
          console.log(`     Bundle ID: ${app.attributes.bundleId}`);
          console.log(`     App ID: ${app.id}`);
        });
      }
    } catch (error) {
      console.error('\n❌ Failed to fetch apps from App Store Connect');
      console.error('  - Status:', error.response?.status);
      console.error('  - Error:', JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
    
    // Step 2: Find the specific app by bundle ID
    console.log('\n📱 Step 2: Looking for app with Bundle ID:', APPLE_BUNDLE_ID);
    const app = appsResponse.data.data.find(
      a => a.attributes.bundleId === APPLE_BUNDLE_ID
    );
    
    if (!app) {
      console.error('❌ App not found with Bundle ID:', APPLE_BUNDLE_ID);
      console.error('   Available bundle IDs:', 
        appsResponse.data.data.map(a => a.attributes.bundleId).join(', '));
      throw new AppError(
        `App not found with Bundle ID: ${APPLE_BUNDLE_ID}. Check if the bundle ID is correct in your .env file.`,
        404
      );
    }
    
    const appId = app.id;
    console.log('✅ Found app:', app.attributes.name);
    console.log('  - App ID:', appId);
    
    // Step 3: Get subscription groups
    console.log('\n📦 Step 3: Fetching subscription groups...');
    const groupsResponse = await axios.get(
      `https://api.appstoreconnect.apple.com/v1/apps/${appId}/subscriptionGroups`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('✅ Subscription groups found:', groupsResponse.data.data?.length || 0);
    
    if (!groupsResponse.data.data || groupsResponse.data.data.length === 0) {
      console.error('❌ No subscription groups found');
      console.error('   Please create a subscription group in App Store Connect:');
      console.error('   1. Go to App Store Connect → Your App → Subscriptions');
      console.error('   2. Create a Subscription Group');
      console.error('   3. Add your subscription products to the group');
      
      throw new AppError(
        'No subscription groups found. Please set up subscriptions in App Store Connect.',
        404
      );
    }
    
    // Step 4: Get all subscriptions from all groups
    const allProducts = [];
    
    for (const group of groupsResponse.data.data) {
      console.log(`\n📋 Fetching subscriptions for group: ${group.attributes.name}`);
      
      const subscriptionsResponse = await axios.get(
        `https://api.appstoreconnect.apple.com/v1/subscriptionGroups/${group.id}/subscriptions`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (subscriptionsResponse.data.data) {
        console.log(`  - Found ${subscriptionsResponse.data.data.length} subscription(s)`);
        
        // Add products without fetching prices (faster)
        for (const sub of subscriptionsResponse.data.data) {
          allProducts.push({
            productId: sub.attributes.productId,
            name: sub.attributes.name,
            groupName: group.attributes.name,
            state: sub.attributes.state,
            subscriptionPeriod: sub.attributes.subscriptionPeriod,
          });
          
          console.log(`    ✓ ${sub.attributes.productId} - ${sub.attributes.name}`);
        }
      }
    }
    
    console.log(`\n✅ Total products found: ${allProducts.length}`);
    
    return res.status(200).json({
      success: true,
      message: 'Products fetched successfully from App Store Connect',
      data: {
        products: allProducts,
      },
    });
    
  } catch (error) {
    console.error('\n❌ Error in getAppleSubscriptionProducts:', error.message);
    
    // Return detailed error to help debug
    if (error.response?.status === 401) {
      return next(new AppError(
        'Authentication failed with App Store Connect. Please verify your API key credentials.',
        401
      ));
    }
    
    if (error.response?.status === 404) {
      return next(new AppError(
        error.message || 'Resource not found in App Store Connect',
        404
      ));
    }
    
    return next(new AppError(
      error.message || 'Failed to fetch products from App Store Connect',
      500
    ));
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
    
    console.log(`\n🔍 Validating product: ${productId}`);
    
    // Generate JWT for App Store Connect API
    const token = generateAppStoreConnectJWT();
    
    // Step 1: Get the app
    const appsResponse = await axios.get(
      `https://api.appstoreconnect.apple.com/v1/apps?filter[bundleId]=${APPLE_BUNDLE_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const app = appsResponse.data.data?.[0];
    if (!app) {
      throw new AppError('App not found in App Store Connect', 404);
    }
    
    // Step 2: Get subscription groups
    const groupsResponse = await axios.get(
      `https://api.appstoreconnect.apple.com/v1/apps/${app.id}/subscriptionGroups`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!groupsResponse.data.data || groupsResponse.data.data.length === 0) {
      throw new AppError('No subscription groups found', 404);
    }
    
    // Step 3: Search for the product in all subscription groups
    let foundProduct = null;
    let foundGroup = null;
    
    for (const group of groupsResponse.data.data) {
      const subscriptionsResponse = await axios.get(
        `https://api.appstoreconnect.apple.com/v1/subscriptionGroups/${group.id}/subscriptions`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const product = subscriptionsResponse.data.data?.find(
        sub => sub.attributes.productId === productId
      );
      
      if (product) {
        foundProduct = product;
        foundGroup = group;
        break;
      }
    }
    
    // Step 4: Validate product was found
    if (!foundProduct) {
      console.log(`❌ Product not found: ${productId}`);
      return res.status(200).json({
        status: '0',
        message: 'Product not found',
        data: {
          productId: productId,
          valid: false,
          reason: 'Product does not exist in App Store Connect',
        },
      });
    }
    
    // Step 5: Check product state
    const productState = foundProduct.attributes.state;
    const isActive = ['READY_TO_SUBMIT', 'WAITING_FOR_REVIEW', 'IN_REVIEW', 'APPROVED'].includes(productState);
    
    console.log(`✅ Product found: ${foundProduct.attributes.name}`);
    console.log(`   State: ${productState}`);
    console.log(`   Available: ${isActive}`);
    
    // Step 6: Return validation result
    return res.status(200).json({
      status: '1',
      message: 'Product validated successfully',
      data: {
        productId: productId,
        valid: true,
        available: isActive,
        product: {
          name: foundProduct.attributes.name,
          state: productState,
          subscriptionPeriod: foundProduct.attributes.subscriptionPeriod,
          groupName: foundGroup.attributes.name,
          familySharable: foundProduct.attributes.familySharable,
        },
        message: isActive 
          ? 'Product is available for purchase' 
          : `Product is not available (state: ${productState})`,
      },
    });
    
  } catch (error) {
    console.error('❌ Error validating product:', error.message);
    
    if (error.response?.status === 401) {
      return next(new AppError('Authentication failed with App Store Connect', 401));
    }
    
    if (error.response?.status === 404) {
      return next(new AppError('Resource not found', 404));
    }
    
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

/**
 * Verify Apple IAP Purchase using App Store Server API (Modern Method)
 * Endpoint: POST /salon/v1/iap/apple/verify
 * Uses Apple's current App Store Server API, not deprecated verifyReceipt
 */
exports.verifyApplePurchase = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      transactionId,
      originalTransactionId,
      productId,
      priceId,
      membersCount,
      subscriptionName,
      subscriptionPrice,
      vat,
    } = req.body;

    console.log('\n🍎 Apple IAP Verification Started (App Store Server API)');
    console.log('  User ID:', userId);
    console.log('  Transaction ID:', transactionId);
    console.log('  Product ID:', productId);

    // Step 1: Validate required fields
    if (!transactionId || !productId) {
      return res.status(200).json({
        status: '0',
        message: 'Missing required fields',
        error: 'transactionId and productId are required',
      });
    }

    // Step 2: Check for duplicate transaction (Idempotency)
    console.log('\n🔍 Checking for duplicate transaction...');
    const existingSubscription = await subscriptions.findOne({
      where: {
        appleTransactionId: transactionId,
        subscriptionSource: 'apple',
      },
    });

    if (existingSubscription) {
      console.log('✅ Transaction already processed, returning existing subscription');
      
      const expiryDate = existingSubscription.periodEnd 
        ? new Date(existingSubscription.periodEnd).toISOString().split('T')[0]
        : null;

      return res.status(200).json({
        status: '1',
        message: 'Purchase already verified',
        data: {
          subscriptionId: existingSubscription.subscriptionId,
          expiryDate,
          price: existingSubscription.amountPaid?.toString() || subscriptionPrice?.toString(),
        },
      });
    }

    // Step 3: Get transaction info from Apple using App Store Server API
    console.log('\n📱 Fetching transaction from Apple Server API...');
    const token = generateAppStoreConnectJWT();
    
    try {
      // Use Apple's Get Transaction Info endpoint
      const transactionUrl = `https://api.storekit.itunes.apple.com/inApps/v1/transactions/${transactionId}`;
      
      const transactionResponse = await axios.get(transactionUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      console.log('✅ Transaction fetched from Apple');
      
      // The response contains a signedTransaction (JWS)
      const signedTransaction = transactionResponse.data.signedTransaction;
      
      if (!signedTransaction) {
        throw new Error('No signed transaction in response');
      }

      // Step 4: Decode JWS to get transaction data
      // Note: In production, you should verify the JWS signature
      // For now, we'll decode it (Apple signs it, so it's trusted if from their API)
      const transactionPayload = JSON.parse(
        Buffer.from(signedTransaction.split('.')[1], 'base64').toString()
      );

      console.log('📋 Transaction Details:');
      console.log('  Product ID:', transactionPayload.productId);
      console.log('  Original Transaction ID:', transactionPayload.originalTransactionId);
      console.log('  Purchase Date:', new Date(transactionPayload.purchaseDate).toISOString());
      console.log('  Expires Date:', transactionPayload.expiresDate ? new Date(transactionPayload.expiresDate).toISOString() : 'N/A');

      // Step 5: Verify product ID matches
      if (transactionPayload.productId !== productId) {
        console.error('❌ Product ID mismatch');
        return res.status(200).json({
          status: '0',
          message: 'Product ID mismatch',
          error: `Transaction product ID (${transactionPayload.productId}) does not match request (${productId})`,
        });
      }

      console.log('✅ Transaction verified');

      // Step 6: Calculate subscription dates
      const purchaseDate = new Date(transactionPayload.purchaseDate);
      const expiresDate = transactionPayload.expiresDate 
        ? new Date(transactionPayload.expiresDate)
        : new Date(purchaseDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days if not provided

      // Add 5 days grace period (same as Stripe)
      const gracePeriodDays = 5;
      const expiryDateWithGrace = new Date(expiresDate);
      expiryDateWithGrace.setDate(expiryDateWithGrace.getDate() + gracePeriodDays);

      console.log('📅 Subscription Dates:');
      console.log('  Purchase Date:', purchaseDate.toISOString());
      console.log('  Expires Date:', expiresDate.toISOString());
      console.log('  Expiry with Grace:', expiryDateWithGrace.toISOString());

      // Step 7: Generate subscription ID
      const subscriptionId = `sub_apple_${Date.now()}_${transactionId.slice(-8)}`;

      // Step 8: Determine environment
      const environment = transactionPayload.environment || 'Sandbox';

      // Step 9: Create subscription record
      console.log('\n💾 Creating subscription record...');
      const newSubscription = await subscriptions.create({
        subscriptionId: subscriptionId,
        name: subscriptionName || productId,
        customerId: userId.toString(),
        amountPaid: subscriptionPrice || 0,
        currency: 'USD',
        priceId: priceId,
        periodStart: purchaseDate,
        periodEnd: expiryDateWithGrace,
        status: 'active',
        VAT: vat || 0,
        // Apple-specific fields
        appleTransactionId: transactionId,
        appleOriginalTransactionId: originalTransactionId || transactionPayload.originalTransactionId,
        subscriptionSource: 'apple',
        appleProductId: productId,
        appleEnvironment: environment,
      });

      console.log('✅ Subscription created:', newSubscription.subscriptionId);

      // Step 10: Update user record
      await user.update(
        { appleOriginalTransactionId: originalTransactionId || transactionPayload.originalTransactionId },
        { where: { id: userId } }
      );

      // Step 11: Format response
      const expiryDateFormatted = expiryDateWithGrace.toISOString().split('T')[0];

      console.log('\n✅ Apple IAP Verification Complete');
      console.log('  Subscription ID:', subscriptionId);
      console.log('  Expiry Date:', expiryDateFormatted);

      return res.status(200).json({
        status: '1',
        message: 'Purchase verified successfully',
        data: {
          subscriptionId: subscriptionId,
          expiryDate: expiryDateFormatted,
          price: subscriptionPrice?.toString() || '0',
        },
      });

    } catch (apiError) {
      console.error('\n❌ Apple Server API Error:', apiError.response?.data || apiError.message);
      
      // Handle specific Apple API errors
      if (apiError.response?.status === 404) {
        return res.status(200).json({
          status: '0',
          message: 'Transaction not found',
          error: 'The transaction ID was not found in Apple\'s system. It may be invalid or from a different environment.',
        });
      }
      
      if (apiError.response?.status === 401) {
        return res.status(200).json({
          status: '0',
          message: 'Authentication failed with Apple',
          error: 'Unable to authenticate with Apple Server API. Check credentials.',
        });
      }

      throw apiError;
    }

  } catch (error) {
    console.error('\n❌ Apple IAP Verification Error:', error);
    return res.status(500).json({
      status: '0',
      message: 'Verification failed',
      error: error.message,
    });
  }
};

/**
 * Test Apple API credentials
 * Verifies that JWT generation and Apple authentication works
 */
exports.testAppleCredentials = async (req, res, next) => {
  try {
    console.log('\n🧪 Testing Apple API Credentials...');
    console.log('================================================');
    
    // Step 1: Check all env variables
    console.log('📋 Environment Variables:');
    console.log('  APPLE_ISSUER_ID:', APPLE_ISSUER_ID ? '✅ Set' : '❌ Missing');
    console.log('  APPLE_KEY_ID:', APPLE_KEY_ID ? '✅ Set' : '❌ Missing');
    console.log('  APPLE_BUNDLE_ID:', APPLE_BUNDLE_ID ? '✅ Set' : '❌ Missing');
    console.log('  APPLE_PRIVATE_KEY:', APPLE_PRIVATE_KEY ? '✅ Set' : '❌ Missing');
    console.log('  APPLE_SHARED_SECRET:', APPLE_SHARED_SECRET ? '✅ Set' : '❌ Missing');
    
    if (!APPLE_ISSUER_ID || !APPLE_KEY_ID || !APPLE_BUNDLE_ID || !APPLE_PRIVATE_KEY) {
      return res.status(500).json({
        status: '0',
        message: 'Missing required Apple credentials in environment variables',
        data: {
          hasIssuerId: !!APPLE_ISSUER_ID,
          hasKeyId: !!APPLE_KEY_ID,
          hasBundleId: !!APPLE_BUNDLE_ID,
          hasPrivateKey: !!APPLE_PRIVATE_KEY,
        },
      });
    }
    
    // Step 2: Generate JWT
    console.log('\n🔐 Generating JWT...');
    const token = generateAppStoreConnectJWT();
    console.log('✅ JWT generated successfully');
    console.log('  Token preview:', token.substring(0, 80) + '...');
    
    // Step 3: Test with Apple API
    console.log('\n📡 Testing authentication with Apple API...');
    try {
      const response = await axios.get(
        'https://api.appstoreconnect.apple.com/v1/apps',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      
      console.log('✅ Successfully authenticated with Apple!');
      console.log('  Status:', response.status);
      console.log('  Apps found:', response.data.data?.length || 0);
      
      return res.status(200).json({
        status: '1',
        message: 'Apple API credentials are valid and working!',
        data: {
          authenticated: true,
          appsCount: response.data.data?.length || 0,
          issuer: APPLE_ISSUER_ID,
          keyId: APPLE_KEY_ID,
          bundleId: APPLE_BUNDLE_ID,
        },
      });
    } catch (apiError) {
      console.error('\n❌ Apple API authentication failed:');
      console.error('  Status:', apiError.response?.status);
      console.error('  Error:', apiError.response?.data);
      
      // Detailed error analysis
      let errorMessage = 'Authentication failed with Apple';
      let troubleshooting = [];
      
      if (apiError.response?.status === 401) {
        errorMessage = 'Apple rejected the authentication token (401 Unauthorized)';
        troubleshooting = [
          '1. Verify APPLE_ISSUER_ID matches your Team ID in App Store Connect',
          '2. Verify APPLE_KEY_ID matches the Key ID of your downloaded .p8 file',
          '3. Ensure the API key is still active in App Store Connect > Users and Access > Keys',
          '4. Check that the private key content matches the Key ID',
          '5. Ensure your API key has "App Manager" or "Admin" role',
          '6. Verify server time is synchronized (check: date -u)',
        ];
      }
      
      return res.status(500).json({
        status: '0',
        message: errorMessage,
        data: {
          authenticated: false,
          httpStatus: apiError.response?.status,
          appleError: apiError.response?.data,
          troubleshooting,
          credentials: {
            issuerId: APPLE_ISSUER_ID,
            keyId: APPLE_KEY_ID,
            bundleId: APPLE_BUNDLE_ID,
          },
        },
      });
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return res.status(500).json({
      status: '0',
      message: error.message,
      data: { error: error.toString() },
    });
  }
};

