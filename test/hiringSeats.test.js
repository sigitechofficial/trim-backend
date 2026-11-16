// Run: node --test test/
// Free team seats for hiring (helper/renterCoverage.hiringSeatsLeft), with
// small in-memory stand-ins for the models.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const { Op } = require('sequelize')

function matches(row, where = {}) {
  for (const key of Reflect.ownKeys(where)) {
    const cond = where[key]
    if (key === Op.or) {
      if (!cond.some((c) => matches(row, c))) return false
      continue
    }
    if (row[key] !== cond) return false
  }
  return true
}

function table() {
  const rows = []
  let nextId = 1
  return {
    rows,
    seed(r) { const row = { id: nextId++, ...r }; rows.push(row); return row },
    // Like Sequelize, only the asked-for attributes come back.
    async findByPk(id, o = {}) {
      const r = rows.find((x) => x.id === Number(id))
      if (!r) return null
      return o.attributes ? Object.fromEntries(o.attributes.map((a) => [a, r[a]])) : r
    },
    async count(o = {}) { return rows.filter((r) => matches(r, o.where)).length },
  }
}

function load() {
  const db = {}
  for (const name of ['salonDetail', 'employee', 'user', 'deviceToken', 'pushNotification', 'chairOffer']) db[name] = table()
  const stub = (rel, exports) => {
    const file = require.resolve(path.join(__dirname, '..', rel))
    require.cache[file] = { id: file, filename: file, loaded: true, exports }
  }
  stub('models/index.js', db)
  stub('utils/throwNotification.js', () => {})
  delete require.cache[require.resolve('../helper/renterCoverage')]
  return { db, coverage: require('../helper/renterCoverage') }
}

test('a shop row without teamSize is looked up, not counted as zero seats', async () => {
  const { db, coverage } = load()
  const shop = db.salonDetail.seed({ teamSize: 4, deleted: false }) // owner + 3 staff
  db.employee.seed({ salonDetailId: shop.id, isOwner: false, status: true, deleted: false, isExternalEmployee: false })
  // The shop as acceptApplicant loads it: no teamSize attribute.
  assert.equal(await coverage.hiringSeatsLeft({ id: shop.id }), 2)
})

test('people who accepted and have not started yet keep their seat', async () => {
  const { db, coverage } = load()
  const shop = db.salonDetail.seed({ teamSize: 3, deleted: false }) // owner + 2 staff
  db.employee.seed({ salonDetailId: shop.id, isOwner: false, status: true, deleted: false, isExternalEmployee: false })
  assert.equal(await coverage.hiringSeatsLeft(shop), 1)
  db.chairOffer.seed({ shopSalonId: shop.id, status: 'accepted', stage: 'starting', kind: 'staff' })
  assert.equal(await coverage.hiringSeatsLeft(shop), 0)
  // An uncovered chair renter does not use a seat.
  db.chairOffer.seed({ shopSalonId: shop.id, status: 'accepted', stage: 'starting', kind: 'chair', coversPlan: false })
  assert.equal(await coverage.hiringSeatsLeft(shop), 0)
})

test('Owner Only has no seat for staff or covered renters', async () => {
  const { db, coverage } = load()
  assert.equal(coverage.staffSeats(1), 0) // Owner Only
  assert.equal(coverage.staffSeats(2), 1) // Owner + 1 staff
  assert.equal(coverage.staffSeats(0), 0) // chair renter's own plan
  assert.equal(coverage.staffSeats(999), Infinity)
  const shop = db.salonDetail.seed({ teamSize: 1, deleted: false })
  assert.equal(await coverage.hiringSeatsLeft(shop), 0)
  const bigger = db.salonDetail.seed({ teamSize: 2, deleted: false })
  assert.equal(await coverage.hiringSeatsLeft(bigger), 1)
  // A covered chair renter takes that one seat.
  db.salonDetail.seed({ renterCoveredBy: bigger.id, parentSalonId: bigger.id, deleted: false })
  assert.equal(await coverage.hiringSeatsLeft(bigger), 0)
})

test('the applicant never sees the owner\'s plan message', async () => {
  const { coverage } = load()
  const msg = coverage.applicantNoSeat('3pm Shop')
  assert.match(msg, /^3pm Shop can't take on someone new right now/)
  assert.doesNotMatch(msg, /plan|seat|upgrade/i)
  assert.match(coverage.OWNER_NO_SEAT, /Upgrade your plan/)
})
