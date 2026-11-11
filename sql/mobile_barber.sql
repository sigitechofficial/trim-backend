-- Mobile barbers: schema changes (run on stage first, then production).
-- Safe to skip: the backend makes the same changes on start-up
-- (helper/mobileBarberSchema.js) and skips anything that already exists.
-- Run one statement at a time.

-- 0. PRE-CHECK: all should return no rows / no table.
SHOW TABLES LIKE 'mobileSettings';
SHOW COLUMNS FROM `salonDetails` LIKE 'workMode';
SHOW COLUMNS FROM `bookings` LIKE 'isMobileVisit';

-- 1. One row per barber (employee row) with their "Mobile visits" settings.
CREATE TABLE IF NOT EXISTS `mobileSettings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `employeeId` INT NOT NULL,
  `salonDetailId` INT NOT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `allowedByOwner` TINYINT(1) NOT NULL DEFAULT 0,
  `radiusMiles` DECIMAL(5,1) NOT NULL DEFAULT 5.0,
  `feeType` VARCHAR(16) NOT NULL DEFAULT 'fixed',
  `fixedFee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `perMileFee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `minFee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `bufferMinutes` INT NOT NULL DEFAULT 30,
  `serviceIds` TEXT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employeeId` (`employeeId`),
  KEY `mobile_settings_salon_detail_id` (`salonDetailId`),
  KEY `mobile_settings_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. How a business works: 'shop', 'mobile' (no shop) or 'both'.
ALTER TABLE `salonDetails` ADD COLUMN `workMode` VARCHAR(16) NOT NULL DEFAULT 'shop';

-- 3. Home visits on bookings (the client's address is bookings.visitAddressId).
ALTER TABLE `bookings` ADD COLUMN `isMobileVisit` TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE `bookings` ADD COLUMN `travelFee` DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE `bookings` ADD COLUMN `travelMiles` DECIMAL(6,1) NULL;

-- 3b. Home visit day: On my way (with ETA) / Arrived, and one-off notices.
ALTER TABLE `bookings` ADD COLUMN `onTheWayAt` DATETIME NULL;
ALTER TABLE `bookings` ADD COLUMN `etaMinutes` INT NULL;
ALTER TABLE `bookings` ADD COLUMN `arrivedAt` DATETIME NULL;
ALTER TABLE `bookings` ADD COLUMN `barberRemindedAt` DATETIME NULL;
ALTER TABLE `bookings` ADD COLUMN `lateNoticeAt` DATETIME NULL;

-- 4. POST-CHECK
SHOW COLUMNS FROM `salonDetails` LIKE 'workMode';
SHOW COLUMNS FROM `bookings` LIKE 'travel%';
