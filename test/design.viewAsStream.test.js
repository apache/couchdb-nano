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

import test from 'node:test'
import assert from 'node:assert/strict'
import { COUCH_URL, mockAgent, mockPool, JSON_HEADERS } from './mock.js'
import Nano from '../lib/nano.js'
const nano = Nano(COUCH_URL)

test('should be able to access a MapReduce view as a stream - GET /db/_design/ddoc/_view/viewname - db.viewAsStream', async () => {
  // mocks
  const response = {
    rows: [
      { key: null, value: 23515 }
    ]
  }
  mockPool
    .intercept({ path: '/db/_design/ddoc/_view/viewname' })
    .reply(200, response, JSON_HEADERS)
    
  const db = nano.db.use('db')
  const s = await db.viewAsStream('ddoc', 'viewname')
  let buffer = ''
  s.on('data', (chunk) => {
    buffer += chunk.toString()
  })
  s.on('end', () => {
    assert.equal(buffer, JSON.stringify(response))
    mockAgent.assertNoPendingInterceptors()
  })
})
