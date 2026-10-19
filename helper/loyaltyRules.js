/**
 * Pure loyalty rules (no database), so they can be tested on their own.
 * helper/loyalty.js loads the data and calls these.
 */

// Allowed settings (agreed with the client, 2026-10-19).
const LIMITS = {
  visitsMin: 2,
  visitsMax: 20,
  percentMin: 5,
  percentMax: 50,
  expiryDaysMax: 730,
}

// A booking in one of these statuses keeps the reward it used on hold.
// Cancelled / declined / expired bookings free it again; complete redeems it;
// no-show forfeits it.
const HOLDING_STATUSES = ['pending', 'book', 'requested', 'save-unpaid']

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

// A service's price after its own standing discount (services.discount is a %).
function servicePrice(svc) {
  const price = Number(svc?.price) || 0
  const discount = Number(svc?.discount) || 0
  return round2(price - (price * discount) / 100)
}

/**
 * Loyalty discount per booked service, in the order given.
 * services: [{ serviceId, price }] with price after the standing discount.
 */
function computeLines(services, percentage, excludedIds = []) {
  const excluded = new Set(excludedIds.map(Number))
  const pct = Number(percentage) || 0
  const lines = services.map((s) => {
    const price = round2(s.price)
    const isExcluded = excluded.has(Number(s.serviceId))
    const loyaltyDiscount = isExcluded ? 0 : Math.min(round2((price * pct) / 100), price)
    return { serviceId: Number(s.serviceId), price, excluded: isExcluded, loyaltyDiscount }
  })
  const loyaltyDiscount = round2(lines.reduce((sum, l) => sum + l.loyaltyDiscount, 0))
  return { lines, loyaltyDiscount }
}

/**
 * Where a card stands:
 *  none      no card yet (no counted visit)
 *  progress  collecting visits
 *  ready     reward earned and free to use
 *  reserved  reward earned and held by an open booking
 *  expired   reward earned but its expiry date has passed
 */
function rewardStatus(card, { now = new Date(), held = false } = {}) {
  if (!card) return 'none'
  if (!card.rewardEarnedAt) return 'progress'
  if (held) return 'reserved'
  if (card.rewardExpiresAt && new Date(card.rewardExpiresAt) <= now) return 'expired'
  return 'ready'
}

/**
 * The card after one more counted visit (expired rewards are cleared first).
 * Returns { card, earned, expired } without touching the input.
 */
function addVisit(card, program, { now = new Date() } = {}) {
  const next = { ...card }
  let expired = false
  if (next.rewardEarnedAt && next.rewardExpiresAt && new Date(next.rewardExpiresAt) <= now) {
    Object.assign(next, clearedReward())
    expired = true
  }
  next.visitCount = (Number(next.visitCount) || 0) + 1
  next.lastVisitAt = now
  let earned = false
  if (!next.rewardEarnedAt && next.visitCount >= Number(program.visitsRequired)) {
    next.rewardEarnedAt = now
    next.rewardPercentage = Number(program.discountPercentage)
    next.rewardExpiresAt = program.rewardExpiryDays
      ? new Date(now.getTime() + Number(program.rewardExpiryDays) * 24 * 60 * 60 * 1000)
      : null
    earned = true
  }
  return { card: next, earned, expired }
}

// Card fields after a reward is used or lost: back to zero visits.
function clearedReward() {
  return { visitCount: 0, rewardEarnedAt: null, rewardExpiresAt: null, rewardPercentage: null }
}

/**
 * Puts the quoted discount on the new jobs (matched by serviceId, in order):
 * each job's total goes down by its share, so commission and rent-a-chair
 * earnings are worked out on the discounted price.
 */
function applyToJobs(jobsInput, lines) {
  const queue = new Map()
  for (const line of lines) {
    if (!queue.has(line.serviceId)) queue.set(line.serviceId, [])
    queue.get(line.serviceId).push(line.loyaltyDiscount)
  }
  return jobsInput.map((job) => {
    const share = queue.get(Number(job.serviceId))?.shift() || 0
    if (!share) return { ...job, loyaltyDiscount: 0 }
    const total = Number(job.total) || 0
    const off = Math.min(share, total)
    return { ...job, loyaltyDiscount: off, total: round2(total - off) }
  })
}

const isInt = (v) => Number.isInteger(Number(v)) && String(v).trim() !== ''

/**
 * Checks shop settings from the business app. Returns { values } or { error }.
 * Only fields present in `input` are returned.
 */
function validateSettings(input = {}) {
  const values = {}
  const has = (k) => input[k] !== undefined

  if (has('isActive')) {
    if (typeof input.isActive !== 'boolean') return { error: 'isActive must be true or false.' }
    values.isActive = input.isActive
  }
  if (has('combineWithCoupon')) {
    if (typeof input.combineWithCoupon !== 'boolean') {
      return { error: 'combineWithCoupon must be true or false.' }
    }
    values.combineWithCoupon = input.combineWithCoupon
  }
  if (has('visitsRequired')) {
    const v = Number(input.visitsRequired)
    if (!isInt(input.visitsRequired) || v < LIMITS.visitsMin || v > LIMITS.visitsMax) {
      return { error: `Number of visits must be between ${LIMITS.visitsMin} and ${LIMITS.visitsMax}.` }
    }
    values.visitsRequired = v
  }
  if (has('discountPercentage')) {
    const p = Number(input.discountPercentage)
    if (!Number.isFinite(p) || p < LIMITS.percentMin || p > LIMITS.percentMax) {
      return { error: `Discount must be between ${LIMITS.percentMin}% and ${LIMITS.percentMax}%.` }
    }
    values.discountPercentage = round2(p)
  }
  if (has('minBookingValue')) {
    if (input.minBookingValue === null || input.minBookingValue === '') {
      values.minBookingValue = null
    } else {
      const m = Number(input.minBookingValue)
      if (!Number.isFinite(m) || m < 0) return { error: 'Minimum booking value must be £0 or more.' }
      values.minBookingValue = m === 0 ? null : round2(m)
    }
  }
  if (has('rewardExpiryDays')) {
    if (input.rewardExpiryDays === null || input.rewardExpiryDays === '' || Number(input.rewardExpiryDays) === 0) {
      values.rewardExpiryDays = null
    } else {
      const d = Number(input.rewardExpiryDays)
      if (!isInt(input.rewardExpiryDays) || d < 1 || d > LIMITS.expiryDaysMax) {
        return { error: `Reward expiry must be between 1 and ${LIMITS.expiryDaysMax} days.` }
      }
      values.rewardExpiryDays = d
    }
  }
  if (has('excludedServiceIds')) {
    if (!Array.isArray(input.excludedServiceIds) || !input.excludedServiceIds.every(isInt)) {
      return { error: 'excludedServiceIds must be a list of service ids.' }
    }
    values.excludedServiceIds = [...new Set(input.excludedServiceIds.map(Number))]
  }
  return { values }
}

module.exports = {
  LIMITS,
  HOLDING_STATUSES,
  round2,
  servicePrice,
  computeLines,
  rewardStatus,
  addVisit,
  clearedReward,
  applyToJobs,
  validateSettings,
}
