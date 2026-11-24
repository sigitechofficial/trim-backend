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
    // Role in this branch (Step A): owner | manager | receptionist | barber.
    // Null on rows from before Step A: isOwner decides (see helper/branchScope).
    role: {
      type: DataTypes.STRING(16),
      allowNull: true,
    },
    // 0 = a manager or receptionist who doesn't cut hair (not bookable by clients).
    bookable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    // Step B: a manager over every branch of the brand; new branches get a
    // row for them too.
    branchBlocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    allBranches: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // Step C: the owner's custom role this person holds here (its levels are
    // copied to employeeAccess), and access to this branch for a period only.
    customRoleId: { type: DataTypes.INTEGER, allowNull: true },
    accessFrom: { type: DataTypes.DATE, allowNull: true },
    accessUntil: { type: DataTypes.DATE, allowNull: true },
    accessState: { type: DataTypes.STRING(16), allowNull: true }, // scheduled | active | ended
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
