/**
 * Idempotent schema setup for mobile barbers (global sync is off).
 * Creates mobileSettings and adds the new columns if missing; safe on every boot.
 * sql/mobile_barber.sql makes the same changes by hand.
 */
async function addMissingColumns(qi, table, columns) {
  const existing = await qi.describeTable(table)
  for (const [name, definition] of Object.entries(columns)) {
    if (existing[name]) continue
    await qi.addColumn(table, name, definition)
    console.log(`[mobileBarberSchema] added column ${table}.${name}`)
  }
}

async function ensureMobileBarberSchema(db) {
  const qi = db.sequelize.getQueryInterface()
  const { DataTypes } = db.Sequelize
  await db.mobileSetting.sync()
  await db.visitReport.sync()
  await addMissingColumns(qi, 'salonDetails', {
    workMode: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'shop' },
  })
  await addMissingColumns(qi, 'bookings', {
    isMobileVisit: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    travelFee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    travelMiles: { type: DataTypes.DECIMAL(6, 1), allowNull: true },
    onTheWayAt: { type: DataTypes.DATE, allowNull: true },
    etaMinutes: { type: DataTypes.INTEGER, allowNull: true },
    arrivedAt: { type: DataTypes.DATE, allowNull: true },
    arrivedDistanceM: { type: DataTypes.INTEGER, allowNull: true }, // metres from the pin at I've arrived
    // Where the barber was at On my way / I've arrived, and checks against fake GPS.
    onTheWayLat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    onTheWayLng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    arrivedLat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    arrivedLng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    arrivedAccuracyM: { type: DataTypes.INTEGER, allowNull: true },
    mockAttempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    // null, 'suspicious' (too fast from On my way) or 'mock' (fake location seen before)
    arrivalFlag: { type: DataTypes.STRING(16), allowNull: true },
    // Client's answer to "Is your barber here?": 'yes', 'no' or 'auto_yes' (no answer in time)
    clientConfirm: { type: DataTypes.STRING(8), allowNull: true },
    clientConfirmAt: { type: DataTypes.DATE, allowNull: true },
    barberRemindedAt: { type: DataTypes.DATE, allowNull: true },
    lateNoticeAt: { type: DataTypes.DATE, allowNull: true },
  })
}

module.exports = { ensureMobileBarberSchema }
