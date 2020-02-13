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

test('should be able to get an attachment - GET /db/id/attname - db.attachment.get', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/db/id/transparent.gif')
    .reply(200, image, { 'content-type': 'image/gif' })

  // test GET /db/id/attname
  const db = nano.db.use('db')
  const p = await db.attachment.get('id', 'transparent.gif')
  expect(p).toStrictEqual(image)
  expect(scope.isDone()).toBe(true)
})

test('should be able to get an attachment with opts - GET /db/id/attname - db.attachment.get', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/db/id/transparent.gif?r=1')
    .reply(200, image, { 'content-type': 'image/gif' })

  // test GET /db/id/attname
  const db = nano.db.use('db')
  const p = await db.attachment.get('id', 'transparent.gif', { r: 1 })
  expect(p).toStrictEqual(image)
  expect(scope.isDone()).toBe(true)
})

test('should detect missing parameters - db.attachment.get', async () => {
  const db = nano.db.use('db')
  await expect(db.attachment.get()).rejects.toThrow('Invalid parameters')
  await expect(db.attachment.get('id')).rejects.toThrow('Invalid parameters')
  await expect(db.attachment.get('id', '')).rejects.toThrow('Invalid parameters')
  await expect(db.attachment.get('', 'transparent.gif')).rejects.toThrow('Invalid parameters')
})

test('should detect missing parameters (callback) - db.attachment.get', () => {
  const db = nano.db.use('db')
  return new Promise((resolve, reject) => {
    db.attachment.get(undefined, undefined, undefined, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
