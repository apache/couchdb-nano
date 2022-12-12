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

test('should be able to destroy a document - DELETE /db/id - db.destroy', async () => {
  // mocks
  const response = { ok: true, id: 'id', rev: '2-456' }
  mockPool
    .intercept({
      method: 'delete',
      path: '/db/id?rev=1-123'
    })
    .reply(200, response, JSON_HEADERS)

  // test DELETE /db/id
  const db = nano.db.use('db')
  const p = await db.destroy('id', '1-123')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to handle 409 conflicts - DELETE /db/id - db.destroy', async () => {
  // mocks
  const response = {
    error: 'conflict',
    reason: 'Document update conflict.'
  }
  mockPool
    .intercept({
      method: 'delete',
      path: '/db/id?rev=1-123'
    })
    .reply(409, response, JSON_HEADERS)

  // test DELETE /db/id
  const db = nano.db.use('db')
  await assert.rejects(db.destroy('id', '1-123'), { message: 'Document update conflict.' })
  mockAgent.assertNoPendingInterceptors()
})

test('should detect missing parameters - db.destroy', async () => {
  const db = nano.db.use('db')
  await assert.rejects(db.destroy(undefined, '1-123'), { message: 'Invalid parameters' })
})

test('should detect missing parameters (callback) - db.destroy', async () => {
  await new Promise((resolve, reject) => {
    const db = nano.db.use('db')
    db.destroy(undefined, undefined, (err, data) => {
      assert.notEqual(err, null)
      resolve()
    })
  })
})
