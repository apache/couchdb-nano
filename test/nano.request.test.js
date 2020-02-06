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

test('check request can do GET requests - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const scope = nock(COUCH_URL)
    .get('/db?a=1&b=2')
    .reply(200, response)

  // test GET /db?a=1&b=2
  const req = {
    method: 'get',
    db: 'db',
    qs: { a: 1, b: 2 }
  }
  const p = await nano.request(req)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('check request can do POST requests - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const scope = nock(COUCH_URL)
    .post('/db', { _id: '1', a: true })
    .reply(200, response)

  // test POST /db
  const req = {
    method: 'post',
    db: 'db',
    body: { _id: '1', a: true }
  }
  const p = await nano.request(req)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('check request can do PUT requests - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const scope = nock(COUCH_URL)
    .put('/db/1', { _id: '1', a: true })
    .reply(200, response)

  // test PUT /db
  const req = {
    method: 'put',
    db: 'db',
    path: '1',
    body: { _id: '1', a: true }
  }
  const p = await nano.request(req)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('check request can do DELETE requests - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const scope = nock(COUCH_URL)
    .delete('/db/mydoc')
    .query({ rev: '1-123' })
    .reply(200, response)

  // test DELETE /db
  const req = {
    method: 'delete',
    db: 'db',
    path: 'mydoc',
    qs: { rev: '1-123' }

  }
  const p = await nano.request(req)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('check request can do HEAD requests - nano.request', async () => {
  // mocks
  const response = ''
  const scope = nock(COUCH_URL)
    .head('/db/mydoc')
    .reply(200, '')

  // test HEAD /db/mydoc
  const req = {
    method: 'head',
    db: 'db',
    path: 'mydoc'
  }
  const p = await nano.request(req)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('check request can do GET requests with callback - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const scope = nock(COUCH_URL)
    .get('/db?a=1&b=2')
    .reply(200, response)

  // test GET /db?a=1&b=2
  const req = {
    method: 'get',
    db: 'db',
    qs: { a: 1, b: 2 }
  }
  return new Promise((resolve, reject) => {
    nano.request(req, (err, data) => {
      expect(err).toBe(null)
      expect(data).toStrictEqual(response)
      expect(scope.isDone()).toBe(true)
      resolve()
    })
  })
})

test('check request can do failed GET requests with callback - nano.request', async () => {
  // mocks
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  const scope = nock(COUCH_URL)
    .get('/db/a')
    .reply(404, response)

  // test GET /db/a
  const req = {
    method: 'get',
    db: 'db',
    path: 'a'
  }
  return new Promise((resolve, reject) => {
    nano.request(req, (err, data) => {
      expect(err).not.toBe(null)
      expect(scope.isDone()).toBe(true)
      resolve()
    })
  })
})

test('check request formats keys properly - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const arr = ['a', 'b', 'c']
  const scope = nock(COUCH_URL)
    .get('/db/_all_docs')
    .query({ keys: JSON.stringify(arr) })
    .reply(200, response)

  // test GET /db/_all_docs?keys=[]
  const req = {
    method: 'get',
    db: 'db',
    path: '_all_docs',
    qs: { keys: arr }
  }
  const p = await nano.request(req)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('check request formats startkey properly - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const val = 'x'
  const scope = nock(COUCH_URL)
    .get('/db/_all_docs')
    .query({ startkey: JSON.stringify(val) })
    .reply(200, response)

  // test GET /db/_all_docs?startkey=
  const req = {
    method: 'get',
    db: 'db',
    path: '_all_docs',
    qs: { startkey: val }
  }
  const p = await nano.request(req)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('check request formats start_key properly - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const val = 'x'
  const scope = nock(COUCH_URL)
    .get('/db/_all_docs')
    .query({ start_key: JSON.stringify(val) })
    .reply(200, response)

  // test GET /db/_all_docs?start_key=
  const req = {
    method: 'get',
    db: 'db',
    path: '_all_docs',
    qs: { start_key: val }
  }
  const p = await nano.request(req)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('check request formats endkey properly - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const val = 'x'
  const scope = nock(COUCH_URL)
    .get('/db/_all_docs')
    .query({ endkey: JSON.stringify(val) })
    .reply(200, response)

  // test GET /db/_all_docs?endkey=
  const req = {
    method: 'get',
    db: 'db',
    path: '_all_docs',
    qs: { endkey: val }
  }
  const p = await nano.request(req)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('check request formats end_key properly - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const val = 'x'
  const scope = nock(COUCH_URL)
    .get('/db/_all_docs')
    .query({ end_key: JSON.stringify(val) })
    .reply(200, response)

  // test GET /db/_all_docs?end_key=
  const req = {
    method: 'get',
    db: 'db',
    path: '_all_docs',
    qs: { end_key: val }
  }
  const p = await nano.request(req)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('check request formats key properly - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const val = 'x'
  const scope = nock(COUCH_URL)
    .get('/db/_all_docs')
    .query({ key: JSON.stringify(val) })
    .reply(200, response)

  // test GET /db/_all_docs?key=
  const req = {
    method: 'get',
    db: 'db',
    path: '_all_docs',
    qs: { key: val }
  }
  const p = await nano.request(req)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})
