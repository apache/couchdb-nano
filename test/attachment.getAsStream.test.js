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

test('should be able to get an attachment as a stream - GET /db/id/attname - db.attachment.getAsStream', () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/db/id/transparent.gif')
    .reply(200, image, { 'content-type': 'image/gif' })

  // test GET /db/id/attname
  return new Promise((resolve, reject) => {
    const db = nano.db.use('db')
    let response = Buffer.from('')
    db.attachment.getAsStream('id', 'transparent.gif')
      .on('data', (data) => {
        response = Buffer.concat([response, data])
      })
      .on('end', () => {
        expect(response).toStrictEqual(image)
        expect(scope.isDone()).toBe(true)
        resolve()
      })
  })
})

test('should emit an error when stream attachment does not exist - GET /db/id/attname - db.attachment.getAsStream', () => {
  // test GET /db/id/attname
  nock(COUCH_URL)
    .get('/db/id/notexists.gif')
    .reply(404, 'Object Not Found', { 'content-type': 'application/json' })

  return new Promise((resolve, reject) => {
    const db = nano.db.use('db')
    db.attachment.getAsStream('id', 'notexist.gif')
      .on('error', (e) => {
        expect(e.statusCode).toStrictEqual(404)
        resolve()
      })
  })
})
