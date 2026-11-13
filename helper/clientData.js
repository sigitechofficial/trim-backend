// Client data tools (Step C, proposal Part 8 "Client data requests").
//
// - Export the client list of a branch as a CSV, emailed to the person who
//   asked (a team member's export can need the owner's approval: approvals
//   rule 'exportClients'). The owner is told whenever someone else exports.
// - A copy of one client's data (UK GDPR access request): their details,
//   bookings, notes and allergies in the owner's branches, emailed to the
//   client as a JSON file.
// Files go by email, not to the phone, so there is a record of where they went.
const { Op } = require('sequelize')
const db = require('../models')
const AppError = require('../utils/appError')

const csvCell = (v) => {
  const s = v == null ? '' : String(v)
  // Spreadsheet formula injection: a leading = + - @ is made plain text.
  // Phone numbers like +44 7700 900123 are only digits, so they stay as they are.
  const safe = /^[=+\-@]/.test(s) && !/^\+[\d\s()-]+$/.test(s) ? `'${s}` : s
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}
const csv = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\n')

/** The branch's clients: from bookings and from the client list. */
async function branchClients(salonDetailId) {
  const fromBookings = await db.booking.findAll({
    where: { salonDetailId, customerId: { [Op.ne]: null } },
    attributes: [
      'customerId',
      [db.sequelize.fn('COUNT', db.sequelize.col('booking.id')), 'visits'],
      [db.sequelize.fn('MAX', db.sequelize.col('on')), 'lastVisit'],
    ],
    group: ['customerId'],
    raw: true,
  })
  const listed = await db.salonClient.findAll({ where: { salonDetailId }, attributes: ['customerId', 'source'], raw: true })
  const stats = new Map(fromBookings.map((r) => [r.customerId, r]))
  const ids = [...new Set([...fromBookings.map((r) => r.customerId), ...listed.map((r) => r.customerId)])]
  if (!ids.length) return []
  const users = await db.user.findAll({ where: { id: ids }, attributes: ['id', 'firstName', 'lastName', 'email', 'countryCode', 'phoneNum'] })
  const sourceOf = new Map(listed.map((r) => [r.customerId, r.source]))
  return users
    .map((u) => ({
      id: u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      email: u.email || '',
      phone: `${u.countryCode || ''} ${u.phoneNum || ''}`.trim(),
      bookings: Number(stats.get(u.id)?.visits || 0),
      lastBooking: stats.get(u.id)?.lastVisit || '',
      source: sourceOf.get(u.id) || 'booking',
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function send({ to, subject, text, filename, content }) {
  try {
    const { transporter } = require('./transpoter')
    return transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: [to],
      subject,
      text,
      attachments: [{ filename, content }],
    }).catch((err) => console.error('[clientData] email failed:', err.message))
  } catch (err) {
    console.error('[clientData] email failed:', err.message)
    return null
  }
}

/** Email the branch's client list (CSV) to `toUser`. Returns { count, sentTo }. */
async function exportClients(salonDetailId, toUser) {
  const salon = await db.salonDetail.findByPk(salonDetailId, { attributes: ['id', 'salonName'] })
  if (!salon) throw new AppError('Shop not found.', 200)
  if (!toUser?.email) throw new AppError('Your account has no email address to send the file to.', 200)
  const clients = await branchClients(salonDetailId)
  const content = csv([
    ['Name', 'Email', 'Phone', 'Bookings', 'Last booking', 'Added from'],
    ...clients.map((c) => [c.name, c.email, c.phone, c.bookings, c.lastBooking, c.source]),
  ])
  const day = new Date().toISOString().slice(0, 10)
  send({
    to: toUser.email,
    subject: `${salon.salonName}: client list (${clients.length} clients)`,
    text: `Hi ${toUser.firstName || 'there'},\n\nAttached is the client list of ${salon.salonName} (${clients.length} clients) as a CSV file.\n\nIt holds personal details: keep it safe, don't share it, and delete it when you no longer need it (UK GDPR).\n\nTrim`,
    filename: `${salon.salonName.replace(/[^\w-]+/g, '_')}_clients_${day}.csv`,
    content,
  })
  return { count: clients.length, sentTo: toUser.email }
}

/** Is this customer a client of one of these branches? */
async function isClientOf(customerId, salonIds) {
  if (!salonIds.length) return false
  const b = await db.booking.count({ where: { customerId, salonDetailId: salonIds } })
  if (b) return true
  return (await db.salonClient.count({ where: { customerId, salonDetailId: salonIds } })) > 0
}

/** A client's data in the owner's branches, emailed to the client. */
async function sendDataCopy(customerId, salonIds) {
  const u = await db.user.findOne({
    where: { id: customerId, userTypeId: 1 },
    attributes: ['id', 'firstName', 'lastName', 'email', 'countryCode', 'phoneNum', 'createdAt'],
  })
  if (!(await isClientOf(customerId, salonIds))) throw new AppError('This client is not one of yours.', 200)
  if (!u) throw new AppError('This client has deleted their Trim account, so there is no data to send.', 200)
  if (!u.email) throw new AppError('This client has no email address to send the copy to.', 200)
  const branches = await db.salonDetail.findAll({ where: { id: salonIds }, attributes: ['id', 'salonName'] })
  const branchName = new Map(branches.map((b) => [b.id, b.salonName]))
  const bookings = await db.booking.findAll({
    where: { customerId, salonDetailId: salonIds },
    attributes: ['id', 'salonDetailId', 'on', 'startTime', 'status', 'total', 'createdAt'],
    include: [{ model: db.jobs, attributes: ['id'], include: [{ model: db.service, attributes: ['serviceName'] }] }],
    order: [['on', 'DESC']],
  })
  const notes = await db.clientNotes.findAll({ where: { userId: customerId, salonDetailId: salonIds }, attributes: ['salonDetailId', 'customerNote', 'createdAt'] })
  const allergyRows = await db.allergies.findAll({
    where: { userId: customerId, salonDetailId: salonIds },
    attributes: ['salonDetailId', 'allergyType', 'severity', 'name', 'reaction', 'note', 'createdAt'],
  })
  const data = {
    madeAt: new Date().toISOString(),
    about: 'The personal data these shops hold about you on Trim.',
    shops: branches.map((b) => b.salonName),
    you: {
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      email: u.email,
      phone: `${u.countryCode || ''} ${u.phoneNum || ''}`.trim(),
      accountCreated: u.createdAt,
    },
    bookings: bookings.map((b) => ({
      shop: branchName.get(b.salonDetailId),
      date: b.on,
      time: b.startTime,
      status: b.status,
      total: b.total,
      services: (b.jobs || []).map((j) => j.service?.serviceName).filter(Boolean),
    })),
    notesAboutYou: notes.map((n) => ({ shop: branchName.get(n.salonDetailId), note: n.customerNote, at: n.createdAt })),
    allergies: allergyRows.map((a) => ({ shop: branchName.get(a.salonDetailId), type: a.allergyType, severity: a.severity, name: a.name, reaction: a.reaction, note: a.note })),
  }
  send({
    to: u.email,
    subject: 'A copy of your data',
    text: `Hi ${u.firstName || 'there'},\n\nAs you asked, attached is a copy of the personal data ${branches.map((b) => b.salonName).join(', ')} hold about you on Trim: your details, bookings, notes and allergies.\n\nYou can correct your details in the Trim app at any time, or ask the shop to delete them.\n\nTrim`,
    filename: `your_data_${new Date().toISOString().slice(0, 10)}.json`,
    content: JSON.stringify(data, null, 2),
  })
  return { sentTo: u.email, bookings: data.bookings.length }
}

module.exports = { branchClients, exportClients, sendDataCopy, isClientOf, csv }
