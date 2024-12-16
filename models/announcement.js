module.exports = (sequelize, DataTypes) => {
    const announcement = sequelize.define('announcement', {
      context: {
        type: DataTypes.STRING(),
        allowNull: true,
      },
      from: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      to: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    });
  
    return announcement;
  };
  