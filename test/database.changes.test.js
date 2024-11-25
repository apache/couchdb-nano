// Licensed under the Apache License, Version 2.0 (the 'License'); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

const test = require('node:test')
const assert = require('node:assert/strict')
const { COUCH_URL, mockAgent, mockPool, JSON_HEADERS } = require('./mock.js')
const Nano = require('..')
const nano = Nano(COUCH_URL)

const response = {
  results: [
    {
      seq: '1-nC1J',
      id: 'c42ddf1272c7d05b2dc45b6962000b10',
      changes: [
        {
          rev: '1-23202479633c2b380f79507a776743d5'
        }
      ]
    }
  ],
  last_seq: '1-C1J',
  pending: 0
}
const errResponse = {
  error: 'not_found',
  reason: 'Database does not exist.'
}

test('should be able to fetch the changes - GET /db/_changes - nano.db.changes', async () => {
  // mocks
  mockPool
    .intercept({ path: '/db/_changes' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/_changes
  const p = await nano.db.changes('db')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to fetch the changes with opts - GET /db/_changes - nano.db.changes', async () => {
  // mocks
  const opts = { include_docs: true, feed: 'continuous' }
  mockPool
    .intercept({ path: '/db/_changes?include_docs=true&feed=continuous' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/_changes
  const p = await nano.db.changes('db', opts)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to handle a missing database - GET /db/_changes - nano.db.changes', async () => {
  // mocks
  mockPool
    .intercept({ path: '/db/_changes' })
    .reply(404, errResponse, JSON_HEADERS)

  // test GET /db/_changes
  await assert.rejects(nano.db.changes('db'), { message: 'Database does not exist.' })
  mockAgent.assertNoPendingInterceptors()
})

test('should not attempt invalid parameters - nano.db.changes', async () => {
  await assert.rejects(nano.db.changes(), { message: 'Invalid parameters' })
  await assert.rejects(nano.db.changes(''), { message: 'Invalid parameters' })
})

test('should be able to fetch the changes from db.changes - GET /db/_changes - db.changes', async () => {
  // mocks
  mockPool
    .intercept({ path: '/db/_changes' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/_changes
  const db = nano.db.use('db')
  const p = await db.changes()
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})
