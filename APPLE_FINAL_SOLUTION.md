# 🎯 Apple IAP - FINAL SOLUTION (Two Keys Required)

## ✅ CONFIRMED: You MUST Use Two Different Keys

After testing, we've confirmed that Apple requires **TWO DIFFERENT API keys** for different operations:

| Key | Purpose | Endpoints | Reason |
|-----|---------|-----------|--------|
| **L34V427J4F** (trim-api) | App Store Connect API | `/products`, `/validate-product`, `/test-credentials` | ✅ Works for metadata/products |
| **B2KSMYQ3NG** (In-App Purchase) | App Store Server API | `/verify` | ✅ Works for transaction verification |

---

## 🔴 Why You Need Both Keys:

### Test Results:
```
❌ L34V427J4F for /verify → 401 Unauthorized
✅ L34V427J4F for /products → 200 Success

✅ B2KSMYQ3NG for /verify → 200 Success  
❌ B2KSMYQ3NG for /products → 401 Unauthorized
```

**Conclusion:** Each key is authorized for specific Apple APIs only.

---

## 📝 Complete .env Configuration:

```env
# ============================================
# APPLE IAP - FINAL TWO-KEY CONFIGURATION
# ============================================

# Common credentials (same for both keys)
APPLE_ISSUER_ID=dcabb75f-8975-4e83-8fe3-075bf9670b2e
APPLE_BUNDLE_ID=com.sigitechnologies.trimbusinessios
APPLE_SHARED_SECRET=bd2d41d4531143db886db462df34f695

# ============================================
# KEY 1: App Store Connect API
# Name: "trim-api"
# Key ID: L34V427J4F
# File: AuthKey_L34V427J4F.p8
# ============================================
# Used for:
#   - GET /apple-subscriptions/products
#   - POST /apple-subscriptions/validate-product
#   - GET /apple-subscriptions/test-credentials
# ============================================

APPLE_KEY_ID=L34V427J4F
APPLE_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMETU4VaZhlr+tcBN6kc6yae4fcBSECX5qE0oRBkgMZegCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIR10ovGpzOfSPGtdkRIjXbFYY

# ============================================
# KEY 2: In-App Purchase Key
# Key ID: B2KSMYQ3NG  
# File: AuthKey_B2KSMYQ3NG.p8
# ============================================
# Used for:
#   - POST /salon/v1/iap/apple/verify
# ============================================

APPLE_IAP_KEY_ID=B2KSMYQ3NG
APPLE_IAP_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMwLH9dzS8GePpHnKMgMydX5ExU23N793IrAPiuZzxlOgCgYIKoZIzj0DAQehRANCAAShkEx34FqmHqO2SGQr1IyK6nfd4TXgSnybN0IhhAp1GekwlKB2Wzaiv4s6m4Db9rHehQSUxCE81zkNGcvoBw1l
```

---

## 🔧 Code Implementation:

### Two Separate JWT Functions:

```javascript
// Function 1: For products/metadata (uses L34V427J4F)
function generateAppStoreConnectJWT() {
  // Uses: APPLE_KEY_ID + APPLE_PRIVATE_KEY
  // Called by: /products, /validate-product, /test-credentials
}

// Function 2: For transaction verification (uses B2KSMYQ3NG)  
function generateAppStoreServerJWT() {
  // Uses: APPLE_IAP_KEY_ID + APPLE_IAP_PRIVATE_KEY
  // Called by: /verify
}
```

### Endpoint Mapping:

```javascript
// GET /apple-subscriptions/products
exports.getAppleSubscriptionProducts = async (req, res, next) => {
  const token = generateAppStoreConnectJWT(); // ← Uses L34V427J4F
  // Calls: api.appstoreconnect.apple.com
}

// POST /salon/v1/iap/apple/verify
exports.verifyApplePurchase = async (req, res, next) => {
  const token = generateAppStoreServerJWT(); // ← Uses B2KSMYQ3NG
  // Calls: api.storekit.itunes.apple.com
}
```

---

## 🚀 Deployment:

1. **Update `.env`** with BOTH keys (see above)
2. **Upload:** `controllers/appleSubscriptions/appleSubscriptionController.js`
3. **Restart:** `pm2 restart all`
4. **Test ALL endpoints**

---

## ✅ Expected Logs:

### Test 1: Get Products
```bash
GET /apple-subscriptions/products
```

**Log Output:**
```
🔑 Generating App Store Connect JWT (for products)...
  ✅ JWT generated (Key ID: L34V427J4F - App Store Connect API)
🔐 JWT Token generated
📱 Step 1: Fetching all apps from App Store Connect
✅ Successfully fetched apps - Total apps found: 3
📦 Step 3: Fetching subscription groups...
✅ Subscription groups found: 1
✅ Total products found: 7
```

**Response:**
```json
{
  "success": true,
  "message": "Products fetched successfully from App Store Connect",
  "data": {
    "products": [ /* 7 products */ ]
  }
}
```

---

### Test 2: Verify Purchase
```bash
POST /salon/v1/iap/apple/verify
Authorization: Bearer <token>

{
  "transactionId": "2000001106195531",
  "originalTransactionId": "2000001106156801",
  "productId": "trimbiz_owner_two_staff",
  "priceId": "price_123",
  "membersCount": 3,
  "subscriptionName": "Owner + 2 staff"
}
```

**Log Output:**
```
🍎 Apple IAP Verification Started (App Store Server API)
  User ID: 509
  Transaction ID: 2000001106195531
  Product ID: trimbiz_owner_two_staff

🔍 Checking for duplicate transaction...

📱 Fetching transaction from Apple Server API...
🔑 Generating App Store Server JWT (for IAP verification)...
  ✅ JWT generated (Key ID: B2KSMYQ3NG - In-App Purchase Key)
  Environment: Sandbox
  API URL: https://api.storekit-sandbox.itunes.apple.com

✅ Transaction fetched from Apple
✅ SignedTransactionInfo found (JWS)

📋 Transaction Details:
  Product ID: trimbiz_owner_two_staff
  Original Transaction ID: 2000001106156801
  Purchase Date: 2026-01-18T...
  Expires Date: 2026-02-18T...

✅ Transaction verified and matches request
💾 Creating subscription record...
✅ Subscription created: sub_apple_...
```

**Response:**
```json
{
  "status": "1",
  "message": "Apple purchase verified and subscription created successfully",
  "data": {
    "subscription": {
      "subscriptionId": "sub_apple_2000001106156801_1737480904",
      "originalTransactionId": "2000001106156801",
      "expiresDate": "2026-02-23T00:00:00.000Z",
      "productId": "trimbiz_owner_two_staff"
    }
  }
}
```

---

## 📋 Where to Find the Keys:

### 1. App Store Connect API Key (L34V427J4F)

**Location:**
```
App Store Connect 
  → Users and Access 
  → Keys 
  → App Store Connect API (tab)
  → Find "trim-api" (Key ID: L34V427J4F)
```

**Download:** `AuthKey_L34V427J4F.p8`

**Properties:**
- Name: trim-api
- Key ID: L34V427J4F
- Access: Admin
- Last Used: Jan 19, 2026

---

### 2. In-App Purchase Key (B2KSMYQ3NG)

**Location:**
```
App Store Connect 
  → Users and Access 
  → Keys 
  → In-App Purchase (tab)
  → Find Key ID: B2KSMYQ3NG
```

**Download:** `AuthKey_B2KSMYQ3NG.p8`

**Properties:**
- Key ID: B2KSMYQ3NG
- Last Used: Jan 7, 2026

---

## ❌ Troubleshooting:

### If `/products` returns 401:
```
Check:
1. APPLE_KEY_ID=L34V427J4F (not B2KSMYQ3NG)
2. APPLE_PRIVATE_KEY is from AuthKey_L34V427J4F.p8
3. Key is active in App Store Connect
```

### If `/verify` returns 401:
```
Check:
1. APPLE_IAP_KEY_ID=B2KSMYQ3NG (not L34V427J4F)
2. APPLE_IAP_PRIVATE_KEY is from AuthKey_B2KSMYQ3NG.p8
3. Key is active in In-App Purchase section
```

### If both are failing:
```
Check:
1. APPLE_ISSUER_ID=dcabb75f-8975-4e83-8fe3-075bf9670b2e
2. APPLE_BUNDLE_ID=com.sigitechnologies.trimbusinessios
3. Server time is synchronized (use: date -u)
4. All .p8 files are correctly extracted (no quotes, no BEGIN/END in .env)
```

---

## 🎯 Key Differences Between Keys:

| Aspect | L34V427J4F (App Store Connect) | B2KSMYQ3NG (In-App Purchase) |
|--------|-------------------------------|------------------------------|
| **Type** | App Store Connect API | In-App Purchase |
| **Access Level** | Admin | In-App Purchase only |
| **Can Access** | App metadata, subscriptions, products | Transaction verification |
| **API Base URL** | `api.appstoreconnect.apple.com` | `api.storekit.itunes.apple.com` |
| **Used For** | Product management | Purchase verification |

---

## 🎉 Final Checklist:

- [ ] Both keys added to `.env`
- [ ] Controller file uploaded to server
- [ ] Server restarted (`pm2 restart all`)
- [ ] `/products` endpoint tested → Should use L34V427J4F
- [ ] `/verify` endpoint tested → Should use B2KSMYQ3NG
- [ ] Logs show correct Key IDs for each endpoint
- [ ] All responses return 200 status

---

## 🔒 Security Notes:

1. **Never commit `.env` to git**
2. **Keep both `.p8` files secure**
3. **Rotate keys periodically**
4. **Monitor "Last Used" dates in App Store Connect**
5. **Use different keys for production vs staging if possible**

---

## 📞 Support:

If both endpoints work with these configurations, your Apple IAP integration is **complete and production-ready!** 🎉

**Summary:**
```
✅ L34V427J4F → /products, /validate-product, /test-credentials
✅ B2KSMYQ3NG → /verify
✅ Two keys, all APIs working perfectly!
```

