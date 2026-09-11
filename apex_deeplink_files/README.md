# Make deep links work on the branded apex `https://trimworldwide.com`

Share links are `https://trimworldwide.com/salon-detail/:id` (same in dev, staging
and production). For a phone to open the app from that URL, the **apex host**
`trimworldwide.com` must serve two verification files and the fallback pages.
Today the apex (a separate Apache site) 404s them — that is the "Not Found".

> The link host does NOT decide which backend loads data. When the app opens, it
> always fetches from its own configured backend (dev→stage, prod→backend). So a
> single apex domain is correct for every environment.

Pick ONE of the two options below.

---

## Option A — Reverse-proxy the apex to the backend (recommended, DRY)

Drop the provided **`.htaccess`** into the document root of the `trimworldwide.com`
Apache vhost. It proxies only the deep-link paths to the Trim backend; the rest of
the marketing site is untouched. (mod_rewrite + mod_proxy are already in use for
the backend subdomains.)

1. Copy `.htaccess` to the apex docroot.
2. In it, choose the backend to proxy to:
   - Testing now → `https://stage.trimworldwide.com` (already set)
   - Production   → change the 5 lines to `https://backend.trimworldwide.com`
3. On that backend, set env `DEEPLINK_PUBLIC_ORIGIN=https://trimworldwide.com`
   so the landing pages render apex URLs (og:url, Open-in-app, iOS app-argument).
4. Ensure that backend's `assetlinks.json` lists every signing fingerprint that
   must verify (see "Fingerprints" below) via env `DEEPLINK_ANDROID_SHA256`.

Verify:
```
curl -s -o /dev/null -w "%{http_code}\n" https://trimworldwide.com/.well-known/assetlinks.json   # 200
curl -s https://trimworldwide.com/salon-detail/101 | grep og:url                                  # apex URL
```

---

## Option B — Serve static files on the apex (no proxy)

If mod_proxy isn't desired, serve the files directly from the apex docroot:

1. Copy `.well-known/assetlinks.json` and `.well-known/apple-app-site-association`
   into `trimworldwide.com/.well-known/` (served as `application/json`, HTTP 200,
   no redirects).
2. Add a rewrite so `/salon-detail/*`, `/team-member/*`, `/appointmentDetail*`
   return a landing page (a simple static HTML with Open-in-app + store links) so
   non-app visitors don't 404. (Salon name/photo previews need Option A.)

The static `assetlinks.json` / AASA here contain only the **debug** fingerprint —
enough to test dev; add the production fingerprints before release.

---

## Fingerprints (required before production upload)

`assetlinks.json` must list the SHA-256 of every cert that signs a shipped build,
or the store build's links won't verify and will open the browser instead:

- **Debug** (already included): `0C:DD:31:…:29` — for `flutter run` testing.
- **Release keystore**: `keytool -list -v -keystore <release.jks> -alias <alias> | grep SHA256`
- **Google Play App Signing**: Play Console → App integrity → App signing →
  SHA-256 certificate fingerprint (Play re-signs, so this is what users get).

With Option A, add these on the backend via `DEEPLINK_ANDROID_SHA256` (comma-
separated). With Option B, add them to the static `assetlinks.json`.

## iOS
The App ID `69JDF2R4M8.com.sigitechnologies.trimios` must have the **Associated
Domains** capability enabled in its provisioning profile; the entitlement already
lists `applinks:trimworldwide.com` and `applinks:www.trimworldwide.com`.

## Test end-to-end (after deploying)
```
adb shell am start -a android.intent.action.VIEW -d "https://trimworldwide.com/salon-detail/101"
# opens the app on the salon screen (installed) or the landing page (not installed) — never a 404
adb shell pm get-app-links com.sigitechnologies.trim_user   # trimworldwide.com: verified
```
