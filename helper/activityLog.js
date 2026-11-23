// The activity log (Step C, design §4.1 and proposal Part 8).
//
// Business routes are watched from branchScope: when a request matches one of
// the ACTIONS below, the answer it got (status '1' = ok, '0' = refused or
// failed) is saved with who made it and in which branch. Other code (login,
// approvals) calls record() directly. Saving never breaks the request: a
// failure is logged and ignored.
const db = require('../models')

// [method, path pattern, category, action, label]
const ACTIONS = [
  // People
  ['POST', '/salon/v1/employee/AddEmployee', 'people', 'team.add', 'Added a team member'],
  ['PATCH', '/salon/v1/employee/updateEmployee', 'people', 'team.update', 'Changed a team member'],
  ['POST', '/salon/v1/employee/access-levels/create', 'people', 'team.access', "Changed a team member's access"],
  ['PATCH', '/salon/v1/employee/access-levels/update', 'people', 'team.access', "Changed a team member's access"],
  ['POST', '/salon/v1/employee/default-access-levels/create', 'people', 'team.default_access', 'Changed the default access'],
  ['PATCH', '/salon/v1/employee/default-access-levels/update', 'people', 'team.default_access', 'Changed the default access'],
  ['PATCH', '/salon/v1/employee/active-deactive-employee/:employee', 'people', 'team.block', 'Blocked or unblocked a team member'],
  ['PATCH', '/salon/v1/employee/delete-employee/:employee', 'people', 'team.remove', 'Removed a team member'],
  ['POST', '/salon/v1/employee/addWagesMethod', 'people', 'team.pay', "Set a team member's pay"],
  ['PATCH', '/salon/v1/employee/updateWagesMethod', 'people', 'team.pay', "Changed a team member's pay"],
  ['POST', '/salon/v1/branches/:salonId/members', 'people', 'team.add_to_branch', 'Added a team member to a branch'],
  ['PATCH', '/salon/v1/branches/members/:employeeId/all-branches', 'people', 'team.all_branches', 'Changed all-branches access'],
  ['POST', '/salon/v1/roles', 'people', 'role.create', 'Made a role'],
  ['PUT', '/salon/v1/roles/:id', 'people', 'role.update', 'Changed a role'],
  ['DELETE', '/salon/v1/roles/:id', 'people', 'role.delete', 'Deleted a role'],
  ['PUT', '/salon/v1/roles-assign', 'people', 'role.assign', 'Gave someone a role'],
  ['PATCH', '/salon/v1/employee/chair-market/offers/:offer/accept', 'people', 'chair.offer_accept', 'Accepted a chair offer'],
  ['POST', '/salon/v1/employee/chair-market/offers/:offer/start', 'people', 'chair.start', 'Confirmed a start day'],
  ['POST', '/salon/v1/employee/renter-moves/invite', 'people', 'renter.invite', 'Invited a chair renter'],

  // Money
  ['POST', '/salon/v1/addService', 'money', 'service.add', 'Added a service'],
  ['PATCH', '/salon/v1/updateService', 'money', 'service.update', 'Changed a service or price'],
  ['PATCH', '/salon/v1/employee/updateEmployeeService', 'money', 'service.staff_price', "Changed a team member's services or prices"],
  ['POST', '/salon/v1/add-coupon', 'money', 'coupon.add', 'Added a coupon'],
  ['PATCH', '/salon/v1/update-coupon/:couponId', 'money', 'coupon.update', 'Changed a coupon'],
  ['POST', '/salon/v1/delete-coupon/:couponId', 'money', 'coupon.delete', 'Deleted a coupon'],
  ['POST', '/salon/v1/bookings/cancelBooking', 'money', 'booking.cancel', 'Cancelled a booking'],
  ['PATCH', '/salon/v1/bookings/mark-appointment-cancel/:bookingId', 'money', 'booking.cancel', 'Cancelled a booking'],
  ['PATCH', '/salon/v1/bookings/mark-appointment-no-show/:bookingId', 'money', 'booking.no_show', 'Marked a no-show'],
  ['POST', '/salon/v1/bookings/checkoutBooking', 'money', 'checkout.card', 'Took a card payment'],
  ['POST', '/salon/v1/bookings/finalize-tap-to-pay', 'money', 'checkout.tap', 'Took a tap to pay payment'],
  ['POST', '/salon/v1/bookings/checkoutCash', 'money', 'checkout.cash', 'Took a cash payment'],
  ['POST', '/salon/v1/bookings/checkoutMinimalPayment', 'money', 'checkout.part', 'Took a part payment'],
  ['POST', '/payout/transfer-salary-to-employee', 'money', 'payout.salary', 'Paid a salary'],
  ['POST', '/payout/transfer-to-commission-employee', 'money', 'payout.commission', 'Paid commission'],
  ['POST', '/payout/transfer-to-rent-a-chair-employee', 'money', 'payout.renter', 'Paid a chair renter'],
  ['POST', '/payout/collect-rent/external-employee/:employee', 'money', 'payout.rent', 'Collected chair rent'],
  ['PATCH', '/salon/v1/online-payments', 'money', 'settings.online_payments', 'Changed online payments'],
  ['PATCH', '/salon/v1/bookings/updateOnlibePayment', 'money', 'settings.online_payments', 'Changed online payments'],
  ['PATCH', '/salon/v1/salonVatUpdate', 'money', 'settings.vat', 'Changed VAT'],
  ['POST', '/salon/v1/cancelSubscription', 'money', 'plan.cancel', 'Cancelled the Trim plan'],
  ['POST', '/salon/v1/updateSubscription', 'money', 'plan.change', 'Changed the Trim plan'],

  // Settings
  ['PATCH', '/salon/v1/updateSalonTimings', 'settings', 'settings.hours', 'Changed opening hours'],
  ['PATCH', '/salon/v1/updateSalonDetail', 'settings', 'settings.profile', 'Changed the shop profile'],
  ['PATCH', '/salon/v1/updateSalonAddress', 'settings', 'settings.address', 'Changed the address'],
  ['POST', '/salon/v1/updateCancellationPolicies', 'settings', 'policy.cancellation', 'Changed the cancellation policy'],
  ['POST', '/salon/v1/updateDepositPolicies', 'settings', 'policy.deposit', 'Changed the deposit policy'],
  ['POST', '/salon/v1/updateNoShowPolicies', 'settings', 'policy.no_show', 'Changed the no-show policy'],
  ['POST', '/salon/v1/updatereschedulePolicy', 'settings', 'policy.reschedule', 'Changed the reschedule policy'],
  ['POST', '/salon/v1/online-offline', 'settings', 'settings.online', 'Took the shop online or offline'],
  ['PATCH', '/salon/v1/booking-approval', 'settings', 'settings.booking_approval', 'Changed booking approval'],
  ['PUT', '/salon/v1/loyalty', 'settings', 'settings.loyalty', 'Changed the loyalty offer'],
  ['PUT', '/salon/v1/shared-settings/:key', 'settings', 'settings.shared', 'Changed where a setting applies'],
  ['POST', '/salon/v1/breaks', 'settings', 'settings.break', 'Added a break'],
  ['DELETE', '/salon/v1/breaks/:id', 'settings', 'settings.break_remove', 'Removed a break'],
  ['POST', '/salon/v1/branches', 'settings', 'branch.add', 'Added a branch'],
  ['PATCH', '/salon/v1/branches/brand', 'settings', 'brand.rename', 'Renamed the business'],
  ['POST', '/salon/v1/branches/:salonId/close', 'settings', 'branch.close', 'Closed a branch'],
  ['POST', '/salon/v1/branches/:salonId/reopen', 'settings', 'branch.reopen', 'Reopened a branch'],

  // Data
  ['POST', '/salon/v1/bookings/importClients', 'data', 'clients.import', 'Imported clients'],
  ['POST', '/salon/v1/clients/export', 'data', 'clients.export', 'Exported the client list'],
  ['POST', '/salon/v1/clients/:customerId/data-copy', 'data', 'clients.data_copy', "Sent a client a copy of their data"],
  ['POST', '/salon/v1/data-requests/:id/complete', 'data', 'clients.delete_done', "Deleted a client's data"],
  ['POST', '/salon/v1/bookings/removeClient', 'data', 'clients.remove', 'Removed a client'],
  ['POST', '/salon/v1/active-block-customer', 'data', 'clients.block', 'Blocked or unblocked a client'],
  ['POST', '/salon/v1/send-custom-notifications/:audienceType', 'data', 'clients.message', 'Sent a message to clients'],
  ['POST', '/salon/v1/account-delete', 'data', 'account.delete', 'Asked to delete the account'],
]

const LABEL_OF = {
  ...Object.fromEntries(ACTIONS.map(([, , , action, label]) => [action, label])),
  'login.ok': 'Logged in',
  'login.failed': 'Failed login (wrong password)',
  'login.new_device': 'Confirmed a new device',
  'device.signed_out': 'Signed a device out',
  'security.managers_two_step': 'Changed two-step login for managers',
  'team.access_started': 'Branch access started (for a period)',
  'team.access_ended': 'Branch access ended (period over)',
  'team.access_late_bookings': 'Bookings left after a last day',
  'clients.delete_request': 'A client asked to delete their data',
  'role.create': 'Made a role',
  'role.update': 'Changed a role',
  'role.delete': 'Deleted a role',
  'role.assign': 'Gave someone a role',
  'approval.requested': 'Asked for approval',
  'approval.approved': 'Approved a request',
  'approval.declined': 'Declined a request',
  'approval.failed': 'Approved a request (it could not be made)',
}
const CATEGORIES = ['people', 'money', 'settings', 'data', 'security', 'approvals']

// '/a/:id/b' → { re: /^\/a\/([^/]+)\/b$/, names: ['id'] }
const compiled = ACTIONS.map(([method, pattern, category, action]) => {
  const names = []
  const re = new RegExp(`^${pattern.replace(/:[A-Za-z]+/g, (m) => { names.push(m.slice(1)); return '([^/]+)' })}/?$`)
  return { method, re, names, category, action }
})

function matchAction(method, path) {
  for (const c of compiled) {
    if (c.method !== method) continue
    const m = c.re.exec(path)
    if (m) return { ...c, params: Object.fromEntries(c.names.map((n, i) => [n, m[i + 1]])) }
  }
  return null
}

// What is kept from a request body: no secrets, no card or bank details, no
// files, short values only, at most 2 KB in all.
const SECRET = /pass|token|secret|otp|card|cvc|cvv|iban|sort.?code|account.?number|stripe|signature|image|photo|file|base64/i
function cleanDetails(value, depth = 0) {
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString()
  if (typeof value === 'string') return value.length > 200 ? `${value.slice(0, 200)}…` : value
  if (depth >= 3) return undefined
  if (Array.isArray(value)) {
    const out = value.slice(0, 20).map((v) => cleanDetails(v, depth + 1))
    if (value.length > 20) out.push(`…${value.length - 20} more`)
    return out
  }
  if (typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      if (SECRET.test(k)) continue
      const c = cleanDetails(v, depth + 1)
      if (c !== undefined) out[k] = c
    }
    return out
  }
  return undefined
}

function capped(details) {
  const json = JSON.stringify(details ?? {})
  return json.length <= 2048 ? details : { note: 'Too long to keep in full', keys: Object.keys(details || {}).slice(0, 30) }
}

const fullName = (u) => `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim()

/**
 * Save one entry. entry: { brandId, salonDetailId, actorUserId, actorName,
 * actorRole, category, action, details, result, message, ip }.
 */
async function record(entry) {
  try {
    let { brandId, salonDetailId, actorName } = entry
    if (salonDetailId && brandId === undefined) {
      const s = await db.salonDetail.findByPk(salonDetailId, { attributes: ['brandId'] })
      brandId = s ? s.brandId : null
    }
    if (!actorName && entry.actorUserId) {
      actorName = fullName(await db.user.findByPk(entry.actorUserId, { attributes: ['firstName', 'lastName'] }))
    }
    return await db.activityLog.create({
      ...entry,
      brandId: brandId ?? null,
      actorName: actorName || null,
      details: capped(cleanDetails(entry.details) ?? null),
      message: entry.message ? String(entry.message).slice(0, 255) : null,
    })
  } catch (err) {
    console.error('[activityLog] could not save:', err.message)
    return null
  }
}

// The 5th wrong password within 15 minutes: email the person (once).
async function failedLoginAlert(userId) {
  const { Op } = require('sequelize')
  const since = new Date(Date.now() - 15 * 60 * 1000)
  const n = await db.activityLog.count({ where: { actorUserId: userId, action: 'login.failed', createdAt: { [Op.gte]: since } } })
  if (n !== 4) return // this one is the 5th; it is saved right after
  const u = await db.user.findByPk(userId, { attributes: ['email', 'firstName'] })
  if (!u?.email) return
  const { transporter } = require('./transpoter')
  await transporter.sendMail({
    from: process.env.EMAIL_USERNAME,
    to: [u.email],
    subject: 'Several failed logins to your Trim Business account',
    text: `Hi ${u.firstName || 'there'},\n\nThere were 5 failed attempts to log in to your Trim Business account in the last 15 minutes. If this wasn't you, change your password now.\n\nTrim`,
  })
}

/**
 * A business-app login. Successful ones carry the branch from the login; for
 * failed ones the person's home shop is looked up (their own, or where they work).
 */
async function recordLogin(userId, { ok, ip, newDevice, salonId, brandId, role }) {
  try {
    if (!salonId) {
      const own = await db.salonDetail.findOne({ where: { userId }, attributes: ['id', 'brandId'], order: [['id', 'ASC']] })
      const work = own ? null : await db.employee.findOne({
        where: { userId, deleted: false }, attributes: ['salonDetailId', 'role'], order: [['id', 'ASC']],
      })
      salonId = own?.id || work?.salonDetailId || null
      brandId = own ? own.brandId : undefined
      role = own ? 'owner' : work?.role || null
    }
    if (!ok) failedLoginAlert(userId).catch(() => {})
    return await record({
      salonDetailId: salonId,
      brandId,
      actorUserId: userId,
      actorRole: role || null,
      category: 'security',
      action: ok ? 'login.ok' : 'login.failed',
      details: ok ? { newDevice: !!newDevice } : {},
      result: ok ? 'ok' : 'failed',
      message: ok ? null : 'Wrong password',
      ip: ip || null,
    })
  } catch (err) {
    console.error('[activityLog] login not saved:', err.message)
    return null
  }
}

// The answers the permission guards give (middlewares/shopRole, branchScope).
const DENIED = /don't have access|only the shop owner|not in your shop|belongs to another|only change your own|can't change your own|approval is not valid/i

const ipOf = (req) => String(req.headers?.['x-forwarded-for'] || req.ip || '').split(',')[0].trim() || null

/**
 * Called from branchScope once the acting branch is known. If this request is
 * one we record, save it when the answer goes out.
 */
function watch(req, res) {
  if (res._activityWatched) return
  const path = `${req.baseUrl || ''}${req.path || ''}`
  const hit = matchAction(req.method, path)
  if (!hit) return
  res._activityWatched = true
  let body
  const json = res.json.bind(res)
  res.json = (b) => {
    body = b
    return json(b)
  }
  const branch = req.branch || {}
  const details = { ...hit.params, ...(req.body && typeof req.body === 'object' ? req.body : {}) }
  res.on('finish', () => {
    // Held for approval: approvals.createRequest has logged it already.
    if (body?.data?.code === 'APPROVAL_SENT') return
    if (req.approvalRequestId) details.approvalRequest = req.approvalRequestId
    const ok = res.statusCode < 400 && body && String(body.status) === '1'
    const denied = !ok && body && DENIED.test(String(body.message || ''))
    record({
      brandId: branch.brandId ?? undefined,
      // Branch actions are about the branch in the path, not the one open.
      ...(hit.params.salonId ? { brandId: undefined, salonDetailId: Number(hit.params.salonId) || null } : { salonDetailId: branch.salonId ?? null }),
      actorUserId: req.user?.staffUserId || branch.staffUserId || req.user?.id || null,
      actorRole: branch.role || null,
      category: hit.category,
      action: hit.action,
      details,
      result: ok ? 'ok' : denied ? 'denied' : 'failed',
      message: ok ? null : body?.message,
      ip: ipOf(req),
    })
  })
}

module.exports = { ACTIONS, LABEL_OF, CATEGORIES, matchAction, cleanDetails, record, recordLogin, watch }
