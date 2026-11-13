// Security (Step C): the owner's list of logged-in devices, remote sign out,
// and whether managers need two-step login.
const db = require('../../models')
const twoStep = require('../../helper/twoStep')
const activity = require('../../helper/activityLog')

const reply = (res, status, message, data = {}) => res.json({ status, message, data, error: '' })
const isOwnerSession = (req) => !!req.branch?.isOwner && !req.branch?.staffUserId

/** GET /salon/v1/security */
exports.overview = async (req, res) => {
  if (!isOwnerSession(req)) return reply(res, '0', 'Only the shop owner can see devices.')
  const devices = await twoStep.devicesFor(req.user.id, req.branch.allowedSalonIds || [], twoStep.deviceHashOf(req))
  return reply(res, '1', 'Security', {
    twoStepForOwner: true,
    twoStepForManagers: await twoStep.getManagersFlag(req.user.id),
    devices,
  })
}

/** PUT /salon/v1/security { twoStepForManagers } */
exports.update = async (req, res) => {
  if (!isOwnerSession(req)) return reply(res, '0', 'Only the shop owner can change this.')
  const on = !!req.body?.twoStepForManagers
  await twoStep.setManagersFlag(req.user.id, on)
  await activity.record({
    salonDetailId: req.branch.salonId,
    brandId: req.branch.brandId,
    actorUserId: req.user.id,
    actorRole: 'owner',
    category: 'security',
    action: 'security.managers_two_step',
    details: { on },
    result: 'ok',
  })
  return reply(res, '1', on ? 'Managers now need a code on new devices.' : 'Managers no longer need a code.')
}

/** POST /salon/v1/security/devices/:id/sign-out */
exports.signOut = async (req, res) => {
  if (!isOwnerSession(req)) return reply(res, '0', 'Only the shop owner can sign devices out.')
  const id = parseInt(req.params.id, 10)
  const visible = await twoStep.devicesFor(req.user.id, req.branch.allowedSalonIds || [], twoStep.deviceHashOf(req))
  const shown = visible.find((d) => d.id === id)
  if (!shown) return reply(res, '0', 'Device not found.')
  if (shown.isThisDevice) return reply(res, '0', "This is the device you're using. Use Log out instead.")
  const row = await db.trustedDevice.findByPk(id)
  await twoStep.signOut(row, req.user.id)
  await activity.record({
    salonDetailId: req.branch.salonId,
    brandId: req.branch.brandId,
    actorUserId: req.user.id,
    actorRole: 'owner',
    category: 'security',
    action: 'device.signed_out',
    details: { device: shown.name, person: shown.who },
    result: 'ok',
  })
  return reply(res, '1', `${shown.name} is signed out.`)
}
