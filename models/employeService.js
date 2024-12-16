// service.js
module.exports = (sequelize, DataTypes) => {
  const employeeService = sequelize.define('employeeService', {
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    }
  });

  employeeService.associate = models => {
    models.employee.hasMany(employeeService);
    employeeService.belongsTo(models.employee);

    models.service.hasMany(employeeService);
    employeeService.belongsTo(models.service);
  };

  return employeeService;
};
