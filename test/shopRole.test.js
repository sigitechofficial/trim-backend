// Run: node --test test/
// middlewares/shopRole.js: staff can't use owner endpoints or edit their own access/pay.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

function table(rows) {
  const hit = (r, w = {}) => Object.entries(w).every(([k, v]) => r[k] === v)
  return {
    rows,
    async findOne(o = {}) { return rows.find((r) => hit(r, o.where)) || null },
    async count(o = {}) { return rows.filter((r) => hit(r, o.where)).length },
  }
}

function load(actor, { access = [], defaults = [] } = {}) {
  const stub = (rel, exports) => {
    const file = require.resolve(path.join(__dirname, '..', rel))
    require.cache[file] = { id: file, filename: file, loaded: true, exports }
  }
  stub('models/index.js', {
    employee: table([
      { id: 1, salonDetailId: 10, isOwner: true },
      { id: 2, salonDetailId: 10, isOwner: false },
      { id: 3, salonDetailId: 10, isOwner: false },
      { id: 9, salonDetailId: 99, isOwner: false },
    ]),
    employeeAccess: table(access),
    employeeAccessDefault: table(defaults),
  })
  stub('helper/bookingRequestAccess.js', { resolveRequestActor: async () => actor })
  delete require.cache[require.resolve('../middlewares/shopRole')]
  return require('../middlewares/shopRole')
}

async function run(mw, body = {}) {
  let out = 'next'
  const res = { json: (j) => { out = j.message; return res } }
  await mw({ body, params: {} }, res, (err) => { if (err) throw err })
  return out
}

const OWNER = { shopId: 10, isOwner: true, employeeId: null }
const STAFF = { shopId: 10, isOwner: false, employeeId: 2 }

test('owner-only: owner and a new owner pass, staff are refused', async () => {
  assert.equal(await run(load(OWNER).ownerOnly), 'next')
  assert.equal(await run(load({ shopId: null, isOwner: false }).ownerOnly), 'next')
  assert.match(await run(load(STAFF).ownerOnly), /Only the shop owner/)
  assert.match(await run(load({ shopId: 10, isOwner: false, employeeId: null }).ownerOnly), /Only the shop owner/)
})

test('team edits: member must be in the caller’s shop', async () => {
  const { teamEditGuard } = load(OWNER)
  assert.equal(await run(teamEditGuard, { employeeId: 3 }), 'next')
  assert.match(await run(teamEditGuard, { employeeId: 9 }), /not in your shop/)
  assert.match(await run(teamEditGuard, {}), /not in your shop/)
})

test('team edits by staff: need teamMember high, never self or owner', async () => {
  const high = { access: [{ employeeId: 2, key: 'teamMember', level: 'high' }] }
  assert.equal(await run(load(STAFF, high).teamEditGuard, { employeeId: 3 }), 'next')
  assert.match(await run(load(STAFF, high).teamEditGuard, { employeeId: 2 }), /your own/)
  assert.match(await run(load(STAFF, high).teamEditGuard, { employeeId: 1 }), /Only the shop owner/)
  const low = { access: [{ employeeId: 2, key: 'teamMember', level: 'low' }] }
  assert.match(await run(load(STAFF, low).teamEditGuard, { employeeId: 3 }), /manage team members/)
  // No own rows: shop defaults apply.
  const dflt = { defaults: [{ salonDetailId: 10, key: 'teamMember', level: 'high' }] }
  assert.equal(await run(load(STAFF, dflt).teamEditGuard, { employeeId: 3 }), 'next')
  assert.match(await run(load(STAFF).teamEditGuard, { employeeId: 3 }), /manage team members/)
})

test('permission keys: owner passes, staff need the level', async () => {
  const low = { access: [{ employeeId: 2, key: 'client', level: 'low' }] }
  assert.equal(await run(load(OWNER).needLevel('client', 'high')), 'next')
  assert.equal(await run(load(STAFF, low).needLevel('client', 'low')), 'next')
  assert.match(await run(load(STAFF, low).needLevel('client', 'high')), /don't have access/)
  assert.match(await run(load(STAFF, low).needLevel('services', 'low')), /don't have access/)
  // A skipped request (e.g. declining a booking request) goes to its own check.
  assert.equal(await run(load(STAFF).needLevel('appointments', 'high', { skip: async () => true })), 'next')
  assert.match(await run(load({ shopId: 10, isOwner: false, employeeId: null }).needLevel('client', 'low')), /don't have access/)
})

test('profile edits: own needs updateProfile high, others go through team rules', async () => {
  const own = { access: [{ employeeId: 2, key: 'updateProfile', level: 'high' }] }
  assert.equal(await run(load(STAFF, own).profileOrTeamEdit, { employeeId: 2 }), 'next')
  assert.match(await run(load(STAFF, own).profileOrTeamEdit, { employeeId: 3 }), /manage team members/)
  assert.match(await run(load(STAFF).profileOrTeamEdit, { employeeId: 2 }), /don't have access/)
  assert.equal(await run(load(OWNER).profileOrTeamEdit, { employeeId: 2 }), 'next')
})
