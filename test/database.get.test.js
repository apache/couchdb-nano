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
  db_name: 'db',
  purge_seq: '0-8KhNZEiqhyjKAgBm5Rxs',
  update_seq: '23523-gUFPHo-6PQIAJ_EdrA',
  sizes: {
    file: 18215344,
    external: 5099714,
    active: 6727596
  },
  other: {
    data_size: 5099714
  },
  doc_del_count: 23000,
  doc_count: 0,
  disk_size: 18215344,
  disk_format_version: 7,
  data_size: 6727596,
  compact_running: false,
  cluster: {
    q: 2,
    n: 1,
    w: 1,
    r: 1
  },
  instance_start_time: '0'
}

afterEach(() => {
  nock.cleanAll()
})

test('should be able to fetch the database info - GET /db - nano.db.get', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/db')
    .reply(200, response)

  // test GET /db
  const p = await nano.db.get('db')
  expect(typeof p).toBe('object')
  expect(p.doc_count).toBe(0)
  expect(p.db_name).toBe('db')
  expect(scope.isDone()).toBe(true)
})

test('should be able to fetch the database info - GET /db - db.info', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/db')
    .reply(200, response)

  // test GET /db
  const db = nano.db.use('db')
  const p = await db.info()
  expect(typeof p).toBe('object')
  expect(p.doc_count).toBe(0)
  expect(p.db_name).toBe('db')
  expect(scope.isDone()).toBe(true)
})

test('should handle missing database - GET /db - nano.db.get', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/db')
    .reply(404, {
      error: 'not_found',
      reason: 'Database does not exist.'
    })

  // test GET /db
  await expect(nano.db.get('db')).rejects.toThrow('Database does not exist')
  expect(scope.isDone()).toBe(true)
})

test('should not attempt info fetch with missing parameters - nano.db.get', async () => {
  await expect(nano.db.get()).rejects.toThrowError('Invalid parameters')
  await expect(nano.db.get('')).rejects.toThrowError('Invalid parameters')
})

test('should detect missing parameters (callback) - nano.db.get', () => {
  return new Promise((resolve, reject) => {
    nano.db.get(undefined, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
