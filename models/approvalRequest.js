// A change a team member asked for that waits for the owner (Step C).
// The original request (method, path, body) is kept and run again, as the
// owner, when they approve. Nothing changes before that.
module.exports = (sequelize, DataTypes) => {
  const approvalRequest = sequelize.define(
    'approvalRequest',
    {
      brandId: { type: DataTypes.INTEGER, allowNull: true },
      salonDetailId: { type: DataTypes.INTEGER, allowNull: false },
      requestedByUserId: { type: DataTypes.INTEGER, allowNull: false },
      requesterName: { type: DataTypes.STRING(120), allowNull: true },
      requesterRole: { type: DataTypes.STRING(16), allowNull: true },
      rule: { type: DataTypes.STRING(32), allowNull: false }, // prices | newService | coupons | ...
      summary: { type: DataTypes.STRING(255), allowNull: false },
      before: { type: DataTypes.JSON, allowNull: true },
      method: { type: DataTypes.STRING(8), allowNull: false },
      path: { type: DataTypes.STRING(255), allowNull: false },
      body: { type: DataTypes.JSON, allowNull: true },
      note: { type: DataTypes.STRING(255), allowNull: true }, // from the requester
      // pending → approving → approved | failed; or declined | expired | cancelled
      status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'pending' },
      decidedByUserId: { type: DataTypes.INTEGER, allowNull: true },
      decidedByName: { type: DataTypes.STRING(120), allowNull: true },
      reason: { type: DataTypes.STRING(500), allowNull: true },
      resultMessage: { type: DataTypes.STRING(255), allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      remindedAt: { type: DataTypes.DATE, allowNull: true },
      decidedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'approvalRequests',
      indexes: [
        { fields: ['salonDetailId', 'status'], name: 'approvalRequests_salon_status' },
        { fields: ['requestedByUserId', 'status'], name: 'approvalRequests_requester_status' },
        { fields: ['status', 'expiresAt'], name: 'approvalRequests_status_expires' },
      ],
    },
  )
  return approvalRequest
}
