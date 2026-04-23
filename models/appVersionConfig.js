module.exports = (sequelize, DataTypes) => {
  const appVersionConfig = sequelize.define(
    'appVersionConfig',
    {
      appType: {
        type: DataTypes.ENUM('client', 'business'),
        allowNull: false,
      },
      platform: {
        type: DataTypes.ENUM('android', 'ios'),
        allowNull: false,
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
      indexes: [
        {
          unique: true,
          fields: ['appType', 'platform'],
        },
      ],
    },
  )

  return appVersionConfig
}
