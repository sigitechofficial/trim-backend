// Google / Apple / Facebook sign-in must prove itself (security fix).
//
// The apps sign in with Firebase Auth and used to send only the email; the
// server believed it, so anyone who knew the email of a social-signup account
// could get a session for it. Now the app sends the Firebase ID token
// (user.getIdToken()) and the server checks it with Firebase Admin: valid,
// from the same provider, for the same email.
//
// SOCIAL_LOGIN_TOKEN=optional lets apps without the token in for a short
// rollout window (a token that is sent is still checked). Default: required.
const { verifyCustomerIdToken } = require('../utils/firebaseAdmin')

const SOCIAL = ['google', 'apple', 'facebook']
const norm = (e) => String(e || '').trim().toLowerCase()

const required = () => process.env.SOCIAL_LOGIN_TOKEN !== 'optional'

/**
 * Check a social sign-in. Returns { ok: true } or { ok: false, message }.
 * provider: the account's sign-in method; email: the account's email.
 */
async function verifySocialSignIn({ idToken, provider, email, verify = verifyCustomerIdToken }) {
  if (!SOCIAL.includes(provider)) return { ok: true }
  if (!idToken) {
    if (!required()) {
      console.warn(`[socialSignIn] ${provider} sign-in without a token allowed (SOCIAL_LOGIN_TOKEN=optional)`)
      return { ok: true }
    }
    return { ok: false, message: 'Please update the app to sign in with Google, Apple or Facebook.' }
  }
  const v = await verify(idToken)
  if (!v.ok) {
    if (v.reason === 'FIREBASE_NOT_CONFIGURED') {
      console.error('[socialSignIn] firebase.json missing: social sign-in cannot be checked')
      if (!required()) return { ok: true }
    }
    return { ok: false, message: 'Your sign-in has expired. Please try again.' }
  }
  if (v.provider !== provider) {
    return { ok: false, message: 'Please sign in with the same method you signed up with.' }
  }
  if (!v.email || norm(v.email) !== norm(email)) {
    return { ok: false, message: 'This sign-in is for a different email address.' }
  }
  return { ok: true }
}

module.exports = { verifySocialSignIn, SOCIAL }
