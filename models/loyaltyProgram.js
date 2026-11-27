// A shop's visit-based loyalty offer: after `visitsRequired` completed visits
// the client gets `discountPercentage` off their next booking. One row per
// shop; chair renters have their own shop row, so they run their own offer.
module.exports = (sequelize, DataTypes) => {
  const loyaltyProgram = sequelize.define(
    'loyaltyProgram',
    {
      salonDetailId: { type: DataTypes.INTEGER, allowNull: false },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      visitsRequired: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
      discountPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 10 },
      // Shop's choice: may a coupon code be used on the same booking.
      combineWithCoupon: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      // Optional: a booking below this value does not count as a visit.
      minBookingValue: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // Optional: an earned reward lapses after this many days (null = never).
      rewardExpiryDays: { type: DataTypes.INTEGER, allowNull: true },
      // First time the offer was switched on; visits count from this day.
      startedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      indexes: [{ unique: true, fields: ['salonDetailId'] }],
    },
  )

  loyaltyProgram.associate = (models) => {
    models.salonDetail.hasOne(loyaltyProgram, { constraints: false })
    loyaltyProgram.belongsTo(models.salonDetail, { constraints: false })
  }

  return loyaltyProgram
}
