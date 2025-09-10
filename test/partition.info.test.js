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
const db = nano.db.use('db')

const response = {
  db_name: 'db',
  sizes: {
    active: 12955,
    external: 15009
  },
  partition: 'partition',
  doc_count: 28,
  doc_del_count: 0
}

test('should be able to fetch partition info info - GET /db/_partition/partition - db.partitionInfo', async () => {
  // mocks
  mockPool
    .intercept({ path: '/db/_partition/partition' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/_partition/partition
  const p = await db.partitionInfo('partition')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should handle missing database - PUT /db - nano.db.create', async () => {
  // mocks
  const response = {
    error: 'not_found',
    reason: 'Database does not exist.'
  }
  mockPool
    .intercept({ path: '/db/_partition/partition' })
    .reply(404, response, JSON_HEADERS)

  // test GET /db/_partition/partition
  await assert.rejects(db.partitionInfo('partition'), { message: response.reason })
  mockAgent.assertNoPendingInterceptors()
})

test('should not attempt info fetch with missing parameters - nano.db.get', async () => {
  await assert.rejects(db.partitionInfo(), { message: 'Invalid parameters' })
  await assert.rejects(db.partitionInfo(''), { message: 'Invalid parameters' })
})

