const test = require('node:test')
const assert = require('node:assert/strict')
const { COUCH_URL, mockAgent } = require('./mock.js')
const Nano = require('../lib/nano')
const undici = require('undici')

test('should be able to supply a custom agent parameters', async () => {
  const opts = {
    bodyTimeout: 10000
  }
  const agentOptions = new undici.Agent(opts)
  const nano = Nano({ url: COUCH_URL, agentOptions })
  assert.equal(nano.config.agent, nano.config.agent)
})

test('should be able to supply a custom agent', async () => {
  const nano = Nano({ url: COUCH_URL, agentOptions: mockAgent })
  assert.equal(nano.config.agent, mockAgent)
})
