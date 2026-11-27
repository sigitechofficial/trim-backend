// Shared settings (Step C): where each setting applies, chosen by the owner.
const shared = require('../../helper/sharedSettings')

const reply = (res, status, message, data = {}) => res.json({ status, message, data, error: '' })

/** GET /salon/v1/shared-settings — every setting and where it applies. */
exports.list = async (req, res) => {
  const states = await shared.statesFor(req.user.id)
  return reply(res, '1', 'Shared settings', {
    settings: Object.entries(shared.SETTINGS).map(([key, s]) => ({ key, label: s.label, state: states[key] })),
  })
}

/** PUT /salon/v1/shared-settings/:key { state: branch | all | locked } (owner) */
exports.set = async (req, res) => {
  const out = await shared.setState(req.user.id, req.params.key, req.body?.state, req.branch?.salonId, req.user.id)
  const label = shared.SETTINGS[out.key].label
  const message = out.state === 'branch'
    ? `Each branch now keeps its own ${label.toLowerCase()}.`
    : `${label} copied to ${out.copiedTo} other branch${out.copiedTo === 1 ? '' : 'es'}${out.state === 'locked' ? ' and locked' : ''}.`
  return reply(res, '1', message, out)
}
