const { user } = require('../models')

// After accessCheck: only Trim admin team accounts (userTypeId 4 = admin,
// 5 = admin team member) may use the route. Customers and shops get 403.
module.exports = async function adminOnly(req, res, next) {
  try {
    const admin = await user.findOne({
      where: { id: req.user?.id, userTypeId: [4, 5], deleted: false },
      attributes: ['id'],
    })
    if (!admin) {
      return res.status(403).json({ status: '0', message: 'Not allowed.', data: {}, error: 'Not allowed.' })
    }
    next()
  } catch (err) {
    return res.status(403).json({ status: '0', message: 'Not allowed.', data: {}, error: 'Not allowed.' })
  }
}
