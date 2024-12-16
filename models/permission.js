module.exports = (sequelize, DataTypes) =>{
  const permission = sequelize.define('permission', {
      permissionType: {
          type: DataTypes.STRING(),
          allowNull: true,
          defaultValue: "",
      },
  });
  return permission;
};