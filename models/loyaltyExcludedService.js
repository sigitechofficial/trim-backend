// Services that never get the loyalty discount (they still count as a visit).
module.exports = (sequelize, DataTypes) => {
  const loyaltyExcludedService = sequelize.define(
    'loyaltyExcludedService',
    {
      loyaltyProgramId: { type: DataTypes.INTEGER, allowNull: false },
      serviceId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      indexes: [{ unique: true, fields: ['loyaltyProgramId', 'serviceId'] }],
    },
  )

  loyaltyExcludedService.associate = (models) => {
    models.loyaltyProgram.hasMany(loyaltyExcludedService, { constraints: false })
    loyaltyExcludedService.belongsTo(models.loyaltyProgram, { constraints: false })
    loyaltyExcludedService.belongsTo(models.service, { constraints: false })
  }

  return loyaltyExcludedService
}
