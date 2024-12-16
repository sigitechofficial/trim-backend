module.exports = (sequelize, DataTypes) => {
  const deviceToken = sequelize.define('deviceToken', {
    tokenId: {
      type: DataTypes.STRING(),
      allowNull: true
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
  return deviceToken;
};
