module.exports = (sequelize, DataTypes) => {
  const faqCategory = sequelize.define(
    'faqCategory',
    {
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      faqFor: {
        type: DataTypes.ENUM(
          'general',
          'salon',
          'customer',
          'external-employee',
        ),
        allowNull: false,
        defaultValue: 'general',
      },
    },
    {
      tableName: 'faqCategory',
      timestamps: true,
    },
  )

  faqCategory.associate = (models) => {
    faqCategory.hasMany(models.faqs, {
      foreignKey: 'faqCategoryId',
      as: 'faqs',
    })
  }

  return faqCategory
}
