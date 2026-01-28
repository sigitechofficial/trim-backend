# 🎯 Apple IAP Final Setup - All APIs Working

## ✅ What's Fixed:

1. ✅ **JWT Generation** - Now uses correct key for all operations
2. ✅ **Product Fetching** - `/apple-subscriptions/products` works
3. ✅ **Transaction Verification** - `/salon/v1/iap/apple/verify` works
4. ✅ **Credentials Testing** - `/test-credentials` works
5. ✅ **Response Parsing** - Fixed `signedTransactionInfo` field name

---

## 🔑 Environment Configuration (.env)

**Copy this EXACTLY to your `.env` file:**

```env
# Apple IAP Configuration
APPLE_ISSUER_ID=dcabb75f-8975-4e83-8fe3-075bf9670b2e
APPLE_BUNDLE_ID=com.sigitechnologies.trimbusinessios

# Use L34V427J4F for BOTH (App Store Connect API key)
APPLE_KEY_ID=L34V427J4F
APPLE_IAP_KEY_ID=L34V427J4F

# Private key from AuthKey_L34V427J4F.p8 (SAME for both)
APPLE_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMETU4VaZhlr+tcBN6kc6yae4fcBSECX5qE0oRBkgMZegCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIR10ovGpzOfSPGtdkRIjXbFYY

APPLE_IAP_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMETU4VaZhlr+tcBN6kc6yae4fcBSECX5qE0oRBkgMZegCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIR10ovGpzOfSPGtdkRIjXbFYY

APPLE_SHARED_SECRET=bd2d41d4531143db886db462df34f695
```

---

## 🎯 The Golden Rule:

### **ONE KEY FOR EVERYTHING:**

```
🔑 L34V427J4F = Your Universal Apple Key
```

**Use it for:**
- ✅ `APPLE_KEY_ID` (product fetching)
- ✅ `APPLE_IAP_KEY_ID` (transaction verification)

### **Don't Use:**
- ❌ `B2KSMYQ3NG` (This is the legacy "In-App Purchase" key - only for old `verifyReceipt` API)

---

## 📝 What Changed:

### Before (Broken):
```env
APPLE_KEY_ID=L34V427J4F          # ✅ Works for /products
APPLE_IAP_KEY_ID=B2KSMYQ3NG      # ❌ Wrong key type - causes 401 error
```

### After (Working):
```env
APPLE_KEY_ID=L34V427J4F          # ✅ Works for /products
APPLE_IAP_KEY_ID=L34V427J4F      # ✅ Works for /verify
```

---

## 🚀 Deployment Steps:

1. **Update `.env` file** with the configuration above
2. **Upload updated file:** `controllers/appleSubscriptions/appleSubscriptionController.js`
3. **Restart server:** `pm2 restart all`
4. **Test all endpoints** (see below)

---

## 🧪 Test All Endpoints:

### 1. Test Credentials (No Auth Required)
```bash
GET /apple-subscriptions/test-credentials
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Apple credentials verified successfully",
  "credentials": {
    "issuerId": "dcabb75f-8975-4e83-8fe3-075bf9670b2e",
    "iapKeyId": "L34V427J4F",
    "bundleId": "com.sigitechnologies.trimbusinessios"
  }
}
```

---

### 2. Get Products (No Auth Required)
```bash
GET /apple-subscriptions/products
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Products fetched successfully from App Store Connect",
  "data": {
    "products": [
      {
        "productId": "trimbiz_owner_one_staff",
        "name": "Owner + 1 staff member",
        "state": "READY_TO_SUBMIT",
        "subscriptionPeriod": "ONE_MONTH"
      }
      // ... more products
    ]
  }
}
```

---

### 3. Verify Purchase (Auth Required)
```bash
POST /salon/v1/iap/apple/verify
Authorization: Bearer <your_token>

{
  "transactionId": "2000001106195531",
  "originalTransactionId": "2000001106156801",
  "productId": "trimbiz_owner_two_staff",
  "priceId": "some_price_id",
  "membersCount": 3,
  "subscriptionName": "Owner + 2 staff"
}
```

**Expected Response:**
```json
{
  "status": "1",
  "message": "Apple purchase verified and subscription created successfully",
  "data": {
    "subscription": {
      "subscriptionId": "sub_apple_...",
      "originalTransactionId": "2000001106156801",
      "expiresDate": "2026-02-23",
      "productId": "trimbiz_owner_two_staff"
    }
  }
}
```

---

## 📋 Success Logs to Look For:

```
🔑 Starting key parsing...
✅ Key validation passed!
✅ JWT token generated successfully!
  - Key ID: L34V427J4F
  - Issuer ID: dcabb75f-8975-4e83-8fe3-075bf9670b2e

📱 Fetching app with Bundle ID: com.sigitechnologies.trimbusinessios
✅ Found app: Trim Business

📦 Step 3: Fetching subscription groups...
✅ Subscription groups found: 1
✅ Total products found: 7

✅ Transaction fetched from Apple
✅ SignedTransactionInfo found (JWS)
📋 Transaction Details:
  Product ID: trimbiz_owner_two_staff
  Original Transaction ID: 2000001106156801
```

---

## ❌ Troubleshooting:

### If you still get 401 errors:

1. **Double-check `.env` file:**
   - Both `APPLE_KEY_ID` and `APPLE_IAP_KEY_ID` should be `L34V427J4F`
   - Both private keys should be the SAME (from `AuthKey_L34V427J4F.p8`)

2. **Verify in App Store Connect:**
   - Go to: **App Store Connect** → **Users and Access** → **Keys** → **App Store Connect API**
   - Find key: `L34V427J4F`
   - Role should be: **Admin** or **App Manager**

3. **Check server time:**
   ```bash
   date -u
   ```
   If off by more than 5 minutes, sync your server clock.

4. **Restart PM2:**
   ```bash
   pm2 restart all
   pm2 logs --lines 100
   ```

---

## 🎉 You're All Set!

All three endpoints should now work perfectly with the **same App Store Connect API key** (`L34V427J4F`).

**This is the modern, recommended approach by Apple!** 🚀

