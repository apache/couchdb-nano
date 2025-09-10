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

test('should be able to get a document - GET /db/id - db.get', async () => {
  // mocks
  const response = { _id: 'id', rev: '1-123', a: 1, b: 'two', c: true }
  mockPool
    .intercept({ path: '/db/id' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/id
  const db = nano.db.use('db')
  const p = await db.get('id')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to get a document from a partition - GET /db/pkey:id - db.get', async () => {
  // mocks
  const response = { _id: 'partkey:id', rev: '1-123', a: 1, b: 'two', c: true }
  mockPool
    .intercept({ path: '/db/partkey%3Aid' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/pkey:id
  const db = nano.db.use('db')
  const p = await db.get('partkey:id')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to get a document with options - GET /db/id?conflicts=true - db.get', async () => {
  // mocks
  const response = { _id: 'id', rev: '1-123', a: 1, b: 'two', c: true }
  mockPool
    .intercept({ path: '/db/id?conflicts=true' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/id?x=y
  const db = nano.db.use('db')
  const p = await db.get('id', { conflicts: true })
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to handle 404 - GET /db/id - db.get', async () => {
  // mocks
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  mockPool
    .intercept({ path: '/db/id' })
    .reply(404, response, JSON_HEADERS)

  // test GET /db/id
  const db = nano.db.use('db')
  await assert.rejects(db.get('id'), { message: 'missing' })
  mockAgent.assertNoPendingInterceptors()
})

test('should detect missing doc id - db.get', async () => {
  const db = nano.db.use('db')
  await assert.rejects(db.get(), { message: 'Invalid parameters' })
})

test('check request can fetch local documents - db.get', async () => {
  // mocks
  const response = { _id: '_local/id', _rev: '1-123', a: 1 }
  mockPool
    .intercept({ path: '/db/_local/id' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/_local/id
  const db = nano.db.use('db')
  const p = await db.get('_local/id')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})
