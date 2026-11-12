const { Server } = require('socket.io')
const { unAcknowledgedEvents } = require('./models')
const { socketRooms, handshakeToken } = require('./helper/socketAuth')
let ioInstance

// Old apps send no token and join rooms by name. They keep working until
// SOCKET_AUTH_REQUIRED=true (the cut-off, once every user has a new app).
const authRequired = () => process.env.SOCKET_AUTH_REQUIRED === 'true'

async function authorizeSocket(socket, next) {
  try {
    const token = handshakeToken(socket.handshake)
    if (!token) {
      if (authRequired()) return next(new Error('unauthorized'))
      socket.data.rooms = null
      return next()
    }
    const access = await socketRooms(token)
    if (!access) return next(new Error('unauthorized'))
    socket.data.rooms = access.rooms
    socket.data.kind = access.kind
    return next()
  } catch (err) {
    return next(err)
  }
}

// May this socket be in `room`? Signed-in sockets: only their own rooms.
const mayJoin = (socket, room) => !socket.data.rooms || socket.data.rooms.has(String(room))

const initializeWebSocket = (server) => {
  const io = new Server(server, {
    pingTimeout: 1000, // Time (in ms) before the server considers the connection dead if no pong is received
    pingInterval: 500, // Time (in ms) between ping packets sent by the server to check client connectivity
  })
  ioInstance = io

  // A token in the handshake decides the rooms. A bad token is refused; no
  // token is allowed only until the cut-off.
  io.use(authorizeSocket)

  io.on('connection', async (socket) => {
    console.log(`🚀User connected: ${socket.id}${socket.data.rooms ? '' : ' (no token)'}`)
    // Signed-in sockets are put in their rooms straight away.
    if (socket.data.rooms) socket.join([...socket.data.rooms])

    socket.on('join-room', async (message) => {
      try {
        let data = JSON.parse(message)
        const userId = data.userId
        if (!mayJoin(socket, userId)) {
          console.warn(`🚨 socket ${socket.id} refused room ${userId}`)
          return
        }
        socket.join(userId)
        console.log(`🚀User ${userId} joined room ${userId}`)
        // Log which rooms this socket is connected to
        console.log(`🚀Socket ${socket.id} is connected to room: ${userId}`)
      } catch (error) {
        console.log(error)
      }
    })

    socket.on('re-connect', async (message) => {
      let data
      try {
        data = JSON.parse(message)
      } catch {
        return
      }
      const userId = data.userId
      if (!mayJoin(socket, userId)) {
        console.warn(`🚨 socket ${socket.id} refused room ${userId}`)
        return
      }
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

module.exports = { initializeWebSocket, sendEvent, authorizeSocket, mayJoin }
