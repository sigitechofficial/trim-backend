module.exports = (sequelize, DataTypes) => {
    const noShowPolicy = sequelize.define('noShowPolicy', {
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

    noShowPolicy.associate = models => {
        models.salonDetail.hasMany(noShowPolicy);
        noShowPolicy.belongsTo(models.salonDetail);
      };
    return noShowPolicy;
  };