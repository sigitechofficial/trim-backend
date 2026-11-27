// A chair renter moving from one host shop to another (or leaving with no new
// shop yet). The move itself runs from jobs/renterMoveCron.js on moveDate.
module.exports = (sequelize, DataTypes) => {
  const renterMove = sequelize.define(
    'renterMove',
    {
      renterUserId: { type: DataTypes.INTEGER, allowNull: false },
      // The renter's own salonDetails row (keeps customers, bookings, reviews).
      renterSalonId: { type: DataTypes.INTEGER, allowNull: false },
      fromSalonId: { type: DataTypes.INTEGER, allowNull: true },
      // Null for "leave shop" with no new shop yet.
      toSalonId: { type: DataTypes.INTEGER, allowNull: true },
      fromEmployeeId: { type: DataTypes.INTEGER, allowNull: true },
      toEmployeeId: { type: DataTypes.INTEGER, allowNull: true },
      moveDate: { type: DataTypes.DATEONLY, allowNull: false },
      // invited | accepted | declined | completed | cancelled | failed
      status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'invited' },
      rentAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
      rentCycle: { type: DataTypes.STRING(16), allowNull: true },
      // The old shop confirms the renter owes nothing before the move runs.
      rentSettledAt: { type: DataTypes.DATE, allowNull: true },
      createdBy: { type: DataTypes.INTEGER, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
      failReason: { type: DataTypes.STRING(255), allowNull: true },
      // "Leave shop" moves: when the renter was told the grace period ends soon / has ended.
      graceReminderAt: { type: DataTypes.DATE, allowNull: true },
      graceEndedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      indexes: [
        { fields: ['renterUserId'] },
        { fields: ['status', 'moveDate'] },
        { fields: ['toSalonId'] },
        { fields: ['fromSalonId'] },
      ],
    },
  )

  renterMove.associate = (models) => {
    renterMove.belongsTo(models.salonDetail, { as: 'renterSalon', foreignKey: 'renterSalonId', constraints: false })
    renterMove.belongsTo(models.salonDetail, { as: 'fromSalon', foreignKey: 'fromSalonId', constraints: false })
    renterMove.belongsTo(models.salonDetail, { as: 'toSalon', foreignKey: 'toSalonId', constraints: false })
    renterMove.belongsTo(models.user, { as: 'renter', foreignKey: 'renterUserId', constraints: false })
  }

  return renterMove
}
