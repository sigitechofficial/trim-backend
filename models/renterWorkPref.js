// A chair renter's "Open to Work" settings for the chair market
// (helper/chairMarket.js). One row per renter salon.
module.exports = (sequelize, DataTypes) => {
  const renterWorkPref = sequelize.define(
    'renterWorkPref',
    {
      renterSalonId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      renterUserId: { type: DataTypes.INTEGER, allowNull: false },
      openToWork: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      availableFrom: { type: DataTypes.DATEONLY, allowNull: true },
      // Comma-separated day names, e.g. "Monday,Tuesday". Null = any day.
      days: { type: DataTypes.STRING(100), allowNull: true },
      radiusKm: { type: DataTypes.INTEGER, allowNull: true },
      rentMin: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      rentMax: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      rentCycle: { type: DataTypes.STRING(16), allowNull: true },
      note: { type: DataTypes.STRING(500), allowNull: true },
      // Comma-separated skills from helper/chairMarket.js SKILLS.
      skills: { type: DataTypes.STRING(255), allowNull: true },
      // Comma-separated shop ids the renter marked "Not interested".
      hiddenShopIds: { type: DataTypes.TEXT, allowNull: true },
    },
    { indexes: [{ fields: ['openToWork'] }] },
  )
  return renterWorkPref
}
