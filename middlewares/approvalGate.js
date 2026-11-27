// Step C: changes that need the owner's approval (helper/approvals.js).
// Put after a router's permission guards, so only people allowed to make the
// change can ask for it. The owner passes; a team member's change becomes a
// request when the branch's rule is on. A request the owner approved comes
// back here with x-approval-id and goes through once.
const db = require('../models')
const approvals = require('../helper/approvals')
const { resolveRequestActor } = require('../helper/bookingRequestAccess')

const reply = (res, status, message, data = {}) => res.json({ status, message, data, error: '' })

module.exports = async function approvalGate(req, res, next) {
  try {
    const rule = approvals.ruleFor(req.method, req.baseUrl, req.path)
    if (!rule) return next()
    const actor = req._actor || (req._actor = await resolveRequestActor(req))
    const salonDetailId = actor.shopId
    if (!salonDetailId) return next()

    // The owner's replay of an approved request.
    const approvalId = parseInt(req.get('x-approval-id'), 10)
    if (approvalId > 0) {
      const row = await db.approvalRequest.findByPk(approvalId)
      const fullPath = `${req.baseUrl}${req.path}`
      // The owner, or the manager who approved it (owner allows managers; same branch).
      const byManager = !actor.isOwner && row && req.user?.staffUserId && row.decidedByUserId === req.user.staffUserId &&
        (await approvals.managedBranchIds(req.user.staffUserId, [salonDetailId])).length > 0
      const valid = row && row.status === 'approving' && (actor.isOwner || byManager) &&
        row.salonDetailId === salonDetailId && row.method === req.method && row.path === fullPath
      if (!valid) return reply(res, '0', 'This approval is not valid.')
      req.approvalRequestId = row.id
      return next()
    }

    if (actor.isOwner) return next()
    const rules = await approvals.rulesFor(salonDetailId)
    if (!rules[rule]) return next()
    const description = await approvals.describe(rule, req, salonDetailId)
    if (!description) return next()

    const row = await approvals.createRequest({ req, rule, salonDetailId, actor, description })
    const message = rule === 'exportClients'
      ? "Sent to the owner for approval. You'll get the file by email once they approve."
      : rule === 'refunds'
        ? 'Sent to the owner for approval. The booking is cancelled and the client refunded once they approve.'
        : 'Sent to the owner for approval. It will change once they approve.'
    return reply(res, '0', message, {
      code: 'APPROVAL_SENT',
      approvalId: row.id,
      summary: row.summary,
    })
  } catch (err) {
    return next(err)
  }
}
