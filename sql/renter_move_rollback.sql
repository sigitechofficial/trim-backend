-- Rollback for sql/renter_move.sql. Run only if the move-shop feature is removed.
-- Remove helper/renterMoveSchema.js from trim.js first, or it adds these back on boot.
DROP TABLE IF EXISTS `renterMoves`;
ALTER TABLE `salonDetails` DROP COLUMN `renterGraceUntil`;
ALTER TABLE `employees` DROP COLUMN `leftAt`;
ALTER TABLE `bookings` DROP COLUMN `visitAddressId`;
