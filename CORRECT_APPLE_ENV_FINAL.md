# ✅ CORRECT Apple IAP Environment Configuration

## 🎯 Copy this to your `.env` file:

```env
# ============================================
# APPLE IN-APP PURCHASE - FINAL CONFIGURATION
# ============================================
# Use L34V427J4F for ALL operations (modern API)

APPLE_ISSUER_ID=dcabb75f-8975-4e83-8fe3-075bf9670b2e
APPLE_BUNDLE_ID=com.sigitechnologies.trimbusinessios

# Use the SAME key ID for both (L34V427J4F = App Store Connect API key)
APPLE_KEY_ID=L34V427J4F
APPLE_IAP_KEY_ID=L34V427J4F

# Private key from AuthKey_L34V427J4F.p8 (SAME for both)
APPLE_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMETU4VaZhlr+tcBN6kc6yae4fcBSECX5qE0oRBkgMZegCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIR10ovGpzOfSPGtdkRIjXbFYY

APPLE_IAP_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMETU4VaZhlr+tcBN6kc6yae4fcBSECX5qE0oRBkgMZegCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIR10ovGpzOfSPGtdkRIjXbFYY

APPLE_SHARED_SECRET=bd2d41d4531143db886db462df34f695
```

---

## 📋 What Changed?

### ❌ OLD (WRONG):
- `APPLE_KEY_ID=L34V427J4F` (for products)
- `APPLE_IAP_KEY_ID=B2KSMYQ3NG` (In-App Purchase key - LEGACY API only!)

### ✅ NEW (CORRECT):
- `APPLE_KEY_ID=L34V427J4F` (for products)
- `APPLE_IAP_KEY_ID=L34V427J4F` (SAME key for modern verification!)

---

## 🔑 Key Types Explained:

| Key ID | Name | Type | Use For |
|--------|------|------|---------|
| `L34V427J4F` | Trim-API | **App Store Connect API** | ✅ Products, ✅ Transaction Verification (modern) |
| `B2KSMYQ3NG` | In-App Purchase | **Legacy Receipt Verification** | ❌ OLD `verifyReceipt` endpoint only |

---

## 📝 Why This Works:

1. **`/products` endpoint** → Uses `APPLE_KEY_ID` (L34V427J4F) → ✅ Already working
2. **`/verify` endpoint** → Uses `APPLE_IAP_KEY_ID` (L34V427J4F) → ✅ Will work now
3. **`/test-credentials` endpoint** → Uses `APPLE_KEY_ID` (L34V427J4F) → ✅ Will work

---

## 🚀 Next Steps:

1. **Update your `.env` file** with the configuration above
2. **Restart your server:** `pm2 restart all`
3. **Test all endpoints:**
   - ✅ GET `/apple-subscriptions/products`
   - ✅ GET `/apple-subscriptions/test-credentials`
   - ✅ POST `/salon/v1/iap/apple/verify`

---

## 💡 Important Notes:

- The **In-App Purchase** key (`B2KSMYQ3NG`) is ONLY for the **deprecated** `verifyReceipt` API
- The **modern App Store Server API** requires an **App Store Connect API key** with proper permissions
- Your `L34V427J4F` key has **Admin** role, so it works for everything
- You're using the **modern, recommended** approach now! 🎉

---

## 🎯 One Key to Rule Them All:

```
L34V427J4F = Your universal Apple IAP key
```

Use it for:
- ✅ Fetching products/subscriptions
- ✅ Verifying transactions
- ✅ Handling webhooks
- ✅ Managing subscription status

