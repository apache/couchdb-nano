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
const http = require('node:http')
const Nano = require('..')

// mocks
// undici's MockAgent always delivers a complete response body, so these tests
// use a real local HTTP server that can break off a response mid-body
const responses = {
  '/db/json': { type: 'application/json', body: '{"_id":"json","a":', complete: false },
  '/db/text': { type: 'text/plain', body: 'some text', complete: false },
  '/db/binary': { type: 'application/octet-stream', body: 'some bytes', complete: false },
  '/db/notjson': { type: 'application/json', body: 'not json', complete: true }
}
const server = http.createServer((req, res) => {
  const r = responses[req.url]
  // when incomplete, promise more bytes than are sent, then drop the connection
  const length = r.complete ? r.body.length : 100
  res.writeHead(200, { 'content-type': r.type, 'content-length': length })
  res.write(r.body)
  if (r.complete) {
    res.end()
  } else {
    setTimeout(() => { res.socket.destroy() }, 10)
  }
})
let db

test.before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const nano = Nano(`http://127.0.0.1:${server.address().port}`)
  db = nano.db.use('db')
})

test.after(() => {
  server.closeAllConnections()
  server.close()
})

test('should reject when a JSON response body breaks off - db.get', { timeout: 5000 }, async () => {
  // test GET /db/json
  await assert.rejects(db.get('json'), { message: /error happened in your connection/ })
})

test('should reject when a text response body breaks off - db.get', { timeout: 5000 }, async () => {
  // test GET /db/text
  await assert.rejects(db.get('text'), { message: /error happened in your connection/ })
})

test('should reject when a binary response body breaks off - db.get', { timeout: 5000 }, async () => {
  // test GET /db/binary
  await assert.rejects(db.get('binary'), { message: /error happened in your connection/ })
})

test('should resolve a complete JSON response body that cannot be parsed as a blank string - db.get', { timeout: 5000 }, async () => {
  // test GET /db/notjson
  const p = await db.get('notjson')
  assert.equal(p, '')
})
