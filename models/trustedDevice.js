// A phone or tablet a person has confirmed with a two-step login code
// (Step C). The app's own random device id is stored hashed. dvToken is the
// push token it last logged in with, used to sign the device out remotely.
module.exports = (sequelize, DataTypes) => {
  const trustedDevice = sequelize.define(
    'trustedDevice',
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      deviceHash: { type: DataTypes.STRING(64), allowNull: false },
      name: { type: DataTypes.STRING(120), allowNull: true },
      platform: { type: DataTypes.STRING(16), allowNull: true },
      dvToken: { type: DataTypes.STRING(512), allowNull: true },
      lastIp: { type: DataTypes.STRING(64), allowNull: true },
      lastSeenAt: { type: DataTypes.DATE, allowNull: true },
      trustedAt: { type: DataTypes.DATE, allowNull: true },
      revokedAt: { type: DataTypes.DATE, allowNull: true },
      revokedByUserId: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: 'trustedDevices',
      indexes: [{ unique: true, fields: ['userId', 'deviceHash'], name: 'trustedDevices_user_device' }],
    },
  )
  return trustedDevice
}
