module.exports = (sequelize, DataTypes) => {
  const coupon = sequelize.define(
    'coupon',
    {
      promoCode: {
        type: DataTypes.STRING(),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('amount', 'percentage'),
        allowNull: false,
        defaultValue: 'percentage',
      },
      status: {
        type: DataTypes.ENUM('active', 'expire'),
        allowNull: false,
        defaultValue: 'active',
      },
      limit: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      value: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      applied: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      from: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      till: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
    },
    {
      paranoid: true,
      timestamps: true,
    },
  )

  coupon.associate = (models) => {
    models.salonDetail.hasMany(coupon)
    coupon.belongsTo(models.salonDetail)
  }

  return coupon
}
