const { user, deviceToken } = require('../../models')

const { sendEvent } = require('../../socket_io')

exports.customerBlockEvent = async (userId, newStatus) => {
  try {
    deviceToken.destroy({ where: { userId: userId } })

    const socketInputService = {
      event: 'account-block',
      data: { type: 'logout' },
      bookingId: null,
    }
    sendEvent(`${userId}`, socketInputService)

    console.log('🚀 ~~~~~ eventDrivenCommunication ~~~~~~~ 🚀')
    return true
  } catch (error) {
    console.log('🚀 ~ exports.SloanBLock Unblock= ~ error:', error)
  }
}
