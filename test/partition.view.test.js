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

test('should be able to access a partitioned view index - GET /db/_partition/partition/_design/ddoc/_view/viewname - db.partitionedView', async () => {
  // mocks
  const response = {
    rows: [
      { key: null, value: 23515 }
    ]
  }
  const scope = nock(COUCH_URL)
    .get('/db/_partition/partition/_design/ddoc/_view/viewname')
    .reply(200, response)

  // test GET /db/_partition/partition/_design/ddoc/_view/viewname
  const db = nano.db.use('db')
  const p = await db.partitionedView('partition', 'ddoc', 'viewname')
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to access a partitioned view index with opts - GET /db/_partition/partition/_design/ddoc/_view/viewname - db.partitionedView', async () => {
  // mocks
  const response = {
    rows: [
      { key: 'a', value: null }
    ]
  }
  const params = {
    reduce: false,
    startkey: 'a',
    endkey: 'b',
    limit: 1
  }
  const scope = nock(COUCH_URL)
    .get('/db/_partition/partition/_design/ddoc/_view/viewname?reduce=false&startkey=%22a%22&endkey=%22b%22&limit=1')
    .reply(200, response)

  // test GET /db/_partition/partition/_design/ddoc/_view/viewname
  const db = nano.db.use('db')
  const p = await db.partitionedView('partition', 'ddoc', 'viewname', params)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle 404 - db.partitionedView', async () => {
  // mocks
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  const scope = nock(COUCH_URL)
    .get('/db/_partition/partition/_design/ddoc/_view/viewname')
    .reply(404, response)

  // test GET /db/_partition/partition/_design/ddoc/_view/viewname
  const db = nano.db.use('db')
  await expect(db.partitionedView('partition', 'ddoc', 'viewname')).rejects.toThrow('missing')
  expect(scope.isDone()).toBe(true)
})

test('should detect missing parameters - db.partitionedView', async () => {
  const db = nano.db.use('db')
  await expect(db.partitionedView()).rejects.toThrow('Invalid parameters')
  await expect(db.partitionedView('partition', 'susan')).rejects.toThrow('Invalid parameters')
  await expect(db.partitionedView('partition', 'susan', '')).rejects.toThrow('Invalid parameters')
  await expect(db.partitionedView('partition', '', 'susan')).rejects.toThrow('Invalid parameters')
  await expect(db.partitionedView('partition', 'susan', '', undefined)).rejects.toThrow('Invalid parameters')
  await expect(db.partitionedView('partition', '', 'susan')).rejects.toThrow('Invalid parameters')
})

test('should detect missing parameters (callback) - db.partitionedView', async () => {
  const db = nano.db.use('db')
  return new Promise((resolve, reject) => {
    db.partitionedView('', '', '', '', (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
