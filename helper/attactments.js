function attachments() {
  const attachment = {
    logo: {
      filename: 'logo.png',
      path: `${__dirname}/images/logo.png`,
      cid: 'logo',
    },
    cancel: {
      filename: 'cancel.png',
      path: __dirname + '/images/cancel.png',
      cid: 'cancel',
    },
    confirm: {
      filename: 'confirm.png',
      path: __dirname + '/images/confirm.png',
      cid: 'confirm',
    },
    instagram: {
      filename: 'instagram.png',
      path: __dirname + '/images/instagram.png',
      cid: 'instagram',
    },
    facebook: {
      filename: 'facebook.png',
      path: __dirname + '/images/facebook.png',
      cid: 'facebook',
    },
    linkedin: {
      filename: 'linkedin.png',
      path: __dirname + '/images/linkedin.png',
      cid: 'linkedin',
    },
    forgotPassword: {
      filename: 'forgotPassword.webp',
      path: __dirname + '/images/forgotPassword.webp',
      cid: 'forgotPassword',
    },
    invite: {
      filename: 'invite.png',
      path: __dirname + '/images/invite.png',
      cid: 'invite',
    },
    salon: {
      filename: 'salon.png',
      path: __dirname + '/images/salon.png',
      cid: 'salon',
    },
    twitter: {
      filename: 'twitter.png',
      path: __dirname + '/images/twitter.png',
      cid: 'twitter',
    },
    welcome: {
      filename: 'welcome.png',
      path: __dirname + '/images/welcome.png',
      cid: 'welcome',
    },
    trim: {
      filename: 'trim.png',
      path: __dirname + '/images/trim.png',
      cid: 'trim',
    },
    star: {
      filename: 'star.png',
      path: __dirname + '/images/star.png',
      cid: 'star',
    },
  }

  return {
    welcome: [attachment.welcome],
    security: [attachment.forgotPassword],
    invite: [attachment.invite],
    star: [attachment.star],
    cancel: [attachment.cancel],
    confirm: [attachment.confirm],
    trim: [attachment.trim],
    footer: [
      attachment.logo,
      attachment.facebook,
      attachment.twitter,
      attachment.instagram,
      attachment.linkedin,
    ],
    // in-case we have other emails
    attachment,
  }
}
module.exports = { attachments }
