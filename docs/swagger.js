require('dotenv').config();
const swaggerJsdoc = require('swagger-jsdoc');

let url;

if(process.env.NODE_ENV === 'test'){
  url = `https://stage.trimworldwide.com/`;
}else if(process.env.NODE_ENV === 'production'){
  url = `https://backend.trimworldwide.com/`;
}else{
  url = `http://localhost:${process.env.PORT}`;
}


const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Trim Backend API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Trim salon management system',
      contact: {
        name: 'API Support',
        email: 'support@trim.com'
      },
    },
    servers: [
      {
        url: url,
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        AccessTokenAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'accessToken',
          description: 'JWT token passed in accessToken header'
        }
      }
    },
    security: [{
      AccessTokenAuth: []
    }],
    tags: [
      { name: 'Admin', description: 'Admin management and reports system' },
      { name: 'Payout', description: 'Employee payment and payout management' },
      { name: 'Salon Auth', description: 'Salon authentication and authorization' },
      { name: 'Salon Bookings', description: 'Complete booking management system' },
      { name: 'Salon Employees', description: 'Employee management and scheduling' },
      { name: 'Salon New Reports', description: 'Advanced reporting and analytics' },
      { name: 'Salon Performance', description: 'Performance analytics dashboard' },
      { name: 'Salon Reports Legacy', description: 'Legacy reporting system' },
      { name: 'Salon Main', description: 'Main salon management and configuration' },
      { name: 'User Auth', description: 'Customer authentication system' },
      { name: 'User Customer', description: 'Customer management and booking' },
      { name: 'Webhooks', description: 'Stripe webhook endpoints' }
    ]
  },
  apis: [
    './docs/admin-complete.js',
    './docs/payout-complete.js',
    './docs/salon-auth-complete.js',
    './docs/salon-bookings-complete.js',
    './docs/salon-employees-complete.js',
    './docs/salon-new-reports-complete.js',
    './docs/salon-performance-complete.js',
    './docs/salon-reports-complete.js',
    './docs/salon-main-complete.js',
    './docs/user-auth-complete.js',
    './docs/user-customer-complete.js',
    './docs/webhooks-complete.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
