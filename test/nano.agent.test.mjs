import undici from 'undici'
import test from 'node:test'
import assert from 'node:assert/strict'
import { COUCH_URL, mockAgent } from './mock.mjs'
import Nano from '../lib/nano.mjs'

test('should be able to supply a custom agent parameters', async () => {
  const opts = {
    bodyTimeout: 10000
  }
  const agentOptions = new undici.Agent(opts)
  const nano = Nano({ url: COUCH_URL, agentOptions })
  assert.equal(nano.config.agent, agentOptions)
})

test('should be able to supply a custom agent', async () => {
  const nano = Nano({ url: COUCH_URL, agentOptions: mockAgent })
  assert.equal(nano.config.agent, mockAgent)
})
