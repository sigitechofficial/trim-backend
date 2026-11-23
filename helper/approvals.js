// Approvals (Step C, proposal Part 7).
//
// The owner picks, per branch, which changes by team members need their
// approval. Such a change is not made: it is saved as a request (the original
// method, path and body) and the owner is told. On approve, the same request
// is sent again with the owner's own session and an x-approval-id header that
// lets it through the gate once; on decline nothing happens. Requests remind
// the owner after 24 hours and expire after 7 days.
//
// The owner never needs approval. Only team members whose permission already
// allows the change can ask (the gate runs after the permission guards).
const { Op } = require('sequelize')
const db = require('../models')
const activity = require('./activityLog')

const DAY = 24 * 60 * 60 * 1000
const EXPIRES_AFTER = 7 * DAY
const REMIND_AFTER = DAY

// key → { label, hint, default, routes: [[method, mount, path]] }
const RULES = {
  prices: {
    label: 'Price changes',
    hint: 'Changing the price or discount of a service',
    default: true,
    routes: [['PATCH', '/salon/v1', '/updateService']],
  },
  newService: {
    label: 'New services',
    hint: 'Adding a service to the menu',
    default: true,
    routes: [['POST', '/salon/v1', '/addService']],
  },
  coupons: {
    label: 'Coupons',
    hint: 'Adding, changing or deleting a coupon',
    default: false,
    routes: [
      ['POST', '/salon/v1', '/add-coupon'],
      ['PATCH', '/salon/v1', '/update-coupon/:couponId'],
      ['POST', '/salon/v1', '/delete-coupon/:couponId'],
    ],
  },
  hours: {
    label: 'Opening hours',
    hint: "Changing the branch's opening hours",
    default: false,
    routes: [['PATCH', '/salon/v1', '/updateSalonTimings']],
  },
  policies: {
    label: 'Shop policies',
    hint: 'Cancellation, deposit, no-show and reschedule policies',
    default: false,
    routes: [
      ['POST', '/salon/v1', '/updateCancellationPolicies'],
      ['POST', '/salon/v1', '/updateDepositPolicies'],
      ['POST', '/salon/v1', '/updateNoShowPolicies'],
      ['POST', '/salon/v1', '/updatereschedulePolicy'],
    ],
  },
  addTeam: {
    label: 'Adding team members',
    hint: 'Adding a barber, manager or receptionist',
    default: false,
    routes: [['POST', '/salon/v1/employee', '/AddEmployee']],
  },
  breaks: {
    label: 'Breaks',
    hint: "A team member changing or removing someone's breaks",
    default: false,
    routes: [
      ['POST', '/salon/v1', '/breaks'],
      ['DELETE', '/salon/v1', '/breaks/:id'],
    ],
  },
  exportClients: {
    label: 'Exporting the client list',
    hint: 'A team member downloading all clients with their details',
    default: true,
    routes: [['POST', '/salon/v1', '/clients/export']],
  },
  teamAccess: {
    label: "Changing someone's access",
    hint: 'Changing what a team member can see and do',
    default: false,
    routes: [
      ['POST', '/salon/v1/employee', '/access-levels/create'],
      ['PATCH', '/salon/v1/employee', '/access-levels/update'],
    ],
  },
}

const compiled = []
for (const [key, r] of Object.entries(RULES)) {
  for (const [method, mount, pattern] of r.routes) {
    compiled.push({ key, method, mount, re: new RegExp(`^${pattern.replace(/:[A-Za-z]+/g, '[^/]+')}/?$`) })
  }
}

/** The rule a request falls under, or null. mount = the router's baseUrl. */
function ruleFor(method, mount, path) {
  const hit = compiled.find((c) => c.method === method && c.mount === mount && c.re.test(path))
  return hit ? hit.key : null
}

/** { ruleKey: enabled } for a branch, defaults filled in. */
async function rulesFor(salonDetailId) {
  const rows = await db.approvalRule.findAll({ where: { salonDetailId }, attributes: ['rule', 'enabled'] })
  const saved = Object.fromEntries(rows.map((r) => [r.rule, !!r.enabled]))
  return Object.fromEntries(Object.entries(RULES).map(([k, r]) => [k, k in saved ? saved[k] : r.default]))
}

async function setRules(salonIds, rules, userId) {
  for (const salonDetailId of salonIds) {
    for (const [rule, enabled] of Object.entries(rules)) {
      if (!RULES[rule]) continue
      const row = await db.approvalRule.findOne({ where: { salonDetailId, rule } })
      if (row) await row.update({ enabled: !!enabled, updatedByUserId: userId })
      else await db.approvalRule.create({ salonDetailId, rule, enabled: !!enabled, updatedByUserId: userId })
    }
  }
}

const money = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? `£${n.toFixed(2)}` : `${v ?? ''}`
}
const same = (a, b) => Number(a || 0) === Number(b || 0)

/**
 * What the change is, in words, and what it replaces. Returns null when the
 * request does not need approval after all (a price rule on an edit that
 * keeps the price).
 */
async function describe(rule, req, salonDetailId) {
  const b = req.body || {}
  if (rule === 'prices') {
    const s = await db.service.findOne({
      where: { id: b.serviceId, salonDetailId },
      attributes: ['id', 'serviceName', 'price', 'discount'],
    })
    if (!s) return null // not this branch's service: the handler answers as usual
    const priceChanges = b.price != null && b.price !== '' && !same(b.price, s.price)
    const discountChanges = b.discount != null && b.discount !== '' && !same(b.discount, s.discount)
    if (!priceChanges && !discountChanges) return null
    const parts = []
    if (priceChanges) parts.push(`${money(s.price)} → ${money(b.price)}`)
    if (discountChanges) parts.push(`discount ${s.discount || 0} → ${b.discount}`)
    return {
      summary: `Change ${s.serviceName}: ${parts.join(', ')}`,
      before: { serviceName: s.serviceName, price: s.price, discount: s.discount },
    }
  }
  if (rule === 'newService') {
    const d = b.serviceData || {}
    return { summary: `Add service ${d.serviceName || ''}${d.price != null ? ` (${money(d.price)})` : ''}`.trim(), before: null }
  }
  if (rule === 'coupons') {
    const what = /add-coupon/.test(req.path) ? 'Add' : /delete-coupon/.test(req.path) ? 'Delete' : 'Change'
    return { summary: `${what} coupon${b.promoCode ? ` ${b.promoCode}` : ''}`, before: null }
  }
  if (rule === 'addTeam') {
    const name = `${b.firstName || ''} ${b.lastName || ''}`.trim()
    return { summary: `Add ${name || 'a team member'}${b.role ? ` as ${b.role}` : ''}`, before: null }
  }
  if (rule === 'teamAccess') {
    const e = b.employeeId ? await db.employee.findByPk(b.employeeId, { include: { model: db.user, attributes: ['firstName', 'lastName'] } }) : null
    const name = e?.user ? `${e.user.firstName || ''} ${e.user.lastName || ''}`.trim() : 'a team member'
    return { summary: `Change ${name}'s access`, before: null }
  }
  if (rule === 'breaks') {
    const hhmm = (t) => String(t || '').slice(0, 5)
    const nameOf = async (employeeId) => {
      const e = employeeId ? await db.employee.findByPk(employeeId, { include: { model: db.user, attributes: ['firstName', 'lastName'] } }) : null
      return e?.user ? `${e.user.firstName || ''} ${e.user.lastName || ''}`.trim() : 'a team member'
    }
    if (req.method === 'DELETE') {
      const id = Number(String(req.path).split('/').pop())
      const br = await db.breakTime.findOne({ where: { id, salonDetailId } })
      if (!br) return null // not this branch's break: the handler answers as usual
      return { summary: `Remove ${await nameOf(br.employeeId)}'s break on ${br.day} ${hhmm(br.breakStart)}–${hhmm(br.breakEnd)}`, before: null }
    }
    // The app sends every day on each save: only a real change needs approval.
    const current = await db.breakTime.findAll({ where: { employeeId: b.employeeId, day: b.day }, attributes: ['breakStart', 'breakEnd'] })
    const key = (list) => list.map((x) => `${hhmm(x.breakStart)}-${hhmm(x.breakEnd)}`).sort().join(',')
    const next = Array.isArray(b.breaks) ? b.breaks : []
    if (key(current) === key(next)) return null
    const times = next.map((x) => `${hhmm(x.breakStart)}–${hhmm(x.breakEnd)}`).join(', ') || 'no breaks'
    return {
      summary: `Change ${await nameOf(b.employeeId)}'s breaks on ${b.day}: ${times}`,
      before: { day: b.day, breaks: current.map((x) => ({ breakStart: hhmm(x.breakStart), breakEnd: hhmm(x.breakEnd) })) },
    }
  }
  if (rule === 'exportClients') {
    const s = await db.salonDetail.findByPk(salonDetailId, { attributes: ['salonName'] })
    return { summary: `Export the client list of ${s?.salonName || 'the branch'}`, before: null }
  }
  if (rule === 'policies') {
    const which = req.path.match(/update(\w+?)Polic/i)?.[1] || ''
    return { summary: `Change the ${which.toLowerCase() || 'shop'} policy`.replace('noshow', 'no-show'), before: null }
  }
  return { summary: RULES[rule].label, before: null }
}

// One request to this server, as the given session. Resolves { statusCode, json }.
function sendToSelf({ method, path, headers, body }) {
  const http = require('http')
  const payload = Buffer.from(JSON.stringify(body || {}))
  return new Promise((resolve, reject) => {
    const r = http.request(
      {
        host: '127.0.0.1',
        port: Number(process.env.PORT || 3000),
        method,
        path,
        headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length, ...headers },
        timeout: 60000,
      },
      (res) => {
        let data = ''
        res.setEncoding('utf8')
        res.on('data', (c) => { data += c })
        res.on('end', () => {
          let json = null
          try { json = JSON.parse(data) } catch (_) {}
          resolve({ statusCode: res.statusCode, json })
        })
      },
    )
    r.on('timeout', () => r.destroy(new Error('The change took too long. Please check it and try again.')))
    r.on('error', reject)
    r.end(payload)
  })
}

const fullName = (u) => `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim()

async function salonInfo(salonDetailId) {
  return db.salonDetail.findByPk(salonDetailId, { attributes: ['id', 'userId', 'brandId', 'salonName'] })
}

// Pushes. Never throw: a failed push must not undo the request.
async function push(userIds, title, body, data) {
  try {
    const tokens = await require('./staffDevices').ownDeviceTokens(userIds)
    if (!tokens.length) return
    require('../utils/throwNotification')(tokens, { title, body }, { type: 'approval', ...data }, userIds[0])
  } catch (err) {
    console.error('[approvals] push failed:', err.message)
  }
}

/** Save a request and tell the owner. Returns the row. */
async function createRequest({ req, rule, salonDetailId, actor, description }) {
  const salon = await salonInfo(salonDetailId)
  const requesterId = req.branch?.staffUserId || req.user?.staffUserId
  const requester = requesterId ? await db.user.findByPk(requesterId, { attributes: ['firstName', 'lastName'] }) : null
  const body = { ...(req.body || {}) }
  const note = typeof body.approvalNote === 'string' ? body.approvalNote.slice(0, 255) : null
  delete body.approvalNote
  const row = await db.approvalRequest.create({
    brandId: salon?.brandId ?? null,
    salonDetailId,
    requestedByUserId: requesterId,
    requesterName: fullName(requester) || actor?.name || null,
    requesterRole: req.branch?.role || null,
    rule,
    summary: description.summary.slice(0, 255),
    before: description.before,
    method: req.method,
    path: `${req.baseUrl}${req.path}`,
    body,
    note,
    status: 'pending',
    expiresAt: new Date(Date.now() + EXPIRES_AFTER),
  })
  await activity.record({
    salonDetailId,
    brandId: salon?.brandId ?? null,
    actorUserId: requesterId,
    actorRole: row.requesterRole,
    category: 'approvals',
    action: 'approval.requested',
    details: { request: row.id, change: row.summary },
    result: 'ok',
  })
  if (salon?.userId) {
    push([salon.userId], 'Approval needed', `${row.requesterName || 'A team member'} (${salon.salonName}): ${row.summary}`, {
      approvalId: String(row.id),
      salonId: String(salonDetailId),
    })
  }
  return row
}

/**
 * The owner approves: the saved request is sent again as the owner, through
 * the normal route (guards, handler, activity log). Returns the updated row.
 */
async function approve(row, { approver, accessToken }) {
  // Claim it so two taps (or two devices) run it once.
  const [claimed] = await db.approvalRequest.update(
    { status: 'approving', decidedByUserId: approver.id, decidedByName: approver.name, decidedAt: new Date() },
    { where: { id: row.id, status: 'pending' } },
  )
  if (!claimed) return db.approvalRequest.findByPk(row.id)

  let ok = false
  let message = ''
  try {
    // Node's http, not fetch: Sentry's fetch hook crashes on these requests.
    const out = await sendToSelf({
      method: row.method,
      path: row.path,
      headers: { accessToken, 'x-salon-id': String(row.salonDetailId), 'x-approval-id': String(row.id) },
      body: typeof row.body === 'string' ? JSON.parse(row.body) : row.body || {},
    })
    ok = out.statusCode < 400 && String(out.json?.status) === '1'
    message = String(out.json?.message || '')
  } catch (err) {
    message = err.message
  }
  await db.approvalRequest.update(
    { status: ok ? 'approved' : 'failed', resultMessage: message.slice(0, 255) },
    { where: { id: row.id } },
  )
  const done = await db.approvalRequest.findByPk(row.id)
  await activity.record({
    salonDetailId: row.salonDetailId,
    brandId: row.brandId,
    actorUserId: approver.id,
    actorRole: 'owner',
    category: 'approvals',
    action: ok ? 'approval.approved' : 'approval.failed',
    details: { request: row.id, change: row.summary, askedBy: row.requesterName },
    result: ok ? 'ok' : 'failed',
    message: ok ? null : message,
  })
  push(
    [row.requestedByUserId],
    ok ? 'Approved' : "Approved, but it couldn't be made",
    ok ? `${row.summary} is done.` : `${row.summary}: ${message || 'please try again'}`,
    { approvalId: String(row.id), salonId: String(row.salonDetailId) },
  )
  return done
}

async function decline(row, { approver, reason }) {
  const [changed] = await db.approvalRequest.update(
    {
      status: 'declined',
      decidedByUserId: approver.id,
      decidedByName: approver.name,
      decidedAt: new Date(),
      reason: reason ? String(reason).slice(0, 500) : null,
    },
    { where: { id: row.id, status: 'pending' } },
  )
  const done = await db.approvalRequest.findByPk(row.id)
  if (!changed) return done
  await activity.record({
    salonDetailId: row.salonDetailId,
    brandId: row.brandId,
    actorUserId: approver.id,
    actorRole: 'owner',
    category: 'approvals',
    action: 'approval.declined',
    details: { request: row.id, change: row.summary, askedBy: row.requesterName, reason: reason || undefined },
    result: 'ok',
  })
  push([row.requestedByUserId], 'Not approved', `${row.summary}${reason ? `: ${reason}` : ''}`, {
    approvalId: String(row.id),
    salonId: String(row.salonDetailId),
  })
  return done
}

/**
 * Hourly: remind owners of requests waiting over 24 hours (once), and expire
 * requests older than 7 days (the requester is told and can ask again).
 */
async function remindAndExpire(now = new Date()) {
  const summary = { reminded: 0, expired: 0 }
  const overdue = await db.approvalRequest.findAll({ where: { status: 'pending', expiresAt: { [Op.lte]: now } } })
  for (const r of overdue) {
    const [changed] = await db.approvalRequest.update({ status: 'expired' }, { where: { id: r.id, status: 'pending' } })
    if (!changed) continue
    summary.expired++
    push([r.requestedByUserId], 'Request expired', `${r.summary} was not answered in 7 days. You can ask again.`, {
      approvalId: String(r.id),
    })
  }
  // A server restart mid-approval leaves 'approving': whether the change was
  // made is unknown, so it is marked failed for the owner to check.
  const stuck = await db.approvalRequest.findAll({
    where: { status: 'approving', decidedAt: { [Op.lte]: new Date(now.getTime() - 10 * 60 * 1000) } },
  })
  for (const r of stuck) {
    await r.update({ status: 'failed', resultMessage: 'Interrupted. Please check whether the change was made.' })
  }
  const waiting = await db.approvalRequest.findAll({
    where: { status: 'pending', remindedAt: null, createdAt: { [Op.lte]: new Date(now.getTime() - REMIND_AFTER) } },
  })
  const byOwner = new Map()
  for (const r of waiting) {
    const salon = await salonInfo(r.salonDetailId)
    if (!salon?.userId) continue
    byOwner.set(salon.userId, (byOwner.get(salon.userId) || 0) + 1)
    await r.update({ remindedAt: now })
    summary.reminded++
  }
  for (const [ownerId, n] of byOwner) {
    push([ownerId], 'Approvals waiting', `${n} request${n === 1 ? ' is' : 's are'} waiting for your answer.`, {})
  }
  return summary
}

module.exports = {
  RULES,
  EXPIRES_AFTER,
  ruleFor,
  rulesFor,
  setRules,
  describe,
  createRequest,
  approve,
  decline,
  remindAndExpire,
}
