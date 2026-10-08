-- Accept with a new time (shop proposes, client confirms). Run on stage, then production.
-- Safe to skip: the backend adds the same columns on start-up (helper/bookingApprovalSchema.js).

-- 0. PRE-CHECK: should return 0 rows (none of the columns exist yet).
SHOW COLUMNS FROM `bookings` WHERE Field IN
  ('previousOn','previousStartTime','previousEndTime','proposalComment','proposedAt');

-- 1. New columns (additive only; existing bookings untouched).
ALTER TABLE `bookings`
  ADD COLUMN `previousOn` DATE NULL,
  ADD COLUMN `previousStartTime` TIME NULL,
  ADD COLUMN `previousEndTime` TIME NULL,
  ADD COLUMN `proposalComment` VARCHAR(500) NULL,
  ADD COLUMN `proposedAt` DATETIME NULL;

-- 2. VERIFY: should return 5 rows.
SHOW COLUMNS FROM `bookings` WHERE Field IN
  ('previousOn','previousStartTime','previousEndTime','proposalComment','proposedAt');
