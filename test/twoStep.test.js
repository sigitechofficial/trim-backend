// Run: node --test test/
// helper/twoStep.js: who is asked, and the parts that need no database.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

const modelsFile = require.resolve(path.join(__dirname, '..', 'models'))
require.cache[modelsFile] = require.cache[modelsFile] || { id: modelsFile, filename: modelsFile, loaded: true, exports: {} }
Object.assign(require.cache[modelsFile].exports, {
  employee: { findAll: async () => [] },
  sequelize: { query: async () => [[{ n: 0 }]] },
})
const twoStep = require('../helper/twoStep')

const req = (headers = {}, body = {}) => ({ get: (h) => headers[h.toLowerCase()], body, headers })

test('emails are masked', () => {
  assert.equal(twoStep.maskEmail('sam@example.com'), 's••@example.com')
  assert.equal(twoStep.maskEmail('a@b.co'), 'a••@b.co')
  assert.equal(twoStep.maskEmail('nope'), '')
})

test('device ids are hashed and must look like one', () => {
  assert.equal(twoStep.deviceHashOf(req({ 'x-device-id': 'short' })), null)
  const h = twoStep.deviceHashOf(req({ 'x-device-id': 'a'.repeat(32) }))
  assert.match(h, /^[0-9a-f]{64}$/)
  assert.notEqual(h, 'a'.repeat(32))
})

test('owners always need it; staff only as managers of an owner who asked', async () => {
  assert.equal(await twoStep.required({ id: 1, userTypeId: 2 }), true)
  assert.equal(await twoStep.required({ id: 2, userTypeId: 3 }), false)
  assert.equal(await twoStep.required({ id: 3, userTypeId: 1 }), false)
})

test('old apps (no x-two-step header) and the off switch are never asked', async () => {
  assert.equal(await twoStep.check(req({}), { id: 1, userTypeId: 2 }), null)
  process.env.TWO_STEP_LOGIN = 'off'
  assert.equal(await twoStep.check(req({ 'x-two-step': '1' }), { id: 1, userTypeId: 2 }), null)
  delete process.env.TWO_STEP_LOGIN
})

test('a new app without a device id is told to update when a code is needed', async () => {
  const out = await twoStep.check(req({ 'x-two-step': '1' }), { id: 1, userTypeId: 2 })
  assert.equal(out.status, '0')
  assert.match(out.message, /update/)
})
