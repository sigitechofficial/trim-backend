# RevenueCat Full Flow Guide (Trim Backend)

This guide explains the complete RevenueCat webhook flow implemented in this backend, from RevenueCat delivery to database updates.

## 1) Entry Point and High-Level Architecture

- **Webhook route**: `POST /webhooks/revenuecat`
- **Route file**: `routes/salonRoutes/salonRoute.js`
- **Controller**: `controllers/revenueCatControllers/revenueCatWebhookController.js`
- **Main handler**: `revenueCatWebhookHandler`

Flow:
1. RevenueCat sends webhook to `POST /webhooks/revenuecat`.
2. Backend verifies `Authorization` header against `REVENUECAT_WEBHOOK_SECRET`.
3. Backend returns `200` immediately (`{ received: true }`) to avoid webhook timeout.
4. Event processing runs asynchronously via `setImmediate(...)`.
5. Event-specific handler updates `salonDetail` + `subscriptions` records.

## 2) Required Environment Variables

Add these variables in your environment:

- `REVENUECAT_WEBHOOK_SECRET`  
  Used to verify incoming webhook requests.
- `REVENUECAT_SECRET_API_KEY`  
  Optional but strongly recommended. Used as fallback to fetch product price from RevenueCat API when webhook event has missing/zero price.

## 3) Webhook Authorization

Authorization logic accepts either:
- `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`
- `Authorization: <REVENUECAT_WEBHOOK_SECRET>`

If missing/invalid, request is rejected internally, but still returns HTTP `200` with:
- `{ received: false, error: "..." }`

## 4) Supported RevenueCat Event Types

The handler currently processes:

- `INITIAL_PURCHASE`
- `RENEWAL`
- `CANCELLATION`
- `EXPIRATION`
- `BILLING_ISSUE`
- `PRODUCT_CHANGE`
- `SUBSCRIPTION_PAUSED`
- `UNCANCELLATION`
- `TRANSFER`

Unknown event types are logged and ignored safely.

## 5) How a Salon Is Resolved (Critical)

To map webhook events to a salon, the controller uses this priority order:

1. `event.subscriber_attributes.salonDetailId.value`
2. `event.app_user_id` (if numeric and not anonymous)
3. Existing `subscriptions` row by `revenueCatUserId`
4. `event.aliases[]` (numeric aliases)
5. `event.original_app_user_id` (numeric)
6. Existing `subscriptions` row by `revenueCatOriginalTransactionId`

If no salon is found, the event is logged and skipped.

## 6) Product and Team Mapping

### Product ID -> Display Name

- `trimbiz_monthly_owner` -> `Owner Only`
- `trimbiz_owner_one_staff` -> `Owner + 1 staff member`
- `trimbiz_owner_two_staff` -> `Owner + 2 staff members`
- `trimbiz_owner_three_staff` -> `Owner + 3 staff members`
- `trimbiz_owner_four_staff` -> `Owner + 4 staff members`
- `trimbiz_owner_five_staff` -> `Owner + 5 staff members`

### Product ID -> `teamSize`

- `trimbiz_monthly_owner` -> `1`
- `trimbiz_owner_one_staff` -> `2`
- `trimbiz_owner_two_staff` -> `3`
- `trimbiz_owner_three_staff` -> `4`
- `trimbiz_owner_four_staff` -> `5`
- `trimbiz_owner_five_staff` -> `6`
- `trimbiz_owner_unlimited_staff` -> `999` (unlimited sentinel)
- Unknown product -> `1`

## 7) Shared Data Handling Rules

### Period Dates
- `periodStart` = `new Date(purchased_at_ms)`
- `periodEnd` derived by `period_type`:
  - monthly/normal -> +1 month
  - annual/yearly -> +1 year
  - weekly -> +7 days
  - trial -> +30 days
  - default -> +1 month

### Price Handling
- Primary source: `price_in_purchased_currency`
- Fallback: `price`
- For `PRODUCT_CHANGE`, if both missing/0:
  1. Fetch from RevenueCat REST API (`/v1/subscribers/{app_user_id}`)
  2. Fallback to latest DB subscription with same new product and non-zero amount
  3. Fallback to existing subscription amount
  4. Otherwise keep `0` and wait for `RENEWAL`

### VAT Handling
- First from `subscriber_attributes.VAT.value`
- Else from `event.vat_amount` (converted from cents)
- Else `0`

### Store -> Payment Method Metadata
- `APP_STORE` -> `apple_pay`
- `PLAY_STORE` -> `google_pay`
- Other -> `revenuecat`

## 8) Event-by-Event Behavior

### A) `INITIAL_PURCHASE`

Updates:
- `salonDetail`:
  - `approvedByAdmin = true`
  - `subscriptionPlan = product_id`
  - `registrationDate`, `registrationExpiryDate`
  - `subscriptionLatestPaymentStatus = trial | payment_succeeded`
  - `teamSize`, `subscriptionPrice`
  - `hasObtainedFreeTrial = 1`
  - `metadata` refreshed
- `subscriptions` (source = `revenuecat`):
  - upsert-like behavior (find latest by `salonDetailId + subscriptionSource`)
  - preserves existing amount when incoming amount is `0`
  - stores RevenueCat fields:
    - `revenueCatUserId`
    - `revenueCatOriginalTransactionId`
    - `revenueCatStore`

### B) `RENEWAL`

Updates:
- `salonDetail.subscriptionLatestPaymentStatus = payment_succeeded`
- Refreshes plan period fields, metadata, team size, price
- Updates latest revenuecat subscription record (or creates one)
- Price backfill/preserve rules:
  - if existing is `0` and renewal has valid amount -> backfill
  - if renewal is `0` and existing has valid amount -> preserve existing

### C) `CANCELLATION`

Status-only update:
- `salonDetail.subscriptionLatestPaymentStatus = cancelled`
- latest revenuecat `subscriptions.status = cancelled`

No team size changes, no employee blocking in this event.

### D) `EXPIRATION`

Status-only update:
- `salonDetail.subscriptionLatestPaymentStatus = expired`
- latest revenuecat `subscriptions.status = expired`

No team size changes, no employee blocking in this event.

### E) `BILLING_ISSUE`

Status update:
- `salonDetail.subscriptionLatestPaymentStatus = payment_failed`
- latest revenuecat `subscriptions.status = payment_failed`

### F) `PRODUCT_CHANGE` (Upgrade/Downgrade)

Key rule:
- Use `new_product_id` as active plan (`product_id` is old plan).

Updates:
- `salonDetail.subscriptionPlan` changed to new product
- period fields, status, team size, price, metadata updated
- latest revenuecat subscription updated/created with new product values

Downgrade handling:
- If new team limit is lower, the system blocks excess employees.
- Includes both regular and external employees.
- Most recently added active employees are blocked first.
- Both employee status and linked user status are updated.

### G) `SUBSCRIPTION_PAUSED`

Updates:
- `salonDetail.subscriptionLatestPaymentStatus = paused`

### H) `UNCANCELLATION`

Reactivation behavior:
- sets status to `payment_succeeded`
- refreshes plan period/price/team size/metadata
- updates or creates latest revenuecat subscription record

### I) `TRANSFER`

Used when purchases are restored/transferred between app users.

Behavior:
1. Resolve source (`transferred_from[]`) and destination (`transferred_to[]`) salons.
2. If destination salon exists and differs from source:
   - move revenuecat subscriptions to destination salon
   - update `customerId` and `revenueCatUserId`
   - copy active plan fields from source salon to destination salon
3. If destination is anonymous/no salon:
   - only update `revenueCatUserId` on existing source subscriptions
4. If source cannot be resolved:
   - try direct subscription user-id update fallback

## 9) Database Fields Touched

### `subscriptions` model
Main fields used:
- `subscriptionSource` (`revenuecat`)
- `subscriptionId`, `priceId`, `name`
- `status`, `periodStart`, `periodEnd`
- `amountPaid`, `currency`, `VAT`
- `revenueCatUserId`, `revenueCatOriginalTransactionId`, `revenueCatStore`

### `salonDetail` model
Main fields used:
- `subscriptionPlan`
- `registrationDate`, `registrationExpiryDate`
- `subscriptionLatestPaymentStatus`
- `teamSize`, `subscriptionPrice`
- `approvedByAdmin`, `hasObtainedFreeTrial`
- `metadata` (subscriptionName, membersCount, paymentMethodId, freeTrialDays, etc.)

## 10) Operational Notes / Gotchas

- The endpoint **always responds quickly with HTTP 200**, even when async processing later fails.  
  Monitor logs carefully for async errors.
- Subscription lookup/update intentionally uses:
  - `salonDetailId + subscriptionSource = revenuecat`
  - latest record by `createdAt DESC`
  This avoids duplicates during product changes.
- RevenueCat can send anonymous IDs. The code includes alias/original transaction fallbacks.
- Price may be missing in some `PRODUCT_CHANGE` events; API + DB fallback logic handles this.

## 11) RevenueCat Dashboard Setup Checklist

1. Create webhook URL:
   - `https://<your-domain>/webhooks/revenuecat`
2. Set authorization token in RevenueCat webhook settings:
   - Same value as backend `REVENUECAT_WEBHOOK_SECRET`
3. Ensure app sends `subscriber_attributes.salonDetailId` during purchase flow.
4. (Recommended) Set backend `REVENUECAT_SECRET_API_KEY` for price fallback.

## 12) Quick Test Checklist

Test each event in RevenueCat sandbox and verify:

- `INITIAL_PURCHASE`
  - salon approved
  - plan/team/price fields set
- `RENEWAL`
  - period extended
  - status `payment_succeeded`
- `CANCELLATION` / `EXPIRATION`
  - status only updates
- `BILLING_ISSUE`
  - status `payment_failed`
- `PRODUCT_CHANGE`
  - new product/team applied
  - downgrade blocks excess staff
- `UNCANCELLATION`
  - status/reactivation fields restored
- `TRANSFER`
  - subscription ownership moved or user IDs re-linked

---

If you want, we can also add:
- a sequence diagram image,
- a JSON sample payload per event,
- and a dedicated troubleshooting section with common log patterns.
