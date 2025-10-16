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
const response = { ok: true, id: 'rep1', rev: '2-123' }
const errResponse = {
  error: 'not_found',
  reason: 'missing'
}

test('should be able to delete a replication - DELETE /_replicator/id - nano.db.replication.disable', async () => {
  // mocks
  mockPool.intercept({
    method: 'delete',
    path: '/_replicator/rep1?rev=1-456'
  }).reply(200, response, JSON_HEADERS)

  // test DELETE /_replicator/id
  const p = await nano.db.replication.disable('rep1', '1-456')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to handle a 404 - DELETE /_replicator/id - nano.db.replication.disable', async () => {
  // mocks
  mockPool.intercept({
    method: 'delete',
    path: '/_replicator/rep1?rev=1-456'
  }).reply(404, errResponse, JSON_HEADERS)

  // test DELETE /_replicator/id
  await assert.rejects(nano.db.replication.disable('rep1', '1-456'), { message: 'missing' })
  mockAgent.assertNoPendingInterceptors()
})

test('should not to try to disable with invalid parameters - nano.db.replication.disable', async () => {
  await assert.rejects(nano.db.replication.disable(undefined, '1-456'), { message: 'Invalid parameters' })
  await assert.rejects(nano.db.replication.disable('', '1-456'), { message: 'Invalid parameters' })
  await assert.rejects(nano.db.replication.disable('rep1'), { message: 'Invalid parameters' })
})

test('should be able to delete a replication from db.replication.disable - DELETE /_replicator/id - db.replication.disable', async () => {
  // mocks
  mockPool.intercept({
    method: 'delete',
    path: '/_replicator/rep1?rev=1-456'
  }).reply(200, response, JSON_HEADERS)

  // test DELETE /_replicator/id
  const db = nano.db.use('db')
  const p = await db.replication.disable('rep1', '1-456')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})
