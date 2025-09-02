/**
 * @swagger
 * tags:
 *   name: Salon Main
 *   description: Main salon management and configuration endpoints
 */

/**
 * @swagger
 * /salon/v1/salon-feedback/{salon}:
 *   get:
 *     summary: Access customer reviews and ratings with service-specific feedback analysis
 *     tags: [Salon Main]
 *     parameters:
 *       - in: path
 *         name: salon
 *         required: true
 *         schema:
 *           type: integer
 *         description: Salon ID to get feedback for
 *     responses:
 *       200:
 *         description: Client feedback retrieved successfully
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
 *                       rating:
 *                         type: number
 *                       review:
 *                         type: string
 *                       customerName:
 *                         type: string
 *                       serviceName:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/registration:
 *   post:
 *     summary: Create comprehensive salon profile with location, contact details, and business information
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - phoneNumber
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *                 description: Salon name
 *               description:
 *                 type: string
 *                 description: Salon description
 *               address:
 *                 type: string
 *                 description: Salon address
 *               phoneNumber:
 *                 type: string
 *                 description: Salon phone number
 *               latitude:
 *                 type: number
 *                 description: Salon latitude coordinate
 *               longitude:
 *                 type: number
 *                 description: Salon longitude coordinate
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Salon email address
 *               website:
 *                 type: string
 *                 description: Salon website URL
 *     responses:
 *       200:
 *         description: Salon registered successfully
 */

/**
 * @swagger
 * /salon/v1/subscriptionPlans:
 *   get:
 *     summary: Retrieve subscription plan catalog with detailed feature comparisons and pricing
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: List of subscription plans
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
 *                       features:
 *                         type: array
 *                         items:
 *                           type: string
 *                       stripePriceId:
 *                         type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/AddCard:
 *   post:
 *     summary: Register secure payment method with automated validation and tokenization
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *                 description: Stripe payment method ID
 *               setAsDefault:
 *                 type: boolean
 *                 description: Set this card as default payment method
 *     responses:
 *       200:
 *         description: Card added successfully
 */

/**
 * @swagger
 * /salon/v1/choosePlan:
 *   post:
 *     summary: Initiate subscription with selected plan and integrated payment processing
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - paymentMethodId
 *             properties:
 *               planId:
 *                 type: integer
 *                 description: Subscription plan ID
 *               paymentMethodId:
 *                 type: string
 *                 description: Stripe payment method ID
 *               promoCode:
 *                 type: string
 *                 description: Promotional code (optional)
 *     responses:
 *       200:
 *         description: Plan subscribed successfully
 */

/**
 * @swagger
 * /salon/v1/salonTiming:
 *   post:
 *     summary: Set salon working hours
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - timings
 *             properties:
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
 *         description: Salon timing set successfully
 */

/**
 * @swagger
 * /salon/v1/getSalonTiming:
 *   get:
 *     summary: Get salon working hours
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Salon timing retrieved successfully
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
 *                       startTime:
 *                         type: string
 *                       endTime:
 *                         type: string
 *                       isOff:
 *                         type: boolean
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/addCategory:
 *   post:
 *     summary: Create customizable service category with visual styling and organization options
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               description:
 *                 type: string
 *                 description: Category description
 *               color:
 *                 type: string
 *                 description: Category color code
 *     responses:
 *       200:
 *         description: Category added successfully
 */

/**
 * @swagger
 * /salon/v1/add-multiple-categories:
 *   post:
 *     summary: Batch create service categories with consistent styling and organization
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categories
 *             properties:
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     color:
 *                       type: string
 *                 description: Array of categories to add
 *     responses:
 *       200:
 *         description: Multiple categories added successfully
 */

/**
 * @swagger
 * /salon/v1/getServiceTypes:
 *   post:
 *     summary: Get service types
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 description: Filter by category ID
 *     responses:
 *       200:
 *         description: Service types retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/addService:
 *   post:
 *     summary: Create new service offering with pricing, duration, and category assignment
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - duration
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Service name
 *               description:
 *                 type: string
 *                 description: Service description
 *               price:
 *                 type: number
 *                 description: Service price
 *               duration:
 *                 type: integer
 *                 description: Service duration in minutes
 *               categoryId:
 *                 type: integer
 *                 description: Category ID this service belongs to
 *               serviceTypeId:
 *                 type: integer
 *                 description: Service type ID
 *     responses:
 *       200:
 *         description: Service added successfully
 */

/**
 * @swagger
 * /salon/v1/addServiceImages:
 *   post:
 *     summary: Upload and manage service portfolio with multi-image support and optimization
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - serviceImges
 *             properties:
 *               serviceId:
 *                 type: integer
 *                 description: Service ID to add images for
 *               serviceImges:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array of service images (max 10)
 *     responses:
 *       200:
 *         description: Service images uploaded successfully
 */

/**
 * @swagger
 * /salon/v1/addSocialLinks:
 *   post:
 *     summary: Configure salon social media presence with integrated platform connections
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               facebook:
 *                 type: string
 *                 description: Facebook page URL
 *               instagram:
 *                 type: string
 *                 description: Instagram profile URL
 *               twitter:
 *                 type: string
 *                 description: Twitter profile URL
 *               linkedin:
 *                 type: string
 *                 description: LinkedIn profile URL
 *               website:
 *                 type: string
 *                 description: Website URL
 *     responses:
 *       200:
 *         description: Social links added successfully
 */

/**
 * @swagger
 * /salon/v1/updateSocialLinks:
 *   patch:
 *     summary: Modify salon social media integrations with platform-specific updates
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               facebook:
 *                 type: string
 *               instagram:
 *                 type: string
 *               twitter:
 *                 type: string
 *               linkedin:
 *                 type: string
 *               website:
 *                 type: string
 *     responses:
 *       200:
 *         description: Social links updated successfully
 */

/**
 * @swagger
 * /salon/v1/getAllServices:
 *   post:
 *     summary: Get all salon services
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 description: Filter by category ID
 *               status:
 *                 type: boolean
 *                 description: Filter by service status
 *     responses:
 *       200:
 *         description: All services retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/salonProfile:
 *   get:
 *     summary: Retrieve detailed salon profile including services, gallery, and business settings
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Salon profile retrieved successfully
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
 *                     services:
 *                       type: array
 *                       items:
 *                         type: object
 *                     socialLinks:
 *                       type: object
 *                     galleryImages:
 *                       type: array
 *                       items:
 *                         type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /salon/v1/addGalleryImages:
 *   post:
 *     summary: Add gallery images for salon
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - salonDetailId
 *             properties:
 *               salonDetailId:
 *                 type: integer
 *                 description: Salon detail ID
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Cover image for salon
 *               portfolioImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Portfolio images for salon
 *     responses:
 *       200:
 *         description: Gallery images uploaded successfully
 */

/**
 * @swagger
 * /salon/v1/deleteGalleryImages:
 *   post:
 *     summary: Delete gallery images
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageIds
 *             properties:
 *               imageIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of image IDs to delete
 *     responses:
 *       200:
 *         description: Gallery images deleted successfully
 */

/**
 * @swagger
 * /salon/v1/getGalleryImages:
 *   get:
 *     summary: Get salon gallery images
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Gallery images retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/updateGalleryImages:
 *   post:
 *     summary: Update gallery images
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               galleryImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Updated gallery images (max 5)
 *     responses:
 *       200:
 *         description: Gallery images updated successfully
 */

/**
 * @swagger
 * /salon/v1/updateSalonTimings:
 *   patch:
 *     summary: Update salon working hours
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - timings
 *             properties:
 *               timings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                     endTime:
 *                       type: string
 *                     isOff:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Salon timings updated successfully
 */

/**
 * @swagger
 * /salon/v1/updateSalonAddress:
 *   patch:
 *     summary: Update salon location with geocoding and address verification
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 description: New salon address
 *               latitude:
 *                 type: number
 *                 description: New latitude coordinate
 *               longitude:
 *                 type: number
 *                 description: New longitude coordinate
 *     responses:
 *       200:
 *         description: Salon address updated successfully
 */

/**
 * @swagger
 * /salon/v1/updateService:
 *   patch:
 *     summary: Modify service details with real-time pricing and scheduling updates
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *             properties:
 *               serviceId:
 *                 type: integer
 *                 description: Service ID to update
 *               name:
 *                 type: string
 *                 description: Updated service name
 *               description:
 *                 type: string
 *                 description: Updated service description
 *               price:
 *                 type: number
 *                 description: Updated service price
 *               duration:
 *                 type: integer
 *                 description: Updated service duration
 *     responses:
 *       200:
 *         description: Service updated successfully
 */

/**
 * @swagger
 * /salon/v1/updateSalonDetail:
 *   patch:
 *     summary: Modify salon profile information with real-time business detail updates
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated salon name
 *               description:
 *                 type: string
 *                 description: Updated salon description
 *               phoneNumber:
 *                 type: string
 *                 description: Updated phone number
 *               email:
 *                 type: string
 *                 description: Updated email address
 *     responses:
 *       200:
 *         description: Salon details updated successfully
 */

/**
 * @swagger
 * /salon/v1/updateCategory:
 *   patch:
 *     summary: Update service category
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 description: Category ID to update
 *               name:
 *                 type: string
 *                 description: Updated category name
 *               description:
 *                 type: string
 *                 description: Updated category description
 *               color:
 *                 type: string
 *                 description: Updated category color
 *     responses:
 *       200:
 *         description: Category updated successfully
 */

/**
 * @swagger
 * /salon/v1/getCategories:
 *   get:
 *     summary: Get all service categories
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/default-categories:
 *   get:
 *     summary: Get default service categories
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Default categories retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/add-coupon:
 *   post:
 *     summary: Add discount coupon
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountType
 *               - discountValue
 *             properties:
 *               code:
 *                 type: string
 *                 description: Coupon code
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 description: Type of discount
 *               discountValue:
 *                 type: number
 *                 description: Discount value
 *               expiryDate:
 *                 type: string
 *                 format: date
 *                 description: Coupon expiry date
 *               usageLimit:
 *                 type: integer
 *                 description: Maximum usage limit
 *     responses:
 *       200:
 *         description: Coupon added successfully
 */

/**
 * @swagger
 * /salon/v1/coupons:
 *   get:
 *     summary: Get all salon coupons
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/customerSubscription:
 *   get:
 *     summary: Get customer subscription details
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Customer subscription details retrieved
 */

/**
 * @swagger
 * /salon/v1/cancelSubscription:
 *   post:
 *     summary: Process subscription cancellation with proration and service continuity management
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionId
 *             properties:
 *               subscriptionId:
 *                 type: string
 *                 description: Stripe subscription ID
 *               reason:
 *                 type: string
 *                 description: Cancellation reason
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 */

/**
 * @swagger
 * /salon/v1/addAnotherCard:
 *   post:
 *     summary: Add another payment card
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *                 description: Stripe payment method ID
 *     responses:
 *       200:
 *         description: Card added successfully
 */

/**
 * @swagger
 * /salon/v1/updateSubscription:
 *   post:
 *     summary: Modify subscription with automated billing adjustments and feature updates
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPlanId
 *             properties:
 *               newPlanId:
 *                 type: integer
 *                 description: New subscription plan ID
 *               promoCode:
 *                 type: string
 *                 description: Promotional code
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 */

/**
 * @swagger
 * /salon/v1/billingDetail:
 *   get:
 *     summary: Access comprehensive billing history with transaction details and payment status
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Billing details retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/getCancellationPolicies:
 *   get:
 *     summary: Access booking cancellation rules with time-based penalties and refund policies
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Cancellation policies retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/cancellation-policies-on-versions/{version}:
 *   get:
 *     summary: Access booking cancellation rules with time-based penalties and refund policies by version
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: string
 *         description: Policy version
 *     responses:
 *       200:
 *         description: Cancellation policies by version retrieved
 */

/**
 * @swagger
 * /salon/v1/updateCancellationPolicies:
 *   post:
 *     summary: Modify cancellation rules with automated penalty calculation and notification settings
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - policies
 *             properties:
 *               policies:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     timeFrame:
 *                       type: string
 *                     penalty:
 *                       type: number
 *                     description:
 *                       type: string
 *     responses:
 *       200:
 *         description: Cancellation policies updated successfully
 */

/**
 * @swagger
 * /salon/v1/getDepositPolicies:
 *   get:
 *     summary: Retrieve booking deposit requirements with service-specific configurations
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Deposit policies retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/deposit-Policy-history:
 *   get:
 *     summary: Get deposit policy history
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Deposit policy history retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/updateDepositPolicies:
 *   post:
 *     summary: Configure deposit rules with automated payment processing and refund handling
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - policies
 *             properties:
 *               policies:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Deposit policies updated successfully
 */

/**
 * @swagger
 * /salon/v1/getNoShowPolicies:
 *   get:
 *     summary: Access no-show handling rules with penalty structures and customer notifications
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: No-show policies retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/noshow-policies-history:
 *   get:
 *     summary: Access no-show handling rules with penalty structures and customer notifications history
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: No-show policies history retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/updateNoShowPolicies:
 *   post:
 *     summary: Configure no-show management with automated fee processing and customer communication
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - policies
 *             properties:
 *               policies:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: No-show policies updated successfully
 */

/**
 * @swagger
 * /salon/v1/getreschedulePolicy:
 *   get:
 *     summary: Access appointment rescheduling rules with time-based restrictions and fees
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Reschedule policies retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/reschedule-policy-history:
 *   get:
 *     summary: Get reschedule policy history
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Reschedule policy history retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/updatereschedulePolicy:
 *   post:
 *     summary: Modify rescheduling policies with automated fee calculation and availability checks
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - policies
 *             properties:
 *               policies:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Reschedule policies updated successfully
 */

/**
 * @swagger
 * /salon/v1/getSalonHistory:
 *   post:
 *     summary: Get salon history
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Salon history retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/saleDetails:
 *   post:
 *     summary: Get sale details
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - saleId
 *             properties:
 *               saleId:
 *                 type: integer
 *                 description: Sale/booking ID
 *     responses:
 *       200:
 *         description: Sale details retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/createOnboardingLink:
 *   post:
 *     summary: Create Stripe Connect onboarding link
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Onboarding link created successfully
 */

/**
 * @swagger
 * /salon/v1/accountAdded:
 *   post:
 *     summary: Confirm Stripe account added
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Account confirmation successful
 */

/**
 * @swagger
 * /salon/v1/salonWallet:
 *   get:
 *     summary: Get salon wallet information
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Salon wallet information retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/for-subcription-payment:
 *   post:
 *     summary: Process subscription payment
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - paymentMethodId
 *             properties:
 *               planId:
 *                 type: integer
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription payment processed successfully
 */

/**
 * @swagger
 * /salon/v1/save-working-hour:
 *   post:
 *     summary: Save working hours history
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workingHours
 *             properties:
 *               workingHours:
 *                 type: object
 *     responses:
 *       200:
 *         description: Working hours saved successfully
 */

/**
 * @swagger
 * /salon/v1/online-offline:
 *   post:
 *     summary: Toggle salon online/offline status
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
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
 *                 description: Online status (true for online, false for offline)
 *     responses:
 *       200:
 *         description: Salon status updated successfully
 */

/**
 * @swagger
 * /salon/v1/online-offline-status:
 *   get:
 *     summary: Get salon online/offline status
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Salon status retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/active-block-customer:
 *   post:
 *     summary: Manage customer access with reason tracking and automated service restrictions
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - action
 *             properties:
 *               customerId:
 *                 type: integer
 *                 description: Customer ID to block/unblock
 *               action:
 *                 type: string
 *                 enum: [block, unblock]
 *                 description: Action to perform
 *               reason:
 *                 type: string
 *                 description: Reason for blocking (optional)
 *     responses:
 *       200:
 *         description: Customer status updated successfully
 */

/**
 * @swagger
 * /salon/v1/announcement:
 *   post:
 *     summary: Publish targeted announcements with scheduling and audience segmentation
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *                 description: Announcement title
 *               message:
 *                 type: string
 *                 description: Announcement message
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Announcement start date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Announcement end date
 *               targetAudience:
 *                 type: string
 *                 enum: [all, customers, employees]
 *                 description: Target audience for announcement
 *     responses:
 *       200:
 *         description: Announcement created successfully
 */

/**
 * @swagger
 * /salon/v1/announcement/{id}:
 *   patch:
 *     summary: Modify announcement content with delivery status tracking and audience updates
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Announcement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Announcement updated successfully
 */

/**
 * @swagger
 * /salon/v1/cancel-announcement/{id}:
 *   patch:
 *     summary: Revoke active announcements with audience notification management
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Announcement ID to cancel
 *     responses:
 *       200:
 *         description: Announcement cancelled successfully
 */

/**
 * @swagger
 * /salon/v1/announcements:
 *   get:
 *     summary: Access announcement history with delivery metrics and engagement analytics
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Announcements retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/notifications:
 *   get:
 *     summary: Retrieve system notifications with priority levels and action tracking
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/subscription-price:
 *   get:
 *     summary: Get subscription pricing information
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Subscription pricing retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/update-cover-image:
 *   patch:
 *     summary: Update salon cover image
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - coverImageUrl
 *             properties:
 *               coverImageUrl:
 *                 type: string
 *                 description: New cover image URL
 *     responses:
 *       200:
 *         description: Cover image updated successfully
 */

/**
 * @swagger
 * /salon/v1/feedback-reply:
 *   post:
 *     summary: Respond to customer reviews with personalized engagement and service improvement tracking
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedbackId
 *               - reply
 *             properties:
 *               feedbackId:
 *                 type: integer
 *                 description: Feedback ID to reply to
 *               reply:
 *                 type: string
 *                 description: Reply message
 *     responses:
 *       200:
 *         description: Reply sent successfully
 */

/**
 * @swagger
 * /salon/v1/send-custom-notifications/{audienceType}:
 *   post:
 *     summary: Broadcast targeted promotional messages with audience segmentation and response tracking
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: audienceType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [all, customers, employees, specific]
 *         description: Target audience for notification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *                 description: Notification title
 *               message:
 *                 type: string
 *                 description: Notification message
 *               specificUserIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Specific user IDs (if audienceType is 'specific')
 *     responses:
 *       200:
 *         description: Custom notification sent successfully
 */

/**
 * @swagger
 * /salon/v1/new-allergy:
 *   post:
 *     summary: Record customer allergies with severity levels and service compatibility checks
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - allergyName
 *             properties:
 *               customerId:
 *                 type: integer
 *                 description: Customer ID
 *               allergyName:
 *                 type: string
 *                 description: Name of the allergy
 *               description:
 *                 type: string
 *                 description: Allergy description
 *               severity:
 *                 type: string
 *                 enum: [mild, moderate, severe]
 *                 description: Allergy severity level
 *     responses:
 *       200:
 *         description: Allergy added successfully
 */

/**
 * @swagger
 * /salon/v1/allergies-list-of-customer/{id}:
 *   get:
 *     summary: Access customer allergy records with service safety recommendations
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer allergies retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/remove-allergy/{id}:
 *   patch:
 *     summary: Update allergy records with change history and service restriction adjustments
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Allergy ID to remove
 *     responses:
 *       200:
 *         description: Allergy removed successfully
 */

/**
 * @swagger
 * /salon/v1/add-update-client-note/{id}:
 *   patch:
 *     summary: Manage customer notes with privacy controls and staff visibility settings
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *                 description: Client note content
 *               isPrivate:
 *                 type: boolean
 *                 description: Whether note is private to salon staff
 *     responses:
 *       200:
 *         description: Client note updated successfully
 */

/**
 * @swagger
 * /salon/v1/online-payments:
 *   patch:
 *     summary: Toggle online payments setting
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: Enable or disable online payments
 *     responses:
 *       200:
 *         description: Online payments setting updated successfully
 */

/**
 * @swagger
 * /salon/v1/change-payment-method-for-subscription:
 *   get:
 *     summary: Get payment methods for subscription change
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 */

/**
 * @swagger
 * /salon/v1/attach-payment-method-for-subscription:
 *   patch:
 *     summary: Attach payment method to subscription
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *                 description: Stripe payment method ID
 *     responses:
 *       200:
 *         description: Payment method attached successfully
 */

/**
 * @swagger
 * /salon/v1/account-delete:
 *   post:
 *     summary: Delete salon account
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for account deletion
 *               feedback:
 *                 type: string
 *                 description: Additional feedback
 *     responses:
 *       200:
 *         description: Account deletion initiated successfully
 */

/**
 * @swagger
 * /salon/v1/change-category-status/{id}:
 *   patch:
 *     summary: Toggle service category visibility with associated service management
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
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
 *                 description: New category status
 *     responses:
 *       200:
 *         description: Category status changed successfully
 */

/**
 * @swagger
 * /salon/v1/update-subscriptions-price-id:
 *   post:
 *     summary: Update subscription price ID
 *     tags: [Salon Main]
 *     security:
 *       - AccessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionId
 *               - newPriceId
 *             properties:
 *               subscriptionId:
 *                 type: string
 *                 description: Stripe subscription ID
 *               newPriceId:
 *                 type: string
 *                 description: New Stripe price ID
 *     responses:
 *       200:
 *         description: Subscription price ID updated successfully
 */
