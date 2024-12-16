// wagesMethod.js
module.exports = (sequelize, DataTypes) => {
  const employeeWagesMethod = sequelize.define(
    'employeeWagesMethod',
    {
      value: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cycle: {
        type: DataTypes.ENUM('Monthly', 'Daily', 'Weekly', 'Bi-weekly'),
        allowNull: true,
        // defaultValue: 'weekly',
      },
      cycleValue: {
        type: DataTypes.INTEGER,
        allowNull: true,
        // defaultValue: 1,
      },
      prevSalaryDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      payDate: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      payDay: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      indexes: [
        {
          fields: ['cycle'],
          name: 'cycle_index',
        },
        {
          fields: ['payDay'],
          name: 'payDay_index',
        },
        {
          fields: ['payDate'],
          name: 'payDate_index',
        },
      ],
    },
  )

  employeeWagesMethod.associate = (models) => {
    models.employee.hasOne(employeeWagesMethod)
    employeeWagesMethod.belongsTo(models.employee)

    models.wagesMethod.hasOne(employeeWagesMethod)
    employeeWagesMethod.belongsTo(models.wagesMethod)
  }

  return employeeWagesMethod
}
