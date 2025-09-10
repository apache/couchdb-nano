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

import test from 'node:test'
import assert from 'node:assert/strict'
import { COUCH_URL, mockAgent, mockPool, JSON_HEADERS } from './mock.js'
import Nano from '../lib/nano.js'
const nano = Nano({ url: COUCH_URL })

test('check request can do GET requests - nano.request', async () => {
  // mocks
  const response = { ok: true }
  mockPool
    .intercept({ path: '/db?a=1&b=2' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db?a=1&b=2
  const req = {
    method: 'get',
    db: 'db',
    qs: { a: 1, b: 2 }
  }
  const p = await nano.request(req)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('check request can do POST requests - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const doc = { _id: '_design/myddoc', a: true }
  mockPool
    .intercept({
      method: 'post',
      path: '/db',
      body: JSON.stringify(doc)
    })
    .reply(200, response, JSON_HEADERS)

  // test POST /db
  const req = {
    method: 'post',
    db: 'db',
    body: doc
  }
  const p = await nano.request(req)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('check request can do PUT requests - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const doc = { _id: '1', a: true }
  mockPool
    .intercept({
      method: 'put',
      path: '/db/1',
      body: JSON.stringify(doc)
    })
    .reply(200, response, JSON_HEADERS)

  // test PUT /db
  const req = {
    method: 'put',
    db: 'db',
    path: '1',
    body: { _id: '1', a: true }
  }
  const p = await nano.request(req)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('check request can do DELETE requests - nano.request', async () => {
  // mocks
  const response = { ok: true }
  mockPool
    .intercept({
      method: 'delete',
      path: '/db/mydoc?rev=1-123'
    })
    .reply(200, response, JSON_HEADERS)

  // test DELETE /db
  const req = {
    method: 'delete',
    db: 'db',
    path: 'mydoc',
    qs: { rev: '1-123' }
  }
  const p = await nano.request(req)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('check request can do HEAD requests - nano.request', async () => {
  // mocks
  const response = ''
  const headers = {
    'content-type': 'text/plain',
    myheader: '2442'
  }
  mockPool
    .intercept({
      method: 'head',
      path: '/db/mydoc'
    })
    .reply(200, response, { headers })

  // test HEAD /db/mydoc
  const req = {
    method: 'head',
    db: 'db',
    path: 'mydoc'
  }
  const p = await nano.request(req)
  assert.deepEqual(p, headers)
  mockAgent.assertNoPendingInterceptors()
})

test('check request formats keys properly - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const arr = ['a', 'b', 'c']
  mockPool
    .intercept({ path: '/db/_all_docs?keys=["a","b","c"]' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/_all_docs?keys=[]
  const req = {
    method: 'get',
    db: 'db',
    path: '_all_docs',
    qs: { keys: arr }
  }
  const p = await nano.request(req)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('check request formats startkey properly - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const val = 'x'
  mockPool
    .intercept({ path: '/db/_all_docs?startkey="x"' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/_all_docs?startkey=
  const req = {
    method: 'get',
    db: 'db',
    path: '_all_docs',
    qs: { startkey: val }
  }
  const p = await nano.request(req)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('check request formats start_key properly - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const val = 'x'
  mockPool
    .intercept({ path: '/db/_all_docs?start_key="x"' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/_all_docs?start_key=
  const req = {
    method: 'get',
    db: 'db',
    path: '_all_docs',
    qs: { start_key: val }
  }
  const p = await nano.request(req)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('check request formats endkey properly - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const val = 'x'
  mockPool
    .intercept({ path: '/db/_all_docs?endkey="x"' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/_all_docs?endkey=
  const req = {
    method: 'get',
    db: 'db',
    path: '_all_docs',
    qs: { endkey: val }
  }
  const p = await nano.request(req)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('check request formats end_key properly - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const val = 'x'
  mockPool
    .intercept({ path: '/db/_all_docs?end_key="x"' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/_all_docs?end_key=
  const req = {
    method: 'get',
    db: 'db',
    path: '_all_docs',
    qs: { end_key: val }
  }
  const p = await nano.request(req)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('check request formats key properly - nano.request', async () => {
  // mocks
  const response = { ok: true }
  const val = 'x'
  mockPool
    .intercept({ path: '/db/_all_docs?key="x"' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/_all_docs?key=
  const req = {
    method: 'get',
    db: 'db',
    path: '_all_docs',
    qs: { key: val }
  }
  const p = await nano.request(req)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('check request can do 500s - nano.request', async () => {
  // mocks
  const errorMessage = 'Internal server error'
  mockPool
    .intercept({ path: '/db?a=1&b=2' })
    .reply(500, errorMessage)

  // test GET /db?a=1&b=2
  const req = {
    method: 'get',
    db: 'db',
    qs: { a: 1, b: 2 }
  }
  await assert.rejects(nano.request(req), { message: 'couch returned 500' })
  mockAgent.assertNoPendingInterceptors()
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
  mockPool
    .intercept({ path: '/' })
    .reply(200, response, JSON_HEADERS)

  // test GET /
  const p = await nano.request()
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
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
  mockPool
    .intercept({ path: '/db' })
    .reply(200, response, JSON_HEADERS)

  // test GET /
  const p = await nano.request('db')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('check request handles cookies - nano.request', async () => {
  // mocks
  const username = 'u'
  const password = 'p'
  const response = { ok: true, name: 'admin', roles: ['_admin', 'admin'] }
  mockPool
    .intercept({
      method: 'post',
      path: '/_session',
      body: 'name=u&password=p',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=utf-8'
      }
    })
    .reply(200, response, {
      headers: {
        'content-type': 'application/json',
        'Set-Cookie': 'AuthSession=YWRtaW46NUU0MTFBMDE6stHsxYnlDy4mYxwZEcnXHn4fm5w; Version=1; Expires=Mon, 10-Feb-2050 09:03:21 GMT; Max-Age=600; Path=/; HttpOnly'
      }
    })

  // test GET /_uuids
  const req = {
    method: 'post',
    path: '_session',
    form: {
      name: username,
      password
    }
  }
  const p = await nano.request(req)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('check request can do GET a doc - nano.request', async () => {
  // mocks
  const response = { _id: 'docname/design', _rev: '1-123', ok: true }
  mockPool
    .intercept({ path: '/db/_design/docname?a=1&b=2' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db?a=1&b=2
  const req = {
    method: 'get',
    db: 'db',
    doc: '_design/docname',
    qs: { a: 1, b: 2 }
  }
  const p = await nano.request(req)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('check request doesn\'t mangle bodies containing functions - nano.request', async () => {
  // mocks
  const emit = () => { }
  const doc = {
    a: 1,
    views: {
      bytime: {
        map: function () { emit(doc.ts, true) }.toString()
      }
    }
  }
  const response = { id: 'jfjfjf', rev: '1-123', ok: true }
  mockPool
    .intercept({
      method: 'post',
      path: '/db',
      body: JSON.stringify(doc)
    })
    .reply(200, response, JSON_HEADERS)

  // test POST /db
  const req = {
    method: 'post',
    db: 'db',
    body: doc
  }
  const p = await nano.request(req)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('check request sends user-agent header - nano.request', async () => {
  // mocks
  const response = { ok: true }
  mockPool
    .intercept({
      path: '/db?a=1&b=2',
      headers: {
        'user-agent': /^nano/
      }
    })
    .reply(200, response, JSON_HEADERS)

  // test GET /db?a=1&b=2
  const req = {
    method: 'get',
    db: 'db',
    qs: { a: 1, b: 2 }
  }
  const p = await nano.request(req)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('check request sends headers for gzipped responses - nano.request', async () => {
  // mocks
  const response = { ok: true }
  mockPool
    .intercept({
      path: '/db?a=1&b=2',
      headers: {
        'accept-encoding': /gzip/
      }
    })
    .reply(200, response, JSON_HEADERS)

  // test GET /db?a=1&b=2
  const req = {
    method: 'get',
    db: 'db',
    qs: { a: 1, b: 2 }
  }
  const p = await nano.request(req)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})
