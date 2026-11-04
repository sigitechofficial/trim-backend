/**
 * Chair renters moving shop. A renter keeps their own salonDetails row (and so
 * their customers, bookings, reviews and loyalty cards). A move only re-links
 * that row to a new host shop:
 *   - old host team row  → deleted + leftAt (kept for the old shop's history)
 *   - new host team row  → created with its wallet and rent terms
 *   - renter salon       → parentSalonId + addressDBId of the new host
 *   - renter owner row   → parentEmployeeId = new host team row
 * "Leave shop" with no new shop clears the parent and starts a grace period.
 * A renter pays for their own plan, so whether they are listed at all follows
 * their own subscription (helper/salonSubscriptionRule.js), never the host's,
 * and a renter never uses one of the host shop's team seats.
 */

const { Op } = require('sequelize')
const { isSalonRowActive } = require('./salonSubscriptionRule')
const { DateTime } = require('luxon')
const {
  sequelize,
  renterMove,
  salonDetail,
  employee,
  user,
  wallet,
  employeeWagesMethod,
  category,
  service,
  employeeService,
  booking,
  jobs,
  deviceToken,
  addressDBS,
  chairOffer,
  pushNotification,
} = require('../models')
const Throw = require('../utils/throwNotification')
const AppError = require('../utils/appError')
const { updateServiceCategoryIds } = require('../utils/updateServiceCategoryIds')
const barberMovedEmail = require('./barberMovedEmail')
const { calculateDueRents } = require('../utils/dueRents')

const GRACE_DAYS = Number(process.env.RENTER_GRACE_DAYS) || 14
const FREE_CANCEL_DAYS = 7
// "Leave shop": remind the renter this many days before the grace period ends (day 10 of 14).
const GRACE_REMINDER_DAYS = 4
// addressDBS.type of the "Between shops" address a renter gets after leaving
// with no new shop; the customer app hides the map for it.
const BETWEEN_SHOPS_ADDRESS = 'between_shops'
const RENT_CYCLES = ['Monthly', 'Daily', 'Weekly', 'Bi-weekly']
const OPEN_STATUSES = ['invited', 'accepted']
const UPCOMING_BOOKING_STATUSES = ['book', 'pending', 'requested']

const today = () => DateTime.now().setZone('Europe/London').toISODate()

// "16 Nov 2026" for a date shown in a notification.
function prettyDate(v) {
  const d = DateTime.fromISO(String(v || '').slice(0, 10))
  return d.isValid ? d.toFormat('d LLL yyyy') : String(v || '')
}
const plusDays = (isoDate, days) => DateTime.fromISO(isoDate).plus({ days }).toISODate()

async function tokensFor(userIds) {
  const ids = [...new Set(userIds.filter(Boolean))]
  if (!ids.length) return []
  const rows = await deviceToken.findAll({ where: { userId: ids }, attributes: ['tokenId'] })
  return rows.map((r) => r.tokenId).filter(Boolean)
}

// Each person gets the push on their phones and a line in their in-app
// notifications list, even when they have no phone signed in right now.
async function push(userIds, notification, data) {
  try {
    const payload = { type: 'renterMove', ...data }
    for (const id of [...new Set(userIds.filter(Boolean))]) {
      const tokens = await tokensFor([id])
      if (tokens.length) Throw(tokens, notification, payload, id)
      else await pushNotification.create({ at: new Date(), title: notification.title, body: notification.body, data: payload, userId: id })
    }
  } catch (err) {
    console.error('[renterMove] push failed:', err.message)
  }
}

async function hostSalonOf(userId) {
  const salon = await salonDetail.findOne({
    where: { userId, deleted: false },
    attributes: ['id', 'userId', 'salonName', 'teamSize', 'addressDBId', 'isExternalEmployee'],
  })
  if (!salon || salon.isExternalEmployee) throw new AppError('Only a shop owner can do this.', 200)
  return salon
}

async function renterSalonOf(userId) {
  const salon = await salonDetail.findOne({
    where: { userId, isExternalEmployee: true, deleted: false },
    attributes: ['id', 'userId', 'salonName', 'parentSalonId', 'renterGraceUntil'],
  })
  if (!salon) throw new AppError('Only a chair renter can do this.', 200)
  return salon
}

// The renter's current team row at their host shop, if any.
async function currentHostRow(renterUserId, hostSalonId) {
  if (!hostSalonId) return null
  return employee.findOne({
    where: { userId: renterUserId, salonDetailId: hostSalonId, isExternalEmployee: true, deleted: false },
    attributes: ['id', 'position'],
  })
}

function validMoveDate(moveDate) {
  const date = moveDate || today()
  if (!DateTime.fromISO(date).isValid) throw new AppError('Please choose a valid move date.', 200)
  if (date < today()) throw new AppError('The move date cannot be in the past.', 200)
  return date
}

// Only an agreed (accepted) move blocks another one. Open invites from other
// shops do not: the renter picks one, and accepting it closes the rest.
async function assertNoOpenMove(renterUserId) {
  const open = await renterMove.findOne({
    where: { renterUserId, status: 'accepted' },
    attributes: ['id'],
  })
  if (open) throw new AppError('This renter already has a move in progress.', 200)
}

// Once a renter has agreed a move, other shops' open invites are closed.
async function closeOtherInvites(renterUserId, keepMoveId) {
  try {
    const others = await renterMove.findAll({
      where: { renterUserId, status: 'invited', id: { [Op.ne]: keepMoveId } },
      attributes: ['id', 'toSalonId'],
    })
    for (const m of others) {
      await m.update({ status: 'cancelled' })
      const shop = m.toSalonId ? await salonDetail.findByPk(m.toSalonId, { attributes: ['userId'] }) : null
      push([shop?.userId], {
        title: 'Chair offer closed',
        body: 'This chair renter has agreed a move with another shop, so your invite has closed.',
      }, { moveId: m.id })
    }
  } catch (err) {
    console.error('[renterMove] closing other invites failed:', err.message)
  }
}

// New shop invites an existing Trim chair renter by email or phone.
async function invite({ hostUserId, email, countryCode, phoneNum, moveDate, rentAmount, rentCycle }) {
  const host = await hostSalonOf(hostUserId)
  const or = []
  if (email) or.push({ email })
  if (countryCode && phoneNum) or.push({ countryCode, phoneNum })
  if (!or.length) throw new AppError('Please enter the renter\'s email or phone number.', 200)
  if (rentCycle && !RENT_CYCLES.includes(rentCycle)) throw new AppError('Please choose a valid rent cycle.', 200)

  const renter = await user.findOne({
    where: { [Op.or]: or, isExternalEmployee: true, deleted: false },
    attributes: ['id', 'firstName', 'lastName'],
  })
  if (!renter) throw new AppError('No chair renter on Trim matches these details.', 200)

  const renterSalon = await renterSalonOf(renter.id)
  if (renterSalon.parentSalonId === host.id) throw new AppError('This renter already works at your shop.', 200)
  await assertNoOpenMove(renter.id)
  const already = await renterMove.findOne({
    where: { renterUserId: renter.id, toSalonId: host.id, status: 'invited' },
    attributes: ['id'],
  })
  if (already) throw new AppError('You have already invited this renter. Please wait for their answer.', 200)

  const fromRow = await currentHostRow(renter.id, renterSalon.parentSalonId)
  const move = await renterMove.create({
    renterUserId: renter.id,
    renterSalonId: renterSalon.id,
    fromSalonId: renterSalon.parentSalonId || null,
    toSalonId: host.id,
    fromEmployeeId: fromRow?.id || null,
    moveDate: validMoveDate(moveDate),
    status: 'invited',
    rentAmount: rentAmount ?? null,
    rentCycle: rentCycle || null,
    createdBy: hostUserId,
  })

  push([renter.id], {
    title: 'New chair offer',
    body: `${host.salonName} invited you to move your chair to their shop.`,
  }, { moveId: move.id })
  return move
}

// Renter accepts or declines an invite.
async function respond({ renterUserId, moveId, accept }) {
  const move = await renterMove.findOne({ where: { id: moveId, renterUserId } })
  if (!move) throw new AppError('Data not found', 404)
  if (move.status !== 'invited') throw new AppError('This offer has already been answered.', 200)

  if (accept) {
    await assertNoOpenMove(renterUserId)
    // The renter may have moved or left since the invite: re-read where they are now.
    const renterSalon = await renterSalonOf(renterUserId)
    const fromRow = await currentHostRow(renterUserId, renterSalon.parentSalonId)
    await move.update({
      status: 'accepted',
      fromSalonId: renterSalon.parentSalonId || null,
      fromEmployeeId: fromRow?.id || null,
    })
    await closeOtherInvites(renterUserId, move.id)
  } else {
    await move.update({ status: 'declined' })
  }

  const [toSalon, fromSalon, renter] = await Promise.all([
    salonDetail.findByPk(move.toSalonId, { attributes: ['userId'] }),
    move.fromSalonId ? salonDetail.findByPk(move.fromSalonId, { attributes: ['userId'] }) : null,
    user.findByPk(renterUserId, { attributes: ['firstName', 'lastName'] }),
  ])
  const name = `${renter?.firstName || ''} ${renter?.lastName || ''}`.trim()
  push([toSalon?.userId], {
    title: accept ? 'Chair offer accepted' : 'Chair offer declined',
    body: accept ? `${name} will join your shop on ${prettyDate(move.moveDate)}.` : `${name} declined your chair offer.`,
  }, { moveId: move.id })
  if (accept && fromSalon) {
    push([fromSalon.userId], {
      title: 'Chair renter leaving',
      body: `${name} is moving to another shop on ${prettyDate(move.moveDate)}. Please confirm their rent is settled.`,
    }, { moveId: move.id })
  }
  return move
}

// Chair market (helper/chairMarket.js): a deal both sides agreed becomes an
// accepted move straight away, on the agreed start date and rent.
async function createAcceptedMove({ renterUserId, toSalonId, moveDate, rentAmount, rentCycle, createdBy }) {
  const renterSalon = await renterSalonOf(renterUserId)
  if (renterSalon.parentSalonId === toSalonId) throw new AppError('This renter already works at this shop.', 200)
  if (rentCycle && !RENT_CYCLES.includes(rentCycle)) throw new AppError('Please choose a valid rent cycle.', 200)
  await assertNoOpenMove(renterUserId)
  const fromRow = await currentHostRow(renterUserId, renterSalon.parentSalonId)
  const move = await renterMove.create({
    renterUserId,
    renterSalonId: renterSalon.id,
    fromSalonId: renterSalon.parentSalonId || null,
    toSalonId,
    fromEmployeeId: fromRow?.id || null,
    moveDate: validMoveDate(moveDate),
    status: 'accepted',
    rentAmount: rentAmount ?? null,
    rentCycle: rentCycle || null,
    createdBy,
  })
  await closeOtherInvites(renterUserId, move.id)
  if (move.fromSalonId) {
    const [fromSalon, renter] = await Promise.all([
      salonDetail.findByPk(move.fromSalonId, { attributes: ['userId'] }),
      user.findByPk(renterUserId, { attributes: ['firstName', 'lastName'] }),
    ])
    const name = `${renter?.firstName || ''} ${renter?.lastName || ''}`.trim()
    push([fromSalon?.userId], {
      title: 'Chair renter leaving',
      body: `${name} is moving to another shop on ${prettyDate(move.moveDate)}. Please confirm their rent is settled.`,
    }, { moveId: move.id })
  }
  return move
}

// Renter leaves their host shop with no new shop yet.
async function leave({ renterUserId, moveDate }) {
  const renterSalon = await renterSalonOf(renterUserId)
  if (!renterSalon.parentSalonId) throw new AppError('You are not at a shop right now.', 200)
  await assertNoOpenMove(renterUserId)
  const fromRow = await currentHostRow(renterUserId, renterSalon.parentSalonId)

  const move = await renterMove.create({
    renterUserId,
    renterSalonId: renterSalon.id,
    fromSalonId: renterSalon.parentSalonId,
    toSalonId: null,
    fromEmployeeId: fromRow?.id || null,
    moveDate: validMoveDate(moveDate),
    status: 'accepted',
    createdBy: renterUserId,
  })
  await closeOtherInvites(renterUserId, move.id)

  const fromSalon = await salonDetail.findByPk(renterSalon.parentSalonId, { attributes: ['userId'] })
  push([fromSalon?.userId], {
    title: 'Chair renter leaving',
    body: `${renterSalon.salonName} is leaving your shop on ${prettyDate(move.moveDate)}. Please confirm their rent is settled.`,
  }, { moveId: move.id })
  return move
}

// A shop removes a chair renter from its team ("Delete" on the team screen).
// The renter pays for their own plan, so their account, clients and bookings
// stay: they become "between shops", exactly as if they had left today.
async function removeFromShop({ hostSalonId, renterUserId, createdBy }) {
  const renterSalon = await renterSalonOf(renterUserId)
  if (renterSalon.parentSalonId !== hostSalonId) {
    throw new AppError('This chair renter is no longer at your shop.', 200)
  }
  // A move they agreed with this or another shop gives way to the removal.
  const open = await renterMove.findAll({ where: { renterUserId, status: OPEN_STATUSES } })
  for (const m of open) {
    await m.update({ status: 'cancelled' })
    await cancelLinkedOffer(m.id)
  }
  const fromRow = await currentHostRow(renterUserId, hostSalonId)
  const move = await renterMove.create({
    renterUserId,
    renterSalonId: renterSalon.id,
    fromSalonId: hostSalonId,
    toSalonId: null,
    fromEmployeeId: fromRow?.id || null,
    moveDate: today(),
    status: 'accepted',
    rentSettledAt: new Date(),
    createdBy,
  })
  return runMove(move.id)
}

// Old shop confirms the renter owes nothing; the move can then run.
async function settleRent({ hostUserId, moveId }) {
  const host = await hostSalonOf(hostUserId)
  const move = await renterMove.findOne({ where: { id: moveId, fromSalonId: host.id } })
  if (!move) throw new AppError('Data not found', 404)
  if (!OPEN_STATUSES.includes(move.status)) throw new AppError('This move is already closed.', 200)
  await move.update({ rentSettledAt: new Date() })
  return move
}

// A chair market offer whose move was cancelled shows as cancelled too.
async function cancelLinkedOffer(moveId) {
  try {
    if (chairOffer) await chairOffer.update({ status: 'cancelled', closedAt: new Date() }, { where: { moveId, status: 'accepted' } })
  } catch (err) {
    console.error('[renterMove] cancelling linked offer failed:', err.message)
  }
}

// Renter or either shop cancels a move that has not run yet.
async function cancel({ userId, moveId }) {
  const move = await renterMove.findByPk(moveId)
  if (!move) throw new AppError('Data not found', 404)
  const shops = await salonDetail.findAll({
    where: { id: [move.fromSalonId, move.toSalonId].filter(Boolean) },
    attributes: ['userId'],
  })
  const allowed = [move.renterUserId, ...shops.map((s) => s.userId)]
  if (!allowed.includes(userId)) throw new AppError('Data not found', 404)
  if (!OPEN_STATUSES.includes(move.status)) throw new AppError('This move is already closed.', 200)
  await move.update({ status: 'cancelled' })
  await cancelLinkedOffer(move.id)
  push(allowed.filter((id) => id !== userId), {
    title: 'Chair move cancelled',
    body: `The chair move planned for ${prettyDate(move.moveDate)} was cancelled.`,
  }, { moveId: move.id })
  return move
}

const MOVE_INCLUDE = [
  { model: salonDetail, as: 'renterSalon', attributes: ['id', 'salonName', 'coverImage'] },
  { model: salonDetail, as: 'fromSalon', attributes: ['id', 'salonName'] },
  { model: salonDetail, as: 'toSalon', attributes: ['id', 'salonName', 'coverImage'] },
  { model: user, as: 'renter', attributes: ['id', 'firstName', 'lastName', 'image'] },
]

// Moves the signed-in user is part of: as the renter, or as either shop. Each
// move gets `role` ('renter' | 'from' | 'to') so the app knows which actions to show.
async function listFor(userId) {
  const ownSalons = await salonDetail.findAll({ where: { userId }, attributes: ['id'] })
  const ids = ownSalons.map((s) => s.id)
  const moves = await renterMove.findAll({
    where: {
      [Op.or]: [
        { renterUserId: userId },
        ...(ids.length ? [{ fromSalonId: ids }, { toSalonId: ids }] : []),
      ],
    },
    include: MOVE_INCLUDE,
    order: [['createdAt', 'DESC']],
    limit: 50,
  })
  const out = moves.map((m) => {
    const role = m.renterUserId === userId ? 'renter' : ids.includes(m.fromSalonId) ? 'from' : 'to'
    return { ...(m.toJSON ? m.toJSON() : m), role }
  })
  // The old shop sees what the renter still owes before confirming the rent.
  await Promise.all(out.map(async (m) => {
    if (m.role === 'from' && OPEN_STATUSES.includes(m.status)) m.rentDue = await rentDueFor(m.fromEmployeeId)
  }))
  return out
}

// Rent the renter owes their current host shop today (same sum as the shop's
// "Rent collection" screen), or null when they have no rent terms there.
async function rentDueFor(hostEmployeeId) {
  if (!hostEmployeeId) return null
  try {
    const wages = await employeeWagesMethod.findOne({
      where: { employeeId: hostEmployeeId, wagesMethodId: 3 },
      attributes: ['prevSalaryDate', 'createdAt', 'cycle', 'value'],
    })
    if (!wages) return null
    const due = calculateDueRents({ employeeWagesMethod: wages })
    return { amount: Number(due.rentDue) || 0, cycles: due.numberCycle, cycle: due.cycle }
  } catch (err) {
    console.error('[renterMove] rentDueFor failed:', err.message)
    return null
  }
}

// Where a renter is now, for the app's header: their shop, or the grace date.
async function renterStatus(userId) {
  const salon = await salonDetail.findOne({
    where: { userId, isExternalEmployee: true, deleted: false },
    attributes: ['id', 'parentSalonId', 'renterGraceUntil'],
  })
  if (!salon) return null
  const host = salon.parentSalonId
    ? await salonDetail.findByPk(salon.parentSalonId, { attributes: ['id', 'salonName'] })
    : null
  return { shopId: host?.id || null, shopName: host?.salonName || null, graceUntil: salon.renterGraceUntil || null }
}

// A renter with no services of their own books from the host's menu. Before the
// parent changes, copy that menu into the renter salon and point upcoming
// bookings' jobs at the copies, so they stay valid at the new shop.
async function copyHostMenu(renterSalonId, fromSalonId, ownerEmployeeId, fromDate, transaction) {
  const own = await service.count({ where: { salonDetailId: renterSalonId }, transaction })
  if (own > 0 || !fromSalonId) return 0

  const hostServices = await service.findAll({ where: { salonDetailId: fromSalonId }, transaction })
  if (!hostServices.length) return 0
  const oldCategories = await category.findAll({
    where: { id: [...new Set(hostServices.map((s) => s.categoryId))] },
    attributes: ['id', 'categoryName', 'color', 'description'],
    transaction,
  })
  const newCategories = await category.bulkCreate(
    oldCategories.map((c) => ({ categoryName: c.categoryName, color: c.color, description: c.description, salonDetailId: renterSalonId })),
    { transaction },
  )
  const mapped = updateServiceCategoryIds({
    newCategories,
    oldCategories,
    serviceList: JSON.parse(JSON.stringify(hostServices)),
    salonDetailId: renterSalonId,
  })
  // Skip any service whose category could not be matched (the util returns it unchanged).
  const oldIds = []
  const copies = []
  mapped.forEach((row, i) => {
    if (row.salonDetailId !== renterSalonId || row.id) return
    const { createdAt, updatedAt, ...rest } = row
    oldIds.push(hostServices[i].id)
    copies.push(rest)
  })
  if (!copies.length) return 0
  const newServices = await service.bulkCreate(copies, { transaction })

  if (ownerEmployeeId) {
    await employeeService.bulkCreate(
      newServices.map((s) => ({ serviceId: s.id, employeeId: ownerEmployeeId, salonDetailId: renterSalonId, status: true })),
      { transaction },
    )
  }

  const upcoming = await booking.findAll({
    where: { salonDetailId: renterSalonId, on: { [Op.gte]: fromDate }, status: UPCOMING_BOOKING_STATUSES },
    attributes: ['id'],
    transaction,
  })
  if (upcoming.length) {
    for (let i = 0; i < oldIds.length; i++) {
      await jobs.update(
        { serviceId: newServices[i].id },
        { where: { bookingId: upcoming.map((b) => b.id), serviceId: oldIds[i] }, transaction },
      )
    }
  }
  return newServices.length
}

// Runs one accepted move whose date has come. Returns 'completed', 'waiting' or 'failed'.
async function runMove(moveId) {
  let result = 'waiting'
  let notify = null
  try {
    await sequelize.transaction(async (t) => {
      const move = await renterMove.findByPk(moveId, { transaction: t, lock: t.LOCK.UPDATE })
      if (!move || move.status !== 'accepted' || move.moveDate > today()) return
      // The old shop must confirm the rent first (not needed when joining from the grace period).
      if (move.fromSalonId && !move.rentSettledAt) return

      const renterSalon = await salonDetail.findByPk(move.renterSalonId, { transaction: t })
      const owner = await employee.findOne({
        where: { salonDetailId: move.renterSalonId, isOwner: true },
        transaction: t,
      })
      const toSalon = move.toSalonId
        ? await salonDetail.findByPk(move.toSalonId, { attributes: ['id', 'userId', 'salonName', 'teamSize', 'addressDBId'], transaction: t })
        : null
      if (move.toSalonId && !toSalon) {
        await move.update({ status: 'failed', failReason: 'The new shop is no longer on Trim.' }, { transaction: t })
        result = 'failed'
        return
      }

      const oldRow = move.fromEmployeeId ? await employee.findByPk(move.fromEmployeeId, { transaction: t }) : null
      if (oldRow && !oldRow.deleted) {
        await oldRow.update({ deleted: true, status: false, leftAt: new Date() }, { transaction: t })
      }

      await copyHostMenu(move.renterSalonId, move.fromSalonId, owner?.id, move.moveDate, t)

      // Bookings before the move keep the address the client went to.
      if (renterSalon.addressDBId) {
        await booking.update(
          { visitAddressId: renterSalon.addressDBId },
          { where: { salonDetailId: renterSalon.id, visitAddressId: null, on: { [Op.lt]: move.moveDate } }, transaction: t },
        )
      }

      let toEmployeeId = null
      if (toSalon) {
        const newRow = await employee.create({
          position: oldRow?.position || 'Chair renter',
          userId: move.renterUserId,
          salonDetailId: toSalon.id,
          isExternalEmployee: true,
        }, { transaction: t })
        toEmployeeId = newRow.id
        await wallet.create({ employeeId: newRow.id }, { transaction: t })
        if (move.rentAmount !== null && move.rentAmount !== undefined) {
          await employeeWagesMethod.create({
            value: move.rentAmount,
            wagesMethodId: 3,
            employeeId: newRow.id,
            cycle: move.rentCycle,
          }, { transaction: t })
        }
        await renterSalon.update({
          parentSalonId: toSalon.id,
          addressDBId: toSalon.addressDBId,
          renterGraceUntil: null,
        }, { transaction: t })
      } else {
        // No new shop: customers see "Between shops" instead of the old shop's
        // address. lat/lng stay, so the renter still shows up in the same area.
        const oldAddress = renterSalon.addressDBId
          ? await addressDBS.findByPk(renterSalon.addressDBId, { transaction: t })
          : null
        const placeholder = await addressDBS.create({
          title: 'Between shops',
          type: BETWEEN_SHOPS_ADDRESS,
          streetAddress: 'Between shops',
          city: 'new address coming soon',
          country: oldAddress?.country ?? null,
          lat: oldAddress?.lat ?? null,
          lng: oldAddress?.lng ?? null,
        }, { transaction: t })
        await renterSalon.update({
          parentSalonId: null,
          addressDBId: placeholder.id,
          renterGraceUntil: plusDays(today(), GRACE_DAYS),
        }, { transaction: t })
      }
      if (owner) await owner.update({ parentEmployeeId: toEmployeeId }, { transaction: t })

      await move.update({ status: 'completed', toEmployeeId, completedAt: new Date() }, { transaction: t })
      result = 'completed'
      notify = { move, renterSalon, toSalon }
    })
  } catch (err) {
    console.error(`[renterMove] move ${moveId} failed:`, err.message)
    await renterMove.update({ status: 'failed', failReason: String(err.message).slice(0, 255) }, { where: { id: moveId, status: 'accepted' } })
    return 'failed'
  }

  if (notify) {
    await declinePendingRequests(notify.move, notify.toSalon)
    notifyMoved(notify)
  }
  return result
}

// Booking requests the renter had not answered, dated on or after the move:
// decline them (any held deposit is released) so no customer waits on a request
// made for the old address.
async function declinePendingRequests(move, toSalon) {
  const reasonText = toSalon
    ? `Your barber has moved to ${toSalon.salonName}. Please book again if the new address suits you`
    : 'Your barber has left this shop'
  let declined = 0
  try {
    // Required here so the unit tests can load this file without Stripe or sockets.
    const Stripe = require('../controllers/stripe')
    const { socketForCalendar } = require('../controllers/eventDrivenCommunication/calendarView')
    const { requestDeclined } = require('../controllers/eventDrivenCommunication/appointmentRequest')
    const pending = await booking.findAll({
      where: { salonDetailId: move.renterSalonId, status: 'requested', on: { [Op.gte]: move.moveDate } },
      attributes: ['id', 'initialPaymentIntend'],
      include: [{ model: salonDetail, attributes: ['connectAccountId'] }],
    })
    for (const b of pending) {
      const [claimed] = await booking.update(
        {
          status: 'cancel',
          requestOutcome: 'declined',
          respondedAt: new Date(),
          respondedByName: 'Trim (barber moved)',
          actualCapturedAmount: 0,
          cancellationCharges: 0,
          total: 0,
          tip: 0,
        },
        { where: { id: b.id, status: 'requested' } },
      )
      if (!claimed) continue
      if (b.initialPaymentIntend) {
        await Stripe.releaseHeldPayment(b.initialPaymentIntend, b.salonDetail?.connectAccountId)
      }
      await jobs.update({ status: 'cancel' }, { where: { bookingId: b.id } })
      socketForCalendar({ appointmentId: b.id, type: 'finish', status: 'cancel' })
      requestDeclined(b.id, reasonText)
      declined++
    }
  } catch (err) {
    console.error(`[renterMove] declining requests for move ${move.id} failed:`, err.message)
  }
  return declined
}

async function notifyMoved({ move, renterSalon, toSalon }) {
  const fromSalon = move.fromSalonId ? await salonDetail.findByPk(move.fromSalonId, { attributes: ['userId', 'salonName'] }) : null
  if (toSalon) {
    push([move.renterUserId], { title: 'Move complete', body: `You are now at ${toSalon.salonName}.` }, { moveId: move.id })
    push([toSalon.userId], { title: 'New chair renter', body: `${renterSalon.salonName} has joined your shop.` }, { moveId: move.id })
  } else {
    push([move.renterUserId], {
      title: 'You have left the shop',
      body: `Customers can book you until ${prettyDate(renterSalon.renterGraceUntil)}. Join a new shop before then to keep taking bookings.`,
    }, { moveId: move.id })
  }
  push([fromSalon?.userId], { title: 'Chair renter left', body: `${renterSalon.salonName} has left your shop.` }, { moveId: move.id })

  // Customers with upcoming bookings hear about the new address (or that there
  // is none yet), and that they may cancel free of charge.
  const upcoming = await booking.findAll({
    where: { salonDetailId: renterSalon.id, on: { [Op.gte]: move.moveDate }, status: UPCOMING_BOOKING_STATUSES },
    attributes: ['id', 'customerId', 'on', 'startTime'],
    order: [['on', 'ASC'], ['startTime', 'ASC']],
  })
  const byCustomer = new Map()
  for (const b of upcoming) {
    if (!b.customerId) continue
    if (!byCustomer.has(b.customerId)) byCustomer.set(b.customerId, [])
    byCustomer.get(b.customerId).push(b)
  }
  if (!byCustomer.size) return

  const [address, customers] = await Promise.all([
    toSalon?.addressDBId ? addressDBS.findByPk(toSalon.addressDBId) : null,
    user.findAll({ where: { id: [...byCustomer.keys()] }, attributes: ['id', 'email', 'firstName'] }),
  ])
  const addressText = addressLine(address)
  const mapsUrl = address?.lat && address?.lng
    ? `https://www.google.com/maps/search/?api=1&query=${address.lat},${address.lng}`
    : addressText ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}` : null
  const freeCancelUntil = DateTime.fromISO(plusDays(move.moveDate, FREE_CANCEL_DAYS)).toFormat('d LLL yyyy')

  for (const customer of customers) {
    push([customer.id], toSalon ? {
      title: 'Your barber has moved',
      body: `${renterSalon.salonName} is now at ${toSalon.salonName}. Your booking will take place at the new address.`,
    } : {
      title: 'Your barber has left their shop',
      body: `${renterSalon.salonName} has left ${fromSalon?.salonName || 'their shop'} and hasn't joined a new shop yet. You can cancel your booking free of charge until ${freeCancelUntil}.`,
    // Tapping it opens the client's next booking there (with Cancel for free).
    }, { salonId: String(renterSalon.id), moveId: move.id, appointment: String(byCustomer.get(customer.id)[0].id) })
    if (!customer.email) continue
    try {
      barberMovedEmail({
        email: customer.email,
        firstName: customer.firstName || 'there',
        barberName: renterSalon.salonName,
        fromShopName: fromSalon?.salonName || null,
        shopName: toSalon?.salonName || null,
        address: addressText,
        mapsUrl,
        bookingDates: byCustomer.get(customer.id).map(bookingWhen),
        freeCancelUntil,
      })
    } catch (err) {
      console.error('[renterMove] moved email failed:', err.message)
    }
  }
}

function addressLine(a) {
  if (!a) return ''
  return [a.building, a.streetAddress, a.district, a.city, a.postalCode, a.country]
    .map((x) => String(x ?? '').trim())
    .filter(Boolean)
    .join(', ')
}

function bookingWhen(b) {
  const day = DateTime.fromISO(String(b.on)).toFormat('ccc d LLL')
  return b.startTime ? `${day}, ${String(b.startTime).slice(0, 5)}` : day
}

// Renters who left with no new shop: a reminder GRACE_REMINDER_DAYS before the
// grace period ends, and a notice once it has ended (their profile stays, but
// new bookings stop until they join a shop).
async function runGraceNotices() {
  const sent = { reminders: 0, ended: 0 }
  const salons = await salonDetail.findAll({
    where: {
      isExternalEmployee: true,
      deleted: false,
      parentSalonId: null,
      renterGraceUntil: { [Op.ne]: null, [Op.lte]: plusDays(today(), GRACE_REMINDER_DAYS) },
    },
    attributes: ['id', 'userId', 'renterGraceUntil'],
    limit: 200,
  })
  for (const s of salons) {
    try {
      const move = await renterMove.findOne({
        where: { renterSalonId: s.id, status: 'completed', toSalonId: null },
        order: [['completedAt', 'DESC']],
      })
      if (!move) continue
      const until = DateTime.fromISO(String(s.renterGraceUntil)).toFormat('d LLL')
      if (s.renterGraceUntil < today()) {
        if (move.graceEndedAt) continue
        // Claim the notice so a second server running this job does not send it too.
        const [claimed] = await renterMove.update({ graceEndedAt: new Date() }, { where: { id: move.id, graceEndedAt: null } })
        if (!claimed) continue
        push([s.userId], {
          title: 'New bookings are paused',
          body: 'Your 14 days between shops have ended, so customers cannot book you until you join a shop. Your profile and reviews stay. Accept a chair offer to take bookings again.',
        }, { moveId: move.id })
        sent.ended++
      } else if (!move.graceReminderAt) {
        const [claimed] = await renterMove.update({ graceReminderAt: new Date() }, { where: { id: move.id, graceReminderAt: null } })
        if (!claimed) continue
        push([s.userId], {
          title: 'Join a shop to keep taking bookings',
          body: `Customers can book you until ${prettyDate(until)}. Accept a chair offer before then to keep taking bookings.`,
        }, { moveId: move.id })
        sent.reminders++
      }
    } catch (err) {
      console.error(`[renterMove] grace notice for salon ${s.id} failed:`, err.message)
    }
  }
  return sent
}

// A customer whose booking was made before their barber moved can cancel it
// free of charge until FREE_CANCEL_DAYS after the move date.
async function freeCancelAfterMove(bookingId) {
  try {
    const row = await booking.findByPk(bookingId, { attributes: ['salonDetailId', 'on', 'createdAt'] })
    if (!row?.on) return false
    const move = await renterMove.findOne({
      where: {
        renterSalonId: row.salonDetailId,
        status: 'completed',
        moveDate: { [Op.lte]: row.on, [Op.gte]: plusDays(today(), -FREE_CANCEL_DAYS) },
        completedAt: { [Op.gt]: row.createdAt },
      },
      attributes: ['id'],
    })
    return !!move
  } catch (err) {
    console.error('[renterMove] freeCancelAfterMove failed:', err.message)
    return false
  }
}

// ---- Admin panel ----

// Every move (newest first) and the renters currently between shops.
async function adminOverview() {
  const [moves, between] = await Promise.all([
    renterMove.findAll({ include: MOVE_INCLUDE, order: [['createdAt', 'DESC']], limit: 500 }),
    salonDetail.findAll({
      where: { isExternalEmployee: true, deleted: false, parentSalonId: null, renterGraceUntil: { [Op.ne]: null } },
      attributes: ['id', 'userId', 'salonName', 'renterGraceUntil', 'registrationExpiryDate', 'subscriptionLatestPaymentStatus'],
      include: [{ model: user, attributes: ['firstName', 'lastName', 'email', 'countryCode', 'phoneNum'] }],
      order: [['renterGraceUntil', 'ASC']],
    }),
  ])
  const day = today()
  const list = moves.map((m) => m.toJSON())
  await Promise.all(list.map(async (m) => {
    if (OPEN_STATUSES.includes(m.status) && m.fromSalonId) m.rentDue = await rentDueFor(m.fromEmployeeId)
  }))
  return {
    moves: list,
    betweenShops: between.map((s) => ({
      ...s.toJSON(),
      graceActive: String(s.renterGraceUntil) >= day,
      // Their own plan decides whether customers can see them at all.
      planActive: isSalonRowActive(s, day),
    })),
    graceDays: GRACE_DAYS,
  }
}

async function adminCancel(moveId) {
  const move = await renterMove.findByPk(moveId)
  if (!move) throw new AppError('Data not found', 404)
  if (!OPEN_STATUSES.includes(move.status)) throw new AppError('This move is already closed.', 200)
  await move.update({ status: 'cancelled' })
  await cancelLinkedOffer(move.id)
  const shops = await salonDetail.findAll({
    where: { id: [move.fromSalonId, move.toSalonId].filter(Boolean) },
    attributes: ['userId'],
  })
  push([move.renterUserId, ...shops.map((x) => x.userId)], {
    title: 'Chair move cancelled',
    body: `The chair move planned for ${prettyDate(move.moveDate)} was cancelled by Trim support.`,
  }, { moveId: move.id })
  return move
}

// Admin confirms the rent for a move that is stuck waiting on the old shop.
async function adminSettleRent(moveId) {
  const move = await renterMove.findByPk(moveId)
  if (!move) throw new AppError('Data not found', 404)
  if (!OPEN_STATUSES.includes(move.status)) throw new AppError('This move is already closed.', 200)
  await move.update({ rentSettledAt: new Date() })
  return move
}

// A failed move goes back to "accepted" and runs again now if its date has come.
async function adminRetry(moveId) {
  const move = await renterMove.findByPk(moveId)
  if (!move) throw new AppError('Data not found', 404)
  if (move.status !== 'failed') throw new AppError('Only a failed move can be retried.', 200)
  // The renter may have moved or left since this move failed: running it now
  // would put them in the wrong shop.
  const renterSalon = await salonDetail.findByPk(move.renterSalonId, { attributes: ['parentSalonId'] })
  if ((renterSalon?.parentSalonId ?? null) !== (move.fromSalonId ?? null)) {
    throw new AppError('The renter is no longer at the shop this move started from, so it cannot be retried. Please set up a new move.', 200)
  }
  await assertNoOpenMove(move.renterUserId)
  await move.update({ status: 'accepted', failReason: null })
  const result = await runMove(move.id)
  return { move: await renterMove.findByPk(move.id), result }
}

// Customer booking lists: a booking from before its barber moved shows the
// address the client went to (booking.visitAddressId) instead of the salon's
// current one. Works on plain objects with salonDetail.addressDB.
async function applyVisitAddresses(bookings) {
  const list = (Array.isArray(bookings) ? bookings : [bookings]).filter((b) => b?.visitAddressId && b.salonDetail)
  if (!list.length) return
  try {
    const rows = await addressDBS.findAll({ where: { id: [...new Set(list.map((b) => b.visitAddressId))] } })
    const byId = new Map(rows.map((r) => [r.id, r.toJSON ? r.toJSON() : r]))
    for (const b of list) {
      const visit = byId.get(b.visitAddressId)
      if (!visit) continue
      const current = b.salonDetail.addressDB || {}
      // Same keys the caller asked for, filled from the visit address.
      const keys = Object.keys(current).length ? Object.keys(current) : Object.keys(visit)
      b.salonDetail.addressDB = Object.fromEntries(keys.map((k) => [k, visit[k] ?? null]))
    }
  } catch (err) {
    console.error('[renterMove] applyVisitAddresses failed:', err.message)
  }
}

// How long the customer app shows "This barber has moved" after a move.
const RECENT_MOVE_DAYS = 30

// The renter's latest move within RECENT_MOVE_DAYS (to a new shop, or leaving
// with none: toShopName null), for the customer app's "This barber has moved"
// card. Null when there is none.
async function recentMove(renterSalonId) {
  try {
    const move = await renterMove.findOne({
      where: {
        renterSalonId,
        status: 'completed',
        moveDate: { [Op.gte]: plusDays(today(), -RECENT_MOVE_DAYS) },
      },
      include: [
        { model: salonDetail, as: 'fromSalon', attributes: ['salonName'] },
        { model: salonDetail, as: 'toSalon', attributes: ['salonName'] },
      ],
      order: [['completedAt', 'DESC']],
    })
    if (!move) return null
    return {
      fromShopName: move.fromSalon?.salonName || null,
      toShopName: move.toSalon?.salonName || null,
      moveDate: move.moveDate,
      freeCancelUntil: plusDays(move.moveDate, FREE_CANCEL_DAYS),
    }
  } catch (err) {
    console.error('[renterMove] recentMove failed:', err.message)
    return null
  }
}

// A chair renter between shops takes new bookings only during the grace period
// after leaving. After that their profile stays (they still pay for their own
// plan) but there is no address to book at until they join a shop.
async function takingBookings(salonDetailId) {
  const s = await salonDetail.findByPk(salonDetailId, {
    attributes: ['isExternalEmployee', 'parentSalonId', 'renterGraceUntil'],
  })
  if (!s?.isExternalEmployee || s.parentSalonId) return true
  return !!s.renterGraceUntil && String(s.renterGraceUntil) >= today()
}

// Renters on the free days before their own plan (status 'renter_switch', set by
// sql/renter_own_subscription.sql): a reminder at 14, 7 and 1 days left, and a
// notice once the free days have ended. Each goes out once.
const PLAN_REMINDER_DAYS = [1, 7, 14]

async function runRenterPlanReminders() {
  let sent = 0
  const salons = await salonDetail.findAll({
    where: {
      isExternalEmployee: true,
      deleted: false,
      subscriptionLatestPaymentStatus: 'renter_switch',
      registrationExpiryDate: { [Op.ne]: null, [Op.lte]: plusDays(today(), Math.max(...PLAN_REMINDER_DAYS)) },
    },
    attributes: ['id', 'userId', 'registrationExpiryDate', 'renterPlanReminderDays'],
    limit: 500,
  })
  for (const s of salons) {
    try {
      const until = String(s.registrationExpiryDate).slice(0, 10)
      const daysLeft = Math.round(DateTime.fromISO(until).diff(DateTime.fromISO(today()), 'days').days)
      const step = daysLeft < 0 ? 0 : PLAN_REMINDER_DAYS.find((d) => daysLeft <= d)
      if (step === undefined) continue
      if (s.renterPlanReminderDays !== null && s.renterPlanReminderDays !== undefined && s.renterPlanReminderDays <= step) continue
      // Claim this reminder so a second server running the job does not send it too.
      const [claimed] = await salonDetail.update(
        { renterPlanReminderDays: step },
        { where: { id: s.id, renterPlanReminderDays: s.renterPlanReminderDays ?? null } },
      )
      if (!claimed) continue
      const day = DateTime.fromISO(until).toFormat('d LLL')
      await push([s.userId], step === 0
        ? {
            title: 'Your free days have ended',
            body: 'Choose your chair renter plan so clients can find and book you again.',
          }
        : {
            title: 'Choose your Trim plan',
            body: `You can use Trim free until ${prettyDate(day)}. Choose your chair renter plan before then to stay visible to clients.`,
          }, { type: 'renterPlan' })
      sent++
    } catch (err) {
      console.error(`[renterMove] plan reminder for salon ${s.id} failed:`, err.message)
    }
  }
  return sent
}

// Called by jobs/renterMoveCron.js: runs accepted moves whose date has come and
// sends grace-period notices.
async function runDue() {
  const due = await renterMove.findAll({
    where: { status: 'accepted', moveDate: { [Op.lte]: today() } },
    attributes: ['id'],
    limit: 100,
  })
  const summary = { completed: 0, waiting: 0, failed: 0 }
  for (const m of due) summary[await runMove(m.id)]++
  const grace = await runGraceNotices()
  summary.graceReminders = grace.reminders
  summary.graceEnded = grace.ended
  summary.planReminders = await runRenterPlanReminders()
  return summary
}

module.exports = { invite, respond, leave, removeFromShop, createAcceptedMove, RENT_CYCLES, settleRent, cancel, listFor, renterStatus, runDue, runMove, runGraceNotices, runRenterPlanReminders, freeCancelAfterMove, recentMove, takingBookings, applyVisitAddresses, adminOverview, adminCancel, adminSettleRent, adminRetry, GRACE_DAYS }
