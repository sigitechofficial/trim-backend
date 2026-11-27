// Client brand page: a shop that belongs to a brand with several branches
// shows "Part of <brand> · N branches", and the client can list every branch
// (nearest first when the app sends its location) and open any of them.
//
// A branch is listed only when clients could find it in search: active plan,
// not closed or paused, approved by Trim, not blocked, not deleted.
const { QueryTypes } = require('sequelize')
const { sequelize } = require('../models')
const CustomDate = require('../utils/currentDay')
const { activeSalonCaseSql, quoteDate } = require('./salonSubscriptionRule')

const visibleSql = (alias, today) => `${activeSalonCaseSql(alias, quoteDate(today))} = 1
  AND ${alias}.approvedByAdmin = 1 AND ${alias}.status = 1 AND ${alias}.deleted = 0`

const today = () => CustomDate.currentDay?.().currentDateOnly || new Date().toISOString().slice(0, 10)

// Great-circle distance in km, or null without both points.
function km(lat1, lng1, lat2, lng2) {
  const n = [lat1, lng1, lat2, lng2].map(Number)
  if (n.some((x) => !Number.isFinite(x))) return null
  const r = (d) => (d * Math.PI) / 180
  const dLat = r(n[2] - n[0])
  const dLng = r(n[3] - n[1])
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(n[0])) * Math.cos(r(n[2])) * Math.sin(dLng / 2) ** 2
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
}

// { id, name, branchCount } for the shop page, or null when the shop is not
// part of a brand with at least two branches clients can see.
async function brandOfSalon(salonId) {
  const [row] = await sequelize.query(
    `SELECT b.id, b.name,
       (SELECT COUNT(*) FROM salonDetails s WHERE s.brandId = b.id AND ${visibleSql('s', today())}) AS branchCount
     FROM salonDetails me JOIN brands b ON b.id = me.brandId
     WHERE me.id = :salonId`,
    { replacements: { salonId: Number(salonId) || 0 }, type: QueryTypes.SELECT },
  )
  if (!row || Number(row.branchCount) < 2) return null
  return { id: row.id, name: row.name, branchCount: Number(row.branchCount) }
}

// Every visible branch of the brand the shop belongs to.
async function branchesOf(salonId, { lat, lng } = {}) {
  const brand = await brandOfSalon(salonId)
  if (!brand) return null
  const rows = await sequelize.query(
    `SELECT s.id, s.salonName, s.coverImage, s.isOnline,
       a.streetAddress, a.district, a.city, a.postalCode, a.lat, a.lng,
       (SELECT ROUND(AVG(r.value), 1) FROM ratings r WHERE r.salonDetailId = s.id) AS rating,
       (SELECT COUNT(DISTINCT r.bookingId) FROM ratings r WHERE r.salonDetailId = s.id) AS ratingCount
     FROM salonDetails s LEFT JOIN addressDBs a ON a.id = s.addressDBId
     WHERE s.brandId = :brandId AND ${visibleSql('s', today())}`,
    { replacements: { brandId: brand.id }, type: QueryTypes.SELECT },
  )
  const branches = rows.map((s) => ({
    id: s.id,
    name: s.salonName,
    coverImage: s.coverImage || null,
    isOnline: !!s.isOnline,
    address: [s.streetAddress, s.district, s.city, s.postalCode].filter(Boolean).join(', '),
    lat: s.lat != null ? Number(s.lat) : null,
    lng: s.lng != null ? Number(s.lng) : null,
    rating: s.rating != null ? Number(s.rating) : null,
    ratingCount: Number(s.ratingCount) || 0,
    distanceKm: km(lat, lng, s.lat, s.lng),
    current: s.id === Number(salonId),
  }))
  // Nearest first when the distance is known, then by name.
  branches.sort((x, y) => {
    if (x.distanceKm != null && y.distanceKm != null) return x.distanceKm - y.distanceKm
    if (x.distanceKm != null) return -1
    if (y.distanceKm != null) return 1
    return String(x.name).localeCompare(String(y.name))
  })
  return { brand, branches }
}

module.exports = { brandOfSalon, branchesOf, km }
