const { user, salonDetail, coupon, booking, deviceToken } = require('../../models')
const { Op } = require('sequelize')
const ThrowNotification = require('../../utils/throwNotification')
const AppError = require('../../utils/appError')

/**
 * Send coupon notification to salon customers
 * @param {Object} couponData - The coupon data
 * @param {Number} salonId - Salon ID to find customers
 */
exports.sendCouponNotificationToCustomers = async (couponData, salonId) => {
    try {
        console.log('ðŸš€ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ sendCouponNotificationToCustomers')

        // Find salon details
        const salon = await salonDetail.findByPk(salonId, {
            attributes: ['id', 'salonName']
        })

        if (!salon) {
            console.log('Salon not found')
            throw new AppError('Salon Not Found');
        }

        const salonCustomers = await booking.findAll({
            where: {
                salonDetailId: salonId,
                customerId: { [Op.ne]: null },
            },
            include: [
                {
                    model: user,
                    attributes: [
                        'id',
                        'firstName',
                        'lastName',
                        'email',
                        'countryCode',
                        'phoneNum',
                        'image',
                    ],
                    include: [
                        {
                            model: deviceToken,
                            attributes: ['tokenId']
                        }
                    ]
                },
            ],
            attributes: ['customerId'],
            group: ['customerId'],
        })
        
        //console.log("Salon Customer ============>>>>>>>>>>>>>>>",salonCustomers)

        if (!salonCustomers || salonCustomers.length === 0) {
            console.log('No customers found to send coupon notification')
            throw new AppError('No customers found to send coupon notification')
        }

        // Prepare notification data for each customer
        for (const customer of salonCustomers) {
            if (!customer.user) {
                console.log(`No user found for customer ${customer.customerId}`)
                throw new AppError(`No user found for customer ${customer.customerId}`)
            }

            // Get customer device tokens
            const customerTokens = customer.user.deviceTokens?.map((token) => token.tokenId) || []

            if (customerTokens.length === 0) {
                console.log(`No device tokens found for customer ${customer.user.id}`)
                continue
            }

            // Create notification content
            const notification = {
                title: `New Coupon Available!`,
                body: `${salon.salonName} has a new coupon "${couponData.promoCode}" with ${couponData.value}% off! Valid until ${new Date(couponData.till).toLocaleDateString()}.`
            }

            // Prepare notification data
            const notificationData = {
                couponId: couponData.id.toString(),
                salonName: salon.salonName,
                promoCode: couponData.promoCode,
                value: couponData.value.toString(),
                validUntil: couponData.till,
                salonId: salon.id.toString()
            }

            // Send notification to customer
            ThrowNotification(
                customerTokens,
                notification,
                notificationData,
                customer.user.id
            )

            console.log(`Coupon notification sent to customer ${customer.user.id}`)
        }

        console.log('ðŸš€ ~~~~~ Coupon Notification Sent ~~~~~~~ ðŸš€')
        return true
    } catch (error) {
        console.log('ðŸš€ ~ sendCouponNotificationToCustomers ~ error:', error)
        return false
    }
}

/**
 * Send coupon notification to specific customer
 * @param {Object} couponData - The coupon data
 * @param {Object} customer - Customer object with user data
 * @param {Object} salon - Salon information
 */
exports.sendCouponNotificationToCustomer = async (couponData, customer, salon) => {
    try {
        console.log('🚀 ~ sendCouponNotificationToCustomer')

        if (!customer || !customer.user) {
            console.log('Invalid customer data')
            return false
        }

        // Get customer device tokens
        const customerTokens = customer.user.deviceTokens?.map((token) => token.tokenId) || []

        if (customerTokens.length === 0) {
            console.log(`No device tokens found for customer ${customer.user.id}`)
            return false
        }

        // Create notification content
        const notification = {
            title: `🎉 New Coupon Available!`,
            body: `${salon.salonName} has a new coupon "${couponData.promoCode}" with ${couponData.value}% off! Valid until ${new Date(couponData.till).toLocaleDateString()}.`
        }

        // Prepare notification data
        const notificationData = {
            couponId: couponData.id.toString(),
            salonName: salon.salonName,
            promoCode: couponData.promoCode,
            value: couponData.value.toString(),
            validUntil: couponData.till,
            salonId: salon.id.toString()
        }

        // Send notification to customer
        await ThrowNotification(
            customerTokens,
            notification,
            notificationData,
            customer.user.id
        )

        console.log(`Coupon notification sent to customer ${customer.user.id}`)
        console.log('🚀 ~~~~~ Coupon Notification Sent ~~~~~~~ 🚀')
        return true
    } catch (error) {
        console.log('🚀 ~ sendCouponNotificationToCustomer ~ error:', error)
        return false
    }
}
