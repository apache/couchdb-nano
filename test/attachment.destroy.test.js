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

test('should be able to destroy an attachment - DELETE /db/id/attname - db.attachment.destroy', async () => {
  // mocks
  const response = { ok: true, id: 'id', rev: '2-456' }
  mockPool.intercept({
    method: 'delete',
    path: '/db/id/logo.jpg?rev=1-123'
  }).reply(200, response, JSON_HEADERS)

  // test DELETE DELETE /db/id/attname
  const db = nano.db.use('db')
  const p = await db.attachment.destroy('id', 'logo.jpg', { rev: '1-123' })
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to handle 409 conflicts - DELETE /db/id/attname- db.attachment.destroy', async () => {
  // mocks
  const response = {
    error: 'conflict',
    reason: 'Document update conflict.'
  }
  mockPool.intercept({
    method: 'delete',
    path: '/db/id/logo.jpg?rev=1-123'
  }).reply(409, response, JSON_HEADERS)

  // test DELETE /db/id/attname
  const db = nano.db.use('db')
  await assert.rejects(db.attachment.destroy('id', 'logo.jpg', { rev: '1-123' }), { message: 'Document update conflict.' })
  mockAgent.assertNoPendingInterceptors()
})

test('should detect missing doc id - db.attachment.destroy', async () => {
  const db = nano.db.use('db')
  await assert.rejects(db.attachment.destroy(), { message: 'Invalid parameters' })
  await assert.rejects(db.attachment.destroy('id'), { message: 'Invalid parameters' })
  await assert.rejects(db.attachment.destroy('id', ''), { message: 'Invalid parameters' })
  await assert.rejects(db.attachment.destroy('', 'logo.jpg'), { message: 'Invalid parameters' })
})

test('should detect missing parameters (callback) - db.attachment.destroy', () => {
  const db = nano.db.use('db')
  return new Promise((resolve, reject) => {
    db.attachment.destroy(undefined, undefined, undefined, (err, data) => {
      assert.notEqual(err, null)
      resolve()
    })
  })
})
