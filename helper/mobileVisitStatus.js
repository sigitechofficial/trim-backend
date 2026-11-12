/**
 * Home visit day: the barber taps "On my way" (with how many minutes away they
 * are) and then "I've arrived". The client gets a push for each, and the times
 * are kept on the booking (they also show when the barber was at the door if
 * the client was not home).
 *
 * The 5-minute job (jobs/mobileVisitCron.js) reminds a barber who has not set
 * off once the visit time has come, and tells the client when the barber is
 * running late (ETA + LATE_GRACE_MINUTES has passed without "arrived").
 */

const { DateTime } = require('luxon')
const { Op } = require('sequelize')
const { booking, jobs, employee, user, salonDetail, deviceToken, addressDBS } = require('../models')
const AppError = require('../utils/appError')
const Throw = require('../utils/throwNotification')
const { appointmentStart } = require('./bookingApproval')
const { callerOf } = require('./mobileBarber')

const ETA_CHOICES = [10, 15, 20, 30, 45, 60]
const OPEN_HOURS_BEFORE = 3 // the buttons show from 3 hours before the visit
const OPEN_HOURS_AFTER = 3 // ...until 3 hours after it ends
const LATE_GRACE_MINUTES = 10
const ACTIVE = ['book', 'pending']
const ARRIVE_RADIUS_M = 100 // "I've arrived" works only this close to the client's pin

// "330 m" nearby; further away in miles, as the apps show distances ("6.9 mi").
function howFar(metres) {
  if (metres < 1000) return `${metres} m`
  const miles = metres / 1609.344
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} miles`
}

/** Straight-line distance in metres between two {lat, lng}, or null. */
function metresBetween(a, b) {
  const p = [a?.lat, a?.lng, b?.lat, b?.lng].map((v) => (v === null || v === undefined || v === '' ? NaN : Number(v)))
  if (!p.every(Number.isFinite)) return null
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(p[2] - p[0])
  const dLng = toRad(p[3] - p[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p[0])) * Math.cos(toRad(p[2])) * Math.sin(dLng / 2) ** 2
  return Math.round(6371000 * 2 * Math.asin(Math.sqrt(h)))
}

async function push(userIds, notification, data) {
  try {
    const ids = [...new Set(userIds.filter(Boolean))]
    if (!ids.length) return
    const tokens = await require('./staffDevices').ownDeviceTokens(ids)
    if (tokens.length) await Throw(tokens, notification, { type: 'mobileVisit', ...data }, ids[0])
  } catch (err) {
    console.error('[mobileVisit] push failed:', err.message)
  }
}

function endOf(b) {
  return appointmentStart(b.on, b.endTime || b.startTime)
}

/** Can the barber use the On my way / Arrived buttons on this booking right now? */
function windowState(b, now = DateTime.now()) {
  const start = appointmentStart(b.on, b.startTime)
  if (now < start.minus({ hours: OPEN_HOURS_BEFORE })) return 'early'
  if (now > endOf(b).plus({ hours: OPEN_HOURS_AFTER })) return 'over'
  return 'open'
}

/** The plain status the apps show: 'none' | 'on_the_way' | 'arrived'. */
function visitStatus(b) {
  if (b?.arrivedAt) return 'arrived'
  if (b?.onTheWayAt) return 'on_the_way'
  return 'none'
}

/** When the client can expect the barber (ISO), or null. */
function expectedAt(b) {
  if (!b?.onTheWayAt || !b.etaMinutes) return null
  return DateTime.fromJSDate(new Date(b.onTheWayAt)).plus({ minutes: Number(b.etaMinutes) }).toISO()
}

/** Fields for the business and client apps. */
function statusFields(b) {
  return {
    visitStatus: visitStatus(b),
    onTheWayAt: b?.onTheWayAt || null,
    etaMinutes: b?.etaMinutes ?? null,
    expectedAt: expectedAt(b),
    // Shop-local clock time, like the booking's own times ("7:47 AM").
    expectedTime: expectedAt(b) ? DateTime.fromISO(expectedAt(b)).setZone('Europe/London').toFormat('h:mm a') : null,
    arrivedTime: b?.arrivedAt ? DateTime.fromJSDate(new Date(b.arrivedAt)).setZone('Europe/London').toFormat('h:mm a') : null,
    arrivedAt: b?.arrivedAt || null,
    arrivedDistanceM: b?.arrivedDistanceM ?? null,
    etaChoices: ETA_CHOICES,
  }
}

// The booking, if the signed-in barber may update it: the owner of the business
// or the barber doing one of its services.
async function ownVisit(userId, bookingId) {
  const b = await booking.findByPk(bookingId)
  if (!b || !b.isMobileVisit) throw new AppError('Home visit not found.', 200)
  const { emp, shop, role } = await callerOf(userId)
  if (b.salonDetailId !== shop?.id) throw new AppError('Home visit not found.', 200)
  if (role === 'staff') {
    const mine = await jobs.count({ where: { bookingId: b.id, employeeId: emp.id } })
    if (!mine) throw new AppError('This home visit is with another barber.', 200)
  }
  if (!ACTIVE.includes(b.status)) throw new AppError('This booking is no longer active.', 200)
  return b
}

function barberName(shop, emp) {
  const name = [emp?.user?.firstName, emp?.user?.lastName].filter(Boolean).join(' ')
  return name || shop?.salonName || 'Your barber'
}

async function barberOf(b) {
  const job = await jobs.findOne({
    where: { bookingId: b.id },
    include: [{ model: employee, attributes: ['id', 'userId'], include: [{ model: user, attributes: ['firstName', 'lastName'] }] }],
  })
  const shop = await salonDetail.findByPk(b.salonDetailId, { attributes: ['id', 'salonName', 'userId'] })
  return { shop, emp: job?.employee || null }
}

async function onTheWay({ userId, bookingId, etaMinutes }) {
  const eta = parseInt(etaMinutes, 10)
  if (!ETA_CHOICES.includes(eta)) throw new AppError('Please choose how long until you arrive.', 200)
  const b = await ownVisit(userId, bookingId)
  if (b.arrivedAt) throw new AppError('You have already arrived.', 200)
  const state = windowState(b)
  if (state === 'early') throw new AppError(`You can tell the client you are on the way from ${OPEN_HOURS_BEFORE} hours before the visit.`, 200)
  if (state === 'over') throw new AppError('This visit time has passed.', 200)
  // Tapping again updates the time (stuck in traffic); the late notice can go again.
  await b.update({ onTheWayAt: new Date(), etaMinutes: eta, lateNoticeAt: null })
  const { shop, emp } = await barberOf(b)
  const at = DateTime.now().setZone('Europe/London').plus({ minutes: eta }).toFormat('h:mm a')
  await push([b.customerId], {
    title: 'Your barber is on the way',
    body: `${barberName(shop, emp)} is on the way · about ${eta} min (around ${at}).`,
  }, { bookingId: b.id, visitStatus: 'on_the_way' })
  return statusFields(b)
}

/**
 * "I've arrived": the barber's phone must be within ARRIVE_RADIUS_M of the
 * client's pin. The distance is kept on the booking (proof for a no-show or a
 * "barber never came" claim). If the visit address has no pin, it is not checked.
 */
async function arrived({ userId, bookingId, lat, lng }) {
  const b = await ownVisit(userId, bookingId)
  if (windowState(b) === 'early') throw new AppError('You can only mark arrived on the day of the visit.', 200)
  if (b.arrivedAt) return statusFields(b)
  const here = { lat, lng }
  if (metresBetween(here, here) === null) {
    throw new AppError("Please allow location so we can confirm you are at the client's address.", 200)
  }
  const pin = b.visitAddressId ? await addressDBS.findByPk(b.visitAddressId, { attributes: ['id', 'lat', 'lng'] }) : null
  const distance = metresBetween(here, pin)
  if (distance !== null && distance > ARRIVE_RADIUS_M) {
    throw new AppError(`You need to be at the client's address to tap I've arrived. You are about ${howFar(distance)} away.`, 200)
  }
  await b.update({ arrivedAt: new Date(), onTheWayAt: b.onTheWayAt || new Date(), arrivedDistanceM: distance })
  const { shop, emp } = await barberOf(b)
  await push([b.customerId], {
    title: 'Your barber has arrived',
    body: `${barberName(shop, emp)} is at your address.`,
  }, { bookingId: b.id, visitStatus: 'arrived' })
  return statusFields(b)
}

/**
 * 5-minute job. Today's active home visits only:
 * - visit time has come and the barber has not set off: remind the barber once;
 * - ETA + LATE_GRACE_MINUTES passed without "arrived": tell the client once.
 */
async function runVisitNotices(now = DateTime.now()) {
  const today = now.setZone('Europe/London').toISODate()
  const visits = await booking.findAll({
    where: { isMobileVisit: true, status: { [Op.in]: ACTIVE }, on: today, arrivedAt: null },
  })
  let barberReminders = 0
  let lateNotices = 0
  for (const b of visits) {
    const { shop, emp } = await barberOf(b)
    if (!b.onTheWayAt && !b.barberRemindedAt && now >= appointmentStart(b.on, b.startTime)) {
      await b.update({ barberRemindedAt: new Date() })
      await push([emp?.userId, shop?.userId], {
        title: 'Home visit now',
        body: 'Your home visit starts now. Tap "On my way" so your client knows when you will arrive.',
      }, { bookingId: b.id, visitStatus: 'none' })
      barberReminders += 1
    }
    const due = expectedAt(b)
    if (due && !b.lateNoticeAt && now >= DateTime.fromISO(due).plus({ minutes: LATE_GRACE_MINUTES })) {
      await b.update({ lateNoticeAt: new Date() })
      await push([b.customerId], {
        title: 'Your barber is running a little late',
        body: `${barberName(shop, emp)} is still on the way. Thanks for your patience.`,
      }, { bookingId: b.id, visitStatus: 'on_the_way' })
      lateNotices += 1
    }
  }
  return { barberReminders, lateNotices }
}

/**
 * Customer app home: the client's home visit happening now (from 3 hours
 * before it starts until 3 hours after it ends), soonest first, or null.
 */
async function activeVisitFor(customerId, now = DateTime.now()) {
  const today = now.setZone('Europe/London')
  const days = [today.minus({ days: 1 }).toISODate(), today.toISODate(), today.plus({ days: 1 }).toISODate()]
  const visits = await booking.findAll({
    where: { customerId, isMobileVisit: true, status: { [Op.in]: ACTIVE }, on: days },
    include: [{ model: salonDetail, attributes: ['salonName'] }],
    order: [['on', 'ASC'], ['startTime', 'ASC']],
  })
  const b = visits.find((v) => windowState(v, now) === 'open')
  if (!b) return null
  return {
    bookingId: b.id,
    shopName: b.salonDetail?.salonName || '',
    startTime: appointmentStart(b.on, b.startTime).toFormat('h:mm a'),
    ...statusFields(b),
  }
}

/** Admin: how often home visits start on time (arrived within 5 minutes of the start). */
function punctuality(visits) {
  const done = visits.filter((v) => v.arrivedAt)
  if (!done.length) return { arrivals: 0, onTimePercent: null, averageLateMinutes: null }
  let onTime = 0
  let lateTotal = 0
  let lateCount = 0
  for (const v of done) {
    const late = Math.round(DateTime.fromJSDate(new Date(v.arrivedAt)).diff(appointmentStart(v.on, v.startTime), 'minutes').minutes)
    if (late <= 5) onTime += 1
    else {
      lateTotal += late
      lateCount += 1
    }
  }
  return {
    arrivals: done.length,
    onTimePercent: Math.round((onTime / done.length) * 100),
    averageLateMinutes: lateCount ? Math.round(lateTotal / lateCount) : 0,
  }
}

module.exports = {
  ETA_CHOICES,
  LATE_GRACE_MINUTES,
  windowState,
  visitStatus,
  statusFields,
  onTheWay,
  arrived,
  metresBetween,
  ARRIVE_RADIUS_M,
  runVisitNotices,
  activeVisitFor,
  punctuality,
}
