/**
 * @swagger
 * tags:
 *   name: Payout
 *   description: Complete payout and employee compensation management
 */

/**
 * @swagger
 * /payout/commission-employees:
 *   get:
 *     summary: Retrieve comprehensive list of commission-based staff with earnings and pending payment details
 *     tags: [Payout]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of commission-based employees
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
 *                       id:
 *                         type: integer
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       totalEarnings:
 *                         type: number
 *                       pendingAmount:
 *                         type: number
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /payout/rent-a-chair-employees:
 *   get:
 *     summary: Access complete list of rent-a-chair staff with rental terms and payment status tracking
 *     tags: [Payout]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of rent-a-chair employees
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
 *                       id:
 *                         type: integer
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       rentAmount:
 *                         type: number
 *                       totalEarnings:
 *                         type: number
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /payout/salary-employees:
 *   get:
 *     summary: Retrieve comprehensive list of salaried staff with payment schedules and compensation details
 *     tags: [Payout]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of salaried employees
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
 *                       id:
 *                         type: integer
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       salaryAmount:
 *                         type: number
 *                       lastPayoutDate:
 *                         type: string
 *                         format: date
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /payout/transfer-salary-to-employee:
 *   post:
 *     summary: Process secure salary payments with multiple payment method options and transaction tracking
 *     tags: [Payout]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - amount
 *               - paymentMethod
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: Employee ID to transfer salary to
 *               amount:
 *                 type: number
 *                 description: Salary amount to transfer
 *               paymentMethod:
 *                 type: string
 *                 enum: [bank_transfer, stripe]
 *                 description: Payment method for salary transfer
 *               notes:
 *                 type: string
 *                 description: Optional notes for the salary transfer
 *     responses:
 *       200:
 *         description: Salary transferred successfully
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
 *                     transactionId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     transferDate:
 *                       type: string
 *                       format: date-time
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /payout/commission-employee-details/{employee}:
 *   get:
 *     summary: Access detailed commission employee profile including earnings history, rates, and payment analytics
 *     tags: [Payout]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: employee
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Commission employee summary details
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
 *                     employeeInfo:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                     totalEarnings:
 *                       type: number
 *                     pendingAmount:
 *                       type: number
 *                     paidAmount:
 *                       type: number
 *                     commissionRate:
 *                       type: number
 *                     recentTransactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /payout/rent-a-chair-employee-details/{employee}:
 *   get:
 *     summary: View detailed rent-a-chair employee profile including rental agreements, earnings, and payment history
 *     tags: [Payout]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: employee
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Rent-a-chair employee summary details
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
 *                     employeeInfo:
 *                       type: object
 *                     rentAmount:
 *                       type: number
 *                     totalEarnings:
 *                       type: number
 *                     dueAmount:
 *                       type: number
 *                     lastPaymentDate:
 *                       type: string
 *                       format: date
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /payout/salary-employee-details/{employee}:
 *   get:
 *     summary: Access detailed salary employee profile including payment history, schedules, and compensation analytics
 *     tags: [Payout]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: employee
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Salary employee summary details
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
 *                     employeeInfo:
 *                       type: object
 *                     salaryAmount:
 *                       type: number
 *                     totalPaid:
 *                       type: number
 *                     lastPayoutDate:
 *                       type: string
 *                       format: date
 *                     nextPayoutDate:
 *                       type: string
 *                       format: date
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /payout/transfer-to-commission-employee:
 *   post:
 *     summary: Execute commission payouts with customizable payment methods and automated transaction records
 *     tags: [Payout]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - amount
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: Employee ID to transfer commission to
 *               amount:
 *                 type: number
 *                 description: Commission amount to transfer
 *               paymentMethod:
 *                 type: string
 *                 enum: [bank_transfer, stripe]
 *                 description: Payment method for commission transfer
 *               notes:
 *                 type: string
 *                 description: Optional notes for the commission transfer
 *     responses:
 *       200:
 *         description: Commission transferred successfully
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
 *                     transactionId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     transferDate:
 *                       type: string
 *                       format: date-time
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /payout/transfer-to-rent-a-chair-employee:
 *   post:
 *     summary: Process payments to rent-a-chair staff with flexible payment options and earning reconciliation
 *     tags: [Payout]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - amount
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: Employee ID to transfer amount to
 *               amount:
 *                 type: number
 *                 description: Amount to transfer
 *               paymentMethod:
 *                 type: string
 *                 enum: [bank_transfer, stripe]
 *                 description: Payment method for transfer
 *               notes:
 *                 type: string
 *                 description: Optional notes for the transfer
 *     responses:
 *       200:
 *         description: Amount transferred successfully
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
 *                     transactionId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     transferDate:
 *                       type: string
 *                       format: date-time
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /payout/commission/transaction-history/{employee}:
 *   get:
 *     summary: Access detailed commission transaction records with payment status tracking and historical analytics
 *     tags: [Payout]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: employee
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Commission transaction history
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
 *                       id:
 *                         type: integer
 *                       amount:
 *                         type: number
 *                       transactionType:
 *                         type: string
 *                         enum: [commission_earned, commission_paid]
 *                       transactionDate:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [pending, completed, failed]
 *                       notes:
 *                         type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /payout/rent-a-chair/transaction-history/{employee}:
 *   get:
 *     summary: View comprehensive rent-a-chair payment history with transaction status and payment reconciliation
 *     tags: [Payout]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: employee
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Rent-a-chair transaction history
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
 *                       id:
 *                         type: integer
 *                       amount:
 *                         type: number
 *                       transactionType:
 *                         type: string
 *                         enum: [rent_earned, rent_paid, payout]
 *                       transactionDate:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /payout/salary/transaction-history/{employee}:
 *   get:
 *     summary: Retrieve complete salary payment history with transaction details and payment method tracking
 *     tags: [Payout]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: employee
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Salary transaction history
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
 *                       id:
 *                         type: integer
 *                       amount:
 *                         type: number
 *                       transactionType:
 *                         type: string
 *                         enum: [salary_paid]
 *                       transactionDate:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [pending, completed, failed]
 *                       paymentMethod:
 *                         type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /payout/salary/employee-account/{employee}:
 *   get:
 *     summary: View salary employee banking information and payment preferences for automated transfers
 *     tags: [Payout]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: employee
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Salary employee account details
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
 *                     employeeInfo:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                     accountDetails:
 *                       type: object
 *                       properties:
 *                         bankAccount:
 *                           type: string
 *                         routingNumber:
 *                           type: string
 *                         accountType:
 *                           type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /payout/rent-collection/dues/{salon}:
 *   get:
 *     summary: Monitor and track rent collection status with detailed dues analysis for external staff members
 *     tags: [Payout]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: salon
 *         required: true
 *         schema:
 *           type: integer
 *         description: Salon ID
 *     responses:
 *       200:
 *         description: Rent collection dues summary for external employees
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
 *                     salonInfo:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                     externalEmployees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           employeeId:
 *                             type: integer
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           dueAmount:
 *                             type: number
 *                           lastPaymentDate:
 *                             type: string
 *                             format: date
 *                     totalDues:
 *                       type: number
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /payout/collect-rent/external-employee/{employee}:
 *   post:
 *     summary: Process rent collection with multiple payment options and automated balance reconciliation
 *     tags: [Payout]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: employee
 *         required: true
 *         schema:
 *           type: integer
 *         description: External employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Rent amount to collect
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, bank_transfer]
 *                 description: Payment method used for rent collection
 *               notes:
 *                 type: string
 *                 description: Optional notes for the rent collection
 *     responses:
 *       200:
 *         description: Rent collected successfully
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
 *                     transactionId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     collectionDate:
 *                       type: string
 *                       format: date-time
 *                     remainingDue:
 *                       type: number
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /payout/rent-collection/transaction-history/{employee}:
 *   get:
 *     summary: Access complete rent collection history with payment tracking and outstanding balance management
 *     tags: [Payout]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: employee
 *         required: true
 *         schema:
 *           type: integer
 *         description: External employee ID
 *     responses:
 *       200:
 *         description: Rent collection transaction history
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
 *                       id:
 *                         type: integer
 *                       amount:
 *                         type: number
 *                       transactionType:
 *                         type: string
 *                         enum: [rent_collected, rent_due]
 *                       transactionDate:
 *                         type: string
 *                         format: date-time
 *                       paymentMethod:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [completed, pending, failed]
 *                       notes:
 *                         type: string
 *                 error:
 *                   type: string
 */
