// Run: node --test test/
// helper/approvals.js: which requests fall under a rule, and defaults.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

const modelsFile = require.resolve(path.join(__dirname, '..', 'models'))
const ruleRows = []
require.cache[modelsFile] = require.cache[modelsFile] || {
  id: modelsFile, filename: modelsFile, loaded: true,
  exports: {},
}
Object.assign(require.cache[modelsFile].exports, {
  approvalRule: { findAll: async ({ where }) => ruleRows.filter((r) => r.salonDetailId === where.salonDetailId) },
  service: { findOne: async ({ where }) => (where.id === 5 && where.salonDetailId === 1 ? { id: 5, serviceName: 'Fade', price: '20.00', discount: 0 } : null) },
})
const approvals = require('../helper/approvals')

test('routes map to rules only on their own router', () => {
  assert.equal(approvals.ruleFor('PATCH', '/salon/v1', '/updateService'), 'prices')
  assert.equal(approvals.ruleFor('POST', '/salon/v1', '/addService'), 'newService')
  assert.equal(approvals.ruleFor('PATCH', '/salon/v1', '/update-coupon/9'), 'coupons')
  assert.equal(approvals.ruleFor('POST', '/salon/v1/employee', '/AddEmployee'), 'addTeam')
  // the salon router also sees /employee/* paths: not its rule
  assert.equal(approvals.ruleFor('POST', '/salon/v1', '/employee/AddEmployee'), null)
  assert.equal(approvals.ruleFor('GET', '/salon/v1', '/updateService'), null)
})

test('defaults: prices and new services on, the rest off; saved rows win', async () => {
  const r = await approvals.rulesFor(1)
  assert.equal(r.prices, true)
  assert.equal(r.newService, true)
  assert.equal(r.coupons, false)
  ruleRows.push({ salonDetailId: 1, rule: 'prices', enabled: false })
  assert.equal((await approvals.rulesFor(1)).prices, false)
  ruleRows.length = 0
})

test('a price rule only holds edits that change the price', async () => {
  const req = (body) => ({ body, path: '/updateService' })
  assert.equal(await approvals.describe('prices', req({ serviceId: 5, serviceName: 'Skin fade' }), 1), null)
  assert.equal(await approvals.describe('prices', req({ serviceId: 5, price: '20' }), 1), null)
  assert.equal(await approvals.describe('prices', req({ serviceId: 5, price: 25 }), 2), null) // other branch's service
  const d = await approvals.describe('prices', req({ serviceId: 5, price: 25 }), 1)
  assert.equal(d.summary, 'Change Fade: £20.00 → £25.00')
})
