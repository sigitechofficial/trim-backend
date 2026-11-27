// Chair renters moving shop (see helper/renterMove.js for what a move changes).
const renterMove = require('../../helper/renterMove')
const { response } = require('../../utils/response')

const ok = (res, message, data) => res.json(response({ message, data }))

// New shop invites a renter: { email | countryCode + phoneNum, moveDate, rentAmount, rentCycle }
exports.invite = async (req, res) => {
  const move = await renterMove.invite({ hostUserId: req.user.id, ...req.body })
  return ok(res, 'Invite sent.', { move })
}

// Renter answers an invite: { accept: true | false }
exports.respond = async (req, res) => {
  const accept = req.body?.accept === true || req.body?.accept === 'true'
  const move = await renterMove.respond({ renterUserId: req.user.id, moveId: req.params.move, accept })
  return ok(res, accept ? 'Offer accepted.' : 'Offer declined.', { move })
}

// Renter leaves their shop with no new shop yet: { moveDate }
exports.leave = async (req, res) => {
  const move = await renterMove.leave({ renterUserId: req.user.id, moveDate: req.body?.moveDate })
  return ok(res, 'Leave scheduled.', { move, graceDays: renterMove.GRACE_DAYS })
}

// Old shop confirms the renter's rent is settled.
exports.settleRent = async (req, res) => {
  const move = await renterMove.settleRent({ hostUserId: req.user.id, moveId: req.params.move })
  return ok(res, 'Rent marked as settled.', { move })
}

exports.cancel = async (req, res) => {
  const move = await renterMove.cancel({ userId: req.user.id, moveId: req.params.move })
  return ok(res, 'Move cancelled.', { move })
}

exports.list = async (req, res) => {
  const [moves, renter] = await Promise.all([renterMove.listFor(req.user.id), renterMove.renterStatus(req.user.id)])
  return ok(res, 'Success.', { moves, renter, graceDays: renterMove.GRACE_DAYS })
}

// ---- Admin panel ----

exports.adminList = async (req, res) => ok(res, 'Success.', await renterMove.adminOverview())

exports.adminCancel = async (req, res) => {
  const move = await renterMove.adminCancel(req.params.move)
  return ok(res, 'Move cancelled.', { move })
}

exports.adminSettleRent = async (req, res) => {
  const move = await renterMove.adminSettleRent(req.params.move)
  return ok(res, 'Rent marked as settled. The move runs on its date.', { move })
}

exports.adminRetry = async (req, res) => {
  const { move, result } = await renterMove.adminRetry(req.params.move)
  const message = result === 'completed' ? 'Move completed.' : result === 'failed' ? `Move failed again: ${move?.failReason || ''}` : 'Move is waiting for its date or the rent check.'
  return ok(res, message, { move, result })
}
