module.exports = (sequelize, DataTypes) => {
    const depositPolicy = sequelize.define('depositPolicy', {
      refundPercentage: {
        type: DataTypes.INTEGER,
        allowNull: false,
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

    depositPolicy.associate = models => {
        models.salonDetail.hasMany(depositPolicy);
        depositPolicy.belongsTo(models.salonDetail);
      };
    return depositPolicy;
  };