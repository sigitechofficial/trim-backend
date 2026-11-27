/**
 * Mobile barbers: a barber (shop owner, staff member or chair renter) travels
 * to the client's address instead of the client coming to the shop.
 *
 * - Each barber's "Mobile visits" settings live in mobileSettings (one row per
 *   employee row): radius in miles, travel fee (fixed, or per mile with a
 *   minimum), travel buffer, and the services offered at home.
 * - A staff member can only turn it on once the shop owner allows it.
 * - A business can be 'shop', 'mobile' (no shop: its address is a private base
 *   used only to measure distance) or 'both' (salonDetails.workMode).
 * - Distance is measured from the business address to the client's address.
 * - A home visit always waits for the barber to accept it, and the barber sees
 *   only the postcode district until then. The travel fee is worked out here,
 *   never taken from the app.
 */

const { Op } = require('sequelize')
const { DateTime } = require('luxon')
const {
  salonDetail,
  employee,
  user,
  addressDBS,
  mobileSetting,
  booking,
  jobs,
} = require('../models')
const AppError = require('../utils/appError')
const { shopWhere } = require('./branchScope')

const WORK_MODES = ['shop', 'mobile', 'both']
const FEE_TYPES = ['fixed', 'per_mile']
const VISIT_ADDRESS = 'client_visit'
const MAX_RADIUS_MILES = 50
const MAX_FEE = 200
const MAX_BUFFER_MINUTES = 120

// ---------------------------------------------------------------- pure helpers

const round2 = (n) => Math.round(Number(n) * 100) / 100
const round1 = (n) => Math.round(Number(n) * 10) / 10

function num(v) {
  // Missing coordinates are null, not 0 (Number(null) would be 0).
  if (v === null || v === undefined || v === '') return NaN
  return Number(v)
}

/** Straight-line distance in miles, or null when a point has no coordinates. */
function milesBetween(a, b) {
  const lat1 = num(a?.lat)
  const lng1 = num(a?.lng)
  const lat2 = num(b?.lat)
  const lng2 = num(b?.lng)
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return null
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return round1(3958.8 * 2 * Math.asin(Math.sqrt(h)))
}

/** Travel fee for a visit this many miles away. */
function feeFor(setting, miles) {
  if (!setting) return 0
  if (setting.feeType === 'per_mile') {
    const byMile = round2((Number(setting.perMileFee) || 0) * (Number(miles) || 0))
    return Math.max(byMile, round2(Number(setting.minFee) || 0))
  }
  return round2(Number(setting.fixedFee) || 0)
}

/** UK outward code ("SW11 5AB" -> "SW11"); other text is returned trimmed. */
function postcodeDistrict(postcode) {
  const s = String(postcode || '').trim().toUpperCase()
  if (!s) return ''
  if (s.includes(' ')) return s.split(/\s+/)[0]
  // "SW115AB": the inward code is always the last 3 characters.
  return s.length > 4 ? s.slice(0, -3) : s
}

/** Address with only the area left: city and postcode district, coordinates to ~1 km. */
function maskAddress(addr) {
  if (!addr) return addr
  const plain = addr.toJSON ? addr.toJSON() : { ...addr }
  const district = postcodeDistrict(plain.postalCode)
  const area = [...new Set([plain.town || plain.district, plain.city, district].map((x) => String(x || '').trim()).filter(Boolean))].join(', ')
  const roughly = (v) => (Number.isFinite(num(v)) ? String(Math.round(Number(v) * 100) / 100) : v)
  return {
    ...plain,
    title: '',
    streetAddress: area,
    streetLineAddress1: '',
    streetLineAddress2: '',
    building: '',
    floor: '',
    apartment: '',
    postalCode: district,
    lat: roughly(plain.lat),
    lng: roughly(plain.lng),
    masked: true,
  }
}

function serviceIdList(v) {
  if (v === null || v === undefined || v === '') return null
  const list = (Array.isArray(v) ? v : String(v).split(','))
    .map((x) => parseInt(x, 10))
    .filter((x) => Number.isInteger(x) && x > 0)
  return list.length ? [...new Set(list)] : null
}

/** Can clients book this barber at home right now? */
function isActive(setting, emp) {
  if (!setting?.enabled) return false
  return !!(emp?.isOwner || setting.allowedByOwner)
}

function amount(v, label, max = MAX_FEE) {
  if (v === null || v === undefined || v === '') return 0
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0 || n > max) throw new AppError(`Please enter a valid ${label}.`, 200)
  return round2(n)
}

function plainSetting(row, emp) {
  const s = row?.toJSON ? row.toJSON() : row || {}
  return {
    employeeId: s.employeeId ?? emp?.id ?? null,
    enabled: !!s.enabled,
    allowedByOwner: !!(emp?.isOwner || s.allowedByOwner),
    radiusMiles: Number(s.radiusMiles ?? 5),
    feeType: s.feeType || 'fixed',
    fixedFee: Number(s.fixedFee ?? 0),
    perMileFee: Number(s.perMileFee ?? 0),
    minFee: Number(s.minFee ?? 0),
    bufferMinutes: Number(s.bufferMinutes ?? 30),
    serviceIds: serviceIdList(s.serviceIds),
    active: isActive(s, emp),
  }
}

// ---------------------------------------------------------------- business app

// Who is signed in: their employee row and business. A shop owner or chair
// renter owns a salonDetails row; a staff member has an employee row in one.
async function callerOf(userId) {
  const shop = await salonDetail.findOne({
    where: { ...(await shopWhere(userId)), deleted: false },
    attributes: ['id', 'salonName', 'workMode', 'isExternalEmployee', 'parentSalonId'],
  })
  if (shop) {
    const emp = await employee.findOne({
      where: { salonDetailId: shop.id, isOwner: true, deleted: false },
      attributes: ['id', 'isOwner', 'salonDetailId', 'userId'],
    })
    if (!emp) throw new AppError('Your account is not set up yet.', 200)
    return { emp, shop, role: shop.isExternalEmployee ? 'renter' : 'owner' }
  }
  const emp = await employee.findOne({
    where: { userId, deleted: false, isOwner: false },
    attributes: ['id', 'isOwner', 'salonDetailId', 'userId'],
  })
  if (!emp) throw new AppError('Account not found.', 200)
  const staffShop = await salonDetail.findByPk(emp.salonDetailId, {
    attributes: ['id', 'salonName', 'workMode', 'isExternalEmployee', 'parentSalonId'],
  })
  return { emp, shop: staffShop, role: 'staff' }
}

/** "Mobile visits" screen: the caller's own settings and their business work mode. */
async function getMySettings(userId) {
  const { emp, shop, role } = await callerOf(userId)
  const row = await mobileSetting.findOne({ where: { employeeId: emp.id } })
  const setting = plainSetting(row, emp)
  return {
    role,
    workMode: shop?.workMode || 'shop',
    canChangeWorkMode: role !== 'staff',
    // Staff wait for the owner; everyone else decides for themselves.
    canEdit: role !== 'staff' || setting.allowedByOwner,
    setting,
    limits: { maxRadiusMiles: MAX_RADIUS_MILES, maxFee: MAX_FEE, maxBufferMinutes: MAX_BUFFER_MINUTES },
  }
}

/**
 * Home visits still coming up (today on, booked or waiting) for these barbers,
 * or for the whole business when employeeIds is null: { count, next } where
 * next is "Thu 20 Nov, 10:00 AM" (shop clock).
 */
async function upcomingVisits({ salonDetailId, employeeIds = null }, now = DateTime.now()) {
  const today = now.setZone('Europe/London').toISODate()
  const where = { salonDetailId, isMobileVisit: true, status: ['book', 'pending', 'requested'], on: { [Op.gte]: today } }
  let rows = await booking.findAll({ where, attributes: ['id', 'on', 'startTime'], order: [['on', 'ASC'], ['startTime', 'ASC']] })
  if (employeeIds) {
    const mine = await jobs.findAll({ where: { bookingId: rows.map((b) => b.id), employeeId: employeeIds }, attributes: ['bookingId'] })
    const ids = new Set(mine.map((j) => j.bookingId))
    rows = rows.filter((b) => ids.has(b.id))
  }
  rows = rows.filter((b) => String(b.on).slice(0, 10) >= today)
  if (!rows.length) return { count: 0, next: null }
  const first = rows[0]
  const at = DateTime.fromISO(`${String(first.on).slice(0, 10)}T${String(first.startTime).slice(0, 8)}`, { zone: 'Europe/London' })
  return { count: rows.length, next: at.toFormat('ccc d LLL, h:mm a') }
}

/**
 * Turning home visits off leaves booked visits in place. Unless confirmed,
 * returns { needsConfirm, count, next, message } instead of saving.
 */
function confirmTurnOff(upcoming, who) {
  if (!upcoming.count) return null
  const n = upcoming.count === 1 ? '1 home visit' : `${upcoming.count} home visits`
  return {
    needsConfirm: true,
    count: upcoming.count,
    next: upcoming.next,
    message: `${who} ${n} booked (next: ${upcoming.next}). They stay booked: go to them, or cancel or move them from the calendar. New clients won't be able to book home visits.`,
  }
}

/** Save the caller's own settings. Staff can only save once the owner allowed it. */
async function saveMySettings(userId, body = {}) {
  const { emp, shop, role } = await callerOf(userId)
  let row = await mobileSetting.findOne({ where: { employeeId: emp.id } })
  if (role === 'staff' && !row?.allowedByOwner) {
    throw new AppError('Your shop owner needs to allow mobile visits for you first.', 200)
  }
  const feeType = body.feeType ?? row?.feeType ?? 'fixed'
  if (!FEE_TYPES.includes(feeType)) throw new AppError('Please choose a travel fee type.', 200)
  const radius = Number(body.radiusMiles ?? row?.radiusMiles ?? 5)
  if (!Number.isFinite(radius) || radius < 1 || radius > MAX_RADIUS_MILES) {
    throw new AppError(`Travel radius must be between 1 and ${MAX_RADIUS_MILES} miles.`, 200)
  }
  const buffer = parseInt(body.bufferMinutes ?? row?.bufferMinutes ?? 30, 10)
  if (!Number.isInteger(buffer) || buffer < 0 || buffer > MAX_BUFFER_MINUTES) {
    throw new AppError(`Travel time must be between 0 and ${MAX_BUFFER_MINUTES} minutes.`, 200)
  }
  const patch = {
    enabled: body.enabled === undefined ? !!row?.enabled : body.enabled === true || body.enabled === 'true',
    radiusMiles: round1(radius),
    feeType,
    fixedFee: amount(body.fixedFee ?? row?.fixedFee, 'travel fee'),
    perMileFee: amount(body.perMileFee ?? row?.perMileFee, 'fee per mile', 20),
    minFee: amount(body.minFee ?? row?.minFee, 'minimum travel fee'),
    bufferMinutes: buffer,
    serviceIds: body.serviceIds === undefined ? row?.serviceIds ?? null : serviceIdList(body.serviceIds)?.join(',') ?? null,
  }
  if (patch.enabled && patch.feeType === 'per_mile' && !patch.perMileFee && !patch.minFee) {
    throw new AppError('Please enter a fee per mile.', 200)
  }
  if (row?.enabled && !patch.enabled && !(body.confirm === true || body.confirm === 'true')) {
    const ask = confirmTurnOff(await upcomingVisits({ salonDetailId: emp.salonDetailId, employeeIds: [emp.id] }), 'You still have')
    if (ask) return ask
  }
  if (row) await row.update(patch)
  else {
    row = await mobileSetting.create({
      ...patch,
      employeeId: emp.id,
      salonDetailId: emp.salonDetailId,
      allowedByOwner: !!emp.isOwner,
    })
  }
  // A mobile-only business with nobody mobile can't take bookings; keep it
  // honest by switching a shop that turns mobile on to 'both'.
  if (patch.enabled && role !== 'staff' && shop?.workMode === 'shop') {
    await salonDetail.update({ workMode: 'both' }, { where: { id: shop.id } })
  }
  return getMySettings(userId)
}

/** Owner or renter picks how the business works: 'shop', 'mobile' or 'both'. */
async function setWorkMode(userId, mode, confirm = false) {
  if (!WORK_MODES.includes(mode)) throw new AppError('Please choose how you work.', 200)
  const { shop, role } = await callerOf(userId)
  if (role === 'staff') throw new AppError('Only the shop owner can change this.', 200)
  if (mode === 'shop' && shop.workMode !== 'shop' && !confirm) {
    const ask = confirmTurnOff(await upcomingVisits({ salonDetailId: shop.id }), 'Your business still has')
    if (ask) return ask
  }
  await salonDetail.update({ workMode: mode }, { where: { id: shop.id } })
  return getMySettings(userId)
}

/** Owner's team list with each member's mobile status. */
async function teamSettings(ownerUserId) {
  const { shop, role } = await callerOf(ownerUserId)
  if (role === 'staff') throw new AppError('Only the shop owner can see this.', 200)
  const team = await employee.findAll({
    where: { salonDetailId: shop.id, deleted: false, isExternalEmployee: false },
    attributes: ['id', 'isOwner', 'position', 'status'],
    include: [{ model: user, attributes: ['firstName', 'lastName', 'image'] }],
    order: [['isOwner', 'DESC'], ['id', 'ASC']],
  })
  const rows = await mobileSetting.findAll({ where: { employeeId: team.map((e) => e.id) } })
  const byEmp = new Map(rows.map((r) => [r.employeeId, r]))
  return team.map((e) => ({
    employeeId: e.id,
    name: [e.user?.firstName, e.user?.lastName].filter(Boolean).join(' '),
    image: e.user?.image || null,
    position: e.position,
    isOwner: !!e.isOwner,
    setting: plainSetting(byEmp.get(e.id), e),
  }))
}

/** Owner allows (or stops) mobile visits for one staff member. */
async function setStaffAllowed(ownerUserId, employeeId, allowed, confirm = false) {
  const { shop, role } = await callerOf(ownerUserId)
  if (role === 'staff') throw new AppError('Only the shop owner can change this.', 200)
  const staff = await employee.findOne({
    where: { id: employeeId, salonDetailId: shop.id, deleted: false, isOwner: false, isExternalEmployee: false },
    attributes: ['id', 'salonDetailId', 'isOwner'],
  })
  if (!staff) throw new AppError('Team member not found.', 200)
  const row = await mobileSetting.findOne({ where: { employeeId: staff.id } })
  if (!allowed && row?.allowedByOwner && !confirm) {
    const ask = confirmTurnOff(await upcomingVisits({ salonDetailId: shop.id, employeeIds: [staff.id] }), 'This team member still has')
    if (ask) return ask
  }
  // Stopping it also turns their mobile visits off.
  const patch = allowed ? { allowedByOwner: true } : { allowedByOwner: false, enabled: false }
  if (row) await row.update(patch)
  else await mobileSetting.create({ ...patch, employeeId: staff.id, salonDetailId: shop.id })
  return teamSettings(ownerUserId)
}

// ---------------------------------------------------------------- customer side

// Active mobile settings for these businesses, with each barber's employee row.
async function activeSettingsFor(salonDetailIds) {
  if (!salonDetailIds?.length) return []
  const rows = await mobileSetting.findAll({ where: { salonDetailId: salonDetailIds, enabled: true } })
  if (!rows.length) return []
  const emps = await employee.findAll({
    where: { id: rows.map((r) => r.employeeId), deleted: false, status: true },
    attributes: ['id', 'isOwner', 'salonDetailId'],
  })
  const empById = new Map(emps.map((e) => [e.id, e]))
  return rows.filter((r) => isActive(r, empById.get(r.employeeId))).map((r) => ({ row: r, emp: empById.get(r.employeeId) }))
}

/**
 * Businesses with at least one barber who travels to this point
 * (for the "Comes to you" search filter). Returns a Map salonDetailId -> nearest miles.
 */
async function salonsReaching(point) {
  const all = await mobileSetting.findAll({ where: { enabled: true }, attributes: ['salonDetailId'] })
  const ids = [...new Set(all.map((r) => r.salonDetailId))]
  const active = await activeSettingsFor(ids)
  if (!active.length) return new Map()
  const shops = await salonDetail.findAll({
    where: { id: [...new Set(active.map((a) => a.row.salonDetailId))], deleted: false },
    attributes: ['id'],
    include: [{ model: addressDBS, attributes: ['lat', 'lng'] }],
  })
  const baseById = new Map(shops.map((s) => [s.id, s.addressDB]))
  const out = new Map()
  for (const { row } of active) {
    const miles = milesBetween(baseById.get(row.salonDetailId), point)
    if (miles === null || miles > Number(row.radiusMiles)) continue
    const prev = out.get(row.salonDetailId)
    if (prev === undefined || miles < prev) out.set(row.salonDetailId, miles)
  }
  return out
}

/**
 * Mobile info for the customer app's shop page and lists:
 * { workMode, mobile, barbers: [{ employeeId, radiusMiles, feeType, ... }] }.
 */
async function mobileInfoFor(salonDetailIds) {
  const ids = [...new Set((salonDetailIds || []).filter(Boolean))]
  const out = new Map()
  if (!ids.length) return out
  const shops = await salonDetail.findAll({ where: { id: ids }, attributes: ['id', 'workMode'] })
  const active = await activeSettingsFor(ids)
  for (const s of shops) {
    const barbers = active
      .filter((a) => a.row.salonDetailId === s.id)
      .map(({ row, emp }) => {
        const p = plainSetting(row, emp)
        return {
          employeeId: p.employeeId,
          radiusMiles: p.radiusMiles,
          feeType: p.feeType,
          fixedFee: p.fixedFee,
          perMileFee: p.perMileFee,
          minFee: p.minFee,
          serviceIds: p.serviceIds,
        }
      })
    const workMode = s.workMode || 'shop'
    out.set(s.id, { workMode, mobile: barbers.length > 0, mobileOnly: workMode === 'mobile', barbers })
  }
  return out
}

/** Adds `mobile` to each salon (plain objects) and hides the base address of mobile-only ones. */
async function decorateSalons(salons) {
  const list = (Array.isArray(salons) ? salons : [salons]).filter(Boolean)
  if (!list.length) return
  try {
    const info = await mobileInfoFor(list.map((s) => s.id))
    for (const s of list) {
      const m = info.get(s.id) || { workMode: 'shop', mobile: false, mobileOnly: false, barbers: [] }
      s.mobile = m
      if (m.mobileOnly && s.addressDB) s.addressDB = maskAddress(s.addressDB)
    }
  } catch (err) {
    console.error('[mobileBarber] decorateSalons failed:', err.message)
  }
}

/** The employee id of a business's only mobile barber (null when none or several). */
async function onlyMobileBarber(salonDetailId) {
  const active = await activeSettingsFor([Number(salonDetailId)])
  return active.length === 1 ? active[0].row.employeeId : null
}

/**
 * Price check for a home visit: can this barber come to this address for these
 * services, and what is the travel fee? With the visit's day and times it also
 * checks the barber has travel time then, so the client hears it at "Where?".
 */
async function quote({ salonDetailId, employeeId, lat, lng, serviceIds, on, startTime, endTime }) {
  const point = { lat, lng }
  if (!Number.isFinite(num(lat)) || !Number.isFinite(num(lng))) {
    return { available: false, reason: 'Please choose your address from the list.' }
  }
  if (!employeeId) return { available: false, reason: 'Please choose a barber for a home visit.' }
  const emp = await employee.findOne({
    where: { id: employeeId, salonDetailId, deleted: false, status: true },
    attributes: ['id', 'isOwner', 'salonDetailId'],
  })
  const row = emp && (await mobileSetting.findOne({ where: { employeeId: emp.id } }))
  if (!isActive(row, emp)) return { available: false, reason: 'This barber does not offer home visits.' }
  const shop = await salonDetail.findByPk(salonDetailId, {
    attributes: ['id'],
    include: [{ model: addressDBS, attributes: ['lat', 'lng'] }],
  })
  const miles = milesBetween(shop?.addressDB, point)
  const radiusMiles = Number(row.radiusMiles)
  if (miles === null) return { available: false, reason: 'This barber has no base address yet.' }
  if (miles > radiusMiles) {
    return { available: false, miles, radiusMiles, reason: `This barber travels up to ${radiusMiles} miles. Your address is ${miles} miles away.` }
  }
  const allowed = serviceIdList(row.serviceIds)
  const wanted = serviceIdList(serviceIds) || []
  if (allowed && wanted.some((id) => !allowed.includes(id))) {
    return { available: false, miles, radiusMiles, reason: 'Some of these services are only offered at the shop.' }
  }
  const bufferMinutes = Number(row.bufferMinutes) || 0
  const start = clockTime(startTime)
  const end = clockTime(endTime)
  if (on && start && end && (await clashesWithTravel({ employeeId: emp.id, on, startTime: start, endTime: end, bufferMinutes }))) {
    return { available: false, miles, radiusMiles, reason: 'Your barber needs travel time around this visit. Please choose another time.' }
  }
  return {
    available: true,
    employeeId: emp.id,
    miles,
    radiusMiles,
    travelFee: feeFor(row, miles),
    feeType: row.feeType,
    bufferMinutes,
  }
}

// "2:30 PM", "14:30" or "14:30:00" -> "14:30:00"; null when unreadable.
function clockTime(t) {
  const m = String(t || '').trim().toUpperCase().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/)
  if (!m) return null
  let h = parseInt(m[1], 10)
  if (m[3] === 'AM' && h === 12) h = 0
  if (m[3] === 'PM' && h !== 12) h += 12
  return `${String(h).padStart(2, '0')}:${m[2]}:00`
}

/**
 * "Any barber" home visit: the first barber of the business who travels to
 * this address for these services (and is free then). Returns their quote
 * with employeeId, or the first reason none can go.
 */
async function pickMobileBarber({ salonDetailId, ...visit }) {
  const active = await activeSettingsFor([Number(salonDetailId)])
  if (!active.length) return { available: false, reason: 'This business does not offer home visits right now.' }
  let first = null
  for (const { row } of active) {
    const q = await quote({ ...visit, salonDetailId, employeeId: row.employeeId })
    if (q.available) return q
    first = first || q
  }
  return first
}

function toMinutes(t) {
  const [h, m] = String(t || '0:0').split(':').map((x) => parseInt(x, 10) || 0)
  return h * 60 + m
}

/** Does the barber have another job too close to this visit to travel between them? */
async function clashesWithTravel({ employeeId, on, startTime, endTime, bufferMinutes, ignoreBookingId }) {
  if (!bufferMinutes) return false
  const others = await jobs.findAll({
    where: {
      employeeId,
      on,
      status: 'assign',
      ...(ignoreBookingId ? { bookingId: { [Op.ne]: ignoreBookingId } } : {}),
    },
    attributes: ['startTime', 'endTime', 'bookingId'],
    include: [{ model: booking, attributes: ['status'], where: { status: { [Op.notIn]: ['cancel', 'no-show'] } } }],
  })
  const s = toMinutes(startTime) - bufferMinutes
  const e = toMinutes(endTime) + bufferMinutes
  return others.some((j) => toMinutes(j.startTime) < e && toMinutes(j.endTime) > s)
}

function toClock(minutes) {
  const m = Math.min(Math.max(minutes, 0), 24 * 60 - 1)
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00`
}

/**
 * Travel time around each barber's home visits on a day, as busy times for the
 * slot lists: [visit start - buffer, visit end + buffer]. Keeps a shop booking
 * from landing right before or after a home visit.
 * Returns a Map employeeId -> [{ startTime, endTime }].
 */
// excludeBookingId: leave out that booking's own travel time (adding a
// service to a home visit just makes the same visit longer).
async function travelBlocks(employeeIds, on, { excludeBookingId } = {}) {
  const ids = [...new Set((employeeIds || []).map(Number).filter(Boolean))]
  const out = new Map()
  if (!ids.length || !on) return out
  const settings = await mobileSetting.findAll({ where: { employeeId: ids }, attributes: ['employeeId', 'bufferMinutes'] })
  const buffer = new Map(settings.map((s) => [Number(s.employeeId), Number(s.bufferMinutes) || 0]))
  const withBuffer = ids.filter((id) => buffer.get(id) > 0)
  if (!withBuffer.length) return out
  const visits = await jobs.findAll({
    where: { employeeId: withBuffer, on, status: 'assign' },
    attributes: ['employeeId', 'startTime', 'endTime', 'bookingId'],
    include: [{ model: booking, attributes: [], where: { isMobileVisit: true, status: { [Op.notIn]: ['cancel', 'no-show'] } } }],
  })
  for (const j of visits) {
    if (excludeBookingId && Number(j.bookingId) === Number(excludeBookingId)) continue
    const id = Number(j.employeeId)
    const pad = buffer.get(id)
    if (!out.has(id)) out.set(id, [])
    out.get(id).push({ startTime: toClock(toMinutes(j.startTime) - pad), endTime: toClock(toMinutes(j.endTime) + pad) })
  }
  return out
}

/**
 * bookAppointment: checks a home visit and saves the client's address.
 * Returns the booking fields to set; throws with a message the app shows.
 * body.mobileVisit = { lat, lng, streetAddress, apartment, postalCode, city, note }
 */
async function prepareBooking({ appointment, employeeId, services, mobileVisit, sentTravelFee }) {
  const visit = mobileVisit || {}
  const serviceIds = (services || []).map((s) => s.serviceId)
  const q = await quote({ salonDetailId: appointment.salonDetailId, employeeId, lat: visit.lat, lng: visit.lng, serviceIds })
  if (!q.available) throw new AppError(q.reason, 200)
  if (sentTravelFee !== undefined && sentTravelFee !== null && Math.abs(Number(sentTravelFee) - q.travelFee) > 0.01) {
    throw new AppError('The travel fee has changed. Please check your booking again.', 200)
  }
  if (!String(visit.streetAddress || '').trim()) throw new AppError('Please enter your address.', 200)
  const start = appointment.startTime
  const end = appointment.endTime
  if (await clashesWithTravel({ employeeId, on: appointment.on, startTime: start, endTime: end, bufferMinutes: q.bufferMinutes })) {
    throw new AppError('Your barber needs travel time around this visit. Please choose another time.', 200)
  }
  const text = (v, max = 255) => String(v ?? '').trim().slice(0, max)
  const address = await addressDBS.create({
    type: VISIT_ADDRESS,
    streetAddress: text(visit.streetAddress),
    apartment: text(visit.apartment, 100),
    building: text(visit.building, 100),
    postalCode: text(visit.postalCode, 20),
    city: text(visit.city, 100),
    town: text(visit.town, 100),
    country: text(visit.country || 'United Kingdom', 100),
    // Access note for the barber ("ring bell 2", "parking at the back").
    title: text(visit.note, 255),
    lat: String(visit.lat),
    lng: String(visit.lng),
  })
  return { isMobileVisit: true, visitAddressId: address.id, travelFee: q.travelFee, travelMiles: q.miles }
}

/**
 * A home visit is moved (reschedule, or the shop suggests another time): it
 * stays with one barber who travels to this address, and keeps travel time
 * around it. Returns null for a shop booking, else { employeeId } (the barber
 * the visit stays with); throws with a message the apps show.
 */
async function checkVisitMove({ bookingId, employeeId, on, startTime, endTime }) {
  const b = await booking.findByPk(bookingId, { attributes: ['id', 'isMobileVisit', 'salonDetailId', 'visitAddressId'] })
  if (!b?.isMobileVisit) return null
  const visitJobs = await jobs.findAll({ where: { bookingId: b.id }, attributes: ['employeeId', 'serviceId'] })
  const current = visitJobs.map((j) => j.employeeId).find(Boolean) || null
  const target = Number(employeeId) || current
  if (!target) throw new AppError('Please choose a barber for this home visit.', 200)
  const setting = await mobileSetting.findOne({ where: { employeeId: target } })
  if (target !== current) {
    const addr = await addressDBS.findByPk(b.visitAddressId, { attributes: ['lat', 'lng'] })
    const q = await quote({
      salonDetailId: b.salonDetailId,
      employeeId: target,
      lat: addr?.lat,
      lng: addr?.lng,
      serviceIds: visitJobs.map((j) => j.serviceId),
    })
    if (!q.available) throw new AppError(`This barber can't take this home visit. ${q.reason}`, 200)
  }
  const clash = await clashesWithTravel({
    employeeId: target,
    on,
    startTime,
    endTime,
    bufferMinutes: Number(setting?.bufferMinutes) || 0,
    ignoreBookingId: b.id,
  })
  if (clash) throw new AppError('The barber needs travel time around this home visit. Please choose another time.', 200)
  return { employeeId: target }
}

/**
 * The apps send a rescheduled booking's total without the travel fee (services
 * and VAT only); a home visit keeps its fee in the total.
 */
async function totalWithTravelFee(bookingId, total) {
  if (total === undefined || total === null || total === '') return total
  const b = await booking.findByPk(bookingId, { attributes: ['isMobileVisit', 'travelFee'] })
  if (!b?.isMobileVisit) return total
  return round2((Number(total) || 0) + (Number(b.travelFee) || 0))
}

/**
 * Client not at home: the shop's no-show percentage applies to the services,
 * and the travel fee is charged in full (the barber made the trip).
 */
function noShowCharge({ total, travelFee, percent }) {
  return cancellationCharge({ total, travelFee, percent, barberSetOff: true })
}

// After a home visit the barber keeps only the area of the client's address.
const KEEP_ADDRESS_DAYS = 7

/**
 * Why the barber sees only the area: 'request' (not accepted yet),
 * 'cancelled', 'visit_over' (KEEP_ADDRESS_DAYS after the visit day), or null.
 */
function addressHiddenReason(b, now = DateTime.now()) {
  if (b.status === 'requested') return 'request'
  if (b.status === 'cancel') return 'cancelled'
  if (b.on) {
    const last = DateTime.fromISO(String(b.on).slice(0, 10), { zone: 'Europe/London' }).plus({ days: KEEP_ADDRESS_DAYS })
    if (now.setZone('Europe/London').startOf('day') > last) return 'visit_over'
  }
  return null
}

/**
 * Business app booking views: put the client's address on mobile bookings
 * (booking.visitAddress), masked to the postcode district until the booking is
 * accepted, once it is cancelled, and KEEP_ADDRESS_DAYS after the visit.
 * Works on plain objects or model rows.
 */
async function attachVisitAddress(bookings, now = DateTime.now()) {
  const list = (Array.isArray(bookings) ? bookings : [bookings]).filter((b) => b?.isMobileVisit && b.visitAddressId)
  if (!list.length) return
  try {
    const rows = await addressDBS.findAll({ where: { id: [...new Set(list.map((b) => b.visitAddressId))] } })
    const byId = new Map(rows.map((r) => [r.id, r.toJSON()]))
    for (const b of list) {
      const addr = byId.get(b.visitAddressId)
      if (!addr) continue
      const hidden = addressHiddenReason(b, now)
      const value = hidden ? { ...maskAddress(addr), hiddenReason: hidden } : { ...addr, note: addr.title || '' }
      if (b.dataValues) b.dataValues.visitAddress = value
      else b.visitAddress = value
    }
  } catch (err) {
    console.error('[mobileBarber] attachVisitAddress failed:', err.message)
  }
}

/**
 * Client cancels a home visit: the shop's cancellation percentage applies to
 * the services only. The travel fee is charged in full only once the barber
 * has set off ("On my way" or "Arrived"); before that it is never charged.
 */
function cancellationCharge({ total, travelFee, percent, barberSetOff }) {
  const fee = round2(Number(travelFee) || 0)
  const services = Math.max(0, round2((Number(total) || 0) - fee))
  const pct = Math.min(100, Math.max(0, Number(percent) || 0))
  return round2((services * pct) / 100 + (barberSetOff ? fee : 0))
}

/** One-line address for pushes, emails and reminders. */
function addressLine(addr) {
  if (!addr) return ''
  return [addr.apartment, addr.building, addr.streetAddress, addr.postalCode].map((x) => String(x || '').trim()).filter(Boolean).join(', ')
}

// ---------------------------------------------------------------- admin panel

async function adminOverview() {
  const rows = await mobileSetting.findAll({ order: [['updatedAt', 'DESC']] })
  const emps = await employee.findAll({
    where: { id: rows.map((r) => r.employeeId) },
    attributes: ['id', 'isOwner', 'salonDetailId', 'deleted', 'status'],
    include: [{ model: user, attributes: ['firstName', 'lastName', 'email'] }],
  })
  const empById = new Map(emps.map((e) => [e.id, e]))
  const shopIds = [...new Set(rows.map((r) => r.salonDetailId))]
  const shops = await salonDetail.findAll({
    where: { id: shopIds },
    attributes: ['id', 'salonName', 'workMode', 'isExternalEmployee'],
    include: [{ model: addressDBS, attributes: ['city', 'postalCode'] }],
  })
  const shopById = new Map(shops.map((s) => [s.id, s]))
  const visits = shopIds.length
    ? await booking.findAll({
        where: { salonDetailId: shopIds, isMobileVisit: true },
        attributes: ['id', 'salonDetailId', 'status', 'travelFee', 'on', 'startTime', 'arrivedAt'],
      })
    : []
  // Each visit belongs to the barber doing it (its jobs), not to the whole shop.
  const visitJobs = visits.length
    ? await jobs.findAll({ where: { bookingId: visits.map((v) => v.id) }, attributes: ['bookingId', 'employeeId'] })
    : []
  const barberOfVisit = new Map()
  for (const j of visitJobs) if (j.employeeId && !barberOfVisit.has(j.bookingId)) barberOfVisit.set(j.bookingId, j.employeeId)
  const visitsOf = (employeeId) => visits.filter((v) => barberOfVisit.get(v.id) === employeeId)
  const statsOf = (list) => {
    const s = { visits: 0, completed: 0, travelFees: 0 }
    for (const v of list) {
      s.visits += 1
      if (v.status === 'complete') {
        s.completed += 1
        s.travelFees = round2(s.travelFees + Number(v.travelFee || 0))
      }
    }
    return s
  }
  const barbers = rows.map((r) => {
    const e = empById.get(r.employeeId)
    const shop = shopById.get(r.salonDetailId)
    const role = e?.isOwner ? (shop?.isExternalEmployee ? 'Chair renter' : 'Owner') : 'Staff'
    return {
      ...plainSetting(r, e),
      id: r.id,
      name: [e?.user?.firstName, e?.user?.lastName].filter(Boolean).join(' '),
      email: e?.user?.email || null,
      role,
      salonDetailId: r.salonDetailId,
      shopName: shop?.salonName || null,
      workMode: shop?.workMode || 'shop',
      area: [shop?.addressDB?.city, postcodeDistrict(shop?.addressDB?.postalCode)].filter(Boolean).join(', '),
      removed: !!e?.deleted,
      updatedAt: r.updatedAt,
      stats: statsOf(visitsOf(r.employeeId)),
    }
  })
  // Lazy require: mobileVisitStatus requires this file.
  const { punctuality } = require('./mobileVisitStatus')
  for (const b of barbers) b.punctuality = punctuality(visitsOf(b.employeeId))
  const mobileOnly = await salonDetail.count({ where: { workMode: 'mobile', deleted: false } })
  return {
    barbers,
    totals: {
      active: barbers.filter((b) => b.active && !b.removed).length,
      mobileOnlyBusinesses: mobileOnly,
      visits: visits.length,
      completedVisits: visits.filter((v) => v.status === 'complete').length,
      ...require('./mobileVisitStatus').punctuality(visits),
    },
  }
}

module.exports = {
  WORK_MODES,
  VISIT_ADDRESS,
  milesBetween,
  feeFor,
  postcodeDistrict,
  maskAddress,
  isActive,
  callerOf,
  getMySettings,
  saveMySettings,
  setWorkMode,
  teamSettings,
  setStaffAllowed,
  salonsReaching,
  mobileInfoFor,
  onlyMobileBarber,
  pickMobileBarber,
  decorateSalons,
  quote,
  clashesWithTravel,
  travelBlocks,
  prepareBooking,
  checkVisitMove,
  totalWithTravelFee,
  noShowCharge,
  attachVisitAddress,
  upcomingVisits,
  addressHiddenReason,
  KEEP_ADDRESS_DAYS,
  addressLine,
  cancellationCharge,
  adminOverview,
}
