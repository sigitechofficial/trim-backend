const { Op, fn, col, where } = require('sequelize')
const { deviceToken } = require('../models')
const { verifyCustomerIdToken } = require('../utils/firebaseAdmin')

const SOCIAL_PROVIDERS = ['google', 'apple']

const AUTH_STATUS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  NEW_SOCIAL_USER_CREATED: 'NEW_SOCIAL_USER_CREATED',
  PROVIDER_MISMATCH: 'PROVIDER_MISMATCH',
  ACCOUNT_CONFLICT: 'ACCOUNT_CONFLICT',
  OTP_REQUIRED: 'OTP_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_BLOCKED: 'ACCOUNT_BLOCKED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ERROR: 'ERROR',
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase()
}

function providerLabel(signedFrom) {
  const labels = {
    google: 'Google',
    apple: 'Apple',
    email: 'email and password',
    walkin: 'walk-in',
  }
  return labels[signedFrom] || signedFrom
}

function providerMismatchMessage(registeredProvider) {
  if (registeredProvider === 'google') {
    return 'This email is registered with Google. Please continue with Google.'
  }
  if (registeredProvider === 'apple') {
    return 'This email is registered with Apple. Please continue with Apple.'
  }
  if (registeredProvider === 'email') {
    return 'This email is registered with email and password. Please log in using your password.'
  }
  return `This email is registered with ${providerLabel(registeredProvider)}. Please use that sign-in method.`
}

function authResponse({
  status,
  authStatus,
  message,
  data = {},
  registeredProvider,
  error = '',
}) {
  const body = {
    status: `${status}`,
    message: `${message}`,
    data,
    error: `${error}`,
  }
  if (authStatus) body.authStatus = authStatus
  if (registeredProvider) body.registeredProvider = registeredProvider
  return body
}

async function findUsersByNormalizedEmail(userModel, email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return []

  return userModel.findAll({
    where: {
      deleted: 0,
      [Op.and]: [where(fn('LOWER', col('email')), normalized)],
    },
    include: [{ model: deviceToken, required: false, attributes: ['tokenId'] }],
  })
}

async function findActiveCustomersByEmail(userModel, email, extraInclude = []) {
  const normalized = normalizeEmail(email)
  if (!normalized) return []

  const defaultInclude = [
    { model: deviceToken, required: false, attributes: ['tokenId'] },
  ]

  return userModel.findAll({
    where: {
      deleted: 0,
      userTypeId: 1,
      [Op.and]: [where(fn('LOWER', col('email')), normalized)],
    },
    include: [...defaultInclude, ...extraInclude],
  })
}

function resolveCustomerAccount(customers, attemptedProvider) {
  if (!customers.length) {
    return { type: 'NOT_FOUND' }
  }

  const providers = [...new Set(customers.map((u) => u.signedFrom))]

  if (providers.length > 1 || customers.length > 1) {
    return { type: 'ACCOUNT_CONFLICT' }
  }

  const account = customers[0]

  if (!account.status) {
    return { type: 'BLOCKED', account }
  }

  if (attemptedProvider && account.signedFrom !== attemptedProvider) {
    return {
      type: 'PROVIDER_MISMATCH',
      account,
      registeredProvider: account.signedFrom,
    }
  }

  return { type: 'OK', account }
}

function hasBusinessAccount(allUsers) {
  return allUsers.some((u) => u.userTypeId === 2)
}

async function ensureDeviceToken(deviceTokenModel, userRecord, dvToken) {
  if (!dvToken) return
  const tokens = userRecord.deviceTokens || []
  const found = tokens.find((ele) => ele.tokenId === dvToken)
  if (!found) {
    await deviceTokenModel.create({
      tokenId: dvToken,
      status: true,
      userId: userRecord.id,
    })
  }
}

async function maybeBackfillVerifiedAt(userModel, userRecord) {
  if (
    SOCIAL_PROVIDERS.includes(userRecord.signedFrom) &&
    !userRecord.verifiedAt
  ) {
    await userModel.update(
      { verifiedAt: new Date() },
      { where: { id: userRecord.id } },
    )
    userRecord.verifiedAt = new Date()
  }
}

function isSocialProvider(provider) {
  return SOCIAL_PROVIDERS.includes(provider)
}

function isEmailLikeProvider(provider) {
  return provider === 'email' || provider === 'walkin'
}

/**
 * Optionally verify idToken; falls back to request email when Firebase is unavailable.
 */
async function resolveVerifiedSocialIdentity({
  email,
  loginBy,
  idToken,
}) {
  const requestEmail = normalizeEmail(email)

  if (idToken) {
    const verification = await verifyCustomerIdToken(idToken)
    if (verification.ok) {
      if (verification.provider && verification.provider !== loginBy) {
        return {
          ok: false,
          authStatus: AUTH_STATUS.PROVIDER_MISMATCH,
          message: `Token provider does not match requested sign-in method (${loginBy}).`,
        }
      }
      if (verification.email && requestEmail && verification.email !== requestEmail) {
        return {
          ok: false,
          authStatus: AUTH_STATUS.INVALID_CREDENTIALS,
          message: 'Email in token does not match the provided email.',
        }
      }
      return {
        ok: true,
        email: verification.email || requestEmail,
        tokenVerified: true,
      }
    }

    if (verification.reason === 'INVALID_TOKEN') {
      return {
        ok: false,
        authStatus: AUTH_STATUS.INVALID_CREDENTIALS,
        message: 'Invalid or expired sign-in token.',
      }
    }

    // FIREBASE_NOT_CONFIGURED or NO_TOKEN — fall through to request email
    if (verification.reason === 'FIREBASE_NOT_CONFIGURED') {
      console.warn(
        '[customerAuth] Proceeding without server-side token verification. ' +
          'Place firebase.json at project root to enable verifyIdToken.',
      )
    }
  }

  if (!requestEmail) {
    return {
      ok: false,
      authStatus: AUTH_STATUS.ERROR,
      message: 'Email is required.',
    }
  }

  return { ok: true, email: requestEmail, tokenVerified: false }
}

module.exports = {
  SOCIAL_PROVIDERS,
  AUTH_STATUS,
  normalizeEmail,
  providerLabel,
  providerMismatchMessage,
  authResponse,
  findUsersByNormalizedEmail,
  findActiveCustomersByEmail,
  resolveCustomerAccount,
  hasBusinessAccount,
  ensureDeviceToken,
  maybeBackfillVerifiedAt,
  isSocialProvider,
  isEmailLikeProvider,
  resolveVerifiedSocialIdentity,
}
