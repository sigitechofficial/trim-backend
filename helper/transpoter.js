const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })
//Defining the account for sending email
console.log('🚀 ~ process.env.EMAIL_PORT:', process.env.EMAIL_PORT)
console.log('🚀 ~ process.env.EMAIL_HOST:', process.env.EMAIL_HOST)
console.log('🚀 ~ process.env.EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD)
console.log('🚀 ~ process.env.EMAIL_USERNAME:', process.env.EMAIL_USERNAME)
exports.transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  // secure: true, // use TLS
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  // tls: {
  //   rejectUnauthorized: false, // Ignore self-signed certificate error
  // },
})
