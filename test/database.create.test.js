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
const response = { ok: true }

afterEach(() => {
  nock.cleanAll()
})

test('should create a database - PUT /db - nano.db.create', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .put('/db')
    .reply(200, response)

  // test GET /db
  const p = await nano.db.create('db')
  expect(typeof p).toBe('object')
  expect(p.ok).toBe(true)
  expect(scope.isDone()).toBe(true)
})

test('should create a database with parameters - PUT /db?partitioned=true - nano.db.create', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .put('/db')
    .query({ partitioned: 'true', q: '1' })
    .reply(200, response)

  // test GET /db
  const p = await nano.db.create('db', { partitioned: true, q: 1 })
  expect(typeof p).toBe('object')
  expect(p.ok).toBe(true)
  expect(scope.isDone()).toBe(true)
})

test('should handle pre-existing database - PUT /db - nano.db.create', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .put('/db')
    .reply(412, {
      error: 'file_exists',
      reason: 'The database could not be created, the file already exists.'
    })

  // test PUT /db
  await expect(nano.db.create('db')).rejects.toThrow('The database could not be created')
  expect(scope.isDone()).toBe(true)
})

test('should not attempt to create database with invalid parameters - nano.db.create', async () => {
  await expect(nano.db.create()).rejects.toThrowError('Invalid parameters')
  await expect(nano.db.create('')).rejects.toThrowError('Invalid parameters')
})

test('should detect missing parameters (callback) - nano.db.create', () => {
  return new Promise((resolve, reject) => {
    nano.db.create(undefined, undefined, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
