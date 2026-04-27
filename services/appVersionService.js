const axios = require('axios')
const { google } = require('googleapis')
const db = require('../models')

// ─── Semver Helper ────────────────────────────────────────────────────────────

function parseVersion(version) {
  const parts = (version || '0.0.0').split('.').map(Number)
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  }
}

// ─── Android: Google Play Developer API ──────────────────────────────────────

async function fetchFromPlayStore(packageName) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    })

    const authClient = await auth.getClient()
    const androidpublisher = google.androidpublisher({ version: 'v3', auth: authClient })

    // Create a temporary edit to read track info (edits.tracks works across all googleapis versions)
    const editResponse = await androidpublisher.edits.insert({ packageName })
    const editId = editResponse.data.id

    // Read production track within the edit
    const trackResponse = await androidpublisher.edits.tracks.get({
      packageName,
      editId,
      track: 'production',
    })

    // Delete the edit immediately — we only needed it to read the track
    await androidpublisher.edits.delete({ packageName, editId }).catch(() => {})

    const releases = trackResponse.data.releases || []
    const completed = releases.find((r) => r.status === 'completed')

    if (!completed) {
      console.log(`[AppVersion] [android] [${packageName}] No completed release found in production track`)
      return null
    }

    return completed.name || null
  } catch (err) {
    console.error(`[AppVersion] [android] [${packageName}] Play Store fetch failed:`, err.message)
    return null
  }
}

// ─── iOS: iTunes Lookup API ───────────────────────────────────────────────────

async function fetchFromAppStore(bundleId) {
  try {
    const url = `https://itunes.apple.com/lookup?bundleId=${bundleId}`
    const { data } = await axios.get(url, { timeout: 8000 })

    if (!data.results || data.results.length === 0) {
      console.log(`[AppVersion] [ios] [${bundleId}] Bundle not found on App Store`)
      return null
    }

    return data.results[0].version || null
  } catch (err) {
    console.error(`[AppVersion] [ios] [${bundleId}] App Store fetch failed:`, err.message)
    return null
  }
}

// ─── Core: Compare + Update DB ───────────────────────────────────────────────

async function checkAndUpdateVersion(appType, platform, storeVersion) {
  if (!storeVersion) {
    console.log(`[AppVersion] [${appType}] [${platform}] No store version fetched, skipping`)
    return
  }

  const row = await db.appVersionConfig.findOne({ where: { appType, platform } })

  if (!row) {
    console.log(`[AppVersion] [${appType}] [${platform}] No DB row found, skipping`)
    return
  }

  const dbVersion = row.latestVersion

  if (storeVersion === dbVersion) {
    console.log(`[AppVersion] [${appType}] [${platform}] No change (${dbVersion})`)
    return
  }

  const oldV = parseVersion(dbVersion)
  const newV = parseVersion(storeVersion)

  if (newV.major > oldV.major) {
    // MAJOR bump → force update: both latest and minimum bump to new version
    console.log(
      `[AppVersion] [${appType}] [${platform}] MAJOR bump ${dbVersion} → ${storeVersion} (force update)`,
    )
    await row.update({
      latestVersion: storeVersion,
      minimumSupportedVersion: storeVersion,
    })
  } else if (newV.minor > oldV.minor) {
    // MINOR bump → soft update: only latest bumps, minimum stays
    console.log(
      `[AppVersion] [${appType}] [${platform}] MINOR bump ${dbVersion} → ${storeVersion} (soft update)`,
    )
    await row.update({ latestVersion: storeVersion })
  } else if (newV.patch > oldV.patch) {
    // PATCH bump → silent update: only latest bumps, no user prompt
    console.log(
      `[AppVersion] [${appType}] [${platform}] PATCH bump ${dbVersion} → ${storeVersion} (no prompt)`,
    )
    await row.update({ latestVersion: storeVersion })
  } else {
    console.log(
      `[AppVersion] [${appType}] [${platform}] Store version (${storeVersion}) is not newer than DB (${dbVersion}), skipping`,
    )
  }
}

module.exports = {
  fetchFromPlayStore,
  fetchFromAppStore,
  checkAndUpdateVersion,
}
