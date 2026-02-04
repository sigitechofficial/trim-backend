# Apple Subscription Use Cases Documentation

## Overview
This document outlines all possible scenarios for handling Apple In-App Purchase subscriptions in the Trim Backend application.

---

## Core Principle
**One App Account → One Subscription with One Apple ID**

Each user account in the app should be linked to one active Apple subscription at a time.

---

## Use Case Categories

### Category 1: One App Account → One Subscription with One Apple ID

#### Case 1.1: Restore Case 1 - Frontend Manages Transactions
**Scenario:** User has purchased subscription, frontend retrieves transaction data from Apple, sends to backend.

**Flow:**
1. Frontend calls Apple StoreKit to get transaction data
2. Frontend sends transaction data to backend (`verifyApplePurchase` API)
3. Backend verifies transaction with Apple Server API
4. Backend creates/updates subscription in database
5. Backend links subscription to user account

**Expected Behavior:**
- ✅ Create subscription record if doesn't exist
- ✅ Update subscription if `originalTransactionId` already exists
- ✅ Link subscription to current logged-in user
- ✅ Return subscription details to frontend

**API Endpoint:** `POST /salon/v1/iap/apple/verify`

**Implementation:**
- Check for duplicate `transactionId` (idempotency)
- Check if `originalTransactionId` exists → Update existing subscription
- If not exists → Create new subscription
- Update user's `appleOriginalTransactionId`

---

#### Case 1.2: Restore Case 2 - Subscription Not Attached to App Account
**Scenario:** Frontend finds subscription data from Apple, but that subscription is not attached to any app account in backend.

**Flow:**
1. Frontend retrieves subscription from Apple
2. Frontend sends to backend for verification
3. Backend checks if subscription exists in database
4. Backend finds subscription exists but not linked to current user

**Expected Behavior:**
- ✅ Check if subscription exists with different `userId`
- ✅ If found with different user: Show error message
- ✅ If not found: Create new subscription record and link to current user
- ✅ Return appropriate response

**Error Message:**
```json
{
  "status": "0",
  "message": "Subscription found but linked to another account",
  "error": "This subscription is already linked to a different account. Please contact support if you believe this is an error.",
  "data": {}
}
```

---

#### Case 1.3: Restore Case 3 - No Subscription Found
**Scenario:** User tries to restore purchases but has no active subscription in Apple's system.

**Flow:**
1. Frontend calls Apple StoreKit to restore purchases
2. Apple returns no active subscriptions
3. Frontend sends request to backend
4. Backend verifies with Apple Server API
5. Backend confirms no subscription exists

**Expected Behavior:**
- ✅ Return clear message that no subscription exists
- ✅ Allow user to purchase new subscription
- ✅ Don't block user from app (if they have other access)

**Response:**
```json
{
  "status": "0",
  "message": "No active subscription found",
  "error": "Your subscription does not exist. Please purchase a subscription to continue.",
  "data": {
    "hasSubscription": false,
    "canPurchase": true
  }
}
```

---

### Category 2: Two Apple IDs and One App Account

#### Case 2.1: Purchasing New Subscription with Different Apple ID
**Scenario:** User is logged into App Account X (which has/had subscription with Apple ID A), tries to purchase new subscription with Apple ID B.

**Flow:**
1. User is logged into App Account X
2. User attempts purchase with Apple ID B
3. Backend receives verification request
4. Backend checks if user has existing subscription with different Apple ID

**Expected Behavior:**
- ✅ Check if user has active subscription with different `originalTransactionId`
- ✅ If active subscription exists: Block purchase, show error
- ✅ If expired/canceled subscription exists: Allow purchase (treat as fresh start)
- ✅ Update user's `appleOriginalTransactionId` to new one

**Error Message (Active Subscription):**
```json
{
  "status": "0",
  "message": "Your App Account is linked with another Apple ID",
  "error": "Your App Account is linked with another Apple ID. Please login using that Apple ID to use the app. Your current subscription expires on [date].",
  "data": {
    "existingSubscription": {
      "expiresDate": "...",
      "subscriptionId": "..."
    }
  }
}
```

**Success Response (Expired Subscription):**
```json
{
  "status": "1",
  "message": "New subscription created successfully",
  "data": {
    "subscriptionId": "...",
    "expiryDate": "..."
  }
}
```

---

#### Case 2.2: Restore with Different Apple ID (Active Subscription Exists)
**Scenario:** User has active subscription with Apple ID A, tries to restore purchases with Apple ID B.

**Flow:**
1. User is logged into App Account X
2. User has active subscription with Apple ID A
3. User tries to restore with Apple ID B
4. Backend receives restore request

**Expected Behavior:**
- ✅ Detect active subscription with different Apple ID
- ✅ Block restore attempt
- ✅ Show error message with current subscription details

**Error Message:**
```json
{
  "status": "0",
  "message": "Active subscription found with different Apple ID",
  "error": "You already have an active subscription linked to another Apple ID. Please use that Apple ID to continue. Your current subscription expires on [date].",
  "data": {
    "existingSubscription": {
      "expiresDate": "...",
      "subscriptionId": "..."
    }
  }
}
```

---

#### Case 2.3: Purchase with Different Apple ID (Expired Subscription)
**Scenario:** User's subscription with Apple ID A expired, tries to purchase new subscription with Apple ID B.

**Flow:**
1. User had subscription with Apple ID A (now expired)
2. User tries to purchase with Apple ID B
3. Backend receives verification request

**Expected Behavior:**
- ✅ Check subscription status (expired/canceled)
- ✅ Allow purchase with new Apple ID
- ✅ Create new subscription record
- ✅ Update user's `appleOriginalTransactionId`

**Success Response:**
```json
{
  "status": "1",
  "message": "Subscription created successfully",
  "data": {
    "subscriptionId": "...",
    "expiryDate": "..."
  }
}
```

---

### Category 3: Edge Cases and Additional Scenarios

#### Case 3.1: Duplicate Purchase Attempt (Same Apple ID)
**Scenario:** User already has active subscription, tries to purchase again (mistake/retry).

**Flow:**
1. User has active subscription
2. User attempts purchase again with same Apple ID
3. Backend receives verification request

**Expected Behavior:**
- ✅ Check if `originalTransactionId` already exists
- ✅ If exists and active: Return existing subscription details
- ✅ Don't create duplicate subscription
- ✅ Show message about existing subscription

**Response:**
```json
{
  "status": "1",
  "message": "You already have an active subscription",
  "data": {
    "subscriptionId": "...",
    "expiryDate": "...",
    "isExisting": true
  }
}
```

---

#### Case 3.2: Webhook for Unlinked Subscription
**Scenario:** Apple sends webhook for subscription that doesn't match any user's `appleOriginalTransactionId`.

**Flow:**
1. Apple sends webhook notification
2. Backend receives webhook
3. Backend tries to find user by `originalTransactionId`
4. No user found

**Expected Behavior:**
- ✅ Log warning for investigation
- ✅ Try to find subscription record by `originalTransactionId`
- ✅ If subscription found: Link to user from subscription record
- ✅ If not found: Log error, return 200 to Apple (prevent retries)

**Current Implementation:**
- Webhook returns early if user not found (line 147-150 in `appleWebhookController.js`)
- Should be enhanced to check subscription records

**Recommended Enhancement:**
```javascript
// If user not found by originalTransactionId, try finding subscription
const subscription = await subscriptions.findOne({
  where: { appleOriginalTransactionId: originalTransactionId },
  include: [{ model: user }]
});

if (subscription && subscription.user) {
  salonUser = subscription.user;
  // Update user's appleOriginalTransactionId if needed
}
```

---

#### Case 3.3: Active Subscription Switch Attempt
**Scenario:** User has active subscription with Apple ID A, tries to verify purchase with Apple ID B while subscription is still active.

**Flow:**
1. User has active subscription (expires in future)
2. User tries to verify purchase with different Apple ID
3. Backend receives verification request

**Expected Behavior:**
- ✅ Check if user has active subscription with different Apple ID
- ✅ Block verification
- ✅ Show error with current subscription expiry date

**Error Message:**
```json
{
  "status": "0",
  "message": "Active subscription with different Apple ID",
  "error": "You have an active subscription with another Apple ID. Your current subscription expires on [date]. Please use that Apple ID.",
  "data": {
    "existingSubscription": {
      "expiresDate": "...",
      "subscriptionId": "..."
    }
  }
}
```

---

#### Case 3.4: Canceled/Refunded Subscription - New Purchase
**Scenario:** User canceled or got refunded with Apple ID A, tries to purchase with Apple ID B.

**Flow:**
1. User had subscription with Apple ID A (canceled/refunded)
2. User tries to purchase with Apple ID B
3. Backend receives verification request

**Expected Behavior:**
- ✅ Check subscription status (canceled/refunded)
- ✅ Allow purchase with new Apple ID
- ✅ Treat as fresh start
- ✅ Create new subscription record

**Success Response:**
```json
{
  "status": "1",
  "message": "Subscription created successfully",
  "data": {
    "subscriptionId": "...",
    "expiryDate": "..."
  }
}
```

---

#### Case 3.5: Multiple Subscriptions (Edge Case)
**Scenario:** User somehow has multiple active subscriptions (shouldn't happen, but possible due to race conditions).

**Flow:**
1. User has multiple subscription records in database
2. User tries to restore or verify purchase
3. Backend finds multiple subscriptions

**Expected Behavior:**
- ✅ Return the most recent/active subscription
- ✅ Log warning for investigation
- ✅ Consider cleanup job to merge/remove duplicates

**Response:**
```json
{
  "status": "1",
  "message": "Multiple subscriptions found, using most recent",
  "data": {
    "subscriptionId": "...",
    "expiryDate": "...",
    "warning": "Multiple subscriptions detected - please contact support"
  }
}
```

---

#### Case 3.6: Subscription Plan Change (Upgrade/Downgrade)
**Scenario:** User changes subscription plan (e.g., from Owner + 5 members to Owner + 4 members).

**Flow:**
1. User has active subscription with plan A
2. User purchases/upgrades to plan B via Apple
3. Apple sends webhook notification
4. Backend receives plan change notification

**Expected Behavior:**
- ✅ Detect subscription plan change
- ✅ If downgrade: Block excess employees (newest first)
- ✅ Update salon metadata with new member count
- ✅ Update subscription record with new plan details

**Implementation:**
- Handled in `handleSubscriptionPlanChange()` function
- Automatically blocks employees when downgrading
- Updates `salon.teamSize` and `salon.metadata.membersCount`

---

## Implementation Checklist

### Backend API: `verifyApplePurchase`

- [x] Check if user has active subscription with different Apple ID
- [x] Check if `originalTransactionId` already exists (update vs create)
- [x] Handle expired/canceled subscriptions with different Apple ID
- [x] Prevent duplicate purchases (same Apple ID)
- [x] Return appropriate error messages for each scenario
- [x] Update user's `appleOriginalTransactionId` when needed
- [x] Log all edge cases for monitoring

### Webhook Handler: `handleAppleWebhook`

- [x] Find user by `originalTransactionId` (primary)
- [ ] Fallback: Find subscription record, then get user (TODO)
- [ ] Handle webhooks for unlinked subscriptions (TODO)
- [x] Update subscription status correctly
- [x] Handle subscription plan changes (upgrade/downgrade)
- [x] Block excess employees on downgrade

### Frontend Integration

- [ ] Handle restore purchases flow
- [ ] Show appropriate error messages
- [ ] Handle "no subscription found" case
- [ ] Prevent duplicate purchase attempts
- [ ] Show subscription expiry information
- [ ] Handle subscription plan change notifications

---

## Error Codes Reference

| Status | Message | Scenario |
|--------|---------|----------|
| `0` | No active subscription found | Case 1.3 |
| `0` | Your App Account is linked with another Apple ID | Case 2.1 (Active) |
| `0` | Active subscription found with different Apple ID | Case 2.2 |
| `0` | Active subscription with different Apple ID | Case 3.3 |
| `0` | Subscription found but linked to another account | Case 1.2 |
| `1` | Purchase already verified | Duplicate transaction |
| `1` | Subscription created successfully | New subscription |
| `1` | Purchase verified and subscription updated | Existing subscription updated |

---

## Database Schema Considerations

### `users` Table
- `appleOriginalTransactionId` - Stores the current/latest Apple subscription ID
- Should be updated when new subscription is created

### `subscriptions` Table
- `appleOriginalTransactionId` - Unique identifier for Apple subscription
- `appleTransactionId` - Current transaction ID (can change on renewal)
- `userId` - Links subscription to user account
- `status` - Subscription status (active, expired, canceled, refunded)

### `salonDetail` Table
- `teamSize` - Current team size limit from subscription
- `metadata.membersCount` - Number of staff members allowed
- `metadata.subscriptionName` - Human-readable subscription name

---

## Testing Scenarios

### Test Case 1: Normal Purchase Flow
1. User has no subscription
2. User purchases subscription
3. ✅ Subscription created successfully

### Test Case 2: Restore Existing Subscription
1. User has active subscription
2. User restores purchases
3. ✅ Existing subscription returned

### Test Case 3: Purchase with Different Apple ID (Active Exists)
1. User has active subscription with Apple ID A
2. User tries to purchase with Apple ID B
3. ✅ Error: "Your App Account is linked with another Apple ID"

### Test Case 4: Purchase with Different Apple ID (Expired)
1. User has expired subscription with Apple ID A
2. User purchases with Apple ID B
3. ✅ New subscription created successfully

### Test Case 5: Duplicate Purchase
1. User has active subscription
2. User tries to purchase again (same Apple ID)
3. ✅ Existing subscription returned

### Test Case 6: Subscription Plan Downgrade
1. User has "Owner + 5 members" subscription
2. User downgrades to "Owner + 4 members"
3. ✅ Most recently added employee blocked
4. ✅ Salon metadata updated

---

## Monitoring and Logging

### Key Metrics to Track
- Number of subscription creations
- Number of subscription updates
- Number of blocked purchases (different Apple ID)
- Number of employee blocks (plan downgrades)
- Webhook processing errors
- Unlinked subscription webhooks

### Log Messages to Monitor
- `⚠️ User not found for Apple transaction` - Webhook for unlinked subscription
- `📊 Subscription Plan Change` - Plan upgrade/downgrade
- `🚫 Blocked employee` - Employee blocked due to downgrade
- `✅ Subscription created` - New subscription created
- `✅ Subscription updated` - Existing subscription updated

---

## Support Scenarios

### User Reports: "I can't use my subscription"
1. Check if subscription exists in database
2. Check if subscription is linked to correct user
3. Check subscription status (active/expired/canceled)
4. Check if user's `appleOriginalTransactionId` matches subscription
5. Verify with Apple Server API if needed

### User Reports: "I was charged twice"
1. Check for duplicate subscriptions in database
2. Verify both transactions with Apple
3. Check if one is refunded/canceled
4. Merge or cancel duplicate subscription

### User Reports: "My employees were blocked"
1. Check subscription plan change history
2. Verify plan downgrade occurred
3. Check which employees were blocked
4. Explain subscription limits to user

---

## Future Enhancements

1. **Subscription Transfer**: Allow users to transfer subscription between Apple IDs (with verification)
2. **Subscription History**: Show complete subscription history to users
3. **Grace Period**: Add grace period before blocking employees on downgrade
4. **Notification System**: Notify users before employees are blocked
5. **Admin Dashboard**: View all subscription statuses and changes
6. **Analytics**: Track subscription conversion rates, churn, upgrades/downgrades

---

## Related Documentation

- `APPLE_SUBSCRIPTION_GUIDE.md` - General Apple subscription setup
- `APPLE_IAP_ANALYSIS_FINDINGS.md` - Technical analysis
- `APPLE_TWO_KEYS_SETUP.md` - API key configuration
- `controllers/appleSubscriptions/appleSubscriptionController.js` - Implementation
- `controllers/appleSubscriptions/appleWebhookController.js` - Webhook handler

---

**Last Updated:** 2025-01-27  
**Version:** 1.0  
**Maintained By:** Development Team

