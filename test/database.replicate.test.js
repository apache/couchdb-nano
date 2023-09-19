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
  history: [],
  ok: true,
  replication_id_version: 3,
  session_id: '142a35854a08e205c47174d91b1f9628',
  source_last_seq: 28
}

test('should be able to send replication request with local database names - POST /_replicate - nano.db.replicate', async () => {
  // mocks
  mockPool.intercept({
    method: 'post',
    path: '/_replicate',
    body: JSON.stringify({ source: COUCH_URL + '/source', target: COUCH_URL + '/target' })
  }).reply(200, response, JSON_HEADERS)

  // test POST /_replicate
  const p = await nano.db.replicate('source', 'target')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to send replication request with URLs - POST /_replicate - nano.db.replicate', async () => {
  // mocks
  const source = 'http://mydomain1.com/source'
  const target = 'https://mydomain2.com/target'
  mockPool.intercept({
    method: 'post',
    path: '/_replicate',
    body: JSON.stringify({ source, target })
  }).reply(200, response, JSON_HEADERS)

  // test POST /_replicate
  const p = await nano.db.replicate(source, target)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to supply additional parameters - POST /_replicate - nano.db.replicate', async () => {
  // mocks
  const source = 'http://mydomain1.com/source'
  const target = 'https://mydomain2.com/target'
  const opts = { filter: 'ddoc/func', continuous: true }
  mockPool.intercept({
    method: 'post',
    path: '/_replicate',
    body: JSON.stringify(Object.assign(opts, { source, target }))
  }).reply(200, response, JSON_HEADERS)

  // test POST /_replicate
  const p = await nano.db.replicate(source, target, opts)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should not attempt compact invalid parameters - nano.db.replicate', async () => {
  await assert.rejects(nano.db.replicate(''), { message: 'Invalid parameters' })
  await assert.rejects(nano.db.replicate(undefined, 'target'), { message: 'Invalid parameters' })
  await assert.rejects(nano.db.replicate('', 'target'), { message: 'Invalid parameters' })
})

test('should detect missing parameters (callback) - nano.db.replicate', () => {
  return new Promise((resolve, reject) => {
    nano.db.replicate(undefined, undefined, undefined, (err, data) => {
      assert.notEqual(err, null)
      resolve()
    })
  })
})

test('should be replicate from db.replicate - POST /_replicate - db.replicate', async () => {
  // mocks
  mockPool.intercept({
    method: 'post',
    path: '/_replicate',
    body: JSON.stringify({ source: COUCH_URL + '/source', target: COUCH_URL + '/target' })
  }).reply(200, response, JSON_HEADERS)

  // test POST /_replicate
  const db = nano.db.use('source')
  const p = await db.replicate('target')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})
