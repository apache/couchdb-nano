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
const image = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

afterEach(() => {
  nock.cleanAll()
})

test('should be able to insert document attachment - PUT /db/docname/attachment - db.attachment.insert', async () => {
  // mocks
  const response = { ok: true, id: 'docname', rev: '2-456' }
  const scope = nock(COUCH_URL, { reqheaders: { 'content-type': 'image/gif' } })
    .put('/db/docname/transparent.gif?rev=1-150', image)
    .reply(200, response)

  // test PUT /db/docname/attachment
  const db = nano.db.use('db')
  const p = await db.attachment.insert('docname', 'transparent.gif', image, 'image/gif', { rev: '1-150' })
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle 404 - db.attachment.insert', async () => {
  // mocks
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  const scope = nock(COUCH_URL, { reqheaders: { 'content-type': 'image/gif' } })
    .put('/db/docname/transparent.gif?rev=1-150', image)
    .reply(404, response)

  // test PUT /db/docname/attachment
  const db = nano.db.use('db')
  await expect(db.attachment.insert('docname', 'transparent.gif', image, 'image/gif', { rev: '1-150' })).rejects.toThrow('missing')
  expect(scope.isDone()).toBe(true)
})

test('should detect missing parameters - db.attachment.insert', async () => {
  const db = nano.db.use('db')
  await expect(db.attachment.insert()).rejects.toThrow('Invalid parameters')
  await expect(db.attachment.insert('docname')).rejects.toThrow('Invalid parameters')
  await expect(db.attachment.insert('docname', 't.gif')).rejects.toThrow('Invalid parameters')
  await expect(db.attachment.insert('docname', 't.gif', image)).rejects.toThrow('Invalid parameters')
})

test('should detect missing parameters (callback) - db.attachment.insert', () => {
  const db = nano.db.use('db')
  return new Promise((resolve, reject) => {
    db.attachment.insert(undefined, undefined, undefined, undefined, undefined, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
