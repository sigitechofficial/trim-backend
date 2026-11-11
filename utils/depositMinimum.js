// Stripe won't charge less than 30p (GBP). A deposit below that can't be taken
// online, so the booking goes ahead with no deposit (the card is saved, as for
// a 0% deposit) and the client pays it at the shop with the rest of the bill.
// Can happen with a big loyalty reward and a small leftover service.
const STRIPE_MIN_CHARGE = 0.3

/** The deposit to take online: 0 when deposit + tip is below Stripe's minimum. */
function chargeableDeposit(deposit, tip = 0) {
  const d = Number(deposit) || 0
  const total = d + (Number(tip) || 0)
  if (d > 0 && total < STRIPE_MIN_CHARGE && !(Number(tip) > 0)) return 0
  return d
}

module.exports = { STRIPE_MIN_CHARGE, chargeableDeposit }
