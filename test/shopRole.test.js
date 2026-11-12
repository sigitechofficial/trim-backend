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

const { Op } = require('sequelize')

function load(actor, { access = [], defaults = [], bookings = [], jobRows = [] } = {}) {
  const stub = (rel, exports) => {
    const file = require.resolve(path.join(__dirname, '..', rel))
    require.cache[file] = { id: file, filename: file, loaded: true, exports }
  }
  stub('models/index.js', {
    employee: table([
      { id: 1, salonDetailId: 10, isOwner: true, userId: 501 },
      { id: 2, salonDetailId: 10, isOwner: false, userId: 502 },
      { id: 3, salonDetailId: 10, isOwner: false },
      { id: 9, salonDetailId: 99, isOwner: false },
    ]),
    employeeAccess: table(access),
    employeeAccessDefault: table(defaults),
    booking: { async findByPk(id) { return bookings.find((b) => b.id === Number(id)) || null } },
    jobs: {
      ...table(jobRows),
      async findByPk(id) { return jobRows.find((j) => j.id === Number(id)) || null },
    },
  })
  // employee.findAll({ where: { salonDetailId, [Op.or]: [{ id: {in} }, { userId: {in} }] } })
  const db = require.cache[require.resolve('../models/index.js')].exports
  db.employee.findAll = async ({ where }) => {
    const [a, b] = where[Op.or]
    return db.employee.rows.filter((e) => e.salonDetailId === where.salonDetailId &&
      (a.id[Op.in].includes(e.id) || b.userId[Op.in].includes(e.userId)))
  }
  delete require.cache[require.resolve('../middlewares/bookingRequestGuard')]
  stub('helper/bookingRequestAccess.js', { resolveRequestActor: async () => actor })
  delete require.cache[require.resolve('../middlewares/shopRole')]
  return require('../middlewares/shopRole')
}

async function run(mw, body = {}, params = {}) {
  let out = 'next'
  const res = { json: (j) => { out = j.message; return res } }
  await mw({ body, params }, res, (err) => { if (err) throw err })
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

test('same shop: booking, job, member and shop ids must be the caller’s', async () => {
  const opts = {
    bookings: [{ id: 70, salonDetailId: 10 }, { id: 80, salonDetailId: 99 }],
    jobRows: [{ id: 700, bookingId: 70, employeeId: 2 }, { id: 800, bookingId: 80, employeeId: 9 }],
  }
  const { sameShop } = load(OWNER, opts)
  assert.equal(await run(sameShop, { bookingId: 70, employeeId: [2, 502], salonDetailId: 10 }), 'next')
  assert.equal(await run(sameShop, { jobId: 700 }), 'next')
  assert.match(await run(sameShop, { bookingId: 80 }), /another shop/)
  assert.match(await run(sameShop, {}, { bookingId: '80' }), /another shop/)
  assert.match(await run(sameShop, { jobIds: [800] }), /another shop/)
  assert.match(await run(sameShop, { employeeId: 9 }), /not in your shop/)
  assert.match(await run(sameShop, {}, { employee: '9' }), /not in your shop/)
  assert.match(await run(sameShop, { salonDetailId: 99 }), /another shop/)
  assert.equal(await run(load({ shopId: null }).sameShop, { salonDetailId: 99 }), 'next')
})

test('appointments at low: only bookings with a service of theirs', async () => {
  const opts = {
    access: [{ employeeId: 2, key: 'appointments', level: 'low' }],
    jobRows: [{ id: 700, bookingId: 70, employeeId: 2 }, { id: 701, bookingId: 71, employeeId: 3 }],
  }
  const guard = load(STAFF, opts).needLevel('appointments', 'low', { own: true })
  assert.equal(await run(guard, { bookingId: 70 }), 'next')
  assert.equal(await run(guard, { jobId: 700 }), 'next')
  assert.match(await run(guard, { bookingId: 71 }), /your own appointments/)
  const high = { ...opts, access: [{ employeeId: 2, key: 'appointments', level: 'high' }] }
  assert.equal(await run(load(STAFF, high).needLevel('appointments', 'low', { own: true }), { bookingId: 71 }), 'next')
})

test('skip sees the actor (payout: own record)', async () => {
  const own = async (req) => req._actor?.employeeId === 2
  assert.equal(await run(load(STAFF).needLevel('teamMember', 'high', { skip: own })), 'next')
  assert.match(await run(load({ ...STAFF, employeeId: 3 }).needLevel('teamMember', 'high', { skip: own })), /don't have access/)
})
