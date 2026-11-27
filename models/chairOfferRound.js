// One step of a chair offer negotiation: the shop's offer or either side's counter.
module.exports = (sequelize, DataTypes) => {
  const chairOfferRound = sequelize.define(
    'chairOfferRound',
    {
      offerId: { type: DataTypes.INTEGER, allowNull: false },
      by: { type: DataTypes.STRING(8), allowNull: false }, // 'shop' | 'renter'
      rentAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      rentCycle: { type: DataTypes.STRING(16), allowNull: true },
      // Staff jobs: 'salary' or 'commission'.
      payType: { type: DataTypes.STRING(16), allowNull: true },
      startDate: { type: DataTypes.DATEONLY, allowNull: false },
      trialDate: { type: DataTypes.DATEONLY, allowNull: true },
      terms: { type: DataTypes.TEXT, allowNull: true },
      message: { type: DataTypes.STRING(500), allowNull: true },
    },
    { updatedAt: false, indexes: [{ fields: ['offerId'] }] },
  )
  return chairOfferRound
}
