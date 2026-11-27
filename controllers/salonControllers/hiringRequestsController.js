// Hiring requests: everyone who wants to work at the shop, from the client app
// and the business app, in one list (see helper/hiringRequests.js).
const hiring = require('../../helper/hiringRequests')
const { response } = require('../../utils/response')

const ok = (res, message, data) => res.json(response({ message, data }))

exports.list = async (req, res) => ok(res, 'Success.', await hiring.list(req.user.id))

exports.count = async (req, res) => ok(res, 'Success.', await hiring.newCount(req.user.id))
