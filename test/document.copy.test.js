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

test('should be able to copy a document - db.copy', async () => {
  // mocks
  const response = { ok: true, id: 'rabbit2', rev: '1-123' }
  const scope = nock(COUCH_URL, { reqheaders: { destination: 'rabbit2' } })
    .intercept('/db/rabbit1', 'COPY')
    .reply(200, response)

  // test COPY /db/id
  const db = nano.db.use('db')
  const p = await db.copy('rabbit1', 'rabbit2')
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should detect missing source doc id - db.copy', async () => {
  const db = nano.db.use('db')
  await expect(db.copy(undefined, 'rabbbit2')).rejects.toThrow('Invalid parameters')
})

test('should detect missing target doc id - db.copy', async () => {
  const db = nano.db.use('db')
  await expect(db.copy('rabbit1')).rejects.toThrow('Invalid parameters')
})

test('should be able to copy a document in overwrite mode - db.copy', async () => {
  // mocks
  const response = { ok: true, id: 'rabbit2', rev: '1-123' }
  const scope = nock(COUCH_URL)
    .head('/db/rabbit2')
    .reply(200, '', { ETag: '1-123' })
    .intercept('/db/rabbit1', 'COPY')
    .reply(200, response)

  // test HEAD /db/id2 + COPY /db/id1
  const db = nano.db.use('db')
  const p = await db.copy('rabbit1', 'rabbit2', { overwrite: true })
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle an error  in overwrite mode # 1 - db.copy', async () => {
  // mocks
  const response = 'Internal server error'
  const scope = nock(COUCH_URL)
    .head('/db/rabbit2')
    .reply(200, '', { ETag: '1-123' })
    .intercept('/db/rabbit1', 'COPY')
    .reply(500, response)

  // test GET /db
  const db = nano.db.use('db')
  await expect(db.copy('rabbit1', 'rabbit2', { overwrite: true })).rejects.toThrow(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle an error  in overwrite mode # 2 - db.copy', async () => {
  // mocks
  const response = 'Internal server error'
  const scope = nock(COUCH_URL)
    .head('/db/rabbit2')
    .reply(500, response)

  // test GET /db
  const db = nano.db.use('db')
  await expect(db.copy('rabbit1', 'rabbit2', { overwrite: true })).rejects.toThrow(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle an error  in overwrite mode # 3 - db.copy', () => {
  // mocks
  const response = 'Internal server error'
  const scope = nock(COUCH_URL)
    .head('/db/rabbit2')
    .reply(500, response)

  // test GET /db
  return new Promise((resolve, reject) => {
    const db = nano.db.use('db')
    db.copy('rabbit1', 'rabbit2', { overwrite: true }, (err, data) => {
      expect(err).not.toBeNull()
      expect(scope.isDone()).toBe(true)
      resolve()
    })
  })
})

test('should be able to copy a document in overwrite mode missing target - db.copy', async () => {
  // mocks
  const response = { ok: true, id: 'rabbit2', rev: '1-123' }
  const errResponse = {
    error: 'not_found',
    reason: 'missing'
  }
  const scope = nock(COUCH_URL)
    .head('/db/rabbit2')
    .reply(404, errResponse)
    .intercept('/db/rabbit1', 'COPY')
    .reply(200, response)

  // test GET /db
  const db = nano.db.use('db')
  const p = await db.copy('rabbit1', 'rabbit2', { overwrite: true })
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should detect invalid parameters - db.copy', async () => {
  const db = nano.db.use('db')
  await expect(db.copy()).rejects.toThrowError('Invalid parameters')
  await expect(db.copy('')).rejects.toThrowError('Invalid parameters')
  await expect(db.copy('', 'rabbit2')).rejects.toThrowError('Invalid parameters')
  await expect(db.copy('rabbit1', '')).rejects.toThrowError('Invalid parameters')
})

test('should detect missing parameters (callback) - db.copy', () => {
  return new Promise((resolve, reject) => {
    const db = nano.db.use('db')
    db.copy(undefined, undefined, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
