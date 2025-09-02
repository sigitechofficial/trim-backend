/**
 * @swagger
 * tags:
 *   name: Salon Employees
 *   description: Complete employee management system for salons
 */

/**
 * @swagger
 * /salon/v1/employee/employees:
 *   get:
 *     summary: Retrieve comprehensive list of salon staff with employment status and contact information
 *     tags: [Salon Employees]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of all employees
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
 *                       phoneNumber:
 *                         type: string
 *                       status:
 *                         type: boolean
 *                       profile:
 *                         type: string
 *                       employeeType:
 *                         type: string
 *                         enum: [internal, external]
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/employee/employees/{type}:
 *   get:
 *     summary: Filter staff roster by employment type with detailed profile information
 *     tags: [Salon Employees]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [internal, external]
 *         description: Type of employees to retrieve
 *     responses:
 *       200:
 *         description: List of employees by type
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
 *                       employeeType:
 *                         type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/employee/AddEmployee:
 *   post:
 *     summary: Register new staff member with complete profile setup and role configuration
 *     tags: [Salon Employees]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phoneNumber
 *               - countryCode
 *               - employeeType
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Employee's first name
 *               lastName:
 *                 type: string
 *                 description: Employee's last name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Employee's email address
 *               phoneNumber:
 *                 type: string
 *                 description: Employee's phone number
 *               countryCode:
 *                 type: string
 *                 description: Country code for phone number
 *               employeeType:
 *                 type: string
 *                 enum: [internal, external]
 *                 description: Type of employee (internal or external/chair rental)
 *               profile:
 *                 type: string
 *                 format: binary
 *                 description: Employee's profile picture
 *               password:
 *                 type: string
 *                 description: Employee's login password
 *               specialization:
 *                 type: string
 *                 description: Employee's area of specialization
 *     responses:
 *       200:
 *         description: Employee added successfully
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
 *                     employeeId:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/employee/getWagesMethod:
 *   get:
 *     summary: Retrieve available compensation models including salary, commission, and chair rental options
 *     tags: [Salon Employees]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of wages methods
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
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [commission, salary, rent-a-chair]
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/employee/addWagesMethod:
 *   post:
 *     summary: Configure employee compensation structure with customizable rates and payment schedules
 *     tags: [Salon Employees]
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
 *               - wagesMethodId
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: ID of the employee
 *               wagesMethodId:
 *                 type: integer
 *                 description: ID of the wages method
 *               amount:
 *                 type: number
 *                 description: Fixed amount (for salary or rent)
 *               percentage:
 *                 type: number
 *                 description: Commission percentage (for commission-based)
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date for this wages method
 *     responses:
 *       200:
 *         description: Wages method added successfully
 */

/**
 * @swagger
 * /salon/v1/employee/getEmployeeTiming:
 *   post:
 *     summary: Access staff scheduling details with daily work hours and availability patterns
 *     tags: [Salon Employees]
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
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: ID of the employee to get timing for
 *     responses:
 *       200:
 *         description: Employee timing retrieved successfully
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
 *                       day:
 *                         type: string
 *                         enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *                       startTime:
 *                         type: string
 *                         format: time
 *                       endTime:
 *                         type: string
 *                         format: time
 *                       isOff:
 *                         type: boolean
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/employee/getServices:
 *   get:
 *     summary: Retrieve complete service catalog for staff qualification and assignment management
 *     tags: [Salon Employees]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of salon services
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
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *                       duration:
 *                         type: integer
 *                       categoryId:
 *                         type: integer
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/employee/addEmployeeService:
 *   post:
 *     summary: Assign services to staff member with customizable pricing and duration settings
 *     tags: [Salon Employees]
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
 *               - services
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: ID of the employee
 *               services:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     serviceId:
 *                       type: integer
 *                     customPrice:
 *                       type: number
 *                       description: Custom price for this employee (optional)
 *                     customDuration:
 *                       type: integer
 *                       description: Custom duration for this employee (optional)
 *                 description: Array of services to assign to employee
 *     responses:
 *       200:
 *         description: Services added to employee successfully
 */

/**
 * @swagger
 * /salon/v1/employee/employeeDetail:
 *   post:
 *     summary: Access comprehensive employee profile including services, schedules, and compensation details
 *     tags: [Salon Employees]
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
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: ID of the employee to get details for
 *     responses:
 *       200:
 *         description: Employee details retrieved successfully
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
 *                     services:
 *                       type: array
 *                       items:
 *                         type: object
 *                     workingHours:
 *                       type: array
 *                       items:
 *                         type: object
 *                     wagesMethod:
 *                       type: object
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/employee/updateEmployeTimings:
 *   patch:
 *     summary: Modify staff work schedule with daily time slots and availability management
 *     tags: [Salon Employees]
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
 *               - timings
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: ID of the employee
 *               timings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                       enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *                     startTime:
 *                       type: string
 *                       format: time
 *                     endTime:
 *                       type: string
 *                       format: time
 *                     isOff:
 *                       type: boolean
 *                 description: Array of working hours for each day
 *     responses:
 *       200:
 *         description: Employee timings updated successfully
 */

/**
 * @swagger
 * /salon/v1/employee/updateEmployeeService:
 *   patch:
 *     summary: Modify staff service assignments with pricing adjustments and availability status
 *     tags: [Salon Employees]
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
 *               - services
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: ID of the employee
 *               services:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     serviceId:
 *                       type: integer
 *                     customPrice:
 *                       type: number
 *                     customDuration:
 *                       type: integer
 *                     isActive:
 *                       type: boolean
 *                 description: Updated array of services for employee
 *     responses:
 *       200:
 *         description: Employee services updated successfully
 */

/**
 * @swagger
 * /salon/v1/employee/updateWagesMethod:
 *   patch:
 *     summary: Modify staff compensation terms with effective date tracking and historical record maintenance
 *     tags: [Salon Employees]
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
 *               - wagesMethodId
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: ID of the employee
 *               wagesMethodId:
 *                 type: integer
 *                 description: ID of the new wages method
 *               amount:
 *                 type: number
 *                 description: Fixed amount (for salary or rent)
 *               percentage:
 *                 type: number
 *                 description: Commission percentage (for commission-based)
 *               effectiveDate:
 *                 type: string
 *                 format: date
 *                 description: Date when new wages method becomes effective
 *     responses:
 *       200:
 *         description: Wages method updated successfully
 */

/**
 * @swagger
 * /salon/v1/employee/updateEmployee:
 *   patch:
 *     summary: Modify staff member profile with contact details and professional information
 *     tags: [Salon Employees]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: ID of the employee to update
 *               firstName:
 *                 type: string
 *                 description: Updated first name
 *               lastName:
 *                 type: string
 *                 description: Updated last name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Updated email address
 *               phoneNumber:
 *                 type: string
 *                 description: Updated phone number
 *               countryCode:
 *                 type: string
 *                 description: Updated country code
 *               profile:
 *                 type: string
 *                 format: binary
 *                 description: Updated profile picture
 *               specialization:
 *                 type: string
 *                 description: Updated specialization
 *     responses:
 *       200:
 *         description: Employee updated successfully
 */

/**
 * @swagger
 * /salon/v1/employee/access-levels/create:
 *   post:
 *     summary: Configure staff member access rights with granular module-level permission controls
 *     tags: [Salon Employees]
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
 *               - permissions
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: ID of the employee
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     module:
 *                       type: string
 *                       enum: [bookings, customers, services, reports, settings]
 *                     canRead:
 *                       type: boolean
 *                     canWrite:
 *                       type: boolean
 *                     canUpdate:
 *                       type: boolean
 *                     canDelete:
 *                       type: boolean
 *                 description: Array of permissions for different modules
 *     responses:
 *       200:
 *         description: Access levels created successfully
 */

/**
 * @swagger
 * /salon/v1/employee/access-levels/update:
 *   patch:
 *     summary: Modify staff access permissions with role-based security management
 *     tags: [Salon Employees]
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
 *               - permissions
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: ID of the employee
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     module:
 *                       type: string
 *                     canRead:
 *                       type: boolean
 *                     canWrite:
 *                       type: boolean
 *                     canUpdate:
 *                       type: boolean
 *                     canDelete:
 *                       type: boolean
 *                 description: Updated permissions array
 *     responses:
 *       200:
 *         description: Access levels updated successfully
 */

/**
 * @swagger
 * /salon/v1/employee/access-levels/{employeeId}:
 *   get:
 *     summary: Retrieve detailed staff access configuration with module-specific permission settings
 *     tags: [Salon Employees]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the employee
 *     responses:
 *       200:
 *         description: Employee access levels retrieved successfully
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
 *                       module:
 *                         type: string
 *                       canRead:
 *                         type: boolean
 *                       canWrite:
 *                         type: boolean
 *                       canUpdate:
 *                         type: boolean
 *                       canDelete:
 *                         type: boolean
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/employee/default-access-levels/create:
 *   post:
 *     summary: Establish salon-wide default permission templates for new staff onboarding
 *     tags: [Salon Employees]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - salonDetailId
 *               - defaultPermissions
 *             properties:
 *               salonDetailId:
 *                 type: integer
 *                 description: ID of the salon
 *               defaultPermissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     module:
 *                       type: string
 *                     canRead:
 *                       type: boolean
 *                     canWrite:
 *                       type: boolean
 *                     canUpdate:
 *                       type: boolean
 *                     canDelete:
 *                       type: boolean
 *                 description: Default permissions for new employees
 *     responses:
 *       200:
 *         description: Default access levels created successfully
 */

/**
 * @swagger
 * /salon/v1/employee/default-access-levels/update:
 *   patch:
 *     summary: Modify salon-wide permission templates with standardized access controls
 *     tags: [Salon Employees]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - salonDetailId
 *               - defaultPermissions
 *             properties:
 *               salonDetailId:
 *                 type: integer
 *                 description: ID of the salon
 *               defaultPermissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Updated default permissions
 *     responses:
 *       200:
 *         description: Default access levels updated successfully
 */

/**
 * @swagger
 * /salon/v1/employee/default-access-levels/{salonDetailId}:
 *   get:
 *     summary: Access salon's standard permission templates for staff role management
 *     tags: [Salon Employees]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: salonDetailId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the salon
 *     responses:
 *       200:
 *         description: Default access levels retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/employee/active-deactive-employee/{employee}:
 *   patch:
 *     summary: Manage staff member status with reason tracking and automated service availability updates
 *     tags: [Salon Employees]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: employee
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the employee
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: boolean
 *                 description: New status (true for active, false for inactive)
 *               reason:
 *                 type: string
 *                 description: Reason for status change (optional)
 *     responses:
 *       200:
 *         description: Employee status updated successfully
 */

/**
 * @swagger
 * /salon/v1/employee/delete-employee/{employee}:
 *   patch:
 *     summary: Archive staff record while preserving historical data and service relationships
 *     tags: [Salon Employees]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: employee
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the employee to delete
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for deletion (optional)
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 */

/**
 * @swagger
 * /salon/v1/employee/add-external-employee-default-service/{salon}:
 *   post:
 *     summary: Configure standard service settings for external staff with default pricing and commission rates
 *     tags: [Salon Employees]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: salon
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the salon
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - price
 *             properties:
 *               serviceId:
 *                 type: integer
 *                 description: ID of the service to add as default
 *               price:
 *                 type: number
 *                 description: Default price for external employees
 *               duration:
 *                 type: integer
 *                 description: Default duration for external employees
 *               rentPercentage:
 *                 type: number
 *                 description: Rent percentage for chair rental employees
 *     responses:
 *       200:
 *         description: Default service added for external employee successfully
 */
