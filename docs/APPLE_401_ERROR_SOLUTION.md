# 🔴 Apple 401 Error - ROOT CAUSE & SOLUTION

## 🎯 Root Cause

```
❌ WRONG KEY TYPE FOR VERIFICATION!

Your current key:  L34V427J4F (App Store Connect API)
Endpoint needs:    B2KSMYQ3NG (In-App Purchase API)

Result: 401 Unauthorized ❌
```

---

## ✅ The Fix (3 Steps)

### Step 1️⃣: Add IAP Key to `.env`

```bash
# Open your .env file and ADD these two lines:

APPLE_IAP_KEY_ID=B2KSMYQ3NG
APPLE_IAP_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgXXXXXX...
```

### Step 2️⃣: Get the IAP Private Key

Find your file: `AuthKey_B2KSMYQ3NG.p8` (the one you showed me earlier)

```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXgCgYIKoZIzj0DAQehRANCA
ASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQ
ce2lJal6xIRy10ovGpzOfSPGtdkRIjXbFYY
-----END PRIVATE KEY-----
```

**Copy ONLY the middle part (remove BEGIN/END, join all lines):**

```
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXgCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIRy10ovGpzOfSPGtdkRIjXbFYY
```

### Step 3️⃣: Restart Server

```bash
pm2 restart all
```

---

## 📊 Key Usage Map

```
┌─────────────────────────────────────────────────────────┐
│                  APPLE API ENDPOINTS                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  GET /apple-subscriptions/products                      │
│  ├─ Uses: APPLE_KEY_ID (L34V427J4F) ✅                 │
│  └─ Purpose: Fetch subscription products                │
│                                                         │
│  POST /salon/v1/iap/apple/verify                        │
│  ├─ Uses: APPLE_IAP_KEY_ID (B2KSMYQ3NG) ⚠️ NEED THIS  │
│  └─ Purpose: Verify purchase transactions               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Before vs After

### BEFORE (Breaking ❌)
```javascript
// Both endpoints used same key
const token = generateAppStoreConnectJWT(); // L34V427J4F

GET  /products → ✅ Works
POST /verify   → ❌ 401 Error (wrong key!)
```

### AFTER (Fixed ✅)
```javascript
// Each endpoint uses correct key
GET  /products → generateAppStoreConnectJWT()  // L34V427J4F ✅
POST /verify   → generateAppStoreServerJWT()   // B2KSMYQ3NG ✅
```

---

## 🧪 Quick Test

After updating `.env` and restarting:

```bash
# Test 1: Check credentials
curl https://stage.trimworldwide.com/apple-subscriptions/test-credentials

# Expected: Shows both keys are set
{
  "status": "1",
  "data": {
    "connectKeyId": "L34V427J4F",
    "iapKeyId": "B2KSMYQ3NG"  ← Should show this!
  }
}
```

```bash
# Test 2: Verify transaction
curl -X POST https://stage.trimworldwide.com/salon/v1/iap/apple/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "2000000123456789",
    "productId": "trimbiz_monthly_owner",
    "subscriptionPrice": 4.99
  }'

# Expected: No more 401! ✅
{
  "status": "1",
  "message": "Purchase verified successfully"
}
```

---

## 📝 Complete .env Example

```env
#============================================
# Apple API Keys (YOU NEED BOTH!)
#============================================

# 1. App Store Connect API (for products) - ALREADY SET ✅
APPLE_ISSUER_ID=dcabb75f-8975-4e83-8fe3-075bf9670b2e
APPLE_KEY_ID=L34V427J4F
APPLE_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMETU4VaZhlr+tcBN6kc6yae4fcBSECX5qE0oRBkgMZegCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIRy10ovGpzOfSPGtdkRIjXbFYY

# 2. In-App Purchase API (for verification) - ADD THIS! ⚠️
APPLE_IAP_KEY_ID=B2KSMYQ3NG
APPLE_IAP_PRIVATE_KEY=paste_your_key_here

# Other settings
APPLE_BUNDLE_ID=com.sigitechnologies.trimbusinessios
APPLE_SHARED_SECRET=your_shared_secret
```

---

## ❓ FAQ

**Q: Where is the IAP key file?**
A: It's the `AuthKey_B2KSMYQ3NG.p8` file you downloaded earlier (you showed it in the screenshot).

**Q: I lost the file, what do I do?**
A: Go to App Store Connect > Users and Access > Keys > In-App Purchase > Generate new key.

**Q: Do I need to change frontend code?**
A: NO! Just update `.env` on backend and restart.

**Q: Why does Apple need two keys?**
A: Security. Different operations need different permissions:
- Product management → Connect API key
- Transaction verification → IAP API key

**Q: Can I use the new key (L34V427J4F) for everything?**
A: NO! The L34V427J4F key is for **App Store Connect API only**, not for IAP Server API.

---

## ✅ Success Checklist

- [ ] Added `APPLE_IAP_KEY_ID=B2KSMYQ3NG` to `.env`
- [ ] Added `APPLE_IAP_PRIVATE_KEY=...` to `.env` (full base64, one line)
- [ ] Restarted server (`pm2 restart all`)
- [ ] Tested `/test-credentials` → Shows both keys
- [ ] Tested `/verify` → Returns `"status": "1"` instead of 401
- [ ] Confirmed logs show: "✅ IAP Server key validated"

---

## 🎉 Expected Result

```bash
📱 Fetching transaction from Apple Server API...
🔑 Generating App Store Server JWT (IAP)...
  ✅ IAP Server key validated
  ✅ JWT generated (Key ID: B2KSMYQ3NG )
✅ Transaction fetched from Apple
✅ Transaction verified
✅ Apple IAP Verification Complete
```

**No more 401 errors!** 🎊

