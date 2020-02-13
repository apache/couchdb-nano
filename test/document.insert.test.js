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

test('should be able to insert document - POST /db - db.insert', async () => {
  // mocks
  const doc = { a: 1, b: 2 }
  const response = { ok: true, id: '8s8g8h8h9', rev: '1-123' }
  const scope = nock(COUCH_URL)
    .post('/db', doc)
    .reply(200, response)

  // test POST /db
  const db = nano.db.use('db')
  const p = await db.insert(doc)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to insert document with opts - POST /db?batch=ok - db.insert', async () => {
  // mocks
  const doc = { a: 1, b: 2 }
  const response = { ok: true, id: '8s8g8h8h9', rev: '1-123' }
  const scope = nock(COUCH_URL)
    .post('/db?batch=ok', doc)
    .reply(200, response)

  // test POST /db
  const db = nano.db.use('db')
  const p = await db.insert(doc, { batch: 'ok' })
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to insert document with known id - PUT /db/id - db.insert', async () => {
  // mocks
  const doc = { a: 1, b: 2 }
  const response = { ok: true, id: 'myid', rev: '1-123' }

  const scope = nock(COUCH_URL)
    .put('/db/myid', doc)
    .reply(200, response)

  // test PUT /db
  const db = nano.db.use('db')
  const p = await db.insert(doc, 'myid')
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to insert document with id in object - POST /db - db.insert', async () => {
  // mocks
  const doc = { _id: 'myid', a: 1, b: 2 }
  const response = { ok: true, id: 'myid', rev: '1-123' }

  const scope = nock(COUCH_URL)
    .post('/db', doc)
    .reply(200, response)

  // test POST /db
  const db = nano.db.use('db')
  const p = await db.insert(doc)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to update document with id/rev in object - POST /db - db.insert', async () => {
  // mocks
  const doc = { _id: 'myid', _rev: '1-123', a: 2, b: 2 }
  const response = { ok: true, id: 'myid', rev: '2-456' }

  const scope = nock(COUCH_URL)
    .post('/db', doc)
    .reply(200, response)

  // test POST /db
  const db = nano.db.use('db')
  const p = await db.insert(doc)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle 409 conflicts - POST /db - db.insert', async () => {
  // mocks
  const doc = { _id: 'myid', _rev: '1-123', a: 2, b: 2 }
  const response = {
    error: 'conflict',
    reason: 'Document update conflict.'
  }
  const scope = nock(COUCH_URL)
    .post('/db', doc)
    .reply(409, response)

  // test POST /db
  const db = nano.db.use('db')
  await expect(db.insert(doc)).rejects.toThrow('Document update conflict.')
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle missing database - POST /db - db.insert', async () => {
  // mocks
  const doc = { a: 1, b: 2 }
  const response = {
    error: 'not_found',
    reason: 'Database does not exist.'
  }
  const scope = nock(COUCH_URL)
    .post('/db', doc)
    .reply(404, response)

  // test POST /db
  const db = nano.db.use('db')
  await expect(db.insert(doc)).rejects.toThrow('Database does not exist.')
  expect(scope.isDone()).toBe(true)
})

test('should be able to insert document with _local id - PUT /db/_local/id - db.insert', async () => {
  // mocks
  const doc = { a: 1, b: 2 }
  const response = { ok: true, id: '_local/myid', rev: '1-123' }

  const scope = nock(COUCH_URL)
    .put('/db/_local/myid', doc)
    .reply(200, response)

  // test PUT /db
  const db = nano.db.use('db')
  const p = await db.insert(doc, '_local/myid')
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to insert document with local id in object - POST /db - db.insert', async () => {
  // mocks
  const doc = { _id: '_local/myid', a: 1, b: 2 }
  const response = { ok: true, id: '_local/myid', rev: '1-123' }

  const scope = nock(COUCH_URL)
    .post('/db', doc)
    .reply(200, response)

  // test POST /db
  const db = nano.db.use('db')
  const p = await db.insert(doc)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})
