module.exports = (sequelize, DataTypes) => {
  const bookingHistory = sequelize.define('bookingHistory', {
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    time: {
      type: DataTypes.TIME,
      allowNull: true,
      defaultValue: '09:00'
    }
  });

  return bookingHistory;
};
