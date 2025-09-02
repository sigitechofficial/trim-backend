/**
 * @swagger
 * tags:
 *   name: Salon Bookings
 *   description: Complete booking management system for salons
 */

/**
 * @swagger
 * /salon/v1/bookings/successUrl:
 *   get:
 *     summary: Process successful booking completion with payment gateway integration and confirmation handling
 *     tags: [Salon Bookings]
 *     description: Endpoint to handle successful booking redirects from payment gateways
 *     responses:
 *       200:
 *         description: Success URL handled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/bookings/salonBookings:
 *   get:
 *     summary: Retrieve comprehensive list of salon appointments with customer, service, and status details
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of all salon bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       customerId:
 *                         type: integer
 *                       employeeId:
 *                         type: integer
 *                       serviceId:
 *                         type: integer
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                       endTime:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [pending, confirmed, completed, cancelled, no-show]
 *                       totalAmount:
 *                         type: number
 *                       customerInfo:
 *                         type: object
 *                       employeeInfo:
 *                         type: object
 *                       serviceInfo:
 *                         type: object
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/bookings/getbookingByFilter:
 *   post:
 *     summary: Access customized booking records with advanced filtering by status, staff, date, and services
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, completed, cancelled, no-show]
 *                 description: Filter by booking status
 *               employeeId:
 *                 type: integer
 *                 description: Filter by specific employee
 *               dateFrom:
 *                 type: string
 *                 format: date
 *                 description: Start date for filtering
 *               dateTo:
 *                 type: string
 *                 format: date
 *                 description: End date for filtering
 *               serviceId:
 *                 type: integer
 *                 description: Filter by specific service
 *               customerId:
 *                 type: integer
 *                 description: Filter by specific customer
 *     responses:
 *       200:
 *         description: Filtered bookings retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/bookingDetails:
 *   post:
 *     summary: Access complete booking information including customer details, services, payments, and staff assignments
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *             properties:
 *               bookingId:
 *                 type: integer
 *                 description: ID of the booking to get details for
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingInfo:
 *                       type: object
 *                     customerInfo:
 *                       type: object
 *                     employeeInfo:
 *                       type: object
 *                     serviceInfo:
 *                       type: object
 *                     paymentInfo:
 *                       type: object
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/bookings/getReasons:
 *   get:
 *     summary: Get cancellation/reschedule reasons
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of available reasons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       reason:
 *                         type: string
 *                       type:
 *                         type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/bookings/getServices:
 *   get:
 *     summary: Retrieve complete catalog of salon services with pricing, duration, and availability information
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of salon services
 */

/**
 * @swagger
 * /salon/v1/bookings/getServicesofCategories:
 *   post:
 *     summary: Access categorized service listings with detailed service attributes and pricing tiers
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryIds
 *             properties:
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of category IDs to get services for
 *     responses:
 *       200:
 *         description: Services by categories retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/cancelBooking:
 *   post:
 *     summary: Cancel a booking
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - reasonId
 *             properties:
 *               bookingId:
 *                 type: integer
 *                 description: ID of the booking to cancel
 *               reasonId:
 *                 type: integer
 *                 description: ID of the cancellation reason
 *               customReason:
 *                 type: string
 *                 description: Custom cancellation reason (if reasonId is for custom reason)
 *               refundAmount:
 *                 type: number
 *                 description: Amount to refund (optional)
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/employees-with-services:
 *   post:
 *     summary: Retrieve staff roster with service qualifications and availability status
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serviceIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Filter employees by service IDs
 *     responses:
 *       200:
 *         description: Employees with services retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/employees-availability:
 *   post:
 *     summary: Verify staff member availability with service duration and scheduling constraints
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - date
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: ID of the employee to check availability
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date to check availability for
 *               serviceId:
 *                 type: integer
 *                 description: Service ID to check availability for
 *     responses:
 *       200:
 *         description: Employee availability retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/addExtraService:
 *   post:
 *     summary: Add extra service to existing booking
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - serviceId
 *             properties:
 *               bookingId:
 *                 type: integer
 *                 description: ID of the existing booking
 *               serviceId:
 *                 type: integer
 *                 description: ID of the service to add
 *               employeeId:
 *                 type: integer
 *                 description: ID of employee to perform the service
 *     responses:
 *       200:
 *         description: Extra service added successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/getSalonCustomer:
 *   get:
 *     summary: Access comprehensive customer database with contact information and booking history
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of salon customers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phoneNumber:
 *                         type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/bookings/addWalkinCustomer:
 *   post:
 *     summary: Register new walk-in customer with essential contact details and profile creation
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - phoneNum
 *               - countryCode
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Customer's first name
 *               lastName:
 *                 type: string
 *                 description: Customer's last name
 *               phoneNum:
 *                 type: string
 *                 description: Customer's phone number
 *               countryCode:
 *                 type: string
 *                 description: Country code for phone number
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer's email (optional)
 *     responses:
 *       200:
 *         description: Walk-in customer added successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/addWalkinBooking:
 *   post:
 *     summary: Add a walk-in booking
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - employeeId
 *               - serviceId
 *               - startTime
 *             properties:
 *               customerId:
 *                 type: integer
 *                 description: ID of the walk-in customer
 *               employeeId:
 *                 type: integer
 *                 description: ID of the employee performing the service
 *               serviceId:
 *                 type: integer
 *                 description: ID of the service to be performed
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: Start time of the booking
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: End time of the booking
 *     responses:
 *       200:
 *         description: Walk-in booking added successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/jobStatus:
 *   post:
 *     summary: Update job/booking status
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - status
 *             properties:
 *               bookingId:
 *                 type: integer
 *                 description: ID of the booking to update
 *               status:
 *                 type: string
 *                 enum: [started, in-progress, completed, on-hold]
 *                 description: New status of the booking
 *     responses:
 *       200:
 *         description: Job status updated successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/getclientHistory:
 *   post:
 *     summary: Retrieve detailed customer appointment history with service details and transaction records
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *             properties:
 *               customerId:
 *                 type: integer
 *                 description: ID of the customer to get history for
 *               limit:
 *                 type: integer
 *                 description: Number of records to return
 *               offset:
 *                 type: integer
 *                 description: Number of records to skip
 *     responses:
 *       200:
 *         description: Client history retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/checkoutBooking:
 *   post:
 *     summary: Process appointment payment with multiple payment methods and automated receipt generation
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - paymentMethod
 *             properties:
 *               bookingId:
 *                 type: integer
 *                 description: ID of the booking to checkout
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, cash, digital_wallet]
 *                 description: Payment method used
 *               tipAmount:
 *                 type: number
 *                 description: Tip amount (optional)
 *               discountAmount:
 *                 type: number
 *                 description: Discount amount (optional)
 *               paymentIntentId:
 *                 type: string
 *                 description: Stripe payment intent ID (for card payments)
 *     responses:
 *       200:
 *         description: Booking checked out successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/checkoutCash:
 *   post:
 *     summary: Handle cash transactions with change calculation and receipt management
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *             properties:
 *               bookingId:
 *                 type: integer
 *                 description: ID of the booking to checkout with cash
 *               tipAmount:
 *                 type: number
 *                 description: Tip amount in cash
 *               discountAmount:
 *                 type: number
 *                 description: Discount amount applied
 *               cashReceived:
 *                 type: number
 *                 description: Amount of cash received
 *     responses:
 *       200:
 *         description: Cash checkout completed successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/saveUnpaid:
 *   post:
 *     summary: Mark appointment for deferred payment with reason tracking and follow-up management
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *             properties:
 *               bookingId:
 *                 type: integer
 *                 description: ID of the booking to save as unpaid
 *               reason:
 *                 type: string
 *                 description: Reason for unpaid status
 *     responses:
 *       200:
 *         description: Booking saved as unpaid successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/removeClient:
 *   post:
 *     summary: Disassociate customer from appointment while maintaining booking and payment records
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *             properties:
 *               bookingId:
 *                 type: integer
 *                 description: ID of the booking to remove client from
 *               reason:
 *                 type: string
 *                 description: Reason for client removal
 *     responses:
 *       200:
 *         description: Client removed from booking successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/solo-employee-appointment-reschedule:
 *   post:
 *     summary: Modify individual staff appointment timing with conflict detection and notification handling
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - newStartTime
 *             properties:
 *               bookingId:
 *                 type: integer
 *                 description: ID of the booking to reschedule
 *               newStartTime:
 *                 type: string
 *                 format: date-time
 *                 description: New start time for the appointment
 *               newEndTime:
 *                 type: string
 *                 format: date-time
 *                 description: New end time for the appointment
 *               employeeId:
 *                 type: integer
 *                 description: New employee ID (if changing employee)
 *     responses:
 *       200:
 *         description: Solo employee appointment rescheduled successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/multiple-employee-appointment-reschedule:
 *   post:
 *     summary: Coordinate multi-staff appointment rescheduling with synchronized timing and availability checks
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - employeeSchedules
 *             properties:
 *               bookingId:
 *                 type: integer
 *                 description: ID of the booking to reschedule
 *               employeeSchedules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     employeeId:
 *                       type: integer
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                 description: Array of employee schedules for the rescheduled appointment
 *     responses:
 *       200:
 *         description: Multiple employee appointment rescheduled successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/salonAvailability:
 *   post:
 *     summary: Analyze salon-wide availability considering staff schedules and service requirements
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - serviceId
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date to check availability for
 *               serviceId:
 *                 type: integer
 *                 description: Service ID to check availability for
 *               duration:
 *                 type: integer
 *                 description: Service duration in minutes
 *     responses:
 *       200:
 *         description: Salon availability retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/salonServices:
 *   get:
 *     summary: Retrieve complete catalog of salon services with pricing, duration, and availability information
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of salon services retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/serviceData:
 *   post:
 *     summary: Access detailed service information including pricing, duration, and staff qualifications
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *             properties:
 *               serviceId:
 *                 type: integer
 *                 description: ID of the service to get data for
 *     responses:
 *       200:
 *         description: Service data retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/editService:
 *   post:
 *     summary: Update service configuration including pricing, duration, and availability settings
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *             properties:
 *               serviceId:
 *                 type: integer
 *                 description: ID of the service to edit
 *               name:
 *                 type: string
 *                 description: New service name
 *               price:
 *                 type: number
 *                 description: New service price
 *               duration:
 *                 type: integer
 *                 description: New service duration in minutes
 *     responses:
 *       200:
 *         description: Service edited successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/mark-appointment-no-show/{bookingId}:
 *   patch:
 *     summary: Update appointment status to no-show with automated notifications and follow-up tracking
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the booking to mark as no-show
 *     responses:
 *       200:
 *         description: Appointment marked as no-show successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/mark-appointment-cancel/{bookingId}:
 *   patch:
 *     summary: Process appointment cancellation with status updates and resource reallocation
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the booking to mark as cancelled
 *     responses:
 *       200:
 *         description: Appointment marked as cancelled successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/canlendar-view/{day}/{date}:
 *   get:
 *     summary: Generate comprehensive calendar view with appointment details and staff assignments
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: day
 *         required: true
 *         schema:
 *           type: string
 *         description: Day of the week or 'all'
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to view calendar for
 *     responses:
 *       200:
 *         description: Calendar appointments retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/canlendar-view-filter/{day}/{date}:
 *   post:
 *     summary: Access customized calendar view with advanced filtering by staff, services, and status
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: day
 *         required: true
 *         schema:
 *           type: string
 *         description: Day of the week or 'all'
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to view calendar for
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: Filter by specific employee
 *               status:
 *                 type: string
 *                 description: Filter by booking status
 *               serviceId:
 *                 type: integer
 *                 description: Filter by specific service
 *     responses:
 *       200:
 *         description: Filtered calendar view retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/bookings/updateOnlibePayment:
 *   patch:
 *     summary: Synchronize payment gateway status with booking records and transaction tracking
 *     tags: [Salon Bookings]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - paymentStatus
 *             properties:
 *               bookingId:
 *                 type: integer
 *                 description: ID of the booking to update payment for
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, completed, failed, refunded]
 *                 description: New payment status
 *               transactionId:
 *                 type: string
 *                 description: Transaction ID from payment gateway
 *     responses:
 *       200:
 *         description: Online payment status updated successfully
 */
