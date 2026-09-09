// Landing page for the Trim (customer) app download QR, served at
// https://trimworldwide.com/get-customer-app. Twin of the business page.
//
// Derived from helper/businessDownloadPage.js by token replacement so the layout
// and the inlined Trim logo stay byte-identical to the business page — only the
// app name, tagline, store links and app id differ (customer app:
// iOS 6742999519 / Android com.sigitechnologies.trim_user).

const { renderBusinessDownloadHtml } = require('./businessDownloadPage')

// og:image (QR) + rich description so a shared LINK renders a preview card
// (QR + caption) in Instagram/Facebook/WhatsApp messaging — image-file shares
// can't carry a caption in Meta apps, but link previews can.
const OG_IMAGE = 'https://trimworldwide.com/get-customer-app/qr.png'
// Full description shown in the preview card (WhatsApp/Facebook show it in full;
// Instagram shows a one-line card). The app shares only the link, so this text
// is never duplicated in the message body. Names the website for the reader;
// tapping the card opens this page which forwards to the app store.
const OG_DESC =
  'Book anytime, anywhere — book barbers across the UK with the free Trim app ' +
  'for iOS & Android. Trim Business: diary, staff, payments & reports for barber ' +
  'shops. www.trimworldwide.co.uk'

// Order matters: replace the longest/most-specific strings first so shorter
// substrings (e.g. "Download the Trim Business app") don't clobber them.
function renderCustomerDownloadHtml() {
  return renderBusinessDownloadHtml()
    .split('<meta property="og:title" content="Trim for Business" />')
    .join('<meta property="og:title" content="Trim — book barbers near you" />')
    .split('<meta property="og:description" content="Manage your shop, bookings and team." />')
    .join(
      '<meta property="og:description" content="' + OG_DESC + '" />\n' +
      '  <meta property="og:image" content="' + OG_IMAGE + '" />\n' +
      '  <meta property="og:image:width" content="1080" />\n' +
      '  <meta property="og:image:height" content="1080" />\n' +
      '  <meta property="og:url" content="https://trimworldwide.com/get-customer-app" />\n' +
      '  <meta property="og:type" content="website" />\n' +
      '  <meta name="twitter:card" content="summary_large_image" />\n' +
      '  <meta name="twitter:image" content="' + OG_IMAGE + '" />',
    )
    .split('Download the Trim Business app to manage your shop, bookings and team.')
    .join('Download the Trim app to find and book barbers and salons near you.')
    .split('Manage your shop, bookings and team.')
    .join('Find & book barbers near you.')
    .split('Download the Trim Business app')
    .join('Download the Trim app')
    .split('Trim for Business')
    .join('Trim')
    .split('Barber shop management app')
    .join('Find & book barbers near you')
    .split('6742323827')
    .join('6742999519')
    .split('com.sigitechnologies.trim_saloon')
    .join('com.sigitechnologies.trim_user')
}

module.exports = { renderCustomerDownloadHtml }
