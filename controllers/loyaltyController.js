// Loyalty discount endpoints for the business app, the client app and admin.
// All rules live in helper/loyalty.js.
const loyalty = require('../helper/loyalty')
const { resolveRequestActor } = require('../helper/bookingRequestAccess')
const { response } = require('../utils/response')
const AppError = require('../utils/appError')
const { salonDetail } = require('../models')

const fail = (message) => response({ status: '0', message, data: {} })

/* ---------- Business app (/salon/v1) ---------- */

// GET /salon/v1/loyalty — settings, excluded services and simple numbers.
exports.getShopLoyalty = async (req, res) => {
  const actor = await resolveRequestActor(req)
  if (!actor.shopId) return res.json(fail('Shop not found'))
  const settings = await loyalty.settingsForShop(actor.shopId)
  return res.json(response({ data: { ...settings, canEdit: actor.isOwner } }))
}

// PUT /salon/v1/loyalty — owners and chair renters only.
exports.saveShopLoyalty = async (req, res) => {
  const actor = await resolveRequestActor(req)
  if (!actor.shopId) return res.json(fail('Shop not found'))
  if (!actor.isOwner) return res.json(fail('Only the shop owner can change the loyalty offer.'))
  const { settings, error } = await loyalty.saveSettings(actor.shopId, req.body || {})
  if (error) return res.json(fail(error))
  return res.json(response({ message: 'Loyalty offer saved', data: { ...settings, canEdit: true } }))
}

// GET /salon/v1/loyalty/client/:customerId — one client's card at this shop.
exports.getClientCard = async (req, res) => {
  const actor = await resolveRequestActor(req)
  if (!actor.shopId) return res.json(fail('Shop not found'))
  const card = await loyalty.summaryForClient(actor.shopId, Number(req.params.customerId) || null)
  return res.json(response({ data: { loyalty: card } }))
}

/* ---------- Client app (/customer) ---------- */

// POST /customer/loyalty/quote { salonId, serviceIds: [..] } — what the reward
// takes off this basket. The review screen shows exactly these numbers.
exports.quote = async (req, res) => {
  const { salonId, serviceIds, services } = req.body || {}
  const ids = Array.isArray(serviceIds)
    ? serviceIds
    : Array.isArray(services)
      ? services.map((s) => s?.serviceId ?? s?.id)
      : []
  const result = await loyalty.quote({
    salonDetailId: Number(salonId) || null,
    customerId: req.user?.id,
    serviceIds: ids,
  })
  return res.json(response({ data: result }))
}

// GET /customer/loyalty/cards — "My rewards".
exports.myCards = async (req, res) => {
  const cards = await loyalty.cardsForCustomer(req.user.id)
  return res.json(response({ data: { cards } }))
}

/* ---------- Admin (/admin) ---------- */

// GET /admin/salon-loyalty/:id
exports.adminGetShopLoyalty = async (req, res) => {
  const shop = await salonDetail.findByPk(req.params.id, { attributes: ['id'] })
  if (!shop) throw new AppError('No record found with that ID', 200)
  const settings = await loyalty.settingsForShop(shop.id)
  return res.status(200).json(response({ data: settings }))
}

// PATCH /admin/salon-loyalty/:id { isActive: false } — admin can only switch
// an offer off (or back on); the shop owns the numbers.
exports.adminSetShopLoyalty = async (req, res) => {
  const shop = await salonDetail.findByPk(req.params.id, { attributes: ['id'] })
  if (!shop) throw new AppError('No record found with that ID', 200)
  if (typeof req.body?.isActive !== 'boolean') throw new AppError('isActive must be true or false', 200)
  const program = await loyalty.getProgram(shop.id)
  if (!program) throw new AppError('This shop has not set up a loyalty offer', 200)
  const { settings, error } = await loyalty.saveSettings(shop.id, { isActive: req.body.isActive })
  if (error) throw new AppError(error, 200)
  return res.status(200).json(response({ message: 'Loyalty offer updated', data: settings }))
}
