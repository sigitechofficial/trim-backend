/**
 * @swagger
 * tags:
 *   name: Salon New Reports
 *   description: Advanced reporting and analytics system for salons
 */

/**
 * @swagger
 * /new-reports/busiest-vs-quietest/{basedOn}:
 *   get:
 *     summary: Analyze peak traffic patterns with revenue impact and capacity optimization insights
 *     tags: [Salon New Reports]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: basedOn
 *         required: true
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *         description: Time period basis for the report
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report period
 *     responses:
 *       200:
 *         description: Busiest vs quietest periods report
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
 *                     busiestPeriods:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                           bookingCount:
 *                             type: integer
 *                           revenue:
 *                             type: number
 *                     quietestPeriods:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                           bookingCount:
 *                             type: integer
 *                           revenue:
 *                             type: number
 *                     averageBookings:
 *                       type: number
 *                     totalBookings:
 *                       type: integer
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /new-reports/services-by-staff-per-week:
 *   get:
 *     summary: Track weekly staff productivity with service volume and revenue metrics
 *     tags: [Salon New Reports]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *         description: Filter by specific employee
 *     responses:
 *       200:
 *         description: Services by staff per week report
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
 *                     weeklyData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           week:
 *                             type: string
 *                           employees:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 employeeId:
 *                                   type: integer
 *                                 employeeName:
 *                                   type: string
 *                                 servicesProvided:
 *                                   type: integer
 *                                 revenue:
 *                                   type: number
 *                     totalServices:
 *                       type: integer
 *                     totalRevenue:
 *                       type: number
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /new-reports/services-provided-by-each-employee:
 *   get:
 *     summary: Evaluate staff performance with service specialization and revenue contribution analysis
 *     tags: [Salon New Reports]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report period
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top employees to return
 *     responses:
 *       200:
 *         description: Services provided by each employee report
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
 *                       employeeId:
 *                         type: integer
 *                       employeeName:
 *                         type: string
 *                       totalServices:
 *                         type: integer
 *                       totalRevenue:
 *                         type: number
 *                       averageServiceValue:
 *                         type: number
 *                       topServices:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             serviceName:
 *                               type: string
 *                             count:
 *                               type: integer
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /new-reports/most-popular-services:
 *   get:
 *     summary: Identify top-performing services with popularity trends and revenue analytics
 *     tags: [Salon New Reports]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report period
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top services to return
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter by service category
 *     responses:
 *       200:
 *         description: Most popular services report
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
 *                       serviceId:
 *                         type: integer
 *                       serviceName:
 *                         type: string
 *                       categoryName:
 *                         type: string
 *                       bookingCount:
 *                         type: integer
 *                       totalRevenue:
 *                         type: number
 *                       averagePrice:
 *                         type: number
 *                       popularityPercentage:
 *                         type: number
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /new-reports/services-performance:
 *   get:
 *     summary: Analyze service performance metrics with growth trends and optimization recommendations
 *     tags: [Salon New Reports]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the analysis period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the analysis period
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: integer
 *         description: Analyze specific service
 *     responses:
 *       200:
 *         description: Services performance analysis
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
 *                     servicesPerformance:
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
 *                           growthRate:
 *                             type: number
 *                           performanceScore:
 *                             type: number
 *                     topPerformers:
 *                       type: array
 *                       items:
 *                         type: object
 *                     underPerformers:
 *                       type: array
 *                       items:
 *                         type: object
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /new-reports/income-report-yearly/{year}:
 *   get:
 *     summary: Generate comprehensive yearly revenue analysis with growth comparisons and forecasting
 *     tags: [Salon New Reports]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year for the income report
 *       - in: query
 *         name: breakdown
 *         schema:
 *           type: string
 *           enum: [monthly, quarterly]
 *           default: monthly
 *         description: Breakdown type for the yearly report
 *     responses:
 *       200:
 *         description: Yearly income report
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
 *                     year:
 *                       type: integer
 *                     totalIncome:
 *                       type: number
 *                     monthlyBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           income:
 *                             type: number
 *                           bookings:
 *                             type: integer
 *                           averageBookingValue:
 *                             type: number
 *                     growthRate:
 *                       type: number
 *                     comparisonWithPreviousYear:
 *                       type: object
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /new-reports/income-report-week:
 *   get:
 *     summary: Track weekly revenue performance with daily breakdowns and trend analysis
 *     tags: [Salon New Reports]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the weekly report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the weekly report
 *       - in: query
 *         name: weeksCount
 *         schema:
 *           type: integer
 *           default: 4
 *         description: Number of weeks to include in the report
 *     responses:
 *       200:
 *         description: Weekly income report
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
 *                     weeklyData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           weekStart:
 *                             type: string
 *                             format: date
 *                           weekEnd:
 *                             type: string
 *                             format: date
 *                           totalIncome:
 *                             type: number
 *                           bookingCount:
 *                             type: integer
 *                           averageBookingValue:
 *                             type: number
 *                           dailyBreakdown:
 *                             type: array
 *                             items:
 *                               type: object
 *                     totalIncome:
 *                       type: number
 *                     averageWeeklyIncome:
 *                       type: number
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /new-reports/income-report-per-hour:
 *   get:
 *     summary: Monitor hourly revenue patterns with utilization rates and peak performance indicators
 *     tags: [Salon New Reports]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Specific date for hourly analysis
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for hourly analysis period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for hourly analysis period
 *     responses:
 *       200:
 *         description: Hourly income report
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
 *                     hourlyBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           hour:
 *                             type: string
 *                           income:
 *                             type: number
 *                           bookingCount:
 *                             type: integer
 *                           utilizationRate:
 *                             type: number
 *                     peakHours:
 *                       type: array
 *                       items:
 *                         type: string
 *                     totalIncome:
 *                       type: number
 *                     averageHourlyIncome:
 *                       type: number
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /new-reports/average-bookings:
 *   get:
 *     summary: Analyze booking trends with period-over-period comparisons and revenue correlation
 *     tags: [Salon New Reports]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: daily
 *         description: Period for average calculation
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the analysis period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the analysis period
 *     responses:
 *       200:
 *         description: Average bookings report
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
 *                     averageBookingsPerPeriod:
 *                       type: number
 *                     totalBookings:
 *                       type: integer
 *                     periodsAnalyzed:
 *                       type: integer
 *                     trendAnalysis:
 *                       type: object
 *                       properties:
 *                         trend:
 *                           type: string
 *                           enum: [increasing, decreasing, stable]
 *                         changePercentage:
 *                           type: number
 *                     periodBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                           bookingCount:
 *                             type: integer
 *                           revenue:
 *                             type: number
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /new-reports/subscriptions/history:
 *   get:
 *     summary: Track subscription lifecycle with revenue analytics and retention metrics
 *     tags: [Salon New Reports]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for subscription history
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for subscription history
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, cancelled, expired, pending]
 *         description: Filter by subscription status
 *     responses:
 *       200:
 *         description: Subscription history report
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
 *                     subscriptionHistory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           subscriptionId:
 *                             type: integer
 *                           planName:
 *                             type: string
 *                           startDate:
 *                             type: string
 *                             format: date
 *                           endDate:
 *                             type: string
 *                             format: date
 *                           status:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           paymentMethod:
 *                             type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalSubscriptions:
 *                           type: integer
 *                         activeSubscriptions:
 *                           type: integer
 *                         totalRevenue:
 *                           type: number
 *                         averageSubscriptionValue:
 *                           type: number
 *                 error:
 *                   type: string
 */
