require('dotenv').config()
const redis = require('redis')

// connecting to redis
const redis_Client = redis.createClient({
  host: 'localhost',
  port: '6379',
  pass: '',
})
redis_Client.on('connect', function () {
  console.log('redis client connected')
})
redis_Client.on('error', function (err) {
  console.log('Error', err)
})
test()
async function test() {
  await redis_Client.connect()
}
module.exports = redis_Client
