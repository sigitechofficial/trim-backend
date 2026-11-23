// A brand's Trim plan (Step A). The brand row is the truth; RevenueCat writes
// it (app user id `brand_<id>`, products `trimbiz_branches_<N>`). Every
// branch with planSource 'brand' carries the same dates and status, so search,
// booking and the apps keep reading the shop row as they do today. Staff are
// unlimited on branch plans.
//
// Timing (as the stores do it): an upgrade takes effect now; a downgrade is
// kept as pendingProductId and applied at the next renewal. When the plan
// covers fewer open branches than the brand has, the newest ones are paused
// (pausedReason 'plan_limit'); they come back, oldest first, when the plan
// covers them again. Branches the owner closed are left alone.
const { Op } = require('sequelize')
const db = require('../models')

const { brand, salonDetail } = db

const UNLIMITED_TEAM = 999
const PLAN_LIMIT = 'plan_limit'

/** Branches a product covers: trimbiz_branches_3 → 3; enterprise → 999; else null. */
function branchLimitForProduct(productId) {
  const id = String(productId || '')
  // iOS trimbiz_branches_3; Google base plan trimbiz_monthly:trimbiz-branches-3
  const m = id.match(/branches[-_](\d+)/)
  if (m) return Number(m[1])
  if (/branches[-_]enterprise/.test(id)) return UNLIMITED_TEAM
  return null
}

// A brand that went back to one shop keeps its store subscription on the
// brand id and can switch it to a staff plan (same subscription group), so the
// brand also understands the staff products: headcount = owner + staff.
const STAFF_PLANS = {
  trimbiz_monthly_owner: [1, 'Owner Only'],
  trimbiz_owner_one_staff: [2, 'Owner + 1 staff member'],
  trimbiz_owner_two_staff: [3, 'Owner + 2 staff members'],
  trimbiz_owner_three_staff: [4, 'Owner + 3 staff members'],
  trimbiz_owner_four_staff: [5, 'Owner + 4 staff members'],
  trimbiz_owner_five_staff: [6, 'Owner + 5 staff members'],
  trimbiz_owner_unlimited_staff: [UNLIMITED_TEAM, 'Owner + Unlimited staff'],
  'trimbiz_monthly:trimbiz-monthly-owner': [1, 'Owner Only'],
  'trimbiz_monthly:trimbiz-owner-one-staff': [2, 'Owner + 1 staff member'],
  'trimbiz_monthly:trimbiz-owner-two-staff': [3, 'Owner + 2 staff members'],
  'trimbiz_monthly:trimbiz-owner-three-staff': [4, 'Owner + 3 staff members'],
  'trimbiz_monthly:trimbiz-owner-four-staff': [5, 'Owner + 4 staff members'],
  'trimbiz_monthly:trimbiz-owner-five-staff': [6, 'Owner + 5 staff members'],
  'trimbiz_monthly:trimbiz-owner-unlimited-staff': [UNLIMITED_TEAM, 'Owner + Unlimited staff'],
}

/** Owner + staff a staff product allows (999 = unlimited); null for other products. */
const staffHeadcountForProduct = (productId) => STAFF_PLANS[String(productId || '')]?.[0] ?? null

/** Team size a brand plan gives each branch: unlimited on branch plans. */
const teamSizeForProduct = (productId) => staffHeadcountForProduct(productId) ?? UNLIMITED_TEAM

/** Branches a brand product covers: its branch count, 1 for a staff plan, else null. */
const coveredBranches = (productId) => branchLimitForProduct(productId) ?? (staffHeadcountForProduct(productId) != null ? 1 : null)

/** Plan order for upgrade vs downgrade: any branch plan is above any staff plan. */
function planRank(productId) {
  const b = branchLimitForProduct(productId)
  if (b) return 1000 + b
  return staffHeadcountForProduct(productId) ?? 0
}

/** The plan's name as the apps show it ("Owner + 1 branch", "Owner + 2 staff members"). */
function planNameForProduct(productId) {
  const b = branchLimitForProduct(productId)
  if (b) return `Owner + ${b - 1} branch${b - 1 === 1 ? '' : 'es'}`
  return STAFF_PLANS[String(productId || '')]?.[1] ?? null
}

/**
 * A store event for a shop (app user id = shop id) whose branch the brand's
 * plan now covers, e.g. the shop's old staff plan ending after the brand
 * bought a branch plan. The brand is the truth, so the shop handlers must not
 * write over the branch row.
 */
async function isBrandCoveredShopEvent(event = {}) {
  const id = [event.app_user_id, event.original_app_user_id].find((x) => /^\d+$/.test(String(x || '')))
  if (!id) return false
  const shop = await salonDetail.findByPk(Number(id), { attributes: ['id', 'planSource', 'brandId'] })
  if (!shop || shop.planSource !== 'brand' || !shop.brandId) return false
  const b = await brand.findByPk(shop.brandId, { attributes: ['id', 'planProductId'] })
  return !!b?.planProductId
}

async function mirrorBrandPlan(brandId, transaction) {
  const b = await brand.findByPk(brandId, { transaction })
  if (!b) return 0
  const [count] = await salonDetail.update(
    {
      registrationExpiryDate: b.planExpiry ? new Date(b.planExpiry).toISOString().slice(0, 10) : null,
      subscriptionLatestPaymentStatus: b.planStatus || null,
      subscriptionPlan: b.planProductId || null,
      // Branch plans: staff unlimited. A staff plan on the brand: its headcount.
      teamSize: teamSizeForProduct(b.planProductId),
      // As when a shop buys its own plan (webhook): a paid plan makes the
      // branch listable in Home and search.
      ...(b.planProductId ? { approvedByAdmin: true } : {}),
    },
    { where: { brandId, planSource: 'brand' }, transaction },
  )
  return count
}

/**
 * Pause the newest open branches over the plan's limit; unpause plan-limit
 * pauses, oldest first, while there is room. Returns { paused, unpaused }.
 */
async function enforceBranchLimit(brandId, transaction) {
  const b = await brand.findByPk(brandId, { transaction })
  if (!b) return { paused: [], unpaused: [] }
  const rows = await salonDetail.findAll({
    where: { brandId, closedAt: null, isExternalEmployee: { [Op.or]: [false, null] }, deleted: { [Op.or]: [false, null] } },
    attributes: ['id', 'pausedReason'],
    order: [['id', 'ASC']],
    transaction,
  })
  // Paused for another reason: not ours to change, and not using a place.
  const ours = rows.filter((r) => !r.pausedReason || r.pausedReason === PLAN_LIMIT)
  const keep = new Set(ours.slice(0, Math.max(1, b.branchLimit)).map((r) => r.id))
  const paused = []
  const unpaused = []
  for (const r of ours) {
    if (keep.has(r.id) && r.pausedReason === PLAN_LIMIT) {
      await r.update({ pausedReason: null }, { transaction })
      unpaused.push(r.id)
    } else if (!keep.has(r.id) && !r.pausedReason) {
      await r.update({ pausedReason: PLAN_LIMIT }, { transaction })
      paused.push(r.id)
    }
  }
  return { paused, unpaused }
}

/** The brand an event is about (any of its ids is `brand_<id>`), or null. */
async function brandFromEvent(event = {}) {
  const ids = [
    event.app_user_id,
    event.original_app_user_id,
    ...(Array.isArray(event.aliases) ? event.aliases : []),
    ...(Array.isArray(event.transferred_to) ? event.transferred_to : []),
  ].filter((x) => typeof x === 'string')
  const rc = ids.find((x) => /^brand_\d+$/.test(x))
  return rc ? brand.findOne({ where: { rcAppUserId: rc } }) : null
}

const expiryOf = (event) => (event.expiration_at_ms ? new Date(Number(event.expiration_at_ms)) : null)

/**
 * Apply one RevenueCat event to a brand. Returns true when the event was a
 * brand's (the shop handlers must then not run), false otherwise.
 */
async function handleBrandEvent(event = {}) {
  const b = await brandFromEvent(event)
  if (!b) return false
  const type = event.type
  await db.sequelize.transaction(async (transaction) => {
    const row = await brand.findByPk(b.id, { lock: transaction.LOCK.UPDATE, transaction })
    const patch = {}
    const product = event.product_id
    const limit = coveredBranches(product)

    if (['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'SUBSCRIPTION_EXTENDED'].includes(type)) {
      // A renewal applies a downgrade asked for earlier (the store renews on
      // the new product).
      patch.planProductId = product || row.planProductId
      if (limit) patch.branchLimit = limit
      if (row.pendingProductId && row.pendingProductId === product) patch.pendingProductId = null
      patch.planStatus = 'payment_succeeded'
      if (expiryOf(event)) patch.planExpiry = expiryOf(event)
      const paid = Number(event.price_in_purchased_currency)
      if (paid > 0 && event.currency) {
        patch.planPrice = paid
        patch.planCurrency = String(event.currency).toLowerCase()
      }
    } else if (type === 'PRODUCT_CHANGE') {
      const next = event.new_product_id
      const nextLimit = coveredBranches(next)
      if (nextLimit && planRank(next) > planRank(row.planProductId)) {
        // Upgrade (more branches, or a staff plan → a branch plan): now.
        patch.planProductId = next
        patch.branchLimit = nextLimit
        patch.pendingProductId = null
        patch.planPrice = null // known again at the next renewal; list price meanwhile
        patch.planCurrency = null
      } else if (nextLimit) {
        // Downgrade (fewer branches, or back to a staff plan): from the next renewal.
        patch.pendingProductId = next
      }
    } else if (type === 'CANCELLATION') {
      patch.planStatus = 'cancelled' // still active until the expiry date
    } else if (type === 'BILLING_ISSUE') {
      patch.planStatus = 'payment_failed'
      if (expiryOf(event)) patch.planExpiry = expiryOf(event) // the store's grace period
    } else if (type === 'EXPIRATION') {
      patch.planStatus = 'expired'
    } else if (type === 'SUBSCRIPTION_PAUSED') {
      patch.planStatus = 'paused'
    }
    // TRANSFER into the brand id (an owner moving their shop's purchase to the
    // brand) and anything else: nothing to undo; later events set the plan.

    if (Object.keys(patch).length) await row.update(patch, { transaction })

    // First brand plan: every open branch is now covered by it.
    if (patch.planProductId) {
      await salonDetail.update(
        { planSource: 'brand' },
        { where: { brandId: row.id, closedAt: null, isExternalEmployee: { [Op.or]: [false, null] } }, transaction },
      )
    }
    await mirrorBrandPlan(row.id, transaction)
    if (patch.branchLimit) await enforceBranchLimit(row.id, transaction)
  })
  console.log(`[brandPlan] ${type} applied to brand ${b.id} (${b.rcAppUserId})`)
  return true
}

/**
 * Nightly check: every brand with a branch plan. A branch that no longer
 * matches the brand (dates, status, plan, staff limit, listing) is re-copied;
 * a plan past its expiry with no webhook seen is marked expired; the branch
 * limit is applied again. Returns a summary and logs what it changed.
 */
async function checkBrandPlans(now = new Date()) {
  const summary = { brands: 0, remirrored: 0, expired: 0, paused: 0, unpaused: 0 }
  const brands = await brand.findAll({ where: { planProductId: { [Op.ne]: null } } })
  for (const b of brands) {
    summary.brands++
    await db.sequelize.transaction(async (transaction) => {
      const row = await brand.findByPk(b.id, { lock: transaction.LOCK.UPDATE, transaction })
      const expired = row.planExpiry && new Date(row.planExpiry) < now && row.planStatus !== 'expired'
      if (expired) {
        await row.update({ planStatus: 'expired' }, { transaction })
        summary.expired++
        console.warn(`[brandPlan] brand ${row.id}: plan past its expiry with no webhook; marked expired`)
      }
      const want = {
        registrationExpiryDate: row.planExpiry ? new Date(row.planExpiry).toISOString().slice(0, 10) : null,
        subscriptionLatestPaymentStatus: row.planStatus || null,
        subscriptionPlan: row.planProductId || null,
        teamSize: teamSizeForProduct(row.planProductId),
      }
      const branches = await salonDetail.findAll({
        where: { brandId: row.id, planSource: 'brand' },
        attributes: ['id', 'registrationExpiryDate', 'subscriptionLatestPaymentStatus', 'subscriptionPlan', 'teamSize', 'approvedByAdmin'],
        transaction,
      })
      const drift = branches.filter((x) =>
        String(x.registrationExpiryDate || '') !== String(want.registrationExpiryDate || '') ||
        (x.subscriptionLatestPaymentStatus || null) !== want.subscriptionLatestPaymentStatus ||
        (x.subscriptionPlan || null) !== want.subscriptionPlan ||
        Number(x.teamSize) !== want.teamSize ||
        !x.approvedByAdmin)
      if (drift.length || expired) {
        await mirrorBrandPlan(row.id, transaction)
        summary.remirrored += drift.length
        if (drift.length) console.warn(`[brandPlan] brand ${row.id}: re-copied the plan to branches ${drift.map((x) => x.id).join(', ')}`)
      }
      const { paused, unpaused } = await enforceBranchLimit(row.id, transaction)
      summary.paused += paused.length
      summary.unpaused += unpaused.length
    })
  }
  return summary
}

module.exports = { isBrandCoveredShopEvent, staffHeadcountForProduct, teamSizeForProduct, planNameForProduct, coveredBranches, planRank, mirrorBrandPlan, enforceBranchLimit, handleBrandEvent, checkBrandPlans, branchLimitForProduct, brandFromEvent, UNLIMITED_TEAM, PLAN_LIMIT }
