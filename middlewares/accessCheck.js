require('dotenv').config()
const { verify } = require('jsonwebtoken')
const { deviceToken, user, employee, salonDetail } = require('../models')

module.exports = async function validateToken(req, res, next) {
  try {
    console.log(`🚀------URL------ > URL: ${req.url}`)
    const acccessToken = req.header('accessToken')
    // console.log('🚀 ~ validateToken ~ acccessToken:', acccessToken)
    //If no token -- Throw Error
    if (!acccessToken) {
      console.warn('🚨 accessCheck: missing accessToken', {
        url: req.url,
        method: req.method,
      })
      throw new Error()
    }
    // Verify Token , If not auto Throw Error
    const validToken = verify(acccessToken, process.env.JWT_ACCESS_SECRET)

    req.user = validToken
    console.log('🚀 ~ file: req.user:', req.user?.id)

    if (req.url == '/logout') {
      next()
    } else {
      let check = await deviceToken.findOne({
        where: { tokenId: req.user.dvToken, userId: req.user.id },
        attributes: ['id'],
        include: { model: user, where: { status: true }, attributes: [] },
      })

      // Staff JWT carries salon owner id; device token may still be on employee user
      if (!check && req.user?.dvToken) {
        const employeeDevice = await deviceToken.findOne({
          where: { tokenId: req.user.dvToken },
          attributes: ['id', 'userId'],
          include: {
            model: user,
            where: { status: true, userTypeId: 3 },
            attributes: [],
            required: true,
          },
        })

        if (employeeDevice) {
          // Only a current, unblocked team member gets the owner link back.
          const staffEmployee = await employee.findOne({
            where: { userId: employeeDevice.userId, deleted: false, status: true },
            attributes: ['id', 'salonDetailId'],
          })

          if (staffEmployee) {
            const salon = await salonDetail.findOne({
              where: {
                id: staffEmployee.salonDetailId,
                userId: req.user.id,
              },
              attributes: ['id'],
            })

            if (salon) {
              await deviceToken.findOrCreate({
                where: { tokenId: req.user.dvToken, userId: req.user.id },
                defaults: { status: true },
              })
              check = employeeDevice
            }
          }
        }
      }
      console.log('🚀 ~ validateToken ~ check:', check)

      if (check) {
        console.log('🚀 ~ validateToken ~ check:')
        next()
      } else {
        console.warn('🚨 accessCheck: token-user mismatch or revoked token', {
          url: req.url,
          method: req.method,
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
      method: req.method,
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
