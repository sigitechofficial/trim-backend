// The activity log (Step C): who did what, where, when and with what result.
// Insert-only: nothing in the code updates or deletes these rows, and no route
// offers it. actorName/actorRole are kept as they were at the time, so the
// record still reads right after someone is renamed or removed.
module.exports = (sequelize, DataTypes) => {
  const activityLog = sequelize.define(
    'activityLog',
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      brandId: { type: DataTypes.INTEGER, allowNull: true },
      salonDetailId: { type: DataTypes.INTEGER, allowNull: true },
      actorUserId: { type: DataTypes.INTEGER, allowNull: true },
      actorName: { type: DataTypes.STRING(120), allowNull: true },
      actorRole: { type: DataTypes.STRING(16), allowNull: true },
      category: { type: DataTypes.STRING(16), allowNull: false }, // people | money | settings | data | security
      action: { type: DataTypes.STRING(64), allowNull: false },
      details: { type: DataTypes.JSON, allowNull: true },
      result: { type: DataTypes.STRING(16), allowNull: true }, // ok | denied | failed
      message: { type: DataTypes.STRING(255), allowNull: true },
      ip: { type: DataTypes.STRING(64), allowNull: true },
    },
    {
      tableName: 'activityLogs',
      updatedAt: false,
      indexes: [
        { fields: ['brandId', 'createdAt'], name: 'activityLogs_brand_created' },
        { fields: ['salonDetailId', 'createdAt'], name: 'activityLogs_salon_created' },
      ],
    },
  )
  return activityLog
}
