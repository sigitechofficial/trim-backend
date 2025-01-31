module.exports = (sequelize, DataTypes) => {
  const rentCollection = sequelize.define(
    'rentCollection',
    {
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      expectedDate: {
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
