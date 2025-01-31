module.exports = (sequelize, DataTypes) => {
  const rentCollection = sequelize.define(
    'rentCollection',
    {
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      rentPerCycle: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      numberOfCycle: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      transferBy: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cycle: {
        type: DataTypes.ENUM('Monthly', 'Daily', 'Weekly', 'Bi-weekly'),
        allowNull: true,
        // defaultValue: 'weekly',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      paymentTillDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      indexes: [
        {
          fields: ['amount'],
          name: 'amount_index',
        },
      ],
    },
  )

  return rentCollection
}
