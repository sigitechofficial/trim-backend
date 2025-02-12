module.exports = (sequelize, DataTypes) => {
  const tip = sequelize.define('tip', {
    amount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      defaultValue: 0,
    },
    on: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
    },
    time: {
      type: DataTypes.TIME,
      defaultValue: DataTypes.NOW,
    },
    at: {
      type: DataTypes.ENUM('checkout', 'feedback'),
      defaultValue: 'checkout',
    },
  })

  return tip
}
