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

const multipartResponse = ''.concat(
  '--e89b3e29388aef23453450d10e5aaed0',
  'Content-Type: application/json',
  '',
  '{"_id":"secret","_rev":"2-c1c6c44c4bc3c9344b037c8690468605","_attachments":{"recipe.txt":{"content_type":"text/plain","revpos":2,"digest":"md5-HV9aXJdEnu0xnMQYTKgOFA==","length":86,"follows":true}}}',
  '--e89b3e29388aef23453450d10e5aaed0',
  'Content-Disposition: attachment; filename="recipe.txt"',
  'Content-Type: text/plain',
  'Content-Length: 86',
  '',
  '1. Take R',
  '2. Take E',
  '3. Mix with L',
  '4. Add some A',
  '5. Serve with X',
  '',
  '--e89b3e29388aef23453450d10e5aaed0--')

test('should be able to fetch a document with attachments - multipart GET /db - db.multipart.get', async () => {
  // mocks
  mockPool
    .intercept({
      path: '/db/docid?attachments=true',
      headers: {
        accept: 'multipart/related'
      }
    })
    .reply(200, multipartResponse, { headers: { 'content-type': 'multipart/related; boundary="e89b3e29388aef23453450d10e5aaed0"' } })

  // test GET /db/id?attachments=true
  const db = nano.db.use('db')
  const p = await db.multipart.get('docid')
  assert.deepEqual(p, multipartResponse)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to fetch a document with attachments with opts - multipart GET /db - db.multipart.get', async () => {
  // mocks
  mockPool
    .intercept({
      path: '/db/docid?attachments=true&conflicts=true',
      headers: {
        accept: 'multipart/related'
      }
    })
    .reply(200, multipartResponse, { headers: { 'content-type': 'multipart/related; boundary="e89b3e29388aef23453450d10e5aaed0"' } })

  // test GET /db/id?attachments=true&x=y
  const db = nano.db.use('db')
  const p = await db.multipart.get('docid', { conflicts: true })
  assert.deepEqual(p, multipartResponse)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to handle 404 - db.multipart.get', async () => {
  // mocks
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  mockPool
    .intercept({
      path: '/db/docid?attachments=true',
      headers: {
        accept: 'multipart/related'
      }
    })
    .reply(404, response, JSON_HEADERS)

  // test GET /db
  const db = nano.db.use('db')
  await assert.rejects(db.multipart.get('docid'), { message: 'missing' })
  mockAgent.assertNoPendingInterceptors()
})

test('should detect missing docName - db.multipart.get', async () => {
  const db = nano.db.use('db')
  await assert.rejects(db.multipart.get(), { message: 'Invalid parameters' })
  await assert.rejects(db.multipart.get(''), { message: 'Invalid parameters' })
  await assert.rejects(db.multipart.get(undefined, { conflicts: true }), { message: 'Invalid parameters' })
})

test('should detect missing parameters (callback) - db.multipart.get', async () => {
  const db = nano.db.use('db')
  return new Promise((resolve, reject) => {
    db.multipart.get(undefined, undefined, (err, data) => {
      assert.notEqual(err, null)
      resolve()
    })
  })
})
