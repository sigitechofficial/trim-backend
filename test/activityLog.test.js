// Run: node --test test/
// helper/activityLog.js: which requests are recorded, and what is kept of them.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

// The helper only needs models at save time; stub them so no database is used.
const modelsFile = require.resolve(path.join(__dirname, '..', 'models'))
const saved = []
require.cache[modelsFile] = {
  id: modelsFile, filename: modelsFile, loaded: true,
  exports: {
    activityLog: { create: async (row) => { saved.push(row); return row } },
    salonDetail: { findByPk: async () => ({ brandId: 7 }), findOne: async () => null },
    user: { findByPk: async () => ({ firstName: 'Ria', lastName: 'Front' }) },
    employee: { findOne: async () => null },
  },
}
const log = require('../helper/activityLog')

test('matches recorded routes and pulls out path ids', () => {
  const hit = log.matchAction('PATCH', '/salon/v1/employee/delete-employee/42')
  assert.equal(hit.action, 'team.remove')
  assert.deepEqual(hit.params, { employee: '42' })
  assert.equal(log.matchAction('POST', '/salon/v1/branches/9/close').params.salonId, '9')
  assert.equal(log.matchAction('GET', '/salon/v1/employee/delete-employee/42'), null)
  assert.equal(log.matchAction('POST', '/salon/v1/bookings/getbookingByFilter'), null)
})

test('every action has a label and a known category', () => {
  for (const [, , category, action] of log.ACTIONS) {
    assert.ok(log.CATEGORIES.includes(category), action)
    assert.ok(log.LABEL_OF[action], action)
  }
})

test('secrets, card details and files are never kept', () => {
  const out = log.cleanDetails({
    serviceName: 'Fade', price: 25, password: 'x', dvToken: 'y', cardNumber: '4242', image: 'data:…',
    nested: { stripeAccountId: 'acct', note: 'ok' }, long: 'a'.repeat(500),
  })
  assert.deepEqual(Object.keys(out).sort(), ['long', 'nested', 'price', 'serviceName'])
  assert.deepEqual(out.nested, { note: 'ok' })
  assert.equal(out.long.length, 201)
})

test('record fills in the brand and the name, and never throws', async () => {
  saved.length = 0
  await log.record({ salonDetailId: 3, actorUserId: 5, category: 'people', action: 'team.add', details: { firstName: 'Sam' }, result: 'ok' })
  assert.equal(saved[0].brandId, 7)
  assert.equal(saved[0].actorName, 'Ria Front')
  const bad = require.cache[modelsFile].exports.activityLog
  const create = bad.create
  bad.create = async () => { throw new Error('db down') }
  assert.equal(await log.record({ category: 'people', action: 'team.add' }), null)
  bad.create = create
})

test('watch saves the outcome of a matched request when the answer is sent', async () => {
  saved.length = 0
  const { EventEmitter } = require('events')
  const res = Object.assign(new EventEmitter(), { statusCode: 200, json(b) { this.sent = b; return this } })
  const req = {
    method: 'PATCH', baseUrl: '/salon/v1', path: '/updateService', headers: {},
    body: { serviceId: 3, price: 30 }, user: { id: 1, staffUserId: 5 },
    branch: { salonId: 3, brandId: 7, role: 'manager' },
  }
  log.watch(req, res)
  res.json({ status: '0', message: "You don't have access to do this." })
  res.emit('finish')
  await new Promise((r) => setImmediate(r))
  assert.equal(saved.length, 1)
  assert.equal(saved[0].action, 'service.update')
  assert.equal(saved[0].result, 'denied')
  assert.equal(saved[0].actorUserId, 5)
  assert.deepEqual(saved[0].details, { serviceId: 3, price: 30 })
})
