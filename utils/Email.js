const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });

const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');


module.exports = class Email {
  constructor(user) {
    this.to = user.email;
    this.firstName = `${user.firstName} ${user.lastName}`;
    this.from = `"Trim" <${process.env.EMAIL_USERNAME}>`; // Update "Your Name" with your name or organization name
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true, // use TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send the actual email with raw HTML and attachments
  async send(html, subject, attachments = []) {
    try {
      // Define email options
      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text: htmlToText.convert(html),
        attachments,
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
    } catch (error) {
      console.error('Error sending email:', error);
      // Log the error and continue execution without throwing it
    }
  }
};
