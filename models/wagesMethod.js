// wagesMethod.js
module.exports = (sequelize, DataTypes) => {
  const wagesMethod = sequelize.define('wagesMethod', {
    methodName: {
      type: DataTypes.STRING(),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  })

  wagesMethod.associate = (models) => {}

  return wagesMethod
}
