module.exports = (sequelize, DataTypes) => {
  const reason = sequelize.define(
    'reason',
    {
      reason: {
        type: DataTypes.STRING(),
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM(
          'subscription',
          'appointment_customer_cancellation',
          'appointment_salon_owner_cancellation',
          'appointment_employee_cancellation',
          'account_deletion_customer',
          'account_deletion_salon',
        ),
        allowNull: false,
        defaultValue: 'appointment_customer_cancellation',
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


    reason.hasMany(models.deletedCustomer)
    models.deletedCustomer.belongsTo(reason)
  }

  return reason
}
