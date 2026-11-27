// Run: node --test test/
// Exercises helper/renterMove.js against small in-memory stand-ins for the models.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const { Op } = require('sequelize')
const { DateTime } = require('luxon')

const today = DateTime.now().setZone('Europe/London').toISODate()

function matches(row, where = {}) {
  for (const key of Reflect.ownKeys(where)) {
    const cond = where[key]
    if (key === Op.or) {
      if (!cond.some((c) => matches(row, c))) return false
      continue
    }
    const v = row[key]
    if (Array.isArray(cond)) {
      if (!cond.includes(v)) return false
    } else if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
      for (const op of Reflect.ownKeys(cond)) {
        const x = cond[op]
        if (op === Op.ne && !(v !== x && !(x === null && v == null))) return false
        if (op === Op.lte && !(v <= x)) return false
        if (op === Op.lt && !(v < x)) return false
        if (op === Op.gte && !(v >= x)) return false
        if (op === Op.gt && !(v > x)) return false
        if (op === Op.in && !x.includes(v)) return false
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
    return r
  }
  return {
    rows,
    seed(r) { const row = wrap({ id: nextId++, ...r }); rows.push(row); return row },
    async create(r) { return this.seed({ createdAt: new Date(), ...r }) },
    async bulkCreate(list) { return list.map((r) => this.seed(r)) },
    async findByPk(id) { return rows.find((r) => r.id === Number(id)) || null },
    async findOne(o = {}) { return rows.find((r) => matches(r, o.where)) || null },
    async findAll(o = {}) { return rows.filter((r) => matches(r, o.where)) },
    async count(o = {}) { return rows.filter((r) => matches(r, o.where)).length },
    async update(patch, o = {}) { const hit = rows.filter((r) => matches(r, o.where)); hit.forEach((r) => Object.assign(r, patch)); return [hit.length] },
  }
}

function load() {
  const db = {}
  for (const name of ['renterMove', 'salonDetail', 'employee', 'user', 'wallet', 'employeeWagesMethod',
    'category', 'service', 'employeeService', 'booking', 'jobs', 'deviceToken', 'addressDBS']) db[name] = table()
  db.sequelize = { transaction: async (fn) => fn({ LOCK: { UPDATE: 'UPDATE' } }) }
  const pushes = []
  const stub = (rel, exports) => {
    const file = require.resolve(path.join(__dirname, '..', rel))
    require.cache[file] = { id: file, filename: file, loaded: true, exports }
  }
  stub('models/index.js', db)
  const emails = []
  const declined = []
  stub('utils/throwNotification.js', (tokens, notification) => pushes.push(notification.title))
  stub('helper/barberMovedEmail.js', (data) => emails.push(data))
  stub('controllers/stripe.js', { releaseHeldPayment: async () => {} })
  stub('controllers/eventDrivenCommunication/calendarView.js', { socketForCalendar: () => {} })
  stub('controllers/eventDrivenCommunication/appointmentRequest.js', { requestDeclined: (id, reason) => declined.push({ id, reason }) })
  delete require.cache[require.resolve('../helper/renterMove')]
  return { db, pushes, emails, declined, move: require('../helper/renterMove') }
}

// Host A (old), host B (new), and a renter at A with a booking and a host-menu service.
function seed(db) {
  const ownerA = db.user.seed({ firstName: 'Ann' })
  const ownerB = db.user.seed({ firstName: 'Bob' })
  const renter = db.user.seed({ firstName: 'Rex', lastName: 'R', email: 'rex@test', isExternalEmployee: true, deleted: false })
  const customer = db.user.seed({ firstName: 'Cat' })
  const shopA = db.salonDetail.seed({ userId: ownerA.id, salonName: 'Shop A', teamSize: 3, addressDBId: 10, isExternalEmployee: false, deleted: false })
  const shopB = db.salonDetail.seed({ userId: ownerB.id, salonName: 'Shop B', teamSize: 3, addressDBId: 20, isExternalEmployee: false, deleted: false })
  const rSalon = db.salonDetail.seed({ userId: renter.id, salonName: 'Rex R', isExternalEmployee: true, parentSalonId: shopA.id, addressDBId: 10, deleted: false })
  const hostRowA = db.employee.seed({ userId: renter.id, salonDetailId: shopA.id, isExternalEmployee: true, isOwner: false, status: true, deleted: false, position: 'Barber' })
  const ownerRow = db.employee.seed({ userId: renter.id, salonDetailId: rSalon.id, isOwner: true, parentEmployeeId: hostRowA.id, status: true, deleted: false })
  const cat = db.category.seed({ categoryName: 'Hair', salonDetailId: shopA.id })
  const cut = db.service.seed({ serviceName: 'Cut', categoryId: cat.id, salonDetailId: shopA.id })
  const b = db.booking.seed({ salonDetailId: rSalon.id, customerId: customer.id, on: today, status: 'book', createdAt: new Date(Date.now() - 86400000) })
  const job = db.jobs.seed({ bookingId: b.id, serviceId: cut.id })
  return { ownerA, ownerB, renter, customer, shopA, shopB, rSalon, hostRowA, ownerRow, cut, b, job }
}

test('invite → accept → move runs on its date and re-links the renter to the new shop', async () => {
  const { db, move } = load()
  const s = seed(db)

  const m = await move.invite({ hostUserId: s.ownerB.id, email: 'rex@test', moveDate: today, rentAmount: 100, rentCycle: 'Weekly' })
  assert.equal(m.status, 'invited')
  assert.equal(m.fromSalonId, s.shopA.id)

  await move.respond({ renterUserId: s.renter.id, moveId: m.id, accept: true })
  assert.equal(m.status, 'accepted')

  // The old shop cannot stop the renter leaving.
  await assert.rejects(move.cancel({ userId: s.ownerA.id, moveId: m.id }), /Only the chair renter or their new shop/)

  // Runs on its date without waiting for the old shop.
  assert.equal(await move.runMove(m.id), 'completed')

  assert.equal(s.hostRowA.deleted, true)
  assert.ok(s.hostRowA.leftAt)
  assert.equal(s.rSalon.parentSalonId, s.shopB.id)
  assert.equal(s.rSalon.addressDBId, 20)
  const newRow = db.employee.rows.find((e) => e.salonDetailId === s.shopB.id && e.userId === s.renter.id)
  assert.ok(newRow)
  assert.equal(s.ownerRow.parentEmployeeId, newRow.id)
  assert.equal(db.employeeWagesMethod.rows[0].employeeId, newRow.id)

  // The host menu was copied and the upcoming job points at the copy.
  const copy = db.service.rows.find((x) => x.salonDetailId === s.rSalon.id)
  assert.ok(copy)
  assert.notEqual(copy.id, s.cut.id)
  assert.equal(s.job.serviceId, copy.id)

  // Booked before the move: the customer may cancel for free.
  assert.equal(await move.freeCancelAfterMove(s.b.id), true)
})

test('leave starts the grace period; joining later needs no rent check', async () => {
  const { db, move, emails } = load()
  const s = seed(db)
  s.customer.email = 'cat@test'

  const leave = await move.leave({ renterUserId: s.renter.id, moveDate: today })
  await move.settleRent({ hostUserId: s.ownerA.id, moveId: leave.id })
  assert.equal(await move.runMove(leave.id), 'completed')
  assert.equal(s.rSalon.parentSalonId, null)
  assert.equal(s.rSalon.renterGraceUntil, DateTime.fromISO(today).plus({ days: move.GRACE_DAYS }).toISODate())
  // Customers see "Between shops", not the old shop's address.
  const placeholder = await db.addressDBS.findByPk(s.rSalon.addressDBId)
  assert.equal(placeholder.type, 'between_shops')
  assert.equal(placeholder.streetAddress, 'Between shops')
  // The customer with a booking hears the barber left, and may cancel for free.
  await new Promise((r) => setImmediate(r))
  assert.equal(emails.length, 1)
  assert.equal(emails[0].shopName, null)
  assert.equal(emails[0].fromShopName, 'Shop A')
  assert.equal(await move.freeCancelAfterMove(s.b.id), true)
  assert.equal(s.ownerRow.parentEmployeeId, null)

  const join = await move.invite({ hostUserId: s.ownerB.id, email: 'rex@test', moveDate: today })
  assert.equal(join.fromSalonId, null)
  await move.respond({ renterUserId: s.renter.id, moveId: join.id, accept: true })
  assert.equal(await move.runMove(join.id), 'completed')
  assert.equal(s.rSalon.parentSalonId, s.shopB.id)
  assert.equal(s.rSalon.addressDBId, 20)
  assert.equal(s.rSalon.renterGraceUntil, null)
})

test('a renter joins a shop with no free team seat: renters pay their own plan', async () => {
  const { db, move } = load()
  const s = seed(db)
  s.shopB.teamSize = 0
  const m = await move.invite({ hostUserId: s.ownerB.id, email: 'rex@test', moveDate: today })
  await move.respond({ renterUserId: s.renter.id, moveId: m.id, accept: true })
  await move.settleRent({ hostUserId: s.ownerA.id, moveId: m.id })
  assert.equal(await move.runMove(m.id), 'completed')
  assert.equal(s.rSalon.parentSalonId, s.shopB.id)
})

test('an agreed move blocks a second one; an open invite does not, and closes when another is agreed', async () => {
  const { db, move } = load()
  const s = seed(db)
  const m = await move.invite({ hostUserId: s.ownerB.id, email: 'rex@test', moveDate: today })
  await assert.rejects(() => move.invite({ hostUserId: s.ownerB.id, email: 'rex@test', moveDate: today }), /already invited/)
  // Leaving while an invite is open is allowed, and closes the invite.
  await move.leave({ renterUserId: s.renter.id, moveDate: today })
  assert.equal(db.renterMove.rows.find((r) => r.id === m.id).status, 'cancelled')
  await assert.rejects(() => move.leave({ renterUserId: s.renter.id, moveDate: today }), /already has a move/)
})

test('a shop removing a renter makes them between shops and keeps their account', async () => {
  const { db, move } = load()
  const s = seed(db)
  assert.equal(await move.removeFromShop({ hostSalonId: s.shopA.id, renterUserId: s.renter.id, createdBy: s.ownerA.id }), 'completed')
  assert.equal(s.rSalon.parentSalonId, null)
  assert.ok(s.rSalon.renterGraceUntil)
  assert.equal(s.hostRowA.deleted, true)
  // Another shop cannot remove them.
  await assert.rejects(() => move.removeFromShop({ hostSalonId: s.shopB.id, renterUserId: s.renter.id, createdBy: s.ownerB.id }), /no longer at your shop/)
})

test('a move declines pending requests from the move date and emails customers with bookings', async () => {
  const { db, move, emails, declined } = load()
  const s = seed(db)
  db.addressDBS.seed({ streetAddress: '1 High St', city: 'London', postalCode: 'E1 1AA' })
  s.customer.email = 'cat@test'
  const req = db.booking.seed({ salonDetailId: s.rSalon.id, customerId: s.customer.id, on: today, status: 'requested' })
  const before = db.booking.seed({ salonDetailId: s.rSalon.id, customerId: s.customer.id, on: '2000-01-01', status: 'requested' })
  s.shopB.addressDBId = 1

  const m = await move.invite({ hostUserId: s.ownerB.id, email: 'rex@test', moveDate: today })
  await move.respond({ renterUserId: s.renter.id, moveId: m.id, accept: true })
  await move.settleRent({ hostUserId: s.ownerA.id, moveId: m.id })
  assert.equal(await move.runMove(m.id), 'completed')

  assert.equal(req.status, 'cancel')
  assert.equal(req.requestOutcome, 'declined')
  assert.equal(before.status, 'requested')
  assert.deepEqual(declined.map((d) => d.id), [req.id])
  assert.match(declined[0].reason, /Shop B/)

  await new Promise((r) => setImmediate(r))
  assert.equal(emails.length, 1)
  assert.equal(emails[0].email, 'cat@test')
  assert.equal(emails[0].shopName, 'Shop B')
  assert.match(emails[0].address, /1 High St, London, E1 1AA/)
})

test('grace notices: one reminder near the end, one notice after it, never twice', async () => {
  const { db, move, pushes } = load()
  const s = seed(db)
  db.deviceToken.seed({ userId: s.renter.id, tokenId: 'rex-phone' })
  const leave = await move.leave({ renterUserId: s.renter.id, moveDate: today })
  await move.settleRent({ hostUserId: s.ownerA.id, moveId: leave.id })
  await move.runMove(leave.id)

  // 14 days left: nothing yet.
  assert.deepEqual(await move.runGraceNotices(), { reminders: 0, ended: 0 })

  s.rSalon.renterGraceUntil = DateTime.fromISO(today).plus({ days: 3 }).toISODate()
  assert.deepEqual(await move.runGraceNotices(), { reminders: 1, ended: 0 })
  assert.deepEqual(await move.runGraceNotices(), { reminders: 0, ended: 0 })
  assert.ok(pushes.includes('Join a shop to keep taking bookings'))

  s.rSalon.renterGraceUntil = DateTime.fromISO(today).minus({ days: 1 }).toISODate()
  assert.deepEqual(await move.runGraceNotices(), { reminders: 0, ended: 1 })
  assert.deepEqual(await move.runGraceNotices(), { reminders: 0, ended: 0 })
})

test('the old shop sees the rent the renter still owes', async () => {
  const { db, move } = load()
  const s = seed(db)
  const threeWeeksAgo = DateTime.now().minus({ days: 21 }).toJSDate()
  db.employeeWagesMethod.seed({ employeeId: s.hostRowA.id, wagesMethodId: 3, value: '50', cycle: 'Weekly', prevSalaryDate: threeWeeksAgo, createdAt: threeWeeksAgo })
  const m = await move.invite({ hostUserId: s.ownerB.id, email: 'rex@test', moveDate: today })
  await move.respond({ renterUserId: s.renter.id, moveId: m.id, accept: true })

  const [forOldShop] = await move.listFor(s.ownerA.id)
  assert.equal(forOldShop.role, 'from')
  assert.deepEqual(forOldShop.rentDue, { amount: 150, cycles: 3, cycle: 'Weekly' })
  const [forNewShop] = await move.listFor(s.ownerB.id)
  assert.equal(forNewShop.rentDue, undefined)
})

test('bookings before the move keep the old address; later ones use the new one', async () => {
  const { db, move } = load()
  const s = seed(db)
  const past = db.booking.seed({ salonDetailId: s.rSalon.id, customerId: s.customer.id, on: '2026-01-05', status: 'complete', visitAddressId: null })
  s.b.visitAddressId = null
  const m = await move.invite({ hostUserId: s.ownerB.id, email: 'rex@test', moveDate: today })
  await move.respond({ renterUserId: s.renter.id, moveId: m.id, accept: true })
  await move.settleRent({ hostUserId: s.ownerA.id, moveId: m.id })
  await move.runMove(m.id)

  assert.equal(past.visitAddressId, 10) // shop A's address
  assert.equal(s.b.visitAddressId, null) // today's booking: at the new shop

  const old = db.addressDBS.seed({ streetAddress: 'Old St', city: 'Leeds' })
  const plain = { visitAddressId: old.id, salonDetail: { addressDB: { streetAddress: 'New St', city: 'York' } } }
  await move.applyVisitAddresses([plain])
  assert.deepEqual(plain.salonDetail.addressDB, { streetAddress: 'Old St', city: 'Leeds' })
})

test('chair market: weekly rent and distance helpers', () => {
  const file = require.resolve('../helper/chairMarket')
  delete require.cache[file]
  const { weeklyRent, km } = require('../helper/chairMarket')
  assert.equal(weeklyRent(100, 'Weekly'), 100)
  assert.equal(weeklyRent(200, 'Bi-weekly'), 100)
  assert.equal(Math.round(weeklyRent(520, 'Monthly')), 120)
  assert.equal(weeklyRent(20, 'Daily'), 100)
  assert.equal(weeklyRent('x', 'Weekly'), null)
  assert.equal(km({ lat: 51.5074, lng: -0.1278 }, { lat: 51.5155, lng: -0.0922 }), 2.6)
  assert.equal(km({ lat: null, lng: 1 }, { lat: 1, lng: 1 }), null)
})

test('renters on the free days get one reminder at 14, 7 and 1 days left, then one when they end', async () => {
  const { db, move, pushes } = load()
  const plusDays = (n) => DateTime.fromISO(today).plus({ days: n }).toISODate()
  const renter = db.user.seed({ firstName: 'Rex' })
  db.deviceToken.seed({ userId: renter.id, tokenId: 'rex-phone' })
  const salon = db.salonDetail.seed({
    userId: renter.id, isExternalEmployee: true, deleted: false,
    subscriptionLatestPaymentStatus: 'renter_switch', registrationExpiryDate: plusDays(20), renterPlanReminderDays: null,
  })
  const run = async () => { pushes.length = 0; await move.runRenterPlanReminders(); return [...pushes] }

  assert.deepEqual(await run(), [])
  salon.registrationExpiryDate = plusDays(12)
  assert.deepEqual(await run(), ['Choose your Trim plan'])
  assert.deepEqual(await run(), [])
  salon.registrationExpiryDate = plusDays(1)
  assert.deepEqual(await run(), ['Choose your Trim plan'])
  salon.registrationExpiryDate = plusDays(-1)
  assert.deepEqual(await run(), ['Your free days have ended'])
  assert.deepEqual(await run(), [])

  // A renter who bought their own plan gets no reminders.
  salon.subscriptionLatestPaymentStatus = 'payment_succeeded'
  salon.renterPlanReminderDays = null
  assert.deepEqual(await run(), [])
})

test('admin retry runs a failed move, but not once the renter has moved on', async () => {
  const { db, move } = load()
  const s = seed(db)
  const m = await move.invite({ hostUserId: s.ownerB.id, email: 'rex@test', moveDate: today })
  await move.respond({ renterUserId: s.renter.id, moveId: m.id, accept: true })
  await move.settleRent({ hostUserId: s.ownerA.id, moveId: m.id })
  const row = db.renterMove.rows.find((r) => r.id === m.id)

  // Renter has since left shop A: the old move must not run.
  row.status = 'failed'
  s.rSalon.parentSalonId = null
  await assert.rejects(() => move.adminRetry(m.id), /no longer at the shop/)
  assert.equal(row.status, 'failed')

  // Renter still at shop A: retry runs the move.
  s.rSalon.parentSalonId = s.shopA.id
  const out = await move.adminRetry(m.id)
  assert.equal(out.result, 'completed')
  assert.equal(s.rSalon.parentSalonId, s.shopB.id)
})
