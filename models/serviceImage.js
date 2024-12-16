// serviceImage.js
module.exports = (sequelize, DataTypes) => {
    const serviceImage = sequelize.define('serviceImage', {
      imageUrl: {
        type: DataTypes.STRING(),
        allowNull: false,
        defaultValue: '' // You can set a default value if needed
      }
    });
  
    serviceImage.associate = models => {
      models.service.hasMany(serviceImage);
      serviceImage.belongsTo(models.service);
    };
  
    return serviceImage;
  };
  