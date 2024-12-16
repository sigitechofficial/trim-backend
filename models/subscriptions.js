// subscriptionPlan.js
module.exports = (sequelize, DataTypes) => {
  const subscriptions = sequelize.define('subscriptions', {
    subscriptionId: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    invoiceId: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    customerId: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    amountPaid: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    priceId: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    invoice: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    periodEnd: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    periodStart: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
  })

  subscriptions.associate = (models) => {}

  return subscriptions
}
