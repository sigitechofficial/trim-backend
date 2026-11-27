-- Chair renter "move shop" — schema changes (run on stage first, then production).
-- Safe to skip: the backend makes the same changes on start-up
-- (helper/renterMoveSchema.js) and skips anything that already exists.
-- Run one statement at a time.

-- 0. PRE-CHECK: all three should return no rows / no table.
SHOW TABLES LIKE 'renterMoves';
SHOW COLUMNS FROM `salonDetails` LIKE 'renterGraceUntil';
SHOW COLUMNS FROM `employees` LIKE 'leftAt';
SHOW COLUMNS FROM `bookings` LIKE 'visitAddressId';

-- 1. One row per move (or "leave shop").
CREATE TABLE IF NOT EXISTS `renterMoves` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `renterUserId` INT NOT NULL,
  `renterSalonId` INT NOT NULL,
  `fromSalonId` INT NULL,
  `toSalonId` INT NULL,
  `fromEmployeeId` INT NULL,
  `toEmployeeId` INT NULL,
  `moveDate` DATE NOT NULL,
  `status` VARCHAR(16) NOT NULL DEFAULT 'invited',
  `rentAmount` DECIMAL(15,2) NULL,
  `rentCycle` VARCHAR(16) NULL,
  `rentSettledAt` DATETIME NULL,
  `createdBy` INT NULL,
  `completedAt` DATETIME NULL,
  `failReason` VARCHAR(255) NULL,
  `graceReminderAt` DATETIME NULL,
  `graceEndedAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `renter_moves_renter_user_id` (`renterUserId`),
  KEY `renter_moves_status_move_date` (`status`, `moveDate`),
  KEY `renter_moves_to_salon_id` (`toSalonId`),
  KEY `renter_moves_from_salon_id` (`fromSalonId`)
) ENGINE=InnoDB;

-- 2. Renter between shops stays listed until this date.
ALTER TABLE `salonDetails` ADD COLUMN `renterGraceUntil` DATE NULL;

-- 3. When a renter left a host shop (the old team row is also marked deleted).
ALTER TABLE `employees` ADD COLUMN `leftAt` DATETIME NULL;

-- 4. Past bookings keep the address the client went to after their barber moves.
ALTER TABLE `bookings` ADD COLUMN `visitAddressId` INT NULL;

-- 5. CHECK: should show the new table and the new columns.
SHOW TABLES LIKE 'renterMoves';
SHOW COLUMNS FROM `salonDetails` LIKE 'renterGraceUntil';
SHOW COLUMNS FROM `employees` LIKE 'leftAt';
SHOW COLUMNS FROM `bookings` LIKE 'visitAddressId';
