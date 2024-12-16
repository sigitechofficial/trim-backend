// serviceType.js
module.exports = (sequelize, DataTypes) => {
  const serviceType = sequelize.define('serviceType', {
    typeName: {
      type: DataTypes.STRING(),
      allowNull: false,
      unique: {
        //not needed
        args: true,
        msg: 'This service-type is already exists.'
      }
    },
    image: {
      type: DataTypes.STRING(),
      allowNull: false
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
  },
  
  {
      paranoid: true,  
      timestamps: true,
  });

  serviceType.associate = models => {
    serviceType.hasMany(models.service);
    models.service.belongsTo(serviceType);
  };

  return serviceType;
};
