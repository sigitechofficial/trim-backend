// salonTimeHistory.js
module.exports = (sequelize, DataTypes) => {
  const salonTimeHistory = sequelize.define('salonTimeHistory', {
    day: {
      type: DataTypes.STRING(),
      allowNull: false,
      validate: {
        isIn: {
          args: [
            [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday'
            ]
          ],
          msg: 'Invalid day'
        }
      }
    },
    openingTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    closingTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    on:{
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.NOW,
    },
    workingTime:{
      type: DataTypes.INTEGER,
      defaultValue: 1440,// this will be in minuts
    },
  },
  {
    indexes: [
      {
        fields: ['day'],
        name: 'day_index'
      },
      {
        fields: ['on'],
        name: 'on_index'
      }
    ]
  });
 

  return salonTimeHistory;
};
