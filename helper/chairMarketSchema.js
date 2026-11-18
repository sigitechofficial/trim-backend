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
  await addMissingColumns(qi, 'chairOffers', {
    kind: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'chair' },
    source: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'business' },
    applicantInfo: { type: DataTypes.TEXT, allowNull: true },
    payType: { type: DataTypes.STRING(16), allowNull: true },
    coversPlan: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    planWish: { type: DataTypes.STRING(8), allowNull: true },
    stage: { type: DataTypes.STRING(16), allowNull: true },
    startAsks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    startAskedOn: { type: DataTypes.DATEONLY, allowNull: true },
  })
  // Client app applicants have no renter shop yet.
  const offerCols = await qi.describeTable('chairOffers')
  if (offerCols.renterSalonId && offerCols.renterSalonId.allowNull === false) {
    await qi.changeColumn('chairOffers', 'renterSalonId', { type: DataTypes.INTEGER, allowNull: true })
    console.log('[chairMarketSchema] chairOffers.renterSalonId can now be empty')
  }
  await addMissingColumns(qi, 'chairOfferRounds', {
    payType: { type: DataTypes.STRING(16), allowNull: true },
  })
  await addMissingColumns(qi, 'shopChairListings', {
    coversPlan: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    // Days the shop wants someone in the chair ("Monday,Friday"); empty = any.
    days: { type: DataTypes.STRING(80), allowNull: true },
  })
  await addMissingColumns(qi, 'salonDetails', {
    renterCoveredBy: { type: DataTypes.INTEGER, allowNull: true },
    renterOwnExpiry: { type: DataTypes.DATEONLY, allowNull: true },
    renterOwnStatus: { type: DataTypes.STRING(32), allowNull: true },
    renterGraceCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    renterUncoveredBy: { type: DataTypes.INTEGER, allowNull: true },
    // Days the staff advert needs someone ("Monday,Friday"); empty = any.
    staffAdvertisementDays: { type: DataTypes.STRING(80), allowNull: true },
  })
}

module.exports = { ensureChairMarketSchema }
