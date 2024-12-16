module.exports = (sequelize, DataTypes) => {
  const pushNotification = sequelize.define('pushNotification', {
    at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    to: {
      type: DataTypes.ENUM('customer', 'salon', 'employee', 'all', 'regular'),
      allowNull: false,
      defaultValue: 'regular',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    body: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('appointment', 'rating', 'admin', 'permotional'),
      defaultValue: 'appointment',
    },
  })

  return pushNotification
}
