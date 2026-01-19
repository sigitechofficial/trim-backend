# ✅ CORRECT Apple IAP Configuration

## Based on Official Apple Documentation (2026)

### 🔑 Required: In-App Purchase Key (NOT App Store Connect Key!)

**Your `.env` file should have:**

```env
# ============================================
# Apple In-App Purchase Configuration
# ============================================

# Issuer ID (Team ID - same for all keys)
APPLE_ISSUER_ID=dcabb75f-8975-4e83-8fe3-075bf9670b2e

# In-App Purchase Key ID (from In-App Purchase section)
APPLE_IAP_KEY_ID=B2KSMYQ3NG

# In-App Purchase Private Key (from SubscriptionKey_B2KSMYQ3NG.p8)
APPLE_IAP_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg7J5M/O+qWvuqHfHsorHC1V81j1mCgLQy30Y7w0i1i5qgCgYIKoZIzj0DAQehRANCAAQR5O6mo+r9qmc098u9qgGNYfEBwWnuvqKDHh76d3jLT4ha+1Zy25Z16DtVgs/X2PhvvgoNKmYse7IBuMutG7S/

# App Bundle ID
APPLE_BUNDLE_ID=com.sigitechnologies.trimbusinessios

# Shared Secret (for legacy support)
APPLE_SHARED_SECRET=bd2d41d4531143db886db462df34f695

# ============================================
# For fetching products (optional - can use same key)
# ============================================
APPLE_KEY_ID=B2KSMYQ3NG
APPLE_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg7J5M/O+qWvuqHfHsorHC1V81j1mCgLQy30Y7w0i1i5qgCgYIKoZIzj0DAQehRANCAAQR5O6mo+r9qmc098u9qgGNYfEBwWnuvqKDHh76d3jLT4ha+1Zy25Z16DtVgs/X2PhvvgoNKmYse7IBuMutG7S/
```

## 📋 Key Requirements (Apple Official):

1. **Key Type:** In-App Purchase Key (Under: Users and Access > Integrations > In-App Purchase)
2. **Algorithm:** ES256
3. **JWT Claims Required:**
   - `iss`: Issuer ID
   - `iat`: Issued at (Unix timestamp)
   - `exp`: Expiration (5-20 minutes from iat)
   - `aud`: "appstoreconnect-v1"
   - `bid`: Bundle ID (REQUIRED for transaction endpoints)
4. **Environment:** 
   - Sandbox: `https://api.storekit-sandbox.itunes.apple.com`
   - Production: `https://api.storekit.itunes.apple.com`

## ❌ Common Mistakes:

- Using App Store Connect API key instead of In-App Purchase key
- Missing `bid` claim in JWT
- Wrong environment (sandbox vs production)
- Revoked or inactive key

## ✅ Correct Keys to Use:

| Purpose | Key Name | Key ID | Type |
|---------|----------|--------|------|
| IAP Verification | trim-business | `B2KSMYQ3NG` | In-App Purchase ✅ |
| Products (optional) | Can use same | `B2KSMYQ3NG` | In-App Purchase ✅ |

**DON'T USE:**
- `L34V427J4F` (trim-api) - This is App Store Connect API key ❌
- `8F4J5Y632G` (trim) - This is App Store Connect API key ❌

These are for app metadata, NOT for IAP verification!

