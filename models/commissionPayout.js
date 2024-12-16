module.exports = (sequelize, DataTypes) => {
  const commissionPayout = sequelize.define(
    'commissionPayout',
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

  return commissionPayout
}
