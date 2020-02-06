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
    .get('/mydb?a=1&b=2')
    .reply(200, response)

  // test GET /db
  const req = {
    method: 'get',
    db: 'mydb',
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
    .post('/mydb', { _id: '1', a: true })
    .reply(200, response)

  // test GET /db
  const req = {
    method: 'post',
    db: 'mydb',
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
    .put('/mydb/1', { _id: '1', a: true })
    .reply(200, response)

  // test GET /db
  const req = {
    method: 'put',
    db: 'mydb',
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
    .delete('/mydb/mydoc')
    .query({ rev: '1-123' })
    .reply(200, response)

  // test GET /db
  const req = {
    method: 'delete',
    db: 'mydb',
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
    .head('/mydb/mydoc')
    .reply(200, '')

  // test GET /db
  const req = {
    method: 'head',
    db: 'mydb',
    path: 'mydoc'
  }
  const p = await nano.request(req)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})
