// salonImage.js
module.exports = (sequelize, DataTypes) => {
  const salonImage = sequelize.define('salonImage', {
    imageUrl: {
      type: DataTypes.STRING(),
      allowNull: false,
      defaultValue: '' // You can set a default value if needed
    }
  });

  salonImage.associate = models => {
    models.salonDetail.hasMany(salonImage);
    salonImage.belongsTo(models.salonDetail);
  };

  return salonImage;
};
