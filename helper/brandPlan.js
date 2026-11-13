// A brand's Trim plan copied onto its branches (Step A). The brand row is the
// truth (RevenueCat writes it, app user id `brand_<id>`); every branch with
// planSource 'brand' carries the same dates and status, so search, booking and
// the apps keep reading the shop row as they do today. Staff are unlimited.
const { brand, salonDetail } = require('../models')

const UNLIMITED_TEAM = 999

async function mirrorBrandPlan(brandId, transaction) {
  const b = await brand.findByPk(brandId, { transaction })
  if (!b) return 0
  const [count] = await salonDetail.update(
    {
      registrationExpiryDate: b.planExpiry ? new Date(b.planExpiry).toISOString().slice(0, 10) : null,
      subscriptionLatestPaymentStatus: b.planStatus || null,
      subscriptionPlan: b.planProductId || null,
      teamSize: UNLIMITED_TEAM,
      // As when a shop buys its own plan (webhook): a paid plan makes the
      // branch listable in Home and search.
      ...(b.planProductId ? { approvedByAdmin: true } : {}),
    },
    { where: { brandId, planSource: 'brand' }, transaction },
  )
  return count
}

module.exports = { mirrorBrandPlan, UNLIMITED_TEAM }
