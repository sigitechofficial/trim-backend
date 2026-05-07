require('dotenv').config()
const { verify } = require('jsonwebtoken')
const { deviceToken, user } = require('../models')

module.exports = async function validateToken(req, res, next) {
  try {
    console.log(`🚀------URL------ > URL: ${req.url}`)
    const acccessToken = req.header('accessToken')
    // console.log('🚀 ~ validateToken ~ acccessToken:', acccessToken)
    //If no token -- Throw Error
    if (!acccessToken) throw new Error()
    // Verify Token , If not auto Throw Error
    const validToken = verify(acccessToken, process.env.JWT_ACCESS_SECRET)

    req.user = validToken
    console.log('🚀 ~ validateToken ~  req.user:', req.user?.id)

    if (req.url == '/logout') {
      next()
    } else {
      const check = await deviceToken.findOne({
        where: { tokenId: req.user.dvToken, userId: req.user.id },
        attributes: ['id'],
        include: { model: user, where: { status: true }, attributes: [] },
        //not working for employee cause we pass salon id in employee accessToken ,userId: req.user.id
      })
      console.log('🚀 ~ validateToken ~ check:', check)

      if (check) {
        console.log('🚀 ~ validateToken ~ check:')
        next()
      } else {
        console.warn('🚨 accessCheck: token-user mismatch or revoked token', {
          url: req.url,
          userId: req.user?.id,
          dvToken: req.user?.dvToken,
        })
        return res.json({
          status: '0',
          message: 'Access Denied',
          data: {},
          error: 'You are not authorized to access it',
        })
      }
    }
  } catch (error) {
    console.warn('🚨 accessCheck: token validation failed', {
      url: req.url,
      reason: error?.message,
    })
    return res.json({
      status: '0',
      message: 'Access Denied',
      data: {},
      error: 'You are not authorized to access it',
    })
  }
}
