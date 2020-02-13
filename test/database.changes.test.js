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
const response = {
  results: [
    {
      seq: '1-nC1J',
      id: 'c42ddf1272c7d05b2dc45b6962000b10',
      changes: [
        {
          rev: '1-23202479633c2b380f79507a776743d5'
        }
      ]
    }
  ],
  last_seq: '1-C1J',
  pending: 0
}
const errResponse = {
  error: 'not_found',
  reason: 'Database does not exist.'
}

afterEach(() => {
  nock.cleanAll()
})

test('should be able to fetch the changes - GET /db/_changes - nano.db.changes', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/db/_changes')
    .reply(200, response)

  // test GET /db/_changes
  const p = await nano.db.changes('db')
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to fetch the changes with opts - GET /db/_changes - nano.db.changes', async () => {
  // mocks
  const opts = { include_docs: true, feed: 'continuous' }
  const scope = nock(COUCH_URL)
    .get('/db/_changes')
    .query(opts)
    .reply(200, response)

  // test GET /db/_changes
  const p = await nano.db.changes('db', opts)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle a missing database - GET /db/_changes - nano.db.changes', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/db/_changes')
    .reply(404, errResponse)

  // test GET /db/_changes
  await expect(nano.db.changes('db')).rejects.toThrow('Database does not exist')
  expect(scope.isDone()).toBe(true)
})

test('should not attempt invalid parameters - nano.db.changes', async () => {
  await expect(nano.db.changes()).rejects.toThrowError('Invalid parameters')
  await expect(nano.db.changes('')).rejects.toThrowError('Invalid parameters')
})

test('should detect missing parameters (callback) - nano.db.changes', () => {
  return new Promise((resolve, reject) => {
    nano.db.changes(undefined, undefined, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})

test('should be able to fetch the changes from db.changes - GET /db/_changes - db.changes', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/db/_changes')
    .reply(200, response)

  // test GET /db/_changes
  const db = nano.db.use('db')
  const p = await db.changes()
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})
