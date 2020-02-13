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

test('should be able to use an update function - PUT /db/_design/ddoc/_update/updatename/docid - db.atomic', async () => {
  const updateFunction = function (doc, req) {
    if (doc) {
      doc.ts = new Date().getTime()
    }
    return [doc, { json: { status: 'ok' } }]
  }
  const response = updateFunction({})[1].json

  // mocks
  const scope = nock(COUCH_URL)
    .put('/db/_design/ddoc/_update/updatename/docid')
    .reply(200, response)

  // test PUT /db/_design/ddoc/_update/updatename/docid
  const db = nano.db.use('db')
  const p = await db.atomic('ddoc', 'updatename', 'docid')
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to use an update function with body - PUT /db/_design/ddoc/_update/updatename/docid - db.atomic', async () => {
  const updateFunction = function (doc, req) {
    if (doc) {
      doc.ts = new Date().getTime()
    }
    return [doc, { json: { status: 'ok' } }]
  }
  const body = { a: 1, b: 2 }
  const response = updateFunction({})[1].json

  // mocks
  const scope = nock(COUCH_URL)
    .put('/db/_design/ddoc/_update/updatename/docid', body)
    .reply(200, response)

  // test PUT /db/_design/ddoc/_update/updatename/docid
  const db = nano.db.use('db')
  const p = await db.atomic('ddoc', 'updatename', 'docid', body)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle 404 - db.atomic', async () => {
  // mocks
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  const body = { a: 1, b: 2 }
  const scope = nock(COUCH_URL)
    .put('/db/_design/ddoc/_update/updatename/docid', body)
    .reply(404, response)

  // test PUT /db/_design/ddoc/_update/updatename/docid
  const db = nano.db.use('db')
  await expect(db.atomic('ddoc', 'updatename', 'docid', body)).rejects.toThrow('missing')
  expect(scope.isDone()).toBe(true)
})

test('should detect missing parameters - db.update', async () => {
  const db = nano.db.use('db')
  await expect(db.atomic()).rejects.toThrow('Invalid parameters')
  await expect(db.atomic('ddoc')).rejects.toThrow('Invalid parameters')
  await expect(db.atomic('ddoc', 'updatename')).rejects.toThrow('Invalid parameters')
  await expect(db.atomic('', 'updatename', 'docid')).rejects.toThrow('Invalid parameters')
})

test('should detect missing parameters (callback) - db.update', () => {
  const db = nano.db.use('db')
  return new Promise((resolve, reject) => {
    db.atomic('', '', '', {}, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})

test('should detect missing parameters (callback no body) - db.update', () => {
  const db = nano.db.use('db')
  return new Promise((resolve, reject) => {
    db.atomic('', '', '', (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
