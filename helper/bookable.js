// "Takes client bookings": whether clients can book this person in this
// branch (employees.bookable, one row per person per branch). The owner can be
// a working barber or just run the business; so can managers and receptionists.
//
// Turning it off is refused while the person has bookings coming up (move or
// cancel them first), and needs confirmLast when nobody else in the branch
// would be left taking bookings. Turning it on reports what is still missing
// (services, working hours) before clients can find them.
const { Op, QueryTypes } = require('sequelize')
const { DateTime } = require('luxon')
const db = require('../models')

const ukToday = () => DateTime.now().setZone('Europe/London').toISODate()
const reply = (res, status, message, data = {}) => res.json({ status, message, data, error: '' })

async function rowInBranch(employeeId, salonDetailId) {
  return db.employee.findOne({
    where: { id: Number(employeeId) || 0, salonDetailId, deleted: false },
    attributes: ['id', 'userId', 'salonDetailId', 'bookable', 'isOwner', 'role', 'isExternalEmployee'],
    include: { model: db.user, attributes: ['firstName', 'lastName'] },
  })
}

const nameOf = (e) => `${e?.user?.firstName || ''} ${e?.user?.lastName || ''}`.trim() || 'This team member'

/** Bookings of this person from today on that are still to happen. */
async function upcomingFor(employeeId) {
  return db.sequelize.query(
    `SELECT DISTINCT b.id AS bookingId, b.\`on\` AS day, LEFT(j.startTime, 5) AS time, b.status,
            COALESCE(NULLIF(TRIM(CONCAT(IFNULL(cu.firstName, ''), ' ', IFNULL(cu.lastName, ''))), ''),
                     NULLIF(TRIM(CONCAT(IFNULL(b.clientFirstName, ''), ' ', IFNULL(b.clientLastName, ''))), ''), 'Walk-in') AS client
       FROM jobs j
       JOIN bookings b ON b.id = j.bookingId
       LEFT JOIN users cu ON cu.id = b.customerId
      WHERE j.employeeId = :employeeId AND j.deletedAt IS NULL
        AND b.\`on\` >= :today AND b.status IN ('book', 'pending', 'requested')
      ORDER BY b.\`on\`, time
      LIMIT 50`,
    { replacements: { employeeId, today: ukToday() }, type: QueryTypes.SELECT },
  )
}

async function othersTakingBookings(e) {
  return db.employee.count({
    where: { salonDetailId: e.salonDetailId, deleted: false, status: true, bookable: true, isExternalEmployee: false, id: { [Op.ne]: e.id } },
  })
}

async function setupMissing(e) {
  const [services, hours] = await Promise.all([
    db.employeeService.count({ where: { employeeId: e.id } }),
    db.time.count({ where: { employeeId: e.id } }),
  ])
  return { services: services === 0, hours: hours === 0 }
}

/** GET /salon/v1/employee/bookable/:employee — this branch's row. */
async function show(req, res) {
  const actor = req.actor || req._actor
  const e = await rowInBranch(req.params.employee, actor?.shopId)
  if (!e) return reply(res, '0', 'This team member is not in your branch.')
  return reply(res, '1', 'Bookable', { employeeId: e.id, bookable: !!e.bookable, isOwner: !!e.isOwner, name: nameOf(e), ...(e.bookable ? { needsSetup: await setupMissing(e) } : {}) })
}

/** POST /salon/v1/employee/bookable { employeeId, bookable, confirmLast } */
async function change(req, res) {
  const actor = req.actor || req._actor
  const b = req.body || {}
  const e = await rowInBranch(b.employeeId, actor?.shopId)
  if (!e) return reply(res, '0', 'This team member is not in your branch.')
  if (e.isExternalEmployee) return reply(res, '0', 'A chair renter always takes their own bookings.')
  const on = !['false', '0', false, 0].includes(b.bookable)
  const name = nameOf(e)
  if (on === !!e.bookable) return reply(res, '1', 'No change', { bookable: on })

  if (!on) {
    const upcoming = await upcomingFor(e.id)
    if (upcoming.length) {
      return reply(res, '0', `${name} has ${upcoming.length} upcoming booking${upcoming.length === 1 ? '' : 's'}. Move them to someone else or cancel them first.`, {
        code: 'HAS_UPCOMING',
        bookings: upcoming.map((x) => ({ ...x, day: String(x.day).slice(0, 10) })),
      })
    }
    const confirmLast = ['true', '1', true, 1].includes(b.confirmLast)
    if (!confirmLast && (await othersTakingBookings(e)) === 0) {
      return reply(res, '0', `Nobody else in this branch takes bookings. If you turn this off, clients can't book this branch.`, { code: 'LAST_BOOKABLE' })
    }
    await e.update({ bookable: false })
    return reply(res, '1', `${name} no longer takes client bookings here.`, { bookable: false })
  }

  await e.update({ bookable: true })
  const needsSetup = await setupMissing(e)
  const missing = [needsSetup.services && 'services', needsSetup.hours && 'working hours'].filter(Boolean)
  return reply(res, '1', missing.length
    ? `${name} takes client bookings here again. Add ${missing.join(' and ')} so clients can book them.`
    : `${name} takes client bookings here again.`, { bookable: true, needsSetup })
}

module.exports = { show, change, upcomingFor, othersTakingBookings, setupMissing }
