const {
  deviceToken,
  employee,
  employeeAccess,
  employeeAccessDefault,
  user,
  rentChairAdvertisementEnquiryMessage,
} = require('../models')

const VALID_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const MESSAGE_ATTRIBUTES = [
  'id',
  'rentChairAdvertisementEnquiryId',
  'senderRole',
  'senderUserId',
  'message',
  'createdAt',
  'updatedAt',
]

function parsePreferredWorkingDays(value) {
  let arr = value

  if (typeof value === 'string') {
    try {
      arr = JSON.parse(value)
    } catch {
      return { error: 'preferredWorkingDays must be a valid JSON array' }
    }
  }

  if (!Array.isArray(arr) || arr.length === 0) {
    return { error: 'preferredWorkingDays must be a non-empty array' }
  }

  const normalized = arr
    .map((day) => (typeof day === 'string' ? day.trim() : null))
    .filter(Boolean)

  const validSet = new Set(VALID_DAYS.map((day) => day.toLowerCase()))

  for (const day of normalized) {
    if (!validSet.has(day.toLowerCase())) {
      return {
        error: `Invalid day: ${day}. Allowed: ${VALID_DAYS.join(', ')}`,
      }
    }
  }

  const days = normalized.map(
    (day) => VALID_DAYS.find((v) => v.toLowerCase() === day.toLowerCase()),
  )

  return { days }
}

function parsePreferredWorkingDaysForResponse(value) {
  if (value == null || value === '') return []

  if (Array.isArray(value)) return value

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return []
}

function formatEnquiryResponse(enquiry) {
  const plain = enquiry.get ? enquiry.get({ plain: true }) : enquiry

  return {
    ...plain,
    preferredWorkingDays: parsePreferredWorkingDaysForResponse(
      plain.preferredWorkingDays,
    ),
    canReplyInApp: plain.customerUserId != null,
  }
}

async function getEmployeePermissionLevel(employeeId, salonDetailId) {
  let access = await employeeAccess.findAll({
    where: { employeeId },
    attributes: ['key', 'level'],
  })

  if (!access.length) {
    access = await employeeAccessDefault.findAll({
      where: { salonDetailId },
      attributes: ['key', 'level'],
    })
  }

  const permission = access.find((row) => row.key === 'respondToEnquiries')
  return permission?.level ?? 'none'
}

async function resolveSalonActor(req, salon) {
  if (!req.user?.dvToken) {
    return { allowed: false, actingUserId: null, isOwner: false }
  }

  // Employee sessions use the same JWT salon owner id, but the dvToken is also
  // linked to the employee user account. Check employee identity first.
  const employeeToken = await deviceToken.findOne({
    where: { tokenId: req.user.dvToken },
    attributes: ['userId'],
    include: {
      model: user,
      where: { userTypeId: 3 },
      attributes: ['id', 'userTypeId'],
      required: true,
    },
  })

  if (employeeToken) {
    const staffEmployee = await employee.findOne({
      where: {
        userId: employeeToken.userId,
        salonDetailId: salon.id,
        deleted: false,
      },
      attributes: ['id'],
    })

    if (!staffEmployee) {
      return {
        allowed: false,
        actingUserId: employeeToken.userId,
        isOwner: false,
      }
    }

    const level = await getEmployeePermissionLevel(
      staffEmployee.id,
      salon.id,
    )
    const allowed = level === 'low' || level === 'high'

    return {
      allowed,
      actingUserId: employeeToken.userId,
      isOwner: false,
    }
  }

  // Owner bypass only when dvToken belongs to the salon owner account itself.
  const ownerToken = await deviceToken.findOne({
    where: {
      tokenId: req.user.dvToken,
      userId: salon.userId,
    },
    attributes: ['userId'],
    include: {
      model: user,
      where: { userTypeId: 2 },
      attributes: ['id', 'userTypeId'],
      required: true,
    },
  })

  if (
    ownerToken &&
    Number(req.user.id) === Number(salon.userId) &&
    Number(ownerToken.userId) === Number(salon.userId)
  ) {
    return {
      allowed: true,
      actingUserId: salon.userId,
      isOwner: true,
    }
  }

  return { allowed: false, actingUserId: null, isOwner: false }
}

async function resolveActingUserId(req, salon) {
  const actor = await resolveSalonActor(req, salon)
  return actor.actingUserId
}

async function canSalonReplyToEnquiry(req, salon) {
  return resolveSalonActor(req, salon)
}

async function getLatestMessagesByEnquiryIds(enquiryIds) {
  const map = new Map()
  if (!enquiryIds.length) return map

  const messages = await rentChairAdvertisementEnquiryMessage.findAll({
    where: { rentChairAdvertisementEnquiryId: enquiryIds },
    attributes: [
      'rentChairAdvertisementEnquiryId',
      'message',
      'createdAt',
      'senderRole',
    ],
    order: [['createdAt', 'DESC']],
  })

  for (const msg of messages) {
    if (!map.has(msg.rentChairAdvertisementEnquiryId)) {
      map.set(msg.rentChairAdvertisementEnquiryId, msg)
    }
  }

  return map
}

function formatRentChairEnquiryForCustomer(enquiry, latestMessage = null) {
  const plain = enquiry.get ? enquiry.get({ plain: true }) : enquiry
  const salon = plain.salonDetail || {}

  return {
    id: plain.id,
    salonDetailId: plain.salonDetailId,
    salonName: salon.salonName || null,
    salonImage: salon.coverImage || null,
    customerUserId: plain.customerUserId,
    firstName: plain.firstName,
    lastName: plain.lastName,
    email: plain.email,
    phoneNumber: plain.phoneNumber,
    currentLocation: plain.currentLocation,
    yearsExperience: plain.yearsExperience,
    socialMedia: plain.socialMedia,
    preferredWorkingDays: parsePreferredWorkingDaysForResponse(
      plain.preferredWorkingDays,
    ),
    notes: plain.notes,
    status: plain.status,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    latestMessage: latestMessage?.message ?? null,
    latestMessageAt: latestMessage?.createdAt ?? null,
    latestMessageSenderRole: latestMessage?.senderRole ?? null,
  }
}

function getEnquiryActivityTime(row) {
  return new Date(
    row.latestMessageAt || row.updatedAt || row.createdAt,
  ).getTime()
}

function formatRentChairEnquiryForSalon(enquiry, latestMessage = null) {
  const plain = enquiry.get ? enquiry.get({ plain: true }) : enquiry
  const fullName =
    [plain.firstName, plain.lastName].filter(Boolean).join(' ').trim() || null

  return {
    id: plain.id,
    salonDetailId: plain.salonDetailId,
    customerUserId: plain.customerUserId,
    firstName: plain.firstName,
    lastName: plain.lastName,
    fullName,
    email: plain.email,
    phoneNumber: plain.phoneNumber,
    currentLocation: plain.currentLocation,
    yearsExperience: plain.yearsExperience,
    socialMedia: plain.socialMedia,
    preferredWorkingDays: parsePreferredWorkingDaysForResponse(
      plain.preferredWorkingDays,
    ),
    notes: plain.notes,
    status: plain.status,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    canReplyInApp: plain.customerUserId != null,
    latestMessage: latestMessage?.message ?? null,
    latestMessageAt: latestMessage?.createdAt ?? null,
    latestMessageSenderRole: latestMessage?.senderRole ?? null,
  }
}

function dedupeSalonEnquiryRows(rows) {
  const loggedInBest = new Map()
  const guests = []

  for (const row of rows) {
    if (row.customerUserId != null) {
      const key = String(row.customerUserId)
      const existing = loggedInBest.get(key)

      if (!existing || getEnquiryActivityTime(row) > getEnquiryActivityTime(existing)) {
        loggedInBest.set(key, row)
      }
    } else {
      guests.push(row)
    }
  }

  return [...loggedInBest.values(), ...guests].sort(
    (a, b) => getEnquiryActivityTime(b) - getEnquiryActivityTime(a),
  )
}

module.exports = {
  VALID_DAYS,
  MESSAGE_ATTRIBUTES,
  parsePreferredWorkingDays,
  parsePreferredWorkingDaysForResponse,
  formatEnquiryResponse,
  formatRentChairEnquiryForCustomer,
  formatRentChairEnquiryForSalon,
  getLatestMessagesByEnquiryIds,
  dedupeSalonEnquiryRows,
  resolveActingUserId,
  canSalonReplyToEnquiry,
}
