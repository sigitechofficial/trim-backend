// Approvals (Step C): the owner's list to approve or decline, a team member's
// own requests, and the owner's rules per branch.
const { Op } = require('sequelize')
const db = require('../../models')
const approvals = require('../../helper/approvals')

const reply = (res, status, message, data = {}) => res.json({ status, message, data, error: '' })

const isOwnerSession = (req) => !!req.branch?.isOwner && !req.branch?.staffUserId
const parse = (v) => {
  if (v == null || typeof v === 'object') return v ?? null
  try { return JSON.parse(v) } catch (_) { return null }
}

async function view(rows) {
  const names = await db.salonDetail.findAll({
    where: { id: [...new Set(rows.map((r) => r.salonDetailId))] },
    attributes: ['id', 'salonName'],
  })
  const nameOf = new Map(names.map((n) => [n.id, n.salonName]))
  return rows.map((r) => ({
    id: r.id,
    salonId: r.salonDetailId,
    branch: nameOf.get(r.salonDetailId) || '',
    rule: r.rule,
    ruleLabel: approvals.RULES[r.rule]?.label || r.rule,
    summary: r.summary,
    before: parse(r.before),
    note: r.note,
    requester: r.requesterName || 'A team member',
    requesterRole: r.requesterRole,
    status: r.status,
    reason: r.reason,
    decidedBy: r.decidedByName,
    decidedAt: r.decidedAt,
    resultMessage: r.resultMessage,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt,
  }))
}

// The rows this caller may see: an owner sees their branches' requests, a
// team member their own.
function scopeWhere(req) {
  if (isOwnerSession(req)) return { salonDetailId: { [Op.in]: req.branch.allowedSalonIds || [] } }
  return { requestedByUserId: req.branch?.staffUserId || -1 }
}

/** GET /salon/v1/approvals?state=pending|done&salonId= */
exports.list = async (req, res) => {
  const where = scopeWhere(req)
  const salonId = parseInt(req.query.salonId, 10)
  if (salonId > 0) {
    if (isOwnerSession(req) && !req.branch.allowedSalonIds.includes(salonId)) {
      return reply(res, '0', "You don't have access to this branch.")
    }
    where.salonDetailId = salonId
  }
  where.status = req.query.state === 'done' ? { [Op.notIn]: ['pending', 'approving'] } : { [Op.in]: ['pending', 'approving'] }
  const rows = await db.approvalRequest.findAll({ where, order: [['id', 'DESC']], limit: 100 })
  return reply(res, '1', 'Approvals', { isApprover: isOwnerSession(req), requests: await view(rows) })
}

/** GET /salon/v1/approvals/count: pending requests waiting for this caller. */
exports.count = async (req, res) => {
  const pending = await db.approvalRequest.count({ where: { ...scopeWhere(req), status: 'pending' } })
  return reply(res, '1', 'Approvals', { pending, isApprover: isOwnerSession(req) })
}

async function ownersRow(req, res) {
  if (!isOwnerSession(req)) {
    reply(res, '0', 'Only the shop owner can answer requests.')
    return null
  }
  const row = await db.approvalRequest.findByPk(parseInt(req.params.id, 10))
  if (!row || !req.branch.allowedSalonIds.includes(row.salonDetailId)) {
    reply(res, '0', 'Request not found.')
    return null
  }
  return row
}

async function approverOf(req) {
  const u = await db.user.findByPk(req.user.id, { attributes: ['id', 'firstName', 'lastName'] })
  return { id: req.user.id, name: `${u?.firstName || ''} ${u?.lastName || ''}`.trim() }
}

const answered = (row) => `This request was already ${row.status === 'approving' ? 'being approved' : row.status}.`

/** POST /salon/v1/approvals/:id/approve */
exports.approve = async (req, res) => {
  const row = await ownersRow(req, res)
  if (!row) return
  if (row.status !== 'pending') return reply(res, '0', answered(row))
  const done = await approvals.approve(row, { approver: await approverOf(req), accessToken: req.header('accessToken') })
  const [out] = await view([done])
  if (done.status === 'approved') return reply(res, '1', 'Approved. The change is made.', out)
  if (done.status === 'failed') return reply(res, '0', `Approved, but the change couldn't be made: ${done.resultMessage || 'unknown error'}`, out)
  return reply(res, '0', answered(done), out)
}

/** POST /salon/v1/approvals/:id/decline { reason } */
exports.decline = async (req, res) => {
  const row = await ownersRow(req, res)
  if (!row) return
  if (row.status !== 'pending') return reply(res, '0', answered(row))
  const done = await approvals.decline(row, { approver: await approverOf(req), reason: req.body?.reason })
  const [out] = await view([done])
  return reply(res, '1', 'Declined.', out)
}

/** POST /salon/v1/approvals/:id/cancel: the requester takes it back. */
exports.cancel = async (req, res) => {
  const row = await db.approvalRequest.findByPk(parseInt(req.params.id, 10))
  if (!row || row.requestedByUserId !== req.branch?.staffUserId) return reply(res, '0', 'Request not found.')
  const [changed] = await db.approvalRequest.update({ status: 'cancelled' }, { where: { id: row.id, status: 'pending' } })
  if (!changed) return reply(res, '0', answered(row))
  return reply(res, '1', 'Request withdrawn.')
}

/** GET /salon/v1/approval-rules: the open branch's rules (owner). */
exports.getRules = async (req, res) => {
  if (!isOwnerSession(req)) return reply(res, '0', 'Only the shop owner can change approval rules.')
  const rules = await approvals.rulesFor(req.branch.salonId)
  return reply(res, '1', 'Approval rules', {
    salonId: req.branch.salonId,
    branches: (req.branch.allowedSalonIds || []).length,
    rules: Object.entries(approvals.RULES).map(([key, r]) => ({ key, label: r.label, hint: r.hint, enabled: rules[key] })),
  })
}

/** PUT /salon/v1/approval-rules { rules: { key: bool }, allBranches } */
exports.setRules = async (req, res) => {
  if (!isOwnerSession(req)) return reply(res, '0', 'Only the shop owner can change approval rules.')
  const rules = req.body?.rules && typeof req.body.rules === 'object' ? req.body.rules : {}
  const salonIds = req.body?.allBranches ? req.branch.allowedSalonIds : [req.branch.salonId]
  await approvals.setRules(salonIds, rules, req.user.id)
  return reply(res, '1', req.body?.allBranches ? 'Saved for all branches.' : 'Saved.')
}
