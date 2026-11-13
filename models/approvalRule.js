// Which changes need the owner's approval in a branch (Step C). A rule with
// no row uses its default (helper/approvals.js RULES).
module.exports = (sequelize, DataTypes) => {
  const approvalRule = sequelize.define(
    'approvalRule',
    {
      salonDetailId: { type: DataTypes.INTEGER, allowNull: false },
      rule: { type: DataTypes.STRING(32), allowNull: false },
      enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      updatedByUserId: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: 'approvalRules',
      indexes: [{ unique: true, fields: ['salonDetailId', 'rule'], name: 'approvalRules_salon_rule' }],
    },
  )
  return approvalRule
}
