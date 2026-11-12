// Who may see and answer booking requests (manual approval), and who is acting.
//
// Staff sessions use the shop owner's user id in the JWT; the device token is
// also linked to the staff member's own user (userTypeId 3), which is how the
// acting staff member is identified.
//
// Permission "bookingRequests": none | low (own bookings only) | high (all).
// Staff without that key yet inherit it from "appointments" (the level that
// used to gate this), so nobody loses access when the permission is introduced.
const { Op } = require('sequelize')
const {
  deviceToken,
  employee,
  employeeAccess,
  employeeAccessDefault,
  jobs,
  salonDetail,
  user,
} = require('../models')

const LEVELS = ['none', 'low', 'high']

// rows: [{ key, level }] or a { key: level } map.
function requestsLevelFrom(rows) {
  const map = Array.isArray(rows)
    ? Object.fromEntries(rows.map((r) => [r.key, r.level]))
    : rows || {}
  const own = map.bookingRequests
  if (LEVELS.includes(own)) return own
  return LEVELS.includes(map.appointments) ? map.appointments : 'none'
}

async function staffRequestsLevel(employeeId, salonDetailId) {
  let rows = await employeeAccess.findAll({ where: { employeeId }, attributes: ['key', 'level'] })
  if (!rows.length) {
    rows = await employeeAccessDefault.findAll({ where: { salonDetailId }, attributes: ['key', 'level'] })
  }
  return requestsLevelFrom(rows)
}

const fullName = (u) => `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim()

// A staff member by their own user id (staffUserId in Step A tokens).
async function staffByUserId(userId, salonDetailId) {
  const u = await user.findOne({ where: { id: userId, userTypeId: 3 }, attributes: ['id', 'firstName', 'lastName'] })
  if (!u) return null
  const staff = await employee.findOne({ where: { userId: u.id, salonDetailId, deleted: false }, attributes: ['id'] })
  return { employeeId: staff ? staff.id : null, name: fullName(u) }
}

// The staff member behind a device token within a shop, or null (owner device).
async function staffByDeviceToken(tokenId, salonDetailId) {
  if (!tokenId) return null
  const row = await deviceToken.findOne({
    where: { tokenId },
    attributes: ['userId'],
    include: {
      model: user,
      where: { userTypeId: 3 },
      attributes: ['id', 'firstName', 'lastName'],
      required: true,
    },
  })
  if (!row) return null
  const staff = await employee.findOne({
    where: { userId: row.userId, salonDetailId, deleted: false },
    attributes: ['id'],
  })
  return staff ? { employeeId: staff.id, name: fullName(row.user) } : { employeeId: null, name: fullName(row.user) }
}

/**
 * The shop and person behind a shop-app request.
 * { shopId, isOwner, employeeId, level, name } — level is 'high' for owners
 * (including chair renters, who own their own shop). shopId is null if unknown.
 */
async function resolveRequestActor(req) {
  // The branch this request acts on (x-salon-id; the home shop for old apps).
  const salonId = await require('./branchScope').actingSalonId(req)
  const shop = salonId && await salonDetail.findOne({
    where: { id: salonId },
    attributes: ['id', 'userId'],
    include: { model: user, attributes: ['firstName', 'lastName'] },
  })
  if (!shop) return { shopId: null, isOwner: false, employeeId: null, level: 'none', name: '' }

  // Tokens from Step A name the staff member; older ones are found by device.
  const staff = req.user?.staffUserId
    ? await staffByUserId(req.user.staffUserId, shop.id)
    : await staffByDeviceToken(req.user?.dvToken, shop.id)
  if (!staff) {
    return { shopId: shop.id, isOwner: true, employeeId: null, level: 'high', name: fullName(shop.user) }
  }
  if (!staff.employeeId) {
    // A staff login that no longer belongs to this shop.
    return { shopId: shop.id, isOwner: false, employeeId: null, level: 'none', name: staff.name }
  }
  return {
    shopId: shop.id,
    isOwner: false,
    employeeId: staff.employeeId,
    level: await staffRequestsLevel(staff.employeeId, shop.id),
    name: staff.name,
  }
}

// Booking ids of a shop's requests this actor may see ('low' = assigned to them).
async function ownRequestBookingIds(employeeId) {
  const rows = await jobs.findAll({
    where: { employeeId },
    attributes: ['bookingId'],
    group: ['bookingId'],
  })
  return rows.map((r) => r.bookingId)
}

async function canActOnBooking(actor, bookingId) {
  if (actor.level === 'high') return true
  if (actor.level !== 'low' || !actor.employeeId) return false
  const mine = await jobs.count({ where: { bookingId, employeeId: actor.employeeId } })
  return mine > 0
}

/**
 * Device tokens that should get a booking-request push for a booking:
 * the owner's own devices, staff with "all" access, and staff with "own"
 * access who are on the booking.
 */
async function requestPushTokens({ salonDetailId, ownerUserId, bookingId }) {
  if (!ownerUserId) return []
  const ownerRows = await deviceToken.findAll({
    where: { userId: ownerUserId, tokenId: { [Op.ne]: null } },
    attributes: ['tokenId'],
  })
  const tokenIds = [...new Set(ownerRows.map((r) => r.tokenId).filter(Boolean))]
  if (!tokenIds.length) return []

  // Tokens that also belong to a staff user are staff devices.
  const staffRows = await deviceToken.findAll({
    where: { tokenId: { [Op.in]: tokenIds } },
    attributes: ['tokenId', 'userId'],
    include: { model: user, where: { userTypeId: 3 }, attributes: ['id'], required: true },
  })
  if (!staffRows.length) return tokenIds

  const staffUserIds = [...new Set(staffRows.map((r) => r.userId))]
  const staffEmployees = await employee.findAll({
    where: { userId: { [Op.in]: staffUserIds }, salonDetailId, deleted: false },
    attributes: ['id', 'userId'],
  })
  const employeeByUser = Object.fromEntries(staffEmployees.map((e) => [e.userId, e.id]))
  const assigned = new Set(
    (await jobs.findAll({ where: { bookingId }, attributes: ['employeeId'] })).map((j) => j.employeeId),
  )

  const allowedByToken = {}
  for (const row of staffRows) {
    const employeeId = employeeByUser[row.userId]
    let allowed = false
    if (employeeId) {
      const level = await staffRequestsLevel(employeeId, salonDetailId)
      allowed = level === 'high' || (level === 'low' && assigned.has(employeeId))
    }
    allowedByToken[row.tokenId] = allowed
  }
  return tokenIds.filter((t) => !(t in allowedByToken) || allowedByToken[t])
}

module.exports = {
  requestsLevelFrom,
  resolveRequestActor,
  ownRequestBookingIds,
  canActOnBooking,
  requestPushTokens,
}
