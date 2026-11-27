const test = require('node:test')
const assert = require('node:assert')
const { overlaps } = require('../helper/bookingClash')

test('overlapping times clash', () => {
  assert.equal(overlaps('10:00', '10:35', '10:20', '10:55'), true)
  assert.equal(overlaps('10:00', '11:00', '10:15', '10:45'), true) // inside
  assert.equal(overlaps('10:15', '10:45', '10:00', '11:00'), true) // around
})

test('touching or separate times do not clash', () => {
  assert.equal(overlaps('10:00', '10:35', '10:35', '11:10'), false)
  assert.equal(overlaps('10:35', '11:10', '10:00', '10:35'), false)
  assert.equal(overlaps('09:00', '09:30', '10:00', '10:30'), false)
  assert.equal(overlaps('10:00:00', '10:35:00', '10:35', '11:10'), false)
})
