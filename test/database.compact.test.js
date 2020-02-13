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

test('should be able to send compaction request - POST /db/_compact - nano.db.compact', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .post('/db/_compact')
    .reply(200, response)

  // test POST /db/_compact
  const p = await nano.db.compact('db')
  expect(p).toEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to send compaction request with design doc - POST /db/_compact/ddoc - nano.db.compact', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .post('/db/_compact/ddoc')
    .reply(200, response)

  // test POST /db/_compact/ddoc
  const p = await nano.db.compact('db', 'ddoc')
  expect(p).toEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should not attempt compact with invalid parameters - nano.db.compact', async () => {
  await expect(nano.db.compact('')).rejects.toThrowError('Invalid parameters')
  await expect(nano.db.compact()).rejects.toThrowError('Invalid parameters')
})

test('should detect missing parameters (callback) - nano.db.compact', () => {
  return new Promise((resolve, reject) => {
    nano.db.compact(undefined, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})

test('should be able to send compaction request from db.compact - POST /db/_compact - db.compact', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .post('/db/_compact')
    .reply(200, response)

  // test POST /db/_compact
  const db = nano.db.use('db')
  const p = await db.compact()
  expect(p).toEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to send compaction request with design doc from db.view.compact - POST /db/_compact/ddoc - db.view.compact', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .post('/db/_compact/ddoc')
    .reply(200, response)

  // test POST /db/_compact/ddoc
  const db = nano.db.use('db')
  const p = await db.view.compact('ddoc')
  expect(p).toEqual(response)
  expect(scope.isDone()).toBe(true)
})
