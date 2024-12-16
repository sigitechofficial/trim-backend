// category.js
module.exports = (sequelize, DataTypes) => {
  const category = sequelize.define('category', {
    categoryName: {
      type: DataTypes.STRING(),
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  })

  category.associate = (models) => {
    category.hasMany(models.service)
    models.service.belongsTo(category)

    models.salonDetail.hasMany(category)
    category.belongsTo(models.salonDetail)
  }

  return category
}
