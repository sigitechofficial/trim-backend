// Which live-update rooms a socket may be in, worked out from its login token.
//
// Rooms in use:  `<shopId>S` the shop (owner devices)
//                `<employeeId>E` one team member (staff devices)
//                `<userId>` a client
// Until now any app could join any room by naming it, and read (and clear)
// another shop's or client's queued events. New apps send their access token
// in the handshake; the server joins the rooms itself and refuses others.
const { verify } = require('jsonwebtoken')
const { deviceToken, employee, salonDetail, user } = require('../models')

// The token's rooms, or null if the token is not valid (bad signature, signed
// out device, blocked user, removed team member).
async function socketRooms(token) {
  let claims
  try {
    claims = verify(token, process.env.JWT_ACCESS_SECRET)
  } catch {
    return null
  }
  const { id, dvToken, staffUserId } = claims || {}
  if (!id || !dvToken) return null

  const device = await deviceToken.findOne({
    where: { tokenId: dvToken, userId: id },
    attributes: ['id'],
    include: { model: user, where: { status: true }, attributes: [] },
  })
  if (!device) return null

  // Every branch of this owner (one shop for most).
  const shops = await salonDetail.findAll({ where: { userId: id, closedAt: null }, attributes: ['id'] })
  if (!shops.length) return { rooms: new Set([`${id}`]), kind: 'client' }
  const shopIds = shops.map((s) => s.id)

  // Staff devices: the same token also sits on the staff member's own user.
  // Tokens from Step A name the staff member; older ones are found by device.
  const staffDevice = staffUserId
    ? await user
        .findOne({ where: { id: staffUserId, userTypeId: 3, status: true }, attributes: ['id'] })
        .then((u) => (u ? { userId: u.id } : null))
    : await deviceToken.findOne({
        where: { tokenId: dvToken },
        attributes: ['userId'],
        include: { model: user, where: { userTypeId: 3, status: true }, attributes: [], required: true },
      })
  if (!staffDevice) return { rooms: new Set(shopIds.map((sid) => `${sid}S`)), kind: 'owner' }

  const rows = await employee.findAll({
    where: { userId: staffDevice.userId, salonDetailId: shopIds, deleted: false, status: true },
    attributes: ['id'],
  })
  if (!rows.length) return null
  // Events go to `<employeeId>E` (one per branch); older staff apps asked for `<userId>E`.
  return { rooms: new Set([...rows.map((r) => `${r.id}E`), `${staffDevice.userId}E`]), kind: 'staff' }
}

// A token sent in the handshake: socket.io `auth`, query or header.
function handshakeToken(handshake = {}) {
  return (
    handshake.auth?.token ||
    handshake.query?.accessToken ||
    handshake.headers?.accesstoken ||
    null
  )
}

module.exports = { socketRooms, handshakeToken }
