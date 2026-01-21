const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

const { transporter } = require('./transpoter')
const { footer } = require('./footer')

module.exports = function (data) {
  const salonName = data.salonName || 'Your Salon'
  const ownerName = `${data.firstName} ${data.lastName}`
  const disabledReason = data.disabledReason || 'Account restrictions'
  const capabilityStatus = data.capabilityStatus || 'inactive'

  const subject = 'Payouts Temporarily Paused'

  transporter.sendMail(
    {
      from: process.env.EMAIL_USERNAME, // sender address
      to: ['sigidevelopers@gmail.com', 'charlesblake520@hotmail.co.uk'], // list of receivers
      subject: subject, // Subject line
      html: `<!DOCTYPE html>
<html
  lang="en"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:v="urn:schemas-microsoft-com:vml"
>
  <head>
    <title></title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Chivo:ital,wght@0,100..900;1,100..900&display=swap"
      rel="stylesheet"
    />
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 0;
        font-family: 'Chivo', Arial, sans-serif;
      }

      a[x-apple-data-detectors] {
        color: inherit !important;
        text-decoration: inherit !important;
      }

      #MessageViewBody a {
        color: inherit;
        text-decoration: none;
      }

      p {
        line-height: inherit;
      }

      .desktop_hide,
      .desktop_hide table {
        mso-hide: all;
        display: none;
        max-height: 0px;
        overflow: hidden;
      }

      .image_block img + div {
        display: none;
      }

      @media (max-width: 520px) {
        .desktop_hide table.icons-inner,
        .social_block.desktop_hide .social-table {
          display: inline-block !important;
        }

        .icons-inner {
          text-align: center;
        }

        .icons-inner td {
          margin: 0 auto;
        }

        .mobile_hide {
          display: none;
        }

        .row-content {
          width: 100% !important;
        }

        .stack .column {
          width: 100%;
          display: block;
        }

        .mobile_hide {
          min-height: 0;
          max-height: 0;
          max-width: 0;
          overflow: hidden;
          font-size: 0px;
        }

        .desktop_hide,
        .desktop_hide table {
          display: table !important;
          max-height: none !important;
        }
      }
    </style>
  </head>
  <body
    style="
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: none;
      text-size-adjust: none;
    "
  >
    <table
      border="0"
      cellpadding="0"
      cellspacing="0"
      class="nl-container"
      role="presentation"
      style="background-color: #f5f5f5; width: 100%"
      width="100%"
    >
      <tbody>
        <tr>
          <td>
            <table
              align="center"
              border="0"
              cellpadding="0"
              cellspacing="0"
              class="row row-1"
              role="presentation"
              width="100%"
            >
              <tbody>
                <tr>
                  <td>
                    <table
                      align="center"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      class="row-content stack"
                      role="presentation"
                      style="
                        background-color: #fff;
                        color: #000;
                        width: 600px;
                        margin: 20px auto;
                        border-radius: 0;
                      "
                      width="600"
                    >
                      <tbody>
                        <tr>
                          <td
                            class="column column-1"
                            style="
                              font-weight: 400;
                              text-align: left;
                              padding: 30px 30px 30px 30px;
                              vertical-align: top;
                            "
                            width="100%"
                          >
                            <!-- Header -->
                            <table
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              width="100%"
                            >
                              <tr>
                                <td style="padding-bottom: 20px;">
                                  <h1
                                    style="
                                      margin: 0;
                                      color: #d32f2f;
                                      font-family: 'Chivo', Arial, sans-serif;
                                      font-size: 26px;
                                      font-weight: 700;
                                      line-height: 1.3;
                                    "
                                  >
                                    <span style="font-size: 32px;">⚠️</span> Payouts Temporarily Paused
                                  </h1>
                                </td>
                              </tr>
                            </table>

                            <!-- Content -->
                            <table
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="word-break: break-word"
                              width="100%"
                            >
                              <tr>
                                <td>
                                  <div
                                    style="
                                      color: #333;
                                      font-family: 'Chivo', Arial, sans-serif;
                                      font-size: 14px;
                                      font-weight: 400;
                                      line-height: 1.6;
                                      text-align: left;
                                    "
                                  >
                                    <p style="margin: 0 0 16px 0;">Dear ${ownerName},</p>
                                    
                                    <p style="margin: 0 0 16px 0;">
                                      <strong>Important Notice:</strong> We have detected that payouts for <strong>${salonName}</strong> have been temporarily <strong>paused by Stripe</strong>
                                    </p>
                                    
                                    <p style="margin: 0 0 8px 0;"><strong>Stripe may have paused this due to:</strong></p>
                                    <ul style="margin: 0 0 16px 0; padding-left: 20px;">
                                      <li style="margin-bottom: 4px;">Missing or incomplete account information, or</li>
                                      <li style="margin-bottom: 4px;">Verification requirements that need to be completed</li>
                                    </ul>
                                    
                                    <p style="margin: 0 0 8px 0;"><strong>What you need to do:</strong></p>
                                    <ol style="margin: 0 0 16px 0; padding-left: 20px;">
                                      <li style="margin-bottom: 4px;">Log in to your Stripe Dashboard</li>
                                      <li style="margin-bottom: 4px;">Check for any pending requirements or notifications</li>
                                      <li style="margin-bottom: 4px;">Complete any missing information or verification steps</li>
                                      <li style="margin-bottom: 4px;">Contact Stripe support if you need assistance</li>
                                    </ol>
                                    
                                    <p style="margin: 0 0 16px 0;">If you have any further questions, the Stripe team will be able to support.</p>
                                    
                                    <p style="margin: 0 0 16px 0;">Once you've resolved the issues, payouts will be automatically resumed.</p>
                                    
                                    <p style="margin: 0 0 4px 0;">Many thanks,</p>
                                    <p style="margin: 0 0 20px 0;">The team @Trim</p>
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
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`,
    },
  )
}


