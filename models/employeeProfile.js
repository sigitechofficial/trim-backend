module.exports = (sequelize, DataTypes) => {
  const employeeProfile = sequelize.define('employeeProfile', {
    hasServiceList: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    hasWorkingHours: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    hasWagesMethod: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  })

  return employeeProfile
}
