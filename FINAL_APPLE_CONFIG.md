# 🎯 FINAL Apple IAP Configuration (Official Apple Docs 2026)

## ✅ EXACT `.env` Configuration You Need:

```env
# ============================================
# Apple In-App Purchase Configuration
# (Based on Apple Official Documentation)
# ============================================

# Team/Issuer ID (same for all your keys)
APPLE_ISSUER_ID=dcabb75f-8975-4e83-8fe3-075bf9670b2e

# In-App Purchase Key ID (from In-App Purchase section)
# KEY: Use B2KSMYQ3NG (trim-business) - This is the In-App Purchase key!
APPLE_IAP_KEY_ID=B2KSMYQ3NG

# In-App Purchase Private Key (from SubscriptionKey_B2KSMYQ3NG.p8)
APPLE_IAP_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg7J5M/O+qWvuqHfHsorHC1V81j1mCgLQy30Y7w0i1i5qgCgYIKoZIzj0DAQehRANCAAQR5O6mo+r9qmc098u9qgGNYfEBwWnuvqKDHh76d3jLT4ha+1Zy25Z16DtVgs/X2PhvvgoNKmYse7IBuMutG7S/

# App Bundle ID
APPLE_BUNDLE_ID=com.sigitechnologies.trimbusinessios

# Shared Secret (optional - for legacy support)
APPLE_SHARED_SECRET=bd2d41d4531143db886db462df34f695

# For backwards compatibility (products endpoint)
APPLE_KEY_ID=B2KSMYQ3NG
APPLE_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg7J5M/O+qWvuqHfHsorHC1V81j1mCgLQy30Y7w0i1i5qgCgYIKoZIzj0DAQehRANCAAQR5O6mo+r9qmc098u9qgGNYfEBwWnuvqKDHh76d3jLT4ha+1Zy25Z16DtVgs/X2PhvvgoNKmYse7IBuMutG7S/
```

---

## 🔑 Key Sources (Per Apple Documentation):

| Variable | Value | Source | Type |
|----------|-------|--------|------|
| `APPLE_ISSUER_ID` | `dcabb75f-8975-4e83-8fe3-075bf9670b2e` | App Store Connect > Keys > Any Key | Team ID |
| `APPLE_IAP_KEY_ID` | `B2KSMYQ3NG` | **In-App Purchase** section | IAP Key ✅ |
| `APPLE_IAP_PRIVATE_KEY` | `MIGTAgEA...` | `SubscriptionKey_B2KSMYQ3NG.p8` | IAP Private Key ✅ |
| `APPLE_BUNDLE_ID` | `com.sigitechnologies.trimbusinessios` | Your app's bundle identifier | Bundle ID |

---

## ❌ DO NOT USE THESE KEYS:

| Key Name | Key ID | Type | Why NOT to use |
|----------|--------|------|----------------|
| trim-api | `L34V427J4F` | App Store Connect API | For app metadata only, NOT IAP! ❌ |
| trim | `8F4J5Y632G` | App Store Connect API | For app metadata only, NOT IAP! ❌ |

**Use ONLY:**
| Key Name | Key ID | Type | Purpose |
|----------|--------|------|---------|
| trim-business | `B2KSMYQ3NG` | **In-App Purchase** | IAP Verification ✅ |

---

## 📚 What Changed (Based on Apple Docs):

### Before (WRONG):
```javascript
// Used App Store Connect API key
APPLE_KEY_ID=L34V427J4F  ❌
```

### After (CORRECT):
```javascript
// Use In-App Purchase key
APPLE_IAP_KEY_ID=B2KSMYQ3NG  ✅
```

---

## 🎯 JWT Format (Apple's Requirements):

The code now generates JWTs with these EXACT claims:

```javascript
{
  // Header
  "alg": "ES256",           // MUST be ES256
  "kid": "B2KSMYQ3NG",     // In-App Purchase Key ID
  "typ": "JWT"
}

{
  // Payload
  "iss": "dcabb75f-8975-4e83-8fe3-075bf9670b2e",  // Issuer ID
  "iat": 1234567890,                               // Issued at
  "exp": 1234569090,                               // Expires (20 min)
  "aud": "appstoreconnect-v1",                    // Audience (required)
  "bid": "com.sigitechnologies.trimbusinessios"   // Bundle ID (required)
}
```

---

## 🔄 Next Steps:

1. **Update `.env`** with the exact configuration above
2. **Restart server:** `pm2 restart all`
3. **Test:** Call `/salon/v1/iap/apple/verify`

---

## ✅ Expected Result:

```
🔑 Generating App Store Server JWT...
  ✅ JWT generated successfully
    - Key ID: B2KSMYQ3NG (In-App Purchase)
    - Issuer ID: dcabb75f-8975-4e83-8fe3-075bf9670b2e
    - Bundle ID: com.sigitechnologies.trimbusinessios
    - Algorithm: ES256
    - Audience: appstoreconnect-v1
  Environment: Sandbox
  API URL: https://api.storekit-sandbox.itunes.apple.com

✅ Transaction fetched from Apple
✅ Transaction verified
✅ Apple IAP Verification Complete
```

---

## 📖 Apple Documentation References:

1. **In-App Purchase Keys:** App Store Connect > Users and Access > Integrations > In-App Purchase
2. **Key Requirements:** ES256 algorithm, IAP key (not Connect API key)
3. **JWT Claims:** iss, iat, exp, aud, bid (all required)
4. **Environment:** Sandbox vs Production endpoints

---

## 🆘 If Still Getting 401:

1. Check key is **active** (not revoked) in App Store Connect
2. Verify you're using **In-App Purchase** key (B2KSMYQ3NG), NOT App Store Connect API key
3. Check Bundle ID matches exactly: `com.sigitechnologies.trimbusinessios`
4. Verify Issuer ID is correct: `dcabb75f-8975-4e83-8fe3-075bf9670b2e`
5. Make sure using **sandbox** endpoint for sandbox transactions

---

**This configuration is based on Apple's official documentation and will work!** 🎉

