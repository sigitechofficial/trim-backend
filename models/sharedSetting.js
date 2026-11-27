// Where one of an owner's settings applies (Step C): 'branch' (each branch
// its own), 'all' (copied to every branch), 'locked' (all branches, owner
// only). sourceSalonId: the branch it was last set in, for new branches.
module.exports = (sequelize, DataTypes) => {
  const sharedSetting = sequelize.define(
    'sharedSetting',
    {
      ownerUserId: { type: DataTypes.INTEGER, allowNull: false },
      key: { type: DataTypes.STRING(32), allowNull: false },
      state: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'branch' },
      sourceSalonId: { type: DataTypes.INTEGER, allowNull: true },
      updatedByUserId: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'sharedSettings', indexes: [{ unique: true, fields: ['ownerUserId', 'key'], name: 'sharedSettings_owner_key' }] },
  )
  return sharedSetting
}
