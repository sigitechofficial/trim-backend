const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

const { attachments } = require('./attactments')
const attachment = attachments()
const { transporter } = require('./transpoter')
const { footer } = require('./footer')

module.exports = function (data) {
  transporter.sendMail(
    {
      from: process.env.EMAIL_USERNAME, // sender address
      to: ['sigidevelopers@gmail.com'], // list of receivers
      subject: 'subject', // Subject line
      attachments: attachment.footer.concat(attachment.trim),
      html: `${data}`,
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
