// Audit trail for loyalty cards. (bookingId, type) is unique, so one booking
// can never add two visits or redeem twice.
module.exports = (sequelize, DataTypes) => {
  const loyaltyEvent = sequelize.define(
    'loyaltyEvent',
    {
      loyaltyCardId: { type: DataTypes.INTEGER, allowNull: false },
      bookingId: { type: DataTypes.INTEGER, allowNull: true },
      // visit | earned | reserved | redeemed | forfeited | expired
      type: { type: DataTypes.STRING(16), allowNull: false },
      visitCount: { type: DataTypes.INTEGER, allowNull: true },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    },
    {
      updatedAt: false,
      indexes: [
        { unique: true, fields: ['bookingId', 'type'] },
        { fields: ['loyaltyCardId'] },
      ],
    },
  )

  loyaltyEvent.associate = (models) => {
    loyaltyEvent.belongsTo(models.loyaltyCard, { constraints: false })
  }

  return loyaltyEvent
}
