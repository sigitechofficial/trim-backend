// subscriptionPlan.js
module.exports = (sequelize, DataTypes) => {
  const cancelledSubscriptions = sequelize.define('cancelledSubscriptions', {
    subscriptionId: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    teamSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    reason: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
  })

  cancelledSubscriptions.associate = (models) => {}

  return cancelledSubscriptions
}
