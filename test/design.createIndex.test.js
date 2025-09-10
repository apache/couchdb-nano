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

test('should be able to create an index - POST /db/_index - db.createIndex', async () => {
  // mocks
  const indexDef = {
    index: {
      fields: ['town', 'surname']
    },
    type: 'json',
    name: 'townsurnameindex',
    partitioned: false
  }
  const response = {
    result: 'created',
    id: '_design/a5f4711fc9448864a13c81dc71e660b524d7410c',
    name: 'foo-index'
  }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_index',
      body: JSON.stringify(indexDef)
    })
    .reply(200, response, JSON_HEADERS)

  // test POST /db/_index
  const db = nano.db.use('db')
  const p = await db.createIndex(indexDef)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should handle 404 - POST /db/_index - db.createIndex', async () => {
  // mocks
  const indexDef = {
    index: {
      fields: ['town', 'surname']
    },
    type: 'json',
    name: 'townsurnameindex',
    partitioned: false
  }
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_index',
      body: JSON.stringify(indexDef)
    })
    .reply(404, response, JSON_HEADERS)

  // test POST /db/_index
  const db = nano.db.use('db')
  await assert.rejects(db.createIndex(indexDef), { message: 'missing' })
  mockAgent.assertNoPendingInterceptors()
})

test('should detect missing index - db.createIndex', async () => {
  const db = nano.db.use('db')
  await assert.rejects(db.createIndex(), { message: 'Invalid parameters' })
  await assert.rejects(db.createIndex('myindex'), { message: 'Invalid parameters' })
})

