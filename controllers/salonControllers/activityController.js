// The activity log screen (Step C). Owners see every branch they own; staff
// need the "activityLog" permission and see only the branches where they have
// it. Read-only: there is no way to change or delete an entry.
const { Op } = require('sequelize')
const db = require('../../models')
const { LABEL_OF, CATEGORIES } = require('../../helper/activityLog')
const { branchesFor } = require('../../helper/branchScope')
const { staffLevel } = require('../../middlewares/shopRole')

// MariaDB keeps JSON as text: hand the app an object.
function parseDetails(v) {
  if (v == null || typeof v === 'object') return v ?? null
  try { return JSON.parse(v) } catch (_) { return null }
}

const reply = (res, status, message, data = {}) => res.json({ status, message, data, error: '' })

// Branch ids this caller may read the log of.
async function readableSalonIds(req) {
  const branches = await branchesFor(req, req.branch?.staffUserId ?? null)
  if (!req.branch?.staffUserId) return branches.map((b) => b.salonId) // owner
  const out = []
  for (const b of branches) {
    if (b.employeeId && (await staffLevel(b.employeeId, b.salonId, 'activityLog')) !== 'none') out.push(b.salonId)
  }
  return out
}

/**
 * GET /salon/v1/activity?salonId=&category=&before=&limit=
 * Newest first, `limit` (max 50) at a time; pass the last id as `before` for
 * the next page.
 */
exports.list = async (req, res) => {
  const allowed = await readableSalonIds(req)
  if (!allowed.length) return reply(res, '0', "You don't have access to the activity log.")
  const asked = parseInt(req.query.salonId, 10)
  if (asked > 0 && !allowed.includes(asked)) return reply(res, '0', "You don't have access to this branch.")
  const where = { salonDetailId: asked > 0 ? asked : { [Op.in]: allowed } }
  if (CATEGORIES.includes(req.query.category)) where.category = req.query.category
  const before = parseInt(req.query.before, 10)
  if (before > 0) where.id = { [Op.lt]: before }
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 50)

  const rows = await db.activityLog.findAll({ where, order: [['id', 'DESC']], limit: limit + 1 })
  const page = rows.slice(0, limit)
  const names = await db.salonDetail.findAll({
    where: { id: [...new Set(page.map((r) => r.salonDetailId).filter(Boolean))] },
    attributes: ['id', 'salonName'],
  })
  const nameOf = new Map(names.map((n) => [n.id, n.salonName]))
  return reply(res, '1', 'Activity', {
    entries: page.map((r) => ({
      id: Number(r.id),
      at: r.createdAt,
      salonId: r.salonDetailId,
      branch: nameOf.get(r.salonDetailId) || '',
      who: r.actorName || 'Someone',
      role: r.actorRole,
      category: r.category,
      action: r.action,
      label: LABEL_OF[r.action] || r.action,
      result: r.result,
      message: r.message,
      details: parseDetails(r.details),
    })),
    nextBefore: rows.length > limit ? Number(page[page.length - 1].id) : null,
    branches: allowed.map((id) => ({ salonId: id })),
  })
}
