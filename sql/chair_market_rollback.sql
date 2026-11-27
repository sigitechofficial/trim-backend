-- Rollback for sql/chair_market.sql. Remove helper/chairMarketSchema.js from trim.js first.
DROP TABLE IF EXISTS `shopChairListings`;
DROP TABLE IF EXISTS `chairOfferRounds`;
DROP TABLE IF EXISTS `chairOffers`;
DROP TABLE IF EXISTS `renterWorkPrefs`;
