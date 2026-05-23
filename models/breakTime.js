// breakTime.js
module.exports = (sequelize, DataTypes) => {
  const breakTime = sequelize.define(
    'breakTime',
    {
      salonDetailId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
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
      breakStart: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      breakEnd: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'breaks',
      paranoid: true,
      timestamps: true,
    },
  )

  breakTime.associate = (models) => {
    breakTime.belongsTo(models.salonDetail, {
      foreignKey: 'salonDetailId',
      as: 'salonDetail',
    })
    breakTime.belongsTo(models.employee, {
      foreignKey: 'employeeId',
      as: 'employee',
    })
  }

  return breakTime
}
