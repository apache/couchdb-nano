const COUCH_URL = 'http://127.0.0.1:5984'
const JSON_HEADERS = { headers: { 'content-type': 'application/json' } }
const { install, MockAgent, setGlobalDispatcher } = require('undici')
install()
const mockAgent = new MockAgent()
mockAgent.disableNetConnect()
const mockPool = mockAgent.get(COUCH_URL)
setGlobalDispatcher(mockAgent)

module.exports = {
  COUCH_URL,
  JSON_HEADERS,
  mockAgent,
  mockPool
}
