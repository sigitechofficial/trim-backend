-- Rollback for sql/mobile_barber.sql. Deletes all mobile settings and the
-- home-visit flags on bookings; client visit addresses stay in addressDBS.
ALTER TABLE `bookings` DROP COLUMN `lateNoticeAt`;
ALTER TABLE `bookings` DROP COLUMN `barberRemindedAt`;
ALTER TABLE `bookings` DROP COLUMN `arrivedAt`;
ALTER TABLE `bookings` DROP COLUMN `etaMinutes`;
ALTER TABLE `bookings` DROP COLUMN `onTheWayAt`;
ALTER TABLE `bookings` DROP COLUMN `travelMiles`;
ALTER TABLE `bookings` DROP COLUMN `travelFee`;
ALTER TABLE `bookings` DROP COLUMN `isMobileVisit`;
ALTER TABLE `salonDetails` DROP COLUMN `workMode`;
DROP TABLE IF EXISTS `mobileSettings`;
