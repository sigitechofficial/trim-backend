module.exports = (sequelize, DataTypes) => {
  const rating = sequelize.define('rating', {
    value: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: true,
      defaultValue: 0,
      validate: {
        isDecimal: true,
        min: 0.0,
        max: 5.0
      }
    },
    comment: {
      type: DataTypes.STRING(),
      allowNull: true,
      defaultValue: ''
    },
    at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  return rating;
};
