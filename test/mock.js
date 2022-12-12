const COUCH_URL = 'http://127.0.0.1:5984'
const JSON_HEADERS = { headers: { 'content-type': 'application/json' } }
const { MockAgent, setGlobalDispatcher } = require('undici')
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
