// A business with more than one branch (Step A). One per owner; created when
// the owner adds a second branch. Single shops have no brand (brandId null).
// The brand's Trim plan is bought under RevenueCat app user id `brand_<id>`.
module.exports = (sequelize, DataTypes) => {
  const brand = sequelize.define(
    'brand',
    {
      name: { type: DataTypes.STRING(255), allowNull: false },
      logo: { type: DataTypes.STRING(512), allowNull: true },
      ownerUserId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      rcAppUserId: { type: DataTypes.STRING(64), allowNull: true, unique: true },
      planProductId: { type: DataTypes.STRING(128), allowNull: true }, // product in force now
      pendingProductId: { type: DataTypes.STRING(128), allowNull: true }, // downgrade at renewal
      planStatus: { type: DataTypes.STRING(32), allowNull: true },
      planExpiry: { type: DataTypes.DATE, allowNull: true },
      branchLimit: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      // What the store charged at the last purchase or renewal (shown on Subscription).
      planPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      planCurrency: { type: DataTypes.STRING(8), allowNull: true },
      status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {},
  )
  brand.associate = (models) => {
    brand.hasMany(models.salonDetail, { foreignKey: 'brandId' })
    brand.belongsTo(models.user, { foreignKey: 'ownerUserId', as: 'owner' })
  }
  return brand
}
