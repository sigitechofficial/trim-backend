module.exports = (sequelize, DataTypes) => {
    const subscriptionFeature = sequelize.define('subscriptionFeature', {
      feature: {
        type: DataTypes.STRING(),
        allowNull: false,
      },
    },{
        paranoid: true,  
        timestamps: true,
    });
  
    subscriptionFeature.associate = (models) => {
      models.subscriptionPlan.hasMany(subscriptionFeature);
      subscriptionFeature.belongsTo(models.subscriptionPlan);
    };
  
    return subscriptionFeature;
  };
  