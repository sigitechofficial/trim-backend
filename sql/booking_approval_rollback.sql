-- Rollback for booking_approval.sql. Only run if no booking has status 'requested'
-- (step 1 must return 0), otherwise those bookings would lose their status.

-- 1. Must be 0 before continuing.
SELECT COUNT(*) AS open_requests FROM `bookings` WHERE `status` = 'requested';

-- 2. Remove 'requested' from the status list (same values as before, minus 'requested').
ALTER TABLE `bookings`
  MODIFY COLUMN `status`
  ENUM('pending','book','complete','cancel','no-show','save-unpaid')
  NOT NULL DEFAULT 'book';

-- 3. Drop the new index and columns.
DROP INDEX `idx_bookings_status_request_expires` ON `bookings`;
ALTER TABLE `bookings`
  DROP COLUMN `requestExpiresAt`,
  DROP COLUMN `respondedAt`,
  DROP COLUMN `requestOutcome`,
  DROP COLUMN `requestReminderSent`;
ALTER TABLE `salonDetails`
  DROP COLUMN `autoAcceptBookings`,
  DROP COLUMN `approvalScope`;
