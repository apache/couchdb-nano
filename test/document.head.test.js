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

test('should be able to head a document - HEAD /db/id - db.head', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .head('/db/id')
    .reply(200, '', { ETag: '1-123' })

  // test HEAD /db
  const db = nano.db.use('db')
  const p = await db.head('id')
  // headers get lowercased
  expect(p.etag).toBe('1-123')
  expect(scope.isDone()).toBe(true)
})

test('should be able to head a document with callback - HEAD /db/id - db.head', () => {
  // mocks
  const scope = nock(COUCH_URL)
    .head('/db/id')
    .reply(200, '', { ETag: '1-123' })

  // test HEAD /db
  return new Promise((resolve, reject) => {
    const db = nano.db.use('db')
    db.head('id', (err, data, headers) => {
      // headers get lowercased
      expect(err).toBeNull()
      expect(headers.etag).toBe('1-123')
      expect(scope.isDone()).toBe(true)
      resolve()
    })
  })
})

test('should be able to head a missing document - HEAD /db/id - db.head', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .head('/db/id')
    .reply(404, '')

  // test HEAD /db
  const db = nano.db.use('db')
  await expect(db.head('id')).rejects.toThrow('couch returned 404')
  expect(scope.isDone()).toBe(true)
})

test('should detect missing parameters - db.head', async () => {
  const db = nano.db.use('db')
  await expect(db.head()).rejects.toThrow('Invalid parameters')
})

test('should detect missing parameters (callback) - db.head', () => {
  return new Promise((resolve, reject) => {
    const db = nano.db.use('db')
    db.head(undefined, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
