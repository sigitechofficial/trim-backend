const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

const { attachments } = require('./attactments')
const attachment = attachments()
const { transporter } = require('./transpoter')
const { footer } = require('./footer')

module.exports = function (data) {
  console.log('🚀 Sending the Incomplete Registration Reminder Email')
  console.log('🚀 ~ IncompleteRegistrationReminder ~ data:', data)

  const subject = `⚠️ Complete Your Salon Setup - ${data.firstName}`

  // Progress numbers
  const totalSteps = 7
  const completedSteps = Object.values(data.profileCompletion).filter(Boolean).length
  const completionPercentage = Math.round((completedSteps / totalSteps) * 100)
  const footerText = `Need help? Contact our support team - we're here to help you succeed.`

  // Steps (order preserved)
  const allSteps = [
    { key: 'hasBusinessDetails',   name: 'Business Details' },
    { key: 'hasBusinessAddress',   name: 'Business Address' },
    { key: 'hasServiceList',       name: 'Service List' },
    { key: 'hasWorkingHours',      name: 'Working Hours' },
    { key: 'hasTeamMembers',       name: 'Team Members' },
    { key: 'hasSubscription',      name: 'Subscription Approval' },
    { key: 'accountConnected',     name: 'Payment Account Setup' }
  ]

  // Build rows with locked alignment + dark-mode safe backgrounds
  const stepsList = allSteps.map(step => {
    const done    = !!data.profileCompletion[step.key]
    const rowBg   = done ? '#F1FBF4' : '#FDEEEE' // light green / light red
    const color   = done ? '#1E8E3E' : '#D93025' // green / red
    const label   = done ? 'Completed' : 'Missing'
    const mark    = done ? '✓' : '✕'              // NOT emoji

    // NOTE:
    //  - width: first col 66%, second col 34%
    //  - bgcolor + background-color to resist dark-mode auto-invert
    //  - iconBox: 18x18, line-height:18px guarantees perfect vertical centering
    const iconBg  = done ? '#A7D8B7' : '#F2A19A'  // subtle filled box
    const iconBor = done ? '#1E8E3E' : '#D93025'

    return `
      <tr bgcolor="${rowBg}" style="background-color:${rowBg};">
        <td width="66%" style="padding:14px 12px; color:#000000; font-size:16px; line-height:1.3; border-bottom:1px solid #000000; vertical-align:middle;">
          ${step.name}
        </td>
        <td width="34%" align="right" style="padding:14px 12px; border-bottom:1px solid #000000; vertical-align:middle;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right" style="border-collapse:collapse;">
            <tr>
              <td width="24" valign="middle" style="width:24px; text-align:right; padding:0;">
                <span style="
                  display:inline-block;
                  width:18px; height:18px; line-height:18px;
                  text-align:center;
                  font-size:13px; font-weight:700;
                  color:${iconBor};
                  background:${iconBg};
                  border:1px solid ${iconBor};
                  border-radius:3px;
                  font-family: Arial, Helvetica, sans-serif;
                ">${mark}</span>
              </td>
              <td valign="middle" style="padding-left:8px; width:100px; font-size:16px; font-weight:700; color:${color}; white-space:nowrap; font-family: Arial, Helvetica, sans-serif;">
                ${label}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
  }).join('')

  const callToAction = 'Complete setup'

  const progressSummaryHtml = `
    <div style="text-align:center; margin:30px 0;">
      <h2 style="margin:0 0 15px 0; color:#000000; font-size:28px; font-weight:700; text-transform:uppercase;">
        ${completionPercentage < 30 ? 'ALMOST THERE!'
          : completionPercentage < 70 ? 'ALMOST THERE!'
          : 'ALMOST THERE!'}
      </h2>
      <p style="margin:0; color:#000000; font-size:16px;">
        You've completed ${completedSteps} of ${totalSteps} steps to setup your account.
        ${completionPercentage < 100 ? 'If you still want to use Trim please see the below list of remaining steps.' : 'Setup complete!'}
      </p>
    </div>
  `

  transporter.sendMail(
    {
      from: process.env.EMAIL_USERNAME,
      to: [data.email],
      subject,
      attachments: attachment.footer.concat(attachment.trim),
      html: `
<!DOCTYPE html>
<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title></title>
  <style>
    * { box-sizing: border-box; }
    body { margin:0; padding:0; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
    #MessageViewBody a { color: inherit; text-decoration: none; }
    p { line-height: inherit; }
    .row-content { width:500px; }
    @media (max-width:520px){
      .row-content { width:100% !important; }
    }
  </style>
</head>
<body bgcolor="#FFFFFF" style="background:#FFFFFF; margin:0; padding:0; -webkit-text-size-adjust:none; text-size-adjust:none;">

  <!-- Outer wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#FFFFFF" style="background:#FFFFFF;">
    <tr>
      <td align="center">

        <!-- Header (centered logo) -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="row-content" width="500" style="margin:0 auto; color:#000;">
          <tr>
            <td align="center" style="padding:20px 0; text-align:center;">
              <img src="cid:trim" alt="Trim" width="120" style="display:block; margin:0 auto; height:auto; border:0; max-width:120px;" />
            </td>
          </tr>
        </table>

        <!-- Progress summary -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="row-content" width="500" style="margin:0 auto; color:#000;">
          <tr>
            <td style="padding:20px;">
              ${progressSummaryHtml}
            </td>
          </tr>
        </table>

        <!-- Steps table -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="row-content" width="500" style="margin:0 auto; color:#000;">
          <tr>
            <td style="padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <thead>
                  <tr>
                    <th width="66%" align="left" style="padding:10px 12px; font:700 13px Arial,Helvetica,sans-serif; text-transform:uppercase; color:#000; border-bottom:1px solid #000000;">Step</th>
                    <th width="34%" align="right" style="padding:10px 12px; font:700 13px Arial,Helvetica,sans-serif; text-transform:uppercase; color:#000; border-bottom:1px solid #000000;padding-right:80px">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${stepsList}
                </tbody>
              </table>
            </td>
          </tr>
        </table>

        <!-- Centered CTA -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="row-content" width="500" style="margin:0 auto;">
          <tr>
            <td align="center" style="padding:30px 0 10px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" style="border:1px solid #000000; background:#000000;">
                    <a href="https://trimworldwide.com/BusinessSplash" style="display:inline-block; padding:12px 24px; text-decoration:none; font-weight:600; font-size:16px; color:#FFFFFF;">${callToAction}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        ${footer}

      </td>
    </tr>
  </table>
</body>
</html>
      `,
    },
    function (error, info) {
      if (error) {
        console.log('❌ Email sending failed:', error)
      } else {
        console.log('✅ Incomplete registration reminder email sent:', info.messageId)
      }
    }
  )
}





