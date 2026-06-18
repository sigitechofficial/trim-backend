const { getFirebaseAdmin } = require('./firebaseAdmin')
const { pushNotification } = require('../models')

// Function to send notification using Firebase Admin SDK
module.exports = async function Throw(
  to,
  notification,
  data,
  userId = null,
  broadcastTo = null,
) {
  console.log('ðŸš€ ~ Throw ~ to:', to)
  console.log("Tokens =============================>>>>>>>>>>>>>",to)
  console.log("notification =============================>>>>>>>>>>>>>",notification)
  console.log("data======================================>>>>>>>",data)
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
  else if (
    validData.type === 'rentChairAdvertisementEnquiry' ||
    validData.type === 'rentChairAdvertisementEnquiryMessage'
  )
    input.type = 'advert'
  if (broadcastTo) input.to = broadcastTo

  pushNotification.create(input)

  const message = {
    tokens: [...new Set(to)], // Use tokens for multiple devices
    notification,
    data: validData, // Ensure data is a valid object
  }
  
  console.log("message=========MSG MSG =====>>>",message)

  const admin = getFirebaseAdmin()
  if (!admin) {
    console.error('Firebase Admin not configured — notification not sent.')
    return
  }

  try {
  const response = await admin.messaging().sendEachForMulticast(message);
  if (response.failureCount > 0) {
    response.responses.forEach((resp, index) => {
      if (!resp.success) {
        console.error(`Error sending message to token ${to[index]}:`, resp.error);
      }
    });
  }
} catch (error) {
  console.error('Error while sending the notification:', error);
}
}
