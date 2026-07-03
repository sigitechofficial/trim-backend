const INVALID_TIP_MESSAGE = 'Invalid tip amount.';

const TAP_TO_PAY_TIP_NOT_SUPPORTED_MESSAGE =
  'Tap to Pay does not support tips yet. Please remove the tip or use another payment method.';

function toMinorUnits(amountGbp) {
  return Math.round(parseFloat(amountGbp) * 100);
}

function fromMinorUnits(amountMinor) {
  return amountMinor / 100;
}

function getBookingOldTip(bookingRecord) {
  if (!bookingRecord) return 0;
  return Math.max(0, parseFloat(bookingRecord.tip) || 0);
}

/**
 * Tip already stored on booking before checkout (oldTip in card flow).
 */
function getBookingTipTotal(bookingRecord) {
  return getBookingOldTip(bookingRecord);
}

function hasBookingTip(bookingRecord) {
  return getBookingOldTip(bookingRecord) > 0;
}

function resolveTapToPayServiceAmountGbp(bookingRecord) {
  const total = parseFloat(bookingRecord?.total) || 0;
  const discount = parseFloat(bookingRecord?.discount) || 0;
  const actualCaptured = parseFloat(bookingRecord?.actualCapturedAmount) || 0;
  const oldTip = getBookingOldTip(bookingRecord);
  return total + discount - actualCaptured - oldTip;
}

function resolveExpectedTapToPayAmountGbp(bookingRecord) {
  return resolveTapToPayServiceAmountGbp(bookingRecord);
}

function resolveTapToPayServiceAmountMinorUnits(bookingRecord) {
  return toMinorUnits(resolveTapToPayServiceAmountGbp(bookingRecord));
}

function resolveExpectedTapToPayAmountMinorUnits(bookingRecord) {
  return resolveTapToPayServiceAmountMinorUnits(bookingRecord);
}

function resolveTapToPayChargeAmountGbp(bookingRecord, newTipAmount) {
  const serviceAmount = resolveTapToPayServiceAmountGbp(bookingRecord);
  const tipAmount = Math.max(0, parseFloat(newTipAmount) || 0);
  return serviceAmount + tipAmount;
}

function resolveTapToPayChargeAmountMinorUnits(bookingRecord, newTipAmount) {
  return toMinorUnits(resolveTapToPayChargeAmountGbp(bookingRecord, newTipAmount));
}

function parseTapToPayTip(body) {
  const raw =
    body?.tip !== undefined && body?.tip !== null && body?.tip !== ''
      ? body.tip
      : body?.tipAmount;

  if (raw === undefined || raw === null || raw === '') {
    return 0;
  }

  const parsed = parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    const error = new Error(INVALID_TIP_MESSAGE);
    error.isTapToPayTipValidation = true;
    throw error;
  }

  return Math.round(parsed * 100) / 100;
}

function parseMetadataMinorUnits(value, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

module.exports = {
  INVALID_TIP_MESSAGE,
  TAP_TO_PAY_TIP_NOT_SUPPORTED_MESSAGE,
  toMinorUnits,
  fromMinorUnits,
  getBookingOldTip,
  getBookingTipTotal,
  hasBookingTip,
  parseTapToPayTip,
  parseMetadataMinorUnits,
  resolveTapToPayServiceAmountGbp,
  resolveTapToPayServiceAmountMinorUnits,
  resolveTapToPayChargeAmountGbp,
  resolveTapToPayChargeAmountMinorUnits,
  resolveExpectedTapToPayAmountGbp,
  resolveExpectedTapToPayAmountMinorUnits,
};
