const origin = '655 South Hope Street 901 Los Angeles California 90017'
const address = '128 City Road, London, United Kingdom, EC1V 2NX'
const copyRight = 'Copyright © 2025 trim'
const supportEmail = 'support@trimworldwide.com'
const supportNumber = '017874854624'

exports.newFooter = `<tr>
            <td style="padding: 20px; text-align: center;">
                <div style="font-size: 15px; font-family: 'Switzer', sans-serif; font-weight: 400; color: rgba(0, 0, 0, 0.8); line-height: 20px;">
                    If you have any questions or need help, please check our FAQ or email <a href="mailto:${supportEmail}" style="color: black; text-decoration: none;">${supportEmail}</a>.
                </div>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding: 20px;">
                <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                        <td style="padding: 0 4px;">
                            <a href="https://www.linkedin.com" target="_blank"><img src="cid:linkedin" alt="LinkedIn" style="width: 32px; height: 32px; display: block;"></a>
                        </td>
                        <td style="padding: 0 4px;">
                            <a href="https://www.facebook.com" target="_blank"><img src="cid:facebook" alt="Facebook" style="width: 32px; height: 32px; display: block;"></a>
                        </td>
                        <td style="padding: 0 4px;">
                            <a href="https://twitter.com" target="_blank"><img src="cid:twitter" alt="Twitter" style="width: 32px; height: 32px; display: block;"></a>
                        </td>
                        <td style="padding: 0 4px;">
                            <a href="https://instagram.com" target="_blank"><img src="cid:instagram" alt="Instagram" style="width: 32px; height: 32px; display: block;"></a>
                        </td>
                    </tr>
                </table>
                <div style="margin-top: 20px; font-size: 16px; font-family: 'Switzer', sans-serif; font-weight: 600;">
                    Follow Us
                </div>
                <div style="margin-top: 10px; font-size: 14px; font-family: 'Switzer', sans-serif; font-weight: 500;">
                    ${address}
                </div>
                <div style="margin-top: 5px; font-size: 13px; font-family: 'Switzer', sans-serif; font-weight: 400;">
                    ${copyRight}
                </div>
                <div style="font-size: 13px; font-family: 'Switzer', sans-serif; font-weight: 400; text-decoration: underline;">
                    <a href="#" style="color: black; text-decoration: underline;"></a>
                </div>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding: 20px;">
                <div style="font-size: 16px; font-family: 'Work Sans', sans-serif; color: rgba(0, 0, 0, 0.6);">
                    Powered by
                </div>
                <img src="cid:logo" alt="Powered by Trim" style="width: 119px; height: 40px; margin-top: 10px;">
            </td>
        </tr>
    </table>
</body>
</html>
`
