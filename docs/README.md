# Trim Backend API Documentation

This directory contains comprehensive Swagger/OpenAPI documentation for the Trim salon management system backend API.

## Overview

The Trim Backend API provides a complete salon management solution with features including:
- User authentication for both customers and salons
- Appointment booking and management
- Employee management and payroll
- Reporting and analytics
- Payment processing via Stripe
- Real-time notifications

## Documentation Files

### Core Documentation
- `swagger.js` - Main Swagger configuration file
- `models.js` - Data models and schemas (if needed for additional models)

### Authentication & Users
- `auth.js` - Customer authentication endpoints
- `salon-auth.js` - Salon authentication endpoints  
- `customer.js` - Customer management endpoints

### Salon Management
- `salon.js` - Main salon management endpoints
- `salon-bookings.js` - Booking management for salons
- `salon-employees.js` - Employee management for salons
- `salon-reports.js` - Reporting and analytics for salons
- `performance-dashboard.js` - Performance analytics dashboard

### Administrative
- `admin.js` - Admin management endpoints
- `payout.js` - Payment and payout related endpoints
- `webhooks.js` - Webhook handling endpoints

## API Statistics
- **Total Endpoints Documented**: 124
- **Authentication Methods**: JWT Bearer Token
- **Base URL**: Configurable via environment variables

## Accessing the Documentation

1. Start your server: `npm start`
2. Visit: `http://localhost:3000/api-docs` (or your configured port)
3. Use the interactive Swagger UI to explore and test endpoints

## API Structure

### Base Routes
- `/customer-auth/*` - Customer authentication
- `/customer/*` - Customer operations
- `/salon/v1/auth/*` - Salon authentication
- `/salon/v1/*` - Main salon operations
- `/salon/v1/bookings/*` - Booking management
- `/salon/v1/employee/*` - Employee management
- `/new-reports/*` - New reporting system
- `/reports/*` - Legacy reporting system
- `/performance-dashboard/*` - Performance analytics
- `/admin/*` - Administrative operations
- `/payout/*` - Payment and payout operations
- `/webhook/*` - Webhook handlers

### Key Features Documented

#### Authentication
- User registration and login
- OTP verification
- Password reset flows
- Session management
- Google/Apple/Facebook social login

#### Booking Management
- Appointment scheduling
- Walk-in customer handling
- Booking modifications and cancellations
- Calendar views
- Payment processing

#### Employee Management
- Employee registration and profiles
- Service assignments
- Working hours management
- Access level controls
- Wage method configuration

#### Reporting & Analytics
- Financial reports
- Performance metrics
- Service popularity analysis
- Peak time analysis
- Customer analytics

#### Payment Processing
- Stripe integration
- Commission tracking
- Salary management
- Rent collection for chair rentals
- Transaction history

## Security

All protected endpoints require JWT Bearer token authentication. The token should be included in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a consistent format:
```json
{
  "status": "1",
  "message": "Success message",
  "data": { ... },
  "error": ""
}
```

## Error Handling

The API uses standard HTTP status codes and provides detailed error messages in the response body.

## Support

For API support or questions about the documentation, please contact the development team.
