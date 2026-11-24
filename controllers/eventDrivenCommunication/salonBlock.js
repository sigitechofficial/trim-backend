const { employee, salonDetail, user, deviceToken } = require('../../models')

const { sendEvent } = require('../../socket_io')

// Block or unblock one branch only (Trim admin). Only this branch's staff rows
// change, so someone who also works in other branches carries on there; only
// people left with no active branch are signed out. Unblock turns back on just
// the rows the block turned off (never someone the owner blocked themselves).
exports.branchBlock = async (salonId, newStatus) => {
  try {
    const { Op } = require('sequelize')
    await salonDetail.update({ status: newStatus }, { where: { id: salonId } })
    const staffWhere = { salonDetailId: salonId, isOwner: false, isExternalEmployee: false, deleted: false }
    if (!newStatus) {
      const rows = await employee.findAll({ where: { ...staffWhere, status: true }, attributes: ['id', 'userId'] })
      if (!rows.length) return true
      await employee.update({ status: false, branchBlocked: true }, { where: { id: rows.map((e) => e.id) } })
      for (const e of rows) {
        const elsewhere = await employee.count({ where: { userId: e.userId, deleted: false, status: true, id: { [Op.ne]: e.id } } })
        if (elsewhere) continue // still works in another branch: stays signed in there
        // Their own device rows and the matching rows under the owner's id.
        await require('../../helper/staffDevices').revokeStaffDevices(e.userId)
        sendEvent(`${e.id}E`, { event: 'account-block', data: { type: 'logout' }, bookingId: null })
      }
      return true
    }
    const marked = await employee.findAll({ where: { ...staffWhere, branchBlocked: true }, attributes: ['id', 'userId'] })
    if (marked.length) {
      await employee.update({ status: true, branchBlocked: false }, { where: { id: marked.map((e) => e.id) } })
      return true
    }
    // Blocked before rows were marked: restore as the old block did.
    const legacy = await employee.findAll({ where: staffWhere, attributes: ['id', 'userId'] })
    if (legacy.length) {
      await employee.update({ status: true }, { where: { id: legacy.map((e) => e.id) } })
      await user.update({ status: true }, { where: { id: legacy.map((e) => e.userId) } })
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
