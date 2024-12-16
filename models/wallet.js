module.exports = (sequelize, DataTypes) =>{
    const wallet = sequelize.define('wallet', {
        amount: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
            defaultValue: '0.00'
        },
        due: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
            defaultValue: '0.00'
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '$'
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        accountConnected: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
    });

    wallet.associate = (models) => {
        models.salonDetail.hasOne(wallet);
        wallet.belongsTo(models.salonDetail);

        models.employee.hasOne(wallet);
        wallet.belongsTo(models.employee)
    };
    return wallet;
};