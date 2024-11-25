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

test('should be able to head a document - HEAD /db/id - db.head', async () => {
  // mocks
  const headers = {
    'content-type': 'application/json',
    etag: '1-123'
  }
  mockPool
    .intercept({
      method: 'head',
      path: '/db/id'
    })
    .reply(200, '', { headers })

  // test HEAD /db
  const db = nano.db.use('db')
  const p = await db.head('id')
  // headers get lowercased
  assert.equal(p.etag, '1-123')
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to head a missing document - HEAD /db/id - db.head', async () => {
  // mocks
  mockPool
    .intercept({
      method: 'head',
      path: '/db/id'
    })
    .reply(404, '', JSON_HEADERS)

  // test HEAD /db
  const db = nano.db.use('db')
  await assert.rejects(db.head('id'), { message: 'couch returned 404' })
  mockAgent.assertNoPendingInterceptors()
})

test('should detect missing parameters - db.head', async () => {
  const db = nano.db.use('db')
  await assert.rejects(db.head(), { message: 'Invalid parameters' })
})

