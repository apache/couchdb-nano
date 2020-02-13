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

test('should be able to destroy a document - DELETE /db/id - db.destroy', async () => {
  // mocks
  const response = { ok: true, id: 'id', rev: '2-456' }
  const scope = nock(COUCH_URL)
    .delete('/db/id?rev=1-123')
    .reply(200, response)

  // test DELETE /db/id
  const db = nano.db.use('db')
  const p = await db.destroy('id', '1-123')
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle 409 conflicts - DELETE /db/id - db.destroy', async () => {
  // mocks
  const response = {
    error: 'conflict',
    reason: 'Document update conflict.'
  }
  const scope = nock(COUCH_URL)
    .delete('/db/id?rev=1-123')
    .reply(409, response)

  // test DELETE /db/id
  const db = nano.db.use('db')
  await expect(db.destroy('id', '1-123')).rejects.toThrow('Document update conflict.')
  expect(scope.isDone()).toBe(true)
})

test('should detect missing parameters - db.destroy', async () => {
  const db = nano.db.use('db')
  await expect(db.destroy(undefined, '1-123')).rejects.toThrow('Invalid parameters')
})

test('should detect missing parameters (callback) - db.destroy', () => {
  return new Promise((resolve, reject) => {
    const db = nano.db.use('db')
    db.destroy(undefined, undefined, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
