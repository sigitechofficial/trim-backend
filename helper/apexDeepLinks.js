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

// --- App identity (override via env where useful) ---------------------------
const ANDROID_PACKAGE =
  process.env.DEEPLINK_ANDROID_PACKAGE || 'com.sigitechnologies.trim_user'
const IOS_APP_ID_FULL =
  process.env.DEEPLINK_IOS_APPID || '69JDF2R4M8.com.sigitechnologies.trimios'

// SHA-256 signing fingerprints allowed to verify Android App Links. Default =
// debug keystore (for testing). Add release + Google Play App Signing SHA-256
// for production via DEEPLINK_ANDROID_SHA256 (comma-separated).
const DEFAULT_SHA256 =
  '0C:DD:31:87:1F:9D:78:86:90:CA:A2:7F:34:6A:37:AA:61:79:9F:F2:D0:99:1F:54:41:AB:F6:03:73:84:84:29'
const FINGERPRINTS = [
  ...new Set(
    `${DEFAULT_SHA256},${process.env.DEEPLINK_ANDROID_SHA256 || ''}`
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  ),
]

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
)

const HTACCESS =
  '<Files "apple-app-site-association">\n  ForceType application/json\n</Files>\n'

// Candidate apex document roots, most specific first. APEX_DOCROOT can pin it.
const CANDIDATES = [
  process.env.APEX_DOCROOT,
  '/home/trimworldwide/trimworldwide.com',
  '/home/trimworldwide/public_html',
].filter(Boolean)

function isDir(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isDirectory()
  } catch (e) {
    return false
  }
}

// Backend to reverse-proxy the deep-link pages to (so shared links keep their
// rich OG preview). test -> stage, production -> backend.
function backendOrigin() {
  if (process.env.DEEPLINK_PROXY_TARGET) {
    return process.env.DEEPLINK_PROXY_TARGET.replace(/\/+$/, '')
  }
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'https://backend.trimworldwide.com'
    default:
      return 'https://stage.trimworldwide.com'
  }
}

const HT_BEGIN = '# BEGIN trim-deeplinks   (managed by helper/apexDeepLinks.js)'
const HT_END = '# END trim-deeplinks'

// Root .htaccess block that reverse-proxies ONLY the deep-link path prefixes to
// the backend, so the apex serves the OG-rich salon/team/appointment pages.
// Wrapped in IfModule guards so a host without mod_proxy/mod_rewrite ignores it
// instead of returning 500 for the whole site.
function htaccessBlock() {
  const b = backendOrigin()
  return [
    HT_BEGIN,
    '<IfModule mod_proxy.c>',
    '<IfModule mod_rewrite.c>',
    '  RewriteEngine On',
    `  RewriteRule ^salon-detail/(.*)$ ${b}/salon-detail/$1 [P,L]`,
    `  RewriteRule ^team-member/(.*)$ ${b}/team-member/$1 [P,L]`,
    `  RewriteRule ^appointmentDetail(.*)$ ${b}/appointmentDetail$1 [P,L]`,
    '</IfModule>',
    '</IfModule>',
    HT_END,
    '',
  ].join('\n')
}

// Insert or replace ONLY our marked block in the apex root .htaccess; every other
// rule in the file is preserved untouched.
function upsertRootHtaccess(root) {
  const file = path.join(root, '.htaccess')
  const block = htaccessBlock()
  let existing = ''
  try {
    existing = fs.readFileSync(file, 'utf8')
  } catch (e) {
    existing = ''
  }
  const begin = existing.indexOf(HT_BEGIN)
  let next
  if (begin !== -1) {
    const end = existing.indexOf(HT_END, begin)
    if (end !== -1) {
      const tail = existing.slice(end + HT_END.length).replace(/^\n/, '')
      next = existing.slice(0, begin) + block + tail
    } else {
      // marker corrupted (BEGIN without END): drop from BEGIN, re-append clean
      next = existing.slice(0, begin) + block
    }
  } else if (existing.trim()) {
    next = existing.replace(/\n*$/, '\n\n') + block
  } else {
    next = block
  }
  fs.writeFileSync(file, next)
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

    // Also proxy the deep-link pages to the backend so shared links keep their
    // rich preview card (og:title/og:image). Scoped + IfModule-guarded.
    upsertRootHtaccess(root)
    console.log(
      `[apexDeepLinks] ensured deep-link proxy block in ${path.join(
        root,
        '.htaccess',
      )} -> ${backendOrigin()}`,
    )
  } catch (err) {
    console.error('[apexDeepLinks] failed to publish:', err.message)
  }
}

module.exports = { publishApexDeepLinkFiles }
