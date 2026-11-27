// Run: node --test test/
// helper/customRoles.js input rules and helper/branchMembers period rules.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

const modelsFile = require.resolve(path.join(__dirname, '..', 'models'))
require.cache[modelsFile] = require.cache[modelsFile] || { id: modelsFile, filename: modelsFile, loaded: true, exports: {} }
const customRoles = require('../helper/customRoles')

test('a role needs a name; base role and levels are cleaned', () => {
  assert.throws(() => customRoles.cleanInput({ name: '  ' }), /name/)
  const r = customRoles.cleanInput({ name: 'Senior barber', baseRole: 'boss', levels: { services: 'high', takings: 'owner', made: 'high' } })
  assert.equal(r.baseRole, 'barber')
  assert.equal(r.levels.services, 'high')
  assert.equal(r.levels.takings, 'none') // not a level: falls back
  assert.equal('made' in r.levels, false) // unknown keys dropped
  assert.deepEqual(Object.keys(r.levels).sort(), [...customRoles.KEYS].sort())
})

test('missing levels come from the base role', () => {
  const r = customRoles.cleanInput({ name: 'Front desk plus', baseRole: 'receptionist', levels: {} })
  assert.equal(r.levels.appointments, 'high')
  assert.equal(r.levels.teamMember, 'none')
  assert.equal(r.bookable, false) // only barber-based roles take bookings by default
})
