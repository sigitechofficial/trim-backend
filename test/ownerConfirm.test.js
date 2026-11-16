// Run: node --test test/
// The person's Accept only agrees; the shop confirms (helper/chairMarket.accept),
// with small in-memory stand-ins for the models.
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
    if (key === Op.and) {
      if (!cond.every((c) => matches(row, c))) return false
      continue
    }
    const v = row[key]
    if (Array.isArray(cond)) {
      if (!cond.includes(v)) return false
    } else if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
      for (const op of Reflect.ownKeys(cond)) {
        const x = cond[op]
        if (op === Op.ne && v === x) return false
        if (op === Op.lt && !(v < x)) return false
      }
    } else if (v !== cond && !(cond === null && v == null)) return false
  }
  return true
}

function table() {
  const rows = []
  let nextId = 1
  const wrap = (r) => {
    r.update = async (patch) => Object.assign(r, patch)
    r.reload = async () => r
    r.toJSON = () => ({ ...r })
    return r
  }
  return {
    rows,
    seed(r) { const row = wrap({ id: nextId++, ...r }); rows.push(row); return row },
    async create(r) { return this.seed(r) },
    async findByPk(id) { return rows.find((x) => x.id === Number(id)) || null },
    async findOne(o = {}) { return rows.find((r) => matches(r, o.where)) || null },
    async findAll(o = {}) { return rows.filter((r) => matches(r, o.where)) },
    async count(o = {}) { return rows.filter((r) => matches(r, o.where)).length },
    async update(patch, o = {}) {
      const hit = rows.filter((r) => matches(r, o.where))
      hit.forEach((r) => Object.assign(r, patch))
      return [hit.length]
    },
  }
}

function load() {
  const db = {}
  for (const name of ['salonDetail', 'employee', 'user', 'deviceToken', 'pushNotification', 'chairOffer', 'chairOfferRound',
    'shopChairListing', 'renterWorkPref', 'renterWorkPrefs', 'addressDBS']) db[name] = table()
  db.sequelize = { transaction: async (fn) => fn({}) }
  const stub = (rel, exports) => {
    const file = require.resolve(path.join(__dirname, '..', rel))
    require.cache[file] = { id: file, filename: file, loaded: true, exports }
  }
  stub('models/index.js', db)
  stub('utils/throwNotification.js', () => {})
  stub('helper/staffDevices.js', { ownDeviceTokens: async () => [] })
  stub('helper/salonSubscriptionRule.js', { activeSalonWhere: () => ({}), isSalonRowActive: () => true })
  stub('helper/renterMove.js', { RENT_CYCLES: ['Weekly', 'Bi-weekly', 'Monthly', 'Daily'] })
  stub('helper/branchScope.js', { shopWhere: async (userId) => ({ userId }) })
  for (const h of ['chairMarket', 'hiringOffers', 'hiringRequests', 'renterCoverage']) delete require.cache[require.resolve(`../helper/${h}`)]
  const market = require('../helper/chairMarket')
  const owner = db.user.seed({ firstName: 'Shop', lastName: 'Owner' })
  const applicant = db.user.seed({ firstName: 'Post', lastName: 'Eid' })
  const shop = db.salonDetail.seed({ userId: owner.id, salonName: '3pm Shop', teamSize: 1, deleted: false, staffAdvertisementStatus: true, staffAdvertisementCount: 1 })
  const offer = db.chairOffer.seed({
    kind: 'staff', source: 'client', renterUserId: applicant.id, renterSalonId: null, shopSalonId: shop.id,
    createdBy: applicant.id, status: 'open', lastBy: 'shop', rounds: 2, stage: null, startDate: '2099-01-01',
    applicantInfo: JSON.stringify({ firstName: 'Post', lastName: 'Eid' }),
  })
  const pushes = () => db.pushNotification.rows
  return { db, market, owner, applicant, shop, offer, pushes }
}

test('the applicant accepting only agrees: no hire, the owner is asked to confirm', async () => {
  const { market, applicant, owner, offer, pushes } = load()
  const r = await market.accept(applicant.id, offer.id)
  assert.equal(r.waitingForShop, true)
  assert.equal(offer.status, 'open')
  assert.equal(offer.stage, 'agreed')
  assert.equal(offer.lastBy, 'renter')
  const toOwner = pushes().filter((p) => p.userId === owner.id)
  assert.equal(toOwner.length, 1)
  // Owner Only plan: the owner hears about the seat, the applicant hears nothing about it.
  assert.match(toOwner[0].body, /no free team seat/)
  assert.equal(pushes().filter((p) => p.userId === applicant.id).length, 0)
  await assert.rejects(market.accept(applicant.id, offer.id), /already accepted\. Waiting for 3pm Shop to confirm/)
})

test('the owner confirming with no free seat gets the plan message; the offer keeps waiting', async () => {
  const { market, applicant, owner, offer } = load()
  await market.accept(applicant.id, offer.id)
  await assert.rejects(market.accept(owner.id, offer.id), /Your plan has no free team seat/)
  assert.equal(offer.status, 'open')
  assert.equal(offer.stage, 'agreed')
})

test('the owner sees noSeat on the offer; the applicant sees only that the shop has to confirm', async () => {
  const { market, applicant, owner, offer } = load()
  await market.accept(applicant.id, offer.id)
  const mine = (await market.listOffers(applicant.id)).find((o) => o.id === offer.id)
  assert.equal(mine.waitingForShop, true)
  assert.equal(mine.myTurn, false)
  assert.equal(mine.noSeat, undefined)
  const theirs = (await market.listOffers(owner.id)).find((o) => o.id === offer.id)
  assert.equal(theirs.myTurn, true)
  assert.equal(theirs.noSeat, true)
})

test('an agreed offer the shop never confirms closes and the applicant is told without plan words', async () => {
  const { market, applicant, offer, pushes } = load()
  await market.accept(applicant.id, offer.id)
  offer.expiresAt = new Date(Date.now() - 1000)
  await market.expireOffers()
  assert.equal(offer.status, 'expired')
  const told = pushes().filter((p) => p.userId === applicant.id)
  assert.equal(told.length, 1)
  assert.match(told[0].body, /3pm Shop didn't go ahead/)
  assert.doesNotMatch(told[0].body, /plan|seat/i)
})

test('with a free seat the owner confirming hires them and the applicant is told', async () => {
  const { market, applicant, owner, shop, offer, pushes } = load()
  shop.teamSize = 2 // owner + 1 staff
  await market.accept(applicant.id, offer.id)
  assert.match(pushes().find((p) => p.userId === owner.id).body, /Confirm to hire them/)
  await market.accept(owner.id, offer.id)
  assert.equal(offer.status, 'accepted')
  assert.equal(offer.stage, 'starting')
  assert.match(pushes().filter((p) => p.userId === applicant.id).pop().body, /3pm Shop confirmed your place/)
})

test('new terms from the owner undo the earlier accept', async () => {
  const { market, applicant, owner, shop, offer } = load()
  shop.teamSize = 2
  await market.accept(applicant.id, offer.id)
  await market.counter(owner.id, offer.id, { rentAmount: 390, rentCycle: 'Weekly', startDate: '2099-01-01', payType: 'salary' })
  assert.equal(offer.stage, null)
  assert.equal(offer.lastBy, 'shop')
})
