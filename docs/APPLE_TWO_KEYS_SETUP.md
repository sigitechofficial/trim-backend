# 🔑 Apple API - Two Keys Setup Guide

## 🚨 THE PROBLEM

You're getting a **401 Unauthorized** error when trying to verify Apple IAP transactions because Apple requires **TWO DIFFERENT API KEYS**:

1. **App Store Connect API Key** → For fetching products, managing apps
2. **In-App Purchase API Key** → For verifying transactions, webhooks

Your current key (`L34V427J4F`) is an App Store Connect key, which works for `/products` but **NOT** for `/verify`.

---

## ✅ THE SOLUTION

I've updated the code to support BOTH keys. Now you need to:

### Step 1: Get Your In-App Purchase API Key

Go to [App Store Connect](https://appstoreconnect.apple.com/) and create an In-App Purchase key:

1. **Go to:** Users and Access > Keys > In-App Purchase
2. **Click:** "+" (Generate API Key)
3. **Name it:** "IAP Server API" (or whatever you want)
4. **Access:** Give it "App Manager" role
5. **Download:** Download the `.p8` file (e.g., `AuthKey_B2KSMYQ3NG.p8`)
6. **IMPORTANT:** Copy the **Key ID** (shows in the list, e.g., `B2KSMYQ3NG`)
7. **Open the `.p8` file** in a text editor and copy ALL contents

---

### Step 2: Update Your `.env` File

Add these **NEW** environment variables:

```env
# ============================================
# Apple App Store Connect API (for products)
# ============================================
APPLE_ISSUER_ID=dcabb75f-8975-4e83-8fe3-075bf9670b2e
APPLE_KEY_ID=L34V427J4F
APPLE_BUNDLE_ID=com.sigitechnologies.trimbusinessios
APPLE_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMETU4VaZhlr+tcBN6kc6yae4fcBSECX5qE0oRBkgMZegCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIRy10ovGpzOfSPGtdkRIjXbFYY

# ============================================
# Apple In-App Purchase API (for verification)
# ============================================
APPLE_IAP_KEY_ID=B2KSMYQ3NG
APPLE_IAP_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXgCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIRy10ovGpzOfSPGtdkRIjXbFYY
```

**REPLACE:**
- `APPLE_IAP_KEY_ID` with YOUR IAP Key ID
- `APPLE_IAP_PRIVATE_KEY` with YOUR IAP private key content (ALL base64, no line breaks, no BEGIN/END)

---

### Step 3: Format the IAP Private Key

Open your downloaded `.p8` file (e.g., `AuthKey_B2KSMYQ3NG.p8`):

```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXgCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd
+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIRy10ovGpzOfSPGtdkRI
jXbFYY
-----END PRIVATE KEY-----
```

**Copy ONLY the base64 part (middle lines), remove spaces/newlines, and paste as ONE LINE:**

```env
APPLE_IAP_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXgCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIRy10ovGpzOfSPGtdkRIjXbFYY
```

---

## 📋 Environment Variables Summary

Here's what you need in your `.env`:

| Variable | Purpose | Example |
|----------|---------|---------|
| `APPLE_ISSUER_ID` | Your Team ID (same for both) | `dcabb75f-8975-4e83-8fe3-075bf9670b2e` |
| `APPLE_KEY_ID` | App Store Connect Key ID | `L34V427J4F` |
| `APPLE_PRIVATE_KEY` | App Store Connect Private Key | `MIGTAgEAMBMG...` |
| `APPLE_IAP_KEY_ID` | In-App Purchase Key ID | `B2KSMYQ3NG` |
| `APPLE_IAP_PRIVATE_KEY` | IAP Private Key | `MIGTAgEAMBMG...` |
| `APPLE_BUNDLE_ID` | Your app's bundle ID | `com.sigitechnologies.trimbusinessios` |

---

## 🔍 What Changed in the Code

### Before (Wrong):
```javascript
// Used same key for everything ❌
const token = generateAppStoreConnectJWT();
// This worked for /products but failed for /verify
```

### After (Correct):
```javascript
// For fetching products:
const token = generateAppStoreConnectJWT(); // Uses APPLE_KEY_ID ✅

// For verifying transactions:
const token = generateAppStoreServerJWT(); // Uses APPLE_IAP_KEY_ID ✅
```

---

## 🧪 How to Test

### 1. Test Credentials
```bash
GET /apple-subscriptions/test-credentials
```

Should show:
```json
{
  "status": "1",
  "message": "Apple API credentials are valid and working!",
  "data": {
    "authenticated": true,
    "connectKeyId": "L34V427J4F",
    "iapKeyId": "B2KSMYQ3NG"
  }
}
```

### 2. Test Product Fetching (Uses Connect API)
```bash
GET /apple-subscriptions/products
```

Should return all your subscription products.

### 3. Test Transaction Verification (Uses IAP API)
```bash
POST /salon/v1/iap/apple/verify
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "transactionId": "2000000123456789",
  "productId": "trimbiz_monthly_owner",
  "subscriptionPrice": 4.99
}
```

Should return:
```json
{
  "status": "1",
  "message": "Purchase verified successfully",
  "data": {
    "subscriptionId": "sub_apple_...",
    "expiryDate": "2026-02-20",
    "price": "4.99"
  }
}
```

---

## ❓ FAQ

### Q: Do I need both keys?
**A:** YES! One for products, one for verification. Apple requires it.

### Q: Can I use the same key for both?
**A:** NO! The key types have different permissions:
- **Connect API Key**: Can manage apps, fetch products
- **IAP API Key**: Can verify transactions, access purchase data

### Q: What if I only have one key?
**A:** Create the IAP key following Step 1 above.

### Q: My IAP key doesn't work!
**A:** Make sure:
1. It's from **In-App Purchase** section, not **App Store Connect API**
2. It has "App Manager" role
3. You copied the FULL base64 content (no BEGIN/END)
4. Key ID matches the downloaded file name

### Q: Can I reuse the old B2KSMYQ3NG key?
**A:** YES! If you still have that `.p8` file, you can use it. Just:
1. Open the file
2. Copy the base64 content
3. Add to `APPLE_IAP_PRIVATE_KEY`
4. Set `APPLE_IAP_KEY_ID=B2KSMYQ3NG`

---

## 🚀 Quick Setup Checklist

- [ ] Go to App Store Connect > Users and Access > Keys > In-App Purchase
- [ ] Generate new IAP API key (or find existing one)
- [ ] Download `.p8` file
- [ ] Copy Key ID (e.g., `B2KSMYQ3NG`)
- [ ] Open `.p8` file and copy base64 content
- [ ] Add `APPLE_IAP_KEY_ID` to `.env`
- [ ] Add `APPLE_IAP_PRIVATE_KEY` to `.env` (one line, no spaces)
- [ ] Restart your server
- [ ] Test with `/apple-subscriptions/test-credentials`
- [ ] Test with `/salon/v1/iap/apple/verify`

---

## 📸 Where to Find Keys in App Store Connect

1. **Log in:** https://appstoreconnect.apple.com/
2. **Navigate:** Users and Access (top right)
3. **Select:** Keys tab
4. **Two sections:**
   - **App Store Connect API** (has key `L34V427J4F`) → For products ✅ Already configured
   - **In-App Purchase** → CREATE THIS ONE! ⚠️

---

## 🆘 Still Having Issues?

If you still get 401 errors:

1. **Check Key ID format:** Should be 10 alphanumeric characters (e.g., `B2KSMYQ3NG`)
2. **Check private key length:** Should be ~200 characters (base64)
3. **Verify Issuer ID:** Should be your Team ID (UUID format)
4. **Check server time:** Apple rejects tokens with wrong timestamps
   ```bash
   date -u
   ```
5. **Restart server:** Environment variables require restart

---

## 📞 Contact Info

If verification still fails after setup:
1. Share the **Key ID** you're using
2. Share the **first 30 characters** of the private key
3. Share the **error response** from Apple

**DO NOT** share the full private key!

