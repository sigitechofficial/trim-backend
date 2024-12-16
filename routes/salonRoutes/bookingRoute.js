const express = require('express')
const router = express.Router()
const bookingsController = require('../../controllers/salonControllers/bookingsController')
const validateToken = require('../../middlewares/accessCheck')
const catchAsync = require('../../middlewares/catchAync')

router.get('/successUrl', catchAsync(bookingsController.successUrl))
router.use(validateToken)
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
// employees with services
router.post(
  '/employees-with-services',
  catchAsync(bookingsController.employeesWithAllServices),
)
router.post(
  '/employees-availability',
  catchAsync(bookingsController.employeeAvailability),
)
router.post('/addExtraService', catchAsync(bookingsController.addExtraService))
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
//
router.post('/jobStatus', catchAsync(bookingsController.jobStatus))
//Get All Bookings of a Customer
router.post('/getclientHistory', catchAsync(bookingsController.clientHistory))
//CheckOut Bookings of a Customer
router.post('/checkoutBooking', catchAsync(bookingsController.checkOutBooking))
//Cash CheckOut  Bookings of a Customer
router.post('/checkoutCash', catchAsync(bookingsController.checkoutCash))
//Cash CheckOut  Bookings of a Customer
router.post('/saveUnpaid', catchAsync(bookingsController.saveUnpaid))
//Remove Client
router.post('/removeClient', catchAsync(bookingsController.removeClient))
///
router.post(
  '/solo-employee-appointment-reschedule',
  catchAsync(bookingsController.rescheduleSoloEmployeeAppointment),
)
router.post(
  '/multiple-employee-appointment-reschedule',
  catchAsync(bookingsController.rescheduleMultipleEmployeeAppointment),
)
router.post(
  '/salonAvailability',
  catchAsync(bookingsController.salonAvailability),
)
router.get('/salonServices', catchAsync(bookingsController.salonServices))
router.post('/serviceData', catchAsync(bookingsController.serviceData))
router.post('/editService', catchAsync(bookingsController.editService))

//!New Routes
router.patch(
  '/mark-appointment-no-show/:bookingId',
  catchAsync(bookingsController.markAppointmentAsNoShow),
)
router.patch(
  '/mark-appointment-cancel/:bookingId',
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

module.exports = router
