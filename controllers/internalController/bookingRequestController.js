const bookingRequestService = require('../../services/bookingRequestService')

// POST /internal/run-booking-requests
//
// Manual trigger for the booking-request job. The job itself runs on the
// in-server timer (jobs/bookingRequestCron.js); this is for a dry run or an
// outside scheduler. Same shared-secret header as the rebooking reminder;
// ?dryRun=true reports only.
exports.runBookingRequestJob = async (req, res) => {
  const expected = process.env.BOOKING_REQUEST_CRON_SECRET || process.env.REBOOK_CRON_SECRET
  if (!expected) {
    return res.status(500).json({ status: '0', message: 'Trigger not configured' })
  }
  if (req.headers['x-cron-secret'] !== expected) {
    return res.status(401).json({ status: '0', message: 'Unauthorized' })
  }
  const dryRun = req.query.dryRun === 'true' || req.query.dryRun === '1'

  const summary = await bookingRequestService.run({ dryRun })
  if (dryRun) return res.json({ status: '1', message: 'Dry run', data: summary })

  console.log('[BookingRequests] run summary:', summary)
  return res.json({ status: '1', message: 'Done', data: summary })
}
