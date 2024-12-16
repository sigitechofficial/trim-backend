//TODO Not Using this For now
require('dotenv').config()
const redis = require('redis')

// connecting to redis
const redisClient = redis.createClient({
  host: 'localhost',
  port: '6379',
  pass: '',
})
redisClient.on('connect', () => {
  console.log('redis client connected')
})
redisClient.on('error', (err) => {
  console.log('Error : Redis Connection Failed', err)
})
async function test() {
  await redisClient.connect()
}
test()
module.exports = redisClient
