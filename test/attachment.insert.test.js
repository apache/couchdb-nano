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
const fs = require('fs')
const image = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
const image2 = Buffer.from(''.concat(
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAsV',
  'BMVEUAAAD////////////////////////5ur3rEBn////////////////wDBL/',
  'AADuBAe9EB3IEBz/7+//X1/qBQn2AgP/f3/ilpzsDxfpChDtDhXeCA76AQH/v7',
  '/84eLyWV/uc3bJPEf/Dw/uw8bRWmP1h4zxSlD6YGHuQ0f6g4XyQkXvCA36MDH6',
  'wMH/z8/yAwX64ODeh47BHiv/Ly/20dLQLTj98PDXWmP/Pz//39/wGyJ7Iy9JAA',
  'AADHRSTlMAbw8vf08/bz+Pv19jK/W3AAAAg0lEQVR4Xp3LRQ4DQRBD0QqTm4Y5',
  'zMxw/4OleiJlHeUtv2X6RbNO1Uqj9g0RMCuQO0vBIg4vMFeOpCWIWmDOw82fZx',
  'vaND1c8OG4vrdOqD8YwgpDYDxRgkSm5rwu0nQVBJuMg++pLXZyr5jnc1BaH4GT',
  'LvEliY253nA3pVhQqdPt0f/erJkMGMB8xucAAAAASUVORK5CYII='), 'base64')

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

test('should be able to insert document attachment as stream - PUT /db/docname/attachment - db.attachment.insert', async () => {
  // mocks
  const response = { ok: true, id: 'docname', rev: '2-456' }
  const scope = nock(COUCH_URL, { reqheaders: { 'content-type': 'image/jpg' } })
    .put('/db/docname/logo.jpg?rev=1-150', image2)
    .reply(200, response)

  // test PUT /db/docname/attachment
  const rs = fs.createReadStream('./test/logo.jpg')
  const db = nano.db.use('db')
  const reply = await db.attachment.insert('docname', 'logo.jpg', rs, 'image/jpg', { rev: '1-150' })
  expect(reply).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to insert document attachment as stream with circular reference - PUT /db/docname/attachment - db.attachment.insert', async () => {
  // mocks
  const response = { ok: true, id: 'docname', rev: '2-456' }
  const scope = nock(COUCH_URL, { reqheaders: { 'content-type': 'image/jpg' } })
    .put('/db/docname/logo2.jpg?rev=1-150', image2)
    .reply(200, response)

  // test PUT /db/docname/attachment
  const rs = fs.createReadStream('./test/logo.jpg')
  // create artificial circular reference to make sure nano doesn't trip over on it
  rs.test = rs
  const db = nano.db.use('db')
  const reply = await db.attachment.insert('docname', 'logo2.jpg', rs, 'image/jpg', { rev: '1-150' })
  expect(reply).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})
