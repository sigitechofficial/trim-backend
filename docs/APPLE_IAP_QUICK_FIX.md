# 🚨 Quick Fix: Apple IAP 401 Error

## The Problem
You're getting **401 Unauthorized** when calling `/salon/v1/iap/apple/verify` because Apple requires **TWO DIFFERENT API KEYS**.

## The Solution
Add a second API key for In-App Purchase verification.

---

## 🔧 What You Need to Do NOW

### 1. Add These to Your `.env` File:

```env
# NEW - Add these two lines:
APPLE_IAP_KEY_ID=B2KSMYQ3NG
APPLE_IAP_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgXXXXXXXXXXXXXXXX...
```

### 2. Get the IAP Key

**Option A: Use Your Old Key (B2KSMYQ3NG)**
- Find the file: `AuthKey_B2KSMYQ3NG.p8`
- Open it and copy the base64 content (middle part, no BEGIN/END)
- Paste as ONE LINE in `APPLE_IAP_PRIVATE_KEY`

**Option B: Create a New Key**
1. Go to: https://appstoreconnect.apple.com/
2. Navigate: Users and Access > Keys > **In-App Purchase**
3. Click: "+" Generate API Key
4. Download the `.p8` file
5. Copy the Key ID
6. Copy the base64 content from the file

### 3. Restart Your Server

```bash
pm2 restart all
# OR
npm restart
```

### 4. Test

```bash
POST /salon/v1/iap/apple/verify
```

Should now return `"status": "1"` instead of 401 error! ✅

---

## 📋 Complete .env Template

```env
# App Store Connect API (for fetching products)
APPLE_ISSUER_ID=dcabb75f-8975-4e83-8fe3-075bf9670b2e
APPLE_KEY_ID=L34V427J4F
APPLE_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMETU4VaZhlr+tcBN6kc6yae4fcBSECX5qE0oRBkgMZegCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIRy10ovGpzOfSPGtdkRIjXbFYY

# In-App Purchase API (for verifying transactions) - ADD THESE!
APPLE_IAP_KEY_ID=B2KSMYQ3NG
APPLE_IAP_PRIVATE_KEY=YOUR_IAP_KEY_HERE

# Other Apple settings
APPLE_BUNDLE_ID=com.sigitechnologies.trimbusinessios
APPLE_SHARED_SECRET=your_shared_secret_here
```

---

## ⚡ Why This Happened

- `/products` endpoint uses **App Store Connect API** → Needs `APPLE_KEY_ID`
- `/verify` endpoint uses **App Store Server API** → Needs `APPLE_IAP_KEY_ID`

Apple requires different keys for different operations. The code now supports both!

---

## 🎯 What Changed in Code

✅ Added support for TWO separate API keys
✅ `/products` uses Connect API key (L34V427J4F)
✅ `/verify` uses IAP API key (B2KSMYQ3NG)
✅ Automatic key selection based on endpoint

**No frontend changes needed!** Just update `.env` and restart.

---

## 📖 Full Documentation

For detailed setup instructions, see:
- `APPLE_TWO_KEYS_SETUP.md` - Complete guide with screenshots
- `APPLE_SUBSCRIPTION_GUIDE.md` - Overall Apple IAP documentation

---

## 🆘 Still Not Working?

Run the test endpoint:
```bash
GET /apple-subscriptions/test-credentials
```

It will tell you which keys are missing or invalid.

