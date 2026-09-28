/**
 * Publishes the Android/iOS app-association files to the APEX site document root
 * (https://trimworldwide.com) on server startup.
 *
 * Why here: shared links use the apex host `trimworldwide.com`, so the phone
 * fetches `https://trimworldwide.com/.well-known/{assetlinks.json,
 * apple-app-site-association}` to decide whether to open the app. The apex is a
 * separate static Apache site (not this Node app), but it lives in the same
 * cPanel account, so this process (running as the same user) can write those
 * files into the apex document root. Doing it on startup means every deploy
 * (pm2 restart) refreshes them — no manual cPanel step, no CI workflow edit.
 *
 * Safe by design: if no apex docroot exists (e.g. local dev), it logs and skips.
 * Idempotent: it writes the same content every boot.
 */

const fs = require('fs')
const path = require('path')
const { renderBusinessDownloadHtml } = require('./businessDownloadPage')
const { renderCustomerDownloadHtml } = require('./customerDownloadPage')

// --- App identity (override via env where useful) ---------------------------
const ANDROID_PACKAGE =
  process.env.DEEPLINK_ANDROID_PACKAGE || 'com.sigitechnologies.trim_user'
const IOS_APP_ID_FULL =
  process.env.DEEPLINK_IOS_APPID || '69JDF2R4M8.com.sigitechnologies.trimios'

// Business (salon-owner) app — its share/invite links (e.g. /LoginScreen) must
// also open ITS app, so it needs its own statement in these files.
const BUSINESS_ANDROID_PACKAGE =
  process.env.DEEPLINK_ANDROID_PACKAGE_BUSINESS ||
  'com.sigitechnologies.trim_saloon'
const BUSINESS_IOS_APP_ID_FULL =
  process.env.DEEPLINK_IOS_APPID_BUSINESS ||
  '69JDF2R4M8.com.sigitechnologies.trimbusinessios'

// SHA-256 signing fingerprints allowed to verify Android App Links. Default =
// debug keystore (for testing; the debug keystore is shared, so both the
// customer and business dev builds use the same one). Add each app's release +
// Google Play App Signing SHA-256 for production via the *_SHA256 envs.
const DEFAULT_SHA256 =
  '0C:DD:31:87:1F:9D:78:86:90:CA:A2:7F:34:6A:37:AA:61:79:9F:F2:D0:99:1F:54:41:AB:F6:03:73:84:84:29'
// Release signing certs of the installed (non-debug) builds — read from the
// device. Needed so release/store builds verify App Links (debug fp = flutter run).
const CUSTOMER_RELEASE_SHA256 =
  'E7:DC:E4:5C:D0:9F:3F:DD:B4:89:B1:1B:F5:0A:E1:64:B2:DD:5B:73:58:B8:27:2B:92:52:27:FB:AC:BE:66:1D'
const BUSINESS_RELEASE_SHA256 =
  '42:C0:FD:1C:EC:3C:D8:97:2F:51:A0:E4:FC:E5:EA:26:70:1A:7A:D2:9A:93:DC:AA:D6:05:5A:42:DF:48:BE:F9'
// Google Play App Signing key for the BUSINESS app (com.sigitechnologies.trim_saloon).
// Play re-signs store builds with this key, so App Links from the Play Store build
// only verify if THIS fingerprint is present (the value above is the upload key).
// Source: Play Console → Protected with Play → Play Store protection → Manage Play
// app signing → Digital Asset Links JSON. Fixes the employee-invite /LoginScreen link
// opening Chrome ("Not found") instead of the app on store builds.
const BUSINESS_PLAY_APP_SIGNING_SHA256 =
  '4B:A0:52:6D:17:F1:8A:B8:04:BB:95:11:BC:17:6F:46:58:2D:29:9B:E6:D2:0B:17:A0:84:AD:FA:8F:10:FB:BC'
function fingerprints(...sources) {
  return [
    ...new Set(
      sources
        .filter(Boolean)
        .join(',')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ]
}
const FINGERPRINTS = fingerprints(
  DEFAULT_SHA256,
  CUSTOMER_RELEASE_SHA256,
  process.env.DEEPLINK_ANDROID_SHA256,
)
const BUSINESS_FINGERPRINTS = fingerprints(
  DEFAULT_SHA256,
  BUSINESS_RELEASE_SHA256,
  BUSINESS_PLAY_APP_SIGNING_SHA256,
  process.env.DEEPLINK_ANDROID_SHA256_BUSINESS,
)

const ASSETLINKS = JSON.stringify(
  [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: FINGERPRINTS,
      },
    },
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: BUSINESS_ANDROID_PACKAGE,
        sha256_cert_fingerprints: BUSINESS_FINGERPRINTS,
      },
    },
  ],
  null,
  2,
)

const AASA = JSON.stringify(
  {
    applinks: {
      apps: [],
      details: [
        {
          appID: IOS_APP_ID_FULL,
          paths: [
            '/shop-detail/*',
            '/salon-detail/*',
            '/team-member/*',
            '/appointmentDetail*',
            '/SplashScreen*',
          ],
        },
        {
          appID: BUSINESS_IOS_APP_ID_FULL,
          paths: [
            '/LoginScreen*',
            '/BusinessSplash*',
            '/BookingDetailScreen*',
            '/bookingDetails*',
          ],
        },
      ],
    },
  },
  null,
  2,
)

const HTACCESS =
  '<Files "apple-app-site-association">\n  ForceType application/json\n</Files>\n' +
  '# Short cache so fingerprint/path changes propagate to the verifier fast.\n' +
  '<IfModule mod_headers.c>\n  Header set Cache-Control "public, max-age=60"\n</IfModule>\n'

const ID_OPENER_HTACCESS =
  'DirectoryIndex index.html\n' +
  '<IfModule mod_rewrite.c>\n' +
  '  RewriteEngine On\n' +
  '  RewriteCond %{REQUEST_FILENAME} !-f\n' +
  '  RewriteRule ^ index.html [L]\n' +
  '</IfModule>\n'

// Candidate apex document roots, most specific first. APEX_DOCROOT can pin it.
const CANDIDATES = [
  process.env.APEX_DOCROOT,
  '/home/trimworldwide/trimworldwide.com',
  '/home/trimworldwide/public_html',
].filter(Boolean)

// The .co.uk marketing site is a SEPARATE static Apache site. We mirror the
// customer download page there at /get-app so a shared link's preview card shows
// the `trimworldwide.co.uk` domain (WhatsApp/Facebook label the card with the
// shared URL's host, not og:url). COUK_DOCROOT pins it; otherwise try the usual
// addon-domain roots. If none is writable by this process, we log and skip (the
// .com page keeps working).
const COUK_BASE_URL =
  process.env.COUK_BASE_URL || 'https://www.trimworldwide.co.uk/get-app'
const COUK_CANDIDATES = [
  process.env.COUK_DOCROOT,
  '/home/trimworldwide/trimworldwide.co.uk',
  '/home/trimworldwide/public_html/trimworldwide.co.uk',
  '/home/trimworldwide/www.trimworldwide.co.uk',
  '/home/trimworldwide/public_html/www.trimworldwide.co.uk',
].filter(Boolean)

function isDir(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isDirectory()
  } catch (e) {
    return false
  }
}

const HT_BEGIN = '# BEGIN trim-deeplinks   (managed by helper/apexDeepLinks.js)'
const HT_END = '# END trim-deeplinks'

// Remove ONLY our previously-managed block from the apex root .htaccess, leaving
// every other rule untouched. (We proxied deep-link pages here to restore rich
// link previews, but `[P]` to an HTTPS backend needs SSLProxyEngine — a server
// directive .htaccess can't set — so it 500'd. Reverted to keep the apex clean:
// App Links still open the app; shared links show as plain links.)
function removeRootHtaccessBlock(root) {
  const file = path.join(root, '.htaccess')
  let existing = ''
  try {
    existing = fs.readFileSync(file, 'utf8')
  } catch (e) {
    return // no .htaccess → nothing to clean
  }
  const begin = existing.indexOf(HT_BEGIN)
  if (begin === -1) return // our block not present
  const end = existing.indexOf(HT_END, begin)
  const after =
    end !== -1 ? existing.slice(end + HT_END.length).replace(/^\n/, '') : ''
  const next = (existing.slice(0, begin) + after).replace(/\n{3,}/g, '\n\n').trim()
  if (next) {
    fs.writeFileSync(file, next + '\n')
  } else {
    // file only ever held our block → remove it entirely
    try {
      fs.unlinkSync(file)
    } catch (e) {
      fs.writeFileSync(file, '')
    }
  }
}

// Generic "open the app" fallback page for App Link paths (business: /LoginScreen,
// /BookingDetailScreen, /bookingDetails, /BusinessSplash; customer: /appointmentDetail,
// /SplashScreen). Android email clients (Gmail) open links in an in-app browser /
// Custom Tab that does NOT fire verified App Links, so an email button lands on this
// page instead of the app — and if no page exists there, it's a 404 ("Not found").
// This page uses an Android `intent://` URL — which the in-app browser hands off to
// the system — to open the app by package (preserving the path + query so the app
// routes to the right screen), falling back to the Play Store only if not installed.
// iOS opens Universal Links from Mail directly; if this page still loads there, it
// offers the App Store.
const APP_OPEN = {
  business: {
    name: 'Trim Business',
    pkg: 'com.sigitechnologies.trim_saloon',
    ios: 'https://apps.apple.com/app/id6742323827',
    play: 'https://play.google.com/store/apps/details?id=com.sigitechnologies.trim_saloon',
  },
  customer: {
    name: 'Trim',
    pkg: 'com.sigitechnologies.trim_user',
    ios: 'https://apps.apple.com/app/id6742999519',
    play: 'https://play.google.com/store/apps/details?id=com.sigitechnologies.trim_user',
  },
}
function renderAppOpenPage(app) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Opening ${app.name}…</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#fff;color:#111;text-align:center;padding:56px 24px}a{display:inline-block;margin:8px 6px;color:#1c1c1c;font-weight:600}h1{font-size:1.4rem;margin:12px 0}</style>
</head><body>
<h1>Opening the ${app.name} app…</h1>
<p>If it doesn't open automatically, use a button below.</p>
<p>
  <a href="${app.play}">Get it on Google Play</a>
  <a href="${app.ios}">Download on the App Store</a>
</p>
<script>
(function(){
  var ua = navigator.userAgent || "";
  var isAndroid = /android/i.test(ua);
  var isIOS = /iphone|ipad|ipod/i.test(ua);
  var path = location.pathname || "/";
  if (path.length > 1 && path.charAt(path.length - 1) === "/") path = path.slice(0, -1);
  var search = location.search || "";
  if (isAndroid) {
    var intent = "intent://trimworldwide.com" + path + search +
      "#Intent;scheme=https;package=${app.pkg};" +
      "S.browser_fallback_url=" + encodeURIComponent("${app.play}") + ";end";
    window.location.href = intent;
  } else if (isIOS) {
    setTimeout(function(){ window.location.href = "${app.ios}"; }, 1500);
  }
})();
</script>
</body></html>`
}

function publishApexDeepLinkFiles() {
  if (process.env.PUBLISH_APEX_DEEPLINKS === 'false') return
  try {
    const root = CANDIDATES.find(isDir)
    if (!root) {
      console.log(
        `[apexDeepLinks] apex docroot not found; skipping (candidates: ${CANDIDATES.join(
          ', ',
        )})`,
      )
      return
    }
    const wellKnown = path.join(root, '.well-known')
    fs.mkdirSync(wellKnown, { recursive: true })
    fs.writeFileSync(path.join(wellKnown, 'assetlinks.json'), ASSETLINKS)
    fs.writeFileSync(
      path.join(wellKnown, 'apple-app-site-association'),
      AASA,
    )
    fs.writeFileSync(path.join(wellKnown, '.htaccess'), HTACCESS)
    console.log(`[apexDeepLinks] published .well-known files to ${wellKnown}`)

    // Business app download page, served at https://trimworldwide.com/get-business-app
    // (clean apex host — same URL the in-app Business QR encodes). As a directory
    // with index.html so Apache serves it statically without any rewrite rule.
    const bizDir = path.join(root, 'get-business-app')
    fs.mkdirSync(bizDir, { recursive: true })
    fs.writeFileSync(path.join(bizDir, 'index.html'), renderBusinessDownloadHtml())
    console.log(`[apexDeepLinks] published business download page to ${bizDir}`)

    // App-opener fallback pages for EVERY email/notification deep-link path, so none
    // 404 on Android (email clients open links in an in-app browser that bypasses App
    // Links). Each page's intent:// opens the correct app (business vs customer),
    // store fallback if not installed. Published as directories with index.html so
    // Apache serves them with no rewrite; the page JS reads its own path+query.
    const openerPaths = [
      ['LoginScreen', 'business'],          // employee invite "Accept invite"
      ['BookingDetailScreen', 'business'],  // salon booking email "Booking Detail"
      ['bookingDetails', 'business'],       // legacy/alt booking path
      ['BusinessSplash', 'business'],       // business reminders
      ['appointmentDetail', 'customer'],    // customer booking email
      ['SplashScreen', 'customer'],         // customer generic
    ]
    for (const [p, app] of openerPaths) {
      const dir = path.join(root, p)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, 'index.html'), renderAppOpenPage(APP_OPEN[app]))
      console.log(`[apexDeepLinks] published /${p} app-open page (${app}) to ${dir}`)
    }

    // Paths that carry the id in the URL path (/shop-detail/123, the in-app Client
    // QR) need every sub-path to serve the same opener page, else Apache 404s for
    // anyone without the app. The page JS forwards its own full path to the app.
    const idOpenerPaths = [
      ['shop-detail', 'customer'],
      ['salon-detail', 'customer'],
      ['team-member', 'customer'],
    ]
    for (const [p, app] of idOpenerPaths) {
      const dir = path.join(root, p)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, 'index.html'), renderAppOpenPage(APP_OPEN[app]))
      fs.writeFileSync(path.join(dir, '.htaccess'), ID_OPENER_HTACCESS)
      console.log(`[apexDeepLinks] published /${p}/* app-open page (${app}) to ${dir}`)
    }

    // Customer app download page, served at https://trimworldwide.com/get-customer-app
    // (clean apex host — same URL the in-app Customer QR encodes). Twin of the
    // business page above.
    const custDir = path.join(root, 'get-customer-app')
    fs.mkdirSync(custDir, { recursive: true })
    fs.writeFileSync(path.join(custDir, 'index.html'), renderCustomerDownloadHtml())
    console.log(`[apexDeepLinks] published customer download page to ${custDir}`)

    // QR PNG used as the customer page's og:image, so a shared link renders a
    // preview card (QR + caption) in Instagram/Facebook/WhatsApp messaging.
    // Encodes the same URL the page lives at, so the card's QR is scannable.
    const QRCode = require('qrcode')
    QRCode.toFile(
      path.join(custDir, 'qr.png'),
      'https://trimworldwide.com/get-customer-app',
      { width: 1080, margin: 4, errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#FFFFFF' } },
    )
      .then(() => console.log('[apexDeepLinks] wrote customer QR png'))
      .catch((e) => console.error('[apexDeepLinks] QR png failed:', e.message))

    // Mirror the customer download page onto the separate .co.uk site at
    // /get-app, so the shared link's card shows the trimworldwide.co.uk domain
    // and still forwards to the correct app store. Same OG card + redirect JS.
    try {
      const coukRoot = COUK_CANDIDATES.find(isDir)
      if (!coukRoot) {
        console.log(
          `[apexDeepLinks] .co.uk docroot not found; skipping /get-app mirror (candidates: ${COUK_CANDIDATES.join(
            ', ',
          )})`,
        )
      } else {
        const getAppDir = path.join(coukRoot, 'get-app')
        fs.mkdirSync(getAppDir, { recursive: true })
        fs.writeFileSync(
          path.join(getAppDir, 'index.html'),
          renderCustomerDownloadHtml(COUK_BASE_URL),
        )
        console.log(
          `[apexDeepLinks] published .co.uk customer page to ${getAppDir} (base ${COUK_BASE_URL})`,
        )
        QRCode.toFile(
          path.join(getAppDir, 'qr.png'),
          COUK_BASE_URL,
          { width: 1080, margin: 4, errorCorrectionLevel: 'H',
            color: { dark: '#000000', light: '#FFFFFF' } },
        )
          .then(() => console.log('[apexDeepLinks] wrote .co.uk customer QR png'))
          .catch((e) =>
            console.error('[apexDeepLinks] .co.uk QR png failed:', e.message),
          )
      }
    } catch (e) {
      console.error('[apexDeepLinks] .co.uk mirror failed:', e.message)
    }

    // Clean up any previously-written proxy block (reverted — see note above).
    removeRootHtaccessBlock(root)
    console.log('[apexDeepLinks] ensured no deep-link proxy block in apex .htaccess')
  } catch (err) {
    console.error('[apexDeepLinks] failed to publish:', err.message)
  }
}

module.exports = { publishApexDeepLinkFiles }
