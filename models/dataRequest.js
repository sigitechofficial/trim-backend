// A client's request to a shop (and its brand) to delete their personal data
// (UK GDPR right to erasure). The owner completes it within 30 days; the row
// stays as the record of when it was asked and done.
module.exports = (sequelize, DataTypes) => {
  const dataRequest = sequelize.define(
    'dataRequest',
    {
      customerId: { type: DataTypes.INTEGER, allowNull: false },
      salonDetailId: { type: DataTypes.INTEGER, allowNull: false }, // the shop the client chose
      brandId: { type: DataTypes.INTEGER, allowNull: true }, // its brand: the request covers every branch
      ownerUserId: { type: DataTypes.INTEGER, allowNull: false },
      type: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'delete' },
      status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'pending' }, // pending | done | cancelled
      customerName: { type: DataTypes.STRING(120), allowNull: true }, // kept so the record reads after deletion
      dueAt: { type: DataTypes.DATE, allowNull: false },
      doneAt: { type: DataTypes.DATE, allowNull: true },
      doneByUserId: { type: DataTypes.INTEGER, allowNull: true },
      doneByName: { type: DataTypes.STRING(120), allowNull: true },
      result: { type: DataTypes.JSON, allowNull: true }, // what was deleted (counts)
    },
    {
      tableName: 'dataRequests',
      indexes: [
        { fields: ['ownerUserId', 'status'], name: 'dataRequests_owner_status' },
        { fields: ['customerId', 'status'], name: 'dataRequests_customer_status' },
      ],
    },
  )
  return dataRequest
}
