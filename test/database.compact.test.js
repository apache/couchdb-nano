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
const response = { ok: true }

test('should be able to send compaction request - POST /db/_compact - nano.db.compact', async () => {
  // mocks
  mockPool
    .intercept({ method: 'post', path: '/db/_compact' })
    .reply(200, response, JSON_HEADERS)

  // test POST /db/_compact
  const p = await nano.db.compact('db')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to send compaction request with design doc - POST /db/_compact/ddoc - nano.db.compact', async () => {
  // mocks
  mockPool
    .intercept({ method: 'post', path: '/db/_compact/ddoc' })
    .reply(200, response, JSON_HEADERS)

  // test POST /db/_compact/ddoc
  const p = await nano.db.compact('db', 'ddoc')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should not attempt compact with invalid parameters - nano.db.compact', async () => {
  await assert.rejects(nano.db.compact(''), { message: 'Invalid parameters' })
  await assert.rejects(nano.db.compact(), { message: 'Invalid parameters' })
})

test('should be able to send compaction request from db.compact - POST /db/_compact - db.compact', async () => {
  // mocks
  mockPool
    .intercept({ method: 'post', path: '/db/_compact' })
    .reply(200, response, JSON_HEADERS)

  // test POST /db/_compact
  const db = nano.db.use('db')
  const p = await db.compact()
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to send compaction request with design doc from db.view.compact - POST /db/_compact/ddoc - db.view.compact', async () => {
  // mocks
  mockPool
    .intercept({ method: 'post', path: '/db/_compact/ddoc' })
    .reply(200, response, JSON_HEADERS)

  // test POST /db/_compact/ddoc
  const db = nano.db.use('db')
  const p = await db.view.compact('ddoc')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})
