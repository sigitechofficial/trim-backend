/**
 * @swagger
 * tags:
 *   name: Salon Reports Legacy
 *   description: Legacy reporting system for salons (original reports module)
 */

/**
 * @swagger
 * /reports/peak-times-report:
 *   get:
 *     summary: Analyze salon peak hours and customer traffic patterns for optimal scheduling
 *     tags: [Salon Reports Legacy]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for peak times analysis
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for peak times analysis
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hourly, daily, weekly, monthly]
 *           default: hourly
 *         description: Time period granularity for peak analysis
 *     responses:
 *       200:
 *         description: Peak times report retrieved successfully
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
 *                     peakTimes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           timeSlot:
 *                             type: string
 *                           bookingCount:
 *                             type: integer
 *                           revenue:
 *                             type: number
 *                           utilizationRate:
 *                             type: number
 *                     quietTimes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           timeSlot:
 *                             type: string
 *                           bookingCount:
 *                             type: integer
 *                           revenue:
 *                             type: number
 *                     averageBookingsPerSlot:
 *                       type: number
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /reports/financial-report:
 *   get:
 *     summary: Generate comprehensive financial analytics including revenue, expenses, and profit breakdown
 *     tags: [Salon Reports Legacy]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for financial report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for financial report
 *       - in: query
 *         name: includeBreakdown
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include detailed breakdown by service, employee, etc.
 *     responses:
 *       200:
 *         description: Financial report retrieved successfully
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
 *                     totalRevenue:
 *                       type: number
 *                       description: Total revenue for the period
 *                     totalExpenses:
 *                       type: number
 *                       description: Total expenses for the period
 *                     netProfit:
 *                       type: number
 *                       description: Net profit (revenue - expenses)
 *                     profitMargin:
 *                       type: number
 *                       description: Profit margin percentage
 *                     revenueByService:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           serviceId:
 *                             type: integer
 *                           serviceName:
 *                             type: string
 *                           revenue:
 *                             type: number
 *                           percentage:
 *                             type: number
 *                     revenueByEmployee:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           employeeId:
 *                             type: integer
 *                           employeeName:
 *                             type: string
 *                           revenue:
 *                             type: number
 *                           percentage:
 *                             type: number
 *                     expenseBreakdown:
 *                       type: object
 *                       properties:
 *                         salaries:
 *                           type: number
 *                         commissions:
 *                           type: number
 *                         supplies:
 *                           type: number
 *                         rent:
 *                           type: number
 *                         utilities:
 *                           type: number
 *                         other:
 *                           type: number
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /reports/financial-graph/{filter}:
 *   get:
 *     summary: Visualize financial performance trends with customizable time periods and metrics
 *     tags: [Salon Reports Legacy]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: filter
 *         required: true
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         description: Time filter for financial graph data
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
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [revenue, profit, expenses, bookings]
 *           default: revenue
 *         description: Financial metric to display
 *     responses:
 *       200:
 *         description: Financial graph data retrieved successfully
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
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         average:
 *                           type: number
 *                         trend:
 *                           type: string
 *                           enum: [increasing, decreasing, stable]
 *                         changePercentage:
 *                           type: number
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /reports/time-off-day-analysis-report:
 *   get:
 *     summary: Analyze employee availability patterns and optimize workforce scheduling efficiency
 *     tags: [Salon Reports Legacy]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
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
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *         description: Filter by specific employee
 *     responses:
 *       200:
 *         description: Time off and day analysis report retrieved successfully
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
 *                     employeeTimeOff:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           employeeId:
 *                             type: integer
 *                           employeeName:
 *                             type: string
 *                           totalTimeOff:
 *                             type: integer
 *                           scheduledDays:
 *                             type: integer
 *                           workingDays:
 *                             type: integer
 *                           utilizationRate:
 *                             type: number
 *                     dayAnalysis:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           dayOfWeek:
 *                             type: string
 *                           averageBookings:
 *                             type: number
 *                           averageRevenue:
 *                             type: number
 *                           employeeUtilization:
 *                             type: number
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /reports/ep-stc-report:
 *   get:
 *     summary: Compare employee performance metrics across different service categories for strategic insights
 *     tags: [Salon Reports Legacy]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for EP-STC analysis
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for EP-STC analysis
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *         description: Filter by specific employee
 *       - in: query
 *         name: serviceTypeId
 *         schema:
 *           type: integer
 *         description: Filter by specific service type
 *     responses:
 *       200:
 *         description: EP-STC report retrieved successfully
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
 *                     employeePerformance:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           employeeId:
 *                             type: integer
 *                           employeeName:
 *                             type: string
 *                           totalBookings:
 *                             type: integer
 *                           totalRevenue:
 *                             type: number
 *                           averageRating:
 *                             type: number
 *                           performanceScore:
 *                             type: number
 *                           serviceTypes:
 *                             type: array
 *                             items:
 *                               type: object
 *                     serviceTypeComparison:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           serviceTypeId:
 *                             type: integer
 *                           serviceTypeName:
 *                             type: string
 *                           totalBookings:
 *                             type: integer
 *                           totalRevenue:
 *                             type: number
 *                           averagePrice:
 *                             type: number
 *                           popularityRank:
 *                             type: integer
 *                     crossAnalysis:
 *                       type: object
 *                       properties:
 *                         topEmployeeServiceCombinations:
 *                           type: array
 *                           items:
 *                             type: object
 *                         underperformingCombinations:
 *                           type: array
 *                           items:
 *                             type: object
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /reports/client-file-report:
 *   get:
 *     summary: Access comprehensive customer profiles and relationship analytics for CRM optimization
 *     tags: [Salon Reports Legacy]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for client analysis
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for client analysis
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *         description: Filter by specific customer
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include detailed client information
 *     responses:
 *       200:
 *         description: Client file report retrieved successfully
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
 *                     totalClients:
 *                       type: integer
 *                       description: Total number of clients
 *                     newClients:
 *                       type: integer
 *                       description: Number of new clients in period
 *                     returningClients:
 *                       type: integer
 *                       description: Number of returning clients
 *                     clientRetentionRate:
 *                       type: number
 *                       description: Client retention rate percentage
 *                     clientDetails:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           customerId:
 *                             type: integer
 *                           customerName:
 *                             type: string
 *                           totalBookings:
 *                             type: integer
 *                           totalSpent:
 *                             type: number
 *                           averageBookingValue:
 *                             type: number
 *                           lastVisit:
 *                             type: string
 *                             format: date
 *                           favoriteServices:
 *                             type: array
 *                             items:
 *                               type: string
 *                           preferredEmployees:
 *                             type: array
 *                             items:
 *                               type: string
 *                           loyaltyScore:
 *                             type: number
 *                     clientSegmentation:
 *                       type: object
 *                       properties:
 *                         highValue:
 *                           type: integer
 *                         regular:
 *                           type: integer
 *                         occasional:
 *                           type: integer
 *                         atRisk:
 *                           type: integer
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /reports/appointment-conversion-report:
 *   get:
 *     summary: Track lead-to-booking conversion rates and identify sales optimization opportunities
 *     tags: [Salon Reports Legacy]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for conversion analysis
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for conversion analysis
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [online, phone, walk-in, referral]
 *         description: Filter by appointment source
 *     responses:
 *       200:
 *         description: Appointment conversion report retrieved successfully
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
 *                     totalInquiries:
 *                       type: integer
 *                       description: Total appointment inquiries
 *                     totalBookings:
 *                       type: integer
 *                       description: Total confirmed bookings
 *                     conversionRate:
 *                       type: number
 *                       description: Overall conversion rate percentage
 *                     conversionBySource:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           source:
 *                             type: string
 *                           inquiries:
 *                             type: integer
 *                           bookings:
 *                             type: integer
 *                           conversionRate:
 *                             type: number
 *                     conversionByService:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           serviceId:
 *                             type: integer
 *                           serviceName:
 *                             type: string
 *                           inquiries:
 *                             type: integer
 *                           bookings:
 *                             type: integer
 *                           conversionRate:
 *                             type: number
 *                     conversionTrends:
 *                       type: object
 *                       properties:
 *                         weekly:
 *                           type: array
 *                           items:
 *                             type: object
 *                         monthly:
 *                           type: array
 *                           items:
 *                             type: object
 *                     lostOpportunities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           reason:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           percentage:
 *                             type: number
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /reports/sold-services-graph:
 *   get:
 *     summary: Visualize service popularity trends and revenue performance by category or time period
 *     tags: [Salon Reports Legacy]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for services graph
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for services graph
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [service, category, employee, day, week, month]
 *           default: service
 *         description: Group services data by specific criteria
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limit number of services in graph
 *     responses:
 *       200:
 *         description: Sold services graph data retrieved successfully
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
 *                             type: array
 *                             items:
 *                               type: string
 *                     totalServicesSold:
 *                       type: integer
 *                     totalRevenue:
 *                       type: number
 *                     topSellingService:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         count:
 *                           type: integer
 *                         revenue:
 *                           type: number
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /reports/client-status-distribution-graph:
 *   get:
 *     summary: Segment customer base by loyalty, value, and engagement for targeted marketing strategies
 *     tags: [Salon Reports Legacy]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for client status analysis
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for client status analysis
 *       - in: query
 *         name: segmentBy
 *         schema:
 *           type: string
 *           enum: [loyalty, frequency, value, recency]
 *           default: loyalty
 *         description: Segment clients by specific criteria
 *     responses:
 *       200:
 *         description: Client status distribution graph data retrieved successfully
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
 *                       description: Client status categories
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
 *                             type: array
 *                             items:
 *                               type: string
 *                     clientDistribution:
 *                       type: object
 *                       properties:
 *                         newClients:
 *                           type: integer
 *                         regularClients:
 *                           type: integer
 *                         loyalClients:
 *                           type: integer
 *                         atRiskClients:
 *                           type: integer
 *                         inactiveClients:
 *                           type: integer
 *                     totalClients:
 *                       type: integer
 *                     insights:
 *                       type: array
 *                       items:
 *                         type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /reports/ep-stc-graph:
 *   get:
 *     summary: Visualize employee performance comparisons across service types with interactive charts
 *     tags: [Salon Reports Legacy]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for EP-STC graph
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for EP-STC graph
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [revenue, bookings, rating, efficiency]
 *           default: revenue
 *         description: Performance metric to display
 *       - in: query
 *         name: chartType
 *         schema:
 *           type: string
 *           enum: [bar, line, pie, doughnut]
 *           default: bar
 *         description: Type of chart to generate
 *     responses:
 *       200:
 *         description: EP-STC graph data retrieved successfully
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
 *                           borderColor:
 *                             type: string
 *                     performanceMetrics:
 *                       type: object
 *                       properties:
 *                         topPerformer:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                             value:
 *                               type: number
 *                         averagePerformance:
 *                           type: number
 *                         performanceRange:
 *                           type: object
 *                           properties:
 *                             min:
 *                               type: number
 *                             max:
 *                               type: number
 *                     serviceTypeMetrics:
 *                       type: object
 *                       properties:
 *                         mostPopularServiceType:
 *                           type: object
 *                         leastPopularServiceType:
 *                           type: object
 *                 error:
 *                   type: string
 */
