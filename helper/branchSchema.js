/**
 * Idempotent schema setup for branches and roles (Step A; global sync is off).
 * Creates brands, adds the new salonDetails/employee columns and fills
 * employee.role for rows from before Step A. Safe on every boot.
 * sql/multi_branch.sql makes the same changes by hand.
 */
async function addMissingColumns(qi, table, columns) {
  const existing = await qi.describeTable(table)
  for (const [name, definition] of Object.entries(columns)) {
    if (existing[name]) continue
    await qi.addColumn(table, name, definition)
    console.log(`[branchSchema] added column ${table}.${name}`)
  }
}

async function addIndexOnce(qi, table, fields, name) {
  const indexes = await qi.showIndex(table)
  if (indexes.some((i) => i.name === name)) return
  await qi.addIndex(table, fields, { name })
}

async function ensureBranchSchema(db) {
  const qi = db.sequelize.getQueryInterface()
  const { DataTypes } = db.Sequelize
  await db.brand.sync()
  await addMissingColumns(qi, 'brands', {
    planPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    planCurrency: { type: DataTypes.STRING(8), allowNull: true },
  })
  await db.activityLog.sync() // Step C
  await db.approvalRequest.sync()
  await db.approvalRule.sync()
  await db.trustedDevice.sync()
  await db.loginChallenge.sync()
  await db.customRole.sync()
  await db.sharedSetting.sync()
  // The owner's choice: managers also need two-step login.
  await addMissingColumns(qi, 'users', {
    twoStepForManagers: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  })
  await addMissingColumns(qi, 'salonDetails', {
    brandId: { type: DataTypes.INTEGER, allowNull: true },
    planSource: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'own' },
    pausedReason: { type: DataTypes.STRING(32), allowNull: true },
    closedAt: { type: DataTypes.DATE, allowNull: true },
  })
  await addIndexOnce(qi, 'salonDetails', ['brandId'], 'salonDetails_brandId')
  await addMissingColumns(qi, 'employees', {
    role: { type: DataTypes.STRING(16), allowNull: true },
    bookable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    allBranches: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    // Step C: an owner's custom role, and access to a branch for a period.
    customRoleId: { type: DataTypes.INTEGER, allowNull: true },
    accessFrom: { type: DataTypes.DATE, allowNull: true },
    accessUntil: { type: DataTypes.DATE, allowNull: true },
    accessState: { type: DataTypes.STRING(16), allowNull: true }, // scheduled | active | ended
  })
  // Rows from before Step A: the owner row is 'owner', everyone else 'barber'.
  await db.sequelize.query(
    "UPDATE employees SET role = CASE WHEN isOwner = 1 THEN 'owner' ELSE 'barber' END WHERE role IS NULL",
  )
}

module.exports = { ensureBranchSchema }
