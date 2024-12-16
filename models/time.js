// time.js
module.exports = (sequelize, DataTypes) => {
  const time = sequelize.define('time', {
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
              'Sunday',
            ],
          ],
          msg: 'Invalid day',
        },
      },
    },
    openingTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    closingTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    startsOn: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.NOW,
    },
    endsOn: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    workingTime: {
      type: DataTypes.INTEGER,
      defaultValue: 1440, // this will be in minuts
    },
  })

  time.associate = (models) => {
    models.employee.hasMany(time, { foreignKey: 'employeeId' })
    time.belongsTo(models.employee, { foreignKey: 'employeeId' })
  }

  return time
}
