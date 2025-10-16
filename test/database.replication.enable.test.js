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
const response = { ok: true, id: 'abc', rev: '1-123' }

test('should be able to send replication request with local database names - POST /_replicator - nano.db.replication.enable', async () => {
  // mocks
  mockPool.intercept({
    method: 'post',
    path: '/_replicator',
    body: JSON.stringify({ source: COUCH_URL + '/source', target: COUCH_URL + '/target' })
  }).reply(200, response, JSON_HEADERS)

  // test POST /_replicator
  const p = await nano.db.replication.enable('source', 'target')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to send replication request with URLs - POST /_replicator - nano.db.replication.enable', async () => {
  // mocks
  const source = 'http://mydomain1.com/source'
  const target = 'https://mydomain2.com/target'
  mockPool.intercept({
    method: 'post',
    path: '/_replicator',
    body: JSON.stringify({ source, target })
  }).reply(200, response, JSON_HEADERS)

  // test POST /_replicator
  const p = await nano.db.replication.enable(source, target)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to send replication request with objects - POST /_replicator - nano.db.replication.enable', async () => {
  // mocks
  const source = { config: { url: 'http://mydomain1.com', db: 'source' } }
  const target = { config: { url: 'https://mydomain2.com', db: 'target' } }
  mockPool.intercept({
    method: 'post',
    path: '/_replicator',
    body: JSON.stringify({ source: 'http://mydomain1.com/source', target: 'https://mydomain2.com/target' })
  }).reply(200, response, JSON_HEADERS)

  // test POST /_replicator
  const p = await nano.db.replication.enable(source, target)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to supply additional parameters - POST /_replicator - nano.db.replication.enable', async () => {
  // mocks
  const source = 'http://mydomain1.com/source'
  const target = 'https://mydomain2.com/target'
  const opts = { filter: 'ddoc/func', continuous: true }
  mockPool.intercept({
    method: 'post',
    path: '/_replicator',
    body: JSON.stringify(Object.assign(opts, { source, target }))
  }).reply(200, response, JSON_HEADERS)

  // test POST /_replicator
  const p = await nano.db.replication.enable(source, target, opts)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should not attempt compact with invalid parameters - nano.db.replication.enable', async () => {
  await assert.rejects(nano.db.replication.enable(undefined, 'target'), { message: 'Invalid parameters' })
  await assert.rejects(nano.db.replication.enable(), { message: 'Invalid parameters' })
  await assert.rejects(nano.db.replication.enable('source'), { message: 'Invalid parameters' })
  await assert.rejects(nano.db.replication.enable('source', ''), { message: 'Invalid parameters' })
})

test('should be able to send replication request db.replication.enable - POST /_replicator - db.replication.enable', async () => {
  // mocks
  mockPool.intercept({
    method: 'post',
    path: '/_replicator',
    body: JSON.stringify({ source: COUCH_URL + '/source', target: COUCH_URL + '/target' })
  }).reply(200, response, JSON_HEADERS)

  // test POST /_replicator
  const db = nano.db.use('source')
  const p = await db.replication.enable('target')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})
