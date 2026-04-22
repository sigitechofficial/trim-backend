module.exports = (sequelize, DataTypes) => {
  const appVersionConfig = sequelize.define(
    'appVersionConfig',
    {
      platform: {
        type: DataTypes.ENUM('android', 'ios'),
        allowNull: false,
        unique: true,
      },
      latestVersion: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      minimumSupportedVersion: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      forceUpdateMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      softUpdateMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      timestamps: true,
    },
  )

  return appVersionConfig
}
