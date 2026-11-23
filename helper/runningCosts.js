// Running Costs (admin): what it costs to run Trim each month.
//
// - AWS: Cost Explorer (this month so far, forecast, last month, by service,
//   live vs stage by the 'env' cost tag, last 30 days). Cost Explorer charges
//   $0.01 per request and AWS updates its numbers up to 3 times a day, so the
//   answer is kept in runningCostCache and fetched twice a day
//   (jobs/runningCostCron.js) or when an admin presses Refresh (at most hourly).
// - Other running costs the admin types in once (hosting, Firebase, stores...).
// - A monthly budget: emails at 80% and 100% of it (once each per month).
// - Cost per active shop and per booking, from Trim's own numbers.
// AWS bills in USD; amounts are shown in GBP at the day's rate (USD too).
const { Op } = require('sequelize')
const db = require('../models')

const REFRESH_GAP_MS = 60 * 60 * 1000 // manual refresh: at most once an hour
const FALLBACK_USD_GBP = Number(process.env.USD_GBP_RATE) || 0.79

// AWS service names → words an owner understands.
const SERVICE_NAMES = {
  'Amazon Elastic Container Service': 'App servers',
  'Amazon EC2 Container Registry (ECR)': 'App versions (images)',
  'Amazon Relational Database Service': 'Database',
  'Amazon Simple Storage Service': 'Files and photos',
  'Amazon CloudFront': 'Website delivery',
  'Elastic Load Balancing': 'Load balancer',
  'Amazon Elastic Load Balancing': 'Load balancer',
  'Amazon Elastic Compute Cloud - Compute': 'Network gateway server',
  'EC2 - Other': 'Network and disks',
  'Amazon Virtual Private Cloud': 'Network (public addresses)',
  'Amazon Elastic File System': 'Shared upload storage',
  'AWS Secrets Manager': 'Passwords vault',
  AmazonCloudWatch: 'Logs and monitoring',
  'Amazon CloudWatch': 'Logs and monitoring',
  'Amazon Route 53': 'Domain names',
  'AWS Key Management Service': 'Encryption keys',
  'Amazon Simple Notification Service': 'Alerts',
  'AWS Cost Explorer': 'Cost reports (this page)',
  Tax: 'Tax',
}
const plainName = (s) => SERVICE_NAMES[s] || s

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100
const iso = (d) => d.toISOString().slice(0, 10)

async function ensureRunningCostSchema() {
  const q = (sql) => db.sequelize.query(sql)
  await q(`CREATE TABLE IF NOT EXISTS runningCostCache (
    \`key\` VARCHAR(64) NOT NULL PRIMARY KEY, payload LONGTEXT NULL, fetchedAt DATETIME NULL)`)
  await q(`CREATE TABLE IF NOT EXISTS runningCostSettings (
    id INT NOT NULL PRIMARY KEY, monthlyBudget DECIMAL(10,2) NULL, alertEmails VARCHAR(500) NULL,
    alertedMonth CHAR(7) NULL, alertedLevel INT NULL, updatedAt DATETIME NULL)`)
  await q(`CREATE TABLE IF NOT EXISTS runningCostItems (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, category VARCHAR(40) NULL,
    amountMonthly DECIMAL(10,2) NOT NULL, currency CHAR(3) NOT NULL DEFAULT 'GBP', notes VARCHAR(255) NULL,
    active TINYINT(1) NOT NULL DEFAULT 1, createdAt DATETIME NULL, updatedAt DATETIME NULL)`)
  console.log('[runningCostSchema] ensured')
}

async function cacheGet(key) {
  const [rows] = await db.sequelize.query('SELECT payload, fetchedAt FROM runningCostCache WHERE `key` = :key', { replacements: { key } })
  if (!rows.length || !rows[0].payload) return null
  try {
    return { value: JSON.parse(rows[0].payload), fetchedAt: rows[0].fetchedAt }
  } catch (_) {
    return null
  }
}

async function cacheSet(key, value) {
  await db.sequelize.query(
    'INSERT INTO runningCostCache (`key`, payload, fetchedAt) VALUES (:key, :payload, UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE payload = VALUES(payload), fetchedAt = UTC_TIMESTAMP()',
    { replacements: { key, payload: JSON.stringify(value) } },
  )
}

// A small JSON GET with Node's https (global fetch crashes under Sentry's hook).
function getJson(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const req = require('https').get(url, { timeout: timeoutMs }, (res) => {
      let body = ''
      res.on('data', (c) => { body += c })
      res.on('end', () => { try { resolve(JSON.parse(body)) } catch (e) { reject(e) } })
    })
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', reject)
  })
}

/** USD → GBP (and other currencies → GBP) for today; ECB rates (frankfurter.dev, no key), kept for the day. */
async function ratesToGbp() {
  const today = iso(new Date())
  const cached = await cacheGet('rates')
  if (cached?.value?.day === today) return cached.value
  try {
    const j = await getJson('https://api.frankfurter.dev/v1/latest?base=USD&symbols=GBP')
    const usd = Number(j?.rates?.GBP)
    if (!(usd > 0)) throw new Error('no rate')
    const eurRes = await getJson('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=GBP').catch(() => null)
    const value = { day: today, USD: usd, EUR: Number(eurRes?.rates?.GBP) || null, GBP: 1, source: 'ECB (frankfurter.dev)', rateDate: j.date }
    await cacheSet('rates', value)
    return value
  } catch (_) {
    return cached?.value || { day: today, USD: FALLBACK_USD_GBP, GBP: 1, source: 'fallback' }
  }
}

function costExplorer() {
  const { CostExplorerClient } = require('@aws-sdk/client-cost-explorer')
  // Cost Explorer only answers in us-east-1, whatever region the app runs in.
  return new CostExplorerClient({ region: 'us-east-1' })
}

const amountOf = (m) => Number(m?.UnblendedCost?.Amount || 0)

/** Ask AWS (4 requests) and keep the answer. Returns the stored object. */
async function fetchAws(now = new Date()) {
  const { GetCostAndUsageCommand, GetCostForecastCommand } = require('@aws-sdk/client-cost-explorer')
  const ce = costExplorer()
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const monthStart = new Date(Date.UTC(y, m, 1))
  const lastMonthStart = new Date(Date.UTC(y, m - 1, 1))
  const nextMonthStart = new Date(Date.UTC(y, m + 1, 1))
  const tomorrow = new Date(Date.UTC(y, m, now.getUTCDate() + 1))
  const thirtyAgo = new Date(Date.UTC(y, m, now.getUTCDate() - 29))
  const metric = ['UnblendedCost']

  // 1. Last month and this month, by service.
  const byService = await ce.send(new GetCostAndUsageCommand({
    TimePeriod: { Start: iso(lastMonthStart), End: iso(tomorrow) },
    Granularity: 'MONTHLY',
    Metrics: metric,
    GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
  }))
  const months = (byService.ResultsByTime || []).map((r) => ({
    start: r.TimePeriod.Start,
    total: round2((r.Groups || []).reduce((s, g) => s + amountOf(g.Metrics), 0)),
    services: (r.Groups || [])
      .map((g) => ({ service: g.Keys[0], amount: round2(amountOf(g.Metrics)) }))
      .filter((x) => x.amount >= 0.005)
      .sort((a, b) => b.amount - a.amount),
  }))
  const thisMonth = months.find((x) => x.start === iso(monthStart)) || { total: 0, services: [] }
  const lastMonth = months.find((x) => x.start === iso(lastMonthStart)) || { total: 0, services: [] }

  // 2. This month by the 'env' cost tag (live / stage / not labelled).
  let envs = []
  try {
    const byEnv = await ce.send(new GetCostAndUsageCommand({
      TimePeriod: { Start: iso(monthStart), End: iso(tomorrow) },
      Granularity: 'MONTHLY',
      Metrics: metric,
      GroupBy: [{ Type: 'TAG', Key: 'env' }],
    }))
    envs = (byEnv.ResultsByTime?.[0]?.Groups || []).map((g) => {
      const v = String(g.Keys[0] || '').replace(/^env\$/, '')
      return { env: v === 'stage' ? 'stage' : v === 'live' ? 'live' : 'shared', amount: round2(amountOf(g.Metrics)) }
    })
  } catch (err) {
    envs = []
  }

  // 3. The last 30 days, day by day.
  const daily = await ce.send(new GetCostAndUsageCommand({
    TimePeriod: { Start: iso(thirtyAgo), End: iso(tomorrow) },
    Granularity: 'DAILY',
    Metrics: metric,
  }))
  const days = (daily.ResultsByTime || []).map((r) => ({ day: r.TimePeriod.Start, amount: round2(amountOf(r.Total)) }))

  // 4. Forecast for the rest of the month (none on its last day).
  let forecastRest = 0
  if (iso(tomorrow) < iso(nextMonthStart)) {
    try {
      const f = await ce.send(new GetCostForecastCommand({
        TimePeriod: { Start: iso(tomorrow), End: iso(nextMonthStart) },
        Metric: 'UNBLENDED_COST',
        Granularity: 'MONTHLY',
      }))
      forecastRest = Number(f.Total?.Amount || 0)
    } catch (_) {
      forecastRest = 0
    }
  }
  const value = {
    currency: 'USD',
    month: iso(monthStart).slice(0, 7),
    monthToDate: thisMonth.total,
    forecastMonth: round2(thisMonth.total + forecastRest),
    lastMonth: lastMonth.total,
    services: thisMonth.services,
    envs,
    days,
  }
  await cacheSet('aws', value)
  return value
}

async function settings() {
  const [rows] = await db.sequelize.query('SELECT monthlyBudget, alertEmails, alertedMonth, alertedLevel FROM runningCostSettings WHERE id = 1')
  const r = rows[0] || {}
  return {
    monthlyBudget: r.monthlyBudget == null ? null : Number(r.monthlyBudget),
    alertEmails: r.alertEmails || '',
    alertedMonth: r.alertedMonth || null,
    alertedLevel: r.alertedLevel || 0,
  }
}

async function saveSettings({ monthlyBudget, alertEmails }) {
  const budget = monthlyBudget === '' || monthlyBudget == null ? null : Number(monthlyBudget)
  if (budget != null && !(budget >= 0 && budget < 1000000)) {
    const AppError = require('../utils/appError')
    throw new AppError('Enter the monthly budget in pounds, e.g. 150.', 200)
  }
  const emails = String(alertEmails || '').split(',').map((e) => e.trim()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).join(', ').slice(0, 500)
  await db.sequelize.query(
    `INSERT INTO runningCostSettings (id, monthlyBudget, alertEmails, updatedAt) VALUES (1, :b, :e, NOW())
     ON DUPLICATE KEY UPDATE monthlyBudget = VALUES(monthlyBudget), alertEmails = VALUES(alertEmails), updatedAt = NOW()`,
    { replacements: { b: budget, e: emails || null } },
  )
  return settings()
}

async function items() {
  const [rows] = await db.sequelize.query('SELECT id, name, category, amountMonthly, currency, notes, active FROM runningCostItems ORDER BY active DESC, name ASC')
  return rows.map((r) => ({ ...r, amountMonthly: Number(r.amountMonthly), active: !!r.active }))
}

function cleanItem(b = {}) {
  const AppError = require('../utils/appError')
  const name = String(b.name || '').trim().slice(0, 120)
  const amount = Number(b.amountMonthly)
  const currency = ['GBP', 'USD', 'EUR'].includes(String(b.currency || 'GBP').toUpperCase()) ? String(b.currency || 'GBP').toUpperCase() : null
  if (!name) throw new AppError('Give the cost a name, e.g. Firebase.', 200)
  if (!(amount >= 0 && amount < 1000000)) throw new AppError('Enter the monthly amount, e.g. 25.', 200)
  if (!currency) throw new AppError('Currency must be GBP, USD or EUR.', 200)
  return {
    name,
    category: String(b.category || 'Other').trim().slice(0, 40),
    amountMonthly: round2(amount),
    currency,
    notes: b.notes ? String(b.notes).slice(0, 255) : null,
    active: b.active === false || b.active === 0 ? 0 : 1,
  }
}

async function addItem(body) {
  const v = cleanItem(body)
  await db.sequelize.query(
    'INSERT INTO runningCostItems (name, category, amountMonthly, currency, notes, active, createdAt, updatedAt) VALUES (:name, :category, :amountMonthly, :currency, :notes, :active, NOW(), NOW())',
    { replacements: v },
  )
  return items()
}

async function updateItem(id, body) {
  const v = cleanItem(body)
  await db.sequelize.query(
    'UPDATE runningCostItems SET name = :name, category = :category, amountMonthly = :amountMonthly, currency = :currency, notes = :notes, active = :active, updatedAt = NOW() WHERE id = :id',
    { replacements: { ...v, id: Number(id) } },
  )
  return items()
}

async function deleteItem(id) {
  await db.sequelize.query('DELETE FROM runningCostItems WHERE id = :id', { replacements: { id: Number(id) } })
  return items()
}

/** Active shops now and bookings this month (UK calendar month). */
async function trimNumbers(now = new Date()) {
  const { activeSalonWhere } = require('./salonSubscriptionRule')
  const today = iso(now)
  const monthStart = today.slice(0, 8) + '01'
  // Shops (not chair renters) on an active plan today.
  const activeShops = await db.salonDetail.count({
    where: { ...activeSalonWhere(today), isExternalEmployee: { [Op.or]: [false, null] }, deleted: { [Op.or]: [false, null] } },
  })
  const bookings = await db.booking.count({ where: { on: { [Op.between]: [monthStart, today] }, status: { [Op.in]: ['book', 'complete', 'save-unpaid'] } } })
  return { activeShops, bookingsThisMonth: bookings }
}

/** Everything the Running Costs page shows. */
async function summary() {
  const [aws, rates, s, list, trim] = await Promise.all([cacheGet('aws'), ratesToGbp(), settings(), items(), trimNumbers()])
  const usdGbp = rates.USD
  const gbp = (usd) => round2(Number(usd || 0) * usdGbp)
  const a = aws?.value || null
  const toGbp = (amount, cur) => round2(Number(amount) * (cur === 'GBP' ? 1 : cur === 'EUR' ? rates.EUR || 0.86 : usdGbp))
  const other = list.filter((i) => i.active)
  const otherMonthly = round2(other.reduce((s2, i) => s2 + toGbp(i.amountMonthly, i.currency), 0))

  const out = {
    connected: !!a,
    fetchedAt: aws?.fetchedAt || null,
    rate: { usdToGbp: usdGbp, source: rates.source, date: rates.rateDate || rates.day },
    settings: { monthlyBudget: s.monthlyBudget, alertEmails: s.alertEmails },
    other: { items: list.map((i) => ({ ...i, monthlyGbp: toGbp(i.amountMonthly, i.currency) })), monthlyGbp: otherMonthly },
    trim,
  }
  if (!a) return out

  const days = a.days || []
  const avg = days.length > 7 ? days.slice(0, -1).reduce((x, d) => x + d.amount, 0) / (days.length - 1) : null
  out.aws = {
    month: a.month,
    monthToDate: { usd: a.monthToDate, gbp: gbp(a.monthToDate) },
    forecastMonth: { usd: a.forecastMonth, gbp: gbp(a.forecastMonth) },
    lastMonth: { usd: a.lastMonth, gbp: gbp(a.lastMonth) },
    changeVsLastMonth: a.lastMonth > 0 ? round2(((a.forecastMonth - a.lastMonth) / a.lastMonth) * 100) : null,
    services: (a.services || []).map((x) => ({ name: plainName(x.service), awsName: x.service, usd: x.amount, gbp: gbp(x.amount) })),
    envs: (a.envs || []).map((x) => ({ env: x.env, usd: x.amount, gbp: gbp(x.amount) })),
    envsLabelled: (a.envs || []).some((x) => x.env !== 'shared' && x.amount > 0),
    days: days.map((d) => ({ day: d.day, usd: d.amount, gbp: gbp(d.amount), spike: avg != null && avg > 0.5 && d.amount > avg * 1.5 })),
  }
  // Total cost of running Trim this month: AWS forecast + the other costs.
  out.totalMonthGbp = round2(gbp(a.forecastMonth) + otherMonthly)
  const monthly = gbp(a.forecastMonth) + otherMonthly
  out.unit = {
    perActiveShopGbp: trim.activeShops ? round2(monthly / trim.activeShops) : null,
    perBookingGbp: trim.bookingsThisMonth ? round2((gbp(a.monthToDate) + otherMonthly * (new Date().getUTCDate() / 30)) / trim.bookingsThisMonth) : null,
  }
  if (s.monthlyBudget != null) {
    const spent = gbp(a.monthToDate)
    out.budget = {
      amountGbp: s.monthlyBudget,
      spentGbp: spent,
      usedPct: s.monthlyBudget > 0 ? round2((spent / s.monthlyBudget) * 100) : null,
      forecastOver: gbp(a.forecastMonth) > s.monthlyBudget,
    }
  }
  return out
}

/** Fetch now when allowed (manual refresh at most hourly). */
async function refresh({ force = false } = {}) {
  const c = await cacheGet('aws')
  if (!force && c?.fetchedAt && Date.now() - new Date(c.fetchedAt).getTime() < REFRESH_GAP_MS) {
    return { refreshed: false, nextAt: new Date(new Date(c.fetchedAt).getTime() + REFRESH_GAP_MS) }
  }
  await fetchAws()
  await checkBudget()
  return { refreshed: true }
}

/** Email the admins at 80% and 100% of the monthly budget (once each a month). */
async function checkBudget() {
  try {
    const s = await settings()
    if (!(s.monthlyBudget > 0)) return null
    const c = await cacheGet('aws')
    if (!c?.value) return null
    const rates = await ratesToGbp()
    const spent = round2(c.value.monthToDate * rates.USD)
    const pct = (spent / s.monthlyBudget) * 100
    const level = pct >= 100 ? 100 : pct >= 80 ? 80 : 0
    const month = c.value.month
    const already = s.alertedMonth === month ? s.alertedLevel || 0 : 0
    if (!level || level <= already) return null
    const list = s.alertEmails
      ? s.alertEmails.split(',').map((e) => ({ email: e.trim(), firstName: 'Trim', lastName: 'team' }))
      : await db.user.findAll({ where: { userTypeId: 4, status: true }, attributes: ['email', 'firstName', 'lastName'] })
    const Email = require('../utils/Email')
    const html = `<p>Trim's AWS spending this month is <b>£${spent.toFixed(2)}</b>, ${Math.round(pct)}% of the £${Number(s.monthlyBudget).toFixed(2)} monthly budget.</p>
<p>Forecast for the whole month: £${round2(c.value.forecastMonth * rates.USD).toFixed(2)}.</p>
<p>Open the admin panel → <b>Running Costs</b> to see where the money goes.</p>`
    for (const a of list) {
      if (!a.email) continue
      await new Email(a).send(html, level >= 100 ? 'Trim running costs: monthly budget reached' : 'Trim running costs: 80% of the monthly budget used').catch(() => {})
    }
    await db.sequelize.query('UPDATE runningCostSettings SET alertedMonth = :m, alertedLevel = :l WHERE id = 1', { replacements: { m: month, l: level } })
    return level
  } catch (err) {
    console.error('[runningCosts] budget check failed:', err.message)
    return null
  }
}

module.exports = { ensureRunningCostSchema, summary, refresh, fetchAws, checkBudget, saveSettings, items, addItem, updateItem, deleteItem, plainName, ratesToGbp }
