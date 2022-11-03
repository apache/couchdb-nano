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

afterEach(() => {
  nock.cleanAll()
})

test('should be able to insert documents in bulk - POST /db/_bulk_docs - db.bulk', async () => {
  // mocks
  const docs = [{ a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 4 }]
  const response = [
    { ok: true, id: 'x', rev: '1-123' },
    { ok: true, id: 'y', rev: '1-456' },
    { ok: true, id: 'z', rev: '1-789' }
  ]
  const scope = nock(COUCH_URL)
    .post('/db/_bulk_docs', { docs })
    .reply(200, response)

  // test POST /db/_bulk_docs
  const db = nano.db.use('db')
  const p = await db.bulk({ docs })
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle missing database - POST /db/_bulk_docs - db.bulk', async () => {
  // mocks
  const docs = [{ a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 4 }]
  const response = {
    error: 'not_found',
    reason: 'Database does not exist.'
  }
  const scope = nock(COUCH_URL)
    .post('/db/_bulk_docs', { docs })
    .reply(404, response)

  // test POST /db/_bulk_docs
  const db = nano.db.use('db')
  await expect(db.bulk({ docs })).rejects.toThrow('Database does not exist.')
  expect(scope.isDone()).toBe(true)
})
