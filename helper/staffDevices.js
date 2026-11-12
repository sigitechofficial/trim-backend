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
const { deviceToken } = require('../models')

async function revokeStaffDevices(staffUserId) {
  const id = Number(staffUserId)
  if (!(id > 0)) return 0
  const rows = await deviceToken.findAll({ where: { userId: id }, attributes: ['tokenId'] })
  const tokenIds = [...new Set(rows.map((r) => r.tokenId).filter(Boolean))]
  if (tokenIds.length) await deviceToken.destroy({ where: { tokenId: tokenIds } })
  await deviceToken.destroy({ where: { userId: id } })
  return tokenIds.length
}

module.exports = { revokeStaffDevices }
