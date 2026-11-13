// Step C: shared settings (helper/sharedSettings.js). Put after a router's
// permission guards. A locked setting refuses anyone but the owner; when the
// owner saves a shared setting, it is copied to every other branch.
const shared = require('../helper/sharedSettings')
const { resolveRequestActor } = require('../helper/bookingRequestAccess')

const deny = (res, message) => res.json({ status: '0', message, data: {}, error: '' })

module.exports = async function sharedSettingsGate(req, res, next) {
  try {
    const key = shared.keyFor(req.method, req.baseUrl, req.path)
    if (!key) return next()
    const actor = req._actor || (req._actor = await resolveRequestActor(req))
    // Staff sessions carry the owner's id: req.user.id is the business owner.
    const row = await shared.stateOf(req.user.id, key)
    if (!row || row.state === 'branch') return next()
    if (!actor.isOwner) {
      if (row.state === 'locked') {
        return deny(res, `The ${shared.SETTINGS[key].label.toLowerCase()} is set by the owner for all branches.`)
      }
      return next() // shared but not locked: a branch may change its own
    }
    // A team member's change the owner approved stays in that branch.
    if (req.get('x-approval-id')) return next()
    // The owner: after a successful save, copy it to every branch.
    let body
    const json = res.json.bind(res)
    res.json = (b) => {
      body = b
      return json(b)
    }
    res.on('finish', () => {
      if (res.statusCode < 400 && String(body?.status) === '1' && actor.shopId) {
        shared.spread(req.user.id, key, actor.shopId).catch((err) => console.error('[sharedSettings] spread failed:', err.message))
      }
    })
    return next()
  } catch (err) {
    return next(err)
  }
}
