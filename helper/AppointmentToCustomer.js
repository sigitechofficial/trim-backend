const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });

const { attachments } = require('./attactments')
const attachment = attachments();
const { transporter } = require('./transpoter');
const { footer } = require('./footer');
const { emailDateFormate } = require('../utils/emailDateFormate');
 
const { CURRENCY_UNIT } = process.env;
module.exports = function (to,data,status) {
  let jobs =[];
  data.jobs.forEach(ele => {
  const employee = ele.employee && ele.employee.user ? `with ${ele.employee.user.firstName}` : ' '; 
 
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
                                    <tr>
                                      <td>
                                        <div
                                          style="
                                            font-size: 16px;
                                            font-family: Chivo, sans-serif;
                                            font-weight: 400;
                                            display: flex;
                                            justify-content: space-between;
                                          "
                                        >
                                          <div>
                                            <div>${ele.service?.serviceName}</div>
                                            <div
                                              style="
                                                font-size: 12px;
                                                font-weight: 300;
                                              "
                                            >
                                              ${ele.duration}m with ${employee}
                                            </div>
                                          </div>
      
                                          <div>${CURRENCY_UNIT} ${ele.total}</div>
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
  const total = data.total;
  const address = data.salonDetail.addressDB;
  let addressString = `$${address.streetAddress}, ${address.province}, ${address.country}`
  const date =  emailDateFormate(data.on,data.startTime)

  const client = {
    name:`${data.user.firstName}`,
    email:`${data.user.email}`,
    contact :`${data.user.countryCode}${data.user.phoneNum}`
  }
  //! Condition for various status 

  let preText = `On ${date} with ${salonName}`
  let heading = `Hi ${client.name}, your appointment is confirmed!`
  if(status === 'cancel'){
    preText = `Appointment was scheduled for ${date} with ${salonName}`
    heading = `Hi ${client.name}, your appointment has been cancelled`
  } 



  transporter.sendMail(
    { 
      from: process.env.EMAIL_USERNAME, // sender address
      to: to, // list of receivers
      subject: `Appointment confirmed.`, // Subject line
      attachments: attachment.footer.concat(attachment.confirm),
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
                                    padding-bottom: 20px;
                                    padding-top: 20px;
                                    vertical-align: top;
                                    border-top: 0px;
                                    border-right: 0px;
                                    border-bottom: 0px;
                                    border-left: 0px;
                                  "
                                  width="100%"
                                >
                                  <table
                                    cellpadding="0"
                                    cellspacing="0"
                                    class="image_block block-1"
                                    role="presentation"
                                    width="100%"
                                  >
                                    <tr>
                                      <td class="pad">
                                        <div
                                          align="left"
                                          class="alignment"
                                          style="line-height: 10px"
                                        >
                                          <div
                                            style="
                                              display: flex;
                                              gap: 5px;
                                              align-items: center;
                                              background-color: #12466f;
                                              padding: 10px;
                                              border-radius: 20px;
                                              width: 160px;
                                              color: white;
                                              font-family: Chivo, sans-serif;
                                            "
                                          >
                                            <img
                                              src="cid:confirm"
                                              alt=""
                                              style="width: 20px"
                                            />
                                            <span>Confirmation</span>
                                          </div>
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
                                            text-align: left;
                                            margin-top: 0;
                                            margin-bottom: 0;
                                          "
                                        >
                                          ${heading}
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
                                      height: 5px;
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
                                      <td class="pad">
                                        <div
                                          style="
                                            color: #292929;
                                            direction: ltr;
                                            font-family: Chivo, sans-serif;
                                            font-size: 16px;
                                            font-weight: 400;
                                            letter-spacing: 0px;
                                            text-align: left;
                                          "
                                        >
                                          <p style="margin: 0">
                                            <span style="color: #12466f"
                                              >${preText}</span
                                            >
                                            
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
                                    class="paragraph_block block-2"
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
                                      <td>
                                        <div style="width: 75%; margin: auto">
                                          <button
                                            style="
                                              cursor: pointer;
                                              width: 100%;
                                              color: #000000cc;
                                              font-family: Chivo, sans-serif;
                                              font-size: 16px;
                                              font-weight: 500;
                                              letter-spacing: 0px;
                                              text-align: center;
                                              background-color: transparent;
                                              border: 2px solid black;
                                              padding: 10px;
                                            "
                                          >
                                            Manage appointment
                                          </button>
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
                                        height: 30px;
                                        line-height: 80px;
                                        font-size: 1px;
                                      "
                                    >
                                       
                                    </div>
                                    <tr>
                                      <td>
                                        <h4
                                          style="
                                            font-size: 16px;
                                            font-family: Chivo, sans-serif;
                                            font-weight: 700;
                                          "
                                        >
                                          Appointment details
                                        </h4>
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
                                  <div
                                    class="spacer_block block-1"
                                    style="
                                      height: 15px;
                                      line-height: 80px;
                                      font-size: 1px;
                                    "
                                  >
                                     
                                  </div>
                                  <table
                                    border="0"
                                    cellpadding="0"
                                    cellspacing="0"
                                    class="paragraph_block block-2"
                                    role="presentation"
                                    style="word-break: break-word"
                                    width="100%"
                                  >
                                    <tr>
                                      <td>
                                        <hr />
                                        <div
                                          style="
                                            font-size: 16px;
                                            font-family: Chivo, sans-serif;
                                            font-weight: 400;
                                            display: flex;
                                            justify-content: space-between;
                                          "
                                        >
                                          <div>Total</div>
                                          <div>${CURRENCY_UNIT} ${total}</div>
                                        </div>
                                        <hr />
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
                                  <div
                                    class="spacer_block block-1"
                                    style="
                                      height: 15px;
                                      line-height: 80px;
                                      font-size: 1px;
                                    "
                                  >
                                     
                                  </div>
                                  <table
                                    border="0"
                                    cellpadding="0"
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
                                            font-size: 16px;
                                            font-family: Chivo, sans-serif;
                                            font-weight: 400;
                                            display: flex;
                                            justify-content: space-between;
                                            color: #00000099;
                                          "
                                        >
                                          Booking ref: #${data.id}
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
                                    <tr>
                                      <td>
                                        <h4
                                          style="
                                            font-size: 20px;
                                            font-family: Chivo, sans-serif;
                                            font-weight: 600;
                                            margin-top: 20px;
                                            margin-bottom: 10px;
                                          "
                                        >
                                          Location
                                        </h4>
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
                                    <tr>
                                      <td>
                                        <div
                                          style="
                                            font-size: 16px;
                                            font-family: Chivo, sans-serif;
                                            font-weight: 400;
                                            display: flex;
                                            justify-content: space-between;
                                            color: #00000099;
                                          "
                                        >
                                          ${salonName}
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
                                        height: 5px;
                                        line-height: 80px;
                                        font-size: 1px;
                                      "
                                    >
                                       
                                    </div>
                                    <tr>
                                      <td>
                                        <div
                                          style="
                                            font-size: 14px;
                                            font-family: Chivo, sans-serif;
                                            font-weight: 400;
                                            display: flex;
                                            justify-content: space-between;
                                            color: #12466f;
                                          "
                                        >
                                          ${addressString}
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
                                  <div
                                    class="spacer_block block-1"
                                    style="
                                      height: 30px;
                                      line-height: 80px;
                                      font-size: 1px;
                                    "
                                  >
                                     
                                  </div>
                                  <table
                                    border="0"
                                    cellpadding="0"
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
                                            font-size: 16px;
                                            font-family: Chivo, sans-serif;
                                            font-weight: 400;
                                            display: flex;
                                            justify-content: space-between;
                                            color: #000;
                                          "
                                        >
                                          We sent you this email because you have
                                          booked with ${salonName}, which professional
                                          with Trim for appointments and payments.
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
