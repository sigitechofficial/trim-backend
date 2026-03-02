# TRIM Backend — Notifications Setup Guide

Complete step-by-step documentation for understanding, configuring, and sending all types of notifications in the Trim backend.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Notification Channels](#2-notification-channels)
3. [Step 1 — Firebase Project Setup](#3-step-1--firebase-project-setup)
4. [Step 2 — Firebase Service Account (firebase.json)](#4-step-2--firebase-service-account-firebasejson)
5. [Step 3 — Environment Variables (.env)](#5-step-3--environment-variables-env)
6. [Step 4 — Install Dependencies](#6-step-4--install-dependencies)
7. [Step 5 — Email (ZeptoMail / Nodemailer) Setup](#7-step-5--email-zeptomail--nodemailer-setup)
8. [Step 6 — Device Token Flow (Mobile → Backend)](#8-step-6--device-token-flow-mobile--backend)
9. [Step 7 — Push Notification Utility Functions](#9-step-7--push-notification-utility-functions)
10. [Step 8 — Database Model (pushNotification)](#10-step-8--database-model-pushnotification)
11. [Step 9 — How to Send a New Notification](#11-step-9--how-to-send-a-new-notification)
12. [All Notification Types Reference](#12-all-notification-types-reference)
13. [Email Types Reference](#13-email-types-reference)
14. [Notification Flow Diagram](#14-notification-flow-diagram)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. System Overview

The Trim backend sends notifications through **two channels**:

| Channel | Technology | Purpose |
|---------|-----------|---------|
| **Push Notifications** | Firebase Admin SDK (FCM) | Real-time mobile alerts |
| **Email Notifications** | Nodemailer + ZeptoMail SMTP | Booking confirmations, receipts |

All push notifications are dispatched through one of three utility functions in `utils/`:

| Utility File | Used For |
|---|---|
| `utils/throwNotification.js` | Customer / Salon / Employee notifications |
| `utils/throwNotificationByAdmin.js` | Admin-broadcast notifications |
| `utils/throwNotificationBySalon.js` | Salon-specific push (no DB record saved) |

---

## 2. Notification Channels

```
Mobile App  →  Register device token  →  Backend (deviceToken table)
                                                 ↓
Backend Event (booking / cancel / etc.)
       ↓
 bookingDataForEmailAndNotifications()   ← fetches tokens + emails
       ↓
 ┌─────────────┬───────────────────┐
 │  ThrowNotification()            │  nodemailer transporter
 │  (FCM multicast)                │  (Email via ZeptoMail SMTP)
 └─────────────┴───────────────────┘
       ↓
 Firebase Cloud Messaging  →  Device
```

---

## 3. Step 1 — Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project (or use existing: **trimapp-407807**)
3. In **Project Settings → General**, make sure your Android/iOS apps are registered
4. Enable **Cloud Messaging** under **Project Settings → Cloud Messaging**
5. Note down the **Server Key** (legacy) — stored as `FIREBASE_SERVER_KEY` in `.env`

> The project currently uses **Firebase Admin SDK** (`firebase-admin` package) which is the modern approach and does NOT need the legacy server key to send messages — it uses the service account JSON instead.

---

## 4. Step 2 — Firebase Service Account (firebase.json)

The file `firebase.json` at the project root is the service account credential file.

### How to generate / replace it

1. Go to [Firebase Console](https://console.firebase.google.com/) → Your Project
2. Click the gear icon → **Project Settings**
3. Go to the **Service accounts** tab
4. Click **"Generate new private key"**
5. Download the JSON file
6. Rename it to `firebase.json` and place it at the **project root** (`d:\trimBackend\trim-backend\firebase.json`)

### Current firebase.json structure (reference)

```json
{
  "type": "service_account",
  "project_id": "trimapp-407807",
  "private_key_id": "YOUR_KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-XXXX@trimapp-407807.iam.gserviceaccount.com",
  "client_id": "YOUR_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://...",
  "universe_domain": "googleapis.com"
}
```

> **Security:** `firebase.json` is listed in `.gitignore`. Never commit it to version control.

---

## 5. Step 3 — Environment Variables (.env)

Add / verify these variables in your `.env` file at the project root:

```env
# ─── FIREBASE (Push Notifications) ───────────────────────────────────────────
FIREBASE_SERVER_KEY=AAAAIoF_qp4:APA91b...   # Legacy FCM server key (kept for reference)
FIREBASE_URL=                                # Leave blank for Admin SDK usage

# ─── EMAIL (Nodemailer / ZeptoMail) ──────────────────────────────────────────
EMAIL_HOST=smtp.zeptomail.com
EMAIL_PORT=465
EMAIL_USER=emailapikey
EMAIL_USERNAME=Trim <noreply@trimworldwide.com>
EMAIL_USERNAME_FOR_CUSTOMER=<noreply@trimworldwide.com>
EMAIL_PASSWORD=YOUR_ZEPTOMAIL_API_KEY
```

### What each variable does

| Variable | Description |
|---|---|
| `FIREBASE_SERVER_KEY` | Legacy FCM server key — kept for `fcm-node` fallback, not actively used by Admin SDK |
| `EMAIL_HOST` | SMTP host — currently ZeptoMail (`smtp.zeptomail.com`) |
| `EMAIL_PORT` | SMTP port — `465` (SSL) |
| `EMAIL_USER` | SMTP auth username — ZeptoMail uses `emailapikey` as the literal username |
| `EMAIL_USERNAME` | The "From" display name for salon emails |
| `EMAIL_USERNAME_FOR_CUSTOMER` | The "From" address for customer emails |
| `EMAIL_PASSWORD` | Your ZeptoMail API key (starts with `Zoho-enczapikey`) |

---

## 6. Step 4 — Install Dependencies

```bash
npm install
```

Key notification-related packages already in `package.json`:

| Package | Version | Purpose |
|---|---|---|
| `firebase-admin` | `^12.4.0` | Firebase Admin SDK for FCM push notifications |
| `fcm-node` | `^1.6.1` | Legacy FCM wrapper (installed but Admin SDK is primary) |
| `nodemailer` | `^6.9.7` | Email sending via SMTP |

---

## 7. Step 5 — Email (ZeptoMail / Nodemailer) Setup

### Transporter Configuration

Located at `helper/transpoter.js`:

```js
// helper/transpoter.js
exports.transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,      // smtp.zeptomail.com
  port: process.env.EMAIL_PORT,      // 465
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
})
```

### How to get a ZeptoMail API key

1. Sign up at [ZeptoMail](https://www.zoho.com/zeptomail/)
2. Create a **Mail Agent**
3. Add and verify your sending domain (`trimworldwide.com`)
4. Go to **Mail Agents → Your Agent → SMTP Details**
5. Copy the **API Token** — paste it as `EMAIL_PASSWORD` in `.env`
6. The SMTP username is always `emailapikey` (literal string)

### Email Helper Files

| File | Purpose |
|---|---|
| `helper/AppointmentEmailsToCustomer.js` | Booking confirmation / cancellation emails to customer |
| `helper/AppointmentEmailsToSalon.js` | Booking emails to salon |
| `helper/WelcomeForBoth.js` | Welcome email after registration |
| `helper/ResetPasswordOtpToAll.js` | OTP / password reset emails |
| `helper/ThankYouForVisiting.js` | Post-appointment thank you email |
| `helper/PayoutBlockedEmail.js` | Stripe payout blocked email to salon |
| `helper/inviteEmployee.js` | Employee invitation email |
| `helper/IncompleteRegistrationReminder.js` | Nudge salons to complete their profile |
| `helper/clingReminderEmail.js` | Appointment reminder email |
| `helper/CustomEmails.js` | Admin custom email blasts |

---

## 8. Step 6 — Device Token Flow (Mobile → Backend)

The mobile app must register its FCM device token with the backend so we can address push notifications to specific devices.

### Database Model — `deviceToken`

```
deviceToken
├── id          (auto)
├── tokenId     STRING   ← the FCM registration token from the mobile device
├── status      BOOLEAN  ← active/inactive
├── userId      FK → user
└── timestamps
```

### How the mobile app should register a token

The app calls an API endpoint (typically on login or app open) to save the FCM token:

```
POST /api/customer/device-token      ← for customers
POST /api/salon/device-token         ← for salon owners
POST /api/employee/device-token      ← for employees

Body: { "tokenId": "fcm_device_token_here" }
```

> Tokens are associated with a `userId`. A user can have **multiple tokens** (multiple devices). All tokens for a user are fetched and notifications are sent as a **multicast** to all of them.

---

## 9. Step 7 — Push Notification Utility Functions

### `utils/throwNotification.js` — Primary (Customer / Salon / Employee)

```js
const ThrowNotification = require('./utils/throwNotification')

await ThrowNotification(
  tokens,         // Array of FCM device tokens: ['token1', 'token2']
  notification,   // { title: 'string', body: 'string' }
  data,           // Object with string values: { appointment: '123', name: 'John' }
  userId,         // (optional) User ID — saved to pushNotifications table
  broadcastTo,    // (optional) Override the 'to' field in DB record
)
```

**What it does:**
- Deduplicates the token array
- Converts all `data` values to strings (FCM requirement)
- Saves a record to the `pushNotifications` table
- Calls `admin.messaging().sendEachForMulticast(message)`

---

### `utils/throwNotificationByAdmin.js` — Admin Broadcasts

```js
const ThrowByAdmin = require('./utils/throwNotificationByAdmin')

await ThrowByAdmin(
  tokens,         // Array of FCM tokens
  notification,   // { title, body }
  data,           // Object
  sendTo,         // 'customer' | 'salon' | 'shop' | 'employee' | 'all'
  broadcastTo,    // defaults to 'admin' — type field in DB
)
```

---

### `utils/throwNotificationBySalon.js` — Salon Push (No DB Record)

```js
const ThrowBySalon = require('./utils/throwNotificationBySalon')

await ThrowBySalon(
  tokens,         // Array of FCM tokens
  notification,   // { title, body }
  data,           // Object
)
```

> This function does **not** save a DB record — used for lightweight salon-triggered pushes.

---

## 10. Step 8 — Database Model (pushNotification)

Every notification sent via `throwNotification.js` or `throwNotificationByAdmin.js` is logged to the `pushNotifications` table.

```
pushNotification
├── id          (auto)
├── at          DATE        ← timestamp the notification was sent
├── to          ENUM        ← 'customer' | 'salon' | 'employee' | 'all' | 'regular'
├── title       STRING      ← notification title
├── body        STRING      ← notification body
├── data        JSON        ← extra payload (bookingId, image, etc.)
├── type        ENUM        ← 'appointment' | 'rating' | 'admin' | 'permotional'
├── repliedAt   DATE        ← if/when admin responded
└── timestamps
```

---

## 11. Step 9 — How to Send a New Notification

Follow these steps any time you need to add a new notification to the system.

### Step A — Gather the FCM tokens

Use the shared data utility to get tokens for a booking:

```js
const { bookingDataForEmailAndNotifications } = require('../utils/emailsNotificationsData')

const bookingData = await bookingDataForEmailAndNotifications(bookingId)

const customerTokens = bookingData.client.customerTokens   // Array
const salonTokens    = bookingData.salon.salonTokens       // Array
const employeeTokens = bookingData.employeeData[0].tokens  // Array per employee
```

Or fetch tokens directly from the DB:

```js
const { deviceToken } = require('../models')
const tokens = await deviceToken.findAll({ where: { userId } })
const fcmTokens = tokens.map(t => t.tokenId)
```

### Step B — Build the notification object

```js
const notification = {
  title: 'Your title here',
  body:  'Your message body here',
}
```

### Step C — Build the data payload

All values **must be strings**:

```js
const data = {
  appointment: String(bookingId),
  name:        'Customer Full Name',
  image:       'https://...',
  // add any custom key-value pairs
}
```

### Step D — Call ThrowNotification

```js
const ThrowNotification = require('../utils/throwNotification')

ThrowNotification(
  customerTokens,
  notification,
  data,
  userId,        // pass userId to log the record against the right user
)
```

### Step E — (Optional) Send email at the same time

```js
const EmailToCustomer = require('../helper/AppointmentEmailsToCustomer')

if (customerEmail) {
  EmailToCustomer([customerEmail], appointmentData, 'confirm')
}
```

---

## 12. All Notification Types Reference

### Customer Notifications (15 types)

| # | Event | Title | Body |
|---|---|---|---|
| 1 | Booking confirmed | `Booking confirmed` | `Your booking with [SALON] on [DATE_TIME] has been confirmed.` |
| 2 | Cancelled by salon | `Booking cancelled` | `Your booking on [DATE_TIME] has been cancelled.` |
| 3 | Cancelled by customer | `Booking cancelled` | `We regret to inform you that your booking on [DATE_TIME] has been cancelled.` |
| 4 | Cancelled by salon (alt) | `Booking Cancellation` | `We regret to inform you that your booking on [DATE_TIME] has been cancelled. Please contact us to reschedule.` |
| 5 | Rescheduled by customer | `Rescheduled booking` | `Your booking with [SALON] has been rescheduled to [DATE_TIME].` |
| 6 | Rescheduled by salon | `Rescheduled booking` | `Your booking with [SALON] has been rescheduled to [DATE_TIME]. Please let us know if this works for you.` |
| 7 | No-show | `No-show notification` | `You seem to have missed your booking today...` |
| 8 | Reminder (24h) | `Upcoming booking` | `Your booking with [OWNER_NAME] is tomorrow [DD/MM/YY] @ [HH:mm]pm` |
| 9 | Reminder (2h) | `Upcoming booking` | `Your booking with [OWNER_NAME] is in about 2 hours [DD/MM/YY] @ [HH:mm]pm` |
| 10 | Review request (cash) | `Review` | `You can leave a review for your booking...` |
| 11 | Review request (online) | `Review` | `You can leave a review for your booking...` |
| 12 | Tip thank you | `Thank you for tipping` | `Thank you for your generous tip. We greatly appreciate your support!` |
| 13 | Shop reply to feedback | `Shop reply` | `[REPLY_TEXT]. From [SALON_NAME]` |
| 14 | New coupon (bulk) | `New Coupon Available!` | `[SALON] has a new coupon "[CODE]" with [VALUE]% off! Valid until [DATE].` |
| 15 | New coupon (individual) | `🎉 New Coupon Available!` | `[SALON] has a new coupon "[CODE]" with [VALUE]% off! Valid until [DATE].` |

**Source files:**
- `controllers/eventDrivenCommunication/appointmentConfirm.js`
- `controllers/eventDrivenCommunication/appointmentCancel.js`
- `controllers/eventDrivenCommunication/appointmentReschedule.js`
- `controllers/eventDrivenCommunication/appointmentNoshow.js`
- `controllers/eventDrivenCommunication/appointmentCheckout.js`
- `controllers/eventDrivenCommunication/couponNotification.js`
- `controllers/userControllers/customerController.js` (reminders)
- `controllers/salonControllers/salonController.js` (shop reply)

---

### Salon Notifications (13 types)

| # | Event | Title | Body |
|---|---|---|---|
| 1 | New booking | `New booking` | `[CUSTOMER] has booked [DATE_TIME] for [SERVICES].` |
| 2 | Booking cancelled by customer | `Booking cancellation` | `[CUSTOMER] has cancelled their booking on [DATE_TIME].` |
| 3 | Booking cancellation alert | `Booking Cancellation Alert` | `The booking with [CUSTOMER] on [DATE_TIME] has been cancelled.` |
| 4 | Booking rescheduled by customer | `Booking rescheduled` | `[CUSTOMER] has rescheduled their booking to [DATE_TIME].` |
| 5 | No-show | `No-show` | `[CUSTOMER] did not show up for their booking on [DATE_TIME].` |
| 6 | Reminder (24h) | `Upcoming booking` | `You have a booking with [CUSTOMER] tomorrow at [TIME] on [DATE] for a [SERVICES]` |
| 7 | Reminder (2h) | `Upcoming booking` | `You have a booking with [CUSTOMER] at [TIME] on [DATE] for a [SERVICES]` |
| 8 | Payment received (cash) | `Payment received` | `Payment of [CURRENCY][AMOUNT] received from [CUSTOMER].` |
| 9 | Payment received (online) | `Payment received` | `Payment of [CURRENCY][AMOUNT] received from [CUSTOMER].` |
| 10 | New review | `New review` | `[CUSTOMER] has left a new review: [COMMENT].` |
| 11 | Payouts blocked (Stripe) | `Payouts Blocked` | `Your payouts have been temporarily paused. Please check your Stripe account...` |
| 12 | Action required (Stripe) | `Action Required` | `Your payout account needs additional documents.` |
| 13 | Account verified (Stripe) | `Account Verified` | `Your payout account is fully verified.` |

---

### Employee Notifications (4 types)

| # | Event | Title | Body |
|---|---|---|---|
| 1 | Booking assigned | `Booking assigned` | `A new booking has been made by [CUSTOMER] for [DATE_TIME] for a [SERVICE]` |
| 2 | Booking cancelled | `Booking cancellation` | `[CUSTOMER] has cancelled their booking on [DATE_TIME] for [SERVICE]` |
| 3 | Booking rescheduled | `Booking rescheduled` | `[CUSTOMER] has rescheduled their booking to [DATE_TIME] for [SERVICE]` |
| 4 | New review | `New review notification` | `[CUSTOMER] has left a new review: [COMMENT].` |

---

### Admin Notifications (2 types)

| # | Event | Title | Body | File |
|---|---|---|---|---|
| 1 | Custom promotional | `[ADMIN_TITLE]` | `[ADMIN_BODY]` | `controllers/adminController/adminController.js` |
| 2 | Test notification | `TEST NOTIFICATION` | `This is a test notification...` | `controllers/userControllers/customerController.js` |

---

## 13. Email Types Reference

| Email | Trigger | Helper File |
|---|---|---|
| Booking confirmation to customer | New online booking | `AppointmentEmailsToCustomer.js` |
| Booking confirmation to salon | New online booking | `AppointmentEmailsToSalon.js` |
| Booking cancellation to customer | Booking cancelled | `AppointmentEmailsToCustomer.js` |
| Booking cancellation to salon | Booking cancelled | `AppointmentEmailsToSalon.js` |
| Welcome email | New registration | `WelcomeForBoth.js` |
| Password reset OTP | Forgot password | `ResetPasswordOtpToAll.js` |
| Post-visit thank you | Checkout complete | `ThankYouForVisiting.js` |
| Payout blocked | Stripe webhook | `PayoutBlockedEmail.js` |
| Employee invitation | Salon invites employee | `inviteEmployee.js` |
| Incomplete registration reminder | Scheduled job | `IncompleteRegistrationReminder.js` |
| Appointment reminder | Cron 24h / 2h before | `clingReminderEmail.js` |
| Custom admin email | Admin dashboard | `CustomEmails.js` |

---

## 14. Notification Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     BOOKING CREATED                          │
└──────────────────────────────┬───────────────────────────────┘
                               │
              bookingDataForEmailAndNotifications(bookingId)
                               │
              ┌────────────────┴────────────────┐
              ▼                                  ▼
    ┌─────────────────┐               ┌─────────────────────┐
    │   PUSH (FCM)    │               │   EMAIL (ZeptoMail) │
    │                 │               │                     │
    │ ThrowNotific... │               │ AppointmentEmails   │
    │  → Customer     │               │  ToCustomer()       │
    │  → Salon        │               │ AppointmentEmails   │
    │  → Employees    │               │  ToSalon()          │
    └────────┬────────┘               └──────────┬──────────┘
             │                                   │
             ▼                                   ▼
    Firebase Admin SDK                   Nodemailer SMTP
    sendEachForMulticast()               (ZeptoMail)
             │                                   │
             ▼                                   ▼
    Mobile Device Screen             User's Email Inbox
             │
             ▼
    pushNotification table
    (logged in MySQL)
```

---

## 15. Troubleshooting

### Push notifications not sending

| Problem | Check |
|---|---|
| `Error: Failed to determine service account` | `firebase.json` missing or path wrong — must be at project root |
| `INVALID_ARGUMENT: registration-token-not-registered` | Token is stale — mobile app must re-register the token |
| `failureCount > 0` in logs | Check individual token errors in `response.responses` |
| No tokens found | User never called the device-token registration endpoint |
| All `tokenId` values are null | Frontend is not passing the FCM token on login/app open |

### Emails not sending

| Problem | Check |
|---|---|
| `Error: Invalid login` | Wrong `EMAIL_PASSWORD` — regenerate ZeptoMail API key |
| `ECONNREFUSED` on port 465 | Firewall blocking outbound SMTP — try port 587 with `secure: false` |
| Emails landing in spam | Domain SPF/DKIM not configured in ZeptoMail dashboard |
| `transporter` is undefined | `dotenv.config()` called after `require('../helper/transpoter')` |

### Firebase Admin SDK initialization error

The SDK is initialized inside `utils/throwNotification.js` at the **module level**. If you import `throwNotification` more than once (in multiple files), Node's module cache ensures `initializeApp` only runs once. If you see "app already exists" errors, the SDK is being re-initialized — ensure `initializeApp` is called only once (already handled by Node caching).

---

## Quick Reference — Files Summary

```
trim-backend/
├── firebase.json                                  ← Firebase service account credentials
├── .env                                           ← Email + Firebase env vars
│
├── utils/
│   ├── throwNotification.js                       ← Primary push notification sender
│   ├── throwNotificationByAdmin.js                ← Admin broadcast sender
│   ├── throwNotificationBySalon.js                ← Salon push (no DB log)
│   └── emailsNotificationsData.js                 ← Fetches tokens + emails for a booking
│
├── models/
│   ├── pushNotifications.js                       ← DB model for notification log
│   └── deviceToken.js                             ← DB model for FCM tokens
│
├── helper/
│   ├── transpoter.js                              ← Nodemailer SMTP transporter
│   ├── AppointmentEmailsToCustomer.js             ← Customer email templates
│   ├── AppointmentEmailsToSalon.js                ← Salon email templates
│   └── ...                                        ← Other email helpers
│
└── controllers/
    └── eventDrivenCommunication/
        ├── appointmentConfirm.js                  ← Booking confirmed notifications
        ├── appointmentCancel.js                   ← Booking cancelled notifications
        ├── appointmentReschedule.js               ← Booking rescheduled notifications
        ├── appointmentNoshow.js                   ← No-show notifications
        ├── appointmentCheckout.js                 ← Payment / review notifications
        ├── couponNotification.js                  ← Coupon notifications
        └── customerFeedback.js                    ← Review notifications
```

---

*Last Updated: February 2026*
*Total notification types: 34 (15 customer + 13 salon + 4 employee + 2 admin)*
