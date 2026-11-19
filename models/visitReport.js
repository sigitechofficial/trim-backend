// "My barber didn't arrive" reports on home visits (helper/visitReports.js).
// One row per report. state:
//   waiting_barber - the barber has REPLY_MINUTES to tap "I'm here" at the address
//   refunded       - the client got a full refund (counts as a strike on the barber)
//   barber_won     - the barber's location proved they were at the door
//   admin_review   - Trim's team decides (client asked, or over the monthly limit)
//   closed         - admin decided for the barber
module.exports = (sequelize, DataTypes) => {
  const visitReport = sequelize.define(
    'visitReport',
    {
      bookingId: { type: DataTypes.INTEGER, allowNull: false },
      customerId: { type: DataTypes.INTEGER, allowNull: false },
      salonDetailId: { type: DataTypes.INTEGER, allowNull: false },
      employeeId: { type: DataTypes.INTEGER, allowNull: true },
      // 'not_arrived' (no "I've arrived" yet) or 'not_here' (client said No after it)
      reason: { type: DataTypes.STRING(16), allowNull: false },
      state: { type: DataTypes.STRING(16), allowNull: false },
      deadlineAt: { type: DataTypes.DATE, allowNull: true },
      barberReplyAt: { type: DataTypes.DATE, allowNull: true },
      barberReplyDistanceM: { type: DataTypes.INTEGER, allowNull: true },
      // Short reason shown to the client, barber and admin.
      outcome: { type: DataTypes.STRING(255), allowNull: true },
      // 'auto' or 'admin'
      resolvedBy: { type: DataTypes.STRING(8), allowNull: true },
      resolvedAt: { type: DataTypes.DATE, allowNull: true },
      refundAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    },
    {
      indexes: [{ fields: ['bookingId'] }, { fields: ['customerId'] }, { fields: ['employeeId'] }, { fields: ['state'] }],
    },
  )
  return visitReport
}
