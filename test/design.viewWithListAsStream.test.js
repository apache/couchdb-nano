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
import { COUCH_URL, mockAgent, mockPool } from './mock.js'
import Nano from '../lib/nano.js'
const nano = Nano(COUCH_URL)

test('should be able to access a MapReduce view with a list as a stream - GET /db/_design/ddoc/_list/listname/viewname - db.viewWithListAsStream', async () => {
  // mocks
  const response = '1,2,3\n4,5,6\n7,8,9\n'
  mockPool
    .intercept({ path: '/db/_design/ddoc/_list/listname/viewname' })
    .reply(200, response, { headers: { 'content-type': 'text/csv' } })

  await new Promise((resolve, reject) => {
    const db = nano.db.use('db')
    const s = db.viewWithListAsStream('ddoc', 'viewname', 'listname')
    assert.equal(typeof s, 'object')
    let buffer = ''
    s.on('data', (chunk) => {
      buffer += chunk.toString()
    })
    s.on('end', () => {
      assert.equal(buffer, response)
      mockAgent.assertNoPendingInterceptors()
      resolve()
    })
  })
})
