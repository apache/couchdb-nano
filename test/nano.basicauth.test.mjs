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
import { COUCH_URL, mockAgent, mockPool, JSON_HEADERS } from './mock.mjs'
import Nano from '../lib/nano.mjs'
const unencodedAuth = 'admin[:admin]'
const encodedAuth = `${encodeURIComponent('admin[')}:${encodeURIComponent('admin]')}`
const nano = Nano({ url: `http://${encodedAuth}@127.0.0.1:5984` })
import pkg from '../package.json' with { type: 'json' }

test('should handle special characters in username & password', async () => {
  // mocks
  const auth = 'Basic ' + Buffer.from(unencodedAuth).toString('base64')
  mockPool
    .intercept({
      path: '/_all_dbs',
      headers: {
        'authorization': auth,
        'content-type': 'application/json'
      }
    })
    .reply(200, ['a'], JSON_HEADERS)

  // test POST /_session
  const q = await nano.db.list()
  assert.deepEqual(q, ['a'])
  mockAgent.assertNoPendingInterceptors()
})
