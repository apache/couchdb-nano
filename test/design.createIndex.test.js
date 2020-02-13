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

test('should be able to create an index - POST /db/_index - db.createIndex', async () => {
  // mocks
  const indexDef = {
    index: {
      fields: ['town', 'surname']
    },
    type: 'json',
    name: 'townsurnameindex',
    partitioned: false
  }
  const response = {
    result: 'created',
    id: '_design/a5f4711fc9448864a13c81dc71e660b524d7410c',
    name: 'foo-index'
  }
  const scope = nock(COUCH_URL)
    .post('/db/_index', indexDef)
    .reply(200, response)

  // test POST /db/_index
  const db = nano.db.use('db')
  const p = await db.createIndex(indexDef)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should handle 404 - POST /db/_index - db.createIndex', async () => {
  // mocks
  const indexDef = {
    index: {
      fields: ['town', 'surname']
    },
    type: 'json',
    name: 'townsurnameindex',
    partitioned: false
  }
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  const scope = nock(COUCH_URL)
    .post('/db/_index', indexDef)
    .reply(404, response)

  // test POST /db/_index
  const db = nano.db.use('db')
  await expect(db.createIndex(indexDef)).rejects.toThrow('missing')
  expect(scope.isDone()).toBe(true)
})

test('should detect missing index - db.createIndex', async () => {
  const db = nano.db.use('db')
  await expect(db.createIndex()).rejects.toThrow('Invalid parameters')
  await expect(db.createIndex('myindex')).rejects.toThrow('Invalid parameters')
})

test('should detect missing index (callback) - db.createIndex', () => {
  const db = nano.db.use('db')
  return new Promise((resolve, reject) => {
    db.createIndex('', (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
