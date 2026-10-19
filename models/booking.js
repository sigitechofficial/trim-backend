module.exports = (sequelize, DataTypes) => {
  const booking = sequelize.define('booking', {
    status: {
      type: DataTypes.ENUM(
        'pending',
        'book',
        'complete',
        'cancel',
        'no-show',
        'save-unpaid',
        'requested',
      ),
      allowNull: false,
      defaultValue: 'book',
    },
    subTotal: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      defaultValue: 0,
    },
    platformFee: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      defaultValue: 0,
    },
    total: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      defaultValue: 0,
    },
    initialPayment: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      defaultValue: 0,
    },
    actualCapturedAmount: {
      // after complete , cancel or no-show
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      defaultValue: 0,
    },
    finalPayment: {
      type: DataTypes.ENUM('paid', 'unpaid'),
      allowNull: false,
      defaultValue: 'unpaid',
    },
    promoCode: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    note: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    salonNote: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    reScheduleCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    on: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    tip: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    stripeCardId: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    initialPaymentIntend: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    finalPaymentIntend: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    upFrontPaymentPercentage: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    paymentMethod: {
      type: DataTypes.ENUM('card', 'cash', 'tap_to_pay'),
      allowNull: false,
      defaultValue: 'card',
    },
    rating: {
      type: DataTypes.ENUM('pending', 'done', 'skiped', 'cancel'),
      allowNull: false,
      defaultValue: 'pending',
    },
    clientRemoved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    cancellationPolicyVersion: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    reschedulePolicyVersion: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    upFrontPolicyVersion: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    noshowPolicyVersion: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    by: {
      type: DataTypes.ENUM('online', 'walkin'),
      allowNull: false,
      defaultValue: 'walkin',
    },
    noshowCharges: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    cancellationCharges: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    penaltyAmount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    refundAmount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    customerStatus: {
      type: DataTypes.ENUM('repeat', 'new'),
      allowNull: false,
      defaultValue: 'new',
    },
    feedback: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    salonReply: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    penaltyPaymentIntend: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    penaltyAmount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    refundPaymentIntend: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    clientFirstName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Walkin',
    },
    clientLastName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Customer',
    },

    countryCode: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: '',
    },
    phoneNum: {
      type: DataTypes.STRING(15),
      allowNull: true,
      defaultValue: '',
    },
    reminderSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    vatAmount:{
      type:DataTypes.STRING(),
      allowNull:true,
    },
    vatOriginalAmount:{
      type:DataTypes.STRING(),
      allowNull:true,
    },
    twoHoursReminder: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Manual approval: a 'requested' booking must be answered before this time.
    requestExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // 'accepted' | 'declined' | 'expired' | 'withdrawn' (client cancelled while waiting).
    // Declined/expired/withdrawn bookings use status 'cancel' so existing flows treat them as cancelled.
    requestOutcome: {
      type: DataTypes.STRING(16),
      allowNull: true,
    },
    requestReminderSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Accept with a new time: the shop moved the request and waits for the
    // client to confirm (requestOutcome 'proposed'). previous* = the time the
    // client originally asked for.
    previousOn: { type: DataTypes.DATEONLY, allowNull: true },
    previousStartTime: { type: DataTypes.TIME, allowNull: true },
    previousEndTime: { type: DataTypes.TIME, allowNull: true },
    proposalComment: { type: DataTypes.STRING(500), allowNull: true },
    // Staff the client originally asked for, when the shop suggested someone else.
    previousStaffName: { type: DataTypes.STRING(255), allowNull: true },
    proposedAt: { type: DataTypes.DATE, allowNull: true },
    // How many times the shop has suggested a new time (at most 2).
    proposalCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    // What the client wrote when declining a suggested time.
    clientDeclineNote: { type: DataTypes.STRING(500), allowNull: true },
    // When the client declined a suggested time (tells an expiry while back
    // with the shop apart from one while waiting on the client).
    clientDeclinedAt: { type: DataTypes.DATE, allowNull: true },
    // Who answered the request for the shop (owner or staff name).
    respondedByName: { type: DataTypes.STRING(255), allowNull: true },
    // Loyalty reward used on this booking (set by the server, never the app).
    loyaltyDiscount: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
    loyaltyPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    loyaltyCardId: { type: DataTypes.INTEGER, allowNull: true },
  })

  booking.associate = (models) => {
    models.user.hasMany(booking, { foreignKey: 'customerId' })
    booking.belongsTo(models.user, { foreignKey: 'customerId' })

    models.salonDetail.hasMany(booking)
    booking.belongsTo(models.salonDetail)

    booking.hasMany(models.bookingHistory)
    models.bookingHistory.belongsTo(booking)

    booking.hasOne(models.cancelledBooking)
    models.cancelledBooking.belongsTo(booking)

    booking.hasMany(models.rating)
    models.rating.belongsTo(booking)

    booking.hasMany(models.rentChairEarning)
    models.rentChairEarning.belongsTo(booking)

    booking.hasMany(models.employeeCommission)
    models.employeeCommission.belongsTo(booking)

    booking.hasMany(models.tip)
    models.tip.belongsTo(booking)

    booking.hasMany(models.couponOnBooking)
    models.couponOnBooking.belongsTo(booking)
  }

  return booking
}
