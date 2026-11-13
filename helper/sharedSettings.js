// Shared settings (Step C, proposal Part 6).
//
// For each setting below the owner chooses: each branch keeps its own
// ('branch'), the same in all branches ('all'), or the same in all branches
// and only the owner may change it ('locked'). When the owner saves a shared
// setting in any branch, it is copied to every other branch; new branches get
// it too. A locked setting refuses changes from anyone but the owner.
//
// Copying works on the data, the way each setting stores it: policies are
// versioned rows (the old version is kept, switched off), booking approval is
// two fields on the shop, the loyalty offer goes through loyalty.saveSettings
// with excluded services matched by name.
const { Op } = require('sequelize')
const db = require('../models')
const AppError = require('../utils/appError')

const POLICY_MODELS = {
  cancellation: 'cancellationPolicy',
  deposit: 'depositPolicy',
  noShow: 'noShowPolicy',
  reschedule: 'reschedulePolicy',
}

// key → { label, routes: [[method, mount, path]] }
const SETTINGS = {
  cancellation: { label: 'Cancellation policy', routes: [['POST', '/salon/v1', '/updateCancellationPolicies']] },
  deposit: { label: 'Deposit policy', routes: [['POST', '/salon/v1', '/updateDepositPolicies']] },
  noShow: { label: 'No-show policy', routes: [['POST', '/salon/v1', '/updateNoShowPolicies']] },
  reschedule: { label: 'Reschedule policy', routes: [['POST', '/salon/v1', '/updatereschedulePolicy']] },
  loyalty: { label: 'Loyalty offer', routes: [['PUT', '/salon/v1', '/loyalty']] },
  bookingApproval: { label: 'Booking approval', routes: [['PATCH', '/salon/v1', '/booking-approval']] },
}
const STATES = ['branch', 'all', 'locked']

function keyFor(method, mount, path) {
  for (const [key, s] of Object.entries(SETTINGS)) {
    if (s.routes.some(([m, mt, p]) => m === method && mt === mount && p === path)) return key
  }
  return null
}

const ownBranchesWhere = (ownerUserId) => ({
  userId: ownerUserId,
  isExternalEmployee: { [Op.or]: [false, null] },
  deleted: { [Op.or]: [false, null] },
  closedAt: null,
})

async function ownBranchIds(ownerUserId) {
  return (await db.salonDetail.findAll({ where: ownBranchesWhere(ownerUserId), attributes: ['id'], order: [['id', 'ASC']] })).map((s) => s.id)
}

/** { key: 'branch' | 'all' | 'locked' } for an owner (no row = 'branch'). */
async function statesFor(ownerUserId) {
  const rows = await db.sharedSetting.findAll({ where: { ownerUserId } })
  const saved = Object.fromEntries(rows.map((r) => [r.key, r.state]))
  return Object.fromEntries(Object.keys(SETTINGS).map((k) => [k, STATES.includes(saved[k]) ? saved[k] : 'branch']))
}

async function stateOf(ownerUserId, key) {
  const r = await db.sharedSetting.findOne({ where: { ownerUserId, key } })
  return r && STATES.includes(r.state) ? r : null
}

const SKIP = new Set(['id', 'createdAt', 'updatedAt'])
const plain = (row) => Object.fromEntries(Object.entries(row.get({ plain: true })).filter(([k]) => !SKIP.has(k)))

/** Copy one setting from a branch to another (same owner). */
async function copySetting(key, fromId, toId, transaction) {
  if (fromId === toId) return
  if (POLICY_MODELS[key]) {
    const M = db[POLICY_MODELS[key]]
    const source = await M.findAll({ where: { salonDetailId: fromId, status: true }, transaction })
    if (!source.length) return
    const current = await M.findOne({ where: { salonDetailId: toId, status: true }, order: [['version', 'DESC']], transaction })
    const latest = await M.max('version', { where: { salonDetailId: toId }, transaction })
    const version = Math.max(Number(latest) || 0, Number(current?.version) || 0) + 1
    await M.update({ status: false }, { where: { salonDetailId: toId, status: true }, transaction })
    await M.bulkCreate(source.map((r) => ({ ...plain(r), salonDetailId: toId, version, status: true })), { transaction })
    return
  }
  if (key === 'bookingApproval') {
    const s = await db.salonDetail.findByPk(fromId, { attributes: ['autoAcceptBookings', 'approvalScope'], transaction })
    if (s) await db.salonDetail.update({ autoAcceptBookings: s.autoAcceptBookings, approvalScope: s.approvalScope }, { where: { id: toId }, transaction })
    return
  }
  if (key === 'loyalty') {
    const loyalty = require('./loyalty')
    const s = await loyalty.settingsForShop(fromId)
    if (!s.configured) return
    // Excluded services: the same services in the other branch, by name.
    let excludedServiceIds = []
    if (s.excludedServiceIds?.length) {
      const names = (await db.service.findAll({ where: { id: s.excludedServiceIds }, attributes: ['serviceName'] })).map((x) => x.serviceName)
      excludedServiceIds = (await db.service.findAll({ where: { salonDetailId: toId, serviceName: names }, attributes: ['id'] })).map((x) => x.id)
    }
    const { error } = await loyalty.saveSettings(toId, {
      isActive: s.isActive,
      visitsRequired: s.visitsRequired,
      discountPercentage: s.discountPercentage,
      combineWithCoupon: s.combineWithCoupon,
      minBookingValue: s.minBookingValue,
      rewardExpiryDays: s.rewardExpiryDays,
      excludedServiceIds,
    })
    if (error) console.warn(`[sharedSettings] loyalty copy ${fromId} → ${toId}: ${error}`)
  }
}

/** Copy a setting from one branch to all the owner's other open branches. */
async function spread(ownerUserId, key, fromId) {
  const ids = (await ownBranchIds(ownerUserId)).filter((id) => id !== fromId)
  for (const toId of ids) {
    try {
      await db.sequelize.transaction((t) => copySetting(key, fromId, toId, t))
    } catch (err) {
      console.error(`[sharedSettings] ${key} ${fromId} → ${toId} failed:`, err.message)
    }
  }
  await db.sharedSetting.update({ sourceSalonId: fromId }, { where: { ownerUserId, key } })
  return ids.length
}

/**
 * The owner changes where a setting applies. Going to 'all' or 'locked'
 * copies it now from `fromId` (the branch they are in) to every branch.
 */
async function setState(ownerUserId, key, state, fromId, userId) {
  if (!SETTINGS[key]) throw new AppError('Unknown setting.', 200)
  if (!STATES.includes(state)) throw new AppError('Choose where this setting applies.', 200)
  const row = await db.sharedSetting.findOne({ where: { ownerUserId, key } })
  if (row) await row.update({ state, updatedByUserId: userId })
  else await db.sharedSetting.create({ ownerUserId, key, state, sourceSalonId: fromId, updatedByUserId: userId })
  const copied = state === 'branch' ? 0 : await spread(ownerUserId, key, fromId)
  return { key, state, copiedTo: copied }
}

/** A new branch: every shared setting comes from the branch it was last set in. */
async function applyToNewBranch(ownerUserId, newSalonId) {
  const rows = await db.sharedSetting.findAll({ where: { ownerUserId, state: { [Op.in]: ['all', 'locked'] } } })
  for (const r of rows) {
    if (!r.sourceSalonId || r.sourceSalonId === newSalonId) continue
    try {
      await db.sequelize.transaction((t) => copySetting(r.key, r.sourceSalonId, newSalonId, t))
    } catch (err) {
      console.error(`[sharedSettings] new branch ${newSalonId} ${r.key} failed:`, err.message)
    }
  }
}

module.exports = { SETTINGS, STATES, keyFor, statesFor, stateOf, setState, spread, copySetting, applyToNewBranch }
