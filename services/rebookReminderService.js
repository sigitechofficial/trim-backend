const { Op, QueryTypes } = require('sequelize')
const {
  booking,
  user,
  deviceToken,
  rebookReminder,
  rebookReminderConfig,
  sequelize,
} = require('../models')
const Throw = require('../utils/throwNotification')

// Same salon-subscription rule that gates the "Book again" / "Rebook" buttons
// (Home's rule, incl. external-employee → parent salon). Returns a Map of
// salon id → { active, name } for the given ids, evaluated on `dateOnly`.
async function getSalonInfo(salonIds, dateOnly) {
  const info = new Map()
  if (!salonIds || salonIds.length === 0) return info
  const rows = await sequelize.query(
    `SELECT s.id AS id, s.salonName AS salonName,
      (CASE
        WHEN s.isExternalEmployee = 1 THEN (
          SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
          FROM salonDetails p
          WHERE p.id = s.parentSalonId
            AND p.registrationExpiryDate >= :dateOnly
            AND (p.subscriptionLatestPaymentStatus IS NULL
                 OR p.subscriptionLatestPaymentStatus NOT IN ('expired','cancelled','canceled','payment_failed','paused','refunded')))
        ELSE (CASE
          WHEN s.registrationExpiryDate >= :dateOnly
            AND s.subscriptionLatestPaymentStatus IS NOT NULL
            AND s.subscriptionLatestPaymentStatus NOT IN ('expired','payment_failed','paused','refunded')
          THEN 1 ELSE 0 END)
      END) AS active
     FROM salonDetails s
     WHERE s.id IN (:salonIds)`,
    {
      replacements: { dateOnly, salonIds },
      type: QueryTypes.SELECT,
    },
  )
  for (const r of rows) {
    info.set(r.id, { active: Number(r.active) === 1, name: r.salonName || '' })
  }
  return info
}

// Fill {salonName} (case-insensitive) in an admin-configured template.
function applyTemplate(template, salonName) {
  return String(template || '').replace(/\{salonName\}/gi, salonName || '')
}

// ─── Small date helpers (UTC-based, so no server-timezone drift) ────────────

const MS_PER_DAY = 24 * 60 * 60 * 1000

// Parse a DATEONLY value ('YYYY-MM-DD' or Date) into a UTC-midnight Date.
function toUtcMidnight(value) {
  const s = String(value).slice(0, 10) // 'YYYY-MM-DD'
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function todayUtcMidnight() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function diffInDays(a, b) {
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY)
}

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY)
}

function toDateOnlyString(date) {
  return date.toISOString().slice(0, 10)
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

// ─── Config (single row, created with defaults on first use) ────────────────

async function getConfig() {
  let config = await rebookReminderConfig.findOne({ order: [['id', 'ASC']] })
  if (!config) {
    config = await rebookReminderConfig.create({})
  }
  return config
}

// ─── Core run ───────────────────────────────────────────────────────────────
//
// Scans every customer's completed bookings, works out when their next
// booking is "due" based on their own cadence, and sends a rebooking push to
// those whose due date has arrived (and who have no upcoming booking).
//
// options.dryRun => calculate + report, but do not send or write log rows.

async function run(options = {}) {
  const dryRun = !!options.dryRun
  const config = await getConfig()

  const summary = {
    enabled: config.isEnabled,
    dryRun,
    customersWithHistory: 0,
    due: 0,
    sent: 0,
    suppressedUpcoming: 0,
    alreadyReminded: 0,
    notYetDue: 0,
    noDeviceToken: 0,
    sentWithSalon: 0,
    sentGeneric: 0,
    errors: 0,
  }

  if (!config.isEnabled) {
    return summary
  }

  const today = todayUtcMidnight()
  const todayStr = toDateOnlyString(today)

  // 1) All completed bookings, grouped by customer (ascending by date).
  const completedRows = await booking.findAll({
    where: { status: 'complete', customerId: { [Op.ne]: null } },
    attributes: ['customerId', 'on', 'salonDetailId'],
    order: [
      ['customerId', 'ASC'],
      ['on', 'ASC'],
    ],
    raw: true,
  })

  const datesByCustomer = new Map()
  // Salon of each customer's most recent completed booking (the one they'd
  // naturally rebook). Ascending order means the last row wins = latest.
  const lastSalonByCustomer = new Map()
  for (const row of completedRows) {
    if (!row.on) continue
    const list = datesByCustomer.get(row.customerId) || []
    list.push(toUtcMidnight(row.on))
    datesByCustomer.set(row.customerId, list)
    if (row.salonDetailId != null) {
      lastSalonByCustomer.set(row.customerId, row.salonDetailId)
    }
  }
  summary.customersWithHistory = datesByCustomer.size

  // Cache of salon-id → { active, name } so we query each salon at most once.
  const salonInfoCache = new Map()
  const getSalon = async (salonId) => {
    if (salonId == null) return { active: false, name: '' }
    if (salonInfoCache.has(salonId)) return salonInfoCache.get(salonId)
    const infoMap = await getSalonInfo([salonId], todayStr)
    const info = infoMap.get(salonId) || { active: false, name: '' }
    salonInfoCache.set(salonId, info)
    return info
  }

  // 2) Customers who already have an upcoming booking → suppress (no nudge).
  const upcomingRows = await booking.findAll({
    where: {
      status: { [Op.in]: ['pending', 'book'] },
      on: { [Op.gte]: toDateOnlyString(today) },
      customerId: { [Op.ne]: null },
    },
    attributes: ['customerId'],
    group: ['customerId'],
    raw: true,
  })
  const upcomingCustomers = new Set(upcomingRows.map((r) => r.customerId))

  // 3) Evaluate each customer.
  for (const [customerId, dates] of datesByCustomer.entries()) {
    try {
      if (upcomingCustomers.has(customerId)) {
        summary.suppressedUpcoming += 1
        continue
      }

      const count = dates.length
      const lastDate = dates[count - 1]

      let intervalDays
      let basis
      let avgGapDays = null

      if (count === 1) {
        basis = 'single'
        intervalDays = config.singleBookingDays
      } else {
        basis = 'average'
        let totalGap = 0
        for (let i = 1; i < count; i += 1) {
          totalGap += diffInDays(dates[i], dates[i - 1])
        }
        const rawAvg = Math.round(totalGap / (count - 1))
        avgGapDays = clamp(rawAvg, config.minIntervalDays, config.maxIntervalDays)
        intervalDays = avgGapDays
      }

      const dueDate = addDays(lastDate, intervalDays)

      if (today < dueDate) {
        summary.notYetDue += 1
        continue
      }

      summary.due += 1

      // Already reminded for THIS cycle? Any reminder created since the last
      // completed booking means we've nudged them for the current cadence.
      const already = await rebookReminder.findOne({
        where: {
          customerId,
          createdAt: { [Op.gte]: lastDate },
        },
      })
      if (already) {
        summary.alreadyReminded += 1
        continue
      }

      // Load the customer + their device tokens; skip inactive/deleted.
      const customer = await user.findByPk(customerId, {
        include: [{ model: deviceToken, attributes: ['tokenId'] }],
      })
      if (!customer || customer.deleted === true || customer.status === false) {
        continue
      }

      const tokens = (customer.deviceTokens || [])
        .map((t) => t.tokenId)
        .filter((t) => !!t)

      if (tokens.length === 0) {
        // No device to reach — don't log, so they get reminded once a token
        // reappears and they're still due.
        summary.noDeviceToken += 1
        continue
      }

      // Reuse the "Book again" subscription check on the customer's last salon.
      // Active  → salon-oriented copy + tap opens that salon (rebook it).
      // Expired/cancelled → generic copy + tap goes to Home (never a dead salon).
      const lastSalonId = lastSalonByCustomer.get(customerId)
      const lastSalon = await getSalon(lastSalonId)
      const salonOriented = lastSalon.active && lastSalonId != null

      const notifData = { type: 'rebookReminder' }
      let title
      let body
      if (salonOriented) {
        notifData.salonId = String(lastSalonId)
        title = applyTemplate(config.salonTitle, lastSalon.name)
        body = applyTemplate(config.salonBody, lastSalon.name)
      } else {
        title = config.title
        body = config.body
      }

      if (dryRun) {
        // Report the split that WOULD be sent, without sending or logging.
        if (salonOriented) summary.sentWithSalon += 1
        else summary.sentGeneric += 1
        continue
      }

      await Throw(tokens, { title, body }, notifData, customerId)

      await rebookReminder.create({
        customerId,
        dueDate: toDateOnlyString(dueDate),
        sentAt: new Date(),
        basis,
        bookingsCount: count,
        avgGapDays,
      })

      if (notifData.salonId) summary.sentWithSalon += 1
      else summary.sentGeneric += 1
      summary.sent += 1
    } catch (err) {
      summary.errors += 1
      console.error(`[RebookReminder] customer ${customerId} error:`, err.message)
    }
  }

  return summary
}

module.exports = { run, getConfig }
