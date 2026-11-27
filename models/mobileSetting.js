// A barber's "Mobile visits" settings (helper/mobileBarber.js): one row per
// employee row (owner, staff or chair renter). A staff member can only go
// mobile once their shop owner allows it (allowedByOwner).
module.exports = (sequelize, DataTypes) => {
  const mobileSetting = sequelize.define(
    'mobileSetting',
    {
      employeeId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      salonDetailId: { type: DataTypes.INTEGER, allowNull: false },
      enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      allowedByOwner: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      radiusMiles: { type: DataTypes.DECIMAL(5, 1), allowNull: false, defaultValue: 5 },
      // 'fixed' = fixedFee per visit; 'per_mile' = perMileFee x miles, at least minFee.
      feeType: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'fixed' },
      fixedFee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      perMileFee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      minFee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      // Travel time kept free before and after each home visit.
      bufferMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
      // Comma-separated service ids offered at home. Null = all their services.
      serviceIds: { type: DataTypes.TEXT, allowNull: true },
    },
    { indexes: [{ fields: ['salonDetailId'] }, { fields: ['enabled'] }] },
  )
  return mobileSetting
}
