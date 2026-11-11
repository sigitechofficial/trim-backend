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
    barberRemindedAt: { type: DataTypes.DATE, allowNull: true },
    lateNoticeAt: { type: DataTypes.DATE, allowNull: true },
  })
}

module.exports = { ensureMobileBarberSchema }
