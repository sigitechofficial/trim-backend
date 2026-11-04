// A shop's chair offer to a renter in the chair market. The latest terms are
// copied here from the newest chairOfferRound; accepting creates a renterMove.
module.exports = (sequelize, DataTypes) => {
  const chairOffer = sequelize.define(
    'chairOffer',
    {
      renterUserId: { type: DataTypes.INTEGER, allowNull: false },
      renterSalonId: { type: DataTypes.INTEGER, allowNull: false },
      shopSalonId: { type: DataTypes.INTEGER, allowNull: false },
      createdBy: { type: DataTypes.INTEGER, allowNull: true },
      // open | accepted | declined | withdrawn | expired | closed (renter took another offer)
      // | cancelled (the move it set up was cancelled)
      status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'open' },
      // Who sent the latest round: 'shop' | 'renter'. The other side answers.
      lastBy: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'shop' },
      rounds: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      rentAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      rentCycle: { type: DataTypes.STRING(16), allowNull: true },
      startDate: { type: DataTypes.DATEONLY, allowNull: false },
      trialDate: { type: DataTypes.DATEONLY, allowNull: true },
      shopTerms: { type: DataTypes.TEXT, allowNull: true },
      renterTerms: { type: DataTypes.TEXT, allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: true },
      moveId: { type: DataTypes.INTEGER, allowNull: true },
      closedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      indexes: [
        { fields: ['renterUserId', 'status'] },
        { fields: ['shopSalonId', 'status'] },
        { fields: ['status', 'expiresAt'] },
      ],
    },
  )

  chairOffer.associate = (models) => {
    chairOffer.belongsTo(models.salonDetail, { as: 'shop', foreignKey: 'shopSalonId', constraints: false })
    chairOffer.belongsTo(models.salonDetail, { as: 'renterSalon', foreignKey: 'renterSalonId', constraints: false })
    chairOffer.belongsTo(models.user, { as: 'renter', foreignKey: 'renterUserId', constraints: false })
    chairOffer.hasMany(models.chairOfferRound, { as: 'history', foreignKey: 'offerId', constraints: false })
  }
  return chairOffer
}
