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

test('should be able to destroy an attachment - DELETE /db/id/attname - db.attachment.destroy', async () => {
  // mocks
  const response = { ok: true, id: 'id', rev: '2-456' }
  const scope = nock(COUCH_URL)
    .delete('/db/id/logo.jpg?rev=1-123')
    .reply(200, response)

  // test DELETE DELETE /db/id/attname
  const db = nano.db.use('db')
  const p = await db.attachment.destroy('id', 'logo.jpg', { rev: '1-123' })
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle 409 conflicts - DELETE /db/id/attname- db.attachment.destroy', async () => {
  // mocks
  const response = {
    error: 'conflict',
    reason: 'Document update conflict.'
  }
  const scope = nock(COUCH_URL)
    .delete('/db/id/logo.jpg?rev=1-123')
    .reply(409, response)

  // test DELETE /db/id/attname
  const db = nano.db.use('db')
  await expect(db.attachment.destroy('id', 'logo.jpg', { rev: '1-123' })).rejects.toThrow('Document update conflict.')
  expect(scope.isDone()).toBe(true)
})

test('should detect missing doc id - db.attachment.destroy', async () => {
  const db = nano.db.use('db')
  await expect(db.attachment.destroy()).rejects.toThrow('Invalid parameters')
  await expect(db.attachment.destroy('id')).rejects.toThrow('Invalid parameters')
  await expect(db.attachment.destroy('id', '')).rejects.toThrow('Invalid parameters')
  await expect(db.attachment.destroy('', 'logo.jpg')).rejects.toThrow('Invalid parameters')
})

test('should detect missing parameters (callback) - db.attachment.destroy', () => {
  const db = nano.db.use('db')
  return new Promise((resolve, reject) => {
    db.attachment.destroy(undefined, undefined, undefined, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
