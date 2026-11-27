// Custom roles (Step C). Owners make and change them; anyone adding team
// members (owner or a manager with team access) can see them to pick one.
const customRoles = require('../../helper/customRoles')
const { LABELS } = require('../../helper/roles')

const reply = (res, status, message, data = {}) => res.json({ status, message, data, error: '' })

// Staff sessions carry the owner's id in req.user.id: the roles are the business's.
exports.list = async (req, res) =>
  reply(res, '1', 'Roles', {
    roles: await customRoles.list(req.user.id),
    permissions: Object.entries(LABELS).map(([key, label]) => ({ key, label: label.replace(/\n/g, ' ') })),
  })

exports.create = async (req, res) => reply(res, '1', 'Role made.', await customRoles.create(req.user.id, req.body))

exports.update = async (req, res) => {
  const r = await customRoles.update(req.user.id, req.params.id, req.body)
  return reply(res, '1', r.updated ? `Role saved. ${r.updated} ${r.updated === 1 ? 'person was' : 'people were'} updated.` : 'Role saved.', r.role)
}

exports.remove = async (req, res) =>
  reply(res, '1', 'Role deleted. Its people keep their current access.', await customRoles.remove(req.user.id, req.params.id))

/** PUT /salon/v1/roles-assign { employeeId, customRoleId|null } */
exports.assign = async (req, res) =>
  reply(res, '1', req.body?.customRoleId ? 'Role given.' : 'Role taken off.', await customRoles.assign(req.user.id, req.body?.employeeId, req.body?.customRoleId || null))
