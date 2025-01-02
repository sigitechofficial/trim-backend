const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

const { attachments } = require('./attactments')
const attachment = attachments()
const { transporter } = require('./transpoter')
const { footer } = require('./footer')

module.exports = function (to, data) {
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
    <title>Trim Employee Invitation</title>
</head>
<body>
<div style="display: flex; flex-direction: column; align-items: center;">
<div style="margin: auto ;width: 414px; height: 950px; padding-top: 62px; padding-bottom: 62px; padding-left: 20px; padding-right: 19px; background: white; flex-direction: column; justify-content: flex-start; align-items: center; gap: 52px; display: inline-flex">
        <img style="width: 84px; height: 92px" src="cid:trim" alt="Logo" />
        <div style="align-self: stretch; height: 772px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 32px; display: inline-flex">
          <div style="margin-bottom: 30px width: 102px; height: 102px; color: black; font-size: 113.68px; font-family: Work Sans; font-weight: 500; word-wrap: break-word">🎉</div>
          <div style="align-self: stretch; height: 638px; flex-direction: column; justify-content: flex-start; align-items: flex-end; gap: 40px; display: flex">
            <div style="align-self: stretch; height: 236px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 28px; display: flex">
              <div style="align-self: stretch; height: 108px; flex-direction: column; justify-content: flex-start; align-items: flex-end; gap: 32px; display: flex">
                <div style="align-self: stretch; height: 108px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 32px; display: flex">
                  <div style="align-self: stretch; height: 108px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 22px; display: flex">
                    <div style="align-self: stretch; color: black; font-size: 28px; font-family: Chivo; font-weight: 700; word-wrap: break-word">${greetings}</div>
                    <div style="align-self: stretch; color: black; font-size: 17px; font-family: Work Sans; font-weight: 400; word-wrap: break-word">Trim is the UK's go to platform for barbers</div>
                  </div>
                </div>
              </div>
              <div style="width: 201px; height: 52px; padding: 8px; background: black; border-radius: 8px; justify-content: center; align-items: center; gap: 8px; display: inline-flex">
                <a href="${data.link}" ><div style="text-align: center; color: white; font-size: 16px; font-family: Work Sans; font-weight: 700; word-wrap: break-word">Accept invite</div></a>
              </div>
              <div style="align-self: stretch; color: black; font-size: 17px; font-family: Work Sans; font-weight: 400; word-wrap: break-word"><b>Email : </b>${data?.email}</div>
              <div style="align-self: stretch; color: black; font-size: 17px; font-family: Work Sans; font-weight: 400; word-wrap: break-word">Password : </b>${data?.password}</div>
            </div>
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
