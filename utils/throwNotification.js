const admin = require('firebase-admin')
const serviceAccount = require('../firebase.json')
const { pushNotification } = require('../models')

// Initialize Firebase Admin SDK using the service account JSON file
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

// Function to send notification using Firebase Admin SDK
module.exports = async function Throw(
  to,
  notification,
  data,
  userId = null,
  broadcastTo = null,
) {
  console.log('🚀 ~ Throw ~ to:', to)
  // Ensure `data` is an object and has string values

  const validData = data && typeof data === 'object' ? data : {}

  for (const key in validData) {
    if (typeof validData[key] !== 'string') {
      validData[key] = String(validData[key]) // Convert non-string values to strings
    }
  }

  input = {
    at: new Date(),
    title: notification.title,
    body: notification.body,
    data: validData,
    userId: userId,
  }
  if (validData.rating) input.type = 'rating'
  if (broadcastTo) input.to = broadcastTo

  pushNotification.create(input)

  const message = {
    tokens: to, // Use tokens for multiple devices
    notification,
    data: validData, // Ensure data is a valid object
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
