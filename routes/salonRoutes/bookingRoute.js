const express = require('express')
const router = express.Router()
const bookingsController = require('../../controllers/salonControllers/bookingsController')
const validateToken = require('../../middlewares/accessCheck')
const catchAsync = require('../../middlewares/catchAync')
// Refuses these changes while a booking is still an unanswered request.
const notWhileRequested = require('../../middlewares/bookingRequestGuard')
const { needLevel, sameShop } = require('../../middlewares/shopRole')
const { booking } = require('../../models')

// A booking request's decline goes through cancelBooking and has its own check.
const isRequest = async (req) =>
  (await booking.findByPk(parseInt(req.body?.bookingId, 10) || 0, { attributes: ['status'] }))?.status === 'requested'

router.get('/successUrl', catchAsync(bookingsController.successUrl))
router.use(validateToken)
// Step A: the branch this request acts on (x-salon-id), checked once here.
router.use(require('../../middlewares/branchScope'))
// Booking, job, team member and shop ids sent by the app must be this shop's.
router.use(sameShop)
router.param('bookingId', (req, res, next) => sameShop(req, res, next))
// Staff permissions, checked on the server (the app only hid the buttons).
const ownAppointments = needLevel('appointments', 'low', { own: true })
router.use(['/editService', '/jobStatus', '/serviceData'], ownAppointments)
router.use('/cancelBooking', needLevel('appointments', 'high', { skip: isRequest }))
router.use(['/addWalkinCustomer', '/addWalkinBooking', '/addExtraService'], needLevel('bookAppointments', 'low'))
router.use('/importClients', needLevel('client', 'low'))
//! Bookings
// get All Bookings
router.get('/salonBookings', catchAsync(bookingsController.salonBookings))
// get filtered Bookings
router.post('/getbookingByFilter', catchAsync(bookingsController.salonBookings))
// get Booking Details
router.post('/bookingDetails', catchAsync(bookingsController.bookingDetails))
// get Reasons
router.get('/getReasons', catchAsync(bookingsController.reasons))
// get Services
router.get('/getServices', catchAsync(bookingsController.getServices))
// Get Services of Ctegories
router.post(
  '/getServicesofCategories',
  catchAsync(bookingsController.getServicesofCategories),
)
// Cancel Booking
router.post('/cancelBooking', catchAsync(bookingsController.cancelBooking))
router.get('/booking-requests', catchAsync(bookingsController.bookingRequests))
router.post('/accept-booking-request', catchAsync(bookingsController.acceptBookingRequest))
router.post('/decline-booking-request', catchAsync(bookingsController.declineBookingRequest))
router.post('/propose-booking-time', catchAsync(bookingsController.proposeBookingTime))
router.post('/proposal-slots', catchAsync(bookingsController.proposalSlots))
// employees with services
router.post(
  '/employees-with-services',
  catchAsync(bookingsController.employeesWithAllServices),
)
router.post(
  '/employees-availability',
  catchAsync(bookingsController.employeeAvailability),
)
router.post('/addExtraService', notWhileRequested, catchAsync(bookingsController.addExtraService))
//Get All Customers of Salon
router.get('/getSalonCustomer', catchAsync(bookingsController.getSalonCustomer))
//add Walking Customer
router.post(
  '/addWalkinCustomer',
  catchAsync(bookingsController.addWalkinCustomer),
)
//Add Walking Booking
router.post(
  '/addWalkinBooking',
  catchAsync(bookingsController.addWalkinBooking),
)
//Bulk import clients (CSV / Fresha) + optional announcement email
router.post(
  '/importClients',
  catchAsync(bookingsController.bulkImportClients),
)
//
router.post('/jobStatus', notWhileRequested, catchAsync(bookingsController.jobStatus))
//Get All Bookings of a Customer
router.post('/getclientHistory', catchAsync(bookingsController.clientHistory))
//CheckOut Bookings of a Customer
router.post('/checkoutBooking', notWhileRequested, catchAsync(bookingsController.checkOutBooking))
router.post(
  '/finalize-tap-to-pay',
  catchAsync(bookingsController.finalizeTapToPay),
)
//Cash CheckOut  Bookings of a Customer
router.post('/checkoutCash', notWhileRequested, catchAsync(bookingsController.checkoutCash))
//Minimal Payment CheckOut (No Stripe) - for small amounts or zero payment
router.post('/checkoutMinimalPayment', notWhileRequested, catchAsync(bookingsController.checkOutMinimalPayment))
//Cash CheckOut  Bookings of a Customer
router.post('/saveUnpaid', notWhileRequested, catchAsync(bookingsController.saveUnpaid))
//Remove Client
router.post('/removeClient', catchAsync(bookingsController.removeClient))
///
router.post(
  '/solo-employee-appointment-reschedule',
  notWhileRequested,
  catchAsync(bookingsController.rescheduleSoloEmployeeAppointment),
)
router.post(
  '/multiple-employee-appointment-reschedule',
  notWhileRequested,
  catchAsync(bookingsController.rescheduleMultipleEmployeeAppointment),
)
router.post(
  '/salonAvailability',
  catchAsync(bookingsController.salonAvailability),
)
router.get('/salonServices', catchAsync(bookingsController.salonServices))
router.post('/serviceData', catchAsync(bookingsController.serviceData))
router.post('/editService', notWhileRequested, catchAsync(bookingsController.editService))

//!New Routes
router.patch(
  '/mark-appointment-no-show/:bookingId',
  ownAppointments,
  notWhileRequested,
  catchAsync(bookingsController.markAppointmentAsNoShow),
)
router.patch(
  '/mark-appointment-cancel/:bookingId',
  needLevel('appointments', 'high'),
  notWhileRequested,
  catchAsync(bookingsController.markAppointmentAscancel),
)
//! Calendar route
router.get(
  '/canlendar-view/:day/:date',
  catchAsync(bookingsController.calendarAppointments),
)

router.post(
  '/canlendar-view-filter/:day/:date',
  catchAsync(bookingsController.calendarAppointments),
)


router.patch(
  '/updateOnlibePayment',
  catchAsync(bookingsController.updateOnlibePayment),
)

module.exports = router
