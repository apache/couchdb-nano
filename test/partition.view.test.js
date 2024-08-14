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

test('should be able to access a partitioned view index - GET /db/_partition/partition/_design/ddoc/_view/viewname - db.partitionedView', async () => {
  // mocks
  const response = {
    rows: [
      { key: null, value: 23515 }
    ]
  }
  mockPool
    .intercept({ path: '/db/_partition/partition/_design/ddoc/_view/viewname' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/_partition/partition/_design/ddoc/_view/viewname
  const db = nano.db.use('db')
  const p = await db.partitionedView('partition', 'ddoc', 'viewname')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to access a partitioned view index with opts - GET /db/_partition/partition/_design/ddoc/_view/viewname - db.partitionedView', async () => {
  // mocks
  const response = {
    rows: [
      { key: 'a', value: null }
    ]
  }
  const params = {
    reduce: false,
    startkey: 'a',
    endkey: 'b',
    limit: 1
  }
  mockPool
    .intercept({ path: '/db/_partition/partition/_design/ddoc/_view/viewname?reduce=false&startkey=%22a%22&endkey=%22b%22&limit=1' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/_partition/partition/_design/ddoc/_view/viewname
  const db = nano.db.use('db')
  const p = await db.partitionedView('partition', 'ddoc', 'viewname', params)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to handle 404 - db.partitionedView', async () => {
  // mocks
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  mockPool
    .intercept({ path: '/db/_partition/partition/_design/ddoc/_view/viewname' })
    .reply(404, response, JSON_HEADERS)

  // test GET /db/_partition/partition/_design/ddoc/_view/viewname
  const db = nano.db.use('db')
  await assert.rejects(db.partitionedView('partition', 'ddoc', 'viewname'), { message: response.reason })
  mockAgent.assertNoPendingInterceptors()
})

test('should detect missing parameters - db.partitionedView', async () => {
  const db = nano.db.use('db')
  await assert.rejects(db.partitionedView(), { message: 'Invalid parameters' })
  await assert.rejects(db.partitionedView('partition', 'susan'), { message: 'Invalid parameters' })
  await assert.rejects(db.partitionedView('partition', 'susan', ''), { message: 'Invalid parameters' })
  await assert.rejects(db.partitionedView('partition', '', 'susan'), { message: 'Invalid parameters' })
  await assert.rejects(db.partitionedView('partition', 'susan', '', undefined), { message: 'Invalid parameters' })
  await assert.rejects(db.partitionedView('partition', '', 'susan'), { message: 'Invalid parameters' })
})

test('should detect missing parameters (callback) - db.partitionedView', async () => {
  const db = nano.db.use('db')
  await new Promise((resolve, reject) => {
    db.partitionedView('', '', '', '', (err, data) => {
      assert.notEqual(err, null)
      resolve()
    })
  })
})
