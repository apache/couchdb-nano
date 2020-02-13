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
const db = nano.db.use('db')
const nock = require('nock')
const response = {
  db_name: 'db',
  sizes: {
    active: 12955,
    external: 15009
  },
  partition: 'partition',
  doc_count: 28,
  doc_del_count: 0
}

afterEach(() => {
  nock.cleanAll()
})

test('should be able to fetch partition info info - GET /db/_partition/partition - db.partitionInfo', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/db/_partition/partition')
    .reply(200, response)

  // test GET /db/_partition/partition
  const p = await db.partitionInfo('partition')
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to fetch partition info info (callback) - GET /db/_partition/partition - db.partitionInfo', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/db/_partition/partition')
    .reply(200, response)

  // test GET /db/_partition/partition
  return new Promise((resolve, reject) => {
    db.partitionInfo('partition', (err, data) => {
      expect(err).toBeNull()
      expect(data).toStrictEqual(response)
      expect(scope.isDone()).toBe(true)
      resolve()
    })
  })
})

test('should handle missing database - PUT /db - nano.db.create', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/db/_partition/partition')
    .reply(404, {
      error: 'not_found',
      reason: 'Database does not exist.'
    })

  // test GET /db/_partition/partition
  await expect(db.partitionInfo('partition')).rejects.toThrow('Database does not exist')
  expect(scope.isDone()).toBe(true)
})

test('should not attempt info fetch with missing parameters - nano.db.get', async () => {
  await expect(db.partitionInfo()).rejects.toThrowError('Invalid parameters')
  await expect(db.partitionInfo('')).rejects.toThrowError('Invalid parameters')
})

test('should detect missing parameters (callback) - nano.db.get', async () => {
  return new Promise((resolve, reject) => {
    db.partitionInfo(undefined, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
