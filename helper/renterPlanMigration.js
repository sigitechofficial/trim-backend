/**
 * One-time data step for "chair renters pay for their own plan", run by the
 * server on start-up so nobody has to run SQL by hand.
 *
 * Until now a renter was covered by the host shop's subscription, so renter
 * rows have no plan date of their own. The new rule (helper/salonSubscriptionRule.js)
 * lists a renter only on their own plan, so before the server takes any
 * request every existing renter gets 30 free days (status 'renter_switch').
 *
 * Runs once per database: a row in `appMigrations` records it. The old values
 * are kept in `renterSubscriptionBackup` (sql/renter_own_subscription_rollback.sql
 * puts them back). sql/renter_own_subscription.sql does the same by hand.
 */

const NAME = 'renter_own_subscription_v1'

async function runRenterPlanMigration(db) {
  const q = (sql, replacements) => db.sequelize.query(sql, { replacements })

  await q(`CREATE TABLE IF NOT EXISTS \`appMigrations\` (
    \`name\` VARCHAR(100) NOT NULL PRIMARY KEY,
    \`ranAt\` DATETIME NOT NULL
  )`)
  const [done] = await q('SELECT name FROM `appMigrations` WHERE name = :name', { name: NAME })
  if (done.length) return { ran: false }

  await q(`CREATE TABLE IF NOT EXISTS \`renterSubscriptionBackup\` AS
    SELECT id, registrationExpiryDate, subscriptionLatestPaymentStatus, NOW() AS backedUpAt
    FROM \`salonDetails\`
    WHERE isExternalEmployee = 1 AND deleted = 0`)

  // A renter who already has their own plan running keeps it as it is.
  const [result] = await q(`UPDATE \`salonDetails\`
    SET registrationExpiryDate = DATE_ADD(CURDATE(), INTERVAL 30 DAY),
        subscriptionLatestPaymentStatus = 'renter_switch',
        renterPlanReminderDays = NULL
    WHERE isExternalEmployee = 1
      AND deleted = 0
      AND (registrationExpiryDate IS NULL OR registrationExpiryDate < CURDATE())`)

  // Renters still blocked under the old rule (a host's downgrade or transfer
  // used to block them). Not unblocked here: some may be blocked on purpose.
  const [blocked] = await q(`SELECT s.id, s.salonName, u.email
    FROM \`salonDetails\` s JOIN \`users\` u ON u.id = s.userId
    WHERE s.isExternalEmployee = 1 AND s.deleted = 0 AND u.deleted = 0 AND (u.status = 0 OR s.status = 0)`)

  await q('INSERT INTO `appMigrations` (name, ranAt) VALUES (:name, NOW())', { name: NAME })
  return { ran: true, renters: result?.affectedRows ?? null, blocked }
}

module.exports = { runRenterPlanMigration }
