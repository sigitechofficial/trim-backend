-- Accept with a new time: remember the staff the client originally asked for.
-- Safe to skip: the backend adds it on start-up (helper/bookingApprovalSchema.js).

-- 1. PRE-CHECK: 0 rows = not added yet, 1 row = already there (skip step 2).
SHOW COLUMNS FROM `bookings` LIKE 'previousStaffName';

-- 2. Add the column.
ALTER TABLE `bookings` ADD COLUMN `previousStaffName` VARCHAR(255) NULL;

-- 3. VERIFY: 1 row, varchar(255).
SHOW COLUMNS FROM `bookings` LIKE 'previousStaffName';
