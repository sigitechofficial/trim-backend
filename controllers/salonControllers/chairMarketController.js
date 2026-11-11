// Chair market: renters "Open to Work", shops find them and negotiate chair
// offers (see helper/chairMarket.js).
const market = require('../../helper/chairMarket')
const { response } = require('../../utils/response')

const ok = (res, message, data) => res.json(response({ message, data }))

// ---- Renter ----

exports.getMyPrefs = async (req, res) => ok(res, 'Success.', { prefs: await market.getMyPrefs(req.user.id) })

// { openToWork, availableFrom, days: ['Monday'], radiusKm, rentMin, rentMax, rentCycle, note }
exports.saveMyPrefs = async (req, res) => {
  const prefs = await market.saveMyPrefs(req.user.id, req.body)
  return ok(res, prefs.openToWork ? 'You are open to new chairs.' : 'Saved.', { prefs })
}

exports.shopProfile = async (req, res) => ok(res, 'Success.', { shop: await market.shopProfile(req.user.id, req.params.shop) })

// ---- Shop ----

// ?maxKm=&rentMax= (rentMax is weekly)
exports.listRenters = async (req, res) => ok(res, 'Success.', await market.listRenters(req.user.id, req.query))

exports.renterProfile = async (req, res) =>
  ok(res, 'Success.', { renter: await market.renterProfile(req.user.id, req.params.renter) })

exports.rentHint = async (req, res) => ok(res, 'Success.', await market.rentHint(req.user.id))

// { renterSalonId, rentAmount, rentCycle, startDate, trialDate, terms, message }
exports.sendOffer = async (req, res) => {
  const offer = await market.sendOffer(req.user.id, req.body)
  return ok(res, 'Offer sent.', { offer })
}

// ---- Both sides ----

exports.listOffers = async (req, res) => ok(res, 'Success.', { offers: await market.listOffers(req.user.id) })

// { rentAmount, rentCycle, startDate, trialDate, terms, message }
exports.counter = async (req, res) => {
  const offer = await market.counter(req.user.id, req.params.offer, req.body)
  return ok(res, 'Counter offer sent.', { offer })
}

exports.accept = async (req, res) => {
  const { offer, move } = await market.accept(req.user.id, req.params.offer)
  return ok(res, move ? 'Offer accepted. The move is set up.' : `Offer accepted. Start date: ${market.prettyDate(offer.startDate)}.`, { offer, move })
}

exports.decline = async (req, res) => {
  const offer = await market.decline(req.user.id, req.params.offer)
  return ok(res, offer.status === 'declined' ? 'Offer declined.' : 'Offer withdrawn.', { offer })
}

// ---- Shop: client app applicants on their start date ----

// { action: 'not_started' } or { action: 'new_date', startDate }
exports.startDecision = async (req, res) => {
  const offer = await require('../../helper/hiringOffers').startDecision(req.user.id, req.params.offer, req.body?.action, req.body)
  return ok(res, req.body?.action === 'new_date' ? 'Start date changed.' : 'Offer closed. The place is open again.', { offer })
}

// ---- Shop: cover a chair renter's Trim plan ----

// { cover: true | false }
exports.setCover = async (req, res) => {
  const cover = req.body?.cover === true || req.body?.cover === 'true'
  const r = await require('../../helper/renterCoverage').setCover(req.user.id, req.params.renter, cover)
  return ok(res, cover ? 'Your plan now covers this chair renter.' : r.graceDays ? `Your plan no longer covers this chair renter. They have ${r.graceDays} days to choose their own plan.` : 'Your plan no longer covers this chair renter. They are back on their own plan.', r)
}

exports.teamCover = async (req, res) =>
  ok(res, 'Success.', await require('../../helper/renterCoverage').teamRowCover(req.user.id, req.params.employee))

exports.setTeamCover = async (req, res) => {
  const cover = req.body?.cover === true || req.body?.cover === 'true'
  const r = await require('../../helper/renterCoverage').setTeamRowCover(req.user.id, req.params.employee, cover)
  return ok(res, cover ? 'Your plan now covers this chair renter.' : r.graceDays ? `Your plan no longer covers this chair renter. They have ${r.graceDays} days to choose their own plan.` : 'Your plan no longer covers this chair renter. They are back on their own plan.', r)
}

// ---- Client app: applications for a chair or a job ----

exports.applyFromClient = async (req, res) => {
  const offer = await require('../../helper/hiringOffers').applyFromClient(req.user.id, req.body)
  return ok(res, 'Application sent.', { offer })
}

// ---- Shop: "Hiring chair renters" listing ----

exports.getMyListing = async (req, res) => ok(res, 'Success.', await market.getMyListing(req.user.id))

// { isHiring, chairs, rentAmount, rentCycle, availableFrom, skills: [], terms, note }
exports.saveMyListing = async (req, res) => {
  const data = await market.saveMyListing(req.user.id, req.body)
  return ok(res, data.listing.isHiring ? 'Chair renters can now find your shop.' : 'Saved.', data)
}

// ---- Renter: shops hiring ----

// ?maxKm=
exports.listHiringShops = async (req, res) => ok(res, 'Success.', await market.listHiringShops(req.user.id, req.query))

// { shopSalonId, mode: 'accept' | 'offer', rentAmount, rentCycle, startDate, trialDate, terms, message }
exports.applyToShop = async (req, res) => {
  const offer = await market.applyToShop(req.user.id, req.body)
  return ok(res, req.body?.mode === 'accept' ? 'Sent. The shop will confirm.' : 'Offer sent.', { offer })
}

exports.hideShop = async (req, res) => {
  await market.hideShop(req.user.id, req.params.shop)
  return ok(res, 'Hidden from your list.', {})
}

// ---- Admin panel ----

exports.adminOverview = async (req, res) => ok(res, 'Success.', await market.adminOverview())

exports.adminCloseOffer = async (req, res) => {
  const offer = await market.adminCloseOffer(req.params.offer)
  return ok(res, 'Offer closed. Both sides were told.', { offer })
}
