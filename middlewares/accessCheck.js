require('dotenv').config()
const { verify } = require('jsonwebtoken')
const { deviceToken } = require('../models')

module.exports = async function validateToken(req, res, next) {
  try {
    console.log(`🚀------URL------ > URL: ${req.url}`)
    const acccessToken = req.header('accessToken')
    // console.log('🚀 ~ validateToken ~ acccessToken:', acccessToken)
    //If no token -- Throw Error
    if (!acccessToken) throw new Error()
    // Verify Token , If not auto Throw Error
    const validToken = verify(acccessToken, process.env.JWT_ACCESS_SECRET)
    console.log('🚀 ~ validateToken ~ validToken:', validToken)
    req.user = validToken
    console.log('🚀 ~ validateToken ~  req.user:', req.user)
    const check = await deviceToken.findOne({
      where: { tokenId: req.user.dvToken },
      attributes: ['id'],
      //not working for employee cause we pass salon id in employee accessToken ,userId: req.user.id
    })
    console.log('🚀 ~ validateToken ~ check:', check)

    if (check) {
      console.log('🚀 ~ validateToken ~ check:')
      next()
    } else {
      return res.json({
        status: '0',
        message: 'Access Denied',
        data: {},
        error: 'You are not authorized to access it',
      })
    }
  } catch (error) {
    return res.json({
      status: '0',
      message: 'Access Denied',
      data: {},
      error: 'You are not authorized to access it',
    })
  }
}
