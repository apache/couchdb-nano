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
const response = { ok: true, id: 'rep1', rev: '2-123' }
const errResponse = {
  error: 'not_found',
  reason: 'missing'
}

afterEach(() => {
  nock.cleanAll()
})

test('should be able to delete a replication - DELETE /_replicator/id - nano.db.replication.disable', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .delete('/_replicator/rep1')
    .query({ rev: '1-456' })
    .reply(200, response)

  // test DELETE /_replicator/id
  const p = await nano.db.replication.disable('rep1', '1-456')
  expect(p).toEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle a 404 - DELETE /_replicator/id - nano.db.replication.disable', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .delete('/_replicator/rep1')
    .query({ rev: '1-456' })
    .reply(404, errResponse)

  // test DELETE /_replicator/id
  await expect(nano.db.replication.disable('rep1', '1-456')).rejects.toThrow('missing')
  expect(scope.isDone()).toBe(true)
})

test('should not to try to disable with invalid parameters - nano.db.replication.disable', async () => {
  await expect(nano.db.replication.disable(undefined, '1-456')).rejects.toThrowError('Invalid parameters')
  await expect(nano.db.replication.disable('', '1-456')).rejects.toThrowError('Invalid parameters')
  await expect(nano.db.replication.disable('rep1')).rejects.toThrowError('Invalid parameters')
})

test('should detect missing parameters (callback) - nano.db.replication.disable', () => {
  return new Promise((resolve, reject) => {
    nano.db.replication.disable(undefined, undefined, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})

test('should be able to delete a replication from db.replication.disable - DELETE /_replicator/id - db.replication.disable', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .delete('/_replicator/rep1')
    .query({ rev: '1-456' })
    .reply(200, response)

  // test DELETE /_replicator/id
  const db = nano.db.use('db')
  const p = await db.replication.disable('rep1', '1-456')
  expect(p).toEqual(response)
  expect(scope.isDone()).toBe(true)
})
