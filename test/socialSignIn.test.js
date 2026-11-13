// Run: node --test test/
// helper/socialSignIn.js: a social sign-in needs a valid Firebase token for
// the same provider and email.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

// The helper imports utils/firebaseAdmin; stub it so no Firebase is needed.
const fa = require.resolve(path.join(__dirname, '..', 'utils', 'firebaseAdmin'))
require.cache[fa] = { id: fa, filename: fa, loaded: true, exports: { verifyCustomerIdToken: async () => ({ ok: false, reason: 'NO_TOKEN' }) } }
const { verifySocialSignIn } = require('../helper/socialSignIn')

const good = (provider, email) => async () => ({ ok: true, provider, email })

test('email accounts are not affected', async () => {
  assert.equal((await verifySocialSignIn({ provider: 'email', email: 'a@b.co' })).ok, true)
})

test('no token: refused unless SOCIAL_LOGIN_TOKEN=optional', async () => {
  assert.equal((await verifySocialSignIn({ provider: 'google', email: 'a@b.co' })).ok, false)
  process.env.SOCIAL_LOGIN_TOKEN = 'optional'
  assert.equal((await verifySocialSignIn({ provider: 'google', email: 'a@b.co' })).ok, true)
  delete process.env.SOCIAL_LOGIN_TOKEN
})

test('a valid token for the same provider and email passes (case-insensitive)', async () => {
  const r = await verifySocialSignIn({ idToken: 't', provider: 'google', email: 'Sam@X.com', verify: good('google', 'sam@x.com') })
  assert.equal(r.ok, true)
})

test('wrong email, wrong provider, bad token or no email are refused', async () => {
  assert.equal((await verifySocialSignIn({ idToken: 't', provider: 'google', email: 'victim@x.com', verify: good('google', 'me@x.com') })).ok, false)
  assert.equal((await verifySocialSignIn({ idToken: 't', provider: 'apple', email: 'me@x.com', verify: good('google', 'me@x.com') })).ok, false)
  assert.equal((await verifySocialSignIn({ idToken: 't', provider: 'google', email: 'me@x.com', verify: async () => ({ ok: false, reason: 'INVALID_TOKEN' }) })).ok, false)
  assert.equal((await verifySocialSignIn({ idToken: 't', provider: 'facebook', email: 'me@x.com', verify: good('facebook', null) })).ok, false)
})

test('server without firebase.json fails closed', async () => {
  const r = await verifySocialSignIn({ idToken: 't', provider: 'google', email: 'me@x.com', verify: async () => ({ ok: false, reason: 'FIREBASE_NOT_CONFIGURED' }) })
  assert.equal(r.ok, false)
})
