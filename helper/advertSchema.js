/**
 * Idempotent, targeted schema setup for the advert features.
 *
 * The app runs with `sync({ alter: true })` DISABLED (see thetrim.js), so new
 * model columns/tables are NOT auto-created. This helper adds ONLY the advert
 * columns/tables — safely and only if missing — without touching anything else
 * (unlike a global alter, which risks the whole schema). Safe to run every boot.
 */

async function ensureAdvertSchema(db) {
  const qi = db.sequelize.getQueryInterface()
  const { DataTypes } = db.Sequelize

  // 1. New columns on salonDetails (rent + staff advert).
  const columnsToAdd = {
    rentChairAdvertisementRentType: {
      type: DataTypes.STRING(16),
      allowNull: true,
      defaultValue: null,
    },
    rentChairAdvertisementRentAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    },
    staffAdvertisementCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    staffAdvertisementStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    staffAdvertisementWagesType: {
      type: DataTypes.STRING(16),
      allowNull: true,
      defaultValue: null,
    },
    staffAdvertisementWagesAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    },
  }

  let existingColumns = {}
  try {
    existingColumns = await qi.describeTable('salonDetails')
  } catch (err) {
    console.error('[advertSchema] describeTable(salonDetails) failed:', err.message)
    return
  }

  for (const [name, definition] of Object.entries(columnsToAdd)) {
    if (existingColumns[name]) continue
    try {
      await qi.addColumn('salonDetails', name, definition)
      console.log(`[advertSchema] added column salonDetails.${name}`)
    } catch (err) {
      console.error(`[advertSchema] addColumn ${name} failed:`, err.message)
    }
  }

  // 2. New tables for staff advert enquiries + messages.
  // model.sync() (no alter) issues CREATE TABLE IF NOT EXISTS — safe/idempotent.
  for (const modelName of [
    'staffAdvertisementEnquiry',
    'staffAdvertisementEnquiryMessage',
  ]) {
    const model = db[modelName]
    if (!model) {
      console.error(`[advertSchema] model ${modelName} not found`)
      continue
    }
    try {
      await model.sync()
      console.log(`[advertSchema] ensured table for ${modelName}`)
    } catch (err) {
      console.error(`[advertSchema] sync ${modelName} failed:`, err.message)
    }
  }
}

module.exports = { ensureAdvertSchema }
