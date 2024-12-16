const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });

const { attachments } = require('./attactments')
const attachment = attachments();
const { transporter } = require('./transpoter');
const { footer } = require('./footer');
const { emailDateFormate } = require('../utils/emailDateFormate');

module.exports = function (to,data) {
  let jobs =[];
  const services = data.jobs.forEach(ele => {
  const employee = ele.employee && ele.employee.user ? `with ${ele.employee.user.firstName} ${ele.employee.user.lastName}` : 'with Un-Confirmed'; 
  const date =  emailDateFormate(ele.on,ele.startTime)
  let temp = `
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
                  class="paragraph_block block-2"
                  role="presentation"
                  style="word-break: break-word"
                  width="100%"
                >
                  <div
                    class="spacer_block block-1"
                    style="
                      height: 15px;
                      line-height: 80px;
                      font-size: 1px;
                    "
                  >
                     
                  </div>
                  <tr>
                    <td>
                      <div
                        style="
                          color: #000000cc;
                          direction: ltr;
                          font-family: Chivo, sans-serif;
                          font-size: 14px;
                          font-weight: 400;
                          letter-spacing: 0px;
                          text-align: left;
                        "
                      >
                        <p style="margin: 0; color: #000000">
                          ${ele.service.serviceName} ${employee}
                        </p>
                        <p style="margin: 0; color: #717171cc">
                          ${date}
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
  `;
  temp = jobs.push(temp); 
  return temp;
  });
  jobs = jobs.join(" ");

  const salonName = data.salonDetail.salonName;
  const address = data.salonDetail.addressDB;
  let addressString = `${salonName} - ${address.streetAddress},${address.province} ${address.country}`

  const client = {
    name:`${data.user.firstName} ${data.user.lastName}`,
    email:`${data.user.email}`,
    contact :`${data.user.countryCode}${data.user.phoneNum}`
  }

  transporter.sendMail(
    {
      from: process.env.EMAIL_USERNAME, // sender address
      to: to, // list of receivers
      subject: `Appointment confirmed.`, // Subject line
      attachments: attachment.footer,
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
                                        style="text-align: center; width: 100%"
                                      >
                                        <h1
                                          style="
                                            margin: 0;
                                            color: #12466f;
                                            direction: ltr;
                                            font-family: Chivo, sans-serif;
                                            font-size: 30px;
                                            font-weight: 700;
                                            letter-spacing: normal;
                                            text-align: left;
                                            margin-top: 0;
                                            margin-bottom: 0;
                                          "
                                        >
                                          Appointment confirmed
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
                                            color: #292929;
                                            direction: ltr;
                                            font-family: Chivo, sans-serif;
                                            font-size: 16px;
                                            font-weight: 500;
                                            letter-spacing: 0px;
                                            text-align: left;
                                          "
                                        >
                                          <p style="margin: 0">Hi ${data.salonDetail.salonName},</p>
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
                                    class="paragraph_block block-2"
                                    role="presentation"
                                    style="word-break: break-word"
                                    width="100%"
                                  >
                                    <div
                                      class="spacer_block block-1"
                                      style="
                                        height: 15px;
                                        line-height: 80px;
                                        font-size: 1px;
                                      "
                                    >
                                       
                                    </div>
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
                                            The following appointment has been booked
                                            online
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
      
              ${jobs}
      
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
                                    <div
                                      class="spacer_block block-1"
                                      style="
                                        height: 30px;
                                        line-height: 80px;
                                        font-size: 1px;
                                      "
                                    >
                                       
                                    </div>
                                    <tr>
                                      <td class="">
                                        <div
                                          style="
                                            color: #292929;
                                            direction: ltr;
                                            font-family: Chivo, sans-serif;
                                            font-size: 16px;
                                            font-weight: 600;
                                            letter-spacing: 0px;
                                            text-align: left;
                                          "
                                        >
                                          <p style="margin: 0">At this location:</p>
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
                                    class="paragraph_block block-2"
                                    role="presentation"
                                    style="word-break: break-word"
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
                                          ${addressString}
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
                                    <div
                                      class="spacer_block block-1"
                                      style="
                                        height: 30px;
                                        line-height: 80px;
                                        font-size: 1px;
                                      "
                                    >
                                       
                                    </div>
                                    <tr>
                                      <td class="">
                                        <div
                                          style="
                                            color: #292929;
                                            direction: ltr;
                                            font-family: Chivo, sans-serif;
                                            font-size: 16px;
                                            font-weight: 600;
                                            letter-spacing: 0px;
                                            text-align: left;
                                          "
                                        >
                                          <p style="margin: 0">Customer details:</p>
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
                                    class="paragraph_block block-2"
                                    role="presentation"
                                    style="word-break: break-word"
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
                                    <tr>
                                      <td>
                                        <div
                                          style="
                                            color: #000000cc;
                                            direction: ltr;
                                            font-family: Chivo, sans-serif;
                                            font-size: 14px;
                                            font-weight: 400;
                                            letter-spacing: 0px;
                                            text-align: left;
                                          "
                                        >
                                          <p style="margin-bottom: 5px; margin-top: 0px; color: #000000">
                                          ${client.name}
                                          </p>
                                          <p style="margin-bottom: 5px; margin-top: 0px; color: #12466f">
                                          ${client.email}
                                          </p>
                                          <p style="margin-bottom: 5px; margin-top: 0px; color: #000">
                                          ${client.contact}
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
        console.log(error);
      } else {
        console.log(info);
      }
    }
  );
};
