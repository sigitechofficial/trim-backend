module.exports = (sequelize, DataTypes) => {
  const rentChairPayout = sequelize.define(
    'rentChairPayout',
    {
      amount: {
        //actual amount earned
        type: DataTypes.DECIMAL(14, 2),
        defaultValue: 0,
      },
      tip: {
        type: DataTypes.DECIMAL(14, 2),
        defaultValue: 0,
      },
      totalTransfer: {
        //actual amount earned + tip
        type: DataTypes.DECIMAL(14, 2),
        defaultValue: 0,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      transactionType: {
        type: DataTypes.STRING(),
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
  return rentChairPayout
}
