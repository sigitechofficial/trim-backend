/**
 * Offers from people in the client app: a chair (they are not a chair renter
 * on Trim yet) or a staff job. They work like chair market offers (Accept /
 * Counter / Decline, see helper/chairMarket.js), with two differences:
 *
 *   - Accepting reserves the chair or position; nobody is moved and no account
 *     is made yet (stage 'starting').
 *   - On the start date the owner is asked "Did they start today?":
 *       Started      → the owner adds them (Add team member / Add chair renter,
 *                       filled in for them); the offer becomes 'joined'.
 *       Didn't come  → the offer closes and the place opens again.
 *       New date     → the question comes again on the new date.
 *     With no answer the owner is reminded each day; after START_ASKS days
 *     the offer closes and the place opens again.
 */
const { Op } = require('sequelize')
const { DateTime } = require('luxon')
const { sequelize, salonDetail, user, chairOffer, chairOfferRound, shopChairListing } = require('../models')
const AppError = require('../utils/appError')
const market = require('./chairMarket')
const hiring = require('./hiringRequests')
const coverage = require('./renterCoverage')
const { activeSalonWhere } = require('./salonSubscriptionRule')

const START_ASKS = 3
const DAILY_APPLY_LIMIT = 10
const today = () => DateTime.now().setZone('Europe/London').toISODate()
const emailKey = (v) => String(v || '').trim().toLowerCase()
const phoneKey = (v) => String(v || '').replace(/\D/g, '').slice(-9)
const str = (v, max) => (v == null ? '' : String(v).trim().slice(0, max))

// A client app user who already rents a chair on Trim (same email or phone).
async function renterAccountOf(u) {
  const or = []
  if (u.email) or.push({ email: u.email })
  if (phoneKey(u.phoneNum).length >= 9) or.push({ phoneNum: { [Op.like]: `%${phoneKey(u.phoneNum)}` } })
  if (!or.length) return null
  const users = await user.findAll({ where: { [Op.or]: or, deleted: false, id: { [Op.ne]: u.id } }, attributes: ['id'] })
  if (!users.length) return null
  return salonDetail.findOne({ where: { userId: users.map((x) => x.id), isExternalEmployee: true, deleted: false }, attributes: ['id'] })
}

/**
 * body: { shopSalonId, kind: 'chair'|'staff', mode?: 'accept', rentAmount, rentCycle, payType,
 *         startDate, trialDate, terms, message, experience, location, days: [], skills: [] }
 */
async function applyFromClient(userId, body = {}) {
  const kind = body.kind === 'staff' ? 'staff' : 'chair'
  const me = await user.findByPk(userId, { attributes: ['id', 'firstName', 'lastName', 'email', 'countryCode', 'phoneNum', 'deleted'] })
  if (!me || me.deleted) throw new AppError('Please log in to apply.', 200)
  const shop = await salonDetail.findOne({
    where: { id: Number(body.shopSalonId), isExternalEmployee: false, deleted: false, [Op.and]: [activeSalonWhere(today())] },
    attributes: ['id', 'userId', 'salonName', 'staffAdvertisementStatus', 'staffAdvertisementCount', 'staffAdvertisementWagesType',
      'staffAdvertisementWagesAmount', 'staffAdvertisementWagesCycle', 'rentChairAdvertisementStatus', 'rentChairAdvertisementChairCount',
      'rentChairAdvertisementRentType', 'rentChairAdvertisementRentAmount'],
  })
  if (!shop) throw new AppError('This shop is not taking applications right now.', 200)
  if (shop.userId === userId) throw new AppError('You cannot apply to your own shop.', 200)
  if ((await hiring.openCount(shop, kind)) < 1) {
    throw new AppError(kind === 'staff' ? 'This shop is not hiring staff right now.' : 'This shop has no chair to rent right now.', 200)
  }
  // Someone who already rents a chair on Trim moves through the business app,
  // so their current shop is told and their clients and bookings move with them.
  if (kind === 'chair' && (await renterAccountOf(me))) {
    throw new AppError('You already rent a chair on Trim. Open the Trim Business app and use Change shop → See shops hiring, so your clients and bookings move with you.', 200)
  }

  // "Accept their terms" starts from the shop's advert.
  const listing = kind === 'chair' ? await shopChairListing.findOne({ where: { shopSalonId: shop.id } }) : null
  let fromAdvert = {}
  if (body.mode === 'accept') {
    fromAdvert = kind === 'staff'
      ? { rentAmount: shop.staffAdvertisementWagesAmount, payType: shop.staffAdvertisementWagesType === 'commission' ? 'commission' : 'salary', rentCycle: shop.staffAdvertisementWagesCycle }
      : { rentAmount: listing?.rentAmount ?? shop.rentChairAdvertisementRentAmount, rentCycle: listing?.rentCycle || shop.rentChairAdvertisementRentType }
  }
  const t = market.readTerms({ ...body, ...fromAdvert, startDate: body.startDate || today() }, kind)
  market.checkTrial(t)

  const existing = await chairOffer.findOne({ where: { renterUserId: userId, shopSalonId: shop.id, kind, status: 'open' } })
  if (existing) throw new AppError('You already have an open application with this shop.', 200)
  const sentToday = await chairOffer.count({
    where: { renterUserId: userId, source: 'client', createdAt: { [Op.gte]: DateTime.now().minus({ days: 1 }).toJSDate() } },
  })
  if (sentToday >= DAILY_APPLY_LIMIT) throw new AppError('You have sent the most applications allowed for today. Please try again tomorrow.', 200)

  const days = (Array.isArray(body.days) ? body.days : []).map((d) => str(d, 12)).filter(Boolean).slice(0, 7)
  const skills = (Array.isArray(body.skills) ? body.skills : []).map((d) => str(d, 30)).filter(Boolean).slice(0, 20)
  const applicant = {
    firstName: me.firstName || '',
    lastName: me.lastName || '',
    email: me.email || '',
    phone: [me.countryCode, me.phoneNum].filter(Boolean).join(' '),
    experience: body.experience != null && body.experience !== '' ? Math.max(0, Math.min(60, Math.round(Number(body.experience) || 0))) : null,
    location: str(body.location, 120) || null,
    days,
    skills,
    note: t.message || null,
  }
  const offer = await sequelize.transaction(async (transaction) => {
    const o = await chairOffer.create({
      renterUserId: userId,
      renterSalonId: null,
      shopSalonId: shop.id,
      createdBy: userId,
      kind,
      source: 'client',
      applicantInfo: JSON.stringify(applicant),
      status: 'open',
      lastBy: 'renter',
      rounds: 1,
      rentAmount: t.rentAmount,
      rentCycle: t.rentCycle,
      payType: t.payType,
      // The shop decides coverage; an applicant starts from what the advert says.
      coversPlan: kind === 'chair' ? !!listing?.coversPlan : false,
      planWish: t.planWish,
      startDate: t.startDate,
      trialDate: t.trialDate,
      shopTerms: kind === 'chair' ? listing?.terms || null : null,
      renterTerms: body.mode === 'accept' ? null : t.terms,
      expiresAt: market.expiry(),
    }, { transaction })
    await chairOfferRound.create({ offerId: o.id, by: 'renter', ...t, terms: body.mode === 'accept' ? null : t.terms }, { transaction })
    return o
  })
  const name = `${applicant.firstName} ${applicant.lastName}`.trim() || 'Someone'
  const pay = t.rentAmount != null
    ? t.payType === 'commission' ? ` (${t.rentAmount}% commission)` : ` (£${t.rentAmount} ${String(t.rentCycle || '').toLowerCase()})`
    : ''
  await market.push([shop.userId], {
    title: kind === 'staff' ? 'New job application' : 'New chair application',
    body: `${name} applied ${kind === 'staff' ? 'for a job' : 'for a chair'} at your shop${pay}.`,
  }, { offerId: offer.id })
  return offer
}

// Called from chairMarket.accept for an offer with no renter shop.
async function acceptApplicant({ offer, side, shop: shopRow, userId }) {
  const kind = offer.kind || 'chair'
  const shop = await salonDetail.findByPk(shopRow.id, {
    attributes: ['id', 'userId', 'salonName', 'teamSize', 'staffAdvertisementStatus', 'staffAdvertisementCount',
      'rentChairAdvertisementStatus', 'rentChairAdvertisementChairCount'],
  })
  if ((await hiring.openCount(shop, kind)) < 1) {
    throw new AppError(kind === 'staff' ? 'Every position is already filled. Turn your Staff advert back on to take someone new.' : 'Every chair is already taken. Add a chair in Hiring chair renters to take someone new.', 200)
  }
  // Staff and covered chair renters use team seats.
  if ((kind === 'staff' || offer.coversPlan) && (await coverage.hiringSeatsLeft(shop)) < 1) {
    if (side === 'shop') throw new AppError(coverage.OWNER_NO_SEAT, 200)
    await market.push([shop.userId], {
      title: 'No free team seat',
      body: `${market.applicantName(offer)} wants to accept your ${market.offerWord(offer)}, but your plan has no free team seat. Upgrade your plan or free a seat, then ask them to accept again.`,
    }, { offerId: offer.id })
    throw new AppError(coverage.applicantNoSeat(shop.salonName), 200)
  }
  const [claimed] = await chairOffer.update(
    { status: 'accepted', closedAt: new Date(), stage: 'starting', startAsks: 0, startAskedOn: null },
    { where: { id: offer.id, status: 'open' } },
  )
  if (!claimed) throw new AppError('This offer has already been answered.', 200)
  if (String(offer.startDate) < today()) await chairOffer.update({ startDate: today() }, { where: { id: offer.id } })
  await offer.reload()
  await hiring.reserve(shop.id, kind, offer.id)

  // The person took this place: their other open applications close.
  const others = await chairOffer.findAll({
    where: { renterUserId: offer.renterUserId, kind, status: 'open', id: { [Op.ne]: offer.id } },
    include: [{ model: salonDetail, as: 'shop', attributes: ['userId'] }],
  })
  for (const o of others) {
    await o.update({ status: 'withdrawn', closedAt: new Date() })
    await market.push([o.shop?.userId], {
      title: `${kind === 'staff' ? 'Job' : 'Chair'} application withdrawn`,
      body: `${market.applicantName(o)} took a place at another shop.`,
    }, { offerId: o.id })
  }
  const date = market.prettyDate(offer.startDate)
  await market.push([await market.otherSideUserId(offer, side)], {
    title: `${kind === 'staff' ? 'Job' : 'Chair'} offer accepted`,
    body: side === 'renter'
      ? `${market.applicantName(offer)} accepted your ${market.offerWord(offer)} and starts on ${date}.`
      : `${shop.salonName} accepted your terms. You start on ${date}. Please go to the shop that day.`,
  }, { offerId: offer.id })
  return { offer, move: null }
}

/**
 * The owner's answer on the start date: 'not_started' (didn't come) or
 * 'new_date' with body.startDate. "Started" happens through Add team member.
 */
async function startDecision(ownerUserId, offerId, action, body = {}) {
  const offer = await chairOffer.findByPk(Number(offerId))
  const shop = offer && await salonDetail.findOne({ where: { id: offer.shopSalonId, userId: ownerUserId }, attributes: ['id', 'salonName'] })
  if (!offer || !shop) throw new AppError('Data not found', 404)
  if (offer.status !== 'accepted' || offer.stage !== 'starting') throw new AppError('This offer is not waiting for a start any more.', 200)
  if (action === 'new_date') {
    const d = DateTime.fromISO(String(body.startDate || '').slice(0, 10))
    if (!d.isValid || d.toISODate() < today()) throw new AppError('Please choose a new start date from today.', 200)
    await offer.update({ startDate: d.toISODate(), startAsks: 0, startAskedOn: null })
    await market.push([offer.renterUserId], {
      title: 'New start date',
      body: `${shop.salonName} moved your start date to ${market.prettyDate(d.toISODate())}.`,
    }, { offerId: offer.id })
    return offer
  }
  await closeNotStarted(offer, shop, `${shop.salonName} has closed your ${market.offerWord(offer)} because you did not start on ${market.prettyDate(offer.startDate)}.`)
  return offer
}

async function closeNotStarted(offer, shop, message) {
  await offer.update({ status: 'closed', stage: 'not_started', closedAt: new Date() })
  await hiring.release(offer.shopSalonId, offer.kind || 'chair')
  await market.push([offer.renterUserId], { title: `${offer.kind === 'staff' ? 'Job' : 'Chair'} offer closed`, body: message }, { offerId: offer.id })
}

// Called by the 5-minute job: asks owners once a day on and after the start
// date, and closes offers nobody confirmed after START_ASKS days.
async function runStartChecks() {
  const due = await chairOffer.findAll({
    where: { status: 'accepted', stage: 'starting', startDate: { [Op.lte]: today() } },
    include: [{ model: salonDetail, as: 'shop', attributes: ['id', 'userId', 'salonName'] }],
    limit: 200,
  })
  const summary = { asked: 0, closed: 0 }
  for (const o of due) {
    if (String(o.startAskedOn || '') === today()) continue
    try {
      if (o.startAsks >= START_ASKS) {
        await closeNotStarted(o, o.shop, `${o.shop?.salonName || 'The shop'} did not confirm your start, so your ${market.offerWord(o)} has closed.`)
        await market.push([o.shop?.userId], {
          title: 'Offer closed',
          body: `You did not confirm whether ${market.applicantName(o)} started, so the offer has closed and the place is open again.`,
        }, { offerId: o.id })
        summary.closed++
        continue
      }
      // Claim today's question so a second server does not send it too.
      const [claimed] = await chairOffer.update(
        { startAsks: o.startAsks + 1, startAskedOn: today() },
        { where: { id: o.id, startAsks: o.startAsks, stage: 'starting' } },
      )
      if (!claimed) continue
      await market.push([o.shop?.userId], {
        title: `Did ${market.applicantName(o)} start?`,
        body: `${market.applicantName(o)} was due to start on ${market.prettyDate(o.startDate)}. Open Hiring requests to add them, or tell us they did not come.`,
      }, { offerId: o.id })
      summary.asked++
    } catch (err) {
      console.error(`[hiringOffers] start check for offer ${o.id} failed:`, err.message)
    }
  }
  return summary
}

module.exports = { applyFromClient, acceptApplicant, startDecision, runStartChecks, START_ASKS }
