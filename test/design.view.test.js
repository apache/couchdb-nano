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

test('should be able to access a MapReduce view - GET /db/_design/ddoc/_view/viewname - db.view', async () => {
  // mocks
  const response = {
    rows: [
      { key: null, value: 23515 }
    ]
  }
  const scope = nock(COUCH_URL)
    .get('/db/_design/ddoc/_view/viewname')
    .reply(200, response)

  // test GET /db/_design/ddoc/_view/viewname
  const db = nano.db.use('db')
  const p = await db.view('ddoc', 'viewname')
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to access a MapReduce view with opts - GET /db/_design/ddoc/_view/viewname - db.view', async () => {
  // mocks
  const response = {
    rows: [
      { key: 'BA', value: 21 },
      { key: 'BB', value: 1 },
      { key: 'BD', value: 98 },
      { key: 'BE', value: 184 },
      { key: 'BF', value: 32 },
      { key: 'BG', value: 55 },
      { key: 'BH', value: 8 },
      { key: 'BI', value: 10 },
      { key: 'BJ', value: 29 },
      { key: 'BL', value: 1 },
      { key: 'BM', value: 1 },
      { key: 'BN', value: 4 },
      { key: 'BO', value: 27 },
      { key: 'BQ', value: 1 }
    ]
  }
  const scope = nock(COUCH_URL)
    .get('/db/_design/ddoc/_view/viewname?group=true&startkey="BA"&endkey="BQ"')
    .reply(200, response)

  // test GET /db/_design/ddoc/_view/viewname
  const db = nano.db.use('db')
  const p = await db.view('ddoc', 'viewname', { group: true, startkey: 'BA', endkey: 'BQ' })
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to access a MapReduce view with keys - POST /db/_design/ddoc/_view/viewname - db.view', async () => {
  // mocks
  const keys = ['BA', 'BD']
  const response = {
    rows: [
      { key: 'BA', value: 21 },
      { key: 'BB', value: 1 }
    ]
  }
  const scope = nock(COUCH_URL)
    .post('/db/_design/ddoc/_view/viewname', { keys })
    .reply(200, response)

  // test POST /db/_design/ddoc/_view/viewname
  const db = nano.db.use('db')
  const p = await db.view('ddoc', 'viewname', { keys })
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to access a MapReduce view with queries - POST /db/_design/ddoc/_view/viewname - db.view', async () => {
  // mocks
  const opts = {
    queries: [
      {
        keys: [
          'BA',
          'BD'
        ]
      },
      {
        limit: 1,
        skip: 2,
        reduce: false
      }
    ]
  }
  const response = {
    results: [
      {
        rows: [
          { key: 'BA', value: 21 },
          { key: 'BB', value: 1 }
        ]
      },
      {
        total_rows: 23515,
        offset: 2,
        rows: [
          { id: '290594', key: 'AE', value: 1 }
        ]
      }
    ]
  }
  const scope = nock(COUCH_URL)
    .post('/db/_design/ddoc/_view/viewname', { queries: opts.queries })
    .reply(200, response)

  // test POST /db/_design/ddoc/_view/viewname
  const db = nano.db.use('db')
  const p = await db.view('ddoc', 'viewname', opts)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle 404 - db.view', async () => {
  // mocks
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  const scope = nock(COUCH_URL)
    .get('/db/_design/ddoc/_view/viewname?group=true&startkey="BA"&endkey="BQ"')
    .reply(404, response)

  // test GET /db/_design/ddoc/_view/viewname
  const db = nano.db.use('db')
  await expect(db.view('ddoc', 'viewname', { group: true, startkey: 'BA', endkey: 'BQ' })).rejects.toThrow('missing')
  expect(scope.isDone()).toBe(true)
})

test('should detect missing parameters - db.view', async () => {
  const db = nano.db.use('db')
  await expect(db.view()).rejects.toThrow('Invalid parameters')
  await expect(db.view('susan')).rejects.toThrow('Invalid parameters')
  await expect(db.view('susan', '')).rejects.toThrow('Invalid parameters')
  await expect(db.view('', 'susan')).rejects.toThrow('Invalid parameters')
})

test('should detect missing parameters (callback) - db.view', () => {
  const db = nano.db.use('db')
  return new Promise((resolve, reject) => {
    db.view('', '', (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
