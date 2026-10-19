/**
 * Idempotent schema setup for the loyalty discount (global sync is off).
 * Creates the four loyalty tables if missing (CREATE TABLE IF NOT EXISTS) and
 * adds only the new booking/job columns. Safe on every boot; sql/loyalty.sql
 * makes the same changes by hand.
 */

async function addMissingColumns(qi, table, columns) {
  let existing
  try {
    existing = await qi.describeTable(table)
  } catch (err) {
    console.error(`[loyaltySchema] describeTable(${table}) failed:`, err.message)
    return
  }
  for (const [name, definition] of Object.entries(columns)) {
    if (existing[name]) continue
    try {
      await qi.addColumn(table, name, definition)
      console.log(`[loyaltySchema] added column ${table}.${name}`)
    } catch (err) {
      console.error(`[loyaltySchema] addColumn ${table}.${name} failed:`, err.message)
    }
  }
}

async function ensureLoyaltySchema(db) {
  const qi = db.sequelize.getQueryInterface()
  const { DataTypes } = db.Sequelize

  await db.loyaltyProgram.sync()
  await db.loyaltyExcludedService.sync()
  await db.loyaltyCard.sync()
  await db.loyaltyEvent.sync()

  await addMissingColumns(qi, 'bookings', {
    loyaltyDiscount: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
    loyaltyPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    loyaltyCardId: { type: DataTypes.INTEGER, allowNull: true },
  })
  await addMissingColumns(qi, 'jobs', {
    loyaltyDiscount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  })
}

module.exports = { ensureLoyaltySchema }
