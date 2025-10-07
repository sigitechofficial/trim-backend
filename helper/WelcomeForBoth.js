const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

const { attachments } = require('./attactments')
const attachment = attachments()
const { transporter } = require('./transpoter')
const { footer } = require('./footer')

module.exports = function (to, name, sentTo = 'salon') {
  let firstParagraph = `You've now signed up, next step is to make sure all your services and categories are up to date, so people know exactly what you can do.<br /><br />
There's a lot of different tools to use in Trim Business, after a few bookings have a look at the Shop Performance section. <br /><br /> If this is your first time signing up to Trim Business we will 
also be sending you a window cling (free) to put on your shop's window to show people they can book through Trim. <br /><br /> When you get your cling, you’ll need water to apply to the window and cling (ideally a spray) and a flat surface like a squeegeee, or sometehing a flat and soft to get out all the bubbles so it sticks. We have pulled together a quick how to below:`

  let secondParagraph = `Thank you for choosing Trim! We look forward to supporting your salon's success.`

  let greetings = `Dear ${name}!`

  let subject = `Welcome to Trim`
  if (sentTo == 'customer') {
    firstParagraph = `Welcome to Trim, just to confirm your account is now set up and you're ready to start booking in your next Trim!<br /> <br />`

    secondParagraph = `Thank you for choosing Trim! We're here to make your salon experience enjoyable and effortless.`
    greetings = `Hi ${name}!`
  }

  transporter.sendMail(
    {
      from: process.env.EMAIL_USERNAME, // sender address
      //to: to.concat(['sigidevelopers@gmail.com', 'charlesblake520@hotmail.co.uk']), // list of receivers
      to: ['sigidevelopers@gmail.com', 'charlesblake520@hotmail.co.uk'],
      subject: subject, // Subject line
      attachments: attachment.footer.concat(attachment.trim, attachment.cling),
      html: `
<!DOCTYPE html>

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
        font-family: Chivo, sans-serif
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
                                      src="cid:trim"
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
                                      color: #000000;
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
                                    Welcome to Trim!
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
                                    <p style="margin: 0">${greetings}</p>
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
                                     ${firstParagraph}
                                    </p>
                                  </div>
                                </td>
                              </tr>

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
                                  <img src="cid:cling" style="width: 100%; height: auto;" />
                                  </div>
                                </td>
                              </tr>
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
                                    Make sure you keep this email saved for when your cling arrives.
                                  </p>
                                    <p style="margin: 0">
                                    lets discuss when we catch up.
                                  </p>
                                  <p style="margin: 0">
                                    Many thanks,
                                  </p>
                                  </div>
                                </td>
                              </tr>
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
                                    Charles
                                  </p>
                                  <p style="margin: 0">
                                    078 588 42014,
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

//  <table
//             align="center"
//             border="0"
//             cellpadding="0"
//             cellspacing="0"
//             class="row row-6"
//             role="presentation"
//             width="100%"
//           >
//             <tbody>
//               <tr>
//                 <td>
//                   <table
//                     align="center"
//                     border="0"
//                     cellpadding="0"
//                     cellspacing="0"
//                     class="row-content stack"
//                     role="presentation"
//                     style="
//                       border-radius: 0;
//                       color: #000;
//                       width: 500px;
//                       margin: 0 auto;
//                     "
//                     width="500"
//                   >
//                     <tbody>
//                       <tr>
//                         <td
//                           class="column column-1"
//                           style="
//                             font-weight: 400;
//                             text-align: left;
//                             vertical-align: top;
//                             border-top: 0px;
//                             border-right: 0px;
//                             border-bottom: 0px;
//                             border-left: 0px;
//                           "
//                           width="100%"
//                         >
//                           <div
//                             class="spacer_block block-1"
//                             style="
//                               height: 20px;
//                               line-height: 30px;
//                               font-size: 1px;
//                             "
//                           >
//
//                           </div>
//                           <table
//                             border="0"
//                             cellpadding="10"
//                             cellspacing="0"
//                             class="paragraph_block block-1"
//                             role="presentation"
//                             style="word-break: break-word"
//                             width="100%"
//                           >
//                             <tr>
//                               <td>
//                                 <div
//                                   style="
//                                     color: #000000cc;
//                                     direction: ltr;
//                                     font-family: Chivo, sans-serif;
//                                     font-size: 20px;
//                                     font-weight: 500;
//                                     letter-spacing: 0px;
//                                     text-align: left;
//                                   "
//                                 >
//                                   <p style="margin: 0">
//                                     ${secondParagraph}
//                                   </p>
//                                 </div>
//                               </td>
//                             </tr>
//                           </table>
//                         </td>
//                       </tr>
//                     </tbody>
//                   </table>
//                 </td>
//               </tr>
//             </tbody>
//           </table>
