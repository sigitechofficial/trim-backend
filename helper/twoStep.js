// Two-step login and devices (Step C, proposal Part 8 "Secure logins").
//
// After the password (or Google/Apple) step, a person who needs two-step
// login and is on a device they have not confirmed gets a 6-digit code by
// email instead of a session. Once they enter it, the device is trusted and
// the app logs in again as usual. Who needs it:
//   - every shop owner (business account), always;
//   - managers, when an owner they work for switches it on.
// Only apps that say they handle it (header x-two-step: 1) are asked, so
// older app versions keep working until the forced update; TWO_STEP_LOGIN=off
// turns it off.
//
// The code goes by email: Trim has no SMS provider yet.
const crypto = require('crypto')
const { Op } = require('sequelize')
const db = require('../models')
const activity = require('./activityLog')

const CODE_TTL = 10 * 60 * 1000
const MAX_ATTEMPTS = 5
const MAX_SENDS = 5
const RESEND_AFTER = 30 * 1000

const sha = (v) => crypto.createHash('sha256').update(String(v)).digest('hex')
const deviceHashOf = (req) => {
  const id = String(req.get?.('x-device-id') || req.body?.deviceId || '').trim()
  return id.length >= 16 && id.length <= 128 ? sha(`device:${id}`) : null
}
const ipOf = (req) => String(req.headers?.['x-forwarded-for'] || req.ip || '').split(',')[0].trim() || null
const deviceNameOf = (req) => String(req.get?.('x-device-name') || '').slice(0, 120) || null
const platformOf = (req) => String(req.get?.('x-device-platform') || '').slice(0, 16) || null

function enabled(req) {
  return process.env.TWO_STEP_LOGIN !== 'off' && String(req.get?.('x-two-step') || '') === '1'
}

// a.b@example.com → a••@example.com
function maskEmail(email) {
  const [name, domain] = String(email || '').split('@')
  if (!domain) return ''
  return `${name.slice(0, 1)}${'•'.repeat(Math.max(2, Math.min(6, name.length - 1)))}@${domain}`
}

const flagForManagers = async (ownerIds) => {
  if (!ownerIds.length) return false
  const [rows] = await db.sequelize.query(
    'SELECT COUNT(*) AS n FROM users WHERE id IN (:ids) AND twoStepForManagers = 1',
    { replacements: { ids: ownerIds } },
  )
  return Number(rows?.[0]?.n || 0) > 0
}

/** Does this business user need two-step login? */
async function required(user) {
  if (Number(user.userTypeId) === 2) return true // owners (and chair renters on their own shop)
  if (Number(user.userTypeId) !== 3) return false
  const rows = await db.employee.findAll({
    where: { userId: user.id, deleted: false, role: 'manager' },
    attributes: ['salonDetailId'],
    include: { model: db.salonDetail, attributes: ['userId'], required: true },
  })
  return flagForManagers([...new Set(rows.map((r) => r.salonDetail.userId))])
}

function sendCode(user, code) {
  try {
    const { transporter } = require('./transpoter')
    const name = `${user.firstName || ''}`.trim() || 'there'
    return transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: [user.email],
      subject: `Your Trim Business login code: ${code}`,
      text: `Hi ${name},\n\nYour login code is ${code}. It works for 10 minutes.\n\nSomeone (hopefully you) is logging in to Trim Business on a new device. If this wasn't you, change your password now. Nobody from Trim will ever ask you for this code.\n\nTrim`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111;max-width:480px">
        <p>Hi ${name},</p>
        <p>Your Trim Business login code is:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p>
        <p>It works for 10 minutes.</p>
        <p style="color:#555">Someone (hopefully you) is logging in on a new device. If this wasn't you, change your password now. Nobody from Trim will ever ask you for this code.</p>
      </div>`,
    }).catch((err) => console.error('[twoStep] email failed:', err.message))
  } catch (err) {
    console.error('[twoStep] email failed:', err.message)
    return null
  }
}

const newCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0')

/**
 * Called by login once the password (or social sign-in) is right.
 * Returns null when the login may go on (not needed, or a trusted device),
 * or the response body that asks for the code.
 */
async function check(req, user) {
  if (!enabled(req)) return null
  const deviceHash = deviceHashOf(req)
  const needed = await required(user)
  if (!deviceHash) {
    return needed ? { status: '0', message: 'Please update the Trim Business app to log in.', data: {}, error: '' } : null
  }
  const seen = {
    lastSeenAt: new Date(),
    lastIp: ipOf(req),
    dvToken: req.body?.dvToken || null,
    name: deviceNameOf(req),
    platform: platformOf(req),
  }
  const row = await db.trustedDevice.findOne({ where: { userId: user.id, deviceHash } })
  const trusted = row && row.trustedAt && !row.revokedAt
  // Every device that logs in with this app is listed for the owner (and can
  // be signed out), whether or not it needed a code.
  if (!needed || trusted) {
    if (row) await row.update({ ...seen, dvToken: seen.dvToken || row.dvToken, name: seen.name || row.name, revokedAt: null })
    else await db.trustedDevice.create({ userId: user.id, deviceHash, ...seen })
    return null
  }
  const code = newCode()
  const challenge = await db.loginChallenge.create({
    userId: user.id,
    deviceHash,
    codeHash: sha(`code:${code}`),
    sentTo: maskEmail(user.email),
    lastSentAt: new Date(),
    expiresAt: new Date(Date.now() + CODE_TTL),
  })
  sendCode(user, code)
  return {
    status: '8',
    message: `We've sent a 6-digit code to ${challenge.sentTo}. Enter it to finish logging in.`,
    data: { twoStep: true, challengeId: challenge.id, sentTo: challenge.sentTo },
    error: '',
  }
}

async function homeSalon(user) {
  const own = await db.salonDetail.findOne({ where: { userId: user.id }, attributes: ['id', 'brandId', 'userId'], order: [['id', 'ASC']] })
  if (own) return { salonId: own.id, brandId: own.brandId, ownerId: own.userId, role: 'owner' }
  const work = await db.employee.findOne({
    where: { userId: user.id, deleted: false },
    attributes: ['salonDetailId', 'role'],
    include: { model: db.salonDetail, attributes: ['brandId', 'userId'] },
    order: [['id', 'ASC']],
  })
  return work ? { salonId: work.salonDetailId, brandId: work.salonDetail?.brandId, ownerId: work.salonDetail?.userId, role: work.role } : {}
}

/** POST /salon/v1/auth/two-step/verify { challengeId, code } + x-device-id */
async function verify(req) {
  const id = parseInt(req.body?.challengeId, 10)
  const code = String(req.body?.code || '').replace(/\D/g, '')
  const deviceHash = deviceHashOf(req)
  const c = id > 0 ? await db.loginChallenge.findByPk(id) : null
  if (!c || !deviceHash || c.deviceHash !== deviceHash || c.usedAt) return { ok: false, message: 'This code has expired. Please log in again.' }
  if (c.expiresAt < new Date()) return { ok: false, message: 'This code has expired. Please log in again.' }
  if (c.attempts >= MAX_ATTEMPTS) return { ok: false, message: 'Too many wrong codes. Please log in again.' }
  await c.increment('attempts')
  const given = Buffer.from(sha(`code:${code}`))
  const want = Buffer.from(c.codeHash)
  if (code.length !== 6 || !crypto.timingSafeEqual(given, want)) {
    const left = MAX_ATTEMPTS - c.attempts - 1
    return { ok: false, message: left > 0 ? `That code isn't right. ${left} tr${left === 1 ? 'y' : 'ies'} left.` : 'Too many wrong codes. Please log in again.' }
  }
  await c.update({ usedAt: new Date() })

  const user = await db.user.findByPk(c.userId, { attributes: ['id', 'firstName', 'lastName', 'email', 'userTypeId'] })
  const now = new Date()
  const row = await db.trustedDevice.findOne({ where: { userId: c.userId, deviceHash } })
  const fields = {
    name: deviceNameOf(req),
    platform: platformOf(req),
    lastIp: ipOf(req),
    lastSeenAt: now,
    dvToken: req.body?.dvToken || row?.dvToken || null,
    trustedAt: now,
    revokedAt: null,
    revokedByUserId: null,
  }
  if (row) await row.update(fields)
  else await db.trustedDevice.create({ userId: c.userId, deviceHash, ...fields })

  const home = await homeSalon(user)
  await activity.record({
    salonDetailId: home.salonId || null,
    brandId: home.brandId,
    actorUserId: user.id,
    actorRole: home.role || null,
    category: 'security',
    action: 'login.new_device',
    details: { device: fields.name || 'Unknown device', platform: fields.platform || undefined },
    result: 'ok',
    ip: fields.lastIp,
  })
  // A new device logged in as the owner: always tell them (proposal: security
  // alerts for the owner are always on).
  if (Number(user.userTypeId) === 2) alertOwnerNewDevice(user, fields)
  return { ok: true, message: 'Device confirmed.' }
}

/** POST /salon/v1/auth/two-step/resend { challengeId } + x-device-id */
async function resend(req) {
  const id = parseInt(req.body?.challengeId, 10)
  const deviceHash = deviceHashOf(req)
  const c = id > 0 ? await db.loginChallenge.findByPk(id) : null
  if (!c || c.deviceHash !== deviceHash || c.usedAt || c.expiresAt < new Date() || c.attempts >= MAX_ATTEMPTS) {
    return { ok: false, message: 'This code has expired. Please log in again.' }
  }
  if (c.sends >= MAX_SENDS) return { ok: false, message: 'Too many codes sent. Please log in again later.' }
  if (c.lastSentAt && Date.now() - new Date(c.lastSentAt).getTime() < RESEND_AFTER) {
    return { ok: false, message: 'Please wait a few seconds before asking for a new code.' }
  }
  const user = await db.user.findByPk(c.userId, { attributes: ['id', 'firstName', 'email'] })
  const code = newCode()
  await c.update({ codeHash: sha(`code:${code}`), sends: c.sends + 1, lastSentAt: new Date(), expiresAt: new Date(Date.now() + CODE_TTL) })
  sendCode(user, code)
  return { ok: true, message: `A new code is on its way to ${c.sentTo}.` }
}

function alertOwnerNewDevice(user, device) {
  const when = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })
  const what = device.name || 'a new device'
  try {
    const { transporter } = require('./transpoter')
    transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: [user.email],
      subject: 'New device logged in to your Trim Business account',
      text: `Your Trim Business account was logged in on ${what} (${when}). If this was you, there is nothing to do. If not, open Trim Business > Shop management > Security, sign that device out and change your password.`,
    }).catch((err) => console.error('[twoStep] alert email failed:', err.message))
  } catch (err) {
    console.error('[twoStep] alert email failed:', err.message)
  }
  require('./staffDevices').ownDeviceTokens([user.id]).then((tokens) => {
    if (tokens.length) {
      require('../utils/throwNotification')(tokens, { title: 'New device logged in', body: `Your account was logged in on ${what}.` }, { type: 'security' }, user.id)
    }
  }).catch(() => {})
}

/**
 * Devices the owner can see: their own and those of everyone working in
 * their branches. [{ id, userId, who, role, name, platform, lastSeenAt, lastIp, isThisDevice }]
 */
async function devicesFor(ownerId, salonIds, currentHash) {
  const staff = salonIds.length
    ? await db.employee.findAll({
        where: { salonDetailId: { [Op.in]: salonIds }, deleted: false },
        attributes: ['userId', 'role', 'isOwner'],
      })
    : []
  const roleOf = new Map([[ownerId, 'owner']])
  for (const e of staff) if (!roleOf.has(e.userId)) roleOf.set(e.userId, e.isOwner ? 'owner' : e.role || 'barber')
  const userIds = [...roleOf.keys()]
  const rows = await db.trustedDevice.findAll({
    where: { userId: { [Op.in]: userIds }, revokedAt: null },
    order: [['lastSeenAt', 'DESC']],
  })
  const users = await db.user.findAll({ where: { id: userIds }, attributes: ['id', 'firstName', 'lastName'] })
  const nameOf = new Map(users.map((u) => [u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim()]))
  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    who: nameOf.get(r.userId) || '',
    role: roleOf.get(r.userId),
    name: r.name || 'Unknown device',
    platform: r.platform,
    lastSeenAt: r.lastSeenAt,
    lastIp: r.lastIp,
    isThisDevice: !!currentHash && r.userId === ownerId && r.deviceHash === currentHash,
  }))
}

/** Sign one device out: its session stops working and it needs a code again. */
async function signOut(row, byUserId) {
  if (row.dvToken) {
    const holders = await db.deviceToken.findAll({ where: { tokenId: row.dvToken }, attributes: ['userId'] })
    // Only this person's session on that phone (and, for staff, the copy kept
    // under the owner's id that their token uses).
    const staffOwners = Number(row.userId) === Number(byUserId) ? [] : holders.map((h) => h.userId)
    await db.deviceToken.destroy({ where: { tokenId: row.dvToken, userId: [row.userId, ...staffOwners] } })
  }
  await row.update({ revokedAt: new Date(), revokedByUserId: byUserId })
}

async function getManagersFlag(ownerId) {
  const [rows] = await db.sequelize.query('SELECT twoStepForManagers AS f FROM users WHERE id = :id', { replacements: { id: ownerId } })
  return !!Number(rows?.[0]?.f || 0)
}

async function setManagersFlag(ownerId, on) {
  await db.sequelize.query('UPDATE users SET twoStepForManagers = :on WHERE id = :id', { replacements: { id: ownerId, on: on ? 1 : 0 } })
}

module.exports = {
  check,
  verify,
  resend,
  required,
  devicesFor,
  signOut,
  deviceHashOf,
  maskEmail,
  getManagersFlag,
  setManagersFlag,
  CODE_TTL,
  MAX_ATTEMPTS,
}
