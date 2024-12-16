// jobs.js
module.exports = (sequelize, DataTypes) => {
  const jobs = sequelize.define(
    'jobs',
    {
      status: {
        type: DataTypes.ENUM(
          'pending',
          'assign',
          'complete',
          'no-show',
          'cancel',
        ),
        allowNull: false,
        defaultValue: 'assign',
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      subTotal: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      serviceDiscount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      extraDiscount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      on: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      tip: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      Extra: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      employeeEarning: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      salonEarning: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
    },
    {
      paranoid: true,
      timestamps: true,
    },
  )

  jobs.associate = (models) => {
    models.service.hasMany(jobs)
    jobs.belongsTo(models.service)

    models.employee.hasMany(jobs)
    jobs.belongsTo(models.employee)

    models.booking.hasMany(jobs)
    jobs.belongsTo(models.booking)

    models.timeSlot.hasMany(jobs)
    jobs.belongsTo(models.timeSlot)

    jobs.hasMany(models.employeeCommission)
    models.employeeCommission.belongsTo(jobs)

    jobs.hasMany(models.rentChairEarning)
    models.rentChairEarning.belongsTo(jobs)

    jobs.hasMany(models.tip)
    models.tip.belongsTo(jobs)
  }

  return jobs
}
