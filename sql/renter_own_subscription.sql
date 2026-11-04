-- Chair renters pay for their own plan (£6.99 "Chair Renter").
-- Until now a renter was covered by the host shop's subscription. On release,
-- every existing renter gets 30 free days on their own row, marked with the
-- status 'renter_switch', so they have time to buy their own plan in the app.
-- NOT NEEDED NORMALLY: the server does this itself, once, on start-up
-- (helper/renterPlanMigration.js, recorded in `appMigrations`) before it
-- takes any request. This file is the same steps by hand, for reference.
--
-- If run by hand: run it BEFORE deploying the new backend. The new backend
-- lists a renter only on their own plan, so without these free days every
-- renter would disappear from Home and search until the SQL ran. Running it
-- first is safe with the old backend still live.
-- Run on stage first, then production, one statement at a time.
-- Rollback: sql/renter_own_subscription_rollback.sql.

-- 0. PRE-CHECK: how many renters this touches, and what they have today.
SELECT COUNT(*) AS renters,
       SUM(registrationExpiryDate IS NULL) AS no_expiry,
       SUM(registrationExpiryDate >= CURDATE()) AS already_active_date
FROM `salonDetails`
WHERE isExternalEmployee = 1 AND deleted = 0;

-- 1. Which reminder a renter on the free days last got (the backend also adds
--    this on start-up, helper/renterMoveSchema.js).
ALTER TABLE `salonDetails` ADD COLUMN IF NOT EXISTS `renterPlanReminderDays` INT NULL;

-- 2. Keep the old values so the rollback can put them back.
CREATE TABLE IF NOT EXISTS `renterSubscriptionBackup` AS
SELECT id, registrationExpiryDate, subscriptionLatestPaymentStatus, NOW() AS backedUpAt
FROM `salonDetails`
WHERE isExternalEmployee = 1 AND deleted = 0;

-- 3. 30 free days on the renter's own row. A renter who already has their own
--    plan running (an expiry date from today on) keeps it as it is.
UPDATE `salonDetails`
SET registrationExpiryDate = DATE_ADD(CURDATE(), INTERVAL 30 DAY),
    subscriptionLatestPaymentStatus = 'renter_switch',
    renterPlanReminderDays = NULL
WHERE isExternalEmployee = 1
  AND deleted = 0
  AND (registrationExpiryDate IS NULL OR registrationExpiryDate < CURDATE());

-- 4. CHECK: renters still blocked by the OLD rule (a host's plan downgrade or
--    transfer used to block them). Review this list; to unblock one, run the
--    two UPDATEs below with their ids. Renters blocked on purpose stay blocked.
SELECT s.id AS renterSalonId, s.salonName, u.id AS userId, u.email, u.status AS loginActive, s.status AS pageActive
FROM `salonDetails` s
JOIN `users` u ON u.id = s.userId
WHERE s.isExternalEmployee = 1 AND s.deleted = 0 AND u.deleted = 0 AND (u.status = 0 OR s.status = 0);
-- UPDATE `users` SET status = 1 WHERE id IN (<userIds>);
-- UPDATE `salonDetails` SET status = 1 WHERE id IN (<renterSalonIds>);

-- 5. CHECK: every renter now has a plan date from today on.
SELECT id, salonName, registrationExpiryDate, subscriptionLatestPaymentStatus
FROM `salonDetails`
WHERE isExternalEmployee = 1 AND deleted = 0
ORDER BY registrationExpiryDate;
