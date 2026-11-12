// The request being handled, for code that is not handed `req` (helpers that
// get a user id). Set once per request in trim.js.
const { AsyncLocalStorage } = require('async_hooks')

const store = new AsyncLocalStorage()

function requestContext(req, res, next) {
  store.run({ req }, next)
}

const currentRequest = () => store.getStore()?.req || null

module.exports = { requestContext, currentRequest }
