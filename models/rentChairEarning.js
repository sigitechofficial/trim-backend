module.exports = (sequelize, DataTypes) => {
  const rentChairEarning = sequelize.define(
    'rentChairEarning',
    {
      earnings: {
        type: DataTypes.DECIMAL(12, 2),
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
    },
    {
      timestamps: true,
      indexes: [
        {
          fields: ['earnings'],
          name: 'earnings_index',
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
  return rentChairEarning
}
