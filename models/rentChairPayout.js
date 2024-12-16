module.exports = (sequelize, DataTypes) => {
  const rentChairPayout = sequelize.define(
    'rentChairPayout',
    {
      amount: {
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
