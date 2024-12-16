const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

const { attachments } = require('./attactments')
const attachment = attachments()
const { transporter } = require('./transpoter')
const { footer } = require('./footer')
const { emailDateFormate } = require('../utils/emailDateFormate')

const { CURRENCY_UNIT } = process.env
module.exports = function (to, data) {
  transporter.sendMail(
    {
      from: process.env.EMAIL_USERNAME, // sender address
      to: to, // list of receivers
      subject: `Appointment confirmed.`, // Subject line
      // attachments: attachment.footer.concat(attachment.confirm),
      html: ` <table
align="center"
border="0"
cellpadding="0"
cellspacing="0"
class="row row-8"
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
                  height: 25px;
                  line-height: 30px;
                  font-size: 1px;
                "
              >
                 
              </div>
              <div
                style="
                  color: #292929;
                  direction: ltr;
                  font-family: Chivo, sans-serif, sans-serif;
                  font-size: 14px;
                  font-weight: 400;
                  letter-spacing: 0px;
                  text-align: center;
                "
              >
                <p>
                  If you have any questions or need help,  please check our FAQ or emai
                  <br /><br />
                  Thank you for choosing our services!
                </p>
              </div>
              <table
                border="0"
                cellpadding="10"
                cellspacing="0"
                class="social_block block-2"
                role="presentation"
                width="100%"
              >
                <tr>
                  <td class="pad">
                    <div
                      class="spacer_block block-2"
                      style="
                        height: 30px;
                        line-height: 60px;
                        font-size: 1px;
                      "
                    >
                       
                    </div>
                    <div align="center" class="alignment">
                      <table
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        class="social-table"
                        role="presentation"
                        style="display: inline-block"
                        width="144px"
                      >
                        <tr>
                          <td style="padding: 0 2px 0 2px">
                            <a
                              href="https://www.facebook.com/"
                              target="_blank"
                              ><img
                                alt="Facebook"
                                height="32"
                                src="cid:facebook"
                                style="
                                  display: block;
                                  height: auto;
                                  border: 0;
                                "
                                title="Facebook"
                                width="32"
                            /></a>
                          </td>
                          <td style="padding: 0 2px 0 2px">
                            <a
                              href="https://twitter.com/"
                              target="_blank"
                              ><img
                                alt="Twitter"
                                height="32"
                                src="cid:twitter"
                                style="
                                  display: block;
                                  height: auto;
                                  border: 0;
                                "
                                title="Twitter"
                                width="32"
                            /></a>
                          </td>
                          <td style="padding: 0 2px 0 2px">
                            <a
                              href="https://instagram.com/"
                              target="_blank"
                              ><img
                                alt="Instagram"
                                height="32"
                                src="cid:instagram"
                                style="
                                  display: block;
                                  height: auto;
                                  border: 0;
                                "
                                title="Instagram"
                                width="32"
                            /></a>
                          </td>
                          <td style="padding: 0 2px 0 2px">
                            <a
                              href="https://www.linkedin.com/"
                              target="_blank"
                              ><img
                                alt="LinkedIn"
                                height="32"
                                src="cid:linkedin"
                                style="
                                  display: block;
                                  height: auto;
                                  border: 0;
                                "
                                title="LinkedIn"
                                width="32"
                            /></a>
                          </td>
                        </tr>
                      </table>
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
class="row row-9"
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
                class="heading_block block-1"
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
                        font-size: 16px;
                        font-weight: 600;
                        letter-spacing: normal;
                        text-align: center;
                        margin-top: 0;
                        margin-bottom: 0;
                      "
                    >
                      <span class="tinyMce-placeholder"
                        >Follow Us</span
                      >
                    </h1>
                  </td>
                </tr>
              </table>
              <div
                class="spacer_block block-2"
                style="
                  height: 20px;
                  line-height: 20px;
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
class="row row-10"
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
                class="paragraph_block block-1"
                role="presentation"
                style="word-break: break-word"
                width="100%"
              >
                <tr>
                  <td class="pad">
                    <div
                      style="
                        color: #000000;
                        direction: ltr;
                        font-family: Chivo, sans-serif;
                        font-size: 14px;
                        font-weight: 500;
                        letter-spacing: 0px;
                        line-height: 120%;
                        text-align: center;
                      "
                    >
                      <p style="margin: 0">
                        Edif. Gate Center, San Francisco, Cl. 67
                        Panamá
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
class="row row-11"
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
                        color: #000000;
                        direction: ltr;
                        font-family: Chivo, sans-serif;
                        font-size: 12px;
                        font-weight: 400;
                        letter-spacing: 0px;
                        line-height: 120%;
                        text-align: center;
                      "
                    >

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
class="row row-9"
role="presentation"
width="100%"
>
<div
  class="spacer_block block-1"
  style="height: 10px; line-height: 30px; font-size: 1px"
>
   
</div>
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
                class="heading_block block-1"
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
                        color: #00000099;
                        direction: ltr;
                        font-family: Chivo, sans-serif;
                        font-size: 16px;
                        font-weight: 400;
                        letter-spacing: normal;
                        text-align: center;
                        margin-top: 0;
                        margin-bottom: 0;
                      "
                    >
                      <span class="tinyMce-placeholder"
                        >Powered by</span
                      >
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
class="row row-8"
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
                cellpadding="10"
                cellspacing="0"
                class="social_block block-2"
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
                        style="display: inline-block"
                        width="144px"
                      >
                        <tr>
                          <td style="padding: 0 2px 0 2px">
                            <img
                              alt="Facebook"
                              height="80px"
                              src="cid:logo"
                              style="
                                display: block;
                                height: auto;
                                border: 0;
                                background: transparent;
                              "
                              title="Facebook"
                              width="125px"
                            />
                          </td>
                        </tr>
                      </table>
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
<!-- End -->
</body>
</html>

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
                              padding-top: 25px;
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
                                      margin: 0 auto;
                                      color: #12466f;
                                      direction: ltr;
                                      font-family: Chivo, sans-serif;
                                      font-size: 30px;
                                      font-weight: 700;
                                      letter-spacing: normal;
                                      line-height: 120%;
                                      text-align: center;
                                      width: 400px;
                                    "
                                  >

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
                                  <h1
                                    style="
                                      margin: 0 auto;
                                      color: #000;
                                      direction: ltr;
                                      font-family: Chivo, sans-serif;
                                      font-size: 30px;
                                      font-weight: 700;
                                      letter-spacing: normal;
                                      line-height: 120%;
                                      text-align: center;
                                      width: 400px;
                                    "
                                  >
                
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
                                  height: 10px;
                                  line-height: 80px;
                                  font-size: 1px;
                                "
                              >
                                 
                              </div>
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
                                      text-align: center;
                                    "
                                  >
                                    <p style="margin: 0">
                                      Booking was on
                                    
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
      <td style="text-align: center;">
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
            text-align: center;
          "
          width="500"
        >
          <tbody>
            <tr>
              <td
                class="column column-1"
                style="
                  font-weight: 400;
                  text-align: center;
                  vertical-align: top;
                  border-top: 0px;
                  border-right: 0px;
                  border-bottom: 0px;
                  border-left: 0px;
                  padding: 20px 0;
                "
                width="100%"
              >
                <table
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  class="paragraph_block block-1"
                  role="presentation"
                  style="word-break: break-word; margin: 0 auto;"
                  width="100%"
                >
                  <tr>
                    <td class="pad" style="text-align: center;">
                      <div
                        style="
                          display: inline-flex;  /* Keeps elements in one row and centers */
                          gap: 50px;  /* Increased gap for more horizontal space */
                          align-items: center;
                          justify-content: center;
                          color: #000000;
                          direction: ltr;
                          font-family: Chivo, sans-serif;
                          font-size: 14px;
                          font-weight: 400;
                          letter-spacing: 0px;
                          text-align: center;
                        "
                      >
                        <div style="text-align: center; padding: 0 10px;"> <!-- Added padding for extra horizontal space -->
                          <img
                            src="cid:star"
                            alt="rating"
                            style="width: 32px"
                          />
                          <div>Terrible</div>
                        </div>
                        <div style="text-align: center; padding: 0 10px;"> <!-- Added padding for extra horizontal space -->
                          <img
                            src="cid:star"
                            alt="rating"
                            style="width: 32px"
                          />
                          <div>Bad</div>
                        </div>
                        <div style="text-align: center; padding: 0 10px;"> <!-- Added padding for extra horizontal space -->
                          <img
                            src="cid:star"
                            alt="rating"
                            style="width: 32px"
                          />
                          <div>Okay</div>
                        </div>
                        <div style="text-align: center; padding: 0 10px;"> <!-- Added padding for extra horizontal space -->
                          <img
                            src="cid:star"
                            alt="rating"
                            style="width: 32px"
                          />
                          <div>Good</div>
                        </div>
                        <div style="text-align: center; padding: 0 10px;"> <!-- Added padding for extra horizontal space -->
                          <img
                            src="cid:star"
                            alt="rating"
                            style="width: 32px"
                          />
                          <div>Great</div>
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
              class="row row-6"
              role="presentation"
              width="100%"
                style="margin-top: -20px"
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
                                   <div style="float: left; width: auto;">Total</div>
                                    
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
                                    Booking ref: #
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
                                    booked with, which professional
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
