// Step C: branch access for a period starts and ends on its own. Run hourly
// (jobs/accessPeriodCron.js). Switching the row on or off is what the rest of
// Trim already understands: an inactive row can't open the branch (branchScope)
// and isn't offered to clients.
const { Op } = require('sequelize')
const db = require('../models')
const activity = require('./activityLog')

async function log(row, action, now) {
  const u = await db.user.findByPk(row.userId, { attributes: ['firstName', 'lastName'] })
  const name = `${u?.firstName || ''} ${u?.lastName || ''}`.trim()
  await activity.record({
    salonDetailId: row.salonDetailId,
    actorUserId: null,
    actorName: 'Trim (automatic)',
    actorRole: null,
    category: 'people',
    action,
    details: { person: name, until: row.accessUntil, at: now },
    result: 'ok',
  })
}

async function runAccessPeriods(now = new Date()) {
  const summary = { started: 0, ended: 0 }
  const starting = await db.employee.findAll({
    where: { accessState: 'scheduled', deleted: false, accessFrom: { [Op.lte]: now }, accessUntil: { [Op.gt]: now } },
  })
  for (const r of starting) {
    const [n] = await db.employee.update({ status: true, accessState: 'active' }, { where: { id: r.id, accessState: 'scheduled' } })
    if (n) { summary.started++; await log(r, 'team.access_started', now) }
  }
  const ending = await db.employee.findAll({
    where: { accessState: { [Op.in]: ['scheduled', 'active'] }, deleted: false, accessUntil: { [Op.lte]: now } },
  })
  for (const r of ending) {
    const [n] = await db.employee.update({ status: false, accessState: 'ended' }, { where: { id: r.id, accessState: r.accessState } })
    if (n) { summary.ended++; await log(r, 'team.access_ended', now) }
  }
  return summary
}

module.exports = { runAccessPeriods }
