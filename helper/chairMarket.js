/**
 * Chair market, both ways: chair renters mark themselves "Open to Work" and
 * shops with an active subscription browse them and send chair offers; shops
 * mark themselves "Hiring chair renters" (with their chair, rent and the skills
 * they want) and renters browse those shops and apply or send their own offer.
 * Either side then negotiates with counter offers. An accepted offer becomes an accepted renterMove, so the
 * Phase 1 move flow (rent check, clients move with the renter, new address)
 * takes over from there.
 *
 * Privacy: a renter is never listed to the shop they currently rent at, and
 * contact details are only shared once an offer is accepted.
 */

const { Op } = require('sequelize')
const { DateTime } = require('luxon')
const {
  sequelize,
  salonDetail,
  user,
  addressDBS,
  renterWorkPref,
  chairOffer,
  chairOfferRound,
  rating,
  service,
  salonImage,
  time,
  employee,
  employeeWagesMethod,
  deviceToken,
  shopChairListing,
  pushNotification,
} = require('../models')
const Throw = require('../utils/throwNotification')
const AppError = require('../utils/appError')
const { activeSalonWhere, isSalonRowActive } = require('./salonSubscriptionRule')
const renterMove = require('./renterMove')

const OFFER_DAYS = 7 // an offer expires this long after its latest round
const MAX_ROUNDS = 10
const DAILY_OFFER_LIMIT = 20 // offers one shop may send per day
const MIN_BOOKINGS_FOR_RATES = 20 // cancel rate is shown only after this many bookings
const RENT_HINT_KM = 15
const MAX_TERMS = 2000
const MAX_MESSAGE = 500
const DAILY_APPLY_LIMIT = 10 // shops one renter may apply to per day
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SKILLS = [
  'Barber',
  'Hair stylist',
  'Colourist',
  'Beautician',
  'Nail technician',
  'Lash and brow',
  'Makeup artist',
  'Massage therapist',
  'Afro and textured hair',
  'Braids and locs',
  'Hair extensions',
  'Bridal and occasion hair',
  'Beard and hot towel shave',
  'Kids haircuts',
  'Waxing',
  'Threading',
  'Skin care and facials',
  'Aesthetics',
  'Spray tan',
  'Tattoo artist',
  'Piercing',
]
// Shops and renters may also type their own skill (e.g. "Hair loss specialist").
const MAX_SKILL_LENGTH = 30
const MAX_SKILLS_TEXT = 255 // the skills column is VARCHAR(255)

const splitList = (v) => (v ? String(v).split(',').map((x) => x.trim()).filter(Boolean) : [])
// Known skills keep their usual spelling; a typed skill is tidied (no commas,
// single spaces, at most 30 characters). Same skill twice is kept once.
function skillsOf(v) {
  const out = []
  let length = 0
  for (const raw of Array.isArray(v) ? v : splitList(v)) {
    const clean = String(raw ?? '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_SKILL_LENGTH).trim()
    if (!clean) continue
    const skill = SKILLS.find((s) => s.toLowerCase() === clean.toLowerCase()) || clean
    if (out.some((s) => s.toLowerCase() === skill.toLowerCase())) continue
    length += (out.length ? 1 : 0) + skill.length
    if (length > MAX_SKILLS_TEXT) break
    out.push(skill)
  }
  return out
}
const sameSkill = (a, b) => a.toLowerCase() === b.toLowerCase()

const today = () => DateTime.now().setZone('Europe/London').toISODate()

// "16 Nov 2026" for a date shown in a notification.
function prettyDate(v) {
  const d = DateTime.fromISO(String(v || '').slice(0, 10))
  return d.isValid ? d.toFormat('d LLL yyyy') : String(v || '')
}

// The name a side shows in notifications: the shop's or the renter's.
async function sideName(offer, side) {
  if (side !== 'shop' && !offer.renterSalonId) return applicantName(offer)
  const id = side === 'shop' ? offer.shopSalonId : offer.renterSalonId
  const s = await salonDetail.findByPk(id, { attributes: ['salonName'] })
  return s?.salonName || (side === 'shop' ? 'The shop' : 'The renter')
}

// Client app applicants: what they entered when applying.
function applicantOf(offer) {
  try {
    return JSON.parse(offer.applicantInfo || '{}') || {}
  } catch (_) {
    return {}
  }
}
function applicantName(offer) {
  const a = applicantOf(offer)
  return `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'The applicant'
}
// "chair offer" or "job offer", for messages.
const offerWord = (offer) => (offer.kind === 'staff' ? 'job offer' : 'chair offer')

// ---------------------------------------------------------------- helpers

// Each person gets the push on their phones and a line in their in-app
// notifications list, even when they have no phone signed in right now.
async function push(userIds, notification, data) {
  try {
    const ids = [...new Set(userIds.filter(Boolean))]
    const payload = { type: 'chairOffer', ...data }
    for (const id of ids) {
      const tokens = await require('./staffDevices').ownDeviceTokens(id)
      if (tokens.length) Throw(tokens, notification, payload, id)
      else await pushNotification.create({ at: new Date(), title: notification.title, body: notification.body, data: payload, userId: id })
    }
  } catch (err) {
    console.error('[chairMarket] push failed:', err.message)
  }
}

function km(a, b) {
  // Missing coordinates are null, not 0 (Number(null) would be 0).
  const num = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v))
  const lat1 = num(a?.lat)
  const lng1 = num(a?.lng)
  const lat2 = num(b?.lat)
  const lng2 = num(b?.lng)
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return null
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(h)) * 10) / 10
}

// Rent in pounds per week, so different cycles can be compared.
// A daily rent is counted as five working days.
function weeklyRent(amount, cycle) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return null
  if (cycle === 'Weekly') return n
  if (cycle === 'Bi-weekly') return n / 2
  if (cycle === 'Monthly') return (n * 12) / 52
  if (cycle === 'Daily') return n * 5
  return null
}

function money(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) throw new AppError('Please enter a valid amount.', 200)
  return Math.round(n * 100) / 100
}

function text(v, max) {
  const s = String(v ?? '').trim()
  return s ? s.slice(0, max) : null
}

// pastToToday: a date that has passed becomes today (an "available from"
// date saved earlier simply means "available now" once it has passed).
function dateOnly(v, label, { allowNull = false, pastToToday = false } = {}) {
  if (!v) {
    if (allowNull) return null
    throw new AppError(`Please choose the ${label}.`, 200)
  }
  const d = DateTime.fromISO(String(v).slice(0, 10))
  if (!d.isValid) throw new AppError(`Please choose a valid ${label}.`, 200)
  const iso = d.toISODate()
  if (iso < today()) {
    if (pastToToday) return today()
    throw new AppError(`The ${label} cannot be in the past.`, 200)
  }
  return iso
}

function cycleOf(v) {
  if (!v) return null
  if (!renterMove.RENT_CYCLES.includes(v)) throw new AppError('Please choose a valid rent cycle.', 200)
  return v
}

// The signed-in shop owner's shop, which must be subscribed to use the market.
async function subscribedShopOf(userId) {
  const shop = await salonDetail.findOne({
    where: { userId, deleted: false },
    attributes: ['id', 'userId', 'salonName', 'teamSize', 'addressDBId', 'isExternalEmployee'],
    include: [{ model: addressDBS, attributes: ['lat', 'lng', 'city', 'type'] }],
  })
  if (!shop || shop.isExternalEmployee) throw new AppError('Only a shop owner can do this.', 200)
  const active = await salonDetail.count({
    where: { id: shop.id, [Op.and]: [activeSalonWhere(today())] },
  })
  if (!active) {
    throw new AppError('Finding chair renters is part of a Trim subscription. Please renew your subscription to use it.', 200)
  }
  return shop
}

async function renterSalonOf(userId) {
  const salon = await salonDetail.findOne({
    where: { userId, isExternalEmployee: true, deleted: false },
    attributes: ['id', 'userId', 'salonName', 'parentSalonId', 'renterGraceUntil', 'addressDBId'],
  })
  if (!salon) throw new AppError('Only a chair renter can do this.', 200)
  return salon
}

// ---------------------------------------------------------------- open to work

function prefJson(pref, salon) {
  // Left their shop with no new one yet (still paying for their own plan).
  const between = !salon.parentSalonId && !!salon.renterGraceUntil
  return {
    openToWork: !!pref?.openToWork || !!between,
    // Between shops: listed automatically and first, whatever the switch says.
    autoListed: !!between,
    availableFrom: pref?.availableFrom || null,
    days: pref?.days ? pref.days.split(',').filter(Boolean) : [],
    radiusKm: pref?.radiusKm ?? null,
    rentMin: pref?.rentMin != null ? Number(pref.rentMin) : null,
    rentMax: pref?.rentMax != null ? Number(pref.rentMax) : null,
    rentCycle: pref?.rentCycle || null,
    note: pref?.note || '',
    skills: skillsOf(pref?.skills),
  }
}

async function getMyPrefs(userId) {
  const salon = await renterSalonOf(userId)
  const pref = await renterWorkPref.findOne({ where: { renterSalonId: salon.id } })
  return prefJson(pref, salon)
}

async function saveMyPrefs(userId, body = {}) {
  const salon = await renterSalonOf(userId)
  const days = Array.isArray(body.days) ? body.days.filter((d) => DAYS.includes(d)) : []
  const rentMin = money(body.rentMin)
  const rentMax = money(body.rentMax)
  if (rentMin != null && rentMax != null && rentMin > rentMax) {
    throw new AppError('The lowest rent cannot be more than the highest rent.', 200)
  }
  const radius = body.radiusKm == null || body.radiusKm === '' ? null : Math.round(Number(body.radiusKm))
  if (radius != null && (!Number.isFinite(radius) || radius < 1 || radius > 200)) {
    throw new AppError('Please choose a distance between 1 and 200 km.', 200)
  }
  const values = {
    renterSalonId: salon.id,
    renterUserId: userId,
    openToWork: body.openToWork === true || body.openToWork === 'true',
    availableFrom: body.availableFrom ? dateOnly(body.availableFrom, 'available from date', { allowNull: true, pastToToday: true }) : null,
    days: days.length ? days.join(',') : null,
    radiusKm: radius,
    rentMin,
    rentMax,
    rentCycle: cycleOf(body.rentCycle) || 'Weekly',
    note: text(body.note, MAX_MESSAGE),
    skills: skillsOf(body.skills).join(',') || null,
  }
  const existing = await renterWorkPref.findOne({ where: { renterSalonId: salon.id } })
  const pref = existing ? await existing.update(values) : await renterWorkPref.create(values)
  return prefJson(pref, salon)
}

// ---------------------------------------------------------------- renter stats

// Numbers only Trim can vouch for, from the renter's own bookings and reviews.
async function statsFor(salonIds) {
  if (!salonIds.length) return new Map()
  const rows = await sequelize.query(
    `SELECT s.id,
      (SELECT ROUND(AVG(r.value), 1) FROM ratings r WHERE r.salonDetailId = s.id) AS avgRating,
      (SELECT COUNT(*) FROM ratings r WHERE r.salonDetailId = s.id) AS reviewCount,
      (SELECT COUNT(*) FROM bookings b WHERE b.salonDetailId = s.id AND b.status = 'complete') AS completed,
      (SELECT COUNT(*) FROM bookings b
         JOIN cancelledBookings c ON c.bookingId = b.id
        WHERE b.salonDetailId = s.id AND b.status = 'cancel'
          AND (b.requestOutcome IS NULL OR b.requestOutcome = 'accepted')
          AND (b.customerId IS NULL OR c.userId <> b.customerId)) AS barberCancels
    FROM salonDetails s WHERE s.id IN (:ids)`,
    { replacements: { ids: salonIds }, type: sequelize.QueryTypes.SELECT },
  )
  // Clients with a completed booking, and how many of them came back again.
  const clientRows = await sequelize.query(
    `SELECT t.salonDetailId, COUNT(*) AS clients, SUM(t.visits >= 2) AS returningClients
       FROM (SELECT b.salonDetailId, b.customerId, COUNT(*) AS visits
               FROM bookings b
              WHERE b.salonDetailId IN (:ids) AND b.status = 'complete' AND b.customerId IS NOT NULL
              GROUP BY b.salonDetailId, b.customerId) t
      GROUP BY t.salonDetailId`,
    { replacements: { ids: salonIds }, type: sequelize.QueryTypes.SELECT },
  )
  const clientsBySalon = new Map(clientRows.map((c) => [Number(c.salonDetailId), c]))
  const out = new Map()
  for (const r of rows) {
    const c = clientsBySalon.get(Number(r.id)) || {}
    r.clients = c.clients
    r.returningClients = c.returningClients
    const completed = Number(r.completed) || 0
    const cancels = Number(r.barberCancels) || 0
    const clients = Number(r.clients) || 0
    const handled = completed + cancels
    out.set(Number(r.id), {
      avgRating: r.avgRating != null ? Number(r.avgRating) : null,
      reviewCount: Number(r.reviewCount) || 0,
      completedBookings: completed,
      returningClientsPercent: clients ? Math.round(((Number(r.returningClients) || 0) / clients) * 100) : null,
      // Only after enough bookings, so one or two bad days don't define a barber.
      barberCancelPercent: handled >= MIN_BOOKINGS_FOR_RATES ? Math.round((cancels / handled) * 100) : null,
    })
  }
  return out
}

// ---------------------------------------------------------------- shop: find renters

// Renters a shop may see: open to work (or between shops), not the shop's own renters.
async function listRenters(userId, { maxKm, rentMax } = {}) {
  const shop = await subscribedShopOf(userId)
  const day = today()
  const [prefs, between] = await Promise.all([
    renterWorkPref.findAll({ where: { openToWork: true } }),
    // Renters between shops are listed even without Open to Work, for as long
    // as they keep paying for their own plan.
    salonDetail.findAll({
      where: { isExternalEmployee: true, deleted: false, parentSalonId: null, renterGraceUntil: { [Op.ne]: null } },
      attributes: ['id'],
    }),
  ])
  const ids = [...new Set([...prefs.map((p) => p.renterSalonId), ...between.map((s) => s.id)])]
  if (!ids.length) return { renters: [] }

  const salons = await salonDetail.findAll({
    where: {
      id: ids,
      isExternalEmployee: true,
      deleted: false,
      // Only renters whose own Trim plan is active.
      [Op.and]: [
        { [Op.or]: [{ parentSalonId: null }, { parentSalonId: { [Op.ne]: shop.id } }] },
        activeSalonWhere(day),
      ],
    },
    attributes: ['id', 'userId', 'salonName', 'coverImage', 'parentSalonId', 'renterGraceUntil'],
    include: [
      { model: addressDBS, attributes: ['lat', 'lng', 'city'] },
      { model: user, attributes: ['firstName', 'lastName', 'image', 'deleted', 'status'] },
    ],
  })
  const prefBySalon = new Map(prefs.map((p) => [p.renterSalonId, p]))
  const hostIds = [...new Set(salons.map((s) => s.parentSalonId).filter(Boolean))]
  const [hosts, stats, sent] = await Promise.all([
    hostIds.length ? salonDetail.findAll({ where: { id: hostIds }, attributes: ['id', 'salonName'] }) : [],
    statsFor(salons.map((s) => s.id)),
    chairOffer.findAll({ where: { shopSalonId: shop.id, status: 'open' }, attributes: ['id', 'renterSalonId'] }),
  ])
  const hostName = new Map(hosts.map((h) => [h.id, h.salonName]))
  const openOffer = new Map(sent.map((o) => [o.renterSalonId, o.id]))

  let renters = salons
    // Deleted or blocked accounts are never listed.
    .filter((s) => !s.user?.deleted && s.user?.status !== false)
    .map((s) => {
      const pref = prefJson(prefBySalon.get(s.id), s)
      const distanceKm = km(shop.addressDB, s.addressDB)
      return {
        renterSalonId: s.id,
        name: `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim() || s.salonName,
        salonName: s.salonName,
        image: s.user?.image || null,
        coverImage: s.coverImage || null,
        city: s.addressDB?.type === 'between_shops' ? null : s.addressDB?.city || null,
        distanceKm,
        currentShop: s.parentSalonId ? hostName.get(s.parentSalonId) || null : null,
        betweenShops: pref.autoListed,
        prefs: pref,
        stats: stats.get(s.id) || null,
        openOfferId: openOffer.get(s.id) || null,
      }
    })
    // The renter's own distance limit applies too.
    .filter((r) => r.distanceKm == null || !r.prefs.radiusKm || r.distanceKm <= r.prefs.radiusKm)

  if (maxKm) renters = renters.filter((r) => r.distanceKm != null && r.distanceKm <= Number(maxKm))
  if (rentMax) {
    renters = renters.filter((r) => {
      const min = weeklyRent(r.prefs.rentMin, r.prefs.rentCycle || 'Weekly')
      return min == null || min <= Number(rentMax)
    })
  }
  // Between shops first (they need a chair soonest), then nearest.
  renters.sort((a, b) => (b.betweenShops - a.betweenShops) || ((a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9)))
  return { renters }
}

async function renterProfile(userId, renterSalonId) {
  const shop = await subscribedShopOf(userId)
  const s = await salonDetail.findOne({
    where: { id: renterSalonId, isExternalEmployee: true, deleted: false },
    attributes: ['id', 'salonName', 'coverImage', 'description', 'parentSalonId', 'renterGraceUntil', 'createdAt',
      'registrationExpiryDate', 'subscriptionLatestPaymentStatus'],
    include: [
      { model: addressDBS, attributes: ['city', 'lat', 'lng', 'type'] },
      { model: user, attributes: ['firstName', 'lastName', 'image', 'status', 'deleted'] },
    ],
  })
  // The renter's own shop never sees their profile here, nor a blocked account.
  if (!s || s.parentSalonId === shop.id || s.user?.status === false || s.user?.deleted) throw new AppError('Data not found', 404)
  const pref = await renterWorkPref.findOne({ where: { renterSalonId: s.id } })
  const prefs = prefJson(pref, s)
  // A shop that has dealt with the renter can still see them after they stop
  // looking, or once their own plan has ended.
  if (!prefs.openToWork || !isSalonRowActive(s, today())) {
    const dealt = await chairOffer.count({ where: { shopSalonId: shop.id, renterSalonId: s.id } })
    if (!dealt) throw new AppError('This renter is not looking for a chair right now.', 200)
  }

  const [stats, services, reviews, gallery, host, offer] = await Promise.all([
    statsFor([s.id]),
    service.findAll({
      where: { salonDetailId: s.id },
      attributes: ['id', 'serviceName', 'price', 'duration'],
      limit: 50,
    }),
    rating.findAll({
      where: { salonDetailId: s.id, comment: { [Op.ne]: '' } },
      attributes: ['value', 'comment', 'at', 'createdAt'],
      include: [{ model: user, attributes: ['firstName'] }],
      order: [['createdAt', 'DESC']],
      limit: 5,
    }).catch(() => []),
    salonImage.findAll({ where: { salonDetailId: s.id }, attributes: ['imageUrl'], limit: 12 }),
    s.parentSalonId ? salonDetail.findByPk(s.parentSalonId, { attributes: ['salonName'] }) : null,
    chairOffer.findOne({ where: { shopSalonId: shop.id, renterSalonId: s.id, status: 'open' }, attributes: ['id'] }),
  ])
  return {
    renterSalonId: s.id,
    name: `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim() || s.salonName,
    salonName: s.salonName,
    image: s.user?.image || null,
    coverImage: s.coverImage || null,
    description: s.description || '',
    city: s.addressDB?.type === 'between_shops' ? null : s.addressDB?.city || null,
    distanceKm: km(shop.addressDB, s.addressDB),
    currentShop: host?.salonName || null,
    betweenShops: prefs.autoListed,
    onTrimSince: s.createdAt,
    prefs,
    stats: stats.get(s.id) || null,
    services: services.map((x) => ({ id: x.id, name: x.serviceName, price: Number(x.price), duration: x.duration })),
    reviews: reviews.map((r) => ({
      value: Number(r.value),
      comment: r.comment,
      at: r.at || r.createdAt,
      by: r.user?.firstName || 'Client',
    })),
    gallery: gallery.map((g) => g.imageUrl),
    openOfferId: offer?.id || null,
  }
}

// Usual chair rent near the shop, per week, from rents shops nearby already
// charge on Trim. Null when there are too few to be useful.
async function rentHint(userId) {
  const shop = await subscribedShopOf(userId)
  const rows = await employee.findAll({
    where: { isExternalEmployee: true, deleted: false },
    attributes: ['id'],
    include: [
      { model: employeeWagesMethod, required: true, where: { wagesMethodId: 3 }, attributes: ['value', 'cycle'] },
      {
        model: salonDetail,
        required: true,
        attributes: ['id'],
        include: [{ model: addressDBS, attributes: ['lat', 'lng'] }],
      },
    ],
  })
  const weekly = rows
    .filter((e) => {
      const d = km(shop.addressDB, e.salonDetail?.addressDB)
      return d != null && d <= RENT_HINT_KM
    })
    .map((e) => weeklyRent(e.employeeWagesMethod?.value, e.employeeWagesMethod?.cycle))
    .filter((v) => v != null && v > 0)
    .sort((a, b) => a - b)
  if (weekly.length < 3) return { hint: null }
  const at = (p) => weekly[Math.min(weekly.length - 1, Math.floor(p * (weekly.length - 1)))]
  return {
    hint: {
      low: Math.round(at(0.25)),
      typical: Math.round(at(0.5)),
      high: Math.round(at(0.75)),
      cycle: 'Weekly',
      count: weekly.length,
      km: RENT_HINT_KM,
    },
  }
}

// ---------------------------------------------------------------- shop profile (for renters)

// Opening hours: the shop's own rows, or else the owner's (most shops keep them there).
async function shopHours(salonId) {
  const attrs = ['day', 'openingTime', 'closingTime', 'status']
  const own = await time.findAll({ where: { salonDetailId: salonId, employeeId: null }, attributes: attrs })
  if (own.length) return own
  const owner = await employee.findOne({ where: { salonDetailId: salonId, isOwner: true }, attributes: ['id'] })
  return owner ? time.findAll({ where: { salonDetailId: salonId, employeeId: owner.id }, attributes: attrs }) : []
}

async function shopProfile(userId, shopSalonId) {
  await renterSalonOf(userId)
  const s = await salonDetail.findOne({
    where: { id: shopSalonId, isExternalEmployee: false, deleted: false },
    attributes: ['id', 'salonName', 'coverImage', 'description', 'teamSize', ...ADVERT_ATTRS],
    include: [{ model: addressDBS, attributes: ['streetAddress', 'city', 'postalCode', 'lat', 'lng'] }],
  })
  if (!s) throw new AppError('Data not found', 404)
  const [summary, reviews, gallery, hours, team, renters] = await Promise.all([
    rating.findOne({
      where: { salonDetailId: s.id },
      attributes: [
        [sequelize.fn('ROUND', sequelize.fn('AVG', sequelize.col('value')), 1), 'avg'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      raw: true,
    }),
    rating.findAll({
      where: { salonDetailId: s.id, comment: { [Op.ne]: '' } },
      attributes: ['value', 'comment', 'at', 'createdAt'],
      include: [{ model: user, attributes: ['firstName'] }],
      order: [['createdAt', 'DESC']],
      limit: 5,
    }).catch(() => []),
    salonImage.findAll({ where: { salonDetailId: s.id }, attributes: ['imageUrl'], limit: 12 }),
    shopHours(s.id),
    employee.count({ where: { salonDetailId: s.id, isOwner: false, deleted: false, status: true } }),
    employee.count({ where: { salonDetailId: s.id, isExternalEmployee: true, deleted: false, status: true } }),
  ])
  return {
    id: s.id,
    salonName: s.salonName,
    coverImage: s.coverImage || null,
    description: s.description || '',
    address: s.addressDB
      ? [s.addressDB.streetAddress, s.addressDB.city, s.addressDB.postalCode].filter(Boolean).join(', ')
      : '',
    lat: s.addressDB?.lat || null,
    lng: s.addressDB?.lng || null,
    avgRating: summary?.avg != null ? Number(summary.avg) : null,
    reviewCount: Number(summary?.count) || 0,
    reviews: reviews.map((r) => ({
      value: Number(r.value),
      comment: r.comment,
      at: r.at || r.createdAt,
      by: r.user?.firstName || 'Client',
    })),
    gallery: gallery.map((g) => g.imageUrl),
    hours: DAYS.map((d) => {
      const h = hours.find((x) => x.day === d)
      return {
        day: d,
        open: !!(h && h.status !== false && h.openingTime && h.closingTime),
        from: h?.openingTime ? String(h.openingTime).slice(0, 5) : null,
        to: h?.closingTime ? String(h.closingTime).slice(0, 5) : null,
      }
    }),
    teamCount: team,
    renterCount: renters,
    listing: listingJson(await shopChairListing.findOne({ where: { shopSalonId: s.id } }), s),
  }
}

// ---------------------------------------------------------------- shop: hiring listing

// The listing as the apps see it. A shop with the old rent-a-chair advert on
// but no listing yet counts as hiring, with the advert's chairs and rent.
function listingJson(listing, shop) {
  const advertCycle = { daily: 'Daily', weekly: 'Weekly' }[String(shop?.rentChairAdvertisementRentType || '').toLowerCase()]
  if (!listing) {
    return {
      isHiring: !!shop?.rentChairAdvertisementStatus,
      chairs: shop?.rentChairAdvertisementChairCount || 1,
      rentAmount: shop?.rentChairAdvertisementRentAmount != null ? Number(shop.rentChairAdvertisementRentAmount) : null,
      rentCycle: advertCycle || null,
      availableFrom: null,
      skills: [],
      terms: '',
      note: '',
      coversPlan: false,
    }
  }
  return {
    coversPlan: !!listing.coversPlan,
    isHiring: !!listing.isHiring,
    chairs: listing.chairs || 1,
    rentAmount: listing.rentAmount != null ? Number(listing.rentAmount) : null,
    rentCycle: listing.rentCycle || null,
    availableFrom: listing.availableFrom || null,
    skills: skillsOf(listing.skills),
    terms: listing.terms || '',
    note: listing.note || '',
  }
}

const ADVERT_ATTRS = [
  'rentChairAdvertisementStatus',
  'rentChairAdvertisementChairCount',
  'rentChairAdvertisementRentType',
  'rentChairAdvertisementRentAmount',
]

async function ownShopOf(userId) {
  const shop = await salonDetail.findOne({
    where: { userId, deleted: false },
    attributes: ['id', 'isExternalEmployee', ...ADVERT_ATTRS],
  })
  if (!shop || shop.isExternalEmployee) throw new AppError('Only a shop owner can do this.', 200)
  return shop
}

// The shop's chair advert as clients see it on the shop's page: the listing,
// or the old advert fields while the shop has no listing yet. Null when the
// shop is not hiring chair renters.
async function publicChairListing(salonDetailId) {
  const shop = await salonDetail.findOne({
    where: { id: salonDetailId, deleted: false },
    attributes: ['id', 'isExternalEmployee', ...ADVERT_ATTRS],
  })
  if (!shop || shop.isExternalEmployee) return null
  const listing = await shopChairListing.findOne({ where: { shopSalonId: shop.id } })
  const { isHiring, ...rest } = listingJson(listing, shop)
  return isHiring ? rest : null
}

// Older app versions still save the old rent-a-chair advert screen. The
// listing is the shop's one chair advert, so it takes the same values.
async function syncListingFromAdvert(userId, { status, chairs, rentType, rentAmount }) {
  const shop = await salonDetail.findOne({
    where: { userId, deleted: false },
    attributes: ['id', 'isExternalEmployee'],
  })
  if (!shop || shop.isExternalEmployee) return
  const rentCycle = { daily: 'Daily', weekly: 'Weekly' }[String(rentType || '').toLowerCase()] || null
  const values = {
    isHiring: !!status && Number(chairs) > 0,
    chairs: Math.min(50, Math.max(1, Math.round(Number(chairs) || 1))),
    rentAmount: rentCycle ? rentAmount : null,
    rentCycle,
  }
  const existing = await shopChairListing.findOne({ where: { shopSalonId: shop.id } })
  if (existing) await existing.update(values)
  else await shopChairListing.create({ shopSalonId: shop.id, ...values })
}

async function getMyListing(userId) {
  const shop = await ownShopOf(userId)
  const listing = await shopChairListing.findOne({ where: { shopSalonId: shop.id } })
  return { listing: listingJson(listing, shop), skillChoices: SKILLS }
}

// { isHiring, chairs, rentAmount, rentCycle, availableFrom, skills: [], terms, note }
async function saveMyListing(userId, body = {}) {
  const shop = await ownShopOf(userId)
  const chairs = Math.round(Number(body.chairs ?? 1))
  if (!Number.isFinite(chairs) || chairs < 1 || chairs > 50) throw new AppError('Please enter how many chairs (1 to 50).', 200)
  const rentAmount = money(body.rentAmount)
  const values = {
    shopSalonId: shop.id,
    isHiring: body.isHiring === true || body.isHiring === 'true',
    chairs,
    rentAmount,
    rentCycle: rentAmount == null ? null : cycleOf(body.rentCycle) || 'Weekly',
    availableFrom: body.availableFrom ? dateOnly(body.availableFrom, 'available from date', { allowNull: true, pastToToday: true }) : null,
    skills: skillsOf(body.skills).join(',') || null,
    terms: text(body.terms, MAX_TERMS),
    note: text(body.note, MAX_MESSAGE),
    // "Trim plan included": the shop covers the renter's plan (uses a team seat).
    coversPlan: body.coversPlan === true || body.coversPlan === 'true',
  }
  const existing = await shopChairListing.findOne({ where: { shopSalonId: shop.id } })
  const listing = existing ? await existing.update(values) : await shopChairListing.create(values)
  // Keep the client app's rent-a-chair advert in step (it only knows daily/weekly).
  const advertType = { Daily: 'daily', Weekly: 'weekly' }[values.rentCycle] || null
  await shop.update({
    rentChairAdvertisementStatus: values.isHiring,
    rentChairAdvertisementChairCount: chairs,
    rentChairAdvertisementRentType: advertType,
    rentChairAdvertisementRentAmount: advertType ? rentAmount : null,
  })
  return { listing: listingJson(listing, shop), skillChoices: SKILLS }
}

// ---------------------------------------------------------------- renter: shops hiring

async function renterPrefRow(salon) {
  return renterWorkPref.findOne({ where: { renterSalonId: salon.id } })
}

// Shops that are hiring chair renters and subscribed, nearest first. Never the
// renter's own shop, nor shops they marked "Not interested".
async function listHiringShops(userId, { maxKm } = {}) {
  const renter = await renterSalonOf(userId)
  const [pref, renterAddress, listings] = await Promise.all([
    renterPrefRow(renter),
    renter.addressDBId ? addressDBS.findByPk(renter.addressDBId, { attributes: ['lat', 'lng'] }) : null,
    shopChairListing.findAll({ where: { isHiring: true } }),
  ])
  const hidden = new Set(splitList(pref?.hiddenShopIds).map(Number))
  const mySkills = skillsOf(pref?.skills)
  const listedIds = listings.map((l) => l.shopSalonId)
  const withListing = await shopChairListing.findAll({ attributes: ['shopSalonId'] })
  const anyListing = new Set(withListing.map((l) => l.shopSalonId))

  const shops = await salonDetail.findAll({
    where: {
      isExternalEmployee: false,
      deleted: false,
      [Op.and]: [
        activeSalonWhere(today()),
        {
          [Op.or]: [
            { id: listedIds.length ? listedIds : [0] },
            // Old advert on, no listing yet.
            { rentChairAdvertisementStatus: true, id: { [Op.notIn]: [...anyListing, 0] } },
          ],
        },
      ],
    },
    attributes: ['id', 'salonName', 'coverImage', ...ADVERT_ATTRS],
    include: [
      { model: addressDBS, attributes: ['lat', 'lng', 'city'] },
      { model: user, attributes: ['status', 'deleted'] },
    ],
  })
  // Not the renter's own shop, not ones they hid, and never a blocked owner's shop.
  const visible = shops.filter((s) => s.id !== renter.parentSalonId && !hidden.has(s.id) && s.user?.status !== false && !s.user?.deleted)
  if (!visible.length) return { shops: [], mySkills }

  const ids = visible.map((s) => s.id)
  const [ratings, openOffers] = await Promise.all([
    rating.findAll({
      where: { salonDetailId: ids },
      attributes: [
        'salonDetailId',
        [sequelize.fn('ROUND', sequelize.fn('AVG', sequelize.col('value')), 1), 'avg'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['salonDetailId'],
      raw: true,
    }),
    chairOffer.findAll({ where: { renterUserId: userId, status: 'open', shopSalonId: ids }, attributes: ['id', 'shopSalonId'] }),
  ])
  const ratingBy = new Map(ratings.map((r) => [Number(r.salonDetailId), r]))
  const offerBy = new Map(openOffers.map((o) => [o.shopSalonId, o.id]))
  const listingBy = new Map(listings.map((l) => [l.shopSalonId, l]))

  let out = visible.map((s) => {
    const listing = listingJson(listingBy.get(s.id), s)
    const r = ratingBy.get(s.id)
    return {
      shopSalonId: s.id,
      salonName: s.salonName,
      coverImage: s.coverImage || null,
      city: s.addressDB?.city || null,
      distanceKm: km(renterAddress, s.addressDB),
      avgRating: r?.avg != null ? Number(r.avg) : null,
      reviewCount: Number(r?.count) || 0,
      listing,
      // No skills asked for counts as a match.
      skillsMatch: !listing.skills.length || listing.skills.some((x) => mySkills.some((m) => sameSkill(m, x))),
      openOfferId: offerBy.get(s.id) || null,
    }
  })
  // The renter's own travel limit, then any filter they picked.
  if (pref?.radiusKm) out = out.filter((x) => x.distanceKm == null || x.distanceKm <= pref.radiusKm)
  if (maxKm) out = out.filter((x) => x.distanceKm != null && x.distanceKm <= Number(maxKm))
  out.sort((a, b) => (b.skillsMatch - a.skillsMatch) || ((a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9)))
  return { shops: out, mySkills }
}

// Renter applies to a hiring shop: on the shop's own terms ("accept"), or with
// their own offer. The shop then accepts, counters or declines.
async function applyToShop(userId, body = {}) {
  const renter = await renterSalonOf(userId)
  const shopSalonId = Number(body.shopSalonId)
  const shop = await salonDetail.findOne({
    where: { id: shopSalonId, isExternalEmployee: false, deleted: false, [Op.and]: [activeSalonWhere(today())] },
    attributes: ['id', 'userId', 'salonName', 'teamSize', ...ADVERT_ATTRS],
  })
  if (!shop || shop.id === renter.parentSalonId) throw new AppError('Data not found', 404)
  const listing = listingJson(await shopChairListing.findOne({ where: { shopSalonId: shop.id } }), shop)
  if (!listing.isHiring) throw new AppError('This shop is not looking for chair renters right now.', 200)

  const asListed = body.mode === 'accept'
  const startDefault = listing.availableFrom && listing.availableFrom > today() ? listing.availableFrom : today()
  const t = readTerms(asListed
    ? { rentAmount: listing.rentAmount, rentCycle: listing.rentCycle, startDate: body.startDate || startDefault, message: body.message }
    : body)
  checkTrial(t)

  const existing = await chairOffer.findOne({ where: { renterUserId: userId, shopSalonId: shop.id, status: 'open' } })
  if (existing) throw new AppError('You already have an open offer with this shop.', 200)
  const sentToday = await chairOffer.count({
    where: { renterUserId: userId, lastBy: 'renter', rounds: 1, createdAt: { [Op.gte]: DateTime.now().minus({ days: 1 }).toJSDate() } },
  })
  if (sentToday >= DAILY_APPLY_LIMIT) throw new AppError('You have applied to the most shops allowed for today. Please try again tomorrow.', 200)

  const offer = await sequelize.transaction(async (transaction) => {
    const o = await chairOffer.create({
      renterUserId: userId,
      renterSalonId: renter.id,
      shopSalonId: shop.id,
      createdBy: userId,
      status: 'open',
      lastBy: 'renter',
      rounds: 1,
      rentAmount: t.rentAmount,
      rentCycle: t.rentCycle,
      startDate: t.startDate,
      trialDate: t.trialDate,
      shopTerms: listing.terms || null,
      renterTerms: asListed ? null : t.terms,
      // The shop decides coverage; the renter starts from what the listing says.
      coversPlan: !!listing.coversPlan,
      planWish: t.planWish,
      expiresAt: expiry(),
    }, { transaction })
    await chairOfferRound.create({ offerId: o.id, by: 'renter', ...t, terms: asListed ? null : t.terms }, { transaction })
    return o
  })
  const renterUser = await user.findByPk(userId, { attributes: ['firstName', 'lastName'] })
  const name = `${renterUser?.firstName || ''} ${renterUser?.lastName || ''}`.trim() || renter.salonName
  push([shop.userId], {
    title: asListed ? 'A chair renter wants your chair' : 'New offer from a chair renter',
    body: asListed
      ? `${name} accepted your chair terms. Confirm to set up the move.`
      : `${name} sent you an offer${t.rentAmount != null ? ` (£${t.rentAmount} ${String(t.rentCycle || '').toLowerCase()})` : ''}.`,
  }, { offerId: offer.id })
  return offer
}

// Renter hides a hiring shop from their list ("Not interested").
async function hideShop(userId, shopSalonId) {
  const renter = await renterSalonOf(userId)
  const id = Number(shopSalonId)
  if (!Number.isFinite(id)) throw new AppError('Data not found', 404)
  const pref = await renterPrefRow(renter)
  const hidden = new Set(splitList(pref?.hiddenShopIds).map(Number))
  hidden.add(id)
  const value = [...hidden].join(',')
  if (pref) await pref.update({ hiddenShopIds: value })
  else await renterWorkPref.create({ renterSalonId: renter.id, renterUserId: userId, openToWork: false, hiddenShopIds: value })
  return true
}

// ---------------------------------------------------------------- offers

const PAY_TYPES = ['salary', 'commission']

// Offer terms. rentAmount/rentCycle hold the rent for a chair, or the pay for a
// staff job (payType 'salary' with a cycle, or 'commission' as a percentage).
function readTerms(body, kind = 'chair') {
  const payType = kind === 'staff' ? (PAY_TYPES.includes(body.payType) ? body.payType : 'salary') : null
  if (payType === 'commission' && money(body.rentAmount) != null && money(body.rentAmount) > 100) {
    throw new AppError('Commission must be a percentage from 0 to 100.', 200)
  }
  return {
    payType,
    coversPlan: kind === 'chair' ? body.coversPlan === true || body.coversPlan === 'true' : false,
    planWish: kind === 'chair' && ['covered', 'own'].includes(body.planWish) ? body.planWish : null,
    rentAmount: money(body.rentAmount),
    rentCycle: cycleOf(body.rentCycle) || (body.rentAmount != null && body.rentAmount !== '' ? 'Weekly' : null),
    startDate: dateOnly(body.startDate, 'start date'),
    trialDate: dateOnly(body.trialDate, 'trial day', { allowNull: true }),
    terms: text(body.terms, MAX_TERMS),
    message: text(body.message, MAX_MESSAGE),
  }
}

function checkTrial(t) {
  if (t.trialDate && t.trialDate > t.startDate) throw new AppError('The trial day must be before the start date.', 200)
}

const expiry = () => DateTime.now().plus({ days: OFFER_DAYS }).toJSDate()

// Shop sends a renter an offer.
async function sendOffer(userId, body = {}) {
  const shop = await subscribedShopOf(userId)
  const renterSalonId = Number(body.renterSalonId)
  const s = await salonDetail.findOne({
    where: { id: renterSalonId, isExternalEmployee: true, deleted: false },
    attributes: ['id', 'userId', 'parentSalonId', 'renterGraceUntil'],
    include: [{ model: user, attributes: ['status', 'deleted'] }],
  })
  if (!s || s.parentSalonId === shop.id || s.user?.status === false || s.user?.deleted) throw new AppError('Data not found', 404)
  const pref = await renterWorkPref.findOne({ where: { renterSalonId: s.id } })
  if (!prefJson(pref, s).openToWork) throw new AppError('This renter is not looking for a chair right now.', 200)

  const t = readTerms(body)
  checkTrial(t)
  const existing = await chairOffer.findOne({ where: { shopSalonId: shop.id, renterSalonId: s.id, status: 'open' } })
  if (existing) throw new AppError('You already have an open offer with this renter.', 200)
  const sentToday = await chairOffer.count({
    where: { shopSalonId: shop.id, createdAt: { [Op.gte]: DateTime.now().minus({ days: 1 }).toJSDate() } },
  })
  if (sentToday >= DAILY_OFFER_LIMIT) throw new AppError('You have sent the most offers allowed for today. Please try again tomorrow.', 200)

  const offer = await sequelize.transaction(async (transaction) => {
    const o = await chairOffer.create({
      renterUserId: s.userId,
      renterSalonId: s.id,
      shopSalonId: shop.id,
      createdBy: userId,
      status: 'open',
      lastBy: 'shop',
      rounds: 1,
      rentAmount: t.rentAmount,
      rentCycle: t.rentCycle,
      startDate: t.startDate,
      trialDate: t.trialDate,
      shopTerms: t.terms,
      coversPlan: t.coversPlan,
      expiresAt: expiry(),
    }, { transaction })
    await chairOfferRound.create({ offerId: o.id, by: 'shop', ...t }, { transaction })
    return o
  })
  push([s.userId], {
    title: 'New chair offer',
    body: `${shop.salonName} sent you a chair offer${t.rentAmount != null ? ` (£${t.rentAmount} ${String(t.rentCycle || '').toLowerCase()})` : ''}.`,
  }, { offerId: offer.id })
  return offer
}

// Which side the signed-in user is on for an offer, or a 404.
async function loadForUser(userId, offerId) {
  const offer = await chairOffer.findByPk(offerId)
  if (!offer) throw new AppError('Data not found', 404)
  if (offer.renterUserId === userId) return { offer, side: 'renter' }
  const shop = await salonDetail.findOne({ where: { id: offer.shopSalonId, userId }, attributes: ['id'] })
  if (shop) return { offer, side: 'shop' }
  throw new AppError('Data not found', 404)
}

function assertOpen(offer) {
  if (offer.status !== 'open') throw new AppError('This offer is already closed.', 200)
  if (offer.expiresAt && new Date(offer.expiresAt) < new Date()) throw new AppError('This offer has expired.', 200)
}

async function otherSideUserId(offer, side) {
  if (side === 'shop') return offer.renterUserId
  const shop = await salonDetail.findByPk(offer.shopSalonId, { attributes: ['userId'] })
  return shop?.userId
}

// Either side answers the other's latest round with new terms.
async function counter(userId, offerId, body = {}) {
  const { offer, side } = await loadForUser(userId, offerId)
  assertOpen(offer)
  if (offer.lastBy === side) throw new AppError('Please wait for the other side to answer your last offer.', 200)
  if (offer.rounds >= MAX_ROUNDS) throw new AppError('This offer has had too many rounds. Please accept or decline it.', 200)
  const t = readTerms({ ...body, rentCycle: body.rentCycle || offer.rentCycle, payType: body.payType || offer.payType }, offer.kind)
  checkTrial(t)
  await sequelize.transaction(async (transaction) => {
    await chairOfferRound.create({ offerId: offer.id, by: side, ...t }, { transaction })
    await offer.update({
      lastBy: side,
      rounds: offer.rounds + 1,
      rentAmount: t.rentAmount,
      rentCycle: t.rentCycle,
      startDate: t.startDate,
      trialDate: t.trialDate,
      ...(offer.kind === 'staff' ? { payType: t.payType } : {}),
      // Only the shop decides whether it covers the renter's plan.
      ...(side === 'shop' && offer.kind !== 'staff' ? { coversPlan: t.coversPlan } : {}),
      ...(side === 'renter' && offer.kind !== 'staff' && t.planWish ? { planWish: t.planWish } : {}),
      ...(side === 'shop' ? { shopTerms: t.terms ?? offer.shopTerms } : { renterTerms: t.terms ?? offer.renterTerms }),
      expiresAt: expiry(),
    }, { transaction })
  })
  push([await otherSideUserId(offer, side)], {
    title: 'New counter offer',
    body: `${await sideName(offer, side)} sent a counter offer${t.rentAmount != null ? `: ${t.payType === 'commission' ? `${t.rentAmount}% commission` : `£${t.rentAmount} ${String(t.rentCycle || '').toLowerCase()}`.trim()}` : ''}${t.startDate ? `, starting ${prettyDate(t.startDate)}` : ''}.`,
  }, { offerId: offer.id })
  return offer
}

// The side answering the latest round accepts it; the renter's move is set up.
async function accept(userId, offerId) {
  const { offer, side } = await loadForUser(userId, offerId)
  assertOpen(offer)
  if (offer.lastBy === side) throw new AppError('Please wait for the other side to answer your last offer.', 200)
  const shop = await salonDetail.findOne({
    where: { id: offer.shopSalonId, deleted: false, [Op.and]: [activeSalonWhere(today())] },
    attributes: ['id', 'userId', 'salonName', 'teamSize'],
  })
  if (!shop) throw new AppError(offer.kind === 'staff' ? 'This shop cannot take new staff right now.' : 'This shop cannot take chair renters right now.', 200)

  // Someone from the client app (not a chair renter yet, or a staff job): no move.
  if (!offer.renterSalonId) return require('./hiringOffers').acceptApplicant({ offer, side, shop, userId })

  // A covered chair uses one of the shop's team seats.
  if (offer.coversPlan && (await require('./renterCoverage').seatsLeft(shop)) < 1) {
    throw new AppError('Your plan has no free team seat for a covered chair renter. Upgrade your plan, or turn off "Trim plan included".', 200)
  }

  // Claim the offer first, so a double tap or both sides at once cannot make two moves.
  const [claimed] = await chairOffer.update(
    { status: 'accepted', closedAt: new Date() },
    { where: { id: offer.id, status: 'open' } },
  )
  if (!claimed) throw new AppError('This offer has already been answered.', 200)

  let move
  try {
    move = await renterMove.createAcceptedMove({
      renterUserId: offer.renterUserId,
      toSalonId: offer.shopSalonId,
      // A start date that has passed while the offer waited becomes today.
      moveDate: offer.startDate && String(offer.startDate) > today() ? offer.startDate : today(),
      rentAmount: offer.rentAmount,
      rentCycle: offer.rentCycle,
      createdBy: userId,
    })
  } catch (err) {
    await chairOffer.update({ status: 'open', closedAt: null }, { where: { id: offer.id } })
    throw err
  }
  await offer.update({ status: 'accepted', moveId: move.id })
  await renterWorkPref.update({ openToWork: false }, { where: { renterSalonId: offer.renterSalonId } })
  // The chair is taken from now on; it frees up again if the move is cancelled.
  await require('./hiringRequests').reserve(offer.shopSalonId, 'chair', offer.id)

  // The renter took this deal: their other open offers close.
  const others = await chairOffer.findAll({
    where: { renterUserId: offer.renterUserId, status: 'open', id: { [Op.ne]: offer.id } },
    include: [{ model: salonDetail, as: 'shop', attributes: ['userId'] }],
  })
  for (const o of others) {
    await o.update({ status: 'closed', closedAt: new Date() })
    push([o.shop?.userId], {
      title: 'Chair offer closed',
      body: 'The renter has accepted another shop\'s offer.',
    }, { offerId: o.id })
  }
  push([await otherSideUserId(offer, side)], {
    title: 'Chair offer accepted',
    body: side === 'renter'
      ? `${await sideName(offer, 'renter')} accepted your chair offer and joins on ${prettyDate(move.moveDate)}.`
      : `${shop.salonName} accepted your terms. You join on ${prettyDate(move.moveDate)}.`,
  }, { offerId: offer.id, moveId: move.id })
  return { offer, move }
}

// Closes an open offer: the side that started it withdraws it, the other declines it.
async function decline(userId, offerId) {
  const { offer, side } = await loadForUser(userId, offerId)
  assertOpen(offer)
  const startedBy = offer.createdBy === offer.renterUserId ? 'renter' : 'shop'
  const status = side === startedBy ? 'withdrawn' : 'declined'
  await offer.update({ status, closedAt: new Date() })
  const who = await sideName(offer, side)
  push([await otherSideUserId(offer, side)], {
    title: status === 'declined' ? `${offer.kind === 'staff' ? 'Job' : 'Chair'} offer declined` : `${offer.kind === 'staff' ? 'Job' : 'Chair'} offer withdrawn`,
    body: status === 'declined' ? `${who} declined the ${offerWord(offer)}.` : `${who} withdrew the ${offerWord(offer)}.`,
  }, { offerId: offer.id })
  return offer
}

// Offers the signed-in user is part of, newest first, with the history.
async function listOffers(userId) {
  const own = await salonDetail.findAll({ where: { userId }, attributes: ['id'] })
  const ownIds = own.map((s) => s.id)
  const offers = await chairOffer.findAll({
    where: { [Op.or]: [{ renterUserId: userId }, ...(ownIds.length ? [{ shopSalonId: ownIds }] : [])] },
    include: [
      { model: chairOfferRound, as: 'history' },
      {
        model: salonDetail,
        as: 'shop',
        attributes: ['id', 'salonName', 'coverImage'],
        include: [
          { model: addressDBS, attributes: ['city'] },
          { model: user, attributes: ['email', 'countryCode', 'phoneNum'] },
        ],
      },
      { model: salonDetail, as: 'renterSalon', attributes: ['id', 'salonName', 'coverImage'] },
      { model: user, as: 'renter', attributes: ['firstName', 'lastName', 'image', 'email', 'countryCode', 'phoneNum'] },
    ],
    order: [['updatedAt', 'DESC']],
    limit: 100,
  })
  const now = new Date()
  return offers.map((o) => {
    const j = o.toJSON()
    const side = j.renterUserId === userId ? 'renter' : 'shop'
    const expired = j.status === 'open' && j.expiresAt && new Date(j.expiresAt) < now
    const accepted = j.status === 'accepted'
    j.history = (j.history || []).sort((a, b) => a.id - b.id)
    // Contact details only once both sides agreed.
    const shopUser = j.shop?.user || {}
    if (j.shop) delete j.shop.user
    const renter = j.renter || {}
    const applicant = j.renterSalonId ? null : applicantOf(o)
    j.renter = applicant
      ? { firstName: applicant.firstName || renter.firstName, lastName: applicant.lastName || renter.lastName, image: renter.image }
      : { firstName: renter.firstName, lastName: renter.lastName, image: renter.image }
    // What a client app applicant told the shop (contact details only after a deal).
    j.applicant = applicant
      ? { experience: applicant.experience ?? null, location: applicant.location || null, days: applicant.days || [], skills: applicant.skills || [], note: applicant.note || null }
      : null
    delete j.applicantInfo
    j.contact = accepted
      ? side === 'renter'
        ? { email: shopUser.email || null, phone: [shopUser.countryCode, shopUser.phoneNum].filter(Boolean).join(' ') || null }
        : applicant
          ? { email: applicant.email || renter.email || null, phone: applicant.phone || [renter.countryCode, renter.phoneNum].filter(Boolean).join(' ') || null }
          : { email: renter.email || null, phone: [renter.countryCode, renter.phoneNum].filter(Boolean).join(' ') || null }
      : null
    return {
      ...j,
      status: expired ? 'expired' : j.status,
      side,
      myTurn: j.status === 'open' && !expired && j.lastBy !== side,
    }
  })
}

// Called by the 5-minute job: open offers past their expiry close.
async function expireOffers() {
  const [count] = await chairOffer.update(
    { status: 'expired', closedAt: new Date() },
    { where: { status: 'open', expiresAt: { [Op.lt]: new Date() } } },
  )
  return count
}

// ---------------------------------------------------------------- admin panel

// Everything in the chair market for Trim support: renters open to work, shops
// hiring, and every offer (newest first) with its rounds.
// Every chair renter's own Trim plan, for the admin "Renter plans" tab.
async function renterPlans() {
  const rows = await salonDetail.findAll({
    where: { isExternalEmployee: true, deleted: false },
    attributes: ['id', 'salonName', 'parentSalonId', 'registrationExpiryDate', 'subscriptionLatestPaymentStatus', 'metadata', 'renterCoveredBy', 'renterOwnExpiry', 'renterOwnStatus', 'renterGraceCount'],
    include: [{ model: user, attributes: ['firstName', 'lastName', 'email', 'countryCode', 'phoneNum', 'deleted'] }],
    order: [['registrationExpiryDate', 'ASC']],
    limit: 1000,
  })
  const hostIds = [...new Set(rows.map((r) => r.parentSalonId).filter(Boolean))]
  const hosts = hostIds.length ? await salonDetail.findAll({ where: { id: hostIds }, attributes: ['id', 'salonName'] }) : []
  const hostName = new Map(hosts.map((h) => [h.id, h.salonName]))
  const day = today()
  return rows
    .filter((r) => !r.user?.deleted)
    .map((r) => {
      const status = r.subscriptionLatestPaymentStatus || null
      const active = isSalonRowActive(r, day)
      let meta = r.metadata
      if (typeof meta === 'string') {
        try { meta = JSON.parse(meta) } catch { meta = null }
      }
      return {
        renterSalonId: r.id,
        name: `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim() || r.salonName,
        email: r.user?.email || null,
        phone: [r.user?.countryCode, r.user?.phoneNum].filter(Boolean).join(' ') || null,
        currentShop: r.parentSalonId ? hostName.get(r.parentSalonId) || null : null,
        expiresOn: r.registrationExpiryDate || null,
        status,
        // free = free days (when renters got their own plan, or after a shop
        // stopped covering them); covered = the shop's plan covers it
        state: !active ? 'ended' : status === 'shop_covered' ? 'covered' : status === 'renter_switch' ? 'free' : status === 'trial' ? 'trial' : 'paid',
        coveredBy: r.renterCoveredBy ? hostName.get(r.renterCoveredBy) || null : null,
        ownPlanUntil: r.renterCoveredBy ? r.renterOwnExpiry || null : null,
        timesUncovered: Number(r.renterGraceCount || 0),
        planName: status === 'renter_switch' ? null : meta?.subscriptionName || null,
      }
    })
}

async function adminOverview() {
  const [prefs, listings, offers, plans] = await Promise.all([
    renterWorkPref.findAll({ where: { openToWork: true } }),
    shopChairListing.findAll({ where: { isHiring: true } }),
    chairOffer.findAll({
      include: [
        { model: chairOfferRound, as: 'history' },
        { model: salonDetail, as: 'shop', attributes: ['id', 'salonName'] },
        { model: salonDetail, as: 'renterSalon', attributes: ['id', 'salonName'] },
        { model: user, as: 'renter', attributes: ['firstName', 'lastName', 'email'] },
      ],
      order: [['updatedAt', 'DESC']],
      limit: 500,
    }),
    renterPlans(),
  ])
  // The same renters shops see in "Find chair renters": Open to Work, or
  // between shops, with their own plan active and an open account.
  const day = today()
  const renterSalons = (await salonDetail.findAll({
    where: {
      isExternalEmployee: true,
      deleted: false,
      [Op.and]: [
        activeSalonWhere(day),
        {
          [Op.or]: [
            { id: prefs.length ? prefs.map((p) => p.renterSalonId) : [0] },
            { parentSalonId: null, renterGraceUntil: { [Op.ne]: null } },
          ],
        },
      ],
    },
    attributes: ['id', 'salonName', 'parentSalonId', 'renterGraceUntil'],
    include: [{ model: user, attributes: ['firstName', 'lastName', 'email', 'countryCode', 'phoneNum', 'status', 'deleted'] }],
  })).filter((r) => !r.user?.deleted && r.user?.status !== false)

  // The same shops renters see in "Shops hiring": a hiring listing, or the old
  // rent-a-chair advert with no listing yet; subscribed and not deleted.
  const withListing = new Set((await shopChairListing.findAll({ attributes: ['shopSalonId'] })).map((l) => l.shopSalonId))
  const hiringSalons = await salonDetail.findAll({
    where: {
      isExternalEmployee: false,
      deleted: false,
      [Op.and]: [
        activeSalonWhere(day),
        {
          [Op.or]: [
            { id: listings.length ? listings.map((l) => l.shopSalonId) : [0] },
            { rentChairAdvertisementStatus: true, id: { [Op.notIn]: [...withListing, 0] } },
          ],
        },
      ],
    },
    attributes: ['id', 'salonName', ...ADVERT_ATTRS],
  })
  const listingBy = new Map(listings.map((l) => [l.shopSalonId, l]))

  const shopIds = [...new Set(renterSalons.map((r) => r.parentSalonId).filter(Boolean))]
  const [shops, stats] = await Promise.all([
    shopIds.length ? salonDetail.findAll({ where: { id: shopIds }, attributes: ['id', 'salonName'] }) : [],
    statsFor(renterSalons.map((r) => r.id)),
  ])
  const shopName = new Map(shops.map((x) => [x.id, x.salonName]))
  const prefBy = new Map(prefs.map((p) => [p.renterSalonId, p]))
  const now = new Date()
  return {
    renters: renterSalons.map((r) => ({
      renterSalonId: r.id,
      name: `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim() || r.salonName,
      email: r.user?.email || null,
      phone: [r.user?.countryCode, r.user?.phoneNum].filter(Boolean).join(' ') || null,
      currentShop: r.parentSalonId ? shopName.get(r.parentSalonId) || null : null,
      prefs: prefJson(prefBy.get(r.id), r),
      stats: stats.get(r.id) || null,
    })),
    hiringShops: hiringSalons.map((h) => ({ shopSalonId: h.id, salonName: h.salonName, listing: listingJson(listingBy.get(h.id), h) })),
    renterPlans: plans,
    offers: offers.map((o) => {
      const j = o.toJSON()
      j.history = (j.history || []).sort((a, b) => a.id - b.id)
      if (j.status === 'open' && j.expiresAt && new Date(j.expiresAt) < now) j.status = 'expired'
      j.startedBy = j.createdBy === j.renterUserId ? 'renter' : 'shop'
      // Client app applicants: who they are (they have no renter shop).
      if (!j.renterSalonId) {
        const a = applicantOf(o)
        j.applicant = { name: `${a.firstName || ''} ${a.lastName || ''}`.trim() || null, email: a.email || null, phone: a.phone || null }
      }
      delete j.applicantInfo
      return j
    }),
  }
}

// Support closes an open offer (for example a report of misuse). Both sides are told.
async function adminCloseOffer(offerId) {
  const offer = await chairOffer.findByPk(offerId)
  if (!offer) throw new AppError('Data not found', 404)
  if (offer.status !== 'open') throw new AppError('This offer is already closed.', 200)
  await offer.update({ status: 'closed', closedAt: new Date() })
  const shop = await salonDetail.findByPk(offer.shopSalonId, { attributes: ['userId'] })
  push([offer.renterUserId, shop?.userId], {
    title: 'Chair offer closed',
    body: 'This chair offer was closed by Trim support.',
  }, { offerId: offer.id })
  return offer
}

module.exports = {
  applicantOf,
  applicantName,
  offerWord,
  readTerms,
  checkTrial,
  loadForUser,
  assertOpen,
  otherSideUserId,
  push,
  prettyDate,
  expiry,
  adminOverview,
  adminCloseOffer,
  SKILLS,
  skillsOf,
  publicChairListing,
  syncListingFromAdvert,
  getMyListing,
  saveMyListing,
  listHiringShops,
  applyToShop,
  hideShop,
  getMyPrefs,
  saveMyPrefs,
  listRenters,
  renterProfile,
  rentHint,
  shopProfile,
  sendOffer,
  counter,
  accept,
  decline,
  listOffers,
  expireOffers,
  weeklyRent,
  km,
  OFFER_DAYS,
  MIN_BOOKINGS_FOR_RATES,
}
