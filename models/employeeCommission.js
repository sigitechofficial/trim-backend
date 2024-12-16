module.exports = (sequelize, DataTypes) => {
  const employeeCommission = sequelize.define(
    'employeeCommission',
    {
      commission: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      byJob: {
        type: DataTypes.ENUM('complete', 'no-show', 'cancel'),
        defaultValue: 'complete',
      },
      appointmentClosed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      withPercentage: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      timestamps: true,
      indexes: [
        {
          fields: ['commission'],
          name: 'commission_index',
        },
        {
          fields: ['byJob'],
          name: 'byJob_index',
        },
        {
          fields: ['appointmentClosed'],
          name: 'appointmentClosed_index',
        },
      ],
    },
  )

  return employeeCommission
}
