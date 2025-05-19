const { Server } = require('socket.io')
const { unAcknowledgedEvents } = require('./models')
let ioInstance
const initializeWebSocket = (server) => {
  const io = new Server(server, {
    pingTimeout: 1000, // Time (in ms) before the server considers the connection dead if no pong is received
    pingInterval: 500, // Time (in ms) between ping packets sent by the server to check client connectivity
  })
  ioInstance = io
  io.on('connection', async (socket) => {
    console.log(`🚀User connected: ${socket.id}`)
    socket.on('join-room', async (message) => {
      try {
        let data = JSON.parse(message)
        const userId = data.userId
        socket.join(userId)
        console.log(`🚀User ${userId} joined room ${userId}`)
        // Log which rooms this socket is connected to
        console.log(`🚀Socket ${socket.id} is connected to room: ${userId}`)
      } catch (error) {
        console.log(error)
      }
    })

    socket.on('re-connect', async (message) => {
      let data = JSON.parse(message)
      const userId = data.userId
      console.log('🚀 ~ RECONNECT ROOM JOIN:', userId)
      socket.join(userId)
      const rows = await unAcknowledgedEvents.findAll({ where: { to: userId } })
      rows.forEach((event) => {
        //console.log(`🚀ðŸš€ðŸš€Even a`, event)

        ioInstance
          .to(event.to)
          .emit(event.event, JSON.parse(event.data), async (ack) => {
            if (ack) {
              console.log(`🚀ðŸš€ðŸš€Even acknowledged by `)
              await unAcknowledgedEvents.destroy({ where: { id: event.id } })
              // Event was acknowledged, no further action needed
            } else {
              console.log(`🚀ðŸš€ðŸš€Event not acknowledged by `)
            }
          })
      })
    })

    socket.on('disconnect', () => {
      console.log(`Client ${socket.id} disconnected`)
    })
  })
  return io
}
//To trigger event
const sendEvent = async (userId, eventData) => {
  try {
    // console.log(
    //   `Event data for booking:} being sent: ${JSON.stringify(eventData.data)}`,
    // )

    // Send the event to the specific user
    ioInstance
      .to(userId.toString())
      .emit(eventData.event, eventData.data, async (ack) => {
        if (ack) {
          // console.log(
          //   `ðŸš€ðŸš€Event ${eventData.event} acknowledged by ${userId}`,
          // )
          // Event was acknowledged, no further action needed
        } else {
          // console.log(
          //   `ðŸš€ðŸš€Event ${eventData.event} not acknowledged by ${userId}`,
          // )
          // Event was not acknowledged, store it in the database
          await unAcknowledgedEvents.create({
            to: userId,
            event: eventData?.event,
            data: JSON.stringify(eventData?.data),
            bookingId: eventData?.bookingId,
          })
          // console.log(
          //   `ðŸš€ðŸš€ðŸš€Unacknowledged event stored for u90ser ${userId}`,
          // )
        }
      })
  } catch (error) {
    console.log(`Error while sending event: ${error}`)
  }
}

module.exports = { initializeWebSocket, sendEvent }
