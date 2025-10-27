const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

const { attachments } = require('./attactments')
const attachment = attachments()
const { transporter } = require('./transpoter')
const { footer } = require('./footer')

module.exports = function (data) {
  console.log('🚀 ~ IncompleteRegistrationReminder ~ data:', data)
  
  let subject = `Complete Your Salon Setup - ${data.firstName}`
  let heading = `Hi ${data.firstName} ${data.lastName}`
  let description = `We noticed you haven't completed your salon setup yet. Here's what's missing:`
  
  // Create a list of missing steps
  let missingSteps = []
  if (!data.profileCompletion.hasBusinessDetails) missingSteps.push('Business Details')
  if (!data.profileCompletion.hasBusinessAddress) missingSteps.push('Business Address')
  if (!data.profileCompletion.hasServiceList) missingSteps.push('Service List')
  if (!data.profileCompletion.hasWorkingHours) missingSteps.push('Working Hours')
  if (!data.profileCompletion.hasTeamMembers) missingSteps.push('Team Members')
  if (!data.profileCompletion.hasSubscription) missingSteps.push('Subscription Approval')
  if (!data.profileCompletion.accountConnected) missingSteps.push('Payment Account Setup')

  let stepsList = missingSteps.map(step => `<li style="margin: 8px 0; color: #666;">${step}</li>`).join('')
  
  let callToAction = `Complete your setup now to start accepting bookings and growing your business!`
  let footerText = `Need help? Contact our support team - we're here to help you succeed.`

  transporter.sendMail(
    {
      from: process.env.EMAIL_USERNAME, // sender address
      to: [data.email], // recipient email
      subject: subject, // Subject line
      attachments: attachment.footer.concat(attachment.trim),
      html: `
<!DOCTYPE html>
<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
  <head>
    <title></title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Chivo:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; }
      a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
      #MessageViewBody a { color: inherit; text-decoration: none; }
      p { line-height: inherit; }
      .desktop_hide, .desktop_hide table { mso-hide: all; display: none; max-height: 0px; overflow: hidden; }
      .image_block img + div { display: none; }
      @media (max-width: 520px) {
        .desktop_hide table.icons-inner, .social_block.desktop_hide .social-table { display: inline-block !important; }
        .icons-inner { text-align: center; }
        .icons-inner td { margin: 0 auto; }
        .mobile_hide { display: none; }
        .row-content { width: 100% !important; }
        .stack .column { width: 100%; display: block; }
        .mobile_hide { min-height: 0; max-height: 0; max-width: 0; overflow: hidden; font-size: 0px; }
        .desktop_hide, .desktop_hide table { display: table !important; max-height: none !important; }
      }
    </style>
  </head>
  <body style="background-color: #fff; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
    
    <!-- Header with Logo -->
    <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" background-color="#fff;" width="100%">
      <tbody>
        <tr>
          <td>
            <table cellpadding="0" cellspacing="0" class="row row-1" role="presentation" width="100%">
              <tbody>
                <tr>
                  <td>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="color: #000; width: 500px; margin: 0 auto" width="500">
                      <tbody>
                        <tr>
                          <td class="column column-1" style="font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                            <table cellpadding="5" cellspacing="0" class="image_block block-1" role="presentation" width="100%">
                              <tr>
                                <td class="pad">
                                  <div align="center" class="alignment" style="line-height: 10px">
                                    <img src="cid:trim" style="display: block; height: auto; border: 0; max-width: 120px; width: 100%;" width="100" />
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Main Heading -->
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-5" role="presentation" width="100%">
      <tbody>
        <tr>
          <td>
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="border-radius: 0; color: #000; width: 500px; margin: 0 auto;" width="500">
              <tbody>
                <tr>
                  <td class="column column-1" style="font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                    <table border="0" cellpadding="0" cellspacing="0" class="heading_block block-3" role="presentation" width="100%">
                      <tr>
                        <td class="pad" style="text-align: center; width: 100%">
                          <h1 style="margin: 0; color: #12466f; direction: ltr; font-family: Chivo, sans-serif; font-size: 30px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0;">
                            Complete Your Setup
                          </h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Greeting -->
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-6" role="presentation" width="100%">
      <tbody>
        <tr>
          <td>
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="border-radius: 0; color: #000; width: 500px; margin: 0 auto;" width="500">
              <tbody>
                <tr>
                  <td class="column column-1" style="font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                    <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-1" role="presentation" style="word-break: break-word" width="100%">
                      <tr>
                        <td class="pad">
                          <div style="color: #292929; direction: ltr; font-family: Chivo, sans-serif; font-size: 24px; font-weight: 700; letter-spacing: 0px; text-align: left;">
                            <p style="margin: 0">${heading}</p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Description -->
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-6" role="presentation" width="100%">
      <tbody>
        <tr>
          <td>
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="border-radius: 0; color: #000; width: 500px; margin: 0 auto;" width="500">
              <tbody>
                <tr>
                  <td class="column column-1" style="font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                    <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-2" role="presentation" style="word-break: break-word" width="100%">
                      <tr>
                        <td>
                          <div style="color: #000000cc; direction: ltr; font-family: Chivo, sans-serif; font-size: 16px; font-weight: 400; letter-spacing: 0px; text-align: left;">
                            <p style="margin: 0">${description}</p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Missing Steps List -->
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-6" role="presentation" width="100%">
      <tbody>
        <tr>
          <td>
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="border-radius: 0; color: #000; width: 500px; margin: 0 auto;" width="500">
              <tbody>
                <tr>
                  <td class="column column-1" style="font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                    <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-3" role="presentation" style="word-break: break-word" width="100%">
                      <tr>
                        <td>
                          <div style="color: #000000cc; direction: ltr; font-family: Chivo, sans-serif; font-size: 16px; font-weight: 400; letter-spacing: 0px; text-align: left;">
                            <ul style="margin: 0; padding-left: 20px;">
                              ${stepsList}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Call to Action -->
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-6" role="presentation" width="100%">
      <tbody>
        <tr>
          <td>
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="border-radius: 0; color: #000; width: 500px; margin: 0 auto;" width="500">
              <tbody>
                <tr>
                  <td class="column column-1" style="font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                    <div class="spacer_block block-1" style="height: 20px; line-height: 30px; font-size: 1px;"> </div>
                    <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-1" role="presentation" style="word-break: break-word" width="100%">
                      <tr>
                        <td>
                          <div style="color: #000000cc; direction: ltr; font-family: Chivo, sans-serif; font-size: 20px; font-weight: 500; letter-spacing: 0px; text-align: left;">
                            <p style="margin: 0">${callToAction}</p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Footer Text -->
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-6" role="presentation" width="100%">
      <tbody>
        <tr>
          <td>
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="border-radius: 0; color: #000; width: 500px; margin: 0 auto;" width="500">
              <tbody>
                <tr>
                  <td class="column column-1" style="font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                    <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-2" role="presentation" style="word-break: break-word" width="100%">
                      <tr>
                        <td>
                          <div style="color: #666666; direction: ltr; font-family: Chivo, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: 0px; text-align: left;">
                            <p style="margin: 0">${footerText}</p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    ${footer}
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
    },
  )
}
