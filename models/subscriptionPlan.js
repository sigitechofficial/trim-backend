// subscriptionPlan.js
module.exports = (sequelize, DataTypes) => {
    const subscriptionPlan = sequelize.define('subscriptionPlan', {
      name: {
        type: DataTypes.STRING(),
        allowNull: false,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      teamSize: {
        type: DataTypes.STRING(),
        allowNull: false,
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    });
  
    subscriptionPlan.associate = (models) => {
    };
  
    return subscriptionPlan;
  };
  