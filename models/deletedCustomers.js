const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const deletedCustomer = sequelize.define(
    'deletedCustomer',
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(),
        allowNull: true,
      },
      countryCode: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      phoneNum: {
        type: DataTypes.STRING(72),
        allowNull: true,
        defaultValue: '',
      },
      image: {
        type: DataTypes.STRING(),
        allowNull: true,
        defaultValue: '',
      },
    },
    {
      primaryKey: true,
      autoIncrement: true,
      paranoid: true,
      timestamps: true,
      indexes: [
        {
          fields: ['email'],
          name: 'user_email_index',
        },
      ],
    },
  )

  return deletedCustomer
}
