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

const Nano = require('..')
const COUCH_URL = 'http://localhost:5984'
const nano = Nano(COUCH_URL)
const nock = require('nock')
const response = { ok: true, id: 'abc', rev: '1-123' }

afterEach(() => {
  nock.cleanAll()
})

test('should be able to send replication request with local database names - POST /_replicator - nano.db.replication.enable', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .post('/_replicator', { source: COUCH_URL + '/source', target: COUCH_URL + '/target' })
    .reply(200, response)

  // test POST /_replicator
  const p = await nano.db.replication.enable('source', 'target')
  expect(p).toEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to send replication request with URLs - POST /_replicator - nano.db.replication.enable', async () => {
  // mocks
  const source = 'http://mydomain1.com/source'
  const target = 'https://mydomain2.com/target'
  const scope = nock(COUCH_URL)
    .post('/_replicator', { source, target })
    .reply(200, response)

  // test POST /_replicator
  const p = await nano.db.replication.enable(source, target)
  expect(p).toEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to send replication request with objects - POST /_replicator - nano.db.replication.enable', async () => {
  // mocks
  const source = { config: { url: 'http://mydomain1.com', db: 'source' } }
  const target = { config: { url: 'https://mydomain2.com', db: 'target' } }
  const scope = nock(COUCH_URL)
    .post('/_replicator', { source: 'http://mydomain1.com/source', target: 'https://mydomain2.com/target' })
    .reply(200, response)

  // test POST /_replicator
  const p = await nano.db.replication.enable(source, target)
  expect(p).toEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to supply additional parameters - POST /_replicator - nano.db.replication.enable', async () => {
  // mocks
  const source = 'http://mydomain1.com/source'
  const target = 'https://mydomain2.com/target'
  const opts = { filter: 'ddoc/func', continuous: true }
  const scope = nock(COUCH_URL)
    .post('/_replicator', Object.assign(opts, { source, target }))
    .reply(200, response)

  // test POST /_replicator
  const p = await nano.db.replication.enable(source, target, opts)
  expect(p).toEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should not attempt compact with invalid parameters - nano.db.replication.enable', async () => {
  await expect(nano.db.replication.enable(undefined, 'target')).rejects.toThrowError('Invalid parameters')
  await expect(nano.db.replication.enable()).rejects.toThrowError('Invalid parameters')
  await expect(nano.db.replication.enable('source')).rejects.toThrowError('Invalid parameters')
  await expect(nano.db.replication.enable('source', '')).rejects.toThrowError('Invalid parameters')
})

test('should detect missing parameters (callback) - nano.db.replication.enable', () => {
  return new Promise((resolve, reject) => {
    nano.db.replication.enable(undefined, undefined, undefined, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})

test('should be able to send replication request db.replication.enable - POST /_replicator - db.replication.enable', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .post('/_replicator', { source: COUCH_URL + '/source', target: COUCH_URL + '/target' })
    .reply(200, response)

  // test POST /_replicator
  const db = nano.db.use('source')
  const p = await db.replication.enable('target')
  expect(p).toEqual(response)
  expect(scope.isDone()).toBe(true)
})
