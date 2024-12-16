const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

const { attachments } = require('./attactments')
const attachment = attachments()
const { transporter } = require('./transpoter')
const { footer } = require('./footer')

module.exports = function (OTP, data, type) {
  let preOtpText = `We found a request for forgot password.
  Its okay! its happens. Use this OTP for
  reset your password.`
  let postOtpText = `If you didn’t request this, please ignore this email. your password won’t change until you access the link above and create a new one.`

  if (type && type == 'verification') {
    preOtpText = `We found a request account verification.
       Use this OTP for
      to verify your account.`

    postOtpText = `If you didn’t request this, please ignore this email.`
  }

  const name = `${data.firstName} ${data.lastName}`
  const to = [data.email, 'sigidevelopers@gmail.com']
  console.log(
    '🚀 ~ sigidevelopers:',
    attachment.footer.concat(attachment.security),
  )
  const otp = `${OTP}`
  transporter.sendMail(
    {
      from: process.env.EMAIL_USERNAME, // sender address
      to: to, // list of receivers
      subject: `Reset Password Otp.`, // Subject line
      attachments: attachment.footer.concat(attachment.security),
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
            background-color:
            #fff;
            width="100%"
          >
            <tbody>
              <tr>
                <td>
                  <table
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
                            style="color: #000; width: 500px; margin: 0 auto"
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
                                    cellpadding="5"
                                    cellspacing="0"
                                    class="image_block block-1"
                                    role="presentation"
                                    width="100%"
                                  >
                                    <tr>
                                      <td class="pad">
                                        <div
                                          align="center"
                                          class="alignment"
                                          style="line-height: 10px"
                                        >
                                          <img
                                            src="cid:forgotPassword"
                                            style="
                                              display: block;
                                              height: auto;
                                              border: 0;
                                              max-width: 120px;
                                              width: 100%;
                                            "
                                            width="100"
                                          />
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
                                        style="text-align: center; width: 100%"
                                      >
                                        <h1
                                          style="
                                            margin: 0;
                                            color: #000;
                                            direction: ltr;
                                            font-family: Chivo, sans-serif;
                                            font-size: 30px;
                                            font-weight: 700;
                                            letter-spacing: normal;
                                            line-height: 120%;
                                            text-align: center;
                                            margin-top: 0;
                                            margin-bottom: 0;
                                          "
                                        >
                                          Reset password
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
                                    cellpadding="10"
                                    cellspacing="0"
                                    class="paragraph_block block-1"
                                    role="presentation"
                                    style="word-break: break-word"
                                    width="100%"
                                  >
                                    <tr>
                                      <td class="pad">
                                        <div
                                          style="
                                            color: #292929;
                                            direction: ltr;
                                            font-family: Chivo, sans-serif;
                                            font-size: 24px;
                                            font-weight: 700;
                                            letter-spacing: 0px;
                                            text-align: left;
                                          "
                                        >
                                          <p style="margin: 0">Hello ${name}!</p>
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
                                    cellpadding="10"
                                    cellspacing="0"
                                    class="paragraph_block block-2"
                                    role="presentation"
                                    style="word-break: break-word"
                                    width="100%"
                                  >
                                    <tr>
                                      <td>
                                        <div
                                          style="
                                            color: #000000cc;
                                            direction: ltr;
                                            font-family: Chivo, sans-serif;
                                            font-size: 16px;
                                            font-weight: 400;
                                            letter-spacing: 0px;
                                            text-align: left;
                                          "
                                        >
                                          <p style="margin: 0">
                                            ${preOtpText}
                                          </p>
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
                    border="0"
                    cellpadding="10"
                    cellspacing="0"
                    class="social_block block-3"
                    role="presentation"
                    width="100%"
                  >
                    <tr>
                      <td class="pad">
                        <div align="center" class="alignment">
                          <table
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            class="social-table"
                            role="presentation"
                            style="
                              display: inline-block;
                            "
                            width="180px"
                            margin="auto"
                          >
                            <tr>
                              <td style="padding: 0 2px 0 2px">
                                <div
                                  style="
                                    background-color: #124769;
                                    padding: 16px;
                                    color: #fff;
                                    border-radius: 8px;
                                    font-size: 20px;
                                  "
                                >
                                  ${otp[0]}
                                </div>
                              </td>
                              <td style="padding: 0 2px 0 2px">
                                <div
                                  style="
                                    background-color: #124769;
                                    padding: 16px;
                                    color: #fff;
                                    border-radius: 8px;
                                    font-size: 20px;
                                  "
                                >
                                ${otp[1]}
                                </div>
                              </td>
                              <td style="padding: 0 2px 0 2px">
                                <div
                                  style="
                                    background-color: #124769;
                                    padding: 16px;
                                    color: #fff;
                                    border-radius: 8px;
                                    font-size: 20px;
                                  "
                                >
                                ${otp[2]}
                                </div>
                              </td>
                              <td style="padding: 0 2px 0 2px">
                                <div
                                  style="
                                    background-color: #124769;
                                    padding: 16px;
                                    color: #fff;
                                    border-radius: 8px;
                                    font-size: 20px;
                                  "
                                >
                                ${otp[3]}
                                </div>
                              </td>
                            </tr>
                          </table>
                        </div>
                      </td>
                    </tr>
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
                                    cellpadding="10"
                                    cellspacing="0"
                                    class="paragraph_block block-2"
                                    role="presentation"
                                    style="word-break: break-word"
                                    width="100%"
                                  >
                                    <tr>
                                      <td>
                                        <div
                                          style="
                                            color: #000000cc;
                                            direction: ltr;
                                            font-family: Chivo, sans-serif;
                                            font-size: 16px;
                                            font-weight: 400;
                                            letter-spacing: 0px;
                                            text-align: left;
                                          "
                                        >
                                          <p style="margin: 0">
                                            ${postOtpText}
                                          </p>
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
      `,
    },
    function (error, info) {
      if (error) {
        console.log(error)
      } else {
        console.log(info)
      }
    },
  )
}
