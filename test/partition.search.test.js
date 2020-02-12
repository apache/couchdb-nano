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

test('should be able to access a partitioned search index - GET /db/_partition/partition/_design/ddoc/_search/searchname - db.partitionedSearch', async () => {
  // mocks
  const response = {
    total_rows: 100000,
    bookmark: 'g123',
    rows: [
      { a: 1, b: 2 }
    ]
  }
  const params = { q: '*:*' }
  const scope = nock(COUCH_URL)
    .get('/db/_partition/partition/_design/ddoc/_search/searchname?q=*:*')
    .reply(200, response)

  // test GET /db/_partition/partition/_design/ddoc/_search/searchname
  const db = nano.db.use('db')
  const p = await db.partitionedSearch('partition', 'ddoc', 'searchname', params)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle 404 - db.partitionedSearch', async () => {
  // mocks
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  const params = { q: '*:*' }
  const scope = nock(COUCH_URL)
    .get('/db/_partition/partition/_design/ddoc/_search/searchname?q=*:*')
    .reply(404, response)

  // test GET /db/_partition/partition/_design/ddoc/_search/searchname
  const db = nano.db.use('db')
  await expect(db.partitionedSearch('partition', 'ddoc', 'searchname', params)).rejects.toThrow('missing')
  expect(scope.isDone()).toBe(true)
})

test('should detect missing parameters - db.partitionedSearch', async () => {
  const db = nano.db.use('db')
  await expect(db.partitionedSearch()).rejects.toThrow('Invalid parameters')
  await expect(db.partitionedSearch('partition', 'susan')).rejects.toThrow('Invalid parameters')
  await expect(db.partitionedSearch('partition', 'susan', '')).rejects.toThrow('Invalid parameters')
  await expect(db.partitionedSearch('partition', '', 'susan')).rejects.toThrow('Invalid parameters')
  await expect(db.partitionedSearch('partition', 'susan', '', undefined)).rejects.toThrow('Invalid parameters')
  await expect(db.partitionedSearch('partition', '', 'susan')).rejects.toThrow('Invalid parameters')
})

test('should detect missing parameters (callback) - db.partitionedSearch', async () => {
  const db = nano.db.use('db')
  return new Promise((resolve, reject) => {
    db.partitionedSearch('', '', '', '', (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
