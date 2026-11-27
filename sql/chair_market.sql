-- Chair market ("Open to Work" renters and shops' chair offers): schema.
-- Safe to skip: the backend creates these on start-up (helper/chairMarketSchema.js).
-- Run sql/renter_move.sql first. Run one statement at a time.

-- 0. PRE-CHECK: should return no tables.
SHOW TABLES LIKE 'renterWorkPrefs';
SHOW TABLES LIKE 'chairOffers';
SHOW TABLES LIKE 'chairOfferRounds';
SHOW TABLES LIKE 'shopChairListings';

-- 1. A renter's Open to Work settings (one row per renter salon).
CREATE TABLE IF NOT EXISTS `renterWorkPrefs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `renterSalonId` INT NOT NULL,
  `renterUserId` INT NOT NULL,
  `openToWork` TINYINT(1) NOT NULL DEFAULT 0,
  `availableFrom` DATE NULL,
  `days` VARCHAR(100) NULL,
  `radiusKm` INT NULL,
  `rentMin` DECIMAL(10,2) NULL,
  `rentMax` DECIMAL(10,2) NULL,
  `rentCycle` VARCHAR(16) NULL,
  `note` VARCHAR(500) NULL,
  `skills` VARCHAR(255) NULL,
  `hiddenShopIds` TEXT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `renterSalonId` (`renterSalonId`),
  KEY `renter_work_prefs_open_to_work` (`openToWork`)
) ENGINE=InnoDB;

-- 2. A shop's chair offer to a renter (latest terms).
CREATE TABLE IF NOT EXISTS `chairOffers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `renterUserId` INT NOT NULL,
  `renterSalonId` INT NOT NULL,
  `shopSalonId` INT NOT NULL,
  `createdBy` INT NULL,
  `status` VARCHAR(16) NOT NULL DEFAULT 'open',
  `lastBy` VARCHAR(8) NOT NULL DEFAULT 'shop',
  `rounds` INT NOT NULL DEFAULT 1,
  `rentAmount` DECIMAL(10,2) NULL,
  `rentCycle` VARCHAR(16) NULL,
  `startDate` DATE NOT NULL,
  `trialDate` DATE NULL,
  `shopTerms` TEXT NULL,
  `renterTerms` TEXT NULL,
  `expiresAt` DATETIME NULL,
  `moveId` INT NULL,
  `closedAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `chair_offers_renter_user_id_status` (`renterUserId`, `status`),
  KEY `chair_offers_shop_salon_id_status` (`shopSalonId`, `status`),
  KEY `chair_offers_status_expires_at` (`status`, `expiresAt`)
) ENGINE=InnoDB;

-- 3. Each round of an offer (the first offer and every counter offer).
CREATE TABLE IF NOT EXISTS `chairOfferRounds` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `offerId` INT NOT NULL,
  `by` VARCHAR(8) NOT NULL,
  `rentAmount` DECIMAL(10,2) NULL,
  `rentCycle` VARCHAR(16) NULL,
  `startDate` DATE NOT NULL,
  `trialDate` DATE NULL,
  `terms` TEXT NULL,
  `message` VARCHAR(500) NULL,
  `createdAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `chair_offer_rounds_offer_id` (`offerId`)
) ENGINE=InnoDB;

-- 4. A shop's "Hiring chair renters" listing (one row per shop).
CREATE TABLE IF NOT EXISTS `shopChairListings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `shopSalonId` INT NOT NULL,
  `isHiring` TINYINT(1) NOT NULL DEFAULT 0,
  `chairs` INT NOT NULL DEFAULT 1,
  `rentAmount` DECIMAL(10,2) NULL,
  `rentCycle` VARCHAR(16) NULL,
  `availableFrom` DATE NULL,
  `skills` VARCHAR(255) NULL,
  `terms` TEXT NULL,
  `note` VARCHAR(500) NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `shopSalonId` (`shopSalonId`),
  KEY `shop_chair_listings_is_hiring` (`isHiring`)
) ENGINE=InnoDB;

-- 5. CHECK: should show all four tables.
SHOW TABLES LIKE 'shopChairListings';
SHOW TABLES LIKE 'renterWorkPrefs';
SHOW TABLES LIKE 'chairOffers';
SHOW TABLES LIKE 'chairOfferRounds';
