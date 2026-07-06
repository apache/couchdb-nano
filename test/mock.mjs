import { MockAgent, setGlobalDispatcher } from 'undici'

export const mockAgent = new MockAgent()
mockAgent.disableNetConnect()



export const COUCH_URL = 'http://127.0.0.1:5984'
export const JSON_HEADERS = { headers: { 'content-type': 'application/json' } }
export const mockPool = mockAgent.get(COUCH_URL)
setGlobalDispatcher(mockAgent)
