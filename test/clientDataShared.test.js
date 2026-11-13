// Run: node --test test/
// helper/clientData.js CSV safety and helper/sharedSettings.js route map.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

const modelsFile = require.resolve(path.join(__dirname, '..', 'models'))
require.cache[modelsFile] = require.cache[modelsFile] || { id: modelsFile, filename: modelsFile, loaded: true, exports: {} }
const { csv } = require('../helper/clientData')
const shared = require('../helper/sharedSettings')

test('CSV quotes commas and quotes, and defuses spreadsheet formulas', () => {
  const out = csv([['Sam, Jr', 'say "hi"', '=HYPERLINK("x")', '+44 7700', 3]])
  assert.equal(out, `"Sam, Jr","say ""hi""","'=HYPERLINK(""x"")",'+44 7700,3`)
})

test('shared settings: routes map to their setting on the salon router only', () => {
  assert.equal(shared.keyFor('POST', '/salon/v1', '/updateCancellationPolicies'), 'cancellation')
  assert.equal(shared.keyFor('PUT', '/salon/v1', '/loyalty'), 'loyalty')
  assert.equal(shared.keyFor('PATCH', '/salon/v1', '/booking-approval'), 'bookingApproval')
  assert.equal(shared.keyFor('GET', '/salon/v1', '/loyalty'), null)
  assert.equal(shared.keyFor('POST', '/salon/v1/employee', '/updateCancellationPolicies'), null)
})
