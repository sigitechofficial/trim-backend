module.exports = (sequelize, DataTypes) => {
  const wallet = sequelize.define('wallet', {
    onlineAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: '0.00',
    },
    cashAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: '0.00',
    },
    tipAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: '0.00',
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    accountConnected: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  })

  wallet.associate = (models) => {
    models.salonDetail.hasOne(wallet)
    wallet.belongsTo(models.salonDetail)

    models.employee.hasOne(wallet)
    wallet.belongsTo(models.employee)
  }
  return wallet
}
