/**
 * Idempotent schema setup for manual booking approval (global sync is off).
 * Adds only the new columns, and appends 'requested' to bookings.status,
 * keeping every existing enum value and the column's default. Safe every boot.
 */

const parseEnumValues = (type) => {
  const match = /^enum\((.*)\)$/i.exec(String(type || '').trim())
  if (!match) return null
  return match[1].split(',').map((v) => v.trim().replace(/^'|'$/g, ''))
}

async function addMissingColumns(qi, table, columns) {
  let existing
  try {
    existing = await qi.describeTable(table)
  } catch (err) {
    console.error(`[bookingApprovalSchema] describeTable(${table}) failed:`, err.message)
    return null
  }
  for (const [name, definition] of Object.entries(columns)) {
    if (existing[name]) continue
    try {
      await qi.addColumn(table, name, definition)
      console.log(`[bookingApprovalSchema] added column ${table}.${name}`)
    } catch (err) {
      console.error(`[bookingApprovalSchema] addColumn ${table}.${name} failed:`, err.message)
    }
  }
  return existing
}

async function ensureBookingApprovalSchema(db) {
  const qi = db.sequelize.getQueryInterface()
  const { DataTypes } = db.Sequelize

  await addMissingColumns(qi, 'salonDetails', {
    autoAcceptBookings: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    approvalScope: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'all' },
  })

  const bookingColumns = await addMissingColumns(qi, 'bookings', {
    requestExpiresAt: { type: DataTypes.DATE, allowNull: true },
    respondedAt: { type: DataTypes.DATE, allowNull: true },
    requestOutcome: { type: DataTypes.STRING(16), allowNull: true },
    requestReminderSent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    previousOn: { type: DataTypes.DATEONLY, allowNull: true },
    previousStartTime: { type: DataTypes.TIME, allowNull: true },
    previousEndTime: { type: DataTypes.TIME, allowNull: true },
    proposalComment: { type: DataTypes.STRING(500), allowNull: true },
    previousStaffName: { type: DataTypes.STRING(255), allowNull: true },
    proposedAt: { type: DataTypes.DATE, allowNull: true },
    proposalCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    clientDeclineNote: { type: DataTypes.STRING(500), allowNull: true },
    clientDeclinedAt: { type: DataTypes.DATE, allowNull: true },
    respondedByName: { type: DataTypes.STRING(255), allowNull: true },
  })
  if (!bookingColumns || !bookingColumns.status) return

  const values = parseEnumValues(bookingColumns.status.type)
  if (!values) {
    console.error('[bookingApprovalSchema] bookings.status is not an ENUM; skipped')
    return
  }
  if (values.includes('requested')) return

  const escape = (v) => db.sequelize.escape(v)
  const enumSql = [...values, 'requested'].map(escape).join(',')
  const nullSql = bookingColumns.status.allowNull ? 'NULL' : 'NOT NULL'
  const defaultValue = bookingColumns.status.defaultValue
  const defaultSql = defaultValue != null ? ` DEFAULT ${escape(defaultValue)}` : ''
  try {
    await db.sequelize.query(
      `ALTER TABLE \`bookings\` MODIFY COLUMN \`status\` ENUM(${enumSql}) ${nullSql}${defaultSql}`,
    )
    console.log("[bookingApprovalSchema] added 'requested' to bookings.status")
  } catch (err) {
    console.error('[bookingApprovalSchema] extending bookings.status failed:', err.message)
  }
}

module.exports = { ensureBookingApprovalSchema }
