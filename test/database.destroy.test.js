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

const response = { ok: true }

test('should destroy a database - DELETE /db - nano.db.destroy', async () => {
  // mocks
  mockPool
    .intercept({ method: 'delete', path: '/db' })
    .reply(200, response, JSON_HEADERS)

  // test DELETE /db
  const p = await nano.db.destroy('db')
  assert.equal(typeof p, 'object')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should handle non-existant database - DELETE /db - nano.db.destroy', async () => {
  // mocks
  mockPool.intercept({ method: 'delete', path: '/db' }).reply(404, {
    error: 'not_found',
    reason: 'Database does not exist.'
  }, JSON_HEADERS)

  // test DELETE /db
  await assert.rejects(nano.db.destroy('db'), 'Database does not exist')
  mockAgent.assertNoPendingInterceptors()
})

test('should not attempt to destroy database with empty database name - nano.db.destroy', async () => {
  await assert.rejects(nano.db.destroy(), { message: 'Invalid parameters' })
  await assert.rejects(nano.db.destroy(''), { message: 'Invalid parameters' })
})

test('should detect missing parameters (callback) - nano.db.destroy', () => {
  return new Promise((resolve, reject) => {
    nano.db.destroy(undefined, (err, data) => {
      assert.notEqual(err, null)
      resolve()
    })
  })
})
