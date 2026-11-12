// Who may do owner-level things in the shop app.
//
// A staff session uses the shop owner's user id in its JWT (see accessCheck),
// so every owner endpoint used to accept staff too: a staff tap on "Delete
// account" deleted the owner's account. resolveRequestActor tells owner and
// staff apart by the device token.
const { employee, employeeAccess, employeeAccessDefault } = require('../models')
const { resolveRequestActor } = require('../helper/bookingRequestAccess')

const deny = (res, message) => res.json({ status: '0', message, data: {}, error: '' })

const LEVELS = ['none', 'low', 'high']

// A staff member's level for one permission key ('none' if unset).
async function staffLevel(employeeId, salonDetailId, key) {
  let row = await employeeAccess.findOne({ where: { employeeId, key }, attributes: ['level'] })
  if (!row) {
    const own = await employeeAccess.count({ where: { employeeId } })
    if (!own) row = await employeeAccessDefault.findOne({ where: { salonDetailId, key }, attributes: ['level'] })
  }
  return LEVELS.includes(row?.level) ? row.level : 'none'
}

// Owner (or chair renter on their own shop) only. A user with no shop yet is
// an owner setting up, so they pass.
async function ownerOnly(req, res, next) {
  try {
    const actor = await resolveRequestActor(req)
    req.actor = actor
    if (!actor.shopId || actor.isOwner) return next()
    return deny(res, 'Only the shop owner can do this.')
  } catch (err) {
    return next(err)
  }
}

// Changing a team member's access levels or pay: the member must be in the
// caller's shop; staff need teamMember 'high' and may not change themselves
// or the owner.
async function teamEditGuard(req, res, next) {
  try {
    const actor = await resolveRequestActor(req)
    req.actor = actor
    const employeeId = parseInt(req.body?.employeeId ?? req.params?.employee, 10)
    const target = actor.shopId && employeeId
      ? await employee.findOne({
          where: { id: employeeId, salonDetailId: actor.shopId },
          attributes: ['id', 'isOwner'],
        })
      : null
    if (!target) return deny(res, 'This team member is not in your shop.')
    if (actor.isOwner) return next()
    if (!actor.employeeId) return deny(res, 'Only the shop owner can do this.')
    if (target.id === actor.employeeId) return deny(res, "You can't change your own access or pay.")
    if (target.isOwner) return deny(res, 'Only the shop owner can do this.')
    if ((await staffLevel(actor.employeeId, actor.shopId, 'teamMember')) !== 'high') {
      return deny(res, "You don't have access to manage team members.")
    }
    return next()
  } catch (err) {
    return next(err)
  }
}

module.exports = { ownerOnly, teamEditGuard, staffLevel }
