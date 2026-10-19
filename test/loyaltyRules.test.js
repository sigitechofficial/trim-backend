// Run: node --test test/
const test = require('node:test')
const assert = require('node:assert/strict')
const r = require('../helper/loyaltyRules')

test('servicePrice applies the standing discount and rounds to pennies', () => {
  assert.equal(r.servicePrice({ price: '15.00', discount: 15 }), 12.75)
  assert.equal(r.servicePrice({ price: '12.99', discount: 7 }), 12.08)
  assert.equal(r.servicePrice({ price: '20', discount: 0 }), 20)
  assert.equal(r.servicePrice({ price: null }), 0)
})

test('computeLines skips excluded services and keeps order', () => {
  const { lines, loyaltyDiscount } = r.computeLines(
    [
      { serviceId: 1, price: 20 },
      { serviceId: 2, price: 8.5 },
      { serviceId: 3, price: 12.75 },
    ],
    10,
    [2],
  )
  assert.deepEqual(lines.map((l) => l.loyaltyDiscount), [2, 0, 1.28])
  assert.deepEqual(lines.map((l) => l.excluded), [false, true, false])
  assert.equal(loyaltyDiscount, 3.28)
})

test('computeLines: every service excluded gives no discount', () => {
  const { loyaltyDiscount } = r.computeLines([{ serviceId: 5, price: 10 }], 20, ['5'])
  assert.equal(loyaltyDiscount, 0)
})

test('computeLines never takes more than the price', () => {
  const { lines } = r.computeLines([{ serviceId: 1, price: 0 }], 50, [])
  assert.equal(lines[0].loyaltyDiscount, 0)
})

test('rewardStatus', () => {
  const now = new Date('2026-10-19T12:00:00Z')
  assert.equal(r.rewardStatus(null), 'none')
  assert.equal(r.rewardStatus({ visitCount: 2 }), 'progress')
  assert.equal(r.rewardStatus({ rewardEarnedAt: now }, { now }), 'ready')
  assert.equal(r.rewardStatus({ rewardEarnedAt: now }, { now, held: true }), 'reserved')
  assert.equal(
    r.rewardStatus({ rewardEarnedAt: now, rewardExpiresAt: '2026-10-18T00:00:00Z' }, { now }),
    'expired',
  )
  assert.equal(
    r.rewardStatus({ rewardEarnedAt: now, rewardExpiresAt: '2026-10-18T00:00:00Z' }, { now, held: true }),
    'reserved',
  )
})

test('addVisit earns the reward on the Y-th visit, once', () => {
  const program = { visitsRequired: 3, discountPercentage: '10.00', rewardExpiryDays: null }
  const now = new Date('2026-10-19T12:00:00Z')
  let card = { visitCount: 1 }
  let step = r.addVisit(card, program, { now })
  assert.equal(step.card.visitCount, 2)
  assert.equal(step.earned, false)
  step = r.addVisit(step.card, program, { now })
  assert.equal(step.card.visitCount, 3)
  assert.equal(step.earned, true)
  assert.equal(step.card.rewardPercentage, 10)
  assert.equal(step.card.rewardExpiresAt, null)
  step = r.addVisit(step.card, program, { now })
  assert.equal(step.earned, false, 'a waiting reward is not earned twice')
  assert.equal(step.card.visitCount, 4)
  assert.equal(card.visitCount, 1, 'input untouched')
})

test('addVisit sets the expiry and clears an expired reward first', () => {
  const program = { visitsRequired: 2, discountPercentage: 15, rewardExpiryDays: 30 }
  const now = new Date('2026-10-19T00:00:00Z')
  const earned = r.addVisit({ visitCount: 1 }, program, { now })
  assert.equal(earned.earned, true)
  assert.equal(earned.card.rewardExpiresAt.toISOString(), '2026-11-18T00:00:00.000Z')

  const later = new Date('2026-12-01T00:00:00Z')
  const after = r.addVisit(earned.card, program, { now: later })
  assert.equal(after.expired, true)
  assert.equal(after.card.visitCount, 1)
  assert.equal(after.earned, false)
  assert.equal(after.card.rewardEarnedAt, null)
})

test('lowering the visits needed earns on the next visit', () => {
  const step = r.addVisit({ visitCount: 6 }, { visitsRequired: 5, discountPercentage: 10 })
  assert.equal(step.earned, true)
})

test('validateSettings', () => {
  assert.deepEqual(
    r.validateSettings({ isActive: true, visitsRequired: '5', discountPercentage: 10, excludedServiceIds: [3, '3', 4] }).values,
    { isActive: true, visitsRequired: 5, discountPercentage: 10, excludedServiceIds: [3, 4] },
  )
  assert.ok(r.validateSettings({ visitsRequired: 1 }).error)
  assert.ok(r.validateSettings({ visitsRequired: 21 }).error)
  assert.ok(r.validateSettings({ visitsRequired: 2.5 }).error)
  assert.ok(r.validateSettings({ discountPercentage: 4 }).error)
  assert.ok(r.validateSettings({ discountPercentage: 51 }).error)
  assert.ok(r.validateSettings({ isActive: 'yes' }).error)
  assert.ok(r.validateSettings({ excludedServiceIds: 'x' }).error)
  assert.ok(r.validateSettings({ rewardExpiryDays: 1000 }).error)
  assert.deepEqual(r.validateSettings({ rewardExpiryDays: 0, minBookingValue: '' }).values, {
    rewardExpiryDays: null,
    minBookingValue: null,
  })
  assert.deepEqual(r.validateSettings({}).values, {})
})

test('applyToJobs lowers each job by its own share, matched by service', () => {
  const lines = [
    { serviceId: 1, loyaltyDiscount: 2 },
    { serviceId: 2, loyaltyDiscount: 0 },
    { serviceId: 1, loyaltyDiscount: 1.5 },
  ]
  const out = r.applyToJobs(
    [
      { serviceId: 2, total: 8.5 },
      { serviceId: 1, total: 20 },
      { serviceId: 1, total: 15 },
    ],
    lines,
  )
  assert.deepEqual(
    out.map((j) => [j.total, j.loyaltyDiscount]),
    [
      [8.5, 0],
      [18, 2],
      [13.5, 1.5],
    ],
  )
})
