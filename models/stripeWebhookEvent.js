module.exports = (sequelize, DataTypes) => {
  const stripeWebhookEvent = sequelize.define(
    'stripeWebhookEvent',
    {
      eventId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      eventType: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      accountId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      processedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'stripeWebhookEvents',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['eventId'],
          name: 'stripe_webhook_events_event_id_unique',
        },
        {
          fields: ['accountId'],
          name: 'stripe_webhook_events_account_id_index',
        },
      ],
    },
  )

  return stripeWebhookEvent
}
