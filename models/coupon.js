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
        defaultValue: 0,
      },
      value: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      applied: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
    }
  );

  coupon.associate = (models) => {
    models.salonDetail.hasMany(coupon);
    coupon.belongsTo(models.salonDetail);

    coupon.hasMany(models.couponTimeSlot);
    models.couponTimeSlot.belongsTo(coupon);
  };

  return coupon;
};
