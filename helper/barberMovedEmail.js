// "Your barber has moved" email for customers with upcoming bookings after a
// chair renter moves shop (sent from helper/renterMove.js).
const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

const { attachments } = require('./attactments')
const { transporter } = require('./transpoter')
const { footer } = require('./footer')

const escape = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

/**
 * data: { email, firstName, barberName, fromShopName, shopName, address, mapsUrl,
 *         bookingDates: ['Mon 2 Nov, 10:00'], freeCancelUntil: '9 Nov 2026' }
 * No shopName: the barber left with no new shop yet.
 */
module.exports = function barberMovedEmail(data) {
  const left = !data.shopName
  const subject = left
    ? `${data.barberName} has left ${data.fromShopName || 'their shop'}`
    : `${data.barberName} has moved to ${data.shopName}`
  const dates = (data.bookingDates || [])
    .map((d) => `<li style="margin:0 0 4px;">${escape(d)}</li>`)
    .join('')

  const html = `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family:Chivo,Arial,sans-serif;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;">
      <tr><td style="padding:25px 30px;color:#000000;font-size:16px;line-height:1.5;">
        <h2 style="font-size:18px;color:#1E293B;margin:0 0 15px;">Hi ${escape(data.firstName)},</h2>
        ${left
          ? `<p style="margin:0 0 16px;">${escape(data.barberName)} has left ${escape(data.fromShopName || 'their shop')} and hasn't joined a new shop yet. Please don't go to the old shop for your booking. We'll email you the new address as soon as they join a shop, or you can cancel.</p>`
          : `<p style="margin:0 0 16px;">${escape(data.barberName)} has moved to a new shop. Your booking is still on, at the new address:</p>
        <p style="margin:0 0 6px;font-weight:bold;">${escape(data.shopName)}</p>
        <p style="margin:0 0 16px;">${escape(data.address)}</p>`}
        ${!left && data.mapsUrl ? `<p style="margin:0 0 20px;"><a href="${escape(data.mapsUrl)}" style="display:inline-block;background:#000000;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;">Open in Maps</a></p>` : ''}
        ${dates ? `<p style="margin:0 0 6px;">Your upcoming booking${(data.bookingDates || []).length > 1 ? 's' : ''}:</p><ul style="margin:0 0 16px;padding-left:20px;">${dates}</ul>` : ''}
        <p style="margin:0 0 16px;">${left ? 'You can' : "If the new place doesn't suit you, you can"} cancel free of charge in the Trim app${data.freeCancelUntil ? ` until ${escape(data.freeCancelUntil)}` : ''}.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
${footer}`

  transporter.sendMail(
    {
      from: process.env.EMAIL_USERNAME,
      to: [data.email],
      subject,
      attachments: (attachments().footer || []).filter(Boolean),
      html,
    },
    (error) => {
      if (error) console.error('[barberMovedEmail] send failed:', error.message)
    },
  )
}
