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
  const { id, dvToken } = claims || {}
  if (!id || !dvToken) return null

  const device = await deviceToken.findOne({
    where: { tokenId: dvToken, userId: id },
    attributes: ['id'],
    include: { model: user, where: { status: true }, attributes: [] },
  })
  if (!device) return null

  const shop = await salonDetail.findOne({ where: { userId: id }, attributes: ['id'] })
  if (!shop) return { rooms: new Set([`${id}`]), kind: 'client' }

  // Staff devices: the same token also sits on the staff member's own user.
  const staffDevice = await deviceToken.findOne({
    where: { tokenId: dvToken },
    attributes: ['userId'],
    include: { model: user, where: { userTypeId: 3, status: true }, attributes: [], required: true },
  })
  if (!staffDevice) return { rooms: new Set([`${shop.id}S`]), kind: 'owner' }

  const staff = await employee.findOne({
    where: { userId: staffDevice.userId, salonDetailId: shop.id, deleted: false, status: true },
    attributes: ['id'],
  })
  if (!staff) return null
  // Events go to `<employeeId>E`; older staff apps asked for `<userId>E`.
  return { rooms: new Set([`${staff.id}E`, `${staffDevice.userId}E`]), kind: 'staff' }
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
