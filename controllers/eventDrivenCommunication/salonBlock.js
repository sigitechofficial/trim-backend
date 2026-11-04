const { employee, salonDetail, user, deviceToken } = require('../../models')

const { sendEvent } = require('../../socket_io')

exports.salonBlock = async (userId, newStatus) => {
  try {
    const salon = await salonDetail.findOne({
      where: { userId: userId },
      attributes: ['id', 'userId'],
      include: [
        {
          model: employee,
          required: false,
          // Staff only: chair renters have their own account and plan, so
          // blocking a shop never blocks them.
          where: { isOwner: false, isExternalEmployee: false },
          attributes: ['id', 'userId'],
        },
      ],
    })

    const externalEmployees = []
    const userIdsToblock = [userId]
    const workers = []
    const externalEmployeesSalonId = []

    if (externalEmployees?.length > 0) {
      externalEmployees.forEach((ele) => {
        externalEmployeesSalonId.push(ele.id)
        userIdsToblock.push(ele.userId)
      })
    }

    if (salon?.employees?.length > 0) {
      salon?.employees.forEach((ele) => {
        userIdsToblock.push(ele.userId)
        workers.push(ele.id)
      })
    }

    if (externalEmployeesSalonId.length > 0) {
      salonDetail.update(
        { status: newStatus },
        { where: { id: externalEmployeesSalonId } },
      )
    }
    if (workers.length > 0) {
      employee.update({ status: newStatus }, { where: { id: workers } })
    }
    if (userIdsToblock.length > 0) {
      user.update({ status: newStatus }, { where: { id: userIdsToblock } })
      deviceToken.destroy({ where: { userId: userIdsToblock } })
    }

    if (!newStatus) {
      const socketInputService = {
        event: 'account-block',
        data: { type: 'logout' },
        bookingId: null,
      }
      sendEvent(`${salon?.id}S`, socketInputService)
      if (externalEmployeesSalonId.length > 0) {
        externalEmployeesSalonId.forEach((el) =>
          sendEvent(`${el}S`, socketInputService),
        )
      }
      if (workers.length > 0) {
        workers.forEach((el) => sendEvent(`${el}E`, socketInputService))
      }
    }

    console.log('🚀 ~~~~~ eventDrivenCommunication ~~~~~~~ 🚀')
    return true
  } catch (error) {
    console.log('🚀 ~ exports.SloanBLock Unblock= ~ error:', error)
  }
}
