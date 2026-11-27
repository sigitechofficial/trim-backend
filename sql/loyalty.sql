-- Loyalty discount — schema changes (run on stage first, then production).
-- Safe to skip: the backend makes the same changes on start-up
-- (helper/loyaltySchema.js) and skips anything that already exists.
-- Run one statement at a time.

-- 0. PRE-CHECK: all four should return no rows / no table.
SHOW TABLES LIKE 'loyalty%';
SHOW COLUMNS FROM `bookings` LIKE 'loyalty%';
SHOW COLUMNS FROM `jobs` LIKE 'loyaltyDiscount';

-- 1. Shop offer (one row per shop; chair renters have their own shop row).
CREATE TABLE IF NOT EXISTS `loyaltyPrograms` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `salonDetailId` INT NOT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 0,
  `visitsRequired` INT NOT NULL DEFAULT 5,
  `discountPercentage` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  `combineWithCoupon` TINYINT(1) NOT NULL DEFAULT 0,
  `minBookingValue` DECIMAL(10,2) NULL,
  `rewardExpiryDays` INT NULL,
  `startedAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `loyalty_programs_salon_detail_id` (`salonDetailId`)
) ENGINE=InnoDB;

-- 2. Services that never get the discount.
CREATE TABLE IF NOT EXISTS `loyaltyExcludedServices` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `loyaltyProgramId` INT NOT NULL,
  `serviceId` INT NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `loyalty_excluded_services_loyalty_program_id_service_id` (`loyaltyProgramId`, `serviceId`)
) ENGINE=InnoDB;

-- 3. One visit card per client per shop.
CREATE TABLE IF NOT EXISTS `loyaltyCards` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `salonDetailId` INT NOT NULL,
  `customerId` INT NOT NULL,
  `visitCount` INT NOT NULL DEFAULT 0,
  `rewardEarnedAt` DATETIME NULL,
  `rewardExpiresAt` DATETIME NULL,
  `rewardPercentage` DECIMAL(5,2) NULL,
  `lastVisitAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `loyalty_cards_salon_detail_id_customer_id` (`salonDetailId`, `customerId`)
) ENGINE=InnoDB;

-- 4. Audit trail (a booking can add a visit or redeem only once).
CREATE TABLE IF NOT EXISTS `loyaltyEvents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `loyaltyCardId` INT NOT NULL,
  `bookingId` INT NULL,
  `type` VARCHAR(16) NOT NULL,
  `visitCount` INT NULL,
  `amount` DECIMAL(10,2) NULL,
  `createdAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `loyalty_events_booking_id_type` (`bookingId`, `type`),
  KEY `loyalty_events_loyalty_card_id` (`loyaltyCardId`)
) ENGINE=InnoDB;

-- 5. What a booking used (existing bookings get 0 / NULL).
ALTER TABLE `bookings`
  ADD COLUMN `loyaltyDiscount` DECIMAL(20,2) NOT NULL DEFAULT 0,
  ADD COLUMN `loyaltyPercentage` DECIMAL(5,2) NULL,
  ADD COLUMN `loyaltyCardId` INT NULL;

-- 6. Discount per service line.
ALTER TABLE `jobs`
  ADD COLUMN `loyaltyDiscount` DECIMAL(10,2) NOT NULL DEFAULT 0;

-- 7. VERIFY: 4 tables, 3 booking columns, 1 job column.
SHOW TABLES LIKE 'loyalty%';
SHOW COLUMNS FROM `bookings` LIKE 'loyalty%';
SHOW COLUMNS FROM `jobs` LIKE 'loyaltyDiscount';
