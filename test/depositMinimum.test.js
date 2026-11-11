const test = require('node:test')
const assert = require('node:assert/strict')
const { chargeableDeposit } = require('../utils/depositMinimum')

test('a deposit below 30p is not taken online', () => {
  assert.equal(chargeableDeposit(0.2), 0)
  assert.equal(chargeableDeposit(0.29), 0)
})

test('30p and above, and zero, are unchanged', () => {
  assert.equal(chargeableDeposit(0.3), 0.3)
  assert.equal(chargeableDeposit(12.5), 12.5)
  assert.equal(chargeableDeposit(0), 0)
})

test('a tip keeps the deposit as it is', () => {
  assert.equal(chargeableDeposit(0.2, 1), 0.2)
})
