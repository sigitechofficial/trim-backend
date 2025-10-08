module.exports = (sequelize, DataTypes) => {
    const couponOnBooking = sequelize.define('couponOnBooking', {
        isCouponUsed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    });

    couponOnBooking.associate = (models) => {
        couponOnBooking.hasMany(models.booking)
        models.booking.belongsTo(couponOnBooking)
    }

    return couponOnBooking
}