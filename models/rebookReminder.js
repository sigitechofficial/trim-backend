module.exports = (sequelize, DataTypes) => {
  const rebookReminder = sequelize.define('rebookReminder', {
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // The date this reminder was calculated to be due on.
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    // When the push was actually sent.
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // 'single'  => customer had exactly one completed booking (fixed window).
    // 'average' => due date derived from the average gap between bookings.
    basis: {
      type: DataTypes.ENUM('single', 'average'),
      allowNull: false,
    },
    // Snapshot of how many completed bookings the customer had at send time.
    bookingsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    // The clamped average gap (in days) used for 'average' basis, else null.
    avgGapDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  })

  rebookReminder.associate = (models) => {
    models.user.hasMany(rebookReminder, { foreignKey: 'customerId' })
    rebookReminder.belongsTo(models.user, { foreignKey: 'customerId' })
  }

  return rebookReminder
}
