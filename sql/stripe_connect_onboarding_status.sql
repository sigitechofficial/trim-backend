-- Stripe Connect onboarding status + reminder fields
-- Run manually (non-destructive). Ignore "Duplicate column" errors if a column already exists.
-- Sequelize model updated in models/salonDetails.js
--
-- After deploy, set env CRON_JOB_SECRET and call:
--   GET /auth/stripe-onboarding-reminders
-- with header: x-cron-secret: <CRON_JOB_SECRET>
-- or query: ?secret=<CRON_JOB_SECRET>
-- or Authorization: Bearer <CRON_JOB_SECRET>

ALTER TABLE salonDetails ADD COLUMN stripeOnboardingStatus VARCHAR(32) NULL DEFAULT 'NOT_STARTED';
ALTER TABLE salonDetails ADD COLUMN stripeDetailsSubmitted TINYINT(1) NULL DEFAULT 0;
ALTER TABLE salonDetails ADD COLUMN stripeChargesEnabled TINYINT(1) NULL DEFAULT 0;
ALTER TABLE salonDetails ADD COLUMN stripePayoutsEnabled TINYINT(1) NULL DEFAULT 0;
ALTER TABLE salonDetails ADD COLUMN stripeCurrentlyDue TEXT NULL;
ALTER TABLE salonDetails ADD COLUMN stripePastDue TEXT NULL;
ALTER TABLE salonDetails ADD COLUMN stripeDisabledReason VARCHAR(255) NULL;
ALTER TABLE salonDetails ADD COLUMN stripeRequirementsHash VARCHAR(64) NULL;
ALTER TABLE salonDetails ADD COLUMN stripeOnboardingStartedAt DATETIME NULL;
ALTER TABLE salonDetails ADD COLUMN stripeLastStripeActivityAt DATETIME NULL;
ALTER TABLE salonDetails ADD COLUMN stripeLastReminderSentAt DATETIME NULL;
ALTER TABLE salonDetails ADD COLUMN stripeLastPayoutBlockedEmailSentAt DATETIME NULL;
ALTER TABLE salonDetails ADD COLUMN stripeReminderStage VARCHAR(16) NULL DEFAULT 'none';

-- Webhook event deduplication (CREATE IF NOT EXISTS is safe to re-run)
CREATE TABLE IF NOT EXISTS stripeWebhookEvents (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  eventId VARCHAR(255) NOT NULL,
  eventType VARCHAR(100) NULL,
  accountId VARCHAR(100) NULL,
  processedAt DATETIME NOT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  UNIQUE KEY stripe_webhook_events_event_id_unique (eventId),
  KEY stripe_webhook_events_account_id_index (accountId)
);
