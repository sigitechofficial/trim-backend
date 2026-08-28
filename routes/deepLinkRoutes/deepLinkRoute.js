/**
 * Deep-linking / Universal-Link endpoints.
 *
 * Serves the platform verification files and human-facing fallback pages that
 * make shared links (salon profiles, team members, appointments) open the Trim
 * client app when installed, and show a "get the app" page otherwise.
 *
 * IMPORTANT: for Android App Links / iOS Universal Links to hand the URL to the
 * app, the HOST that serves these routes MUST be the same host used in the
 * app's AndroidManifest intent-filter and iOS associated-domains entitlement.
 * This backend answers on backend.trimworldwide.com (prod) and
 * stage.trimworldwide.com (test); the apex trimworldwide.com is a separate
 * Apache site and must serve these files independently (or proxy to here).
 *
 * Mounted at the app root (see thetrim.js) BEFORE the 404 handler.
 */

const express = require('express')

const router = express.Router()
const db = require('../../models')

// ─── App identity constants (override via env where useful) ──────────────────
const ANDROID_PACKAGE =
  process.env.DEEPLINK_ANDROID_PACKAGE || 'com.sigitechnologies.trim_user'

const IOS_APP_ID = process.env.DEEPLINK_IOS_APPSTORE_ID || '6742999519'
const IOS_BUNDLE_ID =
  process.env.DEEPLINK_IOS_BUNDLE_ID || 'com.sigitechnologies.trimios'
const IOS_TEAM_ID = process.env.DEEPLINK_IOS_TEAM_ID || '69JDF2R4M8'

// SHA-256 signing fingerprints allowed to verify Android App Links.
// Default = current debug keystore (for `flutter run` testing). Add the release
// keystore AND the Google Play App Signing fingerprint for production via
// DEEPLINK_ANDROID_SHA256 (comma-separated), no code change required.
const DEFAULT_SHA256 =
  '0C:DD:31:87:1F:9D:78:86:90:CA:A2:7F:34:6A:37:AA:61:79:9F:F2:D0:99:1F:54:41:AB:F6:03:73:84:84:29'

const ANDROID_SHA256_FINGERPRINTS = [
  ...new Set(
    `${DEFAULT_SHA256},${process.env.DEEPLINK_ANDROID_SHA256 || ''}`
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  ),
]

const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`
const APP_STORE_URL = `https://apps.apple.com/app/id${IOS_APP_ID}`

// Public origin of THIS backend. Behind the Apache reverse proxy, req.protocol /
// req.get('host') resolve to the internal 127.0.0.1:<port>, which would poison
// the self-referential landing-page URLs (og:url, the Open-in-app link, the iOS
// smart-banner app-argument). Derive it deterministically from NODE_ENV instead
// (same mapping thetrim.js uses), overridable via DEEPLINK_PUBLIC_ORIGIN.
function publicOrigin() {
  if (process.env.DEEPLINK_PUBLIC_ORIGIN) {
    return process.env.DEEPLINK_PUBLIC_ORIGIN.replace(/\/+$/, '')
  }
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'https://backend.trimworldwide.com'
    case 'test':
      return 'https://stage.trimworldwide.com'
    default:
      return `http://localhost:${process.env.PORT || 3000}`
  }
}

// ─── 1. Android App Links verification ───────────────────────────────────────
router.get('/.well-known/assetlinks.json', (req, res) => {
  res.type('application/json').send(
    JSON.stringify(
      [
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: ANDROID_PACKAGE,
            sha256_cert_fingerprints: ANDROID_SHA256_FINGERPRINTS,
          },
        },
      ],
      null,
      2,
    ),
  )
})

// ─── 2. iOS Universal Links verification (Apple App Site Association) ─────────
// Must be JSON, HTTP 200, no redirects, no `.json` extension.
router.get('/.well-known/apple-app-site-association', (req, res) => {
  res.type('application/json').send(
    JSON.stringify(
      {
        applinks: {
          apps: [],
          details: [
            {
              appID: `${IOS_TEAM_ID}.${IOS_BUNDLE_ID}`,
              paths: [
                '/shop-detail/*',
                '/salon-detail/*',
                '/team-member/*',
                '/appointmentDetail*',
                '/SplashScreen*',
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  )
})

// ─── Fallback landing page (shown only when the app is NOT installed) ─────────
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderLandingPage({ req, title, description, imageUrl, canonicalUrl }) {
  const safeTitle = escapeHtml(title)
  const safeDesc = escapeHtml(description)
  const safeImage = imageUrl ? escapeHtml(imageUrl) : ''
  const safeCanonical = escapeHtml(canonicalUrl)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle} — Trim</title>
  <meta name="description" content="${safeDesc}" />
  <!-- iOS Safari smart app banner -->
  <meta name="apple-itunes-app" content="app-id=${IOS_APP_ID}, app-argument=${safeCanonical}" />
  <!-- Open Graph / social preview -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:url" content="${safeCanonical}" />
  ${safeImage ? `<meta property="og:image" content="${safeImage}" />` : ''}
  <meta name="twitter:card" content="${safeImage ? 'summary_large_image' : 'summary'}" />
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0f0f10; color: #f5f5f7; display: flex; min-height: 100vh; align-items: center; justify-content: center; padding: 24px; }
    .card { width: 100%; max-width: 420px; text-align: center; }
    .cover { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 16px; background: #1c1c1e; margin-bottom: 20px; }
    h1 { font-size: 1.5rem; margin: 0 0 8px; color: #d4af37; }
    p.desc { color: #b8b8bd; margin: 0 0 28px; line-height: 1.5; font-size: 0.95rem; }
    a.btn { display: block; text-decoration: none; padding: 14px 18px; border-radius: 12px; font-weight: 600; margin: 10px 0; }
    a.primary { background: #d4af37; color: #1a1a1a; }
    a.store { background: #1f1f22; color: #f5f5f7; border: 1px solid #333; }
    .hint { margin-top: 22px; font-size: 0.8rem; color: #7d7d82; }
  </style>
</head>
<body>
  <div class="card">
    ${safeImage ? `<img class="cover" src="${safeImage}" alt="${safeTitle}" onerror="this.style.display='none'" />` : ''}
    <h1>${safeTitle}</h1>
    <p class="desc">${safeDesc}</p>
    <a class="btn primary" id="openApp" href="${safeCanonical}">Open in the Trim app</a>
    <a class="btn store" href="${escapeHtml(PLAY_STORE_URL)}">Get it on Google Play</a>
    <a class="btn store" href="${escapeHtml(APP_STORE_URL)}">Download on the App Store</a>
    <p class="hint">If you have the Trim app installed, this link opens it automatically.</p>
  </div>
  <script>
    // If the app is installed + verified, the OS opens it before this page loads.
    // Reaching this JS means it is likely NOT installed — nudge to the right store.
    (function () {
      var ua = navigator.userAgent || '';
      var isAndroid = /android/i.test(ua);
      var isIOS = /iphone|ipad|ipod/i.test(ua);
      var store = isIOS ? ${JSON.stringify(APP_STORE_URL)} : (isAndroid ? ${JSON.stringify(PLAY_STORE_URL)} : null);
      var btn = document.getElementById('openApp');
      if (btn && store) {
        btn.addEventListener('click', function () {
          // Give the OS a moment to intercept the universal link; else go to store.
          setTimeout(function () { window.location.href = store; }, 1200);
        });
      }
    })();
  </script>
</body>
</html>`
}

// ─── 3. Shop profile fallback: /shop-detail/:id (and legacy /salon-detail/:id) ─
// The user-facing path is /shop-detail; /salon-detail is kept for links shared
// before the rename. Both render the same page from the same salon data.
async function shopDetailHandler(req, res) {
  const { id } = req.params
  const origin = publicOrigin()
  const canonicalUrl = `${origin}${req.originalUrl}`

  let title = 'Shop on Trim'
  let description =
    'View this shop, browse services and book your appointment in the Trim app.'
  let imageUrl = ''

  try {
    const salon = await db.salonDetail.findByPk(id, {
      attributes: ['salonName', 'coverImage'],
    })
    if (salon) {
      if (salon.salonName) title = salon.salonName
      if (salon.coverImage) {
        // coverImage is stored like "Public/Gallery/GalleryImg-101-...jpg"
        imageUrl = `${origin}/${String(salon.coverImage).replace(/^\/+/, '')}`
      }
      description = `Book services at ${title} on Trim.`
    }
  } catch (err) {
    // Never let a DB hiccup turn the share link back into a 404.
    console.error('[deepLink] /shop-detail lookup failed:', err.message)
  }

  res
    .status(200)
    .send(renderLandingPage({ req, title, description, imageUrl, canonicalUrl }))
}

router.get('/shop-detail/:id', shopDetailHandler)
router.get('/salon-detail/:id', shopDetailHandler)

// ─── 4. Team member fallback: /team-member/:salonId/:employeeId ──────────────
router.get('/team-member/:salonId/:employeeId', (req, res) => {
  const canonicalUrl = `${publicOrigin()}${req.originalUrl}`
  res.status(200).send(
    renderLandingPage({
      req,
      title: 'Team member on Trim',
      description: 'View this team member’s profile and book in the Trim app.',
      imageUrl: '',
      canonicalUrl,
    }),
  )
})

// ─── 5. Appointment fallback: /appointmentDetail?id=... ──────────────────────
router.get('/appointmentDetail', (req, res) => {
  const canonicalUrl = `${publicOrigin()}${req.originalUrl}`
  res.status(200).send(
    renderLandingPage({
      req,
      title: 'Your appointment on Trim',
      description: 'Open the Trim app to view your appointment details.',
      imageUrl: '',
      canonicalUrl,
    }),
  )
})

module.exports = router
