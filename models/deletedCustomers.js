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
      password: {
        type: DataTypes.STRING(),
        allowNull: true,
      },
      stripeCustomerId: {
        type: DataTypes.STRING(),
        allowNull: true,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      recovered: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      permanentlyDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      recoveryToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
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
        {
          fields: ['userId'],
          name: 'user_id_index',
        },
        {
          fields: ['deletedAt'],
          name: 'deleted_at_index',
        },
      ],
    },
  )

  return deletedCustomer
}
