/**
 * ClientInviteEmail — "we're now on Trim" announcement sent to a salon's imported
 * clients who are NOT already registered Trim users.
 *
 * Unlike the older fire-and-forget helpers, this RETURNS A PROMISE (nodemailer
 * promise mode, no callback) so callers can throttle real delivery with p-limit /
 * Promise.allSettled.
 *
 * NOTE: subject/body copy is placeholder-professional — finalize wording before prod.
 */
const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

const { attachments } = require('./attactments')
const attachment = attachments()
const { transporter } = require('./transpoter')
const { footer } = require('./footer')

module.exports = function ClientInviteEmail({ email, firstName, salonName }) {
  const name = firstName && firstName !== 'Walkin' ? firstName : 'there'
  const shop = salonName || 'Your salon'

  const subject = `${shop} is now on Trim`
  const greetings = `Hi ${name},`
  const content = `Great news — ${shop} is now on <strong>Trim</strong>! `
    + `You can now book your appointments, view your history and manage your visits with us right from the Trim app. `
    + `Download Trim and search for ${shop} to book your next appointment. We can't wait to see you.`

  return transporter.sendMail({
    from: process.env.EMAIL_USERNAME,
    to: [`${email}`],
    bcc: 'sigidevelopers@gmail.com',
    subject,
    attachments: attachment.footer.concat(attachment.trim),
    html: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <link
      href="https://fonts.googleapis.com/css2?family=Chivo:ital,wght@0,100..900;1,100..900&display=swap"
      rel="stylesheet"
    />
  </head>
  <body style="background-color:#fff;margin:0;padding:0;-webkit-text-size-adjust:none;text-size-adjust:none;">
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:#fff;">
      <tbody>
        <tr>
          <td>
            <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" width="500" style="width:500px;margin:0 auto;color:#000;">
              <tbody>
                <tr>
                  <td style="text-align:center;padding:16px 0;">
                    <img src="cid:trim" width="100" style="display:inline-block;height:auto;border:0;max-width:120px;width:100%;" />
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;">
                    <h1 style="margin:0;color:#12466f;font-family:Chivo,sans-serif;font-size:30px;font-weight:700;line-height:120%;">
                      You're now on Trim!
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 10px 0;">
                    <div style="color:#292929;font-family:Chivo,sans-serif;font-size:22px;font-weight:700;text-align:left;">
                      <p style="margin:0">${greetings}</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px;">
                    <div style="color:#000000cc;font-family:Chivo,sans-serif;font-size:16px;font-weight:400;text-align:left;line-height:150%;">
                      <p style="margin:0">${content}</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            ${footer}
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`,
  })
}
