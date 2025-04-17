module.exports = (sequelize, DataTypes) =>{
  const permission = sequelize.define('permission', {
      permissionType: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
      },
  });
  return permission;
};