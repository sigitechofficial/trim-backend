// One client's visit card at one shop. A reward is "earned" while
// rewardEarnedAt is set; it is held by a booking whose loyaltyCardId points
// here until that booking completes (redeemed) or is cancelled (free again).
module.exports = (sequelize, DataTypes) => {
  const loyaltyCard = sequelize.define(
    'loyaltyCard',
    {
      salonDetailId: { type: DataTypes.INTEGER, allowNull: false },
      customerId: { type: DataTypes.INTEGER, allowNull: false },
      // Completed visits since the last reward was used.
      visitCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      rewardEarnedAt: { type: DataTypes.DATE, allowNull: true },
      rewardExpiresAt: { type: DataTypes.DATE, allowNull: true },
      // The percentage promised when the reward was earned.
      rewardPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      lastVisitAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      indexes: [{ unique: true, fields: ['salonDetailId', 'customerId'] }],
    },
  )

  loyaltyCard.associate = (models) => {
    loyaltyCard.belongsTo(models.salonDetail, { constraints: false })
    loyaltyCard.belongsTo(models.user, { foreignKey: 'customerId', constraints: false })
  }

  return loyaltyCard
}
