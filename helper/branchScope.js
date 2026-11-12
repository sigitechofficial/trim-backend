// Which branch a business-app request acts on, and who is acting (Step A).
//
// Until now every handler found "the shop" with salonDetail.findOne({ userId:
// req.user.id }), which only works while an owner has one shop. With branches
// the app sends the selected branch in the `x-salon-id` header; this helper
// checks the caller may open it and hands it to the handlers.
//
// Old apps send no header: the caller's home shop is used (an owner's first
// shop, a staff member's own branch), so nothing changes for single shops.
//
// req.branch = { userId, isOwner, salonId, brandId, role, employeeId, allowedSalonIds }
const { Op } = require('sequelize')
const { brand, deviceToken, employee, salonDetail, user } = require('../models')

const deny = (res, message) => res.json({ status: '0', message, data: {}, error: '' })

// The staff member behind this device, if the token is a staff session (staff
// sessions carry the owner's id; the device is also linked to the staff user).
async function staffUserIdFor(req) {
  if (req.user?.staffUserId) return req.user.staffUserId // tokens from Step A (0.1)
  const tokenId = req.user?.dvToken
  if (!tokenId) return null
  const row = await deviceToken.findOne({
    where: { tokenId },
    attributes: ['userId'],
    include: { model: user, where: { userTypeId: 3 }, attributes: [], required: true },
  })
  return row ? row.userId : null
}

const roleOf = (row) => row.role || (row.isOwner ? 'owner' : 'barber')

// Every branch the caller may open, home branch first.
async function branchesFor(req) {
  const ownerId = req.user?.id
  const staffUserId = await staffUserIdFor(req)

  if (staffUserId) {
    // Staff: their active rows, only in shops of the owner whose session this is.
    const rows = await employee.findAll({
      where: { userId: staffUserId, deleted: false, status: true },
      attributes: ['id', 'salonDetailId', 'role', 'isOwner'],
      include: { model: salonDetail, attributes: ['id', 'userId', 'brandId', 'closedAt'], required: true },
      order: [['id', 'ASC']],
    })
    return rows
      .filter((r) => r.salonDetail.userId === ownerId && !r.salonDetail.closedAt)
      .map((r) => ({ salonId: r.salonDetailId, brandId: r.salonDetail.brandId, role: roleOf(r), employeeId: r.id, isOwner: false }))
  }

  // Owner: the shops they own (their brand's branches), oldest first.
  const shops = await salonDetail.findAll({
    where: { userId: ownerId, closedAt: null },
    attributes: ['id', 'brandId'],
    order: [['id', 'ASC']],
  })
  const ownerRows = shops.length
    ? await employee.findAll({
        where: { salonDetailId: { [Op.in]: shops.map((s) => s.id) }, userId: ownerId, deleted: false },
        attributes: ['id', 'salonDetailId'],
      })
    : []
  const ownerRowOf = new Map(ownerRows.map((r) => [r.salonDetailId, r.id]))
  return shops.map((s) => ({ salonId: s.id, brandId: s.brandId, role: 'owner', employeeId: ownerRowOf.get(s.id) || null, isOwner: true }))
}

// The acting branch for this request (worked out once per request).
async function actorFor(req) {
  if (req.branch) return req.branch
  const branches = await branchesFor(req)
  const asked = parseInt(req.get?.('x-salon-id') ?? req.headers?.['x-salon-id'], 10)
  let pick = null
  if (asked > 0) {
    pick = branches.find((b) => b.salonId === asked) || null
    if (!pick) {
      const err = new Error("You don't have access to this branch.")
      err.branchDenied = true
      throw err
    }
  } else {
    pick = branches[0] || null // home branch: old apps and single shops
  }
  req.branch = {
    userId: req.user?.id ?? null,
    isOwner: pick ? pick.isOwner : false,
    salonId: pick ? pick.salonId : null,
    brandId: pick ? pick.brandId : null,
    role: pick ? pick.role : null,
    employeeId: pick ? pick.employeeId : null,
    allowedSalonIds: branches.map((b) => b.salonId),
  }
  return req.branch
}

// Express middleware: refuses a branch the caller may not open.
async function branchScope(req, res, next) {
  try {
    await actorFor(req)
    return next()
  } catch (err) {
    if (err.branchDenied) return deny(res, err.message)
    return next(err)
  }
}

// The acting branch's id (replaces salonDetail.findOne({ userId: req.user.id })).
async function actingSalonId(req) {
  return (await actorFor(req)).salonId
}

module.exports = { branchScope, actorFor, actingSalonId, branchesFor }
