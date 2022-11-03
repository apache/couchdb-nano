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
const COUCH_URL = 'http://localhost:59804'
const nano = Nano({ url: COUCH_URL, cookie: true })
const nock = require('nock')

afterEach(() => {
  nock.cleanAll()
})

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
  const doc = { _id: '_design/myddoc', a: true }
  const scope = nock(COUCH_URL)
    .post('/db', doc)
    .reply(200, response)

  // test POST /db
  const req = {
    method: 'post',
    db: 'db',
    body: doc
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

test('check request can do GET requests with callback - nano.request', () => {
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

test('check request can do failed GET requests with callback - nano.request', () => {
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

test('check request can do 500s - nano.request', async () => {
  // mocks
  const errorMessage = 'Internal server error'
  const scope = nock(COUCH_URL)
    .get('/db?a=1&b=2')
    .reply(500, errorMessage)

  // test GET /db?a=1&b=2
  const req = {
    method: 'get',
    db: 'db',
    qs: { a: 1, b: 2 }
  }
  await expect(nano.request(req)).rejects.toThrow(errorMessage)
  expect(scope.isDone()).toBe(true)
})

test('check request can do 500s with callback - nano.request', () => {
  // mocks
  const errorMessage = 'Internal server error'
  const scope = nock(COUCH_URL)
    .get('/db?a=1&b=2')
    .reply(500, errorMessage)

  // test GET /db?a=1&b=2
  const req = {
    method: 'get',
    db: 'db',
    qs: { a: 1, b: 2 }
  }

  return new Promise((resolve, reject) => {
    nano.request(req, (err, data) => {
      expect(err).not.toBe(null)
      expect(scope.isDone()).toBe(true)
      resolve()
    })
  })
})

test('check request handle empty parameter list - nano.request', async () => {
  // mocks
  const response = {
    couchdb: 'Welcome',
    version: '2.3.1',
    git_sha: 'c298091a4',
    uuid: '865f5b0c258c5749012ce7807b4b0622',
    features: [
      'pluggable-storage-engines',
      'scheduler'
    ],
    vendor: {
      name: 'The Apache Software Foundation'
    }
  }
  const scope = nock(COUCH_URL)
    .get('/')
    .reply(200, response)

  // test GET /
  const p = await nano.request()
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('check request handle empty parameter list (callback) - nano.request', () => {
  // mocks
  const response = {
    couchdb: 'Welcome',
    version: '2.3.1',
    git_sha: 'c298091a4',
    uuid: '865f5b0c258c5749012ce7807b4b0622',
    features: [
      'pluggable-storage-engines',
      'scheduler'
    ],
    vendor: {
      name: 'The Apache Software Foundation'
    }
  }
  const scope = nock(COUCH_URL)
    .get('/')
    .reply(200, response)

  // test GET /
  return new Promise((resolve, reject) => {
    nano.request((err, data) => {
      expect(err).toBeNull()
      expect(data).toStrictEqual(response)
      expect(scope.isDone()).toBe(true)
      resolve()
    })
  })
})

test('check request handles single string parameter - nano.request', async () => {
  // mocks
  const response = {
    db_name: 'db',
    purge_seq: '0-8KhNZEiqhyjKAgBm5Rxs',
    update_seq: '23523-gUFPHo-6PQIAJ_EdrA',
    sizes: {
      file: 18215344,
      external: 5099714,
      active: 6727596
    }
  }
  const scope = nock(COUCH_URL)
    .get('/db')
    .reply(200, response)

  // test GET /
  const p = await nano.request('db')
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('check request handles cookies - nano.request', async () => {
  // mocks
  const username = 'u'
  const password = 'p'
  const response = { ok: true, name: 'admin', roles: ['_admin', 'admin'] }
  const scope = nock(COUCH_URL)
    .post('/_session', 'name=u&password=p', { 'content-type': 'application/x-www-form-urlencoded; charset=utf-8' })
    .reply(200, response, { 'Set-Cookie': 'AuthSession=YWRtaW46NUU0MTFBMDE6stHsxYnlDy4mYxwZEcnXHn4fm5w; Version=1; Expires=Mon, 10-Feb-2050 09:03:21 GMT; Max-Age=600; Path=/; HttpOnly' })

  // test GET /_uuids
  const req = {
    method: 'post',
    path: '_session',
    form: {
      name: username,
      password
    },
    jar: true
  }
  const p = await nano.request(req)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('check request can do GET a doc - nano.request', async () => {
  // mocks
  const response = { _id: 'docname/design', _rev: '1-123', ok: true }
  const scope = nock(COUCH_URL)
    .get('/db/_design/docname?a=1&b=2')
    .reply(200, response)

  // test GET /db?a=1&b=2
  const req = {
    method: 'get',
    db: 'db',
    doc: '_design/docname',
    qs: { a: 1, b: 2 }
  }
  const p = await nano.request(req)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('check request doesn\'t mangle bodies containing functions - nano.request', async () => {
  // mocks
  const emit = () => { }
  const doc = {
    a: 1,
    views: {
      bytime: {
        map: function () { emit(doc.ts, true) }
      }
    }
  }
  const response = { id: 'jfjfjf', rev: '1-123', ok: true }
  const scope = nock(COUCH_URL)
    .post('/db', { a: 1, views: { bytime: { map: 'function () {\n          emit(doc.ts, true);\n        }' } } })
    .reply(200, response)

  // test POST /db
  const req = {
    method: 'post',
    db: 'db',
    body: doc
  }
  const p = await nano.request(req)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('check request sends user-agent header - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const scope = nock(COUCH_URL, { reqheaders: { 'user-agent': /^nano/ } })
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

test('check request sends headers for gzipped responses - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const scope = nock(COUCH_URL, { reqheaders: { 'accept-encoding': /gzip/ } })
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
