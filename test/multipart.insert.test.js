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
const image1 = Buffer.from(''.concat(
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAsV',
  'BMVEUAAAD////////////////////////5ur3rEBn////////////////wDBL/',
  'AADuBAe9EB3IEBz/7+//X1/qBQn2AgP/f3/ilpzsDxfpChDtDhXeCA76AQH/v7',
  '/84eLyWV/uc3bJPEf/Dw/uw8bRWmP1h4zxSlD6YGHuQ0f6g4XyQkXvCA36MDH6',
  'wMH/z8/yAwX64ODeh47BHiv/Ly/20dLQLTj98PDXWmP/Pz//39/wGyJ7Iy9JAA',
  'AADHRSTlMAbw8vf08/bz+Pv19jK/W3AAAAg0lEQVR4Xp3LRQ4DQRBD0QqTm4Y5',
  'zMxw/4OleiJlHeUtv2X6RbNO1Uqj9g0RMCuQO0vBIg4vMFeOpCWIWmDOw82fZx',
  'vaND1c8OG4vrdOqD8YwgpDYDxRgkSm5rwu0nQVBJuMg++pLXZyr5jnc1BaH4GT',
  'LvEliY253nA3pVhQqdPt0f/erJkMGMB8xucAAAAASUVORK5CYII='), 'base64')
const image2 = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
const images = [
  { name: 'logo.jpg', data: image1, content_type: 'image/jpg' },
  { name: 'transparent.gif', data: image2, content_type: 'image/gif' }
]
const doc = {
  a: 1,
  b: 2,
  _attachments: {
    'logo.jpg': {
      follows: true,
      content_type: 'image/jpg',
      length: image1.length
    },
    'transparent.gif': {
      follows: true,
      content_type: 'image/gif',
      length: image2.length
    }
  }
}

afterEach(() => {
  nock.cleanAll()
})

test('should be able to insert a document with attachments #1 - multipart PUT /db/id - db.multipart.insert', async () => {
  // mocks
  const response = { ok: true, id: '8s8g8h8h9', rev: '1-123' }
  const scope = nock(COUCH_URL)
    .matchHeader('content-type', h => h.includes('multipart/related'))
    .put('/db/docid')
    .reply(200, response)

  // test PUT /db/id
  const db = nano.db.use('db')
  const p = await db.multipart.insert(doc, images, 'docid')
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to insert a document with attachments #2 - multipart PUT /db/id - db.multipart.insert', async () => {
  const response = { ok: true, id: '8s8g8h8h9', rev: '1-123' }
  const scope = nock(COUCH_URL)
    .matchHeader('content-type', h => h.includes('multipart/related'))
    .put('/db/docid')
    .reply(200, response)

  // test PUT /db/id
  const db = nano.db.use('db')
  const p = await db.multipart.insert(doc, images, { docName: 'docid' })
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle 404 - db.multipart.insert', async () => {
  // mocks
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  const scope = nock(COUCH_URL)
    .matchHeader('content-type', h => h.includes('multipart/related'))
    .put('/db/docid')
    .reply(404, response)

  // test PUT /db/id
  const db = nano.db.use('db')
  await expect(db.multipart.insert(doc, images, { docName: 'docid' })).rejects.toThrow('missing')
  expect(scope.isDone()).toBe(true)
})

test('should detect missing docName - db.multipart.insert', async () => {
  const db = nano.db.use('db')
  await expect(db.multipart.insert()).rejects.toThrow('Invalid parameters')
  await expect(db.multipart.insert({ a: 1 }, [{}])).rejects.toThrow('Invalid parameters')
  await expect(db.multipart.insert({ a: 1 }, [{}], {})).rejects.toThrow('Invalid parameters')
})

test('should detect missing parameters (callback) - db.multipart.insert', () => {
  const db = nano.db.use('db')
  return new Promise((resolve, reject) => {
    db.multipart.insert(undefined, undefined, undefined, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
