// Custom roles (Step C, proposal "Custom roles").
//
// An owner makes their own role from a standard one: a name, the standard
// role it is based on (barber / receptionist / manager), whether its people
// take bookings, and a level for each permission. The levels are copied into
// employeeAccess for everyone holding the role, so every permission check
// works as before; changing the role updates all of them at once.
//
// Safety: permissions only go up to what a Manager can be given; the owner's
// own powers (subscription, branches, pay, adverts, approvals) are owner-only
// routes, so no role can grant them.
const { Op } = require('sequelize')
const db = require('../models')
const AppError = require('../utils/appError')
const { LABELS, PRESETS, ROLES } = require('./roles')

const LEVELS = ['none', 'low', 'high']
const KEYS = Object.keys(LABELS)

const ownBranchIds = async (ownerUserId, transaction) =>
  (await db.salonDetail.findAll({
    where: { userId: ownerUserId, isExternalEmployee: { [Op.or]: [false, null] }, deleted: { [Op.or]: [false, null] } },
    attributes: ['id'],
    transaction,
  })).map((s) => s.id)

/** Levels for every key, cleaned: unknown keys dropped, missing ones from the base role. */
function cleanLevels(baseRole, levels = {}) {
  const base = PRESETS[baseRole] || {}
  const out = {}
  for (const k of KEYS) {
    const v = levels[k]
    out[k] = LEVELS.includes(v) ? v : LEVELS.includes(base[k]) ? base[k] : 'none'
  }
  return out
}

function cleanInput(body = {}) {
  const name = String(body.name || '').trim().slice(0, 60)
  if (!name) throw new AppError('Please give the role a name.', 200)
  const baseRole = ROLES.includes(body.baseRole) ? body.baseRole : 'barber'
  const bookable = body.bookable === undefined ? baseRole === 'barber' : !['false', '0', false, 0].includes(body.bookable)
  return { name, baseRole, bookable, levels: cleanLevels(baseRole, body.levels) }
}

const view = (r, holders = 0) => ({
  id: r.id,
  name: r.name,
  baseRole: r.baseRole,
  bookable: !!r.bookable,
  levels: typeof r.levels === 'string' ? JSON.parse(r.levels) : r.levels,
  holders,
})

async function list(ownerUserId) {
  const rows = await db.customRole.findAll({ where: { ownerUserId, deleted: false }, order: [['name', 'ASC']] })
  const counts = rows.length
    ? await db.employee.findAll({
        where: { customRoleId: rows.map((r) => r.id), deleted: false },
        attributes: ['customRoleId', [db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('userId'))), 'n']],
        group: ['customRoleId'],
        raw: true,
      })
    : []
  const countOf = new Map(counts.map((c) => [c.customRoleId, Number(c.n)]))
  return rows.map((r) => view(r, countOf.get(r.id) || 0))
}

async function ownersRole(ownerUserId, id, transaction) {
  const r = await db.customRole.findOne({ where: { id: Number(id), ownerUserId, deleted: false }, transaction })
  if (!r) throw new AppError('Role not found.', 200)
  return r
}

/** employeeAccess rows for one person from a role's levels (replaces theirs). */
async function applyToEmployee(roleRow, employeeId, transaction) {
  const levels = typeof roleRow.levels === 'string' ? JSON.parse(roleRow.levels) : roleRow.levels
  await db.employeeAccess.destroy({ where: { employeeId }, transaction })
  await db.employeeAccess.bulkCreate(
    KEYS.map((key) => ({ employeeId, key, level: levels[key] || 'none', access: LABELS[key], status: true })),
    { transaction },
  )
  await db.employee.update(
    { customRoleId: roleRow.id, role: roleRow.baseRole, bookable: !!roleRow.bookable },
    { where: { id: employeeId }, transaction },
  )
}

async function create(ownerUserId, body) {
  const data = cleanInput(body)
  const clash = await db.customRole.findOne({ where: { ownerUserId, name: data.name, deleted: false } })
  if (clash) throw new AppError('You already have a role with this name.', 200)
  return view(await db.customRole.create({ ownerUserId, ...data }))
}

/** Change a role; everyone holding it (in any branch) gets the new levels. */
async function update(ownerUserId, id, body) {
  return db.sequelize.transaction(async (transaction) => {
    const r = await ownersRole(ownerUserId, id, transaction)
    const data = cleanInput({ ...view(r), ...body })
    const clash = await db.customRole.findOne({ where: { ownerUserId, name: data.name, deleted: false, id: { [Op.ne]: r.id } }, transaction })
    if (clash) throw new AppError('You already have a role with this name.', 200)
    await r.update(data, { transaction })
    const holders = await db.employee.findAll({
      where: { customRoleId: r.id, deleted: false, salonDetailId: await ownBranchIds(ownerUserId, transaction) },
      attributes: ['id'],
      transaction,
    })
    for (const h of holders) await applyToEmployee(r, h.id, transaction)
    return { role: view(r, holders.length), updated: holders.length }
  })
}

/** Delete a role: its people keep their current access, without the role. */
async function remove(ownerUserId, id) {
  const r = await ownersRole(ownerUserId, id)
  await db.employee.update({ customRoleId: null }, { where: { customRoleId: r.id } })
  await r.update({ deleted: true })
  return { id: r.id }
}

/** Give a team member (one branch row) a custom role, or take it off (roleId null). */
async function assign(ownerUserId, employeeId, roleId) {
  return db.sequelize.transaction(async (transaction) => {
    const e = await db.employee.findOne({
      where: { id: Number(employeeId), deleted: false, isOwner: false, isExternalEmployee: { [Op.or]: [false, null] }, salonDetailId: await ownBranchIds(ownerUserId, transaction) },
      transaction,
    })
    if (!e) throw new AppError('This team member is not in your business.', 200)
    if (!roleId) {
      await e.update({ customRoleId: null }, { transaction })
      return { employeeId: e.id, customRoleId: null }
    }
    const r = await ownersRole(ownerUserId, roleId, transaction)
    await applyToEmployee(r, e.id, transaction)
    return { employeeId: e.id, customRoleId: r.id, role: r.baseRole }
  })
}

/** For AddEmployee: the role row if it is the acting owner's, else null. */
async function forNewMember(ownerUserId, roleId) {
  if (!roleId) return null
  return db.customRole.findOne({ where: { id: Number(roleId), ownerUserId, deleted: false } })
}

module.exports = { KEYS, cleanLevels, cleanInput, list, create, update, remove, assign, applyToEmployee, forNewMember }
