const TAP_TO_PAY_TIP_NOT_SUPPORTED_MESSAGE =
  'Tap to Pay does not support tips yet. Please remove the tip or use another payment method.';

function toMinorUnits(amountGbp) {
  return Math.round(parseFloat(amountGbp) * 100);
}

/**
 * Tip total from booking fields used by checkOutBooking / distributeTip.
 * Extend here if additional tip columns are added to the booking model.
 */
function getBookingTipTotal(bookingRecord) {
  if (!bookingRecord) return 0;
  return Math.max(0, parseFloat(bookingRecord.tip) || 0);
}

function hasBookingTip(bookingRecord) {
  return getBookingTipTotal(bookingRecord) > 0;
}

function resolveExpectedTapToPayAmountGbp(bookingRecord) {
  const total = parseFloat(bookingRecord?.total) || 0;
  const discount = parseFloat(bookingRecord?.discount) || 0;
  const actualCaptured = parseFloat(bookingRecord?.actualCapturedAmount) || 0;
  const tipOnBooking = getBookingTipTotal(bookingRecord);
  return total + discount - actualCaptured - tipOnBooking;
}

function resolveExpectedTapToPayAmountMinorUnits(bookingRecord) {
  return toMinorUnits(resolveExpectedTapToPayAmountGbp(bookingRecord));
}

module.exports = {
  TAP_TO_PAY_TIP_NOT_SUPPORTED_MESSAGE,
  toMinorUnits,
  getBookingTipTotal,
  hasBookingTip,
  resolveExpectedTapToPayAmountGbp,
  resolveExpectedTapToPayAmountMinorUnits,
};
