module.exports = (sequelize, DataTypes) => {
  const salaryPayout = sequelize.define(
    'salaryPayout',
    {
      amount: {
        type: DataTypes.DECIMAL(14, 2),
        defaultValue: 0,
      },
      expectedDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      tansferDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('paid', 'unpaid'),
        defaultValue: 'paid',
      },
      transactionType: {
        type: DataTypes.STRING(),
        allowNull: true,
      },
      salaryType: {
        type: DataTypes.STRING(),
        allowNull: true,
      },
      cycle: {
        type: DataTypes.STRING(),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
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

  return salaryPayout
}
