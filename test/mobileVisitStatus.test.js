// Run: node --test test/
// Exercises helper/mobileVisitStatus.js (On my way / Arrived) with in-memory models.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const { Op } = require('sequelize')
const { DateTime } = require('luxon')

function matches(row, where = {}) {
  for (const key of Reflect.ownKeys(where)) {
    const cond = where[key]
    const v = row[key]
    if (Array.isArray(cond)) {
      if (!cond.includes(v)) return false
    } else if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
      for (const op of Reflect.ownKeys(cond)) {
        if (op === Op.in && !cond[op].includes(v)) return false
      }
    } else if (cond === null) {
      if (v != null) return false
    } else if (v !== cond) return false
  }
  return true
}

function table() {
  const rows = []
  let nextId = 1
  const wrap = (r) => {
    r.update = async (patch) => Object.assign(r, patch)
    r.toJSON = () => ({ ...r })
    return r
  }
  return {
    rows,
    seed(r) { const row = wrap({ id: nextId++, ...r }); rows.push(row); return row },
    async create(r) { return this.seed(r) },
    async findByPk(id) { return rows.find((r) => r.id === Number(id)) || null },
    async findOne(o = {}) { return rows.find((r) => matches(r, o.where)) || null },
    async findAll(o = {}) { return rows.filter((r) => matches(r, o.where)) },
    async count(o = {}) { return rows.filter((r) => matches(r, o.where)).length },
    async update(patch, o = {}) { const hit = rows.filter((r) => matches(r, o.where)); hit.forEach((r) => Object.assign(r, patch)); return [hit.length] },
  }
}

function load() {
  const db = {}
  for (const n of ['salonDetail', 'employee', 'user', 'addressDBS', 'mobileSetting', 'booking', 'jobs', 'deviceToken', 'visitReport', 'cancelledBooking']) db[n] = table()
  const pushes = []
  const stub = (rel, exports) => {
    const file = require.resolve(path.join(__dirname, '..', rel))
    require.cache[file] = { id: file, filename: file, loaded: true, exports }
  }
  stub('models/index.js', db)
  stub('utils/throwNotification.js', async (tokens, n, data, userId) => pushes.push({ title: n.title, body: n.body, userId }))
  const refunds = []
  stub('controllers/stripe.js', { refundFullPayment: async (intent) => { refunds.push(intent); return { id: `re_${intent}` } } })
  for (const m of ['../helper/mobileVisitStatus', '../helper/mobileBarber', '../helper/bookingApproval', '../helper/visitReports']) delete require.cache[require.resolve(m)]
  return { db, pushes, refunds, s: require('../helper/mobileVisitStatus'), r: require('../helper/visitReports') }
}

// About 30 m from the client's pin below.
const AT_DOOR = { lat: 51.5009, lng: -0.1248 }

// A shop with an owner and a staff barber, and an accepted home visit starting in 30 minutes (UK time).
function seed(db, { startIn = 30 } = {}) {
  const owner = db.user.seed({ firstName: 'Omar' })
  const staffUser = db.user.seed({ firstName: 'Sam', lastName: 'Cuts' })
  const other = db.user.seed({ firstName: 'Ola' })
  const client = db.user.seed({ firstName: 'Cat' })
  db.deviceToken.seed({ userId: client.id, tokenId: 'client-phone' })
  db.deviceToken.seed({ userId: staffUser.id, tokenId: 'staff-phone' })
  const shop = db.salonDetail.seed({ userId: owner.id, salonName: 'Fade Lab', deleted: false })
  db.employee.seed({ userId: owner.id, salonDetailId: shop.id, isOwner: true, deleted: false })
  const staff = db.employee.seed({ userId: staffUser.id, salonDetailId: shop.id, isOwner: false, deleted: false, user: staffUser })
  db.employee.seed({ userId: other.id, salonDetailId: shop.id, isOwner: false, deleted: false })
  const pin = db.addressDBS.seed({ lat: 51.5007, lng: -0.1246 })
  const start = DateTime.now().setZone('Europe/London').plus({ minutes: startIn })
  const b = db.booking.seed({
    salonDetailId: shop.id, customerId: client.id, isMobileVisit: true, status: 'book',
    on: start.toISODate(), startTime: start.toFormat('HH:mm:ss'), endTime: start.plus({ minutes: 35 }).toFormat('HH:mm:ss'),
    onTheWayAt: null, arrivedAt: null, barberRemindedAt: null, lateNoticeAt: null, visitAddressId: pin.id,
    mockAttempts: 0, arrivalFlag: null, clientConfirm: null,
  })
  db.jobs.seed({ bookingId: b.id, employeeId: staff.id, employee: staff })
  return { owner, staffUser, other, client, shop, staff, b }
}

test('on my way needs a listed ETA and tells the client', async () => {
  const { db, pushes, s } = load()
  const x = seed(db)
  await assert.rejects(s.onTheWay({ userId: x.staffUser.id, bookingId: x.b.id, etaMinutes: 7 }), /how long/)
  const out = await s.onTheWay({ userId: x.staffUser.id, bookingId: x.b.id, etaMinutes: 15 })
  assert.equal(out.visitStatus, 'on_the_way')
  assert.equal(x.b.etaMinutes, 15)
  assert.equal(pushes.at(-1).userId, x.client.id)
  assert.match(pushes.at(-1).body, /Sam Cuts is on the way · about 15 min/)
})

test('only the visit’s barber or the owner can update it', async () => {
  const { db, s } = load()
  const x = seed(db)
  await assert.rejects(s.onTheWay({ userId: x.other.id, bookingId: x.b.id, etaMinutes: 10 }), /another barber/)
  const out = await s.onTheWay({ userId: x.owner.id, bookingId: x.b.id, etaMinutes: 10 })
  assert.equal(out.visitStatus, 'on_the_way')
})

test('buttons open 3 hours before the visit, and not for a cancelled one', async () => {
  const { db, s } = load()
  const x = seed(db, { startIn: 5 * 60 })
  await assert.rejects(s.onTheWay({ userId: x.staffUser.id, bookingId: x.b.id, etaMinutes: 10 }), /from 3 hours before/)
  x.b.status = 'cancel'
  await assert.rejects(s.arrived({ userId: x.staffUser.id, bookingId: x.b.id, ...AT_DOOR }), /no longer active/)
})

test('a finished visit shows as over, so the apps hide On my way / I\'ve arrived', async () => {
  const { db, s } = load()
  const x = seed(db)
  assert.equal(s.windowState(x.b), 'open')
  x.b.status = 'complete'
  assert.equal(s.windowState(x.b), 'over')
})

test('arrived keeps the time and tells the client once', async () => {
  const { db, pushes, s } = load()
  const x = seed(db)
  const out = await s.arrived({ userId: x.staffUser.id, bookingId: x.b.id, ...AT_DOOR })
  assert.equal(out.visitStatus, 'arrived')
  assert.ok(x.b.arrivedAt)
  assert.ok(x.b.onTheWayAt)
  const sent = pushes.length
  await s.arrived({ userId: x.staffUser.id, bookingId: x.b.id, ...AT_DOOR })
  assert.equal(pushes.length, sent)
  await assert.rejects(s.onTheWay({ userId: x.staffUser.id, bookingId: x.b.id, etaMinutes: 10 }), /already arrived/)
})

test("I've arrived works only within 100 m of the client's pin", async () => {
  const { db, pushes, s } = load()
  const x = seed(db)
  await assert.rejects(s.arrived({ userId: x.staffUser.id, bookingId: x.b.id }), /allow location/)
  // About 330 m away (down the road).
  await assert.rejects(s.arrived({ userId: x.staffUser.id, bookingId: x.b.id, lat: 51.5037, lng: -0.1246 }), /about 33\d m away/)
  // About 10.9 km away: said in miles.
  await assert.rejects(s.arrived({ userId: x.staffUser.id, bookingId: x.b.id, lat: 51.5987, lng: -0.1246 }), /about 6\.\d miles away/)
  assert.equal(x.b.arrivedAt, null)
  assert.equal(pushes.length, 0)
  const out = await s.arrived({ userId: x.staffUser.id, bookingId: x.b.id, ...AT_DOOR })
  assert.equal(out.visitStatus, 'arrived')
  assert.ok(x.b.arrivedDistanceM > 0 && x.b.arrivedDistanceM <= 100)
  assert.equal(out.arrivedDistanceM, x.b.arrivedDistanceM)
})

test('a visit address with no pin is not checked', async () => {
  const { db, s } = load()
  const x = seed(db)
  db.addressDBS.rows[0].lat = null
  const out = await s.arrived({ userId: x.staffUser.id, bookingId: x.b.id, lat: 52, lng: -1 })
  assert.equal(out.visitStatus, 'arrived')
  assert.equal(x.b.arrivedDistanceM, null)
})

test('job: reminds a barber who has not set off, and tells the client once when late', async () => {
  const { db, pushes, s } = load()
  const x = seed(db, { startIn: -5 })
  const first = await s.runVisitNotices()
  assert.equal(first.barberReminders, 1)
  assert.equal(pushes.at(-1).title, 'Home visit now')
  assert.equal((await s.runVisitNotices()).barberReminders, 0)

  await s.onTheWay({ userId: x.staffUser.id, bookingId: x.b.id, etaMinutes: 10 })
  assert.equal((await s.runVisitNotices()).lateNotices, 0)
  const later = DateTime.now().plus({ minutes: 21 })
  assert.equal((await s.runVisitNotices(later)).lateNotices, 1)
  assert.equal(pushes.at(-1).title, 'Your barber is running a little late')
  assert.equal((await s.runVisitNotices(later)).lateNotices, 0)
})

test('punctuality counts arrivals within 5 minutes as on time', () => {
  const { s } = load()
  const day = '2026-11-20'
  const at = (hhmm) => DateTime.fromISO(`${day}T${hhmm}`, { zone: 'Europe/London' }).toJSDate()
  const p = s.punctuality([
    { on: day, startTime: '10:00:00', arrivedAt: at('10:03') },
    { on: day, startTime: '11:00:00', arrivedAt: at('11:20') },
    { on: day, startTime: '12:00:00', arrivedAt: null },
  ])
  assert.deepEqual(p, { arrivals: 2, onTimePercent: 50, averageLateMinutes: 20 })
})

test('customer home bar: the home visit happening now, or none', async () => {
  const { db, s } = load()
  const x = seed(db)
  x.b.salonDetail = x.shop
  const now = await s.activeVisitFor(x.client.id)
  assert.equal(now.bookingId, x.b.id)
  assert.equal(now.shopName, 'Fade Lab')
  assert.equal(now.visitStatus, 'none')
  await s.onTheWay({ userId: x.staffUser.id, bookingId: x.b.id, etaMinutes: 15 })
  assert.equal((await s.activeVisitFor(x.client.id)).visitStatus, 'on_the_way')
  // Not today yet (more than 3 hours away), another client, or a finished visit: nothing.
  assert.equal(await s.activeVisitFor(x.client.id, DateTime.now().minus({ hours: 5 })), null)
  assert.equal(await s.activeVisitFor(x.staffUser.id), null)
  x.b.status = 'complete'
  assert.equal(await s.activeVisitFor(x.client.id), null)
})

// ---- Fake GPS, client confirm and "My barber didn't arrive" ----

const minutesAgo = (m) => new Date(Date.now() - m * 60000)

test('fake GPS is refused on On my way and I\'ve arrived, and counted', async () => {
  const { db, s } = load()
  const x = seed(db)
  await assert.rejects(s.onTheWay({ userId: x.staffUser.id, bookingId: x.b.id, etaMinutes: 10, ...AT_DOOR, mocked: true }), /fake location/)
  await assert.rejects(s.arrived({ userId: x.staffUser.id, bookingId: x.b.id, ...AT_DOOR, mocked: true }), /fake location/)
  assert.equal(x.b.arrivedAt, null)
  assert.equal(x.b.mockAttempts, 2)
  // Later a real check-in is allowed but flagged.
  await s.arrived({ userId: x.staffUser.id, bookingId: x.b.id, ...AT_DOOR, accuracy: 12 })
  assert.equal(x.b.arrivalFlag, 'mock')
})

test('a weak GPS fix is not trusted', async () => {
  const { db, s } = load()
  const x = seed(db)
  await assert.rejects(s.arrived({ userId: x.staffUser.id, bookingId: x.b.id, ...AT_DOOR, accuracy: 450 }), /GPS signal is weak/)
})

test('getting to the door impossibly fast after On my way is flagged', async () => {
  const { db, s } = load()
  const x = seed(db)
  await s.onTheWay({ userId: x.staffUser.id, bookingId: x.b.id, etaMinutes: 30, lat: 51.59, lng: -0.1246 }) // ~10 km away
  await s.arrived({ userId: x.staffUser.id, bookingId: x.b.id, ...AT_DOOR })
  assert.equal(x.b.arrivalFlag, 'suspicious')
  // A normal trip is not flagged.
  const y = seed(db)
  await s.onTheWay({ userId: y.staffUser.id, bookingId: y.b.id, etaMinutes: 30, lat: 51.59, lng: -0.1246 })
  y.b.onTheWayAt = minutesAgo(25)
  await s.arrived({ userId: y.staffUser.id, bookingId: y.b.id, ...AT_DOOR })
  assert.equal(y.b.arrivalFlag, null)
})

test('the client is asked "Is your barber here?"; no answer in 10 minutes counts as yes', async () => {
  const { db, pushes, s } = load()
  const x = seed(db)
  await s.arrived({ userId: x.staffUser.id, bookingId: x.b.id, ...AT_DOOR })
  assert.match(pushes.at(-1).body, /Are they\?/)
  assert.equal(s.statusFields(x.b).askClientHere, true)
  await s.runVisitNotices()
  assert.equal(x.b.clientConfirm, null)
  x.b.arrivedAt = minutesAgo(11)
  await s.runVisitNotices()
  assert.equal(x.b.clientConfirm, 'auto_yes')
  assert.equal(s.statusFields(x.b).askClientHere, false)
})

test('client says Yes: no report', async () => {
  const { db, s } = load()
  const x = seed(db)
  await s.arrived({ userId: x.staffUser.id, bookingId: x.b.id, ...AT_DOOR })
  await s.answerHere({ customerId: x.client.id, bookingId: x.b.id, answer: 'yes' })
  assert.equal(x.b.clientConfirm, 'yes')
})

test('client says No after a trusted check-in: the barber wins, the client can ask Trim to review', async () => {
  const { db, refunds, s, r } = load()
  const x = seed(db)
  await s.arrived({ userId: x.staffUser.id, bookingId: x.b.id, ...AT_DOOR })
  const out = await r.report({ customerId: x.client.id, bookingId: x.b.id })
  assert.equal(out.state, 'barber_won')
  assert.match(out.outcome, /checked in at your address/)
  assert.equal(x.b.clientConfirm, 'no')
  assert.equal(refunds.length, 0)
  assert.equal(x.b.status, 'book')
  const again = await r.askReview({ customerId: x.client.id, bookingId: x.b.id })
  assert.equal(again.state, 'admin_review')
})

test('client says No after a flagged check-in: full refund at once', async () => {
  const { db, refunds, s, r } = load()
  const x = seed(db)
  Object.assign(x.b, { actualCapturedAmount: 20, tip: 0, stripeCardId: 'card', initialPaymentIntend: 'pi_1', total: 45 })
  await s.onTheWay({ userId: x.staffUser.id, bookingId: x.b.id, etaMinutes: 30, lat: 51.59, lng: -0.1246 })
  await s.arrived({ userId: x.staffUser.id, bookingId: x.b.id, ...AT_DOOR })
  const out = await r.report({ customerId: x.client.id, bookingId: x.b.id })
  assert.equal(out.state, 'refunded')
  assert.equal(out.refundAmount, 20)
  assert.deepEqual(refunds, ['pi_1'])
  assert.equal(x.b.status, 'cancel')
  assert.equal(db.jobs.rows[0].status, 'cancel')
})

test("didn't arrive: only from 30 minutes after the start", async () => {
  const { db, r } = load()
  const x = seed(db, { startIn: -10 })
  await assert.rejects(r.report({ customerId: x.client.id, bookingId: x.b.id }), /You can report this from/)
  const y = seed(db, { startIn: -40 })
  const out = await r.report({ customerId: y.client.id, bookingId: y.b.id })
  assert.equal(out.state, 'waiting_barber')
  assert.ok(out.deadlineAt)
})

test("didn't arrive: the barber taps I'm here at the door in time and wins", async () => {
  const { db, pushes, r } = load()
  const x = seed(db, { startIn: -40 })
  await r.report({ customerId: x.client.id, bookingId: x.b.id })
  assert.match(pushes.at(-1).title, /says you haven't arrived/)
  await assert.rejects(r.barberReply({ userId: x.staffUser.id, bookingId: x.b.id, lat: 51.5037, lng: -0.1246 }), /about 3\d\d m away/)
  const out = await r.barberReply({ userId: x.staffUser.id, bookingId: x.b.id, ...AT_DOOR })
  assert.equal(out.visitReport.state, 'barber_won')
  assert.ok(x.b.arrivedAt)
})

test("didn't arrive: no reply in 15 minutes means a full refund and a strike", async () => {
  const { db, refunds, r } = load()
  const x = seed(db, { startIn: -40 })
  Object.assign(x.b, { actualCapturedAmount: 15, tip: 2, stripeCardId: 'card', initialPaymentIntend: 'pi_2', total: 40 })
  await r.report({ customerId: x.client.id, bookingId: x.b.id })
  assert.deepEqual(await r.runReportDeadlines(), { refunded: 0 })
  db.visitReport.rows[0].deadlineAt = minutesAgo(1)
  assert.deepEqual(await r.runReportDeadlines(), { refunded: 1 })
  assert.equal(db.visitReport.rows[0].state, 'refunded')
  assert.equal(Number(db.visitReport.rows[0].refundAmount), 17)
  assert.deepEqual(refunds, ['pi_2'])
  assert.equal(x.b.status, 'cancel')
  const strikes = await r.strikesByEmployee([x.staff.id])
  assert.equal(strikes.get(x.staff.id), 1)
})

test('more than 2 reports in a month go to Trim\'s team', async () => {
  const { db, r } = load()
  const x = seed(db, { startIn: -40 })
  for (let i = 0; i < 2; i++) db.visitReport.seed({ bookingId: 900 + i, customerId: x.client.id, state: 'refunded', createdAt: new Date() })
  const out = await r.report({ customerId: x.client.id, bookingId: x.b.id })
  assert.equal(out.state, 'admin_review')
  const decided = await r.adminDecide({ reportId: out.id, decision: 'barber' })
  assert.equal(decided.state, 'closed')
})

test("didn't arrive: a barber who used fake GPS on the visit can't win with I'm here", async () => {
  const { db, r } = load()
  const x = seed(db, { startIn: -40 })
  await r.report({ customerId: x.client.id, bookingId: x.b.id })
  await assert.rejects(r.barberReply({ userId: x.staffUser.id, bookingId: x.b.id, ...AT_DOOR, mocked: true }), /fake location/)
  const out = await r.barberReply({ userId: x.staffUser.id, bookingId: x.b.id, ...AT_DOOR })
  assert.equal(out.visitReport.state, 'refunded')
  assert.equal(x.b.status, 'cancel')
})
