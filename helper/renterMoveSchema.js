/**
 * Idempotent schema setup for chair renters moving shop (global sync is off).
 * Creates renterMoves if missing and adds the columns added since.
 * Safe on every boot; sql/renter_move.sql makes the same changes by hand.
 */

async function addMissingColumns(qi, table, columns) {
  let existing
  try {
    existing = await qi.describeTable(table)
  } catch (err) {
    console.error(`[renterMoveSchema] describeTable(${table}) failed:`, err.message)
    return
  }
  for (const [name, definition] of Object.entries(columns)) {
    if (existing[name]) continue
    try {
      await qi.addColumn(table, name, definition)
      console.log(`[renterMoveSchema] added column ${table}.${name}`)
    } catch (err) {
      console.error(`[renterMoveSchema] addColumn ${table}.${name} failed:`, err.message)
    }
  }
}

async function ensureRenterMoveSchema(db) {
  const qi = db.sequelize.getQueryInterface()
  const { DataTypes } = db.Sequelize

  await db.renterMove.sync()

  await addMissingColumns(qi, 'salonDetails', {
    renterGraceUntil: { type: DataTypes.DATEONLY, allowNull: true },
    renterPlanReminderDays: { type: DataTypes.INTEGER, allowNull: true },
  })
  await addMissingColumns(qi, 'renterMoves', {
    graceReminderAt: { type: DataTypes.DATE, allowNull: true },
    graceEndedAt: { type: DataTypes.DATE, allowNull: true },
  })
  await addMissingColumns(qi, 'bookings', {
    visitAddressId: { type: DataTypes.INTEGER, allowNull: true },
  })
  await addMissingColumns(qi, 'employees', {
    leftAt: { type: DataTypes.DATE, allowNull: true },
  })
}

module.exports = { ensureRenterMoveSchema }
