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

test('should be able to log output with user-defined function', async () => {
  // setup Nano with custom logger
  const logs = []
  const nano = Nano({
    url: COUCH_URL,
    log: (data) => {
      logs.push(data)
    }
  })

  // mocks
  const response = { _id: 'id', rev: '1-123', a: 1, b: 'two', c: true }
  mockPool
    .intercept({ path: '/db/id' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/id
  const db = nano.db.use('db')
  const p = await db.get('id')
  assert.deepEqual(p, response)
  assert.equal(logs.length, 2)
  mockAgent.assertNoPendingInterceptors()
})
