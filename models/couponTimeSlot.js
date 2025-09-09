module.exports = (sequelize, DataTypes) => {
    const couponTimeSlot = sequelize.define(
        'couponTimeSlot',
        {
            day: {
                type: DataTypes.STRING(),
                allowNull: false,
            },
            timeFrom: {
                type: DataTypes.STRING(),
                allowNull: false,
            },
            timeTo: {
                type: DataTypes.STRING(),
                allowNull: false,
            },
        }
        
    );


    return couponTimeSlot;
};
