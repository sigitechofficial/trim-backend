module.exports = (sequelize, DataTypes) => {
    const timeSlot = sequelize.define('timeSlot', {
      startTime: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // Add any other attributes specific to the time slot
    });
  
    timeSlot.associate = (models) => {       
    };
  
    return timeSlot;
  };
  