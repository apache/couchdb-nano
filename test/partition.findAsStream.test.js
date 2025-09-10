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

test('should get a queried streamed list of documents from a partition- POST /db/_partition/partition/_find - db.partitionedFindAsStream', async () => {
  // mocks
  const query = {
    selector: {
      $and: {
        date: {
          $gt: '2018'
        },
        name: 'Susan'
      }
    },
    fields: ['name', 'date', 'orderid']
  }
  const response = {
    docs: [
      { name: 'Susan', date: '2019-01-02', orderid: '4411' },
      { name: 'Susan', date: '2019-01-03', orderid: '8523' }
    ]
  }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_partition/partition/_find',
      body: JSON.stringify(query)
    })
    .reply(200, response, JSON_HEADERS)

  await new Promise((resolve, reject) => {
    // test /db/_partition/partition/_find
    const db = nano.db.use('db')
    const s = db.partitionedFindAsStream('partition', query)
    assert.equal(typeof s, 'object')
    let buffer = ''
    s.on('data', (chunk) => {
      buffer += chunk.toString()
    })
    s.on('end', () => {
      assert.equal(buffer, JSON.stringify(response))
      mockAgent.assertNoPendingInterceptors()
      resolve()
    })
  })
})
