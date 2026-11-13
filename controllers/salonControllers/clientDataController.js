// Client data tools (Step C): export the branch's client list, and send a
// client a copy of their data. Access: permission guards on the routes.
const db = require('../../models')
const clientData = require('../../helper/clientData')
const { actingSalonId } = require('../../helper/branchScope')

const reply = (res, status, message, data = {}) => res.json({ status, message, data, error: '' })

/** POST /salon/v1/clients/export — CSV of the open branch's clients, by email. */
exports.exportList = async (req, res) => {
  const salonId = await actingSalonId(req)
  // Approved for a team member (the owner's replay): the file goes to them.
  let toUserId = req.branch?.staffUserId || req.user.id
  if (req.approvalRequestId) {
    const a = await db.approvalRequest.findByPk(req.approvalRequestId, { attributes: ['requestedByUserId'] })
    if (a?.requestedByUserId) toUserId = a.requestedByUserId
  }
  const to = await db.user.findByPk(toUserId, { attributes: ['id', 'firstName', 'lastName', 'email'] })
  const out = await clientData.exportClients(salonId, to)

  // The owner is always told when someone else exports the client list.
  const salon = await db.salonDetail.findByPk(salonId, { attributes: ['userId', 'salonName'] })
  if (salon && toUserId !== salon.userId) {
    const who = `${to.firstName || ''} ${to.lastName || ''}`.trim()
    require('../../helper/staffDevices').ownDeviceTokens([salon.userId]).then((tokens) => {
      if (tokens.length) {
        require('../../utils/throwNotification')(tokens, { title: 'Client list exported', body: `${who} exported the client list of ${salon.salonName}.` }, { type: 'security' }, salon.userId)
      }
    }).catch(() => {})
  }
  return reply(res, '1', `The client list (${out.count} clients) is on its way to ${out.sentTo}.`, out)
}

/** POST /salon/v1/clients/:customerId/data-copy — a client's data, emailed to them. */
exports.dataCopy = async (req, res) => {
  const out = await clientData.sendDataCopy(Number(req.params.customerId), req.branch?.allowedSalonIds || [])
  return reply(res, '1', `A copy of their data is on its way to ${out.sentTo}.`, out)
}
