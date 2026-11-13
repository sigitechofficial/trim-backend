// A two-step login in progress (Step C): the code sent by email, hashed,
// for one person on one device. Valid 10 minutes, 5 tries.
module.exports = (sequelize, DataTypes) => {
  const loginChallenge = sequelize.define(
    'loginChallenge',
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      deviceHash: { type: DataTypes.STRING(64), allowNull: false },
      codeHash: { type: DataTypes.STRING(64), allowNull: false },
      sentTo: { type: DataTypes.STRING(255), allowNull: true },
      sends: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      lastSentAt: { type: DataTypes.DATE, allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      usedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'loginChallenges', indexes: [{ fields: ['userId'], name: 'loginChallenges_user' }] },
  )
  return loginChallenge
}
