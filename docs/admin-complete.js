/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Complete admin management endpoints
 */

/**
 * @swagger
 * /admin/auth/login:
 *   post:
 *     summary: Authenticate admin user and generate secure access token for system access
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     accessToken:
 *                       type: string
 *                     userId:
 *                       type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /admin/overall-report/busiest-vs-quietest/{basedOn}:
 *   get:
 *     summary: Analyze peak and off-peak periods across all salons for strategic scheduling and resource allocation
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: basedOn
 *         required: true
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *     responses:
 *       200:
 *         description: Overall busiest vs quietest report
 */

/**
 * @swagger
 * /admin/overall-report/weekly-income-report:
 *   get:
 *     summary: Generate comprehensive weekly revenue analysis across all salons with trend insights
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Overall weekly income report
 */

/**
 * @swagger
 * /admin/overall-report/income-report-year:
 *   get:
 *     summary: Analyze annual revenue performance with year-over-year comparisons and growth metrics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Overall yearly income report
 */

/**
 * @swagger
 * /admin/overall-report/hourly-income-report:
 *   get:
 *     summary: Track hourly revenue patterns to identify peak earning periods and optimization opportunities
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Overall hourly income report
 */

/**
 * @swagger
 * /admin/overall-report/most-popular-service-types:
 *   get:
 *     summary: Identify trending service categories and customer preferences across the salon network
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Most popular service types report
 */

/**
 * @swagger
 * /admin/overall-report/service-types-performance:
 *   get:
 *     summary: Evaluate service category performance metrics including revenue, booking frequency, and customer satisfaction
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Service types performance report
 */

/**
 * @swagger
 * /admin/single-salon-report/busiest-vs-quietest/{basedOn}/{salon}:
 *   get:
 *     summary: Get single salon busiest vs quietest periods
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: basedOn
 *         required: true
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *       - in: path
 *         name: salon
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Single salon busiest vs quietest report
 */

/**
 * @swagger
 * /admin/single-salon-report/services-by-staff-per-week/{salon}:
 *   get:
 *     summary: Get services by staff per week for specific salon
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: salon
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Services by staff per week report
 */

/**
 * @swagger
 * /admin/single-salon-report/services-provided-by-each-employee/{salon}:
 *   get:
 *     summary: Get services provided by each employee for specific salon
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: salon
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Services provided by each employee report
 */

/**
 * @swagger
 * /admin/single-salon-report/most-popular-services/{salon}:
 *   get:
 *     summary: Get most popular services for specific salon
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: salon
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Most popular services report
 */

/**
 * @swagger
 * /admin/single-salon-report/services-performance/{salon}:
 *   get:
 *     summary: Get services performance for specific salon
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: salon
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Services performance report
 */

/**
 * @swagger
 * /admin/single-salon-report/income-report-yearly/{year}/{salon}:
 *   get:
 *     summary: Get yearly income report for specific salon
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: salon
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Yearly income report for salon
 */

/**
 * @swagger
 * /admin/single-salon-report/income-report-week/{salon}:
 *   get:
 *     summary: Get weekly income report for specific salon
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: salon
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Weekly income report for salon
 */

/**
 * @swagger
 * /admin/single-salon-report/income-report-per-hour/{salon}:
 *   get:
 *     summary: Get hourly income report for specific salon
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: salon
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Hourly income report for salon
 */

/**
 * @swagger
 * /admin/single-salon-report/average-bookings/{salon}:
 *   get:
 *     summary: Get average bookings report for specific salon
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: salon
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Average bookings report for salon
 */

/**
 * @swagger
 * /admin/service-type:
 *   post:
 *     summary: Create new service category with customizable attributes and visual branding elements
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Service type added successfully
 */

/**
 * @swagger
 * /admin/service-type/view:
 *   get:
 *     summary: Retrieve complete catalog of service categories with their configurations and usage statistics
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of service types
 */

/**
 * @swagger
 * /admin/service-type/edit/{id}:
 *   put:
 *     summary: Update service category details including name, description, and associated media assets
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Service type updated successfully
 */

/**
 * @swagger
 * /admin/service-type/change-status/{id}:
 *   put:
 *     summary: Toggle service category availability across the platform while maintaining existing bookings
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Service type status changed successfully
 */

/**
 * @swagger
 * /admin/service-type/delete/{id}:
 *   delete:
 *     summary: Archive service category while preserving historical booking data and analytics
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Service type deleted successfully
 */

/**
 * @swagger
 * /admin/salon-update/{salon}:
 *   put:
 *     summary: Modify salon profile information including contact details, location, and business information
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: salon
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Salon updated successfully
 */

/**
 * @swagger
 * /admin/salon-update:
 *   put:
 *     summary: Update salon details (general)
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               salonId:
 *                 type: integer
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Salon updated successfully
 */

/**
 * @swagger
 * /admin/salon-view:
 *   get:
 *     summary: Retrieve comprehensive list of all registered salons with their current status and details
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of all salons
 */

/**
 * @swagger
 * /admin/salon-without/{sticker}:
 *   get:
 *     summary: Filter and list salons that haven't been assigned specific promotional stickers or badges
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: sticker
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Salons without specific sticker
 */

/**
 * @swagger
 * /admin/salon-with-subscription/{subscription}:
 *   get:
 *     summary: Filter salons by subscription tier to analyze plan adoption and usage patterns
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: subscription
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Salons with specific subscription
 */

/**
 * @swagger
 * /admin/salon-filter:
 *   get:
 *     summary: Get salons for filter dropdown
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Salons list for filter
 */

/**
 * @swagger
 * /admin/salon-detail/{id}:
 *   get:
 *     summary: Access detailed salon profile including performance metrics, services, and business analytics
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Salon details
 */

/**
 * @swagger
 * /admin/salon-change-status/{id}:
 *   put:
 *     summary: Toggle salon account status to manage platform access and service availability
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Salon status changed successfully
 */

/**
 * @swagger
 * /admin/salon-delete/{id}:
 *   delete:
 *     summary: Safely archive salon profile while preserving historical data and transaction records
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Salon deleted successfully
 */

/**
 * @swagger
 * /admin/salon-employee-detail/{id}:
 *   get:
 *     summary: Get salon employee details
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Salon employee details
 */

/**
 * @swagger
 * /admin/customer:
 *   get:
 *     summary: Access comprehensive customer database with booking history and preferences
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of all customers
 */

/**
 * @swagger
 * /admin/customer-detail/{id}:
 *   get:
 *     summary: View detailed customer profile including service history, preferences, and engagement metrics
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer details
 */

/**
 * @swagger
 * /admin/customer-change-status/{id}:
 *   put:
 *     summary: Manage customer account status while preserving their booking history and preferences
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Customer status changed successfully
 */

/**
 * @swagger
 * /admin/customer-delete/{id}:
 *   delete:
 *     summary: Archive customer profile while maintaining historical transaction and interaction data
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 */

/**
 * @swagger
 * /admin/coupons:
 *   get:
 *     summary: Get all coupons
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of all coupons
 */

/**
 * @swagger
 * /admin/subscription:
 *   post:
 *     summary: Create customizable subscription tier with defined features, pricing, and access levels
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - features
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription plan added successfully
 */

/**
 * @swagger
 * /admin/subscriptions:
 *   get:
 *     summary: Retrieve complete list of subscription plans with their features and current adoption metrics
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of subscription plans
 */

/**
 * @swagger
 * /admin/subscription/{id}:
 *   get:
 *     summary: Access detailed subscription plan configuration including features and subscriber analytics
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subscription plan details
 */

/**
 * @swagger
 * /admin/subscription-update/{id}:
 *   put:
 *     summary: Modify subscription plan details while managing existing subscriber transitions
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Subscription plan updated successfully
 */

/**
 * @swagger
 * /admin/subscription-feature-update/{id}:
 *   put:
 *     summary: Customize subscription plan feature set with granular access control settings
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Subscription features updated successfully
 */

/**
 * @swagger
 * /admin/subscription-change-status/{id}:
 *   put:
 *     summary: Toggle subscription plan availability while managing existing subscriber access
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Subscription status changed successfully
 */

/**
 * @swagger
 * /admin/subscription-delete/{id}:
 *   delete:
 *     summary: Archive subscription plan while maintaining historical subscriber data and analytics
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subscription plan deleted successfully
 */

/**
 * @swagger
 * /admin/subscription-feature-remove/{id}:
 *   put:
 *     summary: Remove subscription feature
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subscription feature removed successfully
 */

/**
 * @swagger
 * /admin/appointments:
 *   get:
 *     summary: Get all appointments
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of all appointments
 */

/**
 * @swagger
 * /admin/appointments/{type}:
 *   get:
 *     summary: Get appointments by type
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled, no-show]
 *     responses:
 *       200:
 *         description: Appointments by type
 */

/**
 * @swagger
 * /admin/appointment-detail/{id}:
 *   get:
 *     summary: Get appointment details
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Appointment details
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard data
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data
 */

/**
 * @swagger
 * /admin/dashboard-charts:
 *   get:
 *     summary: Get admin dashboard charts data
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Dashboard charts data
 */

/**
 * @swagger
 * /admin/salon-earnings:
 *   get:
 *     summary: Get salon earnings data
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Salon earnings data
 */

/**
 * @swagger
 * /admin/employee-earnings/{external}:
 *   get:
 *     summary: Get employee earnings data
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: external
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee earnings data
 */

/**
 * @swagger
 * /admin/help-support:
 *   get:
 *     summary: Get help support tickets
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Help support tickets
 */

/**
 * @swagger
 * /admin/help-support/{id}:
 *   put:
 *     summary: Update help support ticket
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               response:
 *                 type: string
 *     responses:
 *       200:
 *         description: Help support ticket updated
 */

/**
 * @swagger
 * /admin/reports/peak-time/{status}/{id}:
 *   get:
 *     summary: Get peak time reports
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Peak time report
 */

/**
 * @swagger
 * /admin/reports/financial-performance/{status}:
 *   get:
 *     summary: Get financial performance reports
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Financial performance report
 */

/**
 * @swagger
 * /admin/reports/client-file:
 *   get:
 *     summary: Get client file report
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Client file report
 */

/**
 * @swagger
 * /admin/reports/appointment-conversion:
 *   get:
 *     summary: Get appointment conversion report
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Appointment conversion report
 */

/**
 * @swagger
 * /admin/salon-employees/{salon}:
 *   get:
 *     summary: Get salon employees
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: salon
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Salon employees list
 */

/**
 * @swagger
 * /admin/delete-notification/{id}:
 *   put:
 *     summary: Remove notification while maintaining delivery analytics and user interaction data
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 */

/**
 * @swagger
 * /admin/throw-notification:
 *   post:
 *     summary: Broadcast targeted push notifications to specific user segments with customizable content
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - userType
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               userType:
 *                 type: string
 *                 enum: [all, salon, customer]
 *     responses:
 *       200:
 *         description: Notification sent successfully
 */

/**
 * @swagger
 * /admin/re-send-notification/{notification}:
 *   post:
 *     summary: Retransmit previously sent notifications to ensure delivery and user engagement
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: notification
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification resent successfully
 */

/**
 * @swagger
 * /admin/notifications:
 *   get:
 *     summary: Access notification history with delivery statistics and engagement metrics
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of push notifications
 */

/**
 * @swagger
 * /admin/AllSubscriptions:
 *   get:
 *     summary: Get all subscriptions
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of all subscriptions
 */

/**
 * @swagger
 * /admin/updateSubscription:
 *   post:
 *     summary: Update subscription
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subscriptionId:
 *                 type: integer
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 */

/**
 * @swagger
 * /admin/employee:
 *   post:
 *     summary: Create new admin staff account with role-based permissions and access controls
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - roleId
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               roleId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Admin employee added successfully
 */

/**
 * @swagger
 * /admin/employees:
 *   get:
 *     summary: Retrieve comprehensive list of admin staff with their roles and activity metrics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of admin employees
 */

/**
 * @swagger
 * /admin/employee-detail/{employee}:
 *   get:
 *     summary: Access detailed admin staff profile including role assignments and activity history
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: employee
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Admin employee details
 */

/**
 * @swagger
 * /admin/add-role:
 *   post:
 *     summary: Create customizable admin role with granular permission settings and access controls
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - permissions
 *             properties:
 *               name:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Role added successfully
 */

/**
 * @swagger
 * /admin/update-role-name/{role}:
 *   put:
 *     summary: Modify role identifier while maintaining permission settings and user assignments
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role name updated successfully
 */

/**
 * @swagger
 * /admin/update-role-permisiions/{role}:
 *   put:
 *     summary: Reconfigure role access levels and feature permissions with user impact management
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Role permissions updated successfully
 */

/**
 * @swagger
 * /admin/role-detail/{role}:
 *   get:
 *     summary: Access comprehensive role configuration including permissions and assigned users
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role details
 */

/**
 * @swagger
 * /admin/role-list:
 *   get:
 *     summary: Retrieve complete catalog of admin roles with their permission sets and usage metrics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of roles
 */

/**
 * @swagger
 * /admin/fetch-active-fetures:
 *   get:
 *     summary: Get active features
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of active features
 */

/**
 * @swagger
 * /admin/role-change-status/{id}:
 *   put:
 *     summary: Toggle role availability while managing existing user permissions and access
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Role status changed successfully
 */

/**
 * @swagger
 * /admin/role-delete/{id}:
 *   delete:
 *     summary: Archive role configuration while preserving historical usage data and user assignments
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role deleted successfully
 */

/**
 * @swagger
 * /admin/employee-change-status/{id}:
 *   put:
 *     summary: Manage admin staff account status while preserving activity history and role assignments
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Employee status changed successfully
 */

/**
 * @swagger
 * /admin/employee-delete/{id}:
 *   delete:
 *     summary: Archive admin staff profile while maintaining historical activity records
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 */

/**
 * @swagger
 * /admin/employee-services-history/{employee}:
 *   get:
 *     summary: Get employee services history
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: employee
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee services history
 */

/**
 * @swagger
 * /admin/graph/top-performing-services:
 *   get:
 *     summary: Get top performing services graph
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Top performing services graph data
 */

/**
 * @swagger
 * /admin/graph/top-performing-salons/{limit}:
 *   get:
 *     summary: Get top performing salons graph
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Top performing salons graph data
 */

/**
 * @swagger
 * /admin/graph/client-status-distribution-graph:
 *   get:
 *     summary: Get client status distribution graph
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Client status distribution graph data
 */

/**
 * @swagger
 * /admin/add-new-reason/{type}:
 *   post:
 *     summary: Add new reason
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [cancellation, no-show, reschedule]
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
 *     responses:
 *       200:
 *         description: Reason added successfully
 */

/**
 * @swagger
 * /admin/fetch-reasons/{type}:
 *   get:
 *     summary: Get reasons by type
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [cancellation, no-show, reschedule]
 *     responses:
 *       200:
 *         description: List of reasons
 */

/**
 * @swagger
 * /admin/edit-reason/{type}/{id}:
 *   put:
 *     summary: Edit reason
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reason updated successfully
 */

/**
 * @swagger
 * /admin/change-reason-status/{type}/{id}:
 *   put:
 *     summary: Change reason status
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Reason status changed successfully
 */

/**
 * @swagger
 * /admin/delete-reason/{type}/{id}:
 *   delete:
 *     summary: Delete reason
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reason deleted successfully
 */

/**
 * @swagger
 * /admin/custom-emails:
 *   post:
 *     summary: Send custom emails
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *               - recipients
 *             properties:
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Custom emails sent successfully
 */

/**
 * @swagger
 * /admin/employees-list/{external}:
 *   get:
 *     summary: Get employees list
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: external
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employees list
 */

/**
 * @swagger
 * /admin/salon-customers-list/{salon}:
 *   get:
 *     summary: Get salon customers list
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: salon
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Salon customers list
 */

/**
 * @swagger
 * /admin/admin-earnings:
 *   get:
 *     summary: Get admin earnings
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Admin earnings data
 */

/**
 * @swagger
 * /admin/admin-earnings-from-specific-salon/{salon}:
 *   get:
 *     summary: Get admin earnings from specific salon
 *     tags: [Admin]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: salon
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Admin earnings from specific salon
 */

/**
 * @swagger
 * /admin/add-new-faq:
 *   post:
 *     summary: Create targeted FAQ entry with customizable visibility and category settings
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - answer
 *               - accessFrom
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               accessFrom:
 *                 type: string
 *                 enum: [customer, salon, both]
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: FAQ added successfully
 */

/**
 * @swagger
 * /admin/fetch-faqs/{accessFrom}/{type}:
 *   get:
 *     summary: Retrieve filtered FAQ entries based on user type and category preferences
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: accessFrom
 *         required: true
 *         schema:
 *           type: string
 *           enum: [customer, salon, both]
 *       - in: path
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of FAQs
 */

/**
 * @swagger
 * /admin/edit-faq/{id}:
 *   put:
 *     summary: Update FAQ content while maintaining visibility settings and user access rules
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *     responses:
 *       200:
 *         description: FAQ updated successfully
 */

/**
 * @swagger
 * /admin/change-faq-status/{id}:
 *   put:
 *     summary: Toggle FAQ visibility while preserving content and category associations
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: FAQ status changed successfully
 */

/**
 * @swagger
 * /admin/delete-faq/{id}:
 *   delete:
 *     summary: Archive FAQ entry while maintaining historical usage and interaction data
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: FAQ deleted successfully
 */

/**
 * @swagger
 * /admin/reports/subscriptions:
 *   get:
 *     summary: Get subscription reports summary
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Subscription reports summary data
 */

/**
 * @swagger
 * /admin/reports/subscriptions/table:
 *   get:
 *     summary: Get subscription reports table data
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Subscription reports table data
 */
