// Brand-level report: every branch side by side, for the owner and for a
// manager of every branch they work in. Same rules as the branch reports:
// takings = completed bookings' total, dates are the booking day (UK).
//
// GET /salon/v1/brand-report?from=YYYY-MM-DD&to=YYYY-MM-DD[&format=csv]
const { QueryTypes } = require('sequelize')
const { DateTime } = require('luxon')
const db = require('../models')
const { staffLevel } = require('../middlewares/shopRole')
const { resolveRequestActor } = require('./bookingRequestAccess')

const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''))
const num = (v) => Number(v || 0)
const round2 = (v) => Math.round(num(v) * 100) / 100
const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0)

/**
 * The branches this caller may see in the brand report, and whether they may
 * see money for each. null when they may not use it at all.
 */
async function reportScope(req) {
  const actor = req._actor || (req._actor = await resolveRequestActor(req))
  if (!actor.shopId) return null
  if (actor.isOwner) {
    const shops = await db.salonDetail.findAll({
      where: { userId: req.user.id, isExternalEmployee: false, deleted: false },
      attributes: ['id', 'salonName', 'closedAt', 'pausedReason'],
      order: [['id', 'ASC']],
    })
    return shops.map((s) => ({ shop: s, money: true }))
  }
  const staffUserId = req.user?.staffUserId
  if (!staffUserId) return null
  const rows = await db.employee.findAll({
    where: { userId: staffUserId, deleted: false },
    attributes: ['id', 'salonDetailId', 'role'],
  })
  // Only someone who is a manager in every branch they work in.
  if (rows.length < 2 || rows.some((e) => e.role !== 'manager')) return null
  const shops = await db.salonDetail.findAll({
    where: { id: rows.map((e) => e.salonDetailId), deleted: false },
    attributes: ['id', 'salonName', 'closedAt', 'pausedReason'],
    order: [['id', 'ASC']],
  })
  const empOf = new Map(rows.map((e) => [e.salonDetailId, e.id]))
  const out = []
  for (const s of shops) {
    const level = await staffLevel(empOf.get(s.id), s.id, 'takings')
    out.push({ shop: s, money: level !== 'none' })
  }
  return out
}

/** Day, week or month buckets so the trend stays readable. */
function bucketOf(start, end) {
  const days = DateTime.fromISO(end).diff(DateTime.fromISO(start), 'days').days + 1
  if (days <= 31) return { unit: 'day', sql: "DATE_FORMAT(b.`on`, '%Y-%m-%d')" }
  if (days <= 120) return { unit: 'week', sql: "DATE_FORMAT(DATE_SUB(b.`on`, INTERVAL WEEKDAY(b.`on`) DAY), '%Y-%m-%d')" }
  return { unit: 'month', sql: "DATE_FORMAT(b.`on`, '%Y-%m')" }
}

async function brandReport(scope, { from, to } = {}) {
  const today = DateTime.now().setZone('Europe/London')
  const start = isDate(from) ? from : today.startOf('month').toISODate()
  const end = isDate(to) ? to : today.toISODate()
  const ids = scope.map((x) => x.shop.id)
  const money = new Map(scope.map((x) => [x.shop.id, x.money]))
  const anyMoney = scope.some((x) => x.money)
  const q = (sql, extra = {}) =>
    db.sequelize.query(sql, { replacements: { ids, start, end, ...extra }, type: QueryTypes.SELECT })

  // Per branch: bookings by outcome, takings, clients.
  const perBranch = await q(
    `SELECT b.salonDetailId AS id,
            SUM(b.status = 'complete') AS completed,
            SUM(b.status = 'cancel') AS cancelled,
            SUM(b.status = 'no-show') AS noShows,
            SUM(b.status IN ('complete', 'cancel', 'no-show', 'book', 'pending')) AS bookings,
            ROUND(SUM(CASE WHEN b.status = 'complete' THEN b.total ELSE 0 END), 2) AS takings,
            COUNT(DISTINCT CASE WHEN b.status = 'complete' THEN b.customerId END) AS clients
       FROM bookings b
      WHERE b.salonDetailId IN (:ids) AND b.\`on\` BETWEEN :start AND :end
      GROUP BY b.salonDetailId`,
  )
  // New clients: their first completed visit anywhere in the brand is in the range.
  const newClients = await q(
    `SELECT f.salonDetailId AS id, COUNT(*) AS n FROM (
        SELECT b.customerId, MIN(b.\`on\`) AS firstOn,
               SUBSTRING_INDEX(GROUP_CONCAT(b.salonDetailId ORDER BY b.\`on\`, b.id), ',', 1) AS salonDetailId
          FROM bookings b
         WHERE b.salonDetailId IN (:ids) AND b.status = 'complete' AND b.customerId IS NOT NULL
         GROUP BY b.customerId) f
      WHERE f.firstOn BETWEEN :start AND :end
      GROUP BY f.salonDetailId`,
  )
  const row = new Map(perBranch.map((r) => [Number(r.id), r]))
  const fresh = new Map(newClients.map((r) => [Number(r.id), num(r.n)]))
  const branches = scope.map(({ shop }) => {
    const r = row.get(shop.id) || {}
    const completed = num(r.completed)
    const showMoney = money.get(shop.id)
    const takings = showMoney ? round2(r.takings) : null
    const clients = num(r.clients)
    const newC = Math.min(fresh.get(shop.id) || 0, clients)
    return {
      salonId: shop.id,
      name: shop.salonName,
      state: shop.closedAt ? 'closed' : shop.pausedReason ? 'paused' : 'open',
      bookings: num(r.bookings),
      completed,
      cancelled: num(r.cancelled),
      noShows: num(r.noShows),
      cancelRate: pct(num(r.cancelled), num(r.bookings)),
      noShowRate: pct(num(r.noShows), num(r.bookings)),
      takings,
      averageBill: showMoney ? (completed ? round2(num(r.takings) / completed) : 0) : null,
      clients,
      newClients: newC,
      returningClients: clients - newC,
    }
  })

  const sum = (k) => branches.reduce((n, b) => n + num(b[k]), 0)
  const moneyRows = branches.filter((b) => b.takings != null)
  // A total only when every branch's money is visible; otherwise it would
  // look like the whole business.
  const allMoney = scope.every((x) => x.money)
  const totals = {
    bookings: sum('bookings'),
    completed: sum('completed'),
    cancelled: sum('cancelled'),
    noShows: sum('noShows'),
    cancelRate: pct(sum('cancelled'), sum('bookings')),
    noShowRate: pct(sum('noShows'), sum('bookings')),
    takings: allMoney ? round2(moneyRows.reduce((n, b) => n + b.takings, 0)) : null,
    averageBill: allMoney
      ? (() => {
          const c = moneyRows.reduce((n, b) => n + b.completed, 0)
          return c ? round2(moneyRows.reduce((n, b) => n + b.takings, 0) / c) : 0
        })()
      : null,
    clients: sum('clients'),
    newClients: sum('newClients'),
    returningClients: sum('returningClients'),
  }

  // Trend: takings (or completed bookings without money) per bucket and branch.
  const bucket = bucketOf(start, end)
  const trendRows = await q(
    `SELECT ${bucket.sql} AS period, b.salonDetailId AS id,
            SUM(b.status = 'complete') AS completed,
            ROUND(SUM(CASE WHEN b.status = 'complete' THEN b.total ELSE 0 END), 2) AS takings
       FROM bookings b
      WHERE b.salonDetailId IN (:ids) AND b.\`on\` BETWEEN :start AND :end
      GROUP BY period, b.salonDetailId
      ORDER BY period`,
  )
  const periods = [...new Set(trendRows.map((r) => r.period))]
  const trend = {
    unit: bucket.unit,
    measure: anyMoney ? 'takings' : 'completed',
    periods: periods.map((p) => ({
      period: p,
      values: Object.fromEntries(scope.map(({ shop }) => {
        const r = trendRows.find((x) => x.period === p && Number(x.id) === shop.id)
        const v = anyMoney ? (money.get(shop.id) ? round2(r?.takings) : null) : num(r?.completed)
        return [shop.id, v]
      })),
    })),
  }

  // Top services and staff from completed bookings' services.
  const services = await q(
    `SELECT TRIM(s.serviceName) AS name, COUNT(*) AS count,
            ROUND(SUM(j.total), 2) AS takings,
            GROUP_CONCAT(DISTINCT b.salonDetailId) AS branchIds
       FROM jobs j
       JOIN bookings b ON b.id = j.bookingId
       JOIN services s ON s.id = j.serviceId
      WHERE b.salonDetailId IN (:ids) AND b.status = 'complete' AND j.deletedAt IS NULL
        AND b.\`on\` BETWEEN :start AND :end
      GROUP BY TRIM(s.serviceName)
      ORDER BY count DESC
      LIMIT 10`,
  )
  const staff = await q(
    `SELECT u.id AS userId, TRIM(CONCAT(IFNULL(u.firstName, ''), ' ', IFNULL(u.lastName, ''))) AS name,
            b.salonDetailId AS id, COUNT(*) AS count, ROUND(SUM(j.total), 2) AS takings
       FROM jobs j
       JOIN bookings b ON b.id = j.bookingId
       JOIN employees e ON e.id = j.employeeId
       JOIN users u ON u.id = e.userId
      WHERE b.salonDetailId IN (:ids) AND b.status = 'complete' AND j.deletedAt IS NULL
        AND b.\`on\` BETWEEN :start AND :end
      GROUP BY u.id, b.salonDetailId
      ORDER BY count DESC
      LIMIT 10`,
  )
  const nameOf = new Map(scope.map(({ shop }) => [shop.id, shop.salonName]))
  return {
    from: start,
    to: end,
    showsMoney: anyMoney,
    allMoney,
    branches,
    totals,
    trend,
    topServices: services.map((s) => ({
      name: s.name,
      count: num(s.count),
      // Money only when the caller sees money for every branch it came from.
      takings: String(s.branchIds || '').split(',').every((id) => money.get(Number(id))) ? round2(s.takings) : null,
      branches: String(s.branchIds || '').split(',').filter(Boolean).map((id) => nameOf.get(Number(id))).filter(Boolean),
    })),
    topStaff: staff.map((s) => ({
      name: s.name || 'Team member',
      branch: nameOf.get(Number(s.id)) || '',
      count: num(s.count),
      takings: money.get(Number(s.id)) ? round2(s.takings) : null,
    })),
  }
}

/** The report as a CSV (one row per branch, then the total). */
function toCsv(report) {
  const cols = [
    ['Branch', (b) => b.name], ['Bookings', (b) => b.bookings], ['Completed', (b) => b.completed],
    ['Cancelled', (b) => b.cancelled], ['No-shows', (b) => b.noShows], ['Cancel %', (b) => b.cancelRate],
    ['No-show %', (b) => b.noShowRate], ['Takings', (b) => b.takings ?? ''], ['Average bill', (b) => b.averageBill ?? ''],
    ['Clients', (b) => b.clients], ['New clients', (b) => b.newClients], ['Returning clients', (b) => b.returningClients],
  ]
  const cell = (v) => {
    const t = String(v ?? '')
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }
  const lines = [`Report ${report.from} to ${report.to}`, cols.map((c) => c[0]).join(',')]
  for (const b of report.branches) lines.push(cols.map((c) => cell(c[1](b))).join(','))
  lines.push(cols.map((c, i) => cell(i === 0 ? 'All branches' : c[1](report.totals))).join(','))
  return lines.join('\n') + '\n'
}

async function handler(req, res) {
  const scope = await reportScope(req)
  if (!scope || !scope.length) {
    return res.json({ status: '0', message: 'Only the owner, or a manager of every branch they work in, can see the brand report.', data: {}, error: '' })
  }
  const report = await brandReport(scope, { from: req.query?.from, to: req.query?.to })
  if (String(req.query?.format) === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="brand-report-${report.from}-to-${report.to}.csv"`)
    return res.send(toCsv(report))
  }
  return res.json({ status: '1', message: 'Brand report', data: report, error: '' })
}

module.exports = { reportScope, brandReport, toCsv, handler }
