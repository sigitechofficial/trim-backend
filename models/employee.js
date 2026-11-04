// employee.js
module.exports = (sequelize, DataTypes) => {
  const employee = sequelize.define('employee', {
    position: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    coverImage: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    isOwner: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    isExternalEmployee: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    parentEmployeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Set when a chair renter leaves this shop (the row is also marked deleted).
    leftAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  })

  employee.associate = (models) => {
    models.user.hasMany(employee)
    employee.belongsTo(models.user)

    employee.hasMany(models.rating)
    models.rating.belongsTo(employee)

    employee.hasMany(models.employeeAccess)
    models.employeeAccess.belongsTo(employee)

    employee.hasMany(models.employeeCommission)
    models.employeeCommission.belongsTo(employee)

    employee.hasMany(models.commissionPayout)
    models.commissionPayout.belongsTo(employee)

    employee.hasMany(models.rentChairEarning)
    models.rentChairEarning.belongsTo(employee)

    employee.hasMany(models.rentChairPayout)
    models.rentChairPayout.belongsTo(employee)

    employee.hasMany(models.salaryPayout)
    models.salaryPayout.belongsTo(employee)

    employee.hasMany(models.tip)
    models.tip.belongsTo(employee)

    employee.hasMany(models.employeeProfile)
    models.employeeProfile.belongsTo(employee)

    employee.hasMany(models.rentCollection)
    models.rentCollection.belongsTo(employee)

    employee.hasMany(models.breakTime, {
      foreignKey: 'employeeId',
      as: 'breaks',
    })
  }

  return employee
}
