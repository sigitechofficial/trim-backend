-- Loyalty discount — rollback. Deploy the previous backend FIRST (the new
-- code reads these columns), then run one statement at a time.
-- This deletes every shop's loyalty settings and every client's visits.

ALTER TABLE `jobs` DROP COLUMN `loyaltyDiscount`;

ALTER TABLE `bookings`
  DROP COLUMN `loyaltyDiscount`,
  DROP COLUMN `loyaltyPercentage`,
  DROP COLUMN `loyaltyCardId`;

DROP TABLE IF EXISTS `loyaltyEvents`;
DROP TABLE IF EXISTS `loyaltyCards`;
DROP TABLE IF EXISTS `loyaltyExcludedServices`;
DROP TABLE IF EXISTS `loyaltyPrograms`;
