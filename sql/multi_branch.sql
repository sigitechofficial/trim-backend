-- Step A: branches and roles. helper/branchSchema.js makes the same changes on boot.
CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo VARCHAR(512) NULL,
  ownerUserId INT NOT NULL,
  rcAppUserId VARCHAR(64) NULL,
  planProductId VARCHAR(128) NULL,
  pendingProductId VARCHAR(128) NULL,
  planStatus VARCHAR(32) NULL,
  planExpiry DATETIME NULL,
  branchLimit INT NOT NULL DEFAULT 1,
  status TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  UNIQUE KEY uq_brand_owner (ownerUserId),
  UNIQUE KEY uq_brand_rc (rcAppUserId)
);
ALTER TABLE salonDetails
  ADD COLUMN brandId INT NULL,
  ADD COLUMN planSource VARCHAR(8) NOT NULL DEFAULT 'own',
  ADD COLUMN pausedReason VARCHAR(32) NULL,
  ADD COLUMN closedAt DATETIME NULL,
  ADD INDEX salonDetails_brandId (brandId);
ALTER TABLE employees
  ADD COLUMN role VARCHAR(16) NULL,
  ADD COLUMN bookable TINYINT(1) NOT NULL DEFAULT 1;
UPDATE employees SET role = CASE WHEN isOwner = 1 THEN 'owner' ELSE 'barber' END WHERE role IS NULL;
