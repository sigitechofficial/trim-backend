module.exports = (sequelize, DataTypes) => {
  const employeeAccessDefault = sequelize.define('employeeAccessDefault', {
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
      defaultValue: false,
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
 
  return employeeAccessDefault;
};