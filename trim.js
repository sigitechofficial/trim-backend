const express = require('express')
// utf8mb4_general_ci
const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })
const bodyParser = require('body-parser')
// const http = require('http');
const cors = require('cors')

const app = express()
const server = require('http').createServer(app)
const db = require('./models')
const errorHandler = require('./middlewares/errorHandler')
const { initializeWebSocket } = require('./socket_io')
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
// Use the workerRoute for the /workerinfo route

// Middleware setup
app.use(cors())

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

initializeWebSocket(server)
// Route mounting
// app.use((req, res, next) => {
//   const error = new Error(`Route not found ~ ${req.url}`);
//   error.status = 404;
//   next(error);
// });

app.use(errorHandler)
// ... (other middleware and routes as needed)

const serverPort = process.env.PORT || 3000
const syncDb = 0
if (syncDb) db.sequelize.sync({ alter: true })

server.listen(serverPort, (err) => {
  if (err) throw err
  console.log(`Listening on port :${serverPort}`)
})

//utf8mb4_general_ci
