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
    VAT:{
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
    },
    // Apple-specific fields
    appleTransactionId: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    appleOriginalTransactionId: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    subscriptionSource: {
      type: DataTypes.ENUM('stripe', 'apple', 'revenuecat'),
      defaultValue: 'stripe',
      allowNull: true,
    },
    appleProductId: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    appleEnvironment: {
      type: DataTypes.ENUM('Sandbox', 'Production'),
      allowNull: true,
    },
    // RevenueCat-specific fields
    revenueCatUserId: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    revenueCatOriginalTransactionId: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    revenueCatStore: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    // The real renewal price (used when subscription is on free trial and amountPaid = 0)
    renewablePrice: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      defaultValue: null,
    },
  }, {
    paranoid: true,
    timestamps: true,
  })

  subscriptions.associate = (models) => {}

  return subscriptions
}
