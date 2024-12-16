module.exports = (sequelize, DataTypes) => {
  const defaultCategory = sequelize.define('defaultCategory', {

    categoryName: {
      type: DataTypes.STRING(),
      allowNull: false
    },
    color: {
      type: DataTypes.STRING(),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });
 
  return defaultCategory;
};
