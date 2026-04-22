const cron = require('node-cron')
const {
  fetchFromPlayStore,
  fetchFromAppStore,
  checkAndUpdateVersion,
} = require('../services/appVersionService')

// Runs every hour at minute 0
cron.schedule('0 * * * *', async () => {
  console.log('[AppVersion] Running hourly version check...')

  // Android — Google Play Developer API
  try {
    const androidVersion = await fetchFromPlayStore(process.env.ANDROID_PACKAGE_NAME)
    await checkAndUpdateVersion('android', androidVersion)
  } catch (err) {
    console.error('[AppVersion] Android check error:', err.message)
  }

  // iOS — iTunes Lookup
  try {
    const iosVersion = await fetchFromAppStore(process.env.IOS_BUNDLE_ID)
    await checkAndUpdateVersion('ios', iosVersion)
  } catch (err) {
    console.error('[AppVersion] iOS check error:', err.message)
  }
})

console.log('[AppVersion] Hourly version check cron registered (runs at minute 0 every hour)')
