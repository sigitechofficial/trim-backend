-- Manual booking approval — schema changes (run on stage first, then production).
-- Safe to skip: the backend applies the same changes on start-up
-- (helper/bookingApprovalSchema.js) and skips anything that already exists.

-- 0. PRE-CHECK: copy the CURRENT list of status values from this result.
SHOW COLUMNS FROM `bookings` LIKE 'status';
SHOW COLUMNS FROM `salonDetails` LIKE 'autoAcceptBookings';
SHOW COLUMNS FROM `bookings` LIKE 'requestExpiresAt';

-- 1. Shop settings (existing shops keep accepting automatically).
ALTER TABLE `salonDetails`
  ADD COLUMN `autoAcceptBookings` TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN `approvalScope` VARCHAR(16) NOT NULL DEFAULT 'all';

-- 2. Request fields on bookings.
ALTER TABLE `bookings`
  ADD COLUMN `requestExpiresAt` DATETIME NULL,
  ADD COLUMN `respondedAt` DATETIME NULL,
  ADD COLUMN `requestOutcome` VARCHAR(16) NULL,
  ADD COLUMN `requestReminderSent` TINYINT(1) NOT NULL DEFAULT 0;

-- 3. Add 'requested' to bookings.status.
--    IMPORTANT: keep EVERY value shown by the pre-check, in the same order,
--    and only append 'requested'. The list below is the code's list; if your
--    pre-check shows anything different, use the pre-check list instead.
ALTER TABLE `bookings`
  MODIFY COLUMN `status`
  ENUM('pending','book','complete','cancel','no-show','save-unpaid','requested')
  NOT NULL DEFAULT 'book';

-- 4. Optional: speeds up the 15-minute expiry job.
CREATE INDEX `idx_bookings_status_request_expires` ON `bookings` (`status`, `requestExpiresAt`);

-- 5. VERIFY
SHOW COLUMNS FROM `bookings` LIKE 'status';
SELECT COUNT(*) AS shops, SUM(autoAcceptBookings = 1) AS auto_accept FROM `salonDetails`;
