/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Stripe webhook endpoints for payment processing and subscription management
 */

/**
 * @swagger
 * /webhooks/stripe:
 *   post:
 *     summary: Handle Stripe webhook events
 *     tags: [Webhooks]
 *     description: |
 *       This endpoint receives and processes webhook events from Stripe.
 *       It handles various payment-related events including:
 *       - Payment intent status updates
 *       - Subscription lifecycle events
 *       - Invoice payment events
 *       - Customer updates
 *       - Payment method changes
 *       
 *       **Important:** This endpoint requires a valid Stripe webhook signature
 *       in the `stripe-signature` header for security verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe webhook event payload
 *             properties:
 *               id:
 *                 type: string
 *                 description: Unique identifier for the event
 *               object:
 *                 type: string
 *                 enum: [event]
 *                 description: String representing the object's type
 *               api_version:
 *                 type: string
 *                 description: API version used to render data
 *               created:
 *                 type: integer
 *                 description: Time at which the object was created (Unix timestamp)
 *               data:
 *                 type: object
 *                 description: Event data object
 *                 properties:
 *                   object:
 *                     type: object
 *                     description: The actual object affected by the event
 *               livemode:
 *                 type: boolean
 *                 description: Whether the event occurred in live mode
 *               pending_webhooks:
 *                 type: integer
 *                 description: Number of webhooks that haven't been delivered
 *               request:
 *                 type: object
 *                 description: Information about the request that triggered the event
 *               type:
 *                 type: string
 *                 description: Event type
 *                 enum:
 *                   - payment_intent.succeeded
 *                   - payment_intent.payment_failed
 *                   - payment_intent.canceled
 *                   - invoice.payment_succeeded
 *                   - invoice.payment_failed
 *                   - customer.subscription.created
 *                   - customer.subscription.updated
 *                   - customer.subscription.deleted
 *                   - customer.subscription.trial_will_end
 *                   - setup_intent.succeeded
 *                   - payment_method.attached
 *                   - customer.created
 *                   - customer.updated
 *                   - customer.deleted
 *     parameters:
 *       - in: header
 *         name: stripe-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe webhook signature for event verification
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *                 eventType:
 *                   type: string
 *                   description: The type of event that was processed
 *                 message:
 *                   type: string
 *                   description: Success message
 *       400:
 *         description: Invalid webhook signature or malformed request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid signature"
 *       404:
 *         description: Webhook event type not handled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unhandled event type"
 *       500:
 *         description: Internal server error while processing webhook
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

/**
 * @swagger
 * /webhooks/stripe/connect:
 *   post:
 *     summary: Handle Stripe Connect webhook events
 *     tags: [Webhooks]
 *     description: |
 *       This endpoint receives and processes webhook events from Stripe Connect.
 *       It handles events related to connected accounts (salon accounts) including:
 *       - Account status updates
 *       - Capability updates
 *       - Transfer events
 *       - Payout events
 *       - Account verification events
 *       
 *       **Important:** This endpoint requires a valid Stripe Connect webhook signature
 *       in the `stripe-signature` header for security verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe Connect webhook event payload
 *             properties:
 *               id:
 *                 type: string
 *                 description: Unique identifier for the event
 *               object:
 *                 type: string
 *                 enum: [event]
 *               account:
 *                 type: string
 *                 description: Connected account ID that the event relates to
 *               api_version:
 *                 type: string
 *               created:
 *                 type: integer
 *               data:
 *                 type: object
 *                 properties:
 *                   object:
 *                     type: object
 *                     description: The connected account object or related object
 *               livemode:
 *                 type: boolean
 *               pending_webhooks:
 *                 type: integer
 *               request:
 *                 type: object
 *               type:
 *                 type: string
 *                 description: Connect event type
 *                 enum:
 *                   - account.updated
 *                   - account.application.deauthorized
 *                   - capability.updated
 *                   - person.created
 *                   - person.updated
 *                   - transfer.created
 *                   - transfer.updated
 *                   - transfer.paid
 *                   - transfer.failed
 *                   - payout.created
 *                   - payout.updated
 *                   - payout.paid
 *                   - payout.failed
 *     parameters:
 *       - in: header
 *         name: stripe-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe Connect webhook signature for event verification
 *     responses:
 *       200:
 *         description: Connect webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *                 eventType:
 *                   type: string
 *                 accountId:
 *                   type: string
 *                   description: Connected account ID
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid Connect webhook signature or malformed request
 *       404:
 *         description: Connect webhook event type not handled
 *       500:
 *         description: Internal server error while processing Connect webhook
 */

/**
 * @swagger
 * /webhooks/stripe/test:
 *   post:
 *     summary: Test webhook endpoint (development only)
 *     tags: [Webhooks]
 *     description: |
 *       **Development/Testing endpoint only** - Used for testing webhook functionality
 *       without requiring actual Stripe webhook signatures. This endpoint should be
 *       disabled or secured in production environments.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: Event type to simulate
 *                 example: "payment_intent.succeeded"
 *               data:
 *                 type: object
 *                 description: Mock event data
 *               account:
 *                 type: string
 *                 description: Mock account ID (for Connect events)
 *     responses:
 *       200:
 *         description: Test webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Test webhook processed"
 *                 eventType:
 *                   type: string
 *       400:
 *         description: Invalid test webhook request
 *       500:
 *         description: Error processing test webhook
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     StripeEvent:
 *       type: object
 *       description: Standard Stripe webhook event structure
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the event
 *         object:
 *           type: string
 *           enum: [event]
 *         api_version:
 *           type: string
 *           description: API version used to render data
 *         created:
 *           type: integer
 *           description: Time at which the object was created
 *         data:
 *           type: object
 *           properties:
 *             object:
 *               type: object
 *               description: The object affected by the event
 *             previous_attributes:
 *               type: object
 *               description: Previous attributes of the object (for updated events)
 *         livemode:
 *           type: boolean
 *           description: Whether the event occurred in live mode
 *         pending_webhooks:
 *           type: integer
 *           description: Number of webhooks that haven't been delivered
 *         request:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: ID of the API request that caused the event
 *             idempotency_key:
 *               type: string
 *               description: Idempotency key of the request
 *         type:
 *           type: string
 *           description: Description of the event
 *       required:
 *         - id
 *         - object
 *         - created
 *         - data
 *         - livemode
 *         - type
 *     
 *     PaymentIntentEvent:
 *       allOf:
 *         - $ref: '#/components/schemas/StripeEvent'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum:
 *                 - payment_intent.succeeded
 *                 - payment_intent.payment_failed
 *                 - payment_intent.canceled
 *             data:
 *               type: object
 *               properties:
 *                 object:
 *                   type: object
 *                   description: Payment Intent object
 *                   properties:
 *                     id:
 *                       type: string
 *                     amount:
 *                       type: integer
 *                     currency:
 *                       type: string
 *                     status:
 *                       type: string
 *                     customer:
 *                       type: string
 *                     metadata:
 *                       type: object
 *     
 *     SubscriptionEvent:
 *       allOf:
 *         - $ref: '#/components/schemas/StripeEvent'
 *         - type: object
 *           properties:
 *             type:
 *               type: string
 *               enum:
 *                 - customer.subscription.created
 *                 - customer.subscription.updated
 *                 - customer.subscription.deleted
 *                 - customer.subscription.trial_will_end
 *             data:
 *               type: object
 *               properties:
 *                 object:
 *                   type: object
 *                   description: Subscription object
 *                   properties:
 *                     id:
 *                       type: string
 *                     customer:
 *                       type: string
 *                     status:
 *                       type: string
 *                     current_period_start:
 *                       type: integer
 *                     current_period_end:
 *                       type: integer
 *                     metadata:
 *                       type: object
 *     
 *     ConnectEvent:
 *       allOf:
 *         - $ref: '#/components/schemas/StripeEvent'
 *         - type: object
 *           properties:
 *             account:
 *               type: string
 *               description: The connected account ID
 *             type:
 *               type: string
 *               enum:
 *                 - account.updated
 *                 - transfer.created
 *                 - transfer.paid
 *                 - payout.paid
 *             data:
 *               type: object
 *               properties:
 *                 object:
 *                   type: object
 *                   description: Account, Transfer, or Payout object
 */