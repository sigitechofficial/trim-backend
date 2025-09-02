/**
 * @swagger
 * tags:
 *   name: Salon Performance
 *   description: Complete performance analytics and dashboard system for salons
 */

/**
 * @swagger
 * /performance-dashboard/section-one:
 *   get:
 *     summary: Analyze core business metrics with growth trends and period-over-period comparisons
 *     tags: [Salon Performance]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for performance metrics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for performance metrics
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, quarter, year]
 *           default: month
 *         description: Predefined period for performance metrics
 *     responses:
 *       200:
 *         description: Section one dashboard data retrieved successfully
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
 *                     totalBookings:
 *                       type: integer
 *                       description: Total number of bookings
 *                     totalRevenue:
 *                       type: number
 *                       description: Total revenue generated
 *                     totalCustomers:
 *                       type: integer
 *                       description: Total unique customers
 *                     averageBookingValue:
 *                       type: number
 *                       description: Average value per booking
 *                     bookingGrowth:
 *                       type: number
 *                       description: Percentage growth in bookings
 *                     revenueGrowth:
 *                       type: number
 *                       description: Percentage growth in revenue
 *                     customerGrowth:
 *                       type: number
 *                       description: Percentage growth in customers
 *                     comparisonPeriod:
 *                       type: object
 *                       description: Comparison data with previous period
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /performance-dashboard/section-two:
 *   get:
 *     summary: Monitor operational efficiency metrics with utilization and customer retention insights
 *     tags: [Salon Performance]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for performance metrics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for performance metrics
 *     responses:
 *       200:
 *         description: Section two dashboard data retrieved successfully
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
 *                     occupancyRate:
 *                       type: number
 *                       description: Salon occupancy rate percentage
 *                     returningClientRate:
 *                       type: number
 *                       description: Percentage of returning clients
 *                     averageServiceTime:
 *                       type: number
 *                       description: Average service duration in minutes
 *                     noShowRate:
 *                       type: number
 *                       description: Percentage of no-show appointments
 *                     cancellationRate:
 *                       type: number
 *                       description: Percentage of cancelled appointments
 *                     employeeUtilization:
 *                       type: number
 *                       description: Average employee utilization rate
 *                     peakHours:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Peak business hours
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /performance-dashboard/section-three:
 *   get:
 *     summary: Track top performers and recent activity with detailed service and staff analytics
 *     tags: [Salon Performance]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of top items to return
 *     responses:
 *       200:
 *         description: Section three dashboard data retrieved successfully
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
 *                     topServices:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           serviceId:
 *                             type: integer
 *                           serviceName:
 *                             type: string
 *                           bookingCount:
 *                             type: integer
 *                           revenue:
 *                             type: number
 *                     topEmployees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           employeeId:
 *                             type: integer
 *                           employeeName:
 *                             type: string
 *                           bookingCount:
 *                             type: integer
 *                           revenue:
 *                             type: number
 *                           rating:
 *                             type: number
 *                     recentBookings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           bookingId:
 *                             type: integer
 *                           customerName:
 *                             type: string
 *                           serviceName:
 *                             type: string
 *                           employeeName:
 *                             type: string
 *                           bookingTime:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /performance-dashboard/appointment-graph:
 *   get:
 *     summary: Visualize appointment trends with customizable time periods and booking pattern analysis
 *     tags: [Salon Performance]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: monthly
 *         description: Time period for the graph
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for graph data
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for graph data
 *     responses:
 *       200:
 *         description: Appointments graph data retrieved successfully
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
 *                     labels:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: X-axis labels for the graph
 *                     datasets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                           data:
 *                             type: array
 *                             items:
 *                               type: number
 *                           backgroundColor:
 *                             type: string
 *                           borderColor:
 *                             type: string
 *                     totalAppointments:
 *                       type: integer
 *                     averageAppointments:
 *                       type: number
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /performance-dashboard/sales-graph/{of}:
 *   get:
 *     summary: Generate sales performance visualizations with filterable metrics and growth indicators
 *     tags: [Salon Performance]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: of
 *         required: true
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         description: Time period for sales graph
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for sales data
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for sales data
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *         description: Filter sales by specific employee
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: integer
 *         description: Filter sales by specific service
 *     responses:
 *       200:
 *         description: Sales graph data retrieved successfully
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
 *                     labels:
 *                       type: array
 *                       items:
 *                         type: string
 *                     datasets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                           data:
 *                             type: array
 *                             items:
 *                               type: number
 *                           backgroundColor:
 *                             type: string
 *                     totalSales:
 *                       type: number
 *                     averageSales:
 *                       type: number
 *                     growthRate:
 *                       type: number
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /performance-dashboard/occupancy-rate-graph:
 *   get:
 *     summary: Analyze capacity utilization patterns with peak period identification and optimization insights
 *     tags: [Salon Performance]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: daily
 *         description: Period for occupancy rate calculation
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for occupancy data
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for occupancy data
 *     responses:
 *       200:
 *         description: Occupancy rate graph data retrieved successfully
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
 *                     currentOccupancyRate:
 *                       type: number
 *                       description: Current occupancy rate percentage
 *                     graphData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           occupancyRate:
 *                             type: number
 *                           bookedSlots:
 *                             type: integer
 *                           availableSlots:
 *                             type: integer
 *                     averageOccupancyRate:
 *                       type: number
 *                     peakOccupancyDays:
 *                       type: array
 *                       items:
 *                         type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /performance-dashboard/returning-client-rate-graph:
 *   get:
 *     summary: Track customer retention metrics with loyalty trends and client segmentation analysis
 *     tags: [Salon Performance]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [monthly, quarterly, yearly]
 *           default: monthly
 *         description: Period for returning client analysis
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analysis
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analysis
 *     responses:
 *       200:
 *         description: Returning client rate graph data retrieved successfully
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
 *                     currentReturningClientRate:
 *                       type: number
 *                       description: Current returning client rate percentage
 *                     graphData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                           returningClientRate:
 *                             type: number
 *                           newClients:
 *                             type: integer
 *                           returningClients:
 *                             type: integer
 *                           totalClients:
 *                             type: integer
 *                     averageReturningRate:
 *                       type: number
 *                     clientRetentionTrend:
 *                       type: string
 *                       enum: [improving, declining, stable]
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /performance-dashboard/report/sales:
 *   get:
 *     summary: Generate comprehensive sales analysis with multi-dimensional breakdowns and payment insights
 *     tags: [Salon Performance]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for sales report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for sales report
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [service, employee, category, payment_method]
 *           default: service
 *         description: Group sales data by specific criteria
 *     responses:
 *       200:
 *         description: Detailed sales report retrieved successfully
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
 *                     totalSales:
 *                       type: number
 *                       description: Total sales amount
 *                     totalTransactions:
 *                       type: integer
 *                       description: Total number of transactions
 *                     averageTransactionValue:
 *                       type: number
 *                       description: Average value per transaction
 *                     salesByService:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           serviceId:
 *                             type: integer
 *                           serviceName:
 *                             type: string
 *                           totalSales:
 *                             type: number
 *                           transactionCount:
 *                             type: integer
 *                     salesByEmployee:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           employeeId:
 *                             type: integer
 *                           employeeName:
 *                             type: string
 *                           totalSales:
 *                             type: number
 *                           transactionCount:
 *                             type: integer
 *                     paymentMethodBreakdown:
 *                       type: object
 *                       properties:
 *                         cash:
 *                           type: number
 *                         card:
 *                           type: number
 *                         digital:
 *                           type: number
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /performance-dashboard/report/appointments:
 *   get:
 *     summary: Analyze appointment performance with status tracking and staff efficiency metrics
 *     tags: [Salon Performance]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for appointments report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for appointments report
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, completed, cancelled, no-show, pending]
 *           default: all
 *         description: Filter appointments by status
 *     responses:
 *       200:
 *         description: Detailed appointments report retrieved successfully
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
 *                     totalAppointments:
 *                       type: integer
 *                       description: Total number of appointments
 *                     appointmentsByStatus:
 *                       type: object
 *                       properties:
 *                         completed:
 *                           type: integer
 *                         cancelled:
 *                           type: integer
 *                         no_show:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                     appointmentsByEmployee:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           employeeId:
 *                             type: integer
 *                           employeeName:
 *                             type: string
 *                           appointmentCount:
 *                             type: integer
 *                           completionRate:
 *                             type: number
 *                     appointmentsByService:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           serviceId:
 *                             type: integer
 *                           serviceName:
 *                             type: string
 *                           appointmentCount:
 *                             type: integer
 *                     appointmentTrends:
 *                       type: object
 *                       properties:
 *                         weeklyTrend:
 *                           type: string
 *                         monthlyTrend:
 *                           type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /performance-dashboard/report/daily-summary:
 *   get:
 *     summary: Monitor daily business performance with comparative analysis and key success indicators
 *     tags: [Salon Performance]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Specific date for daily summary (defaults to today)
 *       - in: query
 *         name: includePrevious
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include comparison with previous day
 *     responses:
 *       200:
 *         description: Daily summary report retrieved successfully
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
 *                     date:
 *                       type: string
 *                       format: date
 *                       description: Date of the summary
 *                     totalSales:
 *                       type: number
 *                       description: Total sales for the day
 *                     totalAppointments:
 *                       type: integer
 *                       description: Total appointments for the day
 *                     totalCustomers:
 *                       type: integer
 *                       description: Total unique customers served
 *                     averageBookingValue:
 *                       type: number
 *                       description: Average booking value for the day
 *                     occupancyRate:
 *                       type: number
 *                       description: Salon occupancy rate for the day
 *                     topServices:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           serviceName:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     topEmployees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           employeeName:
 *                             type: string
 *                           appointmentCount:
 *                             type: integer
 *                           revenue:
 *                             type: number
 *                     comparisonWithPreviousDay:
 *                       type: object
 *                       properties:
 *                         salesChange:
 *                           type: number
 *                         appointmentChange:
 *                           type: number
 *                         customerChange:
 *                           type: number
 *                 error:
 *                   type: string
 */
