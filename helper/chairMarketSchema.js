/**
 * Idempotent schema setup for the chair market (global sync is off).
 * Creates the tables and columns if missing; safe on every boot.
 * sql/chair_market.sql makes the same changes by hand.
 */
async function addMissingColumns(qi, table, columns) {
  const existing = await qi.describeTable(table)
  for (const [name, definition] of Object.entries(columns)) {
    if (existing[name]) continue
    await qi.addColumn(table, name, definition)
    console.log(`[chairMarketSchema] added column ${table}.${name}`)
  }
}

async function ensureChairMarketSchema(db) {
  const qi = db.sequelize.getQueryInterface()
  const { DataTypes } = db.Sequelize
  await db.renterWorkPref.sync()
  await db.chairOffer.sync()
  await db.chairOfferRound.sync()
  await db.shopChairListing.sync()
  await addMissingColumns(qi, 'renterWorkPrefs', {
    skills: { type: DataTypes.STRING(255), allowNull: true },
    hiddenShopIds: { type: DataTypes.TEXT, allowNull: true },
  })
}

module.exports = { ensureChairMarketSchema }
