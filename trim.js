// server.js
require('dotenv').config()
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan') // Added for logging
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./docs/swagger')
const { initializeWebSocket } = require('./socket_io')
const db = require('./models')
const errorHandler = require('./middlewares/errorHandler')



const Sentry = require("@sentry/node");

Sentry.init({
    dsn: "https://86ceec125b7efa1a86a6d53395f48251@o4509225538224128.ingest.de.sentry.io/4509236127858768",
    environment:process.env.NODE_ENV || 'production',
    sendDefaultPii: true,
  });

  console.log('Sentry environment:', process.env.NODE_ENV);

const app = express()
const server = require('http').createServer(app)
app.use(Sentry.Handlers.requestHandler())


// Importing routes
const salonAuth = require('./routes/salonRoutes/authRoute')
const salonRegistration = require('./routes/salonRoutes/salonRoute')
const employeeRoute = require('./routes/salonRoutes/employeeRoute')
const bookingRoute = require('./routes/salonRoutes/bookingRoute')
const customerRoute = require('./routes/userRoutes/customerRoute')
const customerAuth = require('./routes/userRoutes/authRoute')
const adminRoute = require('./routes/adminRoutes/adminRoute')
const reportsRoute = require('./routes/salonRoutes/reportsRoute')
const newReportsRoute = require('./routes/salonRoutes/newReportsRoute')
const performanceRoute = require('./routes/salonRoutes/performanceRoute')
const payoutRoute = require('./routes/payoutRoutes/payoutRoute')
const webhookRoute = require('./routes/webhookRoutes/webhooks')
const appleSubscriptionRoute = require('./routes/appleRoutes/appleSubscriptionRoute')
const deepLinkRoute = require('./routes/deepLinkRoutes/deepLinkRoute')
const internalRoute = require('./routes/internalRoutes/internalRoute')
const { publishApexDeepLinkFiles } = require('./helper/apexDeepLinks')

// Load environment variables



// Middleware setup
// Use bodyParser.raw for webhooks to receive raw body (application/json)
app.use('/webhook', bodyParser.raw({ type: 'application/json' }), webhookRoute)
// Apple webhook needs raw body parser
app.use('/apple-subscriptions/webhook', bodyParser.raw({ type: 'application/json' }), appleSubscriptionRoute)
// Apple App Store Connect version webhook needs raw body parser
app.use('/apple-subscriptions/app-version-webhook', bodyParser.raw({ type: 'application/json' }), appleSubscriptionRoute)
app.use('/Public', express.static(path.join(__dirname, 'Public')))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cors())
// Lets helpers that only get a user id find the request's acting branch.
app.use(require('./helper/requestContext').requestContext)
app.use(morgan('dev')) // Added for logging

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// General routes use express.json() for parsing JSON bodies
app.use('/salon/v1/auth',express.json(), salonAuth)
app.use('/salon/v1', express.json(), salonRegistration)
app.use('/salon/v1/employee', express.json(), employeeRoute)
app.use('/salon/v1/bookings', express.json(), bookingRoute)
app.use('/customer-auth', express.json(), customerAuth)
app.use('/customer', express.json(), customerRoute)
app.use('/admin', express.json(), adminRoute)
app.use('/reports', express.json(), reportsRoute)
app.use('/performance-dashboard', express.json(), performanceRoute)
app.use('/payout', express.json(), payoutRoute)
app.use('/new-reports', express.json(), newReportsRoute)
// Apple subscription routes (other routes use JSON parser)
app.use('/apple-subscriptions', express.json(), appleSubscriptionRoute)
// Machine-to-machine (AWS EventBridge) endpoints, secret-header authenticated
app.use('/internal', express.json(), internalRoute)



// Initialize WebSockets once
initializeWebSocket(server)


app.use(Sentry.Handlers.errorHandler());

// ─── Public: App Version Config (no auth) ────────────────────────────────────
app.get('/app-config.json', async (req, res) => {
  try {
    const rows = await db.appVersionConfig.findAll()

    // Build nested structure: { client: { android: {...}, ios: {...} }, business: { android: {...}, ios: {...} } }
    const config = {}
    rows.forEach((row) => {
      if (!config[row.appType]) config[row.appType] = {}
      config[row.appType][row.platform] = {
        latest_version: row.latestVersion,
        minimum_supported_version: row.minimumSupportedVersion,
        ...(row.forceUpdateMessage && { force_update_message: row.forceUpdateMessage }),
        ...(row.softUpdateMessage && { soft_update_message: row.softUpdateMessage }),
      }
    })

    return res.status(200).json(config)
  } catch (err) {
    console.error('[AppVersion] /app-config.json error:', err.message)
    // Always return 200 with safe fallback so Flutter is never blocked by a DB issue
    return res.status(200).json({
      client: {
        android: { latest_version: '1.0.15', minimum_supported_version: '1.0.15' },
        ios: { latest_version: '1.0.15', minimum_supported_version: '1.0.15' },
      },
      business: {
        android: { latest_version: '1.0.28', minimum_supported_version: '1.0.28' },
        ios: { latest_version: '2.0.2', minimum_supported_version: '2.0.2' },
      },
    })
  }
})

// ─── Deep linking: App Links / Universal Links verification + share fallbacks ─
// Mounted at root so it serves /.well-known/* and /salon-detail/:id etc.
app.use('/', deepLinkRoute)

// Handle undefined routes
app.use((req, res, next) => {
  const error = new Error(`Route not found ~ ${req.url}`)
  error.status = 404
  next(error)
})

// Error handling middleware
app.use(errorHandler)

// Synchronize Database
const serverPort = process.env.PORT || 3000

const syncDb = false // Use environment variable for flexibility

if (syncDb) {
  db.sequelize
    .sync({ alter: true })
    .then(() => {
      console.log('Database synchronized successfully.')
    })
    .catch((err) => {
      console.error('Error synchronizing database:', err)
    })
}

// Global sync is disabled above, so ensure ONLY the advert columns/tables exist
// (idempotent, targeted — does not touch the rest of the schema).
const { ensureBranchSchema } = require('./helper/branchSchema')
ensureBranchSchema(db)
  .then(() => console.log('[branchSchema] ensured'))
  .catch((err) => console.error('[branchSchema] failed:', err.message))
require('./helper/runningCosts').ensureRunningCostSchema().catch((e) => console.error('[runningCostSchema]', e.message))

const { ensureAdvertSchema } = require('./helper/advertSchema')
ensureAdvertSchema(db)
  .then(() => console.log('[advertSchema] ensured'))
  .catch((err) => console.error('[advertSchema] failed:', err.message))

// Create the rebooking-reminder tables if missing (global sync is off).
const { ensureRebookReminderSchema } = require('./helper/rebookReminderSchema')
ensureRebookReminderSchema(db)
  .then(() => console.log('[rebookReminderSchema] ensured'))
  .catch((err) => console.error('[rebookReminderSchema] failed:', err.message))

const { ensureBookingApprovalSchema } = require('./helper/bookingApprovalSchema')
ensureBookingApprovalSchema(db)
  .then(() => console.log('[bookingApprovalSchema] ensured'))
  .catch((err) => console.error('[bookingApprovalSchema] failed:', err.message))

const { ensureLoyaltySchema } = require('./helper/loyaltySchema')
ensureLoyaltySchema(db)
  .then(() => console.log('[loyaltySchema] ensured'))
  .catch((err) => console.error('[loyaltySchema] failed:', err.message))

// Chair moves, chair market and renters' own plans: tables first, then the
// one-time renter plan step. The server starts listening only after this, so
// no request ever sees renters without their free days.
const { ensureRenterMoveSchema } = require('./helper/renterMoveSchema')
const { ensureChairMarketSchema } = require('./helper/chairMarketSchema')
const { runRenterPlanMigration } = require('./helper/renterPlanMigration')
const chairReady = Promise.all([
  ensureRenterMoveSchema(db)
    .then(() => console.log('[renterMoveSchema] ensured'))
    .then(() => runRenterPlanMigration(db))
    .then((r) => {
      if (!r.ran) return
      console.log(`[renterPlanMigration] ${r.renters} chair renters got 30 free days`)
      if (r.blocked.length) {
        console.warn(`[renterPlanMigration] ${r.blocked.length} chair renters are still blocked from the old rule; review:`,
          r.blocked.map((b) => `${b.id} ${b.salonName} <${b.email}>`).join('; '))
      }
    }),
  ensureChairMarketSchema(db).then(() => console.log('[chairMarketSchema] ensured')),
]).catch((err) => console.error('[chair schema / renter plan migration] failed:', err.message))

const { ensureMobileBarberSchema } = require('./helper/mobileBarberSchema')
ensureMobileBarberSchema(db)
  .then(() => console.log('[mobileBarberSchema] ensured'))
  .catch((err) => console.error('[mobileBarberSchema] failed:', err.message))

// Handle unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Optionally, restart the server or perform other actions
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err)
  // Optionally, restart the server or perform other actions
  process.exit(1) // Exit the process to avoid undefined states
})

// Graceful Shutdown
const gracefulShutdown = () => {
  console.log('Received kill signal, shutting down gracefully.')
  server.close(() => {
    console.log('Closed out remaining connections.')
    process.exit(0)
  })

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error(
      'Could not close connections in time, forcefully shutting down.',
    )
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

// Start the server (after the chair renter tables and plan step are ready)
chairReady.finally(() => server.listen(serverPort, (err) => {
  if (err) throw err
  
  const env = process.env.NODE_ENV || 'development'
  let baseUrl
  
  switch(env) {
    case 'production':
      baseUrl = 'https://backend.trimworldwide.com'
      break
    case 'test':
      baseUrl = 'https://stage.trimworldwide.com'
      break
    default:
      baseUrl = `http://localhost:${serverPort}`
  }

  console.log('\x1b[32m%s\x1b[0m', `Server is running in ${env.toUpperCase()} mode`)
  console.log('\x1b[36m%s\x1b[0m', `Server is listening on: ${baseUrl}`)
  console.log('\x1b[35m%s\x1b[0m', `Swagger Documentation: ${baseUrl}/api-docs`)
  console.log('\x1b[33m%s\x1b[0m', `Environment: ${env}`)

  // Publish the App-Link / Universal-Link association files to the apex
  // trimworldwide.com document root so tapped share links open the app.
  publishApexDeepLinkFiles()
}))



// ─── App Version Cron (hourly store version check) ───────────────────────────
require('./jobs/appVersionCron')

// ─── Booking Requests Cron (expiry + shop reminder, every 5 minutes) ─────────
require('./jobs/bookingRequestCron')

// ─── Renter Move Cron (chair renters moving shop on their move date) ─────────
require('./jobs/renterMoveCron')
require('./jobs/mobileVisitCron')
require('./jobs/brandPlanCron')
require('./jobs/approvalsCron')
require('./jobs/accessPeriodCron')
require('./jobs/runningCostCron')

// hello