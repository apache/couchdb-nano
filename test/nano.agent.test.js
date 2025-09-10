import undici from 'undici'
import test from 'node:test'
import assert from 'node:assert/strict'
import { COUCH_URL, mockAgent } from './mock.js'
import Nano from '../lib/nano.js'

test('should be able to supply a custom agent parameters', async () => {
  const agentOptions = {
    bodyTimeout: 10000
  }
  const undiciOptions = new undici.Agent(agentOptions)
  const nano = Nano({ url: COUCH_URL, undiciOptions })
  assert.equal(nano.config.agent, nano.config.agent)
})

test('should be able to supply a custom agent', async () => {
  const nano = Nano({ url: COUCH_URL, agentOptions: mockAgent })
  assert.equal(nano.config.agent, mockAgent)
})
