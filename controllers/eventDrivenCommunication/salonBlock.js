const { employee, salonDetail, user, deviceToken } = require('../../models')

const { sendEvent } = require('../../socket_io')

// Step A: block/unblock one branch only (admin): its staff rows and their
// logins; the owner and the other branches carry on.
exports.branchBlock = async (salonId, newStatus) => {
  try {
    const staff = await employee.findAll({
      where: { salonDetailId: salonId, isOwner: false, isExternalEmployee: false },
      attributes: ['id', 'userId'],
    })
    await salonDetail.update({ status: newStatus }, { where: { id: salonId } })
    if (staff.length) {
      await employee.update({ status: newStatus }, { where: { id: staff.map((e) => e.id) } })
      // Their logins too, as a whole-shop block does (a staff member works in
      // one branch for now).
      await user.update({ status: newStatus }, { where: { id: staff.map((e) => e.userId) } })
      if (!newStatus) {
        await deviceToken.destroy({ where: { userId: staff.map((e) => e.userId) } })
        staff.forEach((e) => sendEvent(`${e.id}E`, { event: 'account-block', data: { type: 'logout' }, bookingId: null }))
      }
    }
    return true
  } catch (error) {
    console.log('🚀 ~ branchBlock error:', error)
  }
}

exports.salonBlock = async (userId, newStatus) => {
  try {
    // Every branch of this owner (one shop for most).
    const branches = await salonDetail.findAll({
      where: { userId: userId, isExternalEmployee: { [require('sequelize').Op.or]: [false, null] } },
      attributes: ['id'],
    })
    if (branches.length > 1) {
      await Promise.all(branches.slice(1).map((b) => exports.branchBlock(b.id, newStatus)))
    }
    const salon = await salonDetail.findOne({
      where: { id: branches.length ? branches[0].id : -1 },
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
