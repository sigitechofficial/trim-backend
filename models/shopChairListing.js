// A shop's "Hiring chair renters" listing in the chair market: the chair it
// offers and the skills it wants. Turning it on also turns on the shop's
// rent-a-chair advert (salonDetails.rentChairAdvertisement*), which the client
// app shows. One row per shop.
module.exports = (sequelize, DataTypes) => {
  const shopChairListing = sequelize.define(
    'shopChairListing',
    {
      shopSalonId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      isHiring: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      chairs: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      // The shop covers the renter's Trim plan (each covered renter uses a team seat).
      coversPlan: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      days: { type: DataTypes.STRING(80), allowNull: true },
      rentAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      rentCycle: { type: DataTypes.STRING(16), allowNull: true },
      availableFrom: { type: DataTypes.DATEONLY, allowNull: true },
      // Comma-separated skills from helper/chairMarket.js SKILLS. Null = any.
      skills: { type: DataTypes.STRING(255), allowNull: true },
      terms: { type: DataTypes.TEXT, allowNull: true },
      note: { type: DataTypes.STRING(500), allowNull: true },
    },
    { indexes: [{ fields: ['isHiring'] }] },
  )
  return shopChairListing
}
