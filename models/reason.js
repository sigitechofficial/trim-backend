module.exports = (sequelize, DataTypes) => {
  const reason = sequelize.define(
    'reason',
    {
      reason: {
        type: DataTypes.STRING(),
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('subscription', 'appointment'),
        allowNull: false,
        defaultValue: 'appointment',
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
    },
    {
      paranoid: true,
      timestamps: true,
    },
  )

  reason.associate = (models) => {
    reason.hasMany(models.cancelledBooking)
    models.cancelledBooking.belongsTo(reason)

    reason.hasMany(models.cancelledSubscriptions, { foreignKey: 'reasonId' })
    models.cancelledSubscriptions.belongsTo(reason, {
      foreignKey: 'reasonId',
      as: 'subscriptionReason',
    })
  }

  return reason
}
