# Rebooking Reminder — Setup & Operations

Smart "time to book again" push notification. Reminds each customer based on
their own booking cadence:

- **1 completed booking** → reminded after the *single-booking window* (default 21 days / 3 weeks).
- **2+ completed bookings** → reminded using the **average gap** between their bookings, clamped between *min* and *max* interval.
- Customers who already have an **upcoming booking** are skipped.
- Only **completed** bookings count. Platform-wide (all salons combined).

**Subscription-aware** — at send time we run the **same subscription check as "Book again"** on the customer's most-recent salon:
- Salon still **active** → **salon-oriented copy** (names the salon via `{salonName}`) + payload carries `salonId`, so tapping opens **that salon's detail page** (ready to rebook).
- Salon **expired / cancelled / paused / refunded / payment_failed** → **generic copy** + no `salonId`, tapping goes to **Home** (where "Rebook last" lists only still-bookable salons).

Both copies are admin-editable (see §5).

Triggered daily by **AWS EventBridge Scheduler** hitting a secret-protected endpoint.

---

## 1. What was added

**Backend (`trim-backend-main/`)**
- `models/rebookReminderConfig.js` — admin-editable settings (single row).
- `models/rebookReminder.js` — sent-log (dedupe + history).
- `services/rebookReminderService.js` — core logic (`run({ dryRun })`).
- `controllers/internalController/rebookReminderController.js` — secured endpoint handler.
- `routes/internalRoutes/internalRoute.js` — `POST /internal/run-rebook-reminders`.
- `trim.js` — mounts `/internal`.
- `controllers/adminController/adminController.js` + `routes/adminRoutes/adminRoute.js` — admin GET/PUT config.

> Tables are created automatically on deploy via the existing `sequelize.sync({ alter: true })`. No manual migration needed.

**Admin panel (`trim-admin-vite/`)**
- `src/pages/configurations/Configurations.jsx` — new "Rebooking Reminder" section (toggle, day windows, title/body).

**Customer app** — no change; FCM + in-app bell already handle incoming notifications.

---

## 2. Environment variable

Add to **stage** and **prod** env (GitHub secrets `ENV_FILE_CONTENT_STAGE` / `ENV_FILE_CONTENT_PROD`):

```
REBOOK_CRON_SECRET=<long-random-secret>
```

A secret has already been placed in local `.env` for testing. Use a **different** value in stage/prod.

---

## 3. Endpoint

```
POST https://backend.trimworldwide.com/internal/run-rebook-reminders
Header: x-cron-secret: <REBOOK_CRON_SECRET>
Query (optional): ?dryRun=true    # calculate + report, send nothing
```

Response is a summary, e.g.:
```json
{ "status": "1", "message": "Done", "data": {
  "enabled": true, "dryRun": false, "customersWithHistory": 240,
  "due": 12, "sent": 11, "sentWithSalon": 7, "sentGeneric": 4,
  "suppressedUpcoming": 34, "alreadyReminded": 88, "notYetDue": 106,
  "noDeviceToken": 1, "errors": 0
}}
```

### Test with curl
Dry run (safe — sends nothing):
```bash
curl -X POST "https://stage.trimworldwide.com/internal/run-rebook-reminders?dryRun=true" \
  -H "x-cron-secret: <REBOOK_CRON_SECRET>"
```
Real run:
```bash
curl -X POST "https://stage.trimworldwide.com/internal/run-rebook-reminders" \
  -H "x-cron-secret: <REBOOK_CRON_SECRET>"
```
Wrong/missing secret → `401 Unauthorized`.

---

## 4. AWS EventBridge Scheduler setup (one-time, in AWS console)

**a) Connection** (holds the secret header)
- EventBridge → API destinations → **Connections** → Create.
- Authorization type: **API key**.
- API key name: `x-cron-secret`  ·  Value: `<REBOOK_CRON_SECRET>`.

**b) API destination**
- EventBridge → API destinations → Create.
- Endpoint: `https://backend.trimworldwide.com/internal/run-rebook-reminders`
- Method: **POST**  ·  Connection: the one from (a).

**c) Schedule**
- EventBridge → **Scheduler** → Schedules → Create.
- Recurring, cron: `cron(0 10 * * ? *)`  (10:00 daily — adjust time).
- Timezone: e.g. `Europe/London`.
- Target: **EventBridge API destination** → select the destination from (b).
- (No body needed; the secret rides in the connection header.)
- Create/attach the IAM role AWS offers so Scheduler can invoke the destination.

That's it — the schedule now POSTs daily and the summary appears in the server logs.

---

## 5. Admin usage

Admin panel → **Configurations** → "Rebooking Reminder":
- **Enabled / Disabled** master toggle.
- **Single-booking window (days)** — default 21.
- **Min / Max interval (days)** — clamp for the average (default 3 / 180).
- **Salon-oriented title / body** — used when the last salon is active. Use `{salonName}` where the name should appear.
- **Generic title / body** — used when the last salon is expired/cancelled.

Disabling the toggle stops all reminders even if the schedule still fires.

---

## 6. Notes / behavior

- A customer is reminded **once per cycle**. After they book again (new completed
  booking), a fresh cycle starts and they can be reminded again later.
- No device token → not logged, so they'll be picked up once a token appears and they're still due.
- Dates are computed in UTC to avoid server-timezone drift.
