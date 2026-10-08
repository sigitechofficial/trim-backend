// Notifications for manual booking approval (request → accepted / declined / expired / withdrawn).
const { DateTime } = require('luxon')
const { emailDateFormate } = require('../../utils/emailDateFormate')
const ThrowNotification = require('../../utils/throwNotification')
const {
  bookingDataForEmailAndNotifications,
} = require('../../utils/emailsNotificationsData')

const tokensOf = (person) =>
  (person?.deviceTokens || []).map((t) => t?.tokenId).filter(Boolean)

const deadlineText = (date) =>
  date
    ? DateTime.fromJSDate(new Date(date)).setZone('Europe/London').toFormat('HH:mm, d LLL')
    : ''

async function load(bookingId) {
  const bookingData = await bookingDataForEmailAndNotifications(bookingId)
  if (!bookingData) return null
  const { appointment } = bookingData
  return {
    bookingData,
    appointment,
    when: emailDateFormate(appointment.on, appointment.startTime),
    shopTokens: tokensOf(appointment?.salonDetail?.user),
    clientTokens: tokensOf(appointment?.user),
  }
}

function toShop(ctx, type, notification) {
  if (!ctx.shopTokens.length) return
  ThrowNotification(
    ctx.shopTokens,
    notification,
    {
      appointment: ctx.appointment.id,
      type,
      name: ctx.bookingData.client.fullName,
      image: ctx.bookingData.client.image,
    },
    ctx.bookingData?.salon?.userId,
  )
}

function toClient(ctx, type, notification) {
  if (!ctx.clientTokens.length) return
  ThrowNotification(
    ctx.clientTokens,
    notification,
    {
      appointment: ctx.appointment.id,
      type,
      name: ctx.bookingData.salon.salonName,
      image: ctx.bookingData.salon.image,
    },
    ctx.bookingData?.client?.userId,
  )
}

async function safely(label, fn) {
  try {
    await fn()
  } catch (error) {
    console.error(`[appointmentRequest] ${label} failed:`, error.message)
  }
}

exports.bookingRequested = (bookingId, expiresAt) =>
  safely('bookingRequested', async () => {
    const ctx = await load(bookingId)
    if (!ctx) return
    const deadline = deadlineText(expiresAt || ctx.appointment.requestExpiresAt)
    toShop(ctx, 'bookingRequest', {
      title: 'New booking request',
      body: `${ctx.bookingData.client.fullName} wants to book ${ctx.when}. Accept or decline${deadline ? ` by ${deadline}` : ''}.`,
    })
    toClient(ctx, 'bookingRequestSent', {
      title: 'Booking request sent',
      body: `${ctx.bookingData.salon.salonName} will confirm your booking on ${ctx.when}. You won't be charged unless they accept.`,
    })
  })

exports.requestDeclined = (bookingId, reasonText) =>
  safely('requestDeclined', async () => {
    const ctx = await load(bookingId)
    if (!ctx) return
    toClient(ctx, 'bookingRequestDeclined', {
      title: 'Booking request declined',
      body: `${ctx.bookingData.salon.salonName} couldn't take your booking on ${ctx.when}${reasonText ? `: ${reasonText}` : '.'} You have not been charged.`,
    })
  })

// wasProposal: the shop had suggested a new time and the client didn't answer.
exports.requestExpired = (bookingId, wasProposal = false) =>
  safely('requestExpired', async () => {
    const ctx = await load(bookingId)
    if (!ctx) return
    if (wasProposal) {
      toClient(ctx, 'bookingRequestExpired', {
        title: 'Suggested time expired',
        body: `You didn't confirm ${ctx.bookingData.salon.salonName}'s suggested time of ${ctx.when}, so the booking was cancelled. You have not been charged.`,
      })
      toShop(ctx, 'bookingRequestExpired', {
        title: 'Suggested time expired',
        body: `${ctx.bookingData.client.fullName} didn't confirm the new time (${ctx.when}). The request was cancelled.`,
      })
      return
    }
    toClient(ctx, 'bookingRequestExpired', {
      title: 'Booking request expired',
      body: `${ctx.bookingData.salon.salonName} didn't respond in time to your booking on ${ctx.when}. You have not been charged.`,
    })
    toShop(ctx, 'bookingRequestExpired', {
      title: 'Booking request expired',
      body: `The request from ${ctx.bookingData.client.fullName} for ${ctx.when} expired without a response.`,
    })
  })

// Shop accepted on condition of a different time; the client must confirm.
exports.timeProposed = (bookingId, comment, newStaffName = '') =>
  safely('timeProposed', async () => {
    const ctx = await load(bookingId)
    if (!ctx) return
    const deadline = deadlineText(ctx.appointment.requestExpiresAt)
    toClient(ctx, 'bookingTimeProposed', {
      title: 'New time suggested',
      body: `${ctx.bookingData.salon.salonName} can take your booking at ${ctx.when}${
        newStaffName ? ` with ${newStaffName}` : ''
      }${comment ? `: "${comment}"` : '.'} Please confirm${deadline ? ` by ${deadline}` : ''}. You won't be charged unless you accept.`,
    })
  })

exports.proposalAccepted = (bookingId) =>
  safely('proposalAccepted', async () => {
    const ctx = await load(bookingId)
    if (!ctx) return
    toShop(ctx, 'bookingProposalAccepted', {
      title: 'New time accepted',
      body: `${ctx.bookingData.client.fullName} accepted the new time: ${ctx.when}. The booking is confirmed.`,
    })
  })

exports.proposalDeclined = (bookingId) =>
  safely('proposalDeclined', async () => {
    const ctx = await load(bookingId)
    if (!ctx) return
    toShop(ctx, 'bookingProposalDeclined', {
      title: 'New time declined',
      body: `${ctx.bookingData.client.fullName} declined the suggested time (${ctx.when}). The request was cancelled.`,
    })
  })

exports.requestWithdrawn = (bookingId) =>
  safely('requestWithdrawn', async () => {
    const ctx = await load(bookingId)
    if (!ctx) return
    toShop(ctx, 'bookingRequestWithdrawn', {
      title: 'Booking request cancelled',
      body: `${ctx.bookingData.client.fullName} cancelled their booking request for ${ctx.when}.`,
    })
  })

exports.requestReminder = (bookingId, expiresAt) =>
  safely('requestReminder', async () => {
    const ctx = await load(bookingId)
    if (!ctx) return
    toShop(ctx, 'bookingRequestReminder', {
      title: 'Booking request waiting',
      body: `Respond to ${ctx.bookingData.client.fullName}'s request for ${ctx.when} by ${deadlineText(expiresAt)}, or it will expire.`,
    })
  })
