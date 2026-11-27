// Client privacy across a brand (Step C): the client's sharing switch and
// "delete my data" requests, and the owner's list of those requests.
const privacy = require('../helper/clientPrivacy')

const reply = (res, status, message, data = {}) => res.json({ status, message, data, error: '' })

// ---- Client app (/customer) ----

/** GET /customer/privacy → { shareAcrossBranches, shops: [{ salonDetailId, name, branches, request }] } */
exports.myPrivacy = async (req, res) => {
  const [shareAcrossBranches, shops] = await Promise.all([privacy.getSharing(req.user.id), privacy.myShops(req.user.id)])
  return reply(res, '1', 'Your privacy settings.', { shareAcrossBranches, shops, dueDays: privacy.DUE_DAYS })
}

/** PUT /customer/privacy { shareAcrossBranches } */
exports.setSharing = async (req, res) => {
  const on = req.body?.shareAcrossBranches !== false && req.body?.shareAcrossBranches !== 'false'
  await privacy.setSharing(req.user.id, on)
  return reply(res, '1', on ? "Branches of the same business can now see each other's notes about you." : 'Each branch now sees only its own notes about you.', { shareAcrossBranches: on })
}

/** POST /customer/privacy/delete-request { salonDetailId } */
exports.askToDelete = async (req, res) => {
  const r = await privacy.askToDelete(req.user.id, Number(req.body?.salonDetailId))
  return reply(res, '1', `Request sent. The shop has until ${new Date(r.dueAt).toISOString().slice(0, 10)} to delete your data.`, { id: r.id, dueAt: r.dueAt })
}

// ---- Business app (/salon/v1), owner only ----

const ownerOnly = (req) => {
  if (!req.branch?.isOwner || req.branch.staffUserId) {
    const e = new Error('Only the owner can handle data requests.')
    e.reply = true
    throw e
  }
}

/** GET /salon/v1/data-requests */
exports.ownerList = async (req, res) => {
  try { ownerOnly(req) } catch (e) { return reply(res, '0', e.message) }
  const rows = await privacy.ownerRequests(req.user.id)
  return reply(res, '1', 'Client data requests.', { requests: rows, pending: rows.filter((r) => r.status === 'pending').length })
}

/** POST /salon/v1/data-requests/:id/complete */
exports.complete = async (req, res) => {
  try { ownerOnly(req) } catch (e) { return reply(res, '0', e.message) }
  const out = await privacy.completeRequest(Number(req.params.id), req.user.id)
  return reply(res, '1', "Done. The client's personal data is deleted and they have been told.", out)
}
