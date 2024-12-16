require('dotenv').config();
const { verify } = require('jsonwebtoken');

module.exports = async function publicProtected(req, res, next) {
  try {
    if (req.header('accessToken')){
      const validToken = verify(req.header('accessToken'), process.env.JWT_ACCESS_SECRET);
      req.user = validToken;
      console.log('🚀 ~ file: req.user:',req.user.id);
      next();
    } else{
      next();
    }
  } catch (error) {
    return res.json({
      status: '0',
      message: 'Access Denied',
      data: {},
      error: 'You are not authorized to access it'
    });
  }
};
