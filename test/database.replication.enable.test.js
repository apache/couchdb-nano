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
    .post('/_replicator', { source: source, target: target })
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
    .post('/_replicator', Object.assign(opts, { source: source, target: target }))
    .reply(200, response)

  // test POST /_replicator
  const p = await nano.db.replication.enable(source, target, opts)
  expect(p).toEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should not attempt compact with empty source - nano.db.replication.enable', async () => {
  expect(() => {
    nano.db.replication.enable('')
  }).toThrowError('missing source')
})

test('should not attempt compact with missing source - nano.db.replication.enable', async () => {
  expect(() => {
    nano.db.replication.enable(undefined, 'target')
  }).toThrowError('missing source')
})

test('should not attempt compact with empty target - nano.db.replication.enable', async () => {
  expect(() => {
    nano.db.replication.enable('', 'target')
  }).toThrowError('missing source')
})

test('should not attempt compact with missing target - nano.db.replication.enable', async () => {
  expect(() => {
    nano.db.replication.enable(undefined, 'target')
  }).toThrowError('missing source')
})
