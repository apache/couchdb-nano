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
const { COUCH_URL, mockAgent, mockPool } = require('./mock.js')
const Nano = require('..')
const nano = Nano(COUCH_URL)
const image = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

test('should be able to get an attachment - GET /db/id/attname - db.attachment.get', async () => {
  // mocks
  mockPool
    .intercept({ path: '/db/id/transparent.gif' })
    .reply(200, image, { headers: { 'content-type': 'image/gif' } })

  // test GET /db/id/attname
  const db = nano.db.use('db')
  const p = await db.attachment.get('id', 'transparent.gif')
  assert.equal(p.toString('base64'), image.toString('base64'))
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to get an attachment with opts - GET /db/id/attname - db.attachment.get', async () => {
  // mocks
  mockPool
    .intercept({ path: '/db/id/transparent.gif?r=1' })
    .reply(200, image, { headers: { 'content-type': 'image/gif' } })

  // test GET /db/id/attname
  const db = nano.db.use('db')
  const p = await db.attachment.get('id', 'transparent.gif', { r: 1 })
  assert.equal(p.toString('base64'), image.toString('base64'))
  mockAgent.assertNoPendingInterceptors()
})

test('should detect missing parameters - db.attachment.get', async () => {
  const db = nano.db.use('db')
  await assert.rejects(db.attachment.get(), { message: 'Invalid parameters' })
  await assert.rejects(db.attachment.get('id'), { message: 'Invalid parameters' })
  await assert.rejects(db.attachment.get('id', ''), { message: 'Invalid parameters' })
  await assert.rejects(db.attachment.get('', 'transparent.gif'), { message: 'Invalid parameters' })
})

test('should detect missing parameters (callback) - db.attachment.get', () => {
  const db = nano.db.use('db')
  return new Promise((resolve, reject) => {
    db.attachment.get(undefined, undefined, undefined, (err, data) => {
      assert.notEqual(err, null)
      resolve()
    })
  })
})
