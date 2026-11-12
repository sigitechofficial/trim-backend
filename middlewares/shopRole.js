// Who may do owner-level things in the shop app.
//
// A staff session uses the shop owner's user id in its JWT (see accessCheck),
// so every owner endpoint used to accept staff too: a staff tap on "Delete
// account" deleted the owner's account. resolveRequestActor tells owner and
// staff apart by the device token.
const { Op } = require('sequelize')
const { booking, employee, employeeAccess, employeeAccessDefault, jobs } = require('../models')
const { resolveRequestActor: resolveActor } = require('../helper/bookingRequestAccess')
const { bookingIdOf } = require('./bookingRequestGuard')

// Several guards may run on one request: work out the actor once.
async function resolveRequestActor(req) {
  if (!req._actor) req._actor = await resolveActor(req)
  return req._actor
}

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

const atLeast = (level, min) => LEVELS.indexOf(level) >= LEVELS.indexOf(min)

// Staff need at least `min` ('low' or 'high') on permission `key`; the owner
// always passes. Until now only the app checked these keys.
// own: at 'low', staff may act only on bookings that have a service of theirs.
function needLevel(key, min, { skip, own } = {}) {
  return async function permissionGuard(req, res, next) {
    try {
      const actor = await resolveRequestActor(req)
      req.actor = actor
      if (!actor.shopId || actor.isOwner) return next()
      if (skip && (await skip(req))) return next()
      const level = actor.employeeId ? await staffLevel(actor.employeeId, actor.shopId, key) : 'none'
      if (atLeast(level, min)) {
        if (!own || level === 'high') return next()
        const bookingId = await bookingIdOf(req)
        if (!bookingId || (await jobs.count({ where: { bookingId, employeeId: actor.employeeId } }))) return next()
        return deny(res, 'You can only change your own appointments.')
      }
      return deny(res, "You don't have access to do this.")
    } catch (err) {
      return next(err)
    }
  }
}

// Editing a team member's profile or hours: their own needs updateProfile
// 'high', anyone else's goes through teamEditGuard.
async function profileOrTeamEdit(req, res, next) {
  try {
    const actor = await resolveRequestActor(req)
    const employeeId = parseInt(req.body?.employeeId, 10)
    if (actor.shopId && !actor.isOwner && actor.employeeId && employeeId === actor.employeeId) {
      req.actor = actor
      if ((await staffLevel(actor.employeeId, actor.shopId, 'updateProfile')) === 'high') return next()
      return deny(res, "You don't have access to do this.")
    }
    return teamEditGuard(req, res, next)
  } catch (err) {
    return next(err)
  }
}

const ids = (v) => (Array.isArray(v) ? v : [v]).map((x) => parseInt(x, 10)).filter((x) => x > 0)

// Ids the app sends (booking, job, team member, shop) must belong to the
// caller's shop. A team member may be sent as the employee row id or their
// user id, so either is accepted.
async function sameShop(req, res, next) {
  try {
    const actor = await resolveRequestActor(req)
    if (!actor.shopId) return next()
    const shopId = actor.shopId
    const p = req.params || {}
    const b = req.body || {}

    const shops = ids([p.salonDetailId, p.salon, b.salonDetailId].filter((x) => x != null))
    if (shops.some((id) => id !== shopId)) return deny(res, 'This belongs to another shop.')

    const bookingId = await bookingIdOf(req)
    if (bookingId) {
      const row = await booking.findByPk(bookingId, { attributes: ['salonDetailId'] })
      if (row && row.salonDetailId !== shopId) return deny(res, 'This booking belongs to another shop.')
    }

    const members = [...new Set(ids([p.employee, p.employeeId, b.employeeId].filter((x) => x != null)))]
    if (members.length) {
      const found = await employee.findAll({
        where: {
          salonDetailId: shopId,
          [Op.or]: [{ id: { [Op.in]: members } }, { userId: { [Op.in]: members } }],
        },
        attributes: ['id', 'userId'],
      })
      const known = new Set(found.flatMap((e) => [e.id, e.userId]))
      if (members.some((id) => !known.has(id))) return deny(res, 'This team member is not in your shop.')
    }
    return next()
  } catch (err) {
    return next(err)
  }
}

module.exports = { sameShop, ownerOnly, teamEditGuard, needLevel, profileOrTeamEdit, staffLevel }
