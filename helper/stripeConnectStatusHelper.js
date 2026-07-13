const crypto = require('crypto')

const STRIPE_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  ACTION_REQUIRED: 'ACTION_REQUIRED',
  PAYOUTS_BLOCKED: 'PAYOUTS_BLOCKED',
  COMPLETE: 'COMPLETE',
}

const REMINDER_STAGE = {
  NONE: 'none',
  H24: '24h',
  H72: '72h',
  D7: '7d',
  DONE: 'done',
}

const PAYOUT_BLOCKED_EMAIL_COOLDOWN_MS = 72 * 60 * 60 * 1000 // 72 hours
const REMINDER_24H_MS = 24 * 60 * 60 * 1000
const REMINDER_72H_MS = 72 * 60 * 60 * 1000
const REMINDER_7D_MS = 7 * 24 * 60 * 60 * 1000
const ACTION_REQUIRED_REMINDER_COOLDOWN_MS = 72 * 60 * 60 * 1000

function safeJsonStringify(value) {
  try {
    return JSON.stringify(value ?? [])
  } catch {
    return '[]'
  }
}

function safeJsonParse(value, fallback = []) {
  if (value == null || value === '') return fallback
  if (Array.isArray(value) || typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function buildRequirementsHash(currentlyDue, pastDue, disabledReason) {
  const payload = {
    currentlyDue: Array.isArray(currentlyDue) ? [...currentlyDue].sort() : [],
    pastDue: Array.isArray(pastDue) ? [...pastDue].sort() : [],
    disabledReason: disabledReason || null,
  }
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

function isActuallyPayoutBlocked(account) {
  if (!account) return false
  const detailsSubmitted = account.details_submitted === true
  const payoutsDisabled = account.payouts_enabled === false
  const disabledReason = account.requirements?.disabled_reason
  const pastDue = account.requirements?.past_due || []
  return (
    detailsSubmitted &&
    payoutsDisabled &&
    (Boolean(disabledReason) || pastDue.length > 0)
  )
}

function calculateStripeOnboardingStatus(account) {
  if (!account) return STRIPE_STATUS.NOT_STARTED

  const detailsSubmitted = account.details_submitted === true
  const chargesEnabled = account.charges_enabled === true
  const payoutsEnabled = account.payouts_enabled === true
  const currentlyDue = account.requirements?.currently_due || []
  const pastDue = account.requirements?.past_due || []
  const disabledReason = account.requirements?.disabled_reason || null

  if (!detailsSubmitted) return STRIPE_STATUS.IN_PROGRESS

  if (
    detailsSubmitted &&
    payoutsEnabled &&
    chargesEnabled &&
    currentlyDue.length === 0 &&
    pastDue.length === 0 &&
    !disabledReason
  ) {
    return STRIPE_STATUS.COMPLETE
  }

  if (
    detailsSubmitted &&
    payoutsEnabled === false &&
    (disabledReason || pastDue.length > 0)
  ) {
    return STRIPE_STATUS.PAYOUTS_BLOCKED
  }

  if (
    detailsSubmitted &&
    (currentlyDue.length > 0 || pastDue.length > 0 || disabledReason)
  ) {
    return STRIPE_STATUS.ACTION_REQUIRED
  }

  return STRIPE_STATUS.ACTION_REQUIRED
}

function buildStripeStatusPayload(salonOrFields) {
  const state =
    salonOrFields?.stripeOnboardingStatus ||
    (salonOrFields?.connectAccountId
      ? STRIPE_STATUS.IN_PROGRESS
      : STRIPE_STATUS.NOT_STARTED)

  const currentlyDue = safeJsonParse(salonOrFields?.stripeCurrentlyDue, [])
  const pastDue = safeJsonParse(salonOrFields?.stripePastDue, [])
  const disabledReason = salonOrFields?.stripeDisabledReason || null
  const detailsSubmitted = salonOrFields?.stripeDetailsSubmitted === true
  const chargesEnabled = salonOrFields?.stripeChargesEnabled === true
  const payoutsEnabled = salonOrFields?.stripePayoutsEnabled === true

  const copy = {
    [STRIPE_STATUS.NOT_STARTED]: {
      title: 'Stripe setup required',
      message: 'Connect Stripe to receive payouts.',
      ctaText: 'Set up Stripe',
      actionRequired: true,
    },
    [STRIPE_STATUS.IN_PROGRESS]: {
      title: 'Stripe setup incomplete',
      message: 'Complete your Stripe setup to receive payouts.',
      ctaText: 'Continue Stripe Setup',
      actionRequired: true,
    },
    [STRIPE_STATUS.ACTION_REQUIRED]: {
      title: 'Stripe needs more information',
      message: 'Some business or bank details are still required.',
      ctaText: 'Resolve Stripe Requirements',
      actionRequired: true,
    },
    [STRIPE_STATUS.PAYOUTS_BLOCKED]: {
      title: 'Payouts paused',
      message:
        'Stripe has paused payouts until the required information is provided.',
      ctaText: 'Fix payout issue',
      actionRequired: true,
    },
    [STRIPE_STATUS.COMPLETE]: {
      title: 'Stripe setup complete',
      message: 'Your payout account is ready.',
      ctaText: null,
      actionRequired: false,
    },
  }

  const meta = copy[state] || copy[STRIPE_STATUS.NOT_STARTED]

  return {
    state,
    detailsSubmitted,
    chargesEnabled,
    payoutsEnabled,
    disabledReason,
    currentlyDue,
    pastDue,
    actionRequired: meta.actionRequired,
    title: meta.title,
    message: meta.message,
    ctaText: meta.ctaText,
  }
}

function buildSalonStripeStatusUpdate(account, existingSalon = {}) {
  const currentlyDue = account?.requirements?.currently_due || []
  const pastDue = account?.requirements?.past_due || []
  const disabledReason = account?.requirements?.disabled_reason || null
  const status = calculateStripeOnboardingStatus(account)
  const requirementsHash = buildRequirementsHash(
    currentlyDue,
    pastDue,
    disabledReason,
  )
  const now = new Date()

  const update = {
    stripeOnboardingStatus: status,
    stripeDetailsSubmitted: account?.details_submitted === true,
    stripeChargesEnabled: account?.charges_enabled === true,
    stripePayoutsEnabled: account?.payouts_enabled === true,
    stripeCurrentlyDue: safeJsonStringify(currentlyDue),
    stripePastDue: safeJsonStringify(pastDue),
    stripeDisabledReason: disabledReason,
    stripeRequirementsHash: requirementsHash,
    stripeLastStripeActivityAt: now,
  }

  if (
    !existingSalon.stripeOnboardingStartedAt &&
    (status === STRIPE_STATUS.IN_PROGRESS ||
      status === STRIPE_STATUS.ACTION_REQUIRED ||
      status === STRIPE_STATUS.PAYOUTS_BLOCKED)
  ) {
    update.stripeOnboardingStartedAt = now
  }

  if (status === STRIPE_STATUS.COMPLETE) {
    update.stripeReminderStage = REMINDER_STAGE.DONE
  }

  return {
    update,
    status,
    currentlyDue,
    pastDue,
    disabledReason,
    requirementsHash,
    isComplete: status === STRIPE_STATUS.COMPLETE,
  }
}

function shouldSendPayoutBlockedEmail(salon, requirementsHash) {
  const lastSent = salon.stripeLastPayoutBlockedEmailSentAt
    ? new Date(salon.stripeLastPayoutBlockedEmailSentAt).getTime()
    : null
  const now = Date.now()
  const previousHash = salon.stripeRequirementsHash || null

  if (!lastSent) return { allow: true, reason: 'first_blocked_email' }
  if (previousHash && previousHash !== requirementsHash) {
    return { allow: true, reason: 'requirements_hash_changed' }
  }
  if (!previousHash && requirementsHash) {
    return { allow: true, reason: 'requirements_hash_changed' }
  }
  if (now - lastSent >= PAYOUT_BLOCKED_EMAIL_COOLDOWN_MS) {
    return { allow: true, reason: 'cooldown_elapsed' }
  }
  return { allow: false, reason: 'throttled' }
}

function hoursSince(dateValue) {
  if (!dateValue) return Infinity
  return (Date.now() - new Date(dateValue).getTime()) / (60 * 60 * 1000)
}

function getOnboardingAnchorDate(salon) {
  return (
    salon.stripeOnboardingStartedAt ||
    salon.stripeLastStripeActivityAt ||
    salon.createdAt ||
    null
  )
}

function nextInProgressReminder(salon) {
  const stage = salon.stripeReminderStage || REMINDER_STAGE.NONE
  if (stage === REMINDER_STAGE.DONE) return null

  const anchor = getOnboardingAnchorDate(salon)
  if (!anchor) return null

  const ageMs = Date.now() - new Date(anchor).getTime()
  const lastReminder = salon.stripeLastReminderSentAt
    ? new Date(salon.stripeLastReminderSentAt).getTime()
    : null

  if (stage === REMINDER_STAGE.NONE && ageMs >= REMINDER_24H_MS) {
    return { stage: REMINDER_STAGE.H24, reason: 'in_progress_24h' }
  }
  if (
    stage === REMINDER_STAGE.H24 &&
    ageMs >= REMINDER_72H_MS &&
    (!lastReminder || Date.now() - lastReminder >= REMINDER_24H_MS)
  ) {
    return { stage: REMINDER_STAGE.H72, reason: 'in_progress_72h' }
  }
  if (
    (stage === REMINDER_STAGE.H72 || stage === REMINDER_STAGE.H24) &&
    ageMs >= REMINDER_7D_MS &&
    (!lastReminder || Date.now() - lastReminder >= REMINDER_24H_MS)
  ) {
    return { stage: REMINDER_STAGE.D7, reason: 'in_progress_7d' }
  }
  return null
}

function shouldSendActionRequiredReminder(salon, requirementsHash) {
  const lastReminder = salon.stripeLastReminderSentAt
    ? new Date(salon.stripeLastReminderSentAt).getTime()
    : null
  const now = Date.now()

  if (salon.stripeRequirementsHash !== requirementsHash) {
    return { allow: true, reason: 'requirements_hash_changed' }
  }
  if (!lastReminder) {
    return { allow: true, reason: 'first_action_required_reminder' }
  }
  if (now - lastReminder >= ACTION_REQUIRED_REMINDER_COOLDOWN_MS) {
    return { allow: true, reason: 'cooldown_elapsed' }
  }
  return { allow: false, reason: 'throttled' }
}

module.exports = {
  STRIPE_STATUS,
  REMINDER_STAGE,
  PAYOUT_BLOCKED_EMAIL_COOLDOWN_MS,
  REMINDER_24H_MS,
  REMINDER_72H_MS,
  REMINDER_7D_MS,
  ACTION_REQUIRED_REMINDER_COOLDOWN_MS,
  safeJsonStringify,
  safeJsonParse,
  buildRequirementsHash,
  isActuallyPayoutBlocked,
  calculateStripeOnboardingStatus,
  buildStripeStatusPayload,
  buildSalonStripeStatusUpdate,
  shouldSendPayoutBlockedEmail,
  hoursSince,
  getOnboardingAnchorDate,
  nextInProgressReminder,
  shouldSendActionRequiredReminder,
}
