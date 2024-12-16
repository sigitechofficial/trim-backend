const {
  employee,
  salonDetail,
  user,
  booking,
  jobs,
  service,
  employeeWagesMethod,
  deviceToken,
  addressDBS,
  category,
} = require('../models')
const { literal } = require('sequelize')
const { emailDateFormate } = require('./emailDateFormate')

exports.bookingDataForEmailAndNotifications = async (bookingId) => {
  const data = await booking.findByPk(bookingId, {
    attributes: [
      'id',
      'status',
      'on',
      'startTime',
      'endTime',
      'duration',
      'discount',
      'total',
      'subTotal',
      'initialPayment',
      'initialPaymentIntend',
      'actualCapturedAmount',
      'tip',
      'salonDetailId',
      'paymentMethod',
      'stripeCardId',
      'customerId',
      'noshowPolicyVersion',
      'cancellationPolicyVersion',
      'by',
      [
        literal(`
          (
            SELECT refundPercentage
            FROM noShowPolicies
            WHERE 
              booking.noshowPolicyVersion = noShowPolicies.version 
            LIMIT 1
          )
        `),
        'noShowPercentage',
      ],
    ],
    include: [
      {
        model: salonDetail,
        attributes: ['id', 'salonName', 'connectAccountId', 'coverImage'],
        include: [
          {
            model: addressDBS,
            attributes: [
              'streetAddress',
              'city',
              'district',
              'province',
              'country',
            ],
          },
          {
            model: user,
            attributes: [
              'id',
              'firstName',
              'image',
              'lastName',
              'email',
              'countryCode',
              'phoneNum',
            ],
            include: { model: deviceToken, attributes: ['tokenId'] },
          },
        ],
      },
      {
        model: user,
        attributes: [
          'id',
          'firstName',
          'lastName',
          'email',
          'countryCode',
          'phoneNum',
          'stripeCustomerId',
          'image',
        ],
        include: { model: deviceToken, attributes: ['tokenId'] },
      },
      {
        model: jobs,
        attributes: [
          'id',
          'status',
          'total',
          'duration',
          'startTime',
          'endTime',
          'employeeId',
          'bookingId',
          'tip',
          'Extra',
          'on',
        ],
        include: [
          {
            model: service,
            attributes: ['serviceName'],
            include: { model: category, attributes: ['color'] },
          },
          {
            model: employee,
            attributes: ['id', 'position'],
            include: [
              {
                model: user,
                attributes: ['id', 'firstName', 'lastName'],
                include: { model: deviceToken, attributes: ['tokenId'] },
              },
              {
                model: employeeWagesMethod,
                attributes: ['value', 'wagesMethodId'],
              },
            ],
          },
        ],
      },
    ],
  })

  if (!data) return null

  const salonTokens = data?.salonDetail?.user?.deviceTokens?.map((ele) => {
    return ele?.tokenId
  })
  const salonEmail = data?.salonDetail?.user?.email

  const customerTokens = data?.user?.deviceTokens?.map((ele) => {
    return ele?.tokenId
  })
  const customerEmail = data?.user?.email

  let employeeData = []

  if (data?.jobs?.length > 0) {
    employeeData = data?.jobs?.map((ele) => {
      return {
        tokens:
          ele.employee?.user?.deviceTokens?.map((token) => token?.tokenId) ||
          [],
        email: ele.employee?.user?.email,
        userId: ele.employee?.user?.id,
        service: ele.service.serviceName,
        bookingId: ele.bookingId,
        jobId: ele.id,
        dateTime: emailDateFormate(ele.on, ele.startTime),
        wagesMethod: ele.employee?.employeeWagesMethod,
      }
    })
  }

  const salon = {
    salonEmail,
    salonTokens,
    userId: data?.salonDetail?.user?.id,
    salonName: data?.salonDetail?.salonName,
    image: data?.salonDetail?.coverImage,
  }

  const client = {
    customerTokens,
    customerEmail,
    fullName: `${data?.user?.firstName} ${data.user?.lastName}`,
    image: data?.user?.image,
    userId: data?.user?.id,
  }

  const appointmentDate = emailDateFormate(data.on, data.startTime)
  const output = JSON.parse(JSON.stringify(data))
  return { appointment: output, appointmentDate, salon, client, employeeData }
}
