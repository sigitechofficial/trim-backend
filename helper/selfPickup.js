const { attachments } = require('./attachment')
const a = attachments();
const nodemailer = require("nodemailer");
// Defining the account for sending email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // use TLS
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

module.exports = function (email,username,orderNumber,packageQty,billableweight,company,createdat,supportEmail,supportNumber) {
  transporter.sendMail(
    {
      from: process.env.EMAIL_USERNAME, // sender address
      to: email, // list of receivers
      subject: `Your order has arrived at Puerto Rico Warehouse (Self-Pickup Available)`, // Subject line
      // text: `Your OTP for Pacifrica Express is ${otp}`, // plain text body

      attachments: a.arrived,
      html: `<!DOCTYPE html>

            <html
              lang="en"
              xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:v="urn:schemas-microsoft-com:vml"
            >
              <head>
                <title></title>
                <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
                <meta content="width=device-width, initial-scale=1.0" name="viewport" />
                <!--[if mso
                  ]><xml
                    ><o:OfficeDocumentSettings
                      ><o:PixelsPerInch>96</o:PixelsPerInch
                      ><o:Allow /></o:OfficeDocumentSettings></xml
                ><![endif]-->
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
                  text-size-adjust: none;
                  background-color: #fff;
                  margin: 0;
                  padding: 0;
                "
              >
                <table
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  class="nl-container"
                  role="presentation"
                  style="
                    mso-table-lspace: 0pt;
                    mso-table-rspace: 0pt;
                    background-color: #fff;
                  "
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
                          style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
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
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    color: #000;
                                    width: 535px;
                                    margin: 0 auto;
                                  "
                                  width="535"
                                >
                                  <tbody>
                                    <tr>
                                      <td
                                        class="column column-1"
                                        style="
                                          mso-table-lspace: 0pt;
                                          mso-table-rspace: 0pt;
                                          font-weight: 400;
                                          text-align: left;
                                          padding-bottom: 12px;
                                          padding-top: 12px;
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
                                          class="image_block block-1"
                                          role="presentation"
                                          style="
                                            mso-table-lspace: 0pt;
                                            mso-table-rspace: 0pt;
                                          "
                                          width="100%"
                                        >
                                          <tr>
                                            <td
                                              class="pad"
                                              style="
                                                width: 100%;
                                                padding-right: 0px;
                                                padding-left: 0px;
                                              "
                                            >
                                              <div
                                                align="center"
                                                class="alignment"
                                                style="line-height: 10px"
                                              >
                                                <img
                                                  src="cid:pacifrica_logo"
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
                                          border="0"
                                          cellpadding="0"
                                          cellspacing="0"
                                          class="image_block block-2"
                                          role="presentation"
                                          style="
                                            mso-table-lspace: 0pt;
                                            mso-table-rspace: 0pt;
                                          "
                                          width="100%"
                                        >
                                          <tr>
                                            <td
                                              class="pad"
                                              style="
                                                width: 100%;
                                                padding-right: 0px;
                                                padding-left: 0px;
                                              "
                                            >
                                              <div
                                                align="center"
                                                class="alignment"
                                                style="line-height: 10px"
                                              >
                                                <img
                                                  src="cid:warehouse"
                                                  style="
                                                    display: block;
                                                    height: auto;
                                                    border: 0;
                                                    max-width: 100px;
                                                    width: 100%;
                                                  "
                                                  width="100"
                                                />
                                              </div>
                                            </td>
                                          </tr>
                                        </table>
                                        <div
                                          class="spacer_block block-3"
                                          style="
                                            height: 20px;
                                            line-height: 20px;
                                            font-size: 1px;
                                          "
                                        >
                                           
                                        </div>
                                        <table
                                          border="0"
                                          cellpadding="10"
                                          cellspacing="0"
                                          class="text_block block-4"
                                          role="presentation"
                                          style="
                                            mso-table-lspace: 0pt;
                                            mso-table-rspace: 0pt;
                                            word-break: break-word;
                                          "
                                          width="100%"
                                        >
                                          <tr>
                                            <td class="pad">
                                              <div style="font-family: sans-serif">
                                                <div
                                                  class=""
                                                  style="
                                                    font-size: 12px;
                                                    font-family: Arial, 'Helvetica Neue',
                                                      Helvetica, sans-serif;
                                                    mso-line-height-alt: 14.399999999999999px;
                                                    color: #000000;
                                                    line-height: 1.2;
                                                  "
                                                >
                                                  <p
                                                    style="
                                                      margin: 0;
                                                      font-size: 16px;
                                                      text-align: center;
                                                      mso-line-height-alt: 19.2px;
                                                    "
                                                  >
                                                    <strong
                                                      ><span style="font-size: 24px"
                                                        >Your Order Has Arrived at Our Puerto Rico Warehouse (Self-Pickup Available)</span
                                                      ></strong
                                                    >
                                                  </p>
                                                </div>
                                              </div>
                                            </td>
                                          </tr>
                                        </table>
                                        <div
                                          class="spacer_block block-3"
                                          style="
                                            height: 15px;
                                            line-height: 15px;
                                            font-size: 1px;
                                          "
                                        >
                                           
                                        </div>
                                        <table
                                          border="0"
                                          cellpadding="10"
                                          cellspacing="0"
                                          class="paragraph_block block-4"
                                          role="presentation"
                                          style="
                                            mso-table-lspace: 0pt;
                                            mso-table-rspace: 0pt;
                                            word-break: break-word;
                                          "
                                          width="100%"
                                        >
                                          <tr>
                                            <td class="pad">
                                              <div
                                                style="
                                                  color: #000000;
                                                  direction: ltr;
                                                  font-family: Arial, 'Helvetica Neue',
                                                    Helvetica, sans-serif;
                                                  font-size: 14px;
                                                  font-weight: 400;
                                                  letter-spacing: 0px;
                                                  line-height: 1.5;
                                                  text-align: center;
                                                "
                                              >
                                                <p style="margin: 0">
                                                  <strong>Hi ${username}:</strong>
                                                  <span
                                                    style="font-weight: 600; color: #555555"
                                                    >We hope this message finds you well. We are delighted to inform you that your order has successfully
                                                     arrived at our Puerto Rico warehouse and is now ready for pickup.
                                                      Our team is available to assist you, and you can visit at your convenience to collect your items.
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
                        <div
                          class="spacer_block block-2"
                          style="height: 30px; line-height: 30px; font-size: 1px"
                        >
                           
                        </div>
                        <table
              align="center"
              border="0"
              cellpadding="0"
              cellspacing="0"
              class="row row-12"
              role="presentation"
              style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
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
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
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
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
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
                              class="heading_block block-1"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
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
                                      font-family: Arial, 'Helvetica Neue',
                                        Helvetica, sans-serif;
                                      font-size: 23px;
                                      font-weight: 700;
                                      letter-spacing: normal;
                                      line-height: 120%;
                                      text-align: left;
                                      margin-top: 0;
                                      margin-bottom: 0;
                                    "
                                  >
                                    &nbsp;Parcel Details
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
              class="row row-13"
              role="presentation"
              style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
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
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
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
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
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
                            width="50%"
                          >
                            <table
                              border="0"
                              cellpadding="5"
                              cellspacing="0"
                              class="paragraph_block block-1"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                              width="100%"
                            >
                              <tr>
                                <td class="pad">
                                  <div
                                    style="
                                      color: #000000;
                                      direction: ltr;
                                      font-family: Arial, 'Helvetica Neue',
                                        Helvetica, sans-serif;
                                      font-size: 16px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 120%;
                                      text-align: left;
                                      mso-line-height-alt: 19.2px;
                                    "
                                  >
                                    <p style="margin: 0">
                                      <strong>Order Number</strong>
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td
                            class="column column-2"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
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
                            width="50%"
                          >
                            <table
                              border="0"
                              cellpadding="5"
                              cellspacing="0"
                              class="paragraph_block block-1"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                              width="100%"
                            >
                              <tr>
                                <td class="pad">
                                  <div
                                    style="
                                      color: #909090;
                                      direction: ltr;
                                      font-family: Arial, 'Helvetica Neue',
                                        Helvetica, sans-serif;
                                      font-size: 16px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 120%;
                                      text-align: right;
                                      mso-line-height-alt: 19.2px;
                                    "
                                  >
                                    <p style="margin: 0">${orderNumber}</p>
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
              class="row row-13"
              role="presentation"
              style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
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
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
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
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
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
                            width="50%"
                          >
                            <table
                              border="0"
                              cellpadding="5"
                              cellspacing="0"
                              class="paragraph_block block-1"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                              width="100%"
                            >
                              <tr>
                                <td class="pad">
                                  <div
                                    style="
                                      color: #000000;
                                      direction: ltr;
                                      font-family: Arial, 'Helvetica Neue',
                                        Helvetica, sans-serif;
                                      font-size: 16px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 120%;
                                      text-align: left;
                                      mso-line-height-alt: 19.2px;
                                    "
                                  >
                                    <p style="margin: 0">
                                      <strong>Package Quantity</strong>
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td
                            class="column column-2"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
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
                            width="50%"
                          >
                            <table
                              border="0"
                              cellpadding="5"
                              cellspacing="0"
                              class="paragraph_block block-1"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                              width="100%"
                            >
                              <tr>
                                <td class="pad">
                                  <div
                                    style="
                                      color: #909090;
                                      direction: ltr;
                                      font-family: Arial, 'Helvetica Neue',
                                        Helvetica, sans-serif;
                                      font-size: 16px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 120%;
                                      text-align: right;
                                      mso-line-height-alt: 19.2px;
                                    "
                                  >
                                    <p style="margin: 0">${packageQty}</p>
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
              class="row row-13"
              role="presentation"
              style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
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
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
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
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
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
                            width="50%"
                          >
                            <table
                              border="0"
                              cellpadding="5"
                              cellspacing="0"
                              class="paragraph_block block-1"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                              width="100%"
                            >
                              <tr>
                                <td class="pad">
                                  <div
                                    style="
                                      color: #000000;
                                      direction: ltr;
                                      font-family: Arial, 'Helvetica Neue',
                                        Helvetica, sans-serif;
                                      font-size: 16px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 120%;
                                      text-align: left;
                                      mso-line-height-alt: 19.2px;
                                    "
                                  >
                                    <p style="margin: 0">
                                      <strong>Billable Weight</strong>
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td
                            class="column column-2"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
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
                            width="50%"
                          >
                            <table
                              border="0"
                              cellpadding="5"
                              cellspacing="0"
                              class="paragraph_block block-1"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                              width="100%"
                            >
                              <tr>
                                <td class="pad">
                                  <div
                                    style="
                                      color: #909090;
                                      direction: ltr;
                                      font-family: Arial, 'Helvetica Neue',
                                        Helvetica, sans-serif;
                                      font-size: 16px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 120%;
                                      text-align: right;
                                      mso-line-height-alt: 19.2px;
                                    "
                                  >
                                    <p style="margin: 0">${billableweight}</p>
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
              class="row row-18"
              role="presentation"
              style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
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
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
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
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
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
                            width="50%"
                          >
                            <table
                              border="0"
                              cellpadding="5"
                              cellspacing="0"
                              class="paragraph_block block-1"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                              width="100%"
                            >
                              <tr>
                                <td class="pad">
                                  <div
                                    style="
                                      color: #000000;
                                      direction: ltr;
                                      font-family: Arial, 'Helvetica Neue',
                                        Helvetica, sans-serif;
                                      font-size: 16px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 120%;
                                      text-align: left;
                                      mso-line-height-alt: 19.2px;
                                    "
                                  >
                                    <p style="margin: 0">
                                      <strong>Shipping company</strong>
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td
                            class="column column-2"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
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
                            width="50%"
                          >
                            <table
                              border="0"
                              cellpadding="5"
                              cellspacing="0"
                              class="paragraph_block block-1"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                              width="100%"
                            >
                              <tr>
                                <td class="pad">
                                  <div
                                    style="
                                      color: #909090;
                                      direction: ltr;
                                      font-family: Arial, 'Helvetica Neue',
                                        Helvetica, sans-serif;
                                      font-size: 16px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 120%;
                                      text-align: right;
                                      mso-line-height-alt: 19.2px;
                                    "
                                  >
                                    <p style="margin: 0">${company}</p>
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
          class="row row-13"
          role="presentation"
          style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
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
                    mso-table-lspace: 0pt;
                    mso-table-rspace: 0pt;
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
                          mso-table-lspace: 0pt;
                          mso-table-rspace: 0pt;
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
                        width="50%"
                      >
                        <table
                          border="0"
                          cellpadding="5"
                          cellspacing="0"
                          class="paragraph_block block-1"
                          role="presentation"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            word-break: break-word;
                          "
                          width="100%"
                        >
                          <tr>
                            <td class="pad">
                              <div
                                style="
                                  color: #000000;
                                  direction: ltr;
                                  font-family: Arial, 'Helvetica Neue',
                                    Helvetica, sans-serif;
                                  font-size: 16px;
                                  font-weight: 400;
                                  letter-spacing: 0px;
                                  line-height: 120%;
                                  text-align: left;
                                  mso-line-height-alt: 19.2px;
                                "
                              >
                                <p style="margin: 0">
                                  <strong>Created At</strong>
                                </p>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td
                        class="column column-2"
                        style="
                          mso-table-lspace: 0pt;
                          mso-table-rspace: 0pt;
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
                        width="50%"
                      >
                        <table
                          border="0"
                          cellpadding="5"
                          cellspacing="0"
                          class="paragraph_block block-1"
                          role="presentation"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            word-break: break-word;
                          "
                          width="100%"
                        >
                          <tr>
                            <td class="pad">
                              <div
                                style="
                                  color: #909090;
                                  direction: ltr;
                                  font-family: Arial, 'Helvetica Neue',
                                    Helvetica, sans-serif;
                                  font-size: 16px;
                                  font-weight: 400;
                                  letter-spacing: 0px;
                                  line-height: 120%;
                                  text-align: right;
                                  mso-line-height-alt: 19.2px;
                                "
                              >
                                <p style="margin: 0">${createdat}</p>
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

                        <div
                          class="spacer_block block-2"
                          style="height: 30px; line-height: 30px; font-size: 1px"
                        >
                           
                        </div>
                        <table
                          align="center"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          class="row row-4"
                          role="presentation"
                          style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
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
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    color: #000;
                                    border-radius: 0;
                                    width: 535px;
                                    margin: 0 auto;
                                  "
                                  width="535"
                                >
                                  <tbody>
                                    <tr>
                                      <td
                                        class="column column-1"
                                        style="
                                          mso-table-lspace: 0pt;
                                          mso-table-rspace: 0pt;
                                          text-align: left;
                                          font-weight: 400;
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
                                          cellpadding="10"
                                          cellspacing="0"
                                          class="paragraph_block block-1"
                                          role="presentation"
                                          style="
                                            mso-table-lspace: 0pt;
                                            mso-table-rspace: 0pt;
                                            word-break: break-word;
                                          "
                                          width="100%"
                                        >
                                          <tr>
                                            <td class="pad">
                                              <div
                                                style="
                                                  color: #555555;
                                                  direction: ltr;
                                                  font-family: Arial, 'Helvetica Neue',
                                                    Helvetica, sans-serif;
                                                  font-size: 14px;
                                                  font-weight: 400;
                                                  letter-spacing: 0px;
                                                  line-height: 1.5;
                                                  text-align: center;
                                                "
                                              >
                                                <p style="margin: 0">
                                                  <strong>
                                                  If you have any questions, need further assistance,
                                                   or have specific delivery instructions,
                                                    please don't hesitate to contact our customer support team at
                                                     ${supportEmail} or 
                                                     ${supportNumber}. We're here to help.
                                                     Thank you for choosing our services!
                                                  </strong>
                                                </p>
                                              </div>
                                            </td>
                                          </tr>
                                        </table>
                                        <div
                                          class="spacer_block block-2"
                                          style="
                                            height: 30px;
                                            line-height: 30px;
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
                          border="0"
                          cellpadding="10"
                          cellspacing="0"
                          class="social_block block-19"
                          role="presentation"
                          style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
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
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    display: inline-block;
                                  "
                                  width="144px"
                                >
                                  <tr>
                                    <td style="padding: 0 2px 0 2px">
                                      <a href="https://web.facebook.com/Pacifricaxp" target="_blank"
                                        ><img
                                          alt="Facebook"
                                          height="32"
                                          src="cid:facebook"
                                          style="display: block; height: auto; border: 0"
                                          title="facebook"
                                          width="32"
                                      /></a>
                                    </td>
                                    <td style="padding: 0 2px 0 2px">
                                      <a href="https://www.twitter.com/pacifricaxp" target="_blank"
                                        ><img
                                          alt="Twitter"
                                          height="32"
                                          src="cid:twitter"
                                          style="display: block; height: auto; border: 0"
                                          title="twitter"
                                          width="32"
                                      /></a>
                                    </td>
                                    <td style="padding: 0 2px 0 2px">
                                      <a href="https://www.linkedin.com/company/pacifrica-express/" target="_blank"
                                        ><img
                                          alt="Linkedin"
                                          height="32"
                                          src="cid:linkedin"
                                          style="display: block; height: auto; border: 0"
                                          title="linkedin"
                                          width="32"
                                      /></a>
                                    </td>
                                    <td style="padding: 0 2px 0 2px">
                                      <a href="https://www.instagram.com/pacifricaxp/" target="_blank"
                                        ><img
                                          alt="Instagram"
                                          height="32"
                                          src="cid:instagram"
                                          style="display: block; height: auto; border: 0"
                                          title="instagram"
                                          width="32"
                                      /></a>
                                    </td>
                                  </tr>
                                </table>
                              </div>
                            </td>
                          </tr>
                        </table>
                        <div
                          class="spacer_block block-2"
                          style="height: 30px; line-height: 30px; font-size: 1px"
                        >
                           
                        </div>
                        <table
                          border="0"
                          cellpadding="10"
                          cellspacing="0"
                          class="heading_block block-20"
                          role="presentation"
                          style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
                          width="100%"
                        >
                          <tr>
                            <td class="pad">
                              <h1
                                style="
                                  margin: 0;
                                  color: #000000;
                                  direction: ltr;
                                  font-family: Arial, 'Helvetica Neue', Helvetica,
                                    sans-serif;
                                  font-size: 16px;
                                  font-weight: 700;
                                  letter-spacing: normal;
                                  line-height: 120%;
                                  text-align: center;
                                  margin-top: 0;
                                  margin-bottom: 0;
                                "
                              >
                                Follow Us
                              </h1>
                            </td>
                          </tr>
                        </table>
                        <div
                          class="spacer_block block-21"
                          style="height: 30px; line-height: 30px; font-size: 1px"
                        >
                           
                        </div>
                        <table
                          border="0"
                          cellpadding="10"
                          cellspacing="0"
                          class="paragraph_block block-22"
                          role="presentation"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            word-break: break-word;
                          "
                          width="100%"
                        >
                          <tr>
                            <td class="pad">
                              <div
                                style="
                                  color: #000000;
                                  direction: ltr;
                                  font-family: Arial, 'Helvetica Neue', Helvetica,
                                    sans-serif;
                                  font-size: 14px;
                                  font-weight: 700;
                                  letter-spacing: 0px;
                                  line-height: 120%;
                                  text-align: center;
                                  mso-line-height-alt: 16.8px;
                                "
                              >
                                <p style="margin: 0">
                                95 Pony St, Hazeldean,Pretoria Gauteng 0084
                                </p>
                              </div>
                            </td>
                          </tr>
                        </table>
                        <table
                          border="0"
                          cellpadding="10"
                          cellspacing="0"
                          class="paragraph_block block-23"
                          role="presentation"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            word-break: break-word;
                          "
                          width="100%"
                        >
                          <tr>
                            <td class="pad">
                              <div
                                style="
                                  color: #101112;
                                  direction: ltr;
                                  font-family: Arial, 'Helvetica Neue', Helvetica,
                                    sans-serif;
                                  font-size: 14px;
                                  font-weight: 400;
                                  letter-spacing: 0px;
                                  line-height: 120%;
                                  text-align: center;
                                  mso-line-height-alt: 16.8px;
                                "
                              >
                                <p style="margin: 0">
                                  Copyright © 2023 The Shipping Hack
                                  <span style="color: #202053; cursor: pointer"
                                    ></span
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
                <!-- End -->
              </body>
            </html>
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
