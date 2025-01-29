const { employee, salonDetail, user, deviceToken } = require('../../models')

const { sendEvent } = require('../../socket_io')

exports.blockEmployees = async (newStatus, worker) => {
  try {
    if (!worker) return 0

    const socketInputService = {
      event: 'account-block',
      data: { type: 'logout' },
      bookingId: null,
    }

    if (worker?.isExternalEmployee) {
      const externalSalon = await salonDetail.findOne({
        where: { userId: worker?.id },
        attributes: ['id'],
      })
      salonDetail.update(
        { status: newStatus },
        { where: { id: externalSalon.id } },
      )
      if (!newStatus) {
        sendEvent(`${externalSalon?.id}S`, socketInputService)
      }
    } else if (!worker?.isExternalEmployee) {
      if (!newStatus) {
        sendEvent(`${worker?.employee}E`, socketInputService)
      }
    }
    console.log('🚀 ~~~~~EmployeeBLock eventDrivenCommunication ~~~~~~~ 🚀')
    return true
  } catch (error) {
    console.log('🚀 ~ exports.EmployeeBLock Unblock= ~ error:', error)
  }
}
