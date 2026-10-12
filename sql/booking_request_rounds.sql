-- Booking requests: two suggestion rounds, client's decline note, who answered.
-- Safe to skip: the backend adds these on start-up (helper/bookingApprovalSchema.js).

-- 1. PRE-CHECK: 0 rows = not added yet; 4 rows = already there (skip step 2).
SHOW COLUMNS FROM `bookings`
WHERE Field IN ('proposalCount','clientDeclineNote','clientDeclinedAt','respondedByName');

-- 2. Add the columns (additive only; existing bookings untouched).
ALTER TABLE `bookings`
  ADD COLUMN `proposalCount` INT NOT NULL DEFAULT 0,
  ADD COLUMN `clientDeclineNote` VARCHAR(500) NULL,
  ADD COLUMN `clientDeclinedAt` DATETIME NULL,
  ADD COLUMN `respondedByName` VARCHAR(255) NULL;

-- 3. Requests already waiting on a suggested time count as one suggestion.
UPDATE `bookings` SET `proposalCount` = 1
WHERE `status` = 'requested' AND `requestOutcome` = 'proposed' AND `proposalCount` = 0;

-- 4. VERIFY: 4 rows.
SHOW COLUMNS FROM `bookings`
WHERE Field IN ('proposalCount','clientDeclineNote','clientDeclinedAt','respondedByName');
