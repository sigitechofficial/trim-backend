// Run: node --test test/
// socket_io.js: signed-in sockets get only their own rooms; no token works until the cut-off.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

function load(rooms) {
  const stub = (rel, exports) => {
    const file = require.resolve(path.join(__dirname, '..', rel))
    require.cache[file] = { id: file, filename: file, loaded: true, exports }
  }
  stub('models/index.js', { unAcknowledgedEvents: {} })
  stub('helper/socketAuth.js', {
    socketRooms: async (t) => (t === 'good' ? { rooms: new Set(rooms), kind: 'owner' } : null),
    handshakeToken: (h) => h.auth?.token || null,
  })
  delete require.cache[require.resolve('../socket_io')]
  return require('../socket_io')
}

async function connect(s, token) {
  const socket = { handshake: { auth: token ? { token } : {} }, data: {} }
  let err = null
  await s.authorizeSocket(socket, (e) => { err = e || null })
  return { err: err?.message || null, can: (r) => s.mayJoin(socket, r) }
}

test('a signed-in socket may only join its own rooms', async () => {
  const s = load(['179S'])
  const c = await connect(s, 'good')
  assert.equal(c.err, null)
  assert.equal(c.can('179S'), true)
  assert.equal(c.can('16S'), false)
  assert.equal(c.can(179), false)
})

test('a bad token is refused', async () => {
  assert.equal((await connect(load([]), 'bad')).err, 'unauthorized')
})

test('no token: allowed until SOCKET_AUTH_REQUIRED=true', async () => {
  const s = load([])
  delete process.env.SOCKET_AUTH_REQUIRED
  const old = await connect(s, null)
  assert.equal(old.err, null)
  assert.equal(old.can('16S'), true)
  process.env.SOCKET_AUTH_REQUIRED = 'true'
  assert.equal((await connect(s, null)).err, 'unauthorized')
  delete process.env.SOCKET_AUTH_REQUIRED
})
