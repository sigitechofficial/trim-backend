/**
 * @swagger
 * tags:
 *   name: User Customer
 *   description: Complete customer/user management and booking system
 */

/**
 * @swagger
 * /customer/profile:
 *   get:
 *     summary: Retrieve comprehensive customer profile with personal details and preferences
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Customer profile retrieved successfully
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
 *                     id:
 *                       type: integer
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phoneNum:
 *                       type: string
 *                     countryCode:
 *                       type: string
 *                     image:
 *                       type: string
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *                     gender:
 *                       type: string
 *                       enum: [male, female, other]
 *                     address:
 *                       type: string
 *                     stripeCustomerId:
 *                       type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /customer/profile:
 *   patch:
 *     summary: Modify customer information with profile image and contact detail management
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Updated first name
 *               lastName:
 *                 type: string
 *                 description: Updated last name
 *               phoneNum:
 *                 type: string
 *                 description: Updated phone number
 *               countryCode:
 *                 type: string
 *                 description: Updated country code
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Date of birth
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 description: Gender
 *               address:
 *                 type: string
 *                 description: Home address
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile image
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */

/**
 * @swagger
 * /customer/salons:
 *   get:
 *     summary: Discover nearby salons with location-based search and service filtering
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         description: Customer's latitude for location-based search
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         description: Customer's longitude for location-based search
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         description: Search radius in kilometers
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for salon name
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: integer
 *         description: Filter by service availability
 *     responses:
 *       200:
 *         description: List of salons retrieved successfully
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
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       address:
 *                         type: string
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                       phoneNumber:
 *                         type: string
 *                       rating:
 *                         type: number
 *                       distance:
 *                         type: number
 *                       coverImage:
 *                         type: string
 *                       isOpen:
 *                         type: boolean
 *                       nextAvailableSlot:
 *                         type: string
 *                         format: date-time
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /customer/salon/{salonId}:
 *   get:
 *     summary: Access comprehensive salon details including services, staff, and availability
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Salon ID to get details for
 *     responses:
 *       200:
 *         description: Salon details retrieved successfully
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
 *                     salonInfo:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         address:
 *                           type: string
 *                         phoneNumber:
 *                           type: string
 *                         rating:
 *                           type: number
 *                         coverImage:
 *                           type: string
 *                     services:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *                           duration:
 *                             type: integer
 *                           categoryName:
 *                             type: string
 *                     employees:
 *                       type: array
 *                       items:
 *                         type: object
 *                     gallery:
 *                       type: array
 *                       items:
 *                         type: string
 *                     workingHours:
 *                       type: array
 *                       items:
 *                         type: object
 *                     reviews:
 *                       type: array
 *                       items:
 *                         type: object
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /customer/services/{salonId}:
 *   get:
 *     summary: Browse salon service catalog with pricing and category organization
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Salon ID to get services for
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter by service category
 *     responses:
 *       200:
 *         description: Salon services retrieved successfully
 */

/**
 * @swagger
 * /customer/employees/{salonId}:
 *   get:
 *     summary: View salon staff profiles with service specializations and availability
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Salon ID to get employees for
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: integer
 *         description: Filter employees by service capability
 *     responses:
 *       200:
 *         description: Salon employees retrieved successfully
 */

/**
 * @swagger
 * /customer/availability:
 *   post:
 *     summary: Verify service availability with real-time slot checking and duration calculation
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - salonId
 *               - serviceIds
 *               - date
 *             properties:
 *               salonId:
 *                 type: integer
 *                 description: Salon ID
 *               serviceIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of service IDs
 *               employeeId:
 *                 type: integer
 *                 description: Preferred employee ID (optional)
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Desired booking date
 *     responses:
 *       200:
 *         description: Availability information retrieved
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
 *                     availableSlots:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           startTime:
 *                             type: string
 *                             format: time
 *                           endTime:
 *                             type: string
 *                             format: time
 *                           employeeId:
 *                             type: integer
 *                           employeeName:
 *                             type: string
 *                     totalDuration:
 *                       type: integer
 *                     totalPrice:
 *                       type: number
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /customer/book-appointment:
 *   post:
 *     summary: Schedule salon appointment with integrated payment processing and confirmation management
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - salonId
 *               - serviceIds
 *               - employeeId
 *               - bookingDate
 *               - startTime
 *             properties:
 *               salonId:
 *                 type: integer
 *                 description: Salon ID
 *               serviceIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of service IDs to book
 *               employeeId:
 *                 type: integer
 *                 description: Employee ID to book with
 *               bookingDate:
 *                 type: string
 *                 format: date
 *                 description: Booking date
 *               startTime:
 *                 type: string
 *                 format: time
 *                 description: Booking start time
 *               notes:
 *                 type: string
 *                 description: Special notes or requests
 *               paymentMethod:
 *                 type: string
 *                 enum: [online, cash]
 *                 default: cash
 *                 description: Payment method
 *               paymentMethodId:
 *                 type: string
 *                 description: Stripe payment method ID (for online payments)
 *     responses:
 *       200:
 *         description: Appointment booked successfully
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
 *                     bookingId:
 *                       type: integer
 *                     confirmationNumber:
 *                       type: string
 *                     totalAmount:
 *                       type: number
 *                     paymentStatus:
 *                       type: string
 *                     bookingDetails:
 *                       type: object
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /customer/bookings:
 *   get:
 *     summary: Access appointment history with status tracking and service details
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, completed, cancelled, all]
 *           default: all
 *         description: Filter bookings by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of bookings to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: Customer bookings retrieved successfully
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
 *                       salonName:
 *                         type: string
 *                       employeeName:
 *                         type: string
 *                       services:
 *                         type: array
 *                         items:
 *                           type: object
 *                       bookingDate:
 *                         type: string
 *                         format: date
 *                       startTime:
 *                         type: string
 *                         format: time
 *                       endTime:
 *                         type: string
 *                         format: time
 *                       totalAmount:
 *                         type: number
 *                       status:
 *                         type: string
 *                       confirmationNumber:
 *                         type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /customer/booking/{bookingId}:
 *   get:
 *     summary: Retrieve comprehensive appointment details with service and payment information
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID to get details for
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 */

/**
 * @swagger
 * /customer/cancel-booking/{bookingId}:
 *   patch:
 *     summary: Process appointment cancellation with reason tracking and refund handling
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID to cancel
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 */

/**
 * @swagger
 * /customer/reschedule-booking/{bookingId}:
 *   patch:
 *     summary: Modify appointment timing with availability verification and notification management
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID to reschedule
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newDate
 *               - newStartTime
 *             properties:
 *               newDate:
 *                 type: string
 *                 format: date
 *                 description: New booking date
 *               newStartTime:
 *                 type: string
 *                 format: time
 *                 description: New start time
 *               employeeId:
 *                 type: integer
 *                 description: New employee ID (optional)
 *               reason:
 *                 type: string
 *                 description: Reason for rescheduling
 *     responses:
 *       200:
 *         description: Booking rescheduled successfully
 */

/**
 * @swagger
 * /customer/favorites:
 *   get:
 *     summary: Access bookmarked salons with quick-access booking capabilities
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Favorite salons retrieved successfully
 */

/**
 * @swagger
 * /customer/favorites/{salonId}:
 *   post:
 *     summary: Bookmark salon with personalized preference tracking
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Salon ID to add to favorites
 *     responses:
 *       200:
 *         description: Salon added to favorites successfully
 */

/**
 * @swagger
 * /customer/favorites/{salonId}:
 *   delete:
 *     summary: Remove salon bookmark while preserving interaction history
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Salon ID to remove from favorites
 *     responses:
 *       200:
 *         description: Salon removed from favorites successfully
 */

/**
 * @swagger
 * /customer/payment-methods:
 *   get:
 *     summary: Access stored payment methods with secure token management
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 */

/**
 * @swagger
 * /customer/payment-methods:
 *   post:
 *     summary: Register payment method with secure tokenization and default preference management
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *                 description: Stripe payment method ID
 *               setAsDefault:
 *                 type: boolean
 *                 description: Set as default payment method
 *     responses:
 *       200:
 *         description: Payment method added successfully
 */

/**
 * @swagger
 * /customer/payment-methods/{paymentMethodId}:
 *   delete:
 *     summary: Delete payment method with associated token cleanup and default reassignment
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethodId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment method ID to remove
 *     responses:
 *       200:
 *         description: Payment method removed successfully
 */

/**
 * @swagger
 * /customer/reviews:
 *   get:
 *     summary: Access customer review history with ratings and feedback details
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Customer reviews retrieved successfully
 */

/**
 * @swagger
 * /customer/reviews:
 *   post:
 *     summary: Create service review with multi-criteria ratings and detailed feedback
 *     tags: [User Customer]
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
 *               - rating
 *             properties:
 *               bookingId:
 *                 type: integer
 *                 description: Booking ID to review
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *               review:
 *                 type: string
 *                 description: Written review (optional)
 *               employeeRating:
 *                 type: number
 *                 description: Separate employee rating (optional)
 *               serviceRating:
 *                 type: number
 *                 description: Separate service rating (optional)
 *     responses:
 *       200:
 *         description: Review submitted successfully
 */

/**
 * @swagger
 * /customer/notifications:
 *   get:
 *     summary: Retrieve customer notifications with priority-based filtering and read status
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Get only unread notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */

/**
 * @swagger
 * /customer/notifications/{notificationId}/read:
 *   patch:
 *     summary: Update notification status with read receipt tracking
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID to mark as read
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 */

/**
 * @swagger
 * /customer/search:
 *   get:
 *     summary: Perform multi-criteria search across salons, services, and staff with location awareness
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [salon, service, employee, all]
 *           default: all
 *         description: Type of search
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         description: Customer's latitude for location-based results
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         description: Customer's longitude for location-based results
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */

/**
 * @swagger
 * /customer/wallet:
 *   get:
 *     summary: Access digital wallet balance with transaction history and payment options
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Wallet information retrieved successfully
 */

/**
 * @swagger
 * /customer/loyalty-points:
 *   get:
 *     summary: Track loyalty program status with points balance and reward eligibility
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Loyalty points retrieved successfully
 */

/**
 * @swagger
 * /customer/coupons:
 *   get:
 *     summary: Browse available promotional offers with validity and usage criteria
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: salonId
 *         schema:
 *           type: integer
 *         description: Filter coupons by salon
 *     responses:
 *       200:
 *         description: Available coupons retrieved successfully
 */

/**
 * @swagger
 * /customer/validate-coupon:
 *   post:
 *     summary: Verify coupon eligibility with discount calculation and usage validation
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - couponCode
 *               - salonId
 *               - totalAmount
 *             properties:
 *               couponCode:
 *                 type: string
 *                 description: Coupon code to validate
 *               salonId:
 *                 type: integer
 *                 description: Salon ID
 *               totalAmount:
 *                 type: number
 *                 description: Total booking amount
 *     responses:
 *       200:
 *         description: Coupon validation result
 */

/**
 * @swagger
 * /customer/account-delete:
 *   post:
 *     summary: Process account deletion with feedback collection and data archival
 *     tags: [User Customer]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for account deletion
 *               feedback:
 *                 type: string
 *                 description: Additional feedback
 *     responses:
 *       200:
 *         description: Account deletion initiated successfully
 */
