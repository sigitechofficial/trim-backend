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

// Load environment variables



// Middleware setup
// Use bodyParser.raw for webhooks to receive raw body (application/json)
app.use('/webhook', bodyParser.raw({ type: 'application/json' }), webhookRoute)
app.use('/Public', express.static(path.join(__dirname, 'Public')))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cors())
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



// Initialize WebSockets once
initializeWebSocket(server)


app.use(Sentry.Handlers.errorHandler());

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
    .sync({ force: true })
    .then(() => {
      console.log('Database synchronized successfully.')
    })
    .catch((err) => {
      console.error('Error synchronizing database:', err)
    })
}

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

// Start the server
server.listen(serverPort, (err) => {
  if (err) throw err
  
  const env = process.env.NODE_ENV || 'development'
  let baseUrl
  
  switch(env) {
    case 'production':
      baseUrl = 'https://api.trimworldwide.com'
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
})
