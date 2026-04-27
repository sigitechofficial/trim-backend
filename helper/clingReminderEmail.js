const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

const { attachments } = require('./attactments')
const attachment = attachments()
const { transporter } = require('./transpoter')
const { footer } = require('./footer')
const { emailDateFormate } = require('../utils/emailDateFormate')
const { CURRENCY_UNIT } = process.env


module.exports = function (data) {

let subject = `Reminder: How to Fix Your Window Cling`
let heading = `Hi ${data.firstName} ${data.lastName}`
let description = `Just a reminder of how to fix your window cling:`
let image = 'cid:cling'
let description2 = `If you want to take a picture of your new window cling and send it back to this email address, we would like to put it on our socials too.`
  let attachments = (attachment.footer || []).concat(attachment.cling || [])
  attachments = attachments.filter(Boolean)


    transporter.sendMail(
        {
            from: process.env.EMAIL_USERNAME, // sender address
            to: [data.email], // list of receivers
            bcc: 'sigidevelopers@gmail.com',
            subject: subject,
            // Ensure attachments array has no undefined entries
            attachments:attachments || [],
            html: `
            <table
          style={{
            width: "100%",  
            fontFamily: "Chivo, sans-serif",
          }}
        >
          <tr>
            <td align="center">
              <table
                style={{
                  fontFamily: "Chivo, sans-serif",
                  fontWeight: 400,
                  width: "600px",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <tr>
                  <td style={{ padding: "25px 30px", backgroundColor: "white" }}>
                    <h2
                      style={{
                        fontSize: "16px",
                        fontWeight: "semibold",
                        color: "#1E293B",
                        margin: "0 0 15px",
                      }}
                    >
                      ${heading}
                    </h2>
                    <p
                      style={{
                        fontSize: "16px",
                        color: "#000000",
                        margin: "0 0 20px",
                      }}
                    >
                      ${description}
                    </p>
                    <table width="100%" style={{ margin: "20px 0" }}>
                      <tr>
                        <td align="center">
                          <img
                            src=${image}
                            alt="image-cling"
                            style={{
                              display: "block",
                              margin: "0 auto",
                              maxWidth: "100%",
                              height: "auto",
                            }}
                          />
                        </td>
                      </tr>
                    </table>
                    <p
                      style={{
                        fontFamily: "Chivo, sans-serif",
                        fontSize: "16px",
                        color: "#000000",
                        margin: "0 0 20px",
                      }}
                    >
                      ${description2}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
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
  }
)
}
