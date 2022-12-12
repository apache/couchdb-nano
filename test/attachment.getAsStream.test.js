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

const test = require('node:test')
const assert = require('node:assert/strict')
const { COUCH_URL, mockAgent, mockPool, JSON_HEADERS } = require('./mock.js')
const Nano = require('..')
const nano = Nano(COUCH_URL)
const image = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

test('should be able to get an attachment as a stream - GET /db/id/attname - db.attachment.getAsStream', () => {
  // mocks
  mockPool
    .intercept({ path: '/db/id/transparent.gif' })
    .reply(200, image, { headers: { 'content-type': 'image/gif' } })

  // test GET /db/id/attname
  return new Promise((resolve, reject) => {
    const db = nano.db.use('db')
    let response = Buffer.from('')
    db.attachment.getAsStream('id', 'transparent.gif')
      .on('data', (data) => {
        response = Buffer.concat([response, data])
      })
      .on('end', () => {
        assert.equal(response.toString('base64'), image.toString('base64'))
        mockAgent.assertNoPendingInterceptors()
        resolve()
      })
  })
})

test('should emit an error when stream attachment does not exist - GET /db/id/attname - db.attachment.getAsStream', async () => {
  // test GET /db/id/attname
  const response = { error: 'not_found', reason: 'Document is missing attachment' }
  mockPool
    .intercept({ path: '/db/id/notexist.gif' })
    .reply(404, response, JSON_HEADERS)

  await new Promise((resolve, reject) => {
    const db = nano.db.use('db')
    db.attachment.getAsStream('id', 'notexist.gif')
      .on('error', (e) => {
        console.log(e)
        assert.equal(e.statusCode, 404)
        resolve()
      })
  })
})
