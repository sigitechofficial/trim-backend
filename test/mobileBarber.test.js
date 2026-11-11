// Run: node --test test/
// Exercises helper/mobileBarber.js against small in-memory stand-ins for the models.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const { Op } = require('sequelize')

function matches(row, where = {}) {
  for (const key of Reflect.ownKeys(where)) {
    const cond = where[key]
    const v = row[key]
    if (Array.isArray(cond)) {
      if (!cond.includes(v)) return false
    } else if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
      for (const op of Reflect.ownKeys(cond)) {
        const x = cond[op]
        if (op === Op.ne && v === x) return false
        if (op === Op.in && !x.includes(v)) return false
        if (op === Op.notIn && x.includes(v)) return false
      }
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
    async create(r) { return this.seed({ createdAt: new Date(), updatedAt: new Date(), ...r }) },
    async findByPk(id) { return rows.find((r) => r.id === Number(id)) || null },
    async findOne(o = {}) { return rows.find((r) => matches(r, o.where)) || null },
    async findAll(o = {}) { return rows.filter((r) => matches(r, o.where)) },
    async count(o = {}) { return rows.filter((r) => matches(r, o.where)).length },
    async update(patch, o = {}) { const hit = rows.filter((r) => matches(r, o.where)); hit.forEach((r) => Object.assign(r, patch)); return [hit.length] },
  }
}

function load() {
  const db = {}
  for (const name of ['salonDetail', 'employee', 'user', 'addressDBS', 'mobileSetting', 'booking', 'jobs']) db[name] = table()
  const file = require.resolve(path.join(__dirname, '..', 'models/index.js'))
  require.cache[file] = { id: file, filename: file, loaded: true, exports: db }
  delete require.cache[require.resolve('../helper/mobileBarber')]
  return { db, mb: require('../helper/mobileBarber') }
}

// Battersea base; a client 2.2 miles away in Clapham and one 13 miles away in Ealing... roughly.
const BASE = { lat: '51.4700', lng: '-0.1700' }
const NEAR = { lat: '51.4620', lng: '-0.1380' }
const FAR = { lat: '51.5130', lng: '-0.3050' }

function seed(db) {
  const owner = db.user.seed({ firstName: 'Omar' })
  const staffUser = db.user.seed({ firstName: 'Sam' })
  const shop = db.salonDetail.seed({ userId: owner.id, salonName: 'Fade Lab', workMode: 'shop', isExternalEmployee: false, deleted: false, addressDB: BASE })
  const ownerRow = db.employee.seed({ userId: owner.id, salonDetailId: shop.id, isOwner: true, isExternalEmployee: false, deleted: false, status: true })
  const staffRow = db.employee.seed({ userId: staffUser.id, salonDetailId: shop.id, isOwner: false, isExternalEmployee: false, deleted: false, status: true })
  return { owner, staffUser, shop, ownerRow, staffRow }
}

test('distance, fee and postcode helpers', () => {
  const { mb } = load()
  const near = mb.milesBetween(BASE, NEAR)
  assert.ok(near > 1 && near < 3, `near was ${near}`)
  assert.equal(mb.milesBetween(BASE, { lat: null, lng: null }), null)
  assert.equal(mb.feeFor({ feeType: 'fixed', fixedFee: '7.50' }, 9), 7.5)
  assert.equal(mb.feeFor({ feeType: 'per_mile', perMileFee: '1.20', minFee: '5' }, 2), 5)
  assert.equal(mb.feeFor({ feeType: 'per_mile', perMileFee: '1.20', minFee: '5' }, 6.5), 7.8)
  assert.equal(mb.postcodeDistrict('sw11 5ab'), 'SW11')
  assert.equal(mb.postcodeDistrict('SW115AB'), 'SW11')
  assert.equal(mb.postcodeDistrict('E1 6AN'), 'E1')
  const masked = mb.maskAddress({ streetAddress: '12 Lavender Hill', apartment: 'Flat 3', city: 'London', postalCode: 'SW11 5AB', lat: '51.46512', lng: '-0.16034', title: 'Ring bell 3' })
  assert.equal(masked.streetAddress, 'London, SW11')
  assert.equal(masked.apartment, '')
  assert.equal(masked.title, '')
  assert.equal(masked.postalCode, 'SW11')
  assert.equal(masked.lat, '51.47')
})

test('owner turns mobile visits on; the shop becomes "both"', async () => {
  const { db, mb } = load()
  const s = seed(db)
  const out = await mb.saveMySettings(s.owner.id, { enabled: true, radiusMiles: 5, feeType: 'fixed', fixedFee: 6 })
  assert.equal(out.role, 'owner')
  assert.equal(out.setting.active, true)
  assert.equal(s.shop.workMode, 'both')
  await assert.rejects(mb.saveMySettings(s.owner.id, { radiusMiles: 80 }), /between 1 and 50/)
  await assert.rejects(mb.setWorkMode(s.owner.id, 'van'), /how you work/)
  await mb.setWorkMode(s.owner.id, 'mobile')
  assert.equal(s.shop.workMode, 'mobile')
})

test('staff need the owner to allow mobile visits; stopping it turns them off', async () => {
  const { db, mb } = load()
  const s = seed(db)
  await assert.rejects(mb.saveMySettings(s.staffUser.id, { enabled: true }), /owner needs to allow/)
  assert.equal((await mb.getMySettings(s.staffUser.id)).canEdit, false)
  await mb.setStaffAllowed(s.owner.id, s.staffRow.id, true)
  const saved = await mb.saveMySettings(s.staffUser.id, { enabled: true, radiusMiles: 3, feeType: 'per_mile', perMileFee: 1.5, minFee: 4 })
  assert.equal(saved.setting.active, true)
  await assert.rejects(mb.setStaffAllowed(s.staffUser.id, s.staffRow.id, true), /Only the shop owner/)
  await mb.setStaffAllowed(s.owner.id, s.staffRow.id, false)
  const row = db.mobileSetting.rows.find((r) => r.employeeId === s.staffRow.id)
  assert.equal(row.enabled, false)
  assert.equal(row.allowedByOwner, false)
})

test('quote checks radius and home services, and prices the trip', async () => {
  const { db, mb } = load()
  const s = seed(db)
  await mb.saveMySettings(s.owner.id, { enabled: true, radiusMiles: 5, feeType: 'per_mile', perMileFee: 2, minFee: 5, serviceIds: [11, 12] })
  const ok = await mb.quote({ salonDetailId: s.shop.id, employeeId: s.ownerRow.id, ...NEAR, serviceIds: [11] })
  assert.equal(ok.available, true)
  assert.equal(ok.travelFee, Math.max(5, Math.round(ok.miles * 2 * 100) / 100))
  const far = await mb.quote({ salonDetailId: s.shop.id, employeeId: s.ownerRow.id, ...FAR, serviceIds: [11] })
  assert.equal(far.available, false)
  assert.match(far.reason, /travels up to 5 miles/)
  const shopOnly = await mb.quote({ salonDetailId: s.shop.id, employeeId: s.ownerRow.id, ...NEAR, serviceIds: [11, 99] })
  assert.match(shopOnly.reason, /only offered at the shop/)
  const notMobile = await mb.quote({ salonDetailId: s.shop.id, employeeId: s.staffRow.id, ...NEAR, serviceIds: [11] })
  assert.match(notMobile.reason, /does not offer home visits/)

  const reach = await mb.salonsReaching(NEAR)
  assert.ok(reach.has(s.shop.id))
  assert.equal((await mb.salonsReaching(FAR)).size, 0)
})

test('booking a home visit saves the address and keeps travel time free', async () => {
  const { db, mb } = load()
  const s = seed(db)
  await mb.saveMySettings(s.owner.id, { enabled: true, radiusMiles: 5, feeType: 'fixed', fixedFee: 8, bufferMinutes: 30 })
  const appointment = { salonDetailId: s.shop.id, on: '2026-11-20', startTime: '14:00', endTime: '14:45' }
  const visit = { ...NEAR, streetAddress: '4 Rectory Grove', apartment: 'Flat 2', postalCode: 'SW4 0DX', city: 'London', note: 'Blue door' }

  await assert.rejects(
    mb.prepareBooking({ appointment, employeeId: s.ownerRow.id, services: [], mobileVisit: visit, sentTravelFee: 3 }),
    /travel fee has changed/,
  )
  const patch = await mb.prepareBooking({ appointment, employeeId: s.ownerRow.id, services: [], mobileVisit: visit, sentTravelFee: 8 })
  assert.equal(patch.isMobileVisit, true)
  assert.equal(patch.travelFee, 8)
  const addr = db.addressDBS.rows.find((a) => a.id === patch.visitAddressId)
  assert.equal(addr.type, 'client_visit')
  assert.equal(addr.title, 'Blue door')

  // Another job ending 15 minutes before: not enough travel time.
  const other = db.booking.seed({ status: 'book' })
  db.jobs.seed({ employeeId: s.ownerRow.id, on: '2026-11-20', status: 'assign', startTime: '13:00', endTime: '13:45', bookingId: other.id })
  await assert.rejects(
    mb.prepareBooking({ appointment, employeeId: s.ownerRow.id, services: [], mobileVisit: visit }),
    /needs travel time/,
  )
})

test('the barber sees only the postcode area until the request is accepted', async () => {
  const { db, mb } = load()
  const addr = db.addressDBS.seed({ streetAddress: '4 Rectory Grove', apartment: 'Flat 2', postalCode: 'SW4 0DX', city: 'London', lat: '51.4620', lng: '-0.1380', title: 'Blue door' })
  const requested = { isMobileVisit: true, visitAddressId: addr.id, status: 'requested' }
  const booked = { isMobileVisit: true, visitAddressId: addr.id, status: 'book' }
  await mb.attachVisitAddress([requested, booked])
  assert.equal(requested.visitAddress.streetAddress, 'London, SW4')
  assert.equal(requested.visitAddress.apartment, '')
  assert.equal(booked.visitAddress.streetAddress, '4 Rectory Grove')
  assert.equal(booked.visitAddress.note, 'Blue door')
  assert.equal(mb.addressLine(booked.visitAddress), 'Flat 2, 4 Rectory Grove, SW4 0DX')
})

test('a mobile-only business shows its area, not its base address', async () => {
  const { db, mb } = load()
  const s = seed(db)
  s.shop.workMode = 'mobile'
  await mb.saveMySettings(s.owner.id, { enabled: true, radiusMiles: 5, fixedFee: 5 })
  const card = { id: s.shop.id, addressDB: { streetAddress: '9 Home Road', city: 'London', postalCode: 'SW11 1AA', lat: '51.47', lng: '-0.17' } }
  await mb.decorateSalons([card])
  assert.equal(card.mobile.mobileOnly, true)
  assert.equal(card.mobile.barbers.length, 1)
  assert.equal(card.addressDB.streetAddress, 'London, SW11')
})

test('cancelling a home visit: travel fee only once the barber has set off', () => {
  const { mb } = load()
  // £32 total = £27 services + £5 travel fee, 25% policy charge.
  assert.equal(mb.cancellationCharge({ total: '32.00', travelFee: '5.00', percent: 25, barberSetOff: false }), 6.75)
  assert.equal(mb.cancellationCharge({ total: '32.00', travelFee: '5.00', percent: 25, barberSetOff: true }), 11.75)
  assert.equal(mb.cancellationCharge({ total: '32.00', travelFee: '5.00', percent: 0, barberSetOff: false }), 0)
  assert.equal(mb.cancellationCharge({ total: '32.00', travelFee: '5.00', percent: 0, barberSetOff: true }), 5)
  assert.equal(mb.cancellationCharge({ total: '32.00', travelFee: '5.00', percent: 150, barberSetOff: false }), 27)
})

test('travel time around a home visit is busy in the slot lists', async () => {
  const { db, mb } = load()
  const s = seed(db)
  await mb.saveMySettings(s.owner.id, { enabled: true, radiusMiles: 5, fixedFee: 5, bufferMinutes: 30 })
  // The stand-in ignores includes; keep only jobs whose booking matches, like the real join.
  const findAll = db.jobs.findAll.bind(db.jobs)
  db.jobs.findAll = async (o = {}) => {
    const rows = await findAll(o)
    const inc = (o.include || []).find((i) => i.model === db.booking)
    return inc ? rows.filter((j) => matches(db.booking.rows.find((b) => b.id === j.bookingId) || {}, inc.where)) : rows
  }
  const visit = db.booking.seed({ isMobileVisit: true, status: 'book' })
  const shopJob = db.booking.seed({ isMobileVisit: false, status: 'book' })
  const gone = db.booking.seed({ isMobileVisit: true, status: 'cancel' })
  db.jobs.seed({ employeeId: s.ownerRow.id, on: '2026-11-20', status: 'assign', startTime: '14:00:00', endTime: '14:45:00', bookingId: visit.id })
  db.jobs.seed({ employeeId: s.ownerRow.id, on: '2026-11-20', status: 'assign', startTime: '10:00:00', endTime: '10:30:00', bookingId: shopJob.id })
  db.jobs.seed({ employeeId: s.ownerRow.id, on: '2026-11-20', status: 'assign', startTime: '17:00:00', endTime: '17:30:00', bookingId: gone.id })
  db.jobs.seed({ employeeId: s.ownerRow.id, on: '2026-11-20', status: 'assign', startTime: '00:10:00', endTime: '00:40:00', bookingId: visit.id })

  const blocks = await mb.travelBlocks([s.ownerRow.id, s.staffRow.id], '2026-11-20')
  assert.deepEqual(blocks.get(s.ownerRow.id), [
    { startTime: '13:30:00', endTime: '15:15:00' },
    { startTime: '00:00:00', endTime: '01:10:00' },
  ])
  assert.equal(blocks.has(s.staffRow.id), false)
  assert.equal((await mb.travelBlocks([s.ownerRow.id], '2026-11-21')).size, 0)

  await mb.saveMySettings(s.owner.id, { bufferMinutes: 0 })
  assert.equal((await mb.travelBlocks([s.ownerRow.id], '2026-11-20')).size, 0)
})

// The stand-in ignores includes; keep only jobs whose booking matches, like the real join.
function joinJobsToBookings(db) {
  const findAll = db.jobs.findAll.bind(db.jobs)
  db.jobs.findAll = async (o = {}) => {
    const rows = await findAll(o)
    const inc = (o.include || []).find((i) => i.model === db.booking)
    return inc ? rows.filter((j) => matches(db.booking.rows.find((b) => b.id === j.bookingId) || {}, inc.where)) : rows
  }
}

test('moving a home visit keeps a travelling barber and travel time', async () => {
  const { db, mb } = load()
  const s = seed(db)
  joinJobsToBookings(db)
  await mb.saveMySettings(s.owner.id, { enabled: true, radiusMiles: 5, fixedFee: 5, bufferMinutes: 30, serviceIds: [11] })
  const addr = db.addressDBS.seed({ ...NEAR })
  const visit = db.booking.seed({ isMobileVisit: true, status: 'book', salonDetailId: s.shop.id, visitAddressId: addr.id, travelFee: '5.00' })
  db.jobs.seed({ employeeId: s.ownerRow.id, on: '2026-11-20', status: 'assign', startTime: '14:00:00', endTime: '14:45:00', bookingId: visit.id, serviceId: 11 })
  const shopJob = db.booking.seed({ isMobileVisit: false, status: 'book' })
  db.jobs.seed({ employeeId: s.ownerRow.id, on: '2026-11-21', status: 'assign', startTime: '10:00:00', endTime: '10:30:00', bookingId: shopJob.id })

  // Same barber, a free time: fine (its own old time doesn't count).
  assert.deepEqual(await mb.checkVisitMove({ bookingId: visit.id, on: '2026-11-20', startTime: '14:15:00', endTime: '15:00:00' }), { employeeId: s.ownerRow.id })
  // Right after a shop booking: no travel time.
  await assert.rejects(mb.checkVisitMove({ bookingId: visit.id, on: '2026-11-21', startTime: '10:45:00', endTime: '11:30:00' }), /travel time/)
  // To a barber who doesn't travel.
  await assert.rejects(mb.checkVisitMove({ bookingId: visit.id, employeeId: s.staffRow.id, on: '2026-11-22', startTime: '10:00:00', endTime: '10:45:00' }), /does not offer home visits/)
  // A shop booking is left alone.
  assert.equal(await mb.checkVisitMove({ bookingId: shopJob.id, on: '2026-11-21', startTime: '10:00:00', endTime: '10:30:00' }), null)

  assert.equal(await mb.totalWithTravelFee(visit.id, '27.00'), 32)
  assert.equal(await mb.totalWithTravelFee(shopJob.id, '27.00'), '27.00')
})

test('"any barber" picks a mobile barber who can go; quote checks travel time', async () => {
  const { db, mb } = load()
  const s = seed(db)
  joinJobsToBookings(db)
  await mb.saveMySettings(s.owner.id, { enabled: true, radiusMiles: 5, fixedFee: 5, bufferMinutes: 30 })
  await mb.setStaffAllowed(s.owner.id, s.staffRow.id, true)
  await mb.saveMySettings(s.staffUser.id, { enabled: true, radiusMiles: 5, fixedFee: 6, bufferMinutes: 30 })
  const busy = db.booking.seed({ isMobileVisit: false, status: 'book' })
  db.jobs.seed({ employeeId: s.ownerRow.id, on: '2026-11-20', status: 'assign', startTime: '13:30:00', endTime: '14:00:00', bookingId: busy.id })
  const when = { on: '2026-11-20', startTime: '2:15 PM', endTime: '3:00 PM' }

  const ownerQuote = await mb.quote({ salonDetailId: s.shop.id, employeeId: s.ownerRow.id, ...NEAR, serviceIds: [], ...when })
  assert.equal(ownerQuote.available, false)
  assert.match(ownerQuote.reason, /travel time/)
  const picked = await mb.pickMobileBarber({ salonDetailId: s.shop.id, ...NEAR, serviceIds: [], ...when })
  assert.equal(picked.available, true)
  assert.equal(picked.employeeId, s.staffRow.id)
  assert.equal(picked.travelFee, 6)
  const none = await mb.pickMobileBarber({ salonDetailId: s.shop.id, ...FAR, serviceIds: [] })
  assert.equal(none.available, false)
})

test('home visit no-show: percentage on services, full travel fee', () => {
  const { mb } = load()
  assert.equal(mb.noShowCharge({ total: '32.00', travelFee: '5.00', percent: 50 }), 18.5)
  assert.equal(mb.noShowCharge({ total: '32.00', travelFee: '5.00', percent: 0 }), 5)
})

test('admin numbers are per barber, not per shop', async () => {
  const { db, mb } = load()
  const s = seed(db)
  await mb.saveMySettings(s.owner.id, { enabled: true, fixedFee: 5 })
  await mb.setStaffAllowed(s.owner.id, s.staffRow.id, true)
  await mb.saveMySettings(s.staffUser.id, { enabled: true, fixedFee: 5 })
  const a = db.booking.seed({ isMobileVisit: true, status: 'complete', salonDetailId: s.shop.id, travelFee: '5.00', on: '2026-11-01', startTime: '10:00' })
  const b = db.booking.seed({ isMobileVisit: true, status: 'book', salonDetailId: s.shop.id, travelFee: '5.00', on: '2026-11-02', startTime: '10:00' })
  db.jobs.seed({ bookingId: a.id, employeeId: s.ownerRow.id })
  db.jobs.seed({ bookingId: b.id, employeeId: s.staffRow.id })
  const { barbers, totals } = await mb.adminOverview()
  const owner = barbers.find((x) => x.employeeId === s.ownerRow.id)
  const staff = barbers.find((x) => x.employeeId === s.staffRow.id)
  assert.deepEqual(owner.stats, { visits: 1, completed: 1, travelFees: 5 })
  assert.deepEqual(staff.stats, { visits: 1, completed: 0, travelFees: 0 })
  assert.equal(totals.visits, 2)
})
