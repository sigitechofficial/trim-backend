// Admin → Running Costs (full admins only; see routes/adminRoutes/adminRoute.js).
const costs = require('../../helper/runningCosts')

const reply = (res, status, message, data = {}) => res.json({ status, message, data, error: '' })

exports.summary = async (req, res) => reply(res, '1', 'Running costs', await costs.summary())

exports.refresh = async (req, res) => {
  try {
    const r = await costs.refresh()
    if (!r.refreshed) return reply(res, '1', 'Already up to date: AWS updates its numbers a few times a day.', await costs.summary())
    return reply(res, '1', 'Updated from AWS.', await costs.summary())
  } catch (err) {
    console.error('[runningCosts] refresh failed:', err.message)
    const hint = /not authorized|AccessDenied/i.test(err.message)
      ? 'The server is not allowed to read AWS costs yet (Cost Explorer permission).'
      : /credential/i.test(err.message)
        ? 'The server has no AWS access here (it works on AWS).'
        : 'Could not reach AWS. Please try again later.'
    return reply(res, '0', hint, await costs.summary())
  }
}

exports.saveSettings = async (req, res) => {
  await costs.saveSettings(req.body || {})
  await costs.checkBudget()
  return reply(res, '1', 'Saved.', await costs.summary())
}
