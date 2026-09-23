/**
 * Idempotent, targeted schema setup for the rebooking-reminder feature.
 *
 * The app runs with global `sync({ alter: true })` DISABLED (see trim.js), so
 * new model tables are NOT auto-created. These two tables are brand new, so a
 * plain `Model.sync()` (CREATE TABLE IF NOT EXISTS — no alter, no force) safely
 * creates them if missing and does nothing when they already exist. It never
 * touches any other table. Safe to run on every boot.
 */

async function ensureRebookReminderSchema(db) {
  await db.rebookReminderConfig.sync()
  await db.rebookReminder.sync()
}

module.exports = { ensureRebookReminderSchema }
