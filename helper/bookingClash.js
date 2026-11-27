/**
 * Server-side double-booking guard.
 *
 * A barber can have several employee rows (a chair renter's host row and own
 * row, later a barber in several branches). A new booking clashes when any of
 * those rows already has an active job that overlaps the new time on the same
 * day. Touching ends do not clash (10:00–10:35 then 10:35–11:10 is fine).
 */
const { Op } = require('sequelize')
const models = () => require('../models')

// Every employee row of the person behind this employee id.
async function sameBarberIds(employeeId) {
  const id = Number(employeeId)
  if (!(id > 0)) return []
  const row = await models().employee.findByPk(id, { attributes: ['id', 'userId', 'parentEmployeeId'] })
  if (!row) return [id]
  const or = [{ parentEmployeeId: id }]
  if (row.userId) or.push({ userId: row.userId })
  if (row.parentEmployeeId) or.push({ id: row.parentEmployeeId })
  const rows = await models().employee.findAll({ where: { [Op.or]: or, deleted: false }, attributes: ['id'] })
  return [...new Set([id, ...rows.map((r) => r.id)])]
}

/** True when start/end ("HH:mm" or "HH:mm:ss") overlap without just touching. */
function overlaps(aStart, aEnd, bStart, bEnd) {
  const m = (t) => { const [h, mi] = String(t).split(':').map(Number); return h * 60 + (mi || 0) }
  return m(aStart) < m(bEnd) && m(aEnd) > m(bStart)
}

/** The first active job of this barber that clashes with the given time, or null. */
async function barberClash({ employeeId, on, startTime, endTime }) {
  if (!employeeId || !on || !startTime || !endTime) return null
  const ids = await sameBarberIds(employeeId)
  if (!ids.length) return null
  return models().jobs.findOne({
    where: {
      employeeId: ids,
      on,
      status: 'assign',
      startTime: { [Op.lt]: endTime },
      endTime: { [Op.gt]: startTime },
    },
    attributes: ['id', 'bookingId', 'startTime', 'endTime', 'employeeId'],
  })
}

module.exports = { barberClash, sameBarberIds, overlaps }
