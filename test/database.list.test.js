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
const response = ['rita', 'sue', 'bob']

test('should be to get list of databases - GET /_all_dbs - nano.db.list', async () => {
  // mocks
  mockPool
    .intercept({ path: '/_all_dbs' })
    .reply(200, response, JSON_HEADERS)

  // test GET /_all_dbs
  const p = await nano.db.list()
  assert.equal(typeof p, 'object')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})
