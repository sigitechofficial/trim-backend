# Apple Subscription Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Complete Flow](#complete-flow)
3. [API Endpoints](#api-endpoints)
4. [Request/Response Examples](#requestresponse-examples)
5. [Use Cases](#use-cases)
6. [Error Handling](#error-handling)
7. [Testing Guide](#testing-guide)
8. [Troubleshooting](#troubleshooting)
9. [Environment Variables](#environment-variables)
10. [Database Schema](#database-schema)

---

## Overview

This document describes the complete Apple subscription integration flow. The backend fetches products from Apple App Store Connect, and the frontend handles the purchase flow.

### Architecture
- **Backend:** Node.js/Express (validates receipts, stores subscriptions)
- **Frontend:** Flutter (uses `in_app_purchase` for purchases)
- **Apple:** App Store Connect (product management, payment processing)

### Key Components
- Backend API endpoints for product management and receipt validation
- Flutter service for handling in-app purchases
- Apple Server-to-Server Notifications for subscription events
- Database schema for storing subscription data

---

## Complete Flow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLE SUBSCRIPTION FLOW                    │
└─────────────────────────────────────────────────────────────┘

1. Backend fetches products from Apple App Store Connect
   ↓
2. Backend sends products list to frontend
   ↓
3. Frontend displays products to user
   ↓
4. User selects a product
   ↓
5. Frontend sends selected product ID to backend
   ↓
6. Backend validates product and returns product details
   ↓
7. Frontend initiates purchase with that product
   ↓
8. Frontend sends receipt to backend
   ↓
9. Backend validates receipt and creates subscription ✅
```

---

### Detailed Flow Breakdown

#### Step 1: Backend Fetches Products from Apple App Store Connect

**What happens:**
- Backend calls App Store Connect API using JWT authentication
- Retrieves all active subscription products for the app
- Formats product data for frontend consumption

**Backend Action:**
```javascript
// Endpoint: GET /apple-subscriptions/products
// Fetches products from App Store Connect API
```

**Products Retrieved:**
- Product ID (e.g., `trimbiz_monthly_owner`)
- Product Name
- Description
- Duration (Monthly/Yearly)
- Price (if available)
- Status (Active/Inactive)

---

#### Step 2: Backend Sends Products List to Frontend

**What happens:**
- Backend returns formatted product list as JSON
- Frontend receives response with all available products

**Response Format:**
```json
{
  "status": "1",
  "message": "Products fetched successfully",
  "data": {
    "products": [
      {
        "productId": "trimbiz_monthly_owner",
        "name": "Trim Business Owner Plan",
        "description": "Monthly subscription for business owners",
        "duration": "P1M",
        "price": null,
        "currency": null,
        "status": "ACTIVE"
      }
    ]
  }
}
```

---

#### Step 3: Frontend Displays Products to User

**What happens:**
- Frontend receives products list
- UI displays available subscription plans
- User can view product details and pricing

**Frontend Action:**
```dart
// Call: getProductsFromBackend()
// Display products in UI (ListView, Cards, etc.)
```

**UI Elements:**
- Product Name
- Description
- Price (fetched from App Store)
- Subscribe Button

---

#### Step 4: User Selects a Product

**What happens:**
- User taps "Subscribe" button on a product card
- Frontend captures the selected `productId`

**User Action:**
- Taps subscribe button
- Confirms selection

---

#### Step 5: Frontend Sends Selected Product ID to Backend

**What happens:**
- Frontend validates product with backend before initiating purchase
- Ensures product is valid and active

**API Call:**
```http
POST /apple-subscriptions/validate-product
Authorization: Bearer {authToken}
Content-Type: application/json

{
  "productId": "trimbiz_monthly_owner"
}
```

**Purpose:**
- Verify product exists in App Store Connect
- Check if product is active
- Validate user eligibility (if needed)

---

#### Step 6: Backend Validates Product and Returns Product Details

**What happens:**
- Backend validates product ID against App Store Connect
- Checks product status and availability
- Returns validation result

**Response (Valid):**
```json
{
  "status": "1",
  "message": "Product validated successfully",
  "data": {
    "productId": "trimbiz_monthly_owner",
    "valid": true,
    "message": "Product is valid and ready for purchase"
  }
}
```

**Response (Invalid):**
```json
{
  "status": "0",
  "message": "Product validation failed",
  "data": {
    "productId": "invalid_product",
    "valid": false,
    "message": "Product not found or inactive"
  }
}
```

---

#### Step 7: Frontend Initiates Purchase with That Product

**What happens:**
- Frontend uses `in_app_purchase` package
- Calls Apple's StoreKit API
- Shows Apple payment UI
- User approves payment

**Frontend Action:**
```dart
// Call: purchaseSubscription(productId: "trimbiz_monthly_owner")
// in_app_purchase package handles:
// 1. Shows Apple payment dialog
// 2. Processes payment
// 3. Returns purchase receipt
```

**User Experience:**
1. Apple payment dialog appears
2. User authenticates (Face ID/Touch ID/Password)
3. Payment is processed by Apple
4. Purchase confirmation shown

---

#### Step 8: Frontend Sends Receipt to Backend

**What happens:**
- Frontend receives receipt from Apple after successful purchase
- Extracts receipt data (base64 encoded)
- Sends receipt to backend for validation

**API Call:**
```http
POST /apple-subscriptions/create-subscription
Authorization: Bearer {authToken}
Content-Type: application/json

{
  "receiptData": "base64_encoded_receipt_string",
  "userId": 123,
  "productId": "trimbiz_monthly_owner",
  "memberCount": 1,
  "metadata": {
    "subscriptionName": "Trim Business Owner Plan",
    "members": 1
  }
}
```

**Receipt Data:**
- Base64 encoded string
- Contains transaction details
- Signed by Apple cryptographically

---

#### Step 9: Backend Validates Receipt and Creates Subscription ✅

**What happens:**
- Backend validates receipt with Apple's receipt validation service
- Extracts subscription information from receipt
- Stores subscription in database
- Updates user/salon status

**Backend Process:**
1. Receives receipt from frontend
2. Validates with Apple's receipt validation service
3. Extracts transaction details:
   - Transaction ID
   - Original Transaction ID
   - Product ID
   - Purchase Date
   - Expiration Date
   - Price
4. Creates subscription record in database
5. Updates salon status (approved, expiry date, etc.)
6. Returns success response

**Response:**
```json
{
  "status": "1",
  "message": "Apple subscription created successfully",
  "data": {
    "subscriptionId": "1000000123456789",
    "originalTransactionId": "1000000123456789",
    "expiresDate": "2024-02-01T00:00:00.000Z",
    "productId": "trimbiz_monthly_owner",
    "status": "active"
  }
}
```

---

## API Endpoints

### 1. Get Subscription Products

**Endpoint:** `GET /apple-subscriptions/products`

**Description:** Fetches all available subscription products from App Store Connect

**Headers:**
```
Authorization: Bearer {authToken}
Content-Type: application/json
```

**Response:**
```json
{
  "status": "1",
  "message": "Products fetched successfully",
  "data": {
    "products": [
      {
        "productId": "trimbiz_monthly_owner",
        "name": "Trim Business Owner Plan",
        "description": "Monthly subscription for business owners",
        "duration": "P1M",
        "price": null,
        "currency": null,
        "status": "ACTIVE"
      }
    ]
  }
}
```

**Use Case:** Frontend calls this to display available subscription plans

**Error Response:**
```json
{
  "status": "0",
  "message": "Failed to fetch products",
  "error": "Error details here"
}
```

---

### 2. Validate Product

**Endpoint:** `POST /apple-subscriptions/validate-product`

**Description:** Validates if a product is valid and ready for purchase

**Headers:**
```
Authorization: Bearer {authToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "trimbiz_monthly_owner"
}
```

**Response (Valid):**
```json
{
  "status": "1",
  "message": "Product validated successfully",
  "data": {
    "productId": "trimbiz_monthly_owner",
    "valid": true,
    "message": "Product is valid and ready for purchase"
  }
}
```

**Response (Invalid):**
```json
{
  "status": "0",
  "message": "Product validation failed",
  "data": {
    "productId": "invalid_product",
    "valid": false,
    "message": "Product not found or inactive"
  }
}
```

**Use Case:** Frontend calls this before initiating purchase to ensure product is valid

---

### 3. Create Subscription

**Endpoint:** `POST /apple-subscriptions/create-subscription`

**Description:** Validates receipt and creates subscription in database

**Headers:**
```
Authorization: Bearer {authToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "receiptData": "base64_encoded_receipt_string",
  "userId": 123,
  "productId": "trimbiz_monthly_owner",
  "memberCount": 1,
  "metadata": {
    "subscriptionName": "Trim Business Owner Plan",
    "members": 1,
    "VAT": "0"
  }
}
```

**Response (Success):**
```json
{
  "status": "1",
  "message": "Apple subscription created successfully",
  "data": {
    "subscriptionId": "1000000123456789",
    "originalTransactionId": "1000000123456789",
    "expiresDate": "2024-02-01T00:00:00.000Z",
    "productId": "trimbiz_monthly_owner",
    "status": "active"
  }
}
```

**Response (Error):**
```json
{
  "status": "0",
  "message": "Receipt validation failed: Invalid receipt",
  "error": {
    "code": "RECEIPT_INVALID",
    "details": "Receipt could not be authenticated"
  }
}
```

**Use Case:** Frontend sends receipt after successful purchase to create subscription

---

### 4. Verify Subscription

**Endpoint:** `POST /apple-subscriptions/verify-subscription`

**Description:** Verifies current subscription status for a user

**Headers:**
```
Authorization: Bearer {authToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": 123
}
```

**OR**

```json
{
  "originalTransactionId": "1000000123456789"
}
```

**Response:**
```json
{
  "status": "1",
  "message": "Subscription verified",
  "data": {
    "subscription": {
      "id": "1000000123456789",
      "originalTransactionId": "1000000123456789",
      "status": "active",
      "expiresDate": "2024-02-01T00:00:00.000Z",
      "productId": "trimbiz_monthly_owner",
      "isExpired": false
    }
  }
}
```

**Use Case:** Frontend calls this to check subscription status (on app launch, settings page, etc.)

---

### 5. Apple Webhook (Server-to-Server)

**Endpoint:** `POST /apple-subscriptions/webhook`

**Description:** Receives notifications from Apple about subscription events

**Headers:**
```
Content-Type: application/json
```

**Request Body (from Apple):**
```json
{
  "notification_type": "DID_RENEW",
  "unified_receipt": {
    "latest_receipt_info": [
      {
        "transaction_id": "1000000123456789",
        "original_transaction_id": "1000000123456789",
        "product_id": "trimbiz_monthly_owner",
        "purchase_date_ms": "1704067200000",
        "expires_date_ms": "1706745600000"
      }
    ]
  }
}
```

**Response:**
```json
{
  "received": true
}
```

**Use Case:** Apple automatically sends notifications for:
- Initial purchase (`INITIAL_BUY`)
- Renewals (`DID_RENEW`)
- Cancellations (`CANCEL`)
- Payment failures (`DID_FAIL_TO_RENEW`)
- Refunds (`REFUND`)
- Grace period expiration (`GRACE_PERIOD_EXPIRED`)

---

## Use Cases

### Use Case 1: User Views Subscription Plans

**Scenario:** User opens subscription screen in the app

**Flow:**
1. Frontend calls `GET /apple-subscriptions/products`
2. Backend fetches products from App Store Connect
3. Backend returns products list
4. Frontend displays products in UI

**Expected Result:** User sees all available subscription plans with details

**API Example:**
```bash
curl -X GET "https://your-backend.com/apple-subscriptions/products" \
  -H "Authorization: Bearer {token}"
```

---

### Use Case 2: User Purchases Subscription

**Scenario:** User selects a plan and completes purchase

**Flow:**
1. User taps "Subscribe" on a product
2. Frontend calls `POST /apple-subscriptions/validate-product`
3. Backend validates product
4. Frontend initiates purchase via `in_app_purchase`
5. Apple processes payment
6. Frontend receives receipt
7. Frontend calls `POST /apple-subscriptions/create-subscription`
8. Backend validates receipt and creates subscription
9. User sees success message

**Expected Result:** Subscription is active, user has access to premium features

**API Example:**
```bash
# Step 1: Validate product
curl -X POST "https://your-backend.com/apple-subscriptions/validate-product" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"productId": "trimbiz_monthly_owner"}'

# Step 2: Create subscription (after purchase)
curl -X POST "https://your-backend.com/apple-subscriptions/create-subscription" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "receiptData": "base64_receipt",
    "userId": 123,
    "productId": "trimbiz_monthly_owner",
    "memberCount": 1
  }'
```

---

### Use Case 3: Check Subscription Status

**Scenario:** User opens app and wants to check subscription

**Flow:**
1. Frontend calls `POST /apple-subscriptions/verify-subscription`
2. Backend checks database for user's subscription
3. Backend returns subscription status
4. Frontend displays status to user

**Expected Result:** User sees current subscription status (active/expired)

**API Example:**
```bash
curl -X POST "https://your-backend.com/apple-subscriptions/verify-subscription" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"userId": 123}'
```

---

### Use Case 4: Subscription Renewal (Automatic)

**Scenario:** Monthly subscription renews automatically

**Flow:**
1. Apple processes renewal payment automatically
2. Apple sends webhook: `DID_RENEW`
3. Backend receives webhook
4. Backend updates subscription expiry date
5. Backend updates salon status
6. User continues to have access

**Expected Result:** Subscription automatically renewed, no user action needed

**Webhook Payload:**
```json
{
  "notification_type": "DID_RENEW",
  "unified_receipt": {
    "latest_receipt_info": [
      {
        "transaction_id": "1000000123456790",
        "original_transaction_id": "1000000123456789",
        "product_id": "trimbiz_monthly_owner",
        "expires_date_ms": "1709424000000"
      }
    ]
  }
}
```

---

### Use Case 5: Subscription Cancellation

**Scenario:** User cancels subscription via App Store settings

**Flow:**
1. User cancels via App Store settings
2. Apple sends webhook: `CANCEL`
3. Backend receives webhook
4. Backend updates subscription status to "canceled"
5. Subscription remains active until expiry date
6. After expiry, user loses access

**Expected Result:** Subscription marked as canceled, access continues until expiry

**Webhook Payload:**
```json
{
  "notification_type": "CANCEL",
  "unified_receipt": {
    "latest_receipt_info": [
      {
        "original_transaction_id": "1000000123456789"
      }
    ]
  }
}
```

---

### Use Case 6: Payment Failure

**Scenario:** Payment fails during renewal

**Flow:**
1. Apple attempts to charge user
2. Payment fails (insufficient funds, expired card, etc.)
3. Apple sends webhook: `DID_FAIL_TO_RENEW`
4. Backend receives webhook
5. Backend updates subscription status to "past_due"
6. User enters grace period (if applicable)
7. If grace period expires, subscription expires

**Expected Result:** Subscription marked as past_due, user notified

**Webhook Payload:**
```json
{
  "notification_type": "DID_FAIL_TO_RENEW",
  "unified_receipt": {
    "latest_receipt_info": [
      {
        "original_transaction_id": "1000000123456789"
      }
    ]
  }
}
```

---

### Use Case 7: Receipt Validation Error

**Scenario:** Frontend sends invalid receipt

**Flow:**
1. Frontend sends receipt to backend
2. Backend validates with Apple
3. Apple returns error (invalid receipt)
4. Backend returns error to frontend
5. Frontend shows error message to user
6. User can retry or contact support

**Expected Result:** Error message displayed, user can retry

**Error Response:**
```json
{
  "status": "0",
  "message": "Receipt validation failed: Invalid receipt",
  "error": {
    "code": "RECEIPT_INVALID",
    "details": "Receipt could not be authenticated"
  }
}
```

---

## Error Handling

### Common Errors and Solutions

#### Error 1: Product Not Found

**Error:**
```json
{
  "status": "0",
  "message": "Product not found: trimbiz_monthly_owner"
}
```

**Cause:** Product ID doesn't exist in App Store Connect

**Solution:**
- Verify product ID in App Store Connect
- Ensure product is active
- Check Bundle ID matches

---

#### Error 2: Receipt Validation Failed

**Error:**
```json
{
  "status": "0",
  "message": "Receipt validation failed: Invalid receipt"
}
```

**Cause:** 
- Receipt is invalid or expired
- Receipt is from wrong environment (sandbox vs production)
- Shared secret is incorrect

**Solution:**
- Verify receipt data is correct
- Check environment (sandbox/production)
- Verify shared secret in App Store Connect

**Receipt Status Codes:**
- `21000`: The App Store could not read the JSON object
- `21002`: The data in the receipt-data property was malformed
- `21003`: The receipt could not be authenticated
- `21004`: The shared secret does not match
- `21005`: The receipt server is not currently available
- `21006`: This receipt is valid but the subscription has expired
- `21007`: This receipt is from the test environment
- `21008`: This receipt is from the production environment
- `21010`: This receipt could not be authorized

---

#### Error 3: User Not Found

**Error:**
```json
{
  "status": "0",
  "message": "User not found"
}
```

**Cause:** User ID doesn't exist in database

**Solution:**
- Verify user is authenticated
- Check user ID is correct
- Ensure user exists in database

---

#### Error 4: In-App Purchases Not Available

**Error:**
```
In-app purchases are not available
```

**Cause:**
- Device doesn't support in-app purchases
- App is not properly configured
- Testing on simulator (use real device)

**Solution:**
- Test on real iOS device
- Verify app is properly signed
- Check App Store Connect configuration

---

#### Error 5: Network Error

**Error:**
```
Network error: Failed to connect to backend
```

**Cause:** 
- Backend is down
- Network connectivity issues
- Incorrect backend URL

**Solution:**
- Check backend is running
- Verify network connection
- Check backend URL is correct

---

#### Error 6: App Store Connect API Error

**Error:**
```
Failed to fetch products from App Store Connect
```

**Cause:**
- Invalid API credentials
- API key expired
- Network issues with Apple

**Solution:**
- Verify App Store Connect API credentials
- Check Issuer ID, Key ID, and Private Key
- Ensure API key has proper permissions

---

## Testing Guide

### Prerequisites

1. **App Store Connect Account**
   - Active developer account
   - App configured in App Store Connect
   - Subscription products created

2. **Sandbox Test Account**
   - Created in App Store Connect
   - Not used for real purchases

3. **Test Device**
   - Real iOS device (simulator doesn't support in-app purchases)
   - Signed in with sandbox account

4. **Backend Running**
   - All endpoints accessible
   - Database configured
   - Environment variables set

5. **Flutter App Configured**
   - `in_app_purchase` package installed
   - App properly signed
   - Bundle ID matches App Store Connect

---

### Test Case 1: Fetch Products

**Steps:**
1. Open Flutter app
2. Navigate to subscription screen
3. Verify products are loaded

**Expected:** Products list displayed with correct information

**API Call:**
```bash
curl -X GET "https://your-backend.com/apple-subscriptions/products" \
  -H "Authorization: Bearer {token}"
```

**Expected Response:**
```json
{
  "status": "1",
  "message": "Products fetched successfully",
  "data": {
    "products": [
      {
        "productId": "trimbiz_monthly_owner",
        "name": "Trim Business Owner Plan",
        "description": "Monthly subscription for business owners",
        "duration": "P1M",
        "status": "ACTIVE"
      }
    ]
  }
}
```

---

### Test Case 2: Validate Product

**Steps:**
1. Select a product
2. Tap "Subscribe"
3. Verify product validation

**Expected:** Product validated successfully

**API Call:**
```bash
curl -X POST "https://your-backend.com/apple-subscriptions/validate-product" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"productId": "trimbiz_monthly_owner"}'
```

**Expected Response:**
```json
{
  "status": "1",
  "message": "Product validated successfully",
  "data": {
    "productId": "trimbiz_monthly_owner",
    "valid": true,
    "message": "Product is valid and ready for purchase"
  }
}
```

---

### Test Case 3: Purchase Subscription

**Steps:**
1. Select product
2. Tap "Subscribe"
3. Authenticate with sandbox account
4. Complete purchase
5. Verify receipt sent to backend

**Expected:** Subscription created successfully

**API Call:**
```bash
curl -X POST "https://your-backend.com/apple-subscriptions/create-subscription" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "receiptData": "base64_receipt",
    "userId": 123,
    "productId": "trimbiz_monthly_owner",
    "memberCount": 1,
    "metadata": {
      "subscriptionName": "Trim Business Owner Plan"
    }
  }'
```

**Expected Response:**
```json
{
  "status": "1",
  "message": "Apple subscription created successfully",
  "data": {
    "subscriptionId": "1000000123456789",
    "originalTransactionId": "1000000123456789",
    "expiresDate": "2024-02-01T00:00:00.000Z",
    "productId": "trimbiz_monthly_owner",
    "status": "active"
  }
}
```

---

### Test Case 4: Verify Subscription

**Steps:**
1. After purchase, verify subscription
2. Check status in app

**Expected:** Subscription status shows "active"

**API Call:**
```bash
curl -X POST "https://your-backend.com/apple-subscriptions/verify-subscription" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"userId": 123}'
```

**Expected Response:**
```json
{
  "status": "1",
  "message": "Subscription verified",
  "data": {
    "subscription": {
      "id": "1000000123456789",
      "originalTransactionId": "1000000123456789",
      "status": "active",
      "expiresDate": "2024-02-01T00:00:00.000Z",
      "productId": "trimbiz_monthly_owner",
      "isExpired": false
    }
  }
}
```

---

### Test Case 5: Webhook Testing

**Steps:**
1. Use Apple's webhook testing tool or send test notification
2. Send test notification to webhook endpoint
3. Verify backend processes it correctly

**Expected:** Webhook received and processed

**Test Webhook Payload:**
```json
{
  "notification_type": "DID_RENEW",
  "unified_receipt": {
    "latest_receipt_info": [
      {
        "transaction_id": "1000000123456790",
        "original_transaction_id": "1000000123456789",
        "product_id": "trimbiz_monthly_owner",
        "purchase_date_ms": "1704067200000",
        "expires_date_ms": "1706745600000"
      }
    ]
  }
}
```

**Note:** Use Apple's App Store Server Notifications testing tool or manually send POST request to webhook endpoint

---

## Troubleshooting

### Issue 1: Products Not Loading

**Symptoms:** Products list is empty or fails to load

**Check:**
- [ ] Backend can access App Store Connect API
- [ ] API credentials are correct (Issuer ID, Key ID, Private Key)
- [ ] Products exist in App Store Connect
- [ ] Products are active
- [ ] Bundle ID matches

**Fix:**
- Verify App Store Connect API credentials in `.env`
- Check product status in App Store Connect
- Ensure Bundle ID is correct: `com.sigitechnologies.trimbusinessios`
- Check backend logs for API errors

---

### Issue 2: Purchase Fails

**Symptoms:** Purchase doesn't complete or fails immediately

**Check:**
- [ ] Testing on real device (not simulator)
- [ ] Signed in with sandbox account
- [ ] Product ID is correct
- [ ] App is properly configured
- [ ] In-app purchases enabled in App Store Connect

**Fix:**
- Test on real iOS device (simulator doesn't support in-app purchases)
- Use sandbox test account (not your real Apple ID)
- Verify product ID matches App Store Connect: `trimbiz_monthly_owner`
- Check app signing and provisioning profile

---

### Issue 3: Receipt Validation Fails

**Symptoms:** Backend rejects receipt with validation error

**Check:**
- [ ] Receipt data is correct (base64 encoded)
- [ ] Environment matches (sandbox/production)
- [ ] Shared secret is correct
- [ ] Receipt is not expired
- [ ] Receipt format is valid

**Fix:**
- Verify receipt encoding in Flutter app
- Check environment settings (sandbox vs production)
- Verify shared secret in App Store Connect: `bd2d41d4531143db886db462df34f695`
- Check receipt status codes for specific errors

---

### Issue 4: Webhook Not Received

**Symptoms:** Backend doesn't receive webhooks from Apple

**Check:**
- [ ] Webhook URL is configured in App Store Connect
- [ ] URL is publicly accessible (not localhost)
- [ ] SSL certificate is valid (HTTPS required)
- [ ] Webhook endpoint is working
- [ ] Firewall allows incoming requests

**Fix:**
- Configure webhook URL in App Store Connect → App Information → App Store Server Notifications
- Use HTTPS URL: `https://your-backend.com/apple-subscriptions/webhook`
- Test webhook endpoint manually with POST request
- Check backend logs for incoming requests
- Verify SSL certificate is valid

---

### Issue 5: Subscription Not Created in Database

**Symptoms:** Purchase succeeds but subscription not saved

**Check:**
- [ ] Database connection is working
- [ ] Database schema is updated (new columns exist)
- [ ] User exists in database
- [ ] Salon exists for user
- [ ] Backend logs show no errors

**Fix:**
- Run database migrations to add new columns
- Verify user and salon records exist
- Check backend logs for database errors
- Ensure database connection is active

---

### Issue 6: App Store Connect API Errors

**Symptoms:** Cannot fetch products from App Store Connect

**Check:**
- [ ] API credentials are correct
- [ ] Private key format is correct (with newlines)
- [ ] JWT token generation is working
- [ ] API key has proper permissions
- [ ] Network connectivity to Apple

**Fix:**
- Verify credentials in `.env`:
  - `APPLE_ISSUER_ID=dcabb75f-8975-4e83-8fe3-075bf9670b2e`
  - `APPLE_KEY_ID=8F4J5Y632G`
  - `APPLE_PRIVATE_KEY` (with proper newline formatting)
- Check JWT token generation in backend
- Verify API key permissions in App Store Connect
- Test API connectivity

---

## Environment Variables

### Backend (.env)

Add these variables to your `.env` file:

```env
# Apple App Store Connect API
APPLE_ISSUER_ID=dcabb75f-8975-4e83-8fe3-075bf9670b2e
APPLE_KEY_ID=8F4J5Y632G
APPLE_BUNDLE_ID=com.sigitechnologies.trimbusinessios
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMwLH9dzS8GePpHnK\nMgMydX5ExU23N793IrAPiuZzxlOgCgYIKoZIzj0DAQehRANCAAShkEx34FqmHqO2\nSGQr1IyK6nfd4TXgSnybN0IhhAp1GekwlKB2Wzaiv4s6m4Db9rHehQSUxCE81zkN\nGcvoBw1l\n-----END PRIVATE KEY-----
APPLE_SHARED_SECRET=bd2d41d4531143db886db462df34f695
```

**Important Notes:**
- `APPLE_PRIVATE_KEY` must include `\n` for newlines or be formatted properly
- Keep these credentials secure and never commit to version control
- Use different credentials for production and staging environments

---

## Database Schema

### Subscriptions Table Updates

Add these columns to the `subscriptions` table:

```sql
ALTER TABLE subscriptions 
ADD COLUMN appleTransactionId VARCHAR(255) NULL,
ADD COLUMN appleOriginalTransactionId VARCHAR(255) NULL,
ADD COLUMN subscriptionSource ENUM('stripe', 'apple') DEFAULT 'stripe',
ADD COLUMN appleProductId VARCHAR(255) NULL,
ADD COLUMN appleEnvironment ENUM('Sandbox', 'Production') NULL;
```

**Column Descriptions:**
- `appleTransactionId`: Current transaction ID from Apple
- `appleOriginalTransactionId`: Original transaction ID (used for renewals)
- `subscriptionSource`: Source of subscription ('stripe' or 'apple')
- `appleProductId`: Product ID from App Store Connect
- `appleEnvironment`: Environment where purchase was made

### Users Table Updates

Add this column to the `users` table:

```sql
ALTER TABLE users 
ADD COLUMN appleOriginalTransactionId VARCHAR(255) NULL;
```

**Column Description:**
- `appleOriginalTransactionId`: Links user to their Apple subscription

### Sequelize Migration (Alternative)

If using Sequelize migrations, create a migration file:

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('subscriptions', 'appleTransactionId', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    
    await queryInterface.addColumn('subscriptions', 'appleOriginalTransactionId', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    
    await queryInterface.addColumn('subscriptions', 'subscriptionSource', {
      type: Sequelize.ENUM('stripe', 'apple'),
      defaultValue: 'stripe',
      allowNull: false,
    });
    
    await queryInterface.addColumn('subscriptions', 'appleProductId', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    
    await queryInterface.addColumn('subscriptions', 'appleEnvironment', {
      type: Sequelize.ENUM('Sandbox', 'Production'),
      allowNull: true,
    });
    
    await queryInterface.addColumn('users', 'appleOriginalTransactionId', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('subscriptions', 'appleTransactionId');
    await queryInterface.removeColumn('subscriptions', 'appleOriginalTransactionId');
    await queryInterface.removeColumn('subscriptions', 'subscriptionSource');
    await queryInterface.removeColumn('subscriptions', 'appleProductId');
    await queryInterface.removeColumn('subscriptions', 'appleEnvironment');
    await queryInterface.removeColumn('users', 'appleOriginalTransactionId');
  }
};
```

---

## Support

For issues or questions:
1. Check this documentation first
2. Review error messages in backend logs
3. Check App Store Connect status
4. Verify backend endpoints are working
5. Contact development team

---

## Version History

- **Version 1.0** - Initial documentation
- **Date:** 2024-01-XX
- **Author:** Development Team

---

**Last Updated:** 2024-01-XX  
**Maintained By:** Development Team

---

## Quick Reference

### Product ID
- `trimbiz_monthly_owner` - Trim Business Owner Plan (Monthly)

### Bundle ID
- `com.sigitechnologies.trimbusinessios`

### Key Endpoints
- `GET /apple-subscriptions/products` - Get all products
- `POST /apple-subscriptions/validate-product` - Validate product
- `POST /apple-subscriptions/create-subscription` - Create subscription
- `POST /apple-subscriptions/verify-subscription` - Verify subscription
- `POST /apple-subscriptions/webhook` - Apple webhook handler

---

## Additional Resources

- [Apple App Store Connect API Documentation](https://developer.apple.com/documentation/appstoreconnectapi)
- [Apple Server-to-Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications)
- [Flutter in_app_purchase Package](https://pub.dev/packages/in_app_purchase)
- [Apple Receipt Validation](https://developer.apple.com/documentation/appstorereceipts)

---

**End of Documentation**

