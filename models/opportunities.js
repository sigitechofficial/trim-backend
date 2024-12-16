module.exports = (sequelize, DataTypes) => {
  const opportunities = sequelize.define('opportunities', {
    hours: {
      type: DataTypes.STRING(),
      allowNull: false
    },
    staffingLevel: {
      type: DataTypes.ENUM('low','adequate', 'busy'),
      allowNull: false,
      defaultValue: 'low'
    },
    promotions: {
      type: DataTypes.STRING(),
      allowNull: false
    }
  },
  // {
  //   paranoid: true,  
  //   timestamps: true,
  // }
);
 
  return opportunities;
};