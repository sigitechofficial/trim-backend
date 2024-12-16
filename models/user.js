const { DataTypes } = require('sequelize')
const { Op } = require('sequelize')
const bcrypt = require('bcryptjs')

module.exports = (sequelize) => {
  const user = sequelize.define(
    'user',
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'First Name is Required',
          },
          notEmpty: {
            msg: 'First Name cannot be empty',
          },
        },
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Last Name is Required',
          },
          notEmpty: {
            msg: 'Last Name cannot be empty',
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(),
        allowNull: true,
        defaultValue: '',
        validate: {
          isEmail: {
            msg: 'Invalid email format',
          },
        },
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
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      stripeCustomerId: {
        type: DataTypes.STRING(),
        allowNull: true,
      },
      dvToken: {
        type: DataTypes.STRING(),
        allowNull: true,
        defaultValue: '',
      },
      image: {
        type: DataTypes.STRING(),
        allowNull: true,
        defaultValue: '',
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      signedFrom: {
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
          fields: ['userTypeId'],
          name: 'user_userType_index',
        },
      ],
    },
  )

  user.beforeCreate(async (user) => {
    if (user.password && user.password.trim() !== '') {
      user.password = await bcrypt.hash(user.password, 12)
    }
  })

  user.associate = (models) => {
    // LINK to OTP Table
    user.hasOne(models.otpVerification)
    models.otpVerification.belongsTo(user)
    // LINK to device Tokens
    user.hasMany(models.deviceToken)
    models.deviceToken.belongsTo(user)

    user.hasMany(models.rating)
    models.rating.belongsTo(user)

    // Linking user to booking cancelled by
    user.hasMany(models.cancelledBooking)
    models.cancelledBooking.belongsTo(user)

    user.hasMany(models.favorite)
    models.favorite.belongsTo(user)

    user.hasMany(models.blockCustomer)
    models.blockCustomer.belongsTo(user)

    user.hasMany(models.deletedCustomer)
    models.deletedCustomer.belongsTo(user)

    user.hasMany(models.pushNotification)
    models.pushNotification.belongsTo(user)

    // linking user to booking as customer
    // user.hasMany(models.booking, { as: "customer", foreignKey: "customerId" });
    // models.booking.belongsTo(user, {
    //   as: "customer",
    //   foreignKey: "customerId",
    // });
  }
  // hook to convert created at time stamp
  user.addHook('beforeFind', (options) => {
    if (options.attributes) {
      options.attributes.exclude = ['deletedAt', 'updatedAt']
    }
  })

  return user
}
