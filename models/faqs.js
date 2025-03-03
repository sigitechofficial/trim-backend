module.exports = (sequelize, DataTypes) => {
  const faqs = sequelize.define('faqs', {
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    faqFor: {
      type: DataTypes.ENUM('general', 'salon', 'customer', 'external-employee'),
      allowNull: true,
      defaultValue: 'general',
    },
  })

  return faqs
}
