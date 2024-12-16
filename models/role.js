module.exports = (sequelize, DataTypes) =>{
  const role = sequelize.define('role', {
      name: {
          type: DataTypes.STRING(),
          allowNull: true,
      },
      status: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
      },
  },{
    paranoid: true,  
    timestamps: true,
});
  role.associate = (models)=>{
      role.hasMany(models.user);
      models.user.belongsTo(role);

      role.hasMany(models.permission);
      models.permission.belongsTo(role);
  };
  
  return role;
};