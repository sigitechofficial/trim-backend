const {
  employee,
  salonDetail,
  user,
  booking,
  jobs,
  service,
  deviceToken,
  addressDBS,
} = require('../../models')
const { emailDateFormate } = require('../../utils/emailDateFormate')
const ThrowNotification = require('../../utils/throwNotification')

exports.feedBack = async (appointmentId, comment, employeesRating) => {
  try {
    const result = await booking.findOne({
      where: { id: appointmentId },
      attributes: ['id', 'status', 'on', 'startTime'],
      include: [
        {
          model: salonDetail,
          attributes: ['id', 'salonName', 'coverImage'],
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
            'image',
          ],
          include: { model: deviceToken, attributes: ['tokenId'] },
        },
        {
          model: jobs,
          attributes: ['id', 'on', 'startTime', 'duration', 'employeeId'],
          include: [
            { model: service, attributes: ['serviceName'] },
            {
              model: employee,
              attributes: ['position', 'isOwner', 'userId'],
              include: [
                {
                  model: user,
                  attributes: ['id', 'firstName', 'lastName'],
                  include: { model: deviceToken, attributes: ['tokenId'] },
                },
              ],
            },
          ],
        },
      ],
    })

    if (!result) return 0
    const inputData = JSON.parse(JSON.stringify(result))
    //EMAIL --//TODO
    // EmailAppointmentConfirmToSalon(['sigidevelopers@gmail.com'],inputData);

    //Notification
    const dateTime = emailDateFormate(inputData.on, inputData.startTime)
    const salonTokens = inputData?.salonDetail?.user?.deviceTokens?.map(
      (ele) => {
        return ele?.tokenId
      },
    )

    const fullName =
      `${inputData?.user?.firstName} ${inputData?.user?.lastName}` || ''

    const salonNotification = {
      title: `New Review Alert`,
      body: `${fullName} has left a new review: ${comment}.`,
    }
    const employeesId = []
    if (inputData?.jobs?.length > 0) {
      const uniqueJobs = Object.values(
        inputData?.jobs.reduce((acc, job) => {
          if (!acc[job.employeeId]) {
            acc[job.employeeId] = job
          }
          return acc
        }, {}),
      )
      uniqueJobs.forEach((ele) => {
        if (!ele?.employee?.isOwner) {
          const employeesTokens = ele.employee?.user?.deviceTokens?.map(
            (ele) => {
              return ele?.tokenId
            },
          )
          employeesId.push(ele?.employee?.user?.id)
          const employeeNotification = {
            title: `New Review Notification`,
            body: `${fullName} has left a new review: ${comment}.`,
          }
          const employee = employeesRating.find(
            (emp) => emp.employeeId == ele?.employee?.userId,
          )
          const rating = employee?.value || 0.0
          ThrowNotification(
            employeesTokens,
            employeeNotification,
            {
              appointment: inputData.id,
              fullName: `${inputData?.user?.firstName} ${inputData.user?.lastName}`,
              image: inputData?.user?.image || '',
              rating: rating,
              comment: '',
            },
            ele?.employee?.user?.id,
          )
        }
      })
    }

    const averageRating = parseFloat(
      (
        employeesRating.reduce((sum, employee) => sum + employee.value, 0) /
        employeesRating.length
      ).toFixed(1),
    )
    ThrowNotification(
      salonTokens,
      salonNotification,
      {
        appointment: inputData.id,
        fullName: `${inputData?.user?.firstName} ${inputData.user?.lastName}`,
        image: inputData?.user?.image || '',
        rating: averageRating && averageRating > 0 ? averageRating : 0.0,
        comment: comment,
      },
      inputData?.salonDetail?.user?.id,
    )

    console.log('🚀 ~~~~~ eventDrivenCommunication ~~~~~~~ 🚀')
    return true
  } catch (error) {
    console.log('🚀 ~ exports.onlineAppointmentConfirm= ~ error:', error)
  }
}
