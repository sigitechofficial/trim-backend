// A client's privacy across a brand (Step C, proposal Part 8).
//
// - Sharing: a branch also sees the client's allergies, notes and visits from
//   the other branches of the same brand (one owner, one business). On by
//   default; the client can switch it off in the app (users.shareAcrossBranches).
// - Delete my data: the client asks a shop; the request covers every branch of
//   its brand. The owner completes it within 30 days: notes, allergies, the
//   client-list entry and loyalty cards are deleted; past bookings stay for the
//   shop's records without the client's name or phone. Asking and completing
//   are both kept (dataRequests + activity log) as the record.
const { Op } = require('sequelize')
const db = require('../models')
const AppError = require('../utils/appError')

const DUE_DAYS = 30
const OPEN_BOOKING = ['pending', 'book', 'requested']
const today = () => new Date().toISOString().slice(0, 10)
const fullName = (u) => `${u?.firstName || ''} ${u?.lastName || ''}`.trim()

async function getSharing(customerId) {
  const [rows] = await db.sequelize.query('SELECT shareAcrossBranches AS s FROM users WHERE id = :id', { replacements: { id: customerId } })
  return rows.length ? rows[0].s !== 0 && rows[0].s !== false : true
}

async function setSharing(customerId, on) {
  await db.sequelize.query('UPDATE users SET shareAcrossBranches = :on WHERE id = :id', { replacements: { id: customerId, on: on ? 1 : 0 } })
}

/** The other branches of this branch's brand (none for a single shop). */
async function siblingBranches(salonDetailId) {
  const shop = await db.salonDetail.findByPk(salonDetailId, { attributes: ['id', 'brandId'] })
  if (!shop?.brandId) return []
  return db.salonDetail.findAll({
    where: { brandId: shop.brandId, id: { [Op.ne]: shop.id }, isExternalEmployee: { [Op.or]: [false, null] } },
    attributes: ['id', 'salonName'],
  })
}

/**
 * What the brand's other branches know about a client, for the branch that is
 * looking: { shared, branches, visits, notes, allergies }. Empty when the client
 * switched sharing off or the shop has no other branches.
 */
async function fromOtherBranches(salonDetailId, customerId) {
  const empty = { shared: false, branches: 0, visits: [], notes: [], allergies: [] }
  const others = await siblingBranches(salonDetailId)
  if (!others.length) return empty
  if (!(await getSharing(customerId))) return { ...empty, branches: others.length, sharingOff: true }
  const ids = others.map((b) => b.id)
  const name = new Map(others.map((b) => [b.id, b.salonName]))
  const bookings = await db.booking.findAll({
    where: { customerId, salonDetailId: ids, status: { [Op.in]: ['book', 'complete', 'save-unpaid', 'no-show', 'pending'] } },
    attributes: ['id', 'salonDetailId', 'on', 'startTime', 'status'],
    include: [{ model: db.jobs, attributes: ['id'], include: [{ model: db.service, attributes: ['serviceName'] }] }],
    order: [['on', 'DESC'], ['startTime', 'DESC']],
    limit: 50,
  })
  const notes = await db.clientNotes.findAll({ where: { userId: customerId, salonDetailId: ids }, attributes: ['salonDetailId', 'customerNote', 'updatedAt'] })
  const allergies = await db.allergies.findAll({
    where: { userId: customerId, salonDetailId: ids },
    attributes: ['id', 'salonDetailId', 'allergyType', 'severity', 'name', 'reaction', 'note', 'createdAt'],
  })
  return {
    shared: true,
    branches: others.length,
    visits: bookings.map((b) => ({
      branchName: name.get(b.salonDetailId),
      on: b.on,
      startTime: b.startTime,
      status: b.status,
      services: (b.jobs || []).map((j) => j.service?.serviceName).filter(Boolean),
    })),
    notes: notes.filter((n) => String(n.customerNote || '').trim()).map((n) => ({ branchName: name.get(n.salonDetailId), note: n.customerNote, at: n.updatedAt })),
    allergies: allergies.map((a) => ({ ...a.toJSON(), branchName: name.get(a.salonDetailId) })),
  }
}

/** Shops (grouped by brand) that hold data about the client, with any request. */
async function myShops(customerId) {
  const ids = new Set()
  const add = (rows, key = 'salonDetailId') => rows.forEach((r) => r[key] && ids.add(r[key]))
  add(await db.booking.findAll({ where: { customerId }, attributes: ['salonDetailId'], group: ['salonDetailId'], raw: true }))
  add(await db.salonClient.findAll({ where: { customerId }, attributes: ['salonDetailId'], raw: true }))
  add(await db.clientNotes.findAll({ where: { userId: customerId }, attributes: ['salonDetailId'], raw: true }))
  add(await db.allergies.findAll({ where: { userId: customerId }, attributes: ['salonDetailId'], raw: true }))
  add(await db.loyaltyCard.findAll({ where: { customerId }, attributes: ['salonDetailId'], raw: true }))
  const shops = !ids.size ? [] : await db.salonDetail.findAll({
    where: { id: [...ids], isExternalEmployee: { [Op.or]: [false, null] } },
    attributes: ['id', 'salonName', 'brandId', 'userId'],
  })
  const brands = await db.brand.findAll({ where: { id: [...new Set(shops.map((s) => s.brandId).filter(Boolean))] }, attributes: ['id', 'name'] })
  const brandName = new Map(brands.map((b) => [b.id, b.name]))
  const requests = await db.dataRequest.findAll({ where: { customerId }, order: [['createdAt', 'DESC']] })
  const groups = new Map()
  for (const s of shops) {
    const key = s.brandId ? `b${s.brandId}` : `s${s.id}`
    if (!groups.has(key)) groups.set(key, { salonDetailId: s.id, name: s.brandId ? brandName.get(s.brandId) || s.salonName : s.salonName, branches: [], brandId: s.brandId || null })
    groups.get(key).branches.push(s.salonName)
  }
  // A finished request stays on the list as the record, even once no data is left.
  for (const r of requests) {
    const key = r.brandId ? `b${r.brandId}` : `s${r.salonDetailId}`
    if (groups.has(key)) continue
    const shop = await db.salonDetail.findByPk(r.salonDetailId, { attributes: ['id', 'salonName', 'brandId'] })
    const b = r.brandId ? await db.brand.findByPk(r.brandId, { attributes: ['name'] }) : null
    groups.set(key, { salonDetailId: r.salonDetailId, name: b?.name || shop?.salonName || 'Shop', branches: [], brandId: r.brandId || null })
  }
  return [...groups.values()].map((g) => {
    const r = requests.find((x) => (g.brandId ? x.brandId === g.brandId : x.salonDetailId === g.salonDetailId))
    return { ...g, request: r ? { id: r.id, status: r.status, askedAt: r.createdAt, dueAt: r.dueAt, doneAt: r.doneAt } : null }
  }).sort((a, b) => a.name.localeCompare(b.name))
}

/** Every branch a request covers: the shop's brand, or the shop alone. */
async function coveredShopIds(salonDetailId, brandId) {
  if (!brandId) return [salonDetailId]
  const rows = await db.salonDetail.findAll({ where: { brandId }, attributes: ['id'] })
  return rows.map((r) => r.id)
}

async function upcomingCount(customerId, shopIds) {
  return db.booking.count({ where: { customerId, salonDetailId: shopIds, status: OPEN_BOOKING, on: { [Op.gte]: today() } } })
}

function notifyOwner(ownerUserId, title, body) {
  require('./staffDevices').ownDeviceTokens([ownerUserId]).then((tokens) => {
    if (tokens.length) require('../utils/throwNotification')(tokens, { title, body }, { type: 'dataRequest' }, ownerUserId)
  }).catch(() => {})
}

function email(to, subject, text) {
  try {
    const { transporter } = require('./transpoter')
    transporter.sendMail({ from: process.env.EMAIL_USERNAME, to: [to], subject, text }).catch((e) => console.error('[clientPrivacy] email failed:', e.message))
  } catch (e) {
    console.error('[clientPrivacy] email failed:', e.message)
  }
}

/** The client asks a shop (and its brand) to delete their data. */
async function askToDelete(customerId, salonDetailId) {
  const shop = await db.salonDetail.findByPk(salonDetailId, { attributes: ['id', 'salonName', 'brandId', 'userId'] })
  if (!shop) throw new AppError('Shop not found.', 200)
  const mine = await myShops(customerId)
  const group = mine.find((g) => (shop.brandId ? g.brandId === shop.brandId : g.salonDetailId === shop.id))
  if (!group) throw new AppError(`${shop.salonName} holds no data about you.`, 200)
  if (group.request?.status === 'pending') throw new AppError(`You already asked ${group.name}. They have until ${new Date(group.request.dueAt).toISOString().slice(0, 10)}.`, 200)
  const shopIds = await coveredShopIds(shop.id, shop.brandId)
  const upcoming = await upcomingCount(customerId, shopIds)
  if (upcoming) throw new AppError(`You have ${upcoming} upcoming booking${upcoming > 1 ? 's' : ''} at ${group.name}. Cancel ${upcoming > 1 ? 'them' : 'it'} first, then ask again.`, 200)
  const client = await db.user.findByPk(customerId, { attributes: ['id', 'firstName', 'lastName'] })
  const row = await db.dataRequest.create({
    customerId,
    salonDetailId: shop.id,
    brandId: shop.brandId || null,
    ownerUserId: shop.userId,
    customerName: fullName(client) || 'A client',
    dueAt: new Date(Date.now() + DUE_DAYS * 86400000),
  })
  await require('./activityLog').record({
    salonDetailId: shop.id, actorUserId: customerId, actorName: row.customerName, actorRole: 'client',
    category: 'data', action: 'clients.delete_request', result: '1',
    message: `${row.customerName} asked to delete their data`, details: { requestId: row.id },
  })
  notifyOwner(shop.userId, 'A client asked to delete their data', `${row.customerName} asked ${group.name} to delete their data. Please complete it within ${DUE_DAYS} days.`)
  return row
}

/** Requests for the owner's shops, pending first. */
async function ownerRequests(ownerUserId) {
  const rows = await db.dataRequest.findAll({ where: { ownerUserId }, order: [['createdAt', 'DESC']], limit: 200 })
  const shops = await db.salonDetail.findAll({ where: { id: [...new Set(rows.map((r) => r.salonDetailId))] }, attributes: ['id', 'salonName'] })
  const name = new Map(shops.map((s) => [s.id, s.salonName]))
  return rows
    .map((r) => ({
      id: r.id, customerName: r.customerName, shopName: name.get(r.salonDetailId), status: r.status,
      askedAt: r.createdAt, dueAt: r.dueAt, doneAt: r.doneAt, doneByName: r.doneByName, result: r.result,
      overdue: r.status === 'pending' && new Date(r.dueAt) < new Date(),
    }))
    .sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1))
}

/** The owner completes a request: delete the client's personal data in every branch it covers. */
async function completeRequest(requestId, ownerUserId) {
  const r = await db.dataRequest.findByPk(requestId)
  if (!r || r.ownerUserId !== ownerUserId) throw new AppError('Request not found.', 200)
  if (r.status !== 'pending') throw new AppError('This request is already closed.', 200)
  const shopIds = await coveredShopIds(r.salonDetailId, r.brandId)
  const upcoming = await upcomingCount(r.customerId, shopIds)
  if (upcoming) throw new AppError(`${r.customerName} has ${upcoming} upcoming booking${upcoming > 1 ? 's' : ''}. Cancel ${upcoming > 1 ? 'them' : 'it'} first, then complete the request.`, 200)
  const owner = await db.user.findByPk(ownerUserId, { attributes: ['firstName', 'lastName'] })
  const c = r.customerId
  const result = await db.sequelize.transaction(async (transaction) => {
    const notes = await db.clientNotes.destroy({ where: { userId: c, salonDetailId: shopIds }, transaction })
    const allergies = await db.allergies.destroy({ where: { userId: c, salonDetailId: shopIds }, transaction })
    const clientList = await db.salonClient.destroy({ where: { customerId: c, salonDetailId: shopIds }, transaction })
    const cards = await db.loyaltyCard.findAll({ where: { customerId: c, salonDetailId: shopIds }, attributes: ['id'], transaction })
    const loyaltyEvents = cards.length ? await db.loyaltyEvent.destroy({ where: { loyaltyCardId: cards.map((x) => x.id) }, transaction }) : 0
    const loyaltyCards = await db.loyaltyCard.destroy({ where: { customerId: c, salonDetailId: shopIds }, transaction })
    // Past bookings stay for the shop's takings and tax records, without the person.
    const [bookings] = await db.booking.update(
      { customerId: null, clientFirstName: 'Deleted', clientLastName: 'client', countryCode: null, phoneNum: null },
      { where: { customerId: c, salonDetailId: shopIds }, transaction },
    )
    const out = { notes, allergies, clientList, loyaltyCards, loyaltyEvents, bookingsAnonymised: bookings, branches: shopIds.length }
    await r.update({ status: 'done', doneAt: new Date(), doneByUserId: ownerUserId, doneByName: fullName(owner) || null, result: out }, { transaction })
    return out
  })
  await require('./activityLog').record({
    salonDetailId: r.salonDetailId, actorUserId: ownerUserId, actorRole: 'owner',
    category: 'data', action: 'clients.delete_done', result: '1',
    message: `Deleted the data of ${r.customerName}`, details: { requestId: r.id, ...result },
  })
  const client = await db.user.findByPk(c, { attributes: ['email', 'firstName'] })
  if (client?.email) {
    const shop = await db.salonDetail.findByPk(r.salonDetailId, { attributes: ['salonName'] })
    email(client.email, 'Your data has been deleted',
      `Hi ${client.firstName || 'there'},\n\n${shop?.salonName || 'The shop'}${r.brandId ? ' and its other branches' : ''} deleted your personal data, as you asked: notes, allergies, loyalty cards and your place on their client list. Past bookings stay in their records for tax purposes, without your name or phone number.\n\nYour Trim account itself is not affected.\n\nTrim`)
  }
  return result
}

module.exports = { getSharing, setSharing, fromOtherBranches, siblingBranches, myShops, askToDelete, ownerRequests, completeRequest, DUE_DAYS }
