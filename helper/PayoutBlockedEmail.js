const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

const { attachments } = require('./attactments')
const attachment = attachments()
const { transporter } = require('./transpoter')
const { footer } = require('./footer')

module.exports = function (data) {
  const salonName = data.salonName || 'Your Salon'
  const ownerName = `${data.firstName} ${data.lastName}`
  const disabledReason = data.disabledReason || 'Account restrictions'
  const capabilityStatus = data.capabilityStatus || 'inactive'

  const subject = '⚠️ Action Required: Your Payouts Are Temporarily Paused'

  transporter.sendMail(
    {
      from: process.env.EMAIL_USERNAME, // sender address
      to: ['sigidevelopers@gmail.com', 'charlesblake520@hotmail.co.uk'], // list of receivers
      subject: subject, // Subject line
      attachments: attachment.footer.concat(attachment.trim),
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
        font-family: Chivo, sans-serif;
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
      background-color: #fff;
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
      style="background-color: #fff; width: 100%"
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
              class="row row-2"
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
                        border-radius: 0;
                        color: #000;
                        width: 500px;
                        margin: 0 auto;
                      "
                      width="500"
                    >
                      <tbody>
                        <tr>
                          <td
                            class="column column-1"
                            style="
                              font-weight: 400;
                              text-align: left;
                              padding-bottom: 5px;
                              padding-top: 5px;
                              vertical-align: top;
                              border-top: 0px;
                              border-right: 0px;
                              border-bottom: 0px;
                              border-left: 0px;
                            "
                            width="100%"
                          >
                            <div
                              class="spacer_block block-1"
                              style="
                                height: 10px;
                                line-height: 80px;
                                font-size: 1px;
                              "
                            >
                              
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <table
              align="center"
              border="0"
              cellpadding="0"
              cellspacing="0"
              class="row row-5"
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
                        border-radius: 0;
                        color: #000;
                        width: 500px;
                        margin: 0 auto;
                      "
                      width="500"
                    >
                      <tbody>
                        <tr>
                          <td
                            class="column column-1"
                            style="
                              font-weight: 400;
                              text-align: left;
                              padding-bottom: 5px;
                              padding-top: 5px;
                              vertical-align: top;
                              border-top: 0px;
                              border-right: 0px;
                              border-bottom: 0px;
                              border-left: 0px;
                            "
                            width="100%"
                          >
                            <table
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              class="heading_block block-3"
                              role="presentation"
                              width="100%"
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="text-align: center; width: 100%; padding: 20px 0;"
                                >
                                  <div
                                    style="
                                      background-color: #FFC107;
                                      padding: 20px;
                                      border-radius: 8px;
                                      display: inline-block;
                                      width: 100%;
                                    "
                                  >
                                    <h1
                                      style="
                                        margin: 0;
                                        color: #000;
                                        direction: ltr;
                                        font-family: Chivo, sans-serif;
                                        font-size: 24px;
                                        font-weight: 700;
                                        letter-spacing: normal;
                                        text-align: left;
                                        display: flex;
                                        align-items: center;
                                      "
                                    >
                                      <span style="font-size: 32px; margin-right: 10px;">⚠️</span>
                                      Payouts Temporarily Paused
                                    </h1>
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

            <table
              align="center"
              border="0"
              cellpadding="0"
              cellspacing="0"
              class="row row-6"
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
                        border-radius: 0;
                        color: #000;
                        width: 500px;
                        margin: 0 auto;
                      "
                      width="500"
                    >
                      <tbody>
                        <tr>
                          <td
                            class="column column-1"
                            style="
                              font-weight: 400;
                              text-align: left;
                              vertical-align: top;
                              border-top: 0px;
                              border-right: 0px;
                              border-bottom: 0px;
                              border-left: 0px;
                            "
                            width="100%"
                          >
                            <table
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              class="paragraph_block block-1"
                              role="presentation"
                              style="word-break: break-word"
                              width="100%"
                            >
                              <tr>
                                <td class="">
                                  <div
                                    style="
                                      color: #333;
                                      direction: ltr;
                                      font-family: Chivo, sans-serif;
                                      font-size: 15px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 1.6;
                                      text-align: left;
                                    "
                                  >
                                    <p style="margin: 0; margin-bottom: 20px;">Dear ${ownerName},</p>
                                    <p style="margin: 0; margin-bottom: 15px;">
                                      <strong>Important Notice:</strong> We have detected that <strong>payouts</strong> for <strong>${salonName}</strong> have been temporarily <strong>paused by Stripe</strong>.
                                    </p>
                                    <p style="margin: 0; margin-bottom: 10px;"><strong>Stripe may have paused this due to:</strong></p>
                                    <ul style="margin: 0 0 20px 0; padding-left: 25px; line-height: 1.8;">
                                      <li style="margin-bottom: 5px;">Missing or incomplete account information; or</li>
                                      <li style="margin-bottom: 5px;">Verification requirements that need to be completed</li>
                                    </ul>
                                    <p style="margin: 0; margin-bottom: 10px;"><strong>What you need to do:</strong></p>
                                    <ol style="margin: 0 0 20px 0; padding-left: 25px; line-height: 1.8;">
                                      <li style="margin-bottom: 5px;">Log in to your Stripe Dashboard</li>
                                      <li style="margin-bottom: 5px;">Check for any pending requirements or notifications</li>
                                      <li style="margin-bottom: 5px;">Complete any missing information or verification steps</li>
                                      <li style="margin-bottom: 5px;">Contact Stripe support if you need assistance</li>
                                    </ol>
                                    <p style="margin: 0; margin-bottom: 15px;">If you have any further questions, the Stripe team will be able to support.</p>
                                    <p style="margin: 0; margin-bottom: 15px;">Once you've resolved the issues, <strong>payouts</strong> will be automatically resumed.</p>
                                    <p style="margin: 0; margin-bottom: 5px;">Many thanks,</p>
                                    <p style="margin: 0; margin-bottom: 20px;">The team @Trim</p>
                                    <p style="margin: 0; font-size: 13px; color: #666;">Unsure about how to use Trim, look up our <a href="https://trim.app/faqs" style="color: #007bff; text-decoration: none;">FAQs</a>.</p>
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

