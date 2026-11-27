const admin = require('firebase-admin')

/**
 * Initialize Firebase Admin once for the whole process (auth + FCM).
 * Safe to call from any module — uses admin.apps.length guard.
 */
function initFirebaseAdmin() {
  if (admin.apps.length) {
    return admin
  }
  try {
    const serviceAccount = require('../firebase.json')
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
    return admin
  } catch (err) {
    console.warn(
      '[firebaseAdmin] firebase.json not available — Firebase Admin disabled.',
      err.message,
    )
    return null
  }
}

/** @returns {import('firebase-admin').app.App | null} */
function getFirebaseAdmin() {
  return initFirebaseAdmin()
}

const FIREBASE_PROVIDER_MAP = {
  'google.com': 'google',
  'apple.com': 'apple',
  'facebook.com': 'facebook',
}

/**
 * Verify a Firebase ID token when firebase.json is configured.
 * Returns { ok: true, email, provider } or { ok: false, reason }.
 *
 * TODO: Ensure firebase.json exists at project root and Google/Apple sign-in
 * are enabled in Firebase Auth for full server-side verification.
 */
async function verifyCustomerIdToken(idToken) {
  if (!idToken) {
    return { ok: false, reason: 'NO_TOKEN' }
  }

  const firebaseAdmin = initFirebaseAdmin()
  if (!firebaseAdmin) {
    return { ok: false, reason: 'FIREBASE_NOT_CONFIGURED' }
  }

  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(idToken)
    const rawProvider = decoded.firebase?.sign_in_provider
    const provider = FIREBASE_PROVIDER_MAP[rawProvider] || null
    const email = decoded.email ? decoded.email.trim().toLowerCase() : null

    return { ok: true, email, provider, decoded }
  } catch (err) {
    console.warn('[firebaseAdmin] verifyIdToken failed:', err.message)
    return { ok: false, reason: 'INVALID_TOKEN', error: err.message }
  }
}

module.exports = {
  initFirebaseAdmin,
  getFirebaseAdmin,
  verifyCustomerIdToken,
}
