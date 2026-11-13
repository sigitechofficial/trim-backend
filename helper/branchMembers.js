// Step B: one person working in several branches of the same business.
//
// Each branch has its own employee row for the person (role, permissions,
// hours, services, pay), all sharing their one login (userId). The owner adds
// an existing team member to another branch directly: the person already
// works for this owner, so no invite is needed. A manager can be set over
// all branches; branches added later get a manager row for them too.
const { Op } = require('sequelize')
const db = require('../models')
const AppError = require('../utils/appError')

const { sequelize, salonDetail, employee, employeeAccess, employeeService, employeeWagesMethod, time, service } = db

const SKIP = new Set(['id', 'createdAt', 'updatedAt'])
const plainOf = (row) => Object.fromEntries(Object.entries(row.get({ plain: true })).filter(([k]) => !SKIP.has(k)))

// The owner's own branches (not chair-renter shops).
const ownBranchesWhere = (ownerUserId) => ({ userId: ownerUserId, isExternalEmployee: { [Op.or]: [false, null] }, deleted: { [Op.or]: [false, null] } })

/**
 * Give `source` (an employee row in one of the owner's branches) a row in
 * branch `targetSalonId`, copying role, permissions, hours, matching
 * services (by name) and pay. Returns the new row, or the existing one.
 */
async function addToBranch(ownerUserId, sourceEmployeeId, targetSalonId, { role, transaction } = {}) {
  const run = async (t) => {
    const target = await salonDetail.findOne({ where: { ...ownBranchesWhere(ownerUserId), id: Number(targetSalonId) }, transaction: t })
    if (!target) throw new AppError('This branch is not yours.', 200)
    const source = await employee.findOne({
      where: { id: Number(sourceEmployeeId), deleted: false, isOwner: false, isExternalEmployee: false },
      include: { model: salonDetail, where: ownBranchesWhere(ownerUserId), attributes: ['id'], required: true },
      transaction: t,
    })
    if (!source) throw new AppError('This team member is not in your business.', 200)
    const existing = await employee.findOne({ where: { userId: source.userId, salonDetailId: target.id, deleted: false }, transaction: t })
    if (existing) return { row: existing, created: false }

    const row = await employee.create(
      {
        position: source.position,
        userId: source.userId,
        salonDetailId: target.id,
        isOwner: false,
        isExternalEmployee: false,
        status: true,
        role: role || source.role || 'barber',
        bookable: source.bookable,
        allBranches: source.allBranches,
      },
      { transaction: t },
    )
    const access = await employeeAccess.findAll({ where: { employeeId: source.id }, transaction: t })
    for (const a of access) await employeeAccess.create({ ...plainOf(a), employeeId: row.id }, { transaction: t })
    const hours = await time.findAll({ where: { employeeId: source.id }, transaction: t })
    for (const h of hours) await time.create({ ...plainOf(h), employeeId: row.id, salonDetailId: target.id }, { transaction: t })
    const pay = await employeeWagesMethod.findOne({ where: { employeeId: source.id }, transaction: t })
    if (pay) await employeeWagesMethod.create({ ...plainOf(pay), employeeId: row.id }, { transaction: t })
    // Services are per branch: match the source's services by name.
    const theirs = await employeeService.findAll({ where: { employeeId: source.id }, attributes: ['serviceId'], transaction: t })
    if (theirs.length) {
      const names = await service.findAll({ where: { id: theirs.map((x) => x.serviceId) }, attributes: ['serviceName'], transaction: t })
      const here = await service.findAll({ where: { salonDetailId: target.id, serviceName: names.map((n) => n.serviceName) }, attributes: ['id'], transaction: t })
      for (const sv of here) await employeeService.create({ employeeId: row.id, serviceId: sv.id, salonDetailId: target.id, status: true }, { transaction: t })
    }
    return { row, created: true }
  }
  return transaction ? run(transaction) : sequelize.transaction(run)
}

/** Every branch the person works in (their rows in the owner's branches). */
async function memberBranches(ownerUserId, employeeId) {
  const source = await employee.findByPk(Number(employeeId), { attributes: ['userId'] })
  if (!source) return []
  const rows = await employee.findAll({
    where: { userId: source.userId, deleted: false },
    attributes: ['id', 'salonDetailId', 'role', 'status', 'allBranches'],
    include: { model: salonDetail, where: ownBranchesWhere(ownerUserId), attributes: ['id', 'salonName', 'closedAt'], required: true },
    order: [['salonDetailId', 'ASC']],
  })
  return rows.map((r) => ({ employeeId: r.id, salonId: r.salonDetailId, name: r.salonDetail.salonName, role: r.role, active: r.status, allBranches: r.allBranches }))
}

/**
 * Manager over all branches (on) or only the branches they have now (off).
 * On: every open branch without a row for them gets a manager row.
 */
async function setAllBranches(ownerUserId, employeeId, on) {
  return sequelize.transaction(async (transaction) => {
    const source = await employee.findOne({
      where: { id: Number(employeeId), deleted: false, isOwner: false },
      include: { model: salonDetail, where: ownBranchesWhere(ownerUserId), attributes: ['id'], required: true },
      transaction,
    })
    if (!source) throw new AppError('This team member is not in your business.', 200)
    if ((source.role || 'barber') !== 'manager') throw new AppError('Only a manager can be over all branches.', 200)
    const branches = await salonDetail.findAll({ where: { ...ownBranchesWhere(ownerUserId), closedAt: null }, attributes: ['id'], transaction })
    await employee.update({ allBranches: Boolean(on) }, { where: { userId: source.userId, salonDetailId: branches.map((b) => b.id) }, transaction })
    const added = []
    if (on) {
      for (const b of branches) {
        const r = await addToBranch(ownerUserId, source.id, b.id, { role: 'manager', transaction })
        if (r.created) added.push(b.id)
      }
    }
    return { allBranches: Boolean(on), addedTo: added }
  })
}

/** A new branch: managers over all branches get a row in it. */
async function addAllBranchManagers(ownerUserId, newSalonId, transaction) {
  const managers = await employee.findAll({
    where: { allBranches: true, deleted: false, role: 'manager' },
    include: { model: salonDetail, where: ownBranchesWhere(ownerUserId), attributes: ['id'], required: true },
    transaction,
  })
  const seen = new Set()
  for (const m of managers) {
    if (seen.has(m.userId)) continue
    seen.add(m.userId)
    await addToBranch(ownerUserId, m.id, newSalonId, { role: 'manager', transaction })
  }
  return seen.size
}

module.exports = { addToBranch, memberBranches, setAllBranches, addAllBranchManagers }
