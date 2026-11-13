// Branches (Step A): an owner adds a branch, sees their branches, names the brand.
//
// The brand is created with the owner's second branch. The brand's plan
// (branchLimit, from RevenueCat) decides how many branches may be open; over
// the limit the app shows the branch-plan paywall (code PLAN_LIMIT).
// A new branch starts with the settings of a branch the owner picks (services,
// categories, opening hours, policies, loyalty offer); staff, clients,
// bookings and Stripe are not copied (each branch connects its own Stripe).
const { Op } = require('sequelize')
const db = require('../models')
const AppError = require('../utils/appError')

const { sequelize, brand, salonDetail, employee, addressDBS, category, service, time, loyaltyProgram, loyaltyExcludedService } = db

const SKIP = new Set(['id', 'createdAt', 'updatedAt'])
const plainOf = (row) => Object.fromEntries(Object.entries(row.get({ plain: true })).filter(([k]) => !SKIP.has(k)))

// Copy every row of `model` matching `where`, changing the given fields.
async function copyRows(model, where, change, transaction) {
  const rows = await model.findAll({ where, transaction })
  const idMap = new Map()
  for (const row of rows) {
    const created = await model.create({ ...plainOf(row), ...change(row) }, { transaction })
    idMap.set(row.id, created.id)
  }
  return idMap
}

// The owner's own shops (not chair-renter shops), oldest first.
const ownShopsWhere = (ownerUserId) => ({ userId: ownerUserId, isExternalEmployee: false, deleted: false })

async function myBranches(ownerUserId) {
  const shops = await salonDetail.findAll({
    where: ownShopsWhere(ownerUserId),
    attributes: ['id', 'salonName', 'brandId', 'planSource', 'pausedReason', 'closedAt', 'addressDBId'],
    include: { model: addressDBS, attributes: ['streetAddress', 'city', 'postalCode'], required: false },
    order: [['id', 'ASC']],
  })
  const b = await brand.findOne({ where: { ownerUserId } })
  return {
    brand: b ? { id: b.id, name: b.name, branchLimit: b.branchLimit, planProductId: b.planProductId, planStatus: b.planStatus } : null,
    branches: shops.map((s) => ({
      salonId: s.id,
      name: s.salonName,
      address: [s.addressDB?.streetAddress, s.addressDB?.city, s.addressDB?.postalCode].filter(Boolean).join(', '),
      state: s.closedAt ? 'closed' : s.pausedReason ? 'paused' : 'open',
      planSource: s.planSource,
    })),
  }
}

/**
 * Add a branch. body: { salonName, addressDetail: { streetAddress, city,
 * postalCode, lat, lng, ... }, copyFromSalonId?, businessEmail?,
 * businessCountryCode?, businessPhoneNum?, workMode? }
 */
async function addBranch(ownerUserId, body = {}) {
  const salonName = String(body.salonName || '').trim().slice(0, 255)
  if (!salonName) throw new AppError('Please give the branch a name.', 200)
  const addr = body.addressDetail
  if (!addr || addr.lat == null || addr.lng == null) throw new AppError('Please add the branch address.', 200)

  // The brand exists from the first "Add branch" (kept even if the plan is
  // too small), so the paywall can sell the branch plan to `brand_<id>`.
  await ensureBrand(ownerUserId)

  const result = await sequelize.transaction(async (transaction) => {
    const shops = await salonDetail.findAll({ where: ownShopsWhere(ownerUserId), order: [['id', 'ASC']], transaction })
    const home = shops[0]
    // Locked so two add-branch taps can't both pass the limit.
    const b = await brand.findOne({ where: { ownerUserId }, lock: transaction.LOCK.UPDATE, transaction })
    const open = shops.filter((s) => !s.closedAt && !s.pausedReason).length
    if (open + 1 > b.branchLimit) {
      const err = new AppError(`Your plan covers ${b.branchLimit} ${b.branchLimit === 1 ? 'branch' : 'branches'}. Choose a branch plan to add another.`, 200)
      err.data = { code: 'PLAN_LIMIT', branchLimit: b.branchLimit, openBranches: open, rcAppUserId: b.rcAppUserId }
      throw err
    }

    // Email/phone may repeat within the brand, not with another owner's shop.
    if (body.businessEmail || body.businessPhoneNum) {
      const clash = await salonDetail.findOne({
        where: {
          userId: { [Op.ne]: ownerUserId },
          [Op.or]: [
            ...(body.businessEmail ? [{ businessEmail: body.businessEmail }] : []),
            ...(body.businessPhoneNum ? [{ businessCountryCode: body.businessCountryCode, businessPhoneNum: body.businessPhoneNum }] : []),
          ],
        },
        attributes: ['id'],
        transaction,
      })
      if (clash) throw new AppError('This email or phone number belongs to another business. Please use a different one.', 200)
    }

    const from = shops.find((s) => s.id === Number(body.copyFromSalonId)) || home
    const address = await addressDBS.create(addr, { transaction })
    const branch = await salonDetail.create(
      {
        salonName,
        description: from.description,
        teamSize: from.teamSize,
        addressDBId: address.id,
        userId: ownerUserId,
        onlinePayments: from.onlinePayments,
        businessEmail: body.businessEmail || from.businessEmail,
        businessCountryCode: body.businessCountryCode || from.businessCountryCode,
        businessPhoneNum: body.businessPhoneNum || from.businessPhoneNum,
        isVATRegistered: from.isVATRegistered,
        vatType: from.vatType,
        workMode: ['shop', 'mobile', 'both'].includes(body.workMode) ? body.workMode : from.workMode,
        brandId: b.id,
        planSource: 'brand',
      },
      { transaction },
    )
    const fromOwnerRow = await employee.findOne({ where: { salonDetailId: from.id, userId: ownerUserId, deleted: false }, transaction })
    const ownerRow = await employee.create(
      { position: 'Owner', userId: ownerUserId, salonDetailId: branch.id, isOwner: true, role: 'owner' },
      { transaction },
    )

    // Settings from the chosen branch.
    const to = { salonDetailId: branch.id }
    const categories = await copyRows(category, { salonDetailId: from.id }, () => to, transaction)
    const services = await copyRows(service, { salonDetailId: from.id }, (r) => ({ ...to, categoryId: categories.get(r.categoryId) ?? r.categoryId }), transaction)
    await copyRows(time, { salonDetailId: from.id, employeeId: null }, () => to, transaction)
    if (fromOwnerRow) await copyRows(time, { employeeId: fromOwnerRow.id }, () => ({ ...to, employeeId: ownerRow.id }), transaction)
    for (const name of ['cancellationPolicy', 'depositPolicy', 'paymentPolicy', 'reschedulePolicy', 'noShowPolicy']) {
      if (db[name]) await copyRows(db[name], { salonDetailId: from.id }, () => to, transaction)
    }
    const programs = await copyRows(loyaltyProgram, { salonDetailId: from.id }, () => ({ ...to, startedAt: new Date() }), transaction)
    for (const [oldId, newId] of programs) {
      await copyRows(loyaltyExcludedService, { loyaltyProgramId: oldId }, (r) => ({ loyaltyProgramId: newId, serviceId: services.get(r.serviceId) ?? r.serviceId }), transaction)
    }

    // The brand's plan covers the branch.
    if (b.planProductId) await require('./brandPlan').mirrorBrandPlan(b.id, transaction)
    return { salonId: branch.id, name: branch.salonName, brandId: b.id, copiedFrom: from.id, services: services.size, categories: categories.size }
  })
  return result
}

// The owner's brand, created with their first "Add branch". Their shops join
// it (planSource stays 'own' until the brand plan is bought).
async function ensureBrand(ownerUserId) {
  return sequelize.transaction(async (transaction) => {
    const shops = await salonDetail.findAll({ where: ownShopsWhere(ownerUserId), order: [['id', 'ASC']], transaction })
    if (!shops.length) throw new AppError('Only a shop owner can add a branch.', 200)
    let b = await brand.findOne({ where: { ownerUserId }, transaction })
    if (b) return b
    b = await brand.create({ name: shops[0].salonName, logo: shops[0].coverImage || null, ownerUserId, branchLimit: 1 }, { transaction })
    await b.update({ rcAppUserId: `brand_${b.id}` }, { transaction })
    await salonDetail.update({ brandId: b.id }, { where: { id: shops.map((s) => s.id) }, transaction })
    return b
  })
}

// Bookings still to happen in a branch (closing it would strand them).
async function upcomingBookings(salonId) {
  const today = new Date().toISOString().slice(0, 10)
  return db.booking.count({
    where: { salonDetailId: salonId, status: { [Op.in]: ['book', 'pending', 'requested', 'assign'] }, on: { [Op.gte]: today } },
  })
}

async function ownBranch(ownerUserId, salonId) {
  const shop = await salonDetail.findOne({ where: { ...ownShopsWhere(ownerUserId), id: Number(salonId) } })
  if (!shop) throw new AppError('This branch is not yours.', 200)
  return shop
}

/** Close a branch: hidden from clients, data kept, can be reopened. */
async function closeBranch(ownerUserId, salonId) {
  const shop = await ownBranch(ownerUserId, salonId)
  if (shop.closedAt) return { salonId: shop.id, state: 'closed' }
  const open = await salonDetail.count({ where: { ...ownShopsWhere(ownerUserId), closedAt: null } })
  if (open <= 1) throw new AppError("You can't close your only open branch.", 200)
  const upcoming = await upcomingBookings(shop.id)
  if (upcoming) {
    throw new AppError(`${shop.salonName} has ${upcoming} upcoming ${upcoming === 1 ? 'booking' : 'bookings'}. Complete, move or cancel them before closing the branch.`, 200)
  }
  await shop.update({ closedAt: new Date() })
  return { salonId: shop.id, state: 'closed' }
}

/** Reopen a closed branch, if the brand plan covers one more open branch. */
async function reopenBranch(ownerUserId, salonId) {
  const shop = await ownBranch(ownerUserId, salonId)
  if (!shop.closedAt) return { salonId: shop.id, state: 'open' }
  const b = shop.brandId ? await brand.findByPk(shop.brandId) : null
  const open = await salonDetail.count({ where: { ...ownShopsWhere(ownerUserId), closedAt: null, pausedReason: null } })
  const limit = b ? b.branchLimit : 1
  if (open + 1 > limit) {
    const err = new AppError(`Your plan covers ${limit} ${limit === 1 ? 'branch' : 'branches'}. Choose a branch plan to reopen this one.`, 200)
    err.data = { code: 'PLAN_LIMIT', branchLimit: limit, openBranches: open, rcAppUserId: b?.rcAppUserId || null }
    throw err
  }
  await shop.update({ closedAt: null })
  return { salonId: shop.id, state: 'open' }
}

async function renameBrand(ownerUserId, name) {
  const clean = String(name || '').trim().slice(0, 255)
  if (!clean) throw new AppError('Please give your business a name.', 200)
  const b = await brand.findOne({ where: { ownerUserId } })
  if (!b) throw new AppError('Your business name is your shop name until you add a second branch.', 200)
  await b.update({ name: clean })
  return { id: b.id, name: b.name }
}

module.exports = { addBranch, myBranches, renameBrand, ensureBrand, closeBranch, reopenBranch }
