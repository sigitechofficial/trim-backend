module.exports = (sequelize, DataTypes) => {
    const customerOnConnectAccount = sequelize.define(
        'customerOnConnectAccount',
        {
            customerId: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            connectAccountId: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            status: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            paranoid: true,
            timestamps: true,
        },
    )

    customerOnConnectAccount.associate = (models) => {
        //Realtion With Salon Detail
        models.salonDetail.hasMany(customerOnConnectAccount)
        customerOnConnectAccount.belongsTo(models.salonDetail)


        //Realtion With Customer
        models.user.hasMany(customerOnConnectAccount)
        customerOnConnectAccount.belongsTo(models.user)
    }

    return customerOnConnectAccount
}
