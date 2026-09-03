// Landing page for the Trim (customer) app download QR, served at
// https://trimworldwide.com/get-customer-app. Twin of the business page.
//
// Derived from helper/businessDownloadPage.js by token replacement so the layout
// and the inlined Trim logo stay byte-identical to the business page — only the
// app name, tagline, store links and app id differ (customer app:
// iOS 6742999519 / Android com.sigitechnologies.trim_user).

const { renderBusinessDownloadHtml } = require('./businessDownloadPage')

// Order matters: replace the longest/most-specific strings first so shorter
// substrings (e.g. "Download the Trim Business app") don't clobber them.
function renderCustomerDownloadHtml() {
  return renderBusinessDownloadHtml()
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
