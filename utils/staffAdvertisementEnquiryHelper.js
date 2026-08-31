// Staff-advert enquiry helpers. The enquiry shape is identical to the
// rent-a-chair advert, so the generic formatters/permission helpers are reused
// from rentChairEnquiryHelper; only the message-model reference differs.
const { staffAdvertisementEnquiryMessage } = require('../models')
const {
  VALID_DAYS,
  parsePreferredWorkingDays,
  parsePreferredWorkingDaysForResponse,
  formatEnquiryResponse,
  formatRentChairEnquiryForCustomer,
  formatRentChairEnquiryForSalon,
  dedupeSalonEnquiryRows,
  resolveActingUserId,
  canSalonReplyToEnquiry,
} = require('./rentChairEnquiryHelper')

const MESSAGE_ATTRIBUTES = [
  'id',
  'staffAdvertisementEnquiryId',
  'senderRole',
  'senderUserId',
  'message',
  'createdAt',
  'updatedAt',
]

async function getLatestMessagesByEnquiryIds(enquiryIds) {
  const map = new Map()
  if (!enquiryIds.length) return map

  const messages = await staffAdvertisementEnquiryMessage.findAll({
    where: { staffAdvertisementEnquiryId: enquiryIds },
    attributes: [
      'staffAdvertisementEnquiryId',
      'message',
      'createdAt',
      'senderRole',
    ],
    order: [['createdAt', 'DESC']],
  })

  for (const msg of messages) {
    if (!map.has(msg.staffAdvertisementEnquiryId)) {
      map.set(msg.staffAdvertisementEnquiryId, msg)
    }
  }

  return map
}

module.exports = {
  VALID_DAYS,
  MESSAGE_ATTRIBUTES,
  parsePreferredWorkingDays,
  parsePreferredWorkingDaysForResponse,
  formatEnquiryResponse,
  // Same field-based formatters as rent-a-chair (model-agnostic).
  formatStaffEnquiryForCustomer: formatRentChairEnquiryForCustomer,
  formatStaffEnquiryForSalon: formatRentChairEnquiryForSalon,
  getLatestMessagesByEnquiryIds,
  dedupeSalonEnquiryRows,
  resolveActingUserId,
  canSalonReplyToEnquiry,
}
