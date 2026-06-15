const { getFirebaseAdmin } = require('./firebaseAdmin')
const { pushNotification } = require('../models')

// Function to send notification using Firebase Admin SDK
module.exports = async function Throw(to, notification, data) {
  console.log('🚀 ~ Throw ~ to:', to)
  // Ensure `data` is an object and has string values

  const validData = data && typeof data === 'object' ? data : {}

  for (const key in validData) {
    if (typeof validData[key] !== 'string') {
      validData[key] = String(validData[key]) // Convert non-string values to strings
    }
  }

  const message = {
    tokens: to, // Use tokens for multiple devices
    notification,
    data: validData, // Ensure data is a valid object
  }

  const admin = getFirebaseAdmin()
  if (!admin) {
    console.error('Firebase Admin not configured — notification not sent.')
    return
  }

  try {
    if (to && to.length > 0) {
      console.log('🚀 ~ Throw ~ to: Not-Empty')
      const response = await admin.messaging().sendEachForMulticast(message)
      console.log('Successfully sent message:', response)
    }
  } catch (error) {
    console.error('Error sending message:', error)
  }
}
