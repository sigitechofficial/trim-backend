module.exports = (sequelize, DataTypes) =>{
  const feature = sequelize.define('feature', {
      title: {
          type: DataTypes.STRING(),
          allowNull: true,
          defaultValue: "",
      },
      status: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
      },
      key: {
          type: DataTypes.STRING(),
          allowNull: true,
          defaultValue: "",
      },
  },{
    paranoid: true,  
    timestamps: true,
});
  feature.associate = (models)=>{
      feature.hasMany(models.permission);
      models.permission.belongsTo(feature);
  };
  return feature;
};