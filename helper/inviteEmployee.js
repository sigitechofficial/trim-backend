const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

const { attachments } = require('./attactments')
const attachment = attachments()
const { transporter } = require('./transpoter')
const { newFooter } = require('./newFooter')

module.exports = function (to = [], data) {
  const greetings = `Hi ${data?.name || ''}, you’re invited to join ${data?.salonName} on Trim Business!`
  let subject = `Hi ${data?.name || ''} welcome to trim, We're Glad to Have You!`

  transporter.sendMail(
    {
      from: process.env.EMAIL_USERNAME, // sender address
      to: to.concat(['sigitesting5@gmail.com', 'sigidevelopers@gmail.com']), // list of receivers
      subject: subject, // Subject line
      attachments: attachment.footer.concat(attachment.trim),
      html: `

      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link
            href="https://fonts.googleapis.com/css2?family=Chivo:ital,wght@0,100..900;1,100..900&display=swap"
            rel="stylesheet"
          />
          <title>Trim Employee Invitation</title>
          <style>
            * {
              box-sizing: border-box;
            }
      
            body {
              margin: 0;
              padding: 0;
            }
      
            @media (max-width: 520px) {
              .congrats-icon{
                display: none;
              }
            }
            
          </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f8f8;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; max-width: 600px; background: #f8f8f8;">
              <tr>
                  <td align="center" style="padding: 20px;">
                      <img src="cid:trim" alt="Logo" style="display: block; width: 84px; height: 92px;">
                  </td>
              </tr>
              <tr class="congrats-icon">
                  <td align="start" style="padding: 0px;">
                      <div style="font-size: 60px; font-family: 'Work Sans', sans-serif">🎉</div>
                  </td>
              </tr>
              <tr>
                  <td style="padding: 20px;">
                      <div style="text-align: center; color: black; font-size: 28px; font-family: 'Chivo', sans-serif; font-weight: 700;">
                        ${greetings}
                      </div>
                      <div style="text-align: center; color: black; font-size: 17px; font-family: 'Work Sans', sans-serif; font-weight: 400; margin-top: 10px;">
                          Trim is the UK's go-to platform for barbers
                      </div>
                  </td>
              </tr>
              <tr>
                  <td align="center" style="padding: 20px;">
                      <a href="${data?.link || 'https://trimworldwide.com/LoginScreen'}" style="display: inline-block; padding: 12px 24px; background-color: black; color: white; font-size: 16px; font-family: 'Work Sans', sans-serif; font-weight: 700; text-decoration: none; border-radius: 8px;">Accept invite</a>
                      <div style="color: black; font-size: 17px; font-family: 'Work Sans', sans-serif; font-weight: 400; margin-top: 20px;">
                         <b>Email</b> : ${data?.email}
                      </div>
                       <div style="color: black; font-size: 17px; font-family: 'Work Sans', sans-serif; font-weight: 400; margin-top: 20px;">
                         <b>Password</b> : ${data?.password}
                      </div>
                  </td>
              </tr>

       ${newFooter}
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
