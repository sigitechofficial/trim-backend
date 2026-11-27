// A booking request (status 'requested') has not been accepted yet. Until the
// shop answers it, the only things that may happen to it are: accept, suggest
// another time, decline (or the client withdrawing it). Everything else that
// changes a booking (completing a service, checkout, editing or adding
// services, rescheduling, no-show) is refused, so a request cannot become a
// booking, or be charged, without being accepted by someone allowed to.
const { booking, jobs } = require('../models')

const first = (value) => (Array.isArray(value) ? value[0] : value)
const toId = (value) => parseInt(value, 10) || null

async function bookingIdOf(req) {
  const direct =
    req.params?.bookingId ?? req.body?.bookingId ?? first(req.body?.extraServices)?.bookingId
  if (direct) return toId(direct)
  const jobId = toId(first(req.body?.jobIds) ?? req.body?.jobId)
  if (!jobId) return null
  const job = await jobs.findByPk(jobId, { attributes: ['bookingId'] })
  return job?.bookingId ?? null
}

module.exports = async function blockWhileRequested(req, res, next) {
  try {
    const bookingId = await bookingIdOf(req)
    if (!bookingId) return next()
    const row = await booking.findByPk(bookingId, { attributes: ['status'] })
    if (row?.status !== 'requested') return next()
    return res.json({
      status: '0',
      message:
        'This is a booking request. Accept it, suggest another time or decline it first.',
      data: {},
      error: '',
    })
  } catch (err) {
    return next(err)
  }
}

module.exports.bookingIdOf = bookingIdOf
