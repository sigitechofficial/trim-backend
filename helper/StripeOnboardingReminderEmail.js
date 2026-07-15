const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

const { attachments } = require('./attactments')
const attachment = attachments()
const { transporter } = require('./transpoter')
const { footer } = require('./footer')

/**
 * Stripe onboarding reminder email (incomplete / action required).
 * Do not use for actual payout-blocked cases — use PayoutBlockedEmail.
 */
module.exports = function StripeOnboardingReminderEmail(data) {
  const salonName = data.salonName || 'Your Shop'
  const ownerName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'there'
  const intent = data.intent || 'IN_PROGRESS'

  const subjects = {
    IN_PROGRESS: 'Complete your Stripe setup to receive payouts',
    ACTION_REQUIRED: 'Stripe needs more information',
  }

  const titles = {
    IN_PROGRESS: 'Complete your Stripe setup',
    ACTION_REQUIRED: 'Stripe needs more information',
  }

  const bodies = {
    IN_PROGRESS:
      'Your Stripe setup is not complete yet. Please complete it so payouts can be enabled for your shop.',
    ACTION_REQUIRED:
      'Stripe needs additional business or bank details before payouts can continue normally. Please review and resolve the outstanding requirements.',
  }

  const ctaTexts = {
    IN_PROGRESS: 'Continue Stripe Setup',
    ACTION_REQUIRED: 'Resolve Stripe Requirements',
  }

  const subject = subjects[intent] || subjects.IN_PROGRESS
  const emailTitle = titles[intent] || titles.IN_PROGRESS
  const description = bodies[intent] || bodies.IN_PROGRESS
  const callToAction = ctaTexts[intent] || ctaTexts.IN_PROGRESS

  transporter.sendMail(
    {
      from: process.env.EMAIL_USERNAME,
      to: [data.email],
      bcc: 'sigidevelopers@gmail.com',
      subject,
      attachments: attachment.footer,
      html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="500" cellpadding="0" cellspacing="0" border="0" style="max-width:500px;width:100%;">
            <tr>
              <td style="padding:12px 0;font-size:22px;font-weight:700;color:#000000;">
                Hi ${ownerName},
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:18px;font-weight:600;color:#000000;">
                ${emailTitle}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0 16px;font-size:16px;line-height:1.5;color:#222222;">
                ${description}
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 16px;font-size:15px;line-height:1.5;color:#444444;">
                Shop: <strong>${salonName}</strong>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 0;">
                <a href="https://trimworldwide.com/BusinessSplash"
                   style="display:inline-block;padding:12px 24px;background:#000000;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:16px;border:1px solid #000000;">
                  ${callToAction}
                </a>
              </td>
            </tr>
            ${footer}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    },
    function (error, info) {
      if (error) {
        console.log('❌ StripeOnboardingReminderEmail Error:', error)
      } else {
        console.log('✅ StripeOnboardingReminderEmail sent:', info.response)
      }
    },
  )
}
