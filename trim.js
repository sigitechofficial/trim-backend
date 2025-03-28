// server.js

const express = require('express')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan') // Added for logging
const { initializeWebSocket } = require('./socket_io')
const db = require('./models')
const errorHandler = require('./middlewares/errorHandler')

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
dotenv.config({ path: '../.env' })

const app = express()
const server = require('http').createServer(app)

// Middleware setup
app.use(cors())
app.use(morgan('dev')) // Added for logging

// General routes use express.json() for parsing JSON bodies
app.use('/salon/v1/auth', express.json(), salonAuth)
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

// Use bodyParser.raw for webhooks to receive raw body (application/json)
app.use('/webhook', bodyParser.raw({ type: 'application/json' }), webhookRoute)

// Initialize WebSockets once
initializeWebSocket(server)

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
server.listen(serverPort, host, (err) => {
  if (err) throw err
  console.log(`Server is listening on :http://${serverPort}`)
})
