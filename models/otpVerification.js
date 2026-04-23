module.exports = (sequelize, DataTypes) => {
  const otpVerification = sequelize.define('otpVerification', {
    OTP: {
      type: DataTypes.STRING(5),
      allowNull: true,
      validate: {
        len: {
          args: [4, 4],
          msg: 'OTP must be exactly 5 characters long',
        },
      },
    },
    reqAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiryAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verifiedInForgetCase: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    /** Distinguishes admin 2FA login OTP from forgot-password flow */
    otpPurpose: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
  })

  return otpVerification
}
