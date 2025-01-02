const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

const { attachments } = require('./attactments')
const attachment = attachments()
const { transporter } = require('./transpoter')
const { footer } = require('./footer')
const { emailDateFormate } = require('../utils/emailDateFormate')

const { CURRENCY_UNIT } = process.env
module.exports = function (html) {
  transporter.sendMail(
    {
      from: process.env.EMAIL_USERNAME, // sender address
      to: ['sigidevelopers@gmail.com'], // list of receivers
      subject: `Demo For testing Email Templete.`, // Subject line
      // attachments: attachment.footer.concat(attachment.confirm),
      html: html,
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
