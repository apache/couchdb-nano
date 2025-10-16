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

import test from 'node:test'
import assert from 'node:assert/strict'
import { COUCH_URL, mockAgent, mockPool, JSON_HEADERS } from './mock.js'
import Nano from '../lib/nano.js'

test('should be able to log output with user-defined function', async () => {
  // setup Nano with custom logger
  const logs = []
  const nano = Nano({
    url: COUCH_URL,
    log: (data) => {
      logs.push(data)
    }
  })

  // mocks
  const response = { _id: 'id', rev: '1-123', a: 1, b: 'two', c: true }
  mockPool
    .intercept({ path: '/db/id' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/id
  const db = nano.db.use('db')
  const p = await db.get('id')
  assert.deepEqual(p, response)
  assert.equal(logs.length, 2)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to log output with cookie auth', async () => {
  // setup Nano with custom logger
  const logs = []
  const nano = Nano({
    url: COUCH_URL,
    log: (data) => {
      logs.push(data)
    }
  })

  // mocks
  // mocks
  const username = 'u'
  const password = 'p'
  const response = { ok: true, name: 'admin', roles: ['_admin', 'admin'] }
  const c = 'AuthSession=YWRtaW46NUU0MTFBMDE6stHsxYnlDy4mYxwZEcnXHn4fm5w'
  const cookie = `${c}; Version=1; Expires=Mon, 10-Feb-2050 09:03:21 GMT; Max-Age=600; Path=/; HttpOnly`

  mockPool
    .intercept({
      method: 'post',
      path: '/_session',
      body: JSON.stringify({ name: username, password })
    })
    .reply(200, response, {
      headers: {
        'content-type': 'application/json',
        'Set-Cookie': cookie
      }
    })
  mockPool
    .intercept({
      path: '/_all_dbs',
      headers: {
        cookie: c
      }
    })
    .reply(200, ['a'], JSON_HEADERS)

  // test POST /_session
  const p = await nano.auth(username, password)
  assert.deepEqual(p, response)
  const q = await nano.db.list()
  assert.deepEqual(q, ['a'])
  assert.equal(logs.length, 4)
  // check set-cookie and cookie are scrubbed
  assert.equal(logs[1].headers['set-cookie'], 'XXXXXX')
  assert.equal(logs[2].headers['cookie'], 'XXXXXX')
  mockAgent.assertNoPendingInterceptors()
})
