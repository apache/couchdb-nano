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

test('should be able to use a show function - GET /db/_design/ddoc/_show/showname/docid - db.show', async () => {
  const showFunction = function (doc, req) {
    return 'Hello, world!'
  }
  // mocks
  const scope = nock(COUCH_URL)
    .get('/db/_design/ddoc/_show/showname/docid')
    .reply(200, showFunction(), { 'Content-type': 'text/plain' })

  // test GET /db/_design/ddoc/_show/showname/docid
  const db = nano.db.use('db')
  const p = await db.show('ddoc', 'showname', 'docid')
  expect(p).toStrictEqual(showFunction())
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle 404 - db.show', async () => {
  // mocks
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  const scope = nock(COUCH_URL)
    .get('/db/_design/ddoc/_show/showname/docid')
    .reply(404, response)

  // test GET /db/_design/ddoc/_show/showname/docid
  const db = nano.db.use('db')
  await expect(db.show('ddoc', 'showname', 'docid')).rejects.toThrow('missing')
  expect(scope.isDone()).toBe(true)
})

test('should detect missing parameters - db.show', async () => {
  const db = nano.db.use('db')
  await expect(db.show()).rejects.toThrow('Invalid parameters')
  await expect(db.show('ddoc')).rejects.toThrow('Invalid parameters')
  await expect(db.show('ddoc', 'showname')).rejects.toThrow('Invalid parameters')
  await expect(db.show('', 'showname', 'docid')).rejects.toThrow('Invalid parameters')
})

test('should detect missing parameters (callback) - db.show', () => {
  const db = nano.db.use('db')
  return new Promise((resolve, reject) => {
    db.show('', '', '', {}, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
