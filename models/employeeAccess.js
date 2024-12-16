module.exports = (sequelize, DataTypes) => {
  const employeeAccess = sequelize.define('employeeAccess', {
    access: {
      type: DataTypes.STRING(),
      allowNull: false
    },
    key: {
      type: DataTypes.STRING(),
      allowNull: false
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
  },
    level: {
      type: DataTypes.ENUM('none','low', 'high'),
      allowNull: false,
      defaultValue: 'none'
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['level'],
        name: 'employee_level_index'
      },
      {
        fields: ['key'],
        name: 'employee_key_index'
      }
    ]
    
  }
);
 
  return employeeAccess;
};