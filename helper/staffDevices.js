/**
 * Signs a staff member out of every device.
 *
 * Staff log in with the shop owner's id, so each staff phone also has a
 * device-token row under the OWNER (authController staff login). That row is
 * what keeps the staff token valid in accessCheck, so removing only the staff
 * member's own rows is not enough: rows under any user that share the staff
 * member's device tokens go too. A shared front-desk device the owner also
 * used is signed out as well and simply logs in again.
 */
const models = () => require('../models')

async function revokeStaffDevices(staffUserId) {
  const id = Number(staffUserId)
  if (!(id > 0)) return 0
  const { deviceToken } = models()
  const rows = await deviceToken.findAll({ where: { userId: id }, attributes: ['tokenId'] })
  const tokenIds = [...new Set(rows.map((r) => r.tokenId).filter(Boolean))]
  if (tokenIds.length) await deviceToken.destroy({ where: { tokenId: tokenIds } })
  await deviceToken.destroy({ where: { userId: id } })
  return tokenIds.length
}

/**
 * Push tokens of these users' own phones. A staff phone is also stored under
 * the shop owner's id (staff log in with it), so a token that also belongs to
 * a staff user who is not one of the recipients is left out: owner pushes
 * (payouts, subscription, hiring, chair market) don't reach staff phones.
 */
async function ownDeviceTokens(userIds) {
  const ids = [...new Set((Array.isArray(userIds) ? userIds : [userIds]).map(Number).filter((n) => n > 0))]
  if (!ids.length) return []
  const { deviceToken, user } = models()
  const rows = await deviceToken.findAll({ where: { userId: ids }, attributes: ['tokenId'] })
  const tokenIds = [...new Set(rows.map((r) => r.tokenId).filter(Boolean))]
  if (!tokenIds.length) return []
  // Other users on the same phones; those that are staff mark staff phones.
  const shared = (await deviceToken.findAll({ where: { tokenId: tokenIds }, attributes: ['tokenId', 'userId'] }))
    .filter((r) => !ids.includes(Number(r.userId)))
  const otherIds = [...new Set(shared.map((r) => Number(r.userId)))]
  const staffIds = otherIds.length
    ? new Set((await user.findAll({ where: { id: otherIds, userTypeId: 3 }, attributes: ['id'] })).map((u) => Number(u.id)))
    : new Set()
  const staffTokens = new Set(shared.filter((r) => staffIds.has(Number(r.userId))).map((r) => r.tokenId))
  return tokenIds.filter((t) => !staffTokens.has(t))
}

module.exports = { revokeStaffDevices, ownDeviceTokens }
