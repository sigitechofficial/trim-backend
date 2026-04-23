const cron = require('node-cron')
const {
  fetchFromPlayStore,
  fetchFromAppStore,
  checkAndUpdateVersion,
} = require('../services/appVersionService')

// Runs every hour at minute 0
cron.schedule('0 * * * *', async () => {
  console.log('[AppVersion] Running hourly version check for all apps...')

  // ─── Client App ──────────────────────────────────────────────────────────

  try {
    const version = await fetchFromPlayStore(process.env.CLIENT_ANDROID_PACKAGE_NAME)
    await checkAndUpdateVersion('client', 'android', version)
  } catch (err) {
    console.error('[AppVersion] [client] [android] check error:', err.message)
  }

  try {
    const version = await fetchFromAppStore(process.env.CLIENT_IOS_BUNDLE_ID)
    await checkAndUpdateVersion('client', 'ios', version)
  } catch (err) {
    console.error('[AppVersion] [client] [ios] check error:', err.message)
  }

  // ─── Business App ─────────────────────────────────────────────────────────

  try {
    const version = await fetchFromPlayStore(process.env.BUSINESS_ANDROID_PACKAGE_NAME)
    await checkAndUpdateVersion('business', 'android', version)
  } catch (err) {
    console.error('[AppVersion] [business] [android] check error:', err.message)
  }

  try {
    const version = await fetchFromAppStore(process.env.BUSINESS_IOS_BUNDLE_ID)
    await checkAndUpdateVersion('business', 'ios', version)
  } catch (err) {
    console.error('[AppVersion] [business] [ios] check error:', err.message)
  }
})

console.log('[AppVersion] Hourly version check cron registered (runs at minute 0 every hour)')
