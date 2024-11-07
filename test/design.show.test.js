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

test('should be able to use a show function - GET /db/_design/ddoc/_show/showname/docid - db.show', async () => {
  const showFunction = function (doc, req) {
    return 'Hello, world!'
  }
  // mocks
  mockPool
    .intercept({ path: '/db/_design/ddoc/_show/showname/docid' })
    .reply(200, showFunction(), { headers: { 'content-type': 'text/plain' } })

  // test GET /db/_design/ddoc/_show/showname/docid
  const db = nano.db.use('db')
  const p = await db.show('ddoc', 'showname', 'docid')
  assert.equal(p, showFunction())
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to handle 404 - db.show', async () => {
  // mocks
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  mockPool
    .intercept({ path: '/db/_design/ddoc/_show/showname/docid' })
    .reply(404, response, JSON_HEADERS)

  // test GET /db/_design/ddoc/_show/showname/docid
  const db = nano.db.use('db')
  await assert.rejects(db.show('ddoc', 'showname', 'docid'), { message: 'missing' })
  mockAgent.assertNoPendingInterceptors()
})

test('should detect missing parameters - db.show', async () => {
  const db = nano.db.use('db')
  await assert.rejects(db.show(), { message: 'Invalid parameters' })
  await assert.rejects(db.show('ddoc'), { message: 'Invalid parameters' })
  await assert.rejects(db.show('ddoc', 'showname'), { message: 'Invalid parameters' })
  await assert.rejects(db.show('', 'showname', 'docid'), { message: 'Invalid parameters' })
})

