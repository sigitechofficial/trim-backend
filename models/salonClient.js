/**
 * salonClient — links a salon (salonDetail) to a customer (user) WITHOUT requiring
 * a booking. The Client List (getSalonCustomer) was historically derived only from
 * bookings, so imported/added clients would not appear. This association table gives
 * a salon a direct membership list of its clients.
 *
 * Additive & reversible: dropping this table + reverting the getSalonCustomer merge
 * restores the previous bookings-only behavior.
 */
module.exports = (sequelize, DataTypes) => {
  const salonClient = sequelize.define(
    'salonClient',
    {
      // Where this client came from: 'import' (CSV/Fresha), 'manual', etc.
      source: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'import',
      },
    },
    {
      indexes: [
        // One membership row per (salon, customer) — makes re-imports idempotent.
        {
          unique: true,
          fields: ['salonDetailId', 'customerId'],
          name: 'salon_client_unique',
        },
      ],
    },
  )

  salonClient.associate = (models) => {
    salonClient.belongsTo(models.salonDetail) // → salonDetailId
    salonClient.belongsTo(models.user, {
      foreignKey: 'customerId',
      as: 'customer',
    })
  }

  return salonClient
}
