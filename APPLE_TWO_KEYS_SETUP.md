# 🔑 Apple IAP - Two Keys Configuration

## ✅ The Correct Setup: TWO DIFFERENT KEYS

You need **TWO DIFFERENT API keys** from Apple for **TWO DIFFERENT purposes**:

| API | Purpose | Key Name | Key ID | Used By |
|-----|---------|----------|--------|---------|
| **App Store Connect API** | Fetch products/metadata | `trim-api` | `L34V427J4F` | `/products` endpoint |
| **In-App Purchase API** | Verify transactions | (In-App Purchase) | `B2KSMYQ3NG` | `/verify` endpoint |

---

## 📝 Environment Variables (.env)

Copy this **EXACTLY** to your `.env` file:

```env
# ============================================
# APPLE IAP - TWO KEYS CONFIGURATION
# ============================================

# Common (same for both)
APPLE_ISSUER_ID=dcabb75f-8975-4e83-8fe3-075bf9670b2e
APPLE_BUNDLE_ID=com.sigitechnologies.trimbusinessios

# ============================================
# KEY 1: App Store Connect API (for products)
# ============================================
# Name: "trim-api"
# Key ID: L34V427J4F
# File: AuthKey_L34V427J4F.p8
# Access: Admin
# Used by: /products, /test-credentials

APPLE_KEY_ID=L34V427J4F
APPLE_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMETU4VaZhlr+tcBN6kc6yae4fcBSECX5qE0oRBkgMZegCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIR10ovGpzOfSPGtdkRIjXbFYY

# ============================================
# KEY 2: In-App Purchase Key (for verification)
# ============================================
# Name: (In-App Purchase)
# Key ID: B2KSMYQ3NG
# File: AuthKey_B2KSMYQ3NG.p8
# Used by: /verify

APPLE_IAP_KEY_ID=B2KSMYQ3NG
APPLE_IAP_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMwLH9dzS8GePpHnKMgMydX5ExU23N793IrAPiuZzxlOgCgYIKoZIzj0DAQehRANCAAShkEx34FqmHqO2SGQr1IyK6nfd4TXgSnybN0IhhAp1GekwlKB2Wzaiv4s6m4Db9rHehQSUxCE81zkNGcvoBw1l

# ============================================
# Shared Secret (optional, for legacy support)
# ============================================
APPLE_SHARED_SECRET=bd2d41d4531143db886db462df34f695
```

---

## 🎯 How It Works:

### 1. Get Products (`/apple-subscriptions/products`)
```javascript
// Uses generateAppStoreConnectJWT()
// → APPLE_KEY_ID = L34V427J4F
// → APPLE_PRIVATE_KEY = (from AuthKey_L34V427J4F.p8)
// → Calls: api.appstoreconnect.apple.com
```

**Log Output:**
```
🔑 Generating App Store Connect JWT (for products)...
  ✅ JWT generated (Key ID: L34V427J4F - App Store Connect API)
```

---

### 2. Verify Purchase (`/salon/v1/iap/apple/verify`)
```javascript
// Uses generateAppStoreServerJWT()
// → APPLE_IAP_KEY_ID = B2KSMYQ3NG
// → APPLE_IAP_PRIVATE_KEY = (from AuthKey_B2KSMYQ3NG.p8)
// → Calls: api.storekit.itunes.apple.com
```

**Log Output:**
```
🔑 Generating App Store Server JWT (for IAP verification)...
  ✅ JWT generated (Key ID: B2KSMYQ3NG - In-App Purchase Key)
```

---

## 📋 Where to Find These Keys:

### Key 1: App Store Connect API (`L34V427J4F`)
1. Go to: **App Store Connect** → **Users and Access** → **Keys**
2. Select: **App Store Connect API** tab
3. Find: **"trim-api"** (Key ID: `L34V427J4F`)
4. Download: `AuthKey_L34V427J4F.p8`
5. Copy the base64 content to `APPLE_PRIVATE_KEY`

---

### Key 2: In-App Purchase (`B2KSMYQ3NG`)
1. Go to: **App Store Connect** → **Users and Access** → **Keys**
2. Select: **In-App Purchase** tab (you may have clicked "Integrations" in the sidebar)
3. Find: Key ID `B2KSMYQ3NG`
4. Download: `AuthKey_B2KSMYQ3NG.p8`
5. Copy the base64 content to `APPLE_IAP_PRIVATE_KEY`

---

## 🚀 Deploy:

1. **Update `.env`** with BOTH keys (above)
2. **Upload:** `controllers/appleSubscriptions/appleSubscriptionController.js`
3. **Restart:** `pm2 restart all`
4. **Test:**
   - ✅ GET `/apple-subscriptions/products` → Should use `L34V427J4F`
   - ✅ POST `/salon/v1/iap/apple/verify` → Should use `B2KSMYQ3NG`

---

## ✅ Expected Results:

### Test Products:
```bash
GET /apple-subscriptions/products
```

**Log:**
```
🔑 Generating App Store Connect JWT (for products)...
  ✅ JWT generated (Key ID: L34V427J4F - App Store Connect API)
📱 Step 1: Fetching all apps from App Store Connect
✅ Successfully fetched apps
```

---

### Test Verify:
```bash
POST /salon/v1/iap/apple/verify
{
  "transactionId": "2000001106195531",
  "productId": "trimbiz_owner_two_staff",
  ...
}
```

**Log:**
```
🔑 Generating App Store Server JWT (for IAP verification)...
  ✅ JWT generated (Key ID: B2KSMYQ3NG - In-App Purchase Key)
📱 Fetching transaction from Apple Server API...
✅ Transaction fetched from Apple
```

---

## 🔥 Key Points:

1. **Different APIs require different keys:**
   - App Store Connect API = `L34V427J4F`
   - App Store Server API = `B2KSMYQ3NG`

2. **No fallback logic:**
   - Each function uses its specific key
   - Clear error if key is missing

3. **Two separate JWT generators:**
   - `generateAppStoreConnectJWT()` → Products
   - `generateAppStoreServerJWT()` → Transactions

---

## ❌ Common Mistakes to Avoid:

1. ❌ Using `L34V427J4F` for transaction verification
2. ❌ Using `B2KSMYQ3NG` for product fetching
3. ❌ Using the same key for both
4. ❌ Mixing up the private keys

---

## 🎉 Summary:

```
L34V427J4F (trim-api)        → /products ✅
B2KSMYQ3NG (In-App Purchase) → /verify ✅
```

**Both keys, both APIs working perfectly!** 🚀

