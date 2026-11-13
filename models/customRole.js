// An owner's own role (Step C), e.g. "Senior barber". It starts from a
// standard role and sets each permission; it can never give owner powers.
// Everyone holding it is updated when it changes.
module.exports = (sequelize, DataTypes) => {
  const customRole = sequelize.define(
    'customRole',
    {
      ownerUserId: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING(60), allowNull: false },
      baseRole: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'barber' },
      bookable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      levels: { type: DataTypes.JSON, allowNull: false },
      deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: 'customRoles', indexes: [{ fields: ['ownerUserId'], name: 'customRoles_owner' }] },
  )
  return customRole
}
