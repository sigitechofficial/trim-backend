module.exports = (sequelize, DataTypes) => {
    const paymentPolicy = sequelize.define('paymentPolicy', {
      percentage: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
    });

    paymentPolicy.associate = models => {
        models.salonDetail.hasMany(paymentPolicy);
        paymentPolicy.belongsTo(models.salonDetail);
      };
    return paymentPolicy;
  };