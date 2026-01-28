# 🔑 How to Format Apple Private Keys for .env

## ❌ The Error:

```
Invalid App Store Connect private key: error:1E08010C:DECODER routines::unsupported
```

**Meaning:** The private key format in your `.env` file is incorrect or corrupted.

---

## ✅ Correct Format for .env

### Step 1: Open Your .p8 File

Your `.p8` file looks like this:

```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMETU4VaZhlr+tcBN
6kc6yae4fcBSECX5qE0oRBkgMZegCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd
+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIR10ovGpzOfSPGtdkRIjXb
FYY=
-----END PRIVATE KEY-----
```

---

### Step 2: Extract ONLY the Base64 Content

**Remove these lines:**
- `-----BEGIN PRIVATE KEY-----`
- `-----END PRIVATE KEY-----`

**Keep ONLY the middle part and remove line breaks:**

```
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMETU4VaZhlr+tcBN6kc6yae4fcBSECX5qE0oRBkgMZegCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIR10ovGpzOfSPGtdkRIjXbFYY=
```

---

### Step 3: Put in .env (All on ONE Line)

```env
APPLE_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMETU4VaZhlr+tcBN6kc6yae4fcBSECX5qE0oRBkgMZegCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIR10ovGpzOfSPGtdkRIjXbFYY=
```

**Important:**
- ✅ All on one line
- ✅ No quotes
- ✅ No spaces at start/end
- ✅ No `BEGIN` or `END` markers
- ✅ Should be ~180 characters long

---

## 📝 Complete .env Template:

```env
# ============================================
# APPLE IAP - CORRECT KEY FORMAT
# ============================================

APPLE_ISSUER_ID=dcabb75f-8975-4e83-8fe3-075bf9670b2e
APPLE_BUNDLE_ID=com.sigitechnologies.trimbusinessios
APPLE_SHARED_SECRET=bd2d41d4531143db886db462df34f695

# KEY 1: App Store Connect API (L34V427J4F)
# From file: AuthKey_L34V427J4F.p8
APPLE_KEY_ID=L34V427J4F
APPLE_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMETU4VaZhlr+tcBN6kc6yae4fcBSECX5qE0oRBkgMZegCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIR10ovGpzOfSPGtdkRIjXbFYY=

# KEY 2: In-App Purchase Key (B2KSMYQ3NG)
# From file: AuthKey_B2KSMYQ3NG.p8
APPLE_IAP_KEY_ID=B2KSMYQ3NG
APPLE_IAP_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMwLH9dzS8GePpHnKMgMydX5ExU23N793IrAPiuZzxlOgCgYIKoZIzj0DAQehRANCAAShkEx34FqmHqO2SGQr1IyK6nfd4TXgSnybN0IhhAp1GekwlKB2Wzaiv4s6m4Db9rHehQSUxCE81zkNGcvoBw1l
```

---

## 🔍 How to Convert .p8 to .env Format:

### Option 1: Manual (Recommended)

1. **Open the .p8 file in a text editor**
2. **Copy all lines BETWEEN the BEGIN/END markers**
3. **Remove all line breaks** (make it one continuous string)
4. **Paste into .env** on one line

---

### Option 2: Command Line (Mac/Linux)

```bash
# For L34V427J4F
cat AuthKey_L34V427J4F.p8 | \
  grep -v "BEGIN" | \
  grep -v "END" | \
  tr -d '\n' | \
  tr -d ' '

# For B2KSMYQ3NG
cat AuthKey_B2KSMYQ3NG.p8 | \
  grep -v "BEGIN" | \
  grep -v "END" | \
  tr -d '\n' | \
  tr -d ' '
```

Copy the output and paste into your `.env` file.

---

### Option 3: Command Line (Windows PowerShell)

```powershell
# For L34V427J4F
(Get-Content AuthKey_L34V427J4F.p8 | 
  Where-Object {$_ -notmatch "BEGIN|END"}) -join ''

# For B2KSMYQ3NG
(Get-Content AuthKey_B2KSMYQ3NG.p8 | 
  Where-Object {$_ -notmatch "BEGIN|END"}) -join ''
```

---

## ❌ Common Mistakes:

### 1. Including BEGIN/END Markers
```env
# ❌ WRONG
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----MIGTAgEA...-----END PRIVATE KEY-----
```

### 2. Multiple Lines
```env
# ❌ WRONG
APPLE_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg
METUVaZhlr+tcBN6kc6yae4fcBSECX5qE0oRBkgMZegCgYIKoZIzj0DAQeh
RANCAASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YI
```

### 3. Using Quotes
```env
# ❌ WRONG
APPLE_PRIVATE_KEY="MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdw..."
```

### 4. Extra Spaces
```env
# ❌ WRONG
APPLE_PRIVATE_KEY= MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdw... 
```

### 5. Wrong Key File
```env
# ❌ WRONG - Using B2KSMYQ3NG key content for APPLE_PRIVATE_KEY
APPLE_KEY_ID=L34V427J4F
APPLE_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMwLH9dzS... (from B2KSMYQ3NG!)
```

---

## ✅ Correct Format:

```env
# One line, no quotes, no BEGIN/END, no spaces
APPLE_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgMETU4VaZhlr+tcBN6kc6yae4fcBSECX5qE0oRBkgMZegCgYIKoZIzj0DAQehRANCAASwRDku8SIB8TqkLd+8mOXiusqGk9U3W95i9qdwpoiaD4YIBmnUQce2lJal6xIR10ovGpzOfSPGtdkRIjXbFYY=
```

---

## 🚀 After Fixing:

1. **Save `.env` file**
2. **Restart server:** `pm2 restart all`
3. **Test endpoint:** `GET /apple-subscriptions/products`
4. **Check logs for:**
   ```
   🔑 Parsing App Store Connect Private Key...
     - Raw key length: 183
     - Base64 content length: 183
     ✅ App Store Connect key validated successfully
   ```

---

## 📋 Key Characteristics:

| Key | File | Length (approx) | Starts with |
|-----|------|----------------|-------------|
| L34V427J4F | `AuthKey_L34V427J4F.p8` | ~183 chars | `MIGTAG...` |
| B2KSMYQ3NG | `AuthKey_B2KSMYQ3NG.p8` | ~183 chars | `MIGTAG...` |

Both are **EC (Elliptic Curve) keys**, not RSA keys.

---

## 🔧 Debug Logs:

With the updated controller, you'll see detailed logs:

```
🔑 Parsing App Store Connect Private Key...
  - Raw key length: 183
  - First 50 chars: MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg
  - Last 50 chars: al6xIR10ovGpzOfSPGtdkRIjXbFYY=
  - Base64 content length: 183
  - Base64 preview: MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
  - Rebuilt PEM format (lines): 3
  ✅ App Store Connect key validated successfully
```

If it fails, you'll see:
```
❌ App Store Connect Key Validation Failed:
  Error: error:1E08010C:DECODER routines::unsupported
  Generated PEM (first 100 chars): -----BEGIN PRIVATE KEY-----...
  💡 Troubleshooting: ...
```

---

## 🎯 Quick Fix Checklist:

- [ ] Open `.p8` file in text editor
- [ ] Copy ONLY the base64 content (middle lines)
- [ ] Remove ALL line breaks (make it one line)
- [ ] Remove BEGIN/END markers
- [ ] Remove quotes if any
- [ ] Paste into `.env` on ONE line
- [ ] Save `.env`
- [ ] Restart: `pm2 restart all`
- [ ] Test: `GET /apple-subscriptions/products`

---

**Once you see `✅ App Store Connect key validated successfully`, you're good to go!** 🎉

