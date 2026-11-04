-- Undo sql/renter_own_subscription.sql: put back each renter's old expiry date
-- and status from the backup table, then drop it. Only rows still on the free
-- 30 days ('renter_switch') are put back; a renter who has since bought their
-- own plan keeps it.

UPDATE `salonDetails` s
JOIN `renterSubscriptionBackup` b ON b.id = s.id
SET s.registrationExpiryDate = b.registrationExpiryDate,
    s.subscriptionLatestPaymentStatus = b.subscriptionLatestPaymentStatus
WHERE s.subscriptionLatestPaymentStatus = 'renter_switch';

DROP TABLE IF EXISTS `renterSubscriptionBackup`;
ALTER TABLE `salonDetails` DROP COLUMN IF EXISTS `renterPlanReminderDays`;
