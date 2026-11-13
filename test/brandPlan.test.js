// Run: node --test test/
// helper/brandPlan.js: products map to branch limits.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

const file = require.resolve(path.join(__dirname, '..', 'models/index.js'))
require.cache[file] = { id: file, filename: file, loaded: true, exports: { brand: {}, salonDetail: {} } }
const { branchLimitForProduct } = require('../helper/brandPlan')

test('branch products give their branch count', () => {
  assert.equal(branchLimitForProduct('trimbiz_branches_2'), 2)
  assert.equal(branchLimitForProduct('trimbiz_branches_10'), 10)
  assert.equal(branchLimitForProduct('trimbiz_monthly:branches_4'), 4)
  assert.equal(branchLimitForProduct('trimbiz_branches_enterprise'), 999)
  assert.equal(branchLimitForProduct('owner_unlimited_staff'), null)
  assert.equal(branchLimitForProduct(undefined), null)
})
