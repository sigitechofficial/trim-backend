const { user } = require('../models')

// After accessCheck: only a full Trim admin (userTypeId 4), not an admin team
// member, e.g. for Running Costs (company spending).
module.exports = async function fullAdminOnly(req, res, next) {
  try {
    const admin = await user.findOne({ where: { id: req.user?.id, userTypeId: 4, deleted: false }, attributes: ['id'] })
    if (!admin) return res.status(403).json({ status: '0', message: 'Only the main admin can see running costs.', data: {}, error: 'Not allowed.' })
    next()
  } catch (err) {
    return res.status(403).json({ status: '0', message: 'Not allowed.', data: {}, error: 'Not allowed.' })
  }
}
