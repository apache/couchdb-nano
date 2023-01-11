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
const nano = Nano({ url: COUCH_URL })

test('should be able to authenticate - POST /_session - nano.auth', async () => {
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
      body: 'name=u&password=p',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=utf-8'
      }
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
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to handle cookie refresh - POST /_session - nano.auth', async () => {
  // mocks
  const username = 'u'
  const password = 'p'
  const response = { ok: true, name: 'admin', roles: ['_admin', 'admin'] }
  const c1 = 'AuthSession=YWRtaW46NUU0MTFBMDE6stHsxYnlDy4mYxwZEcnXHn4fm5w'
  const cookie1 = `${c1}; Version=1; Expires=Mon, 10-Feb-2050 09:03:21 GMT; Max-Age=600; Path=/; HttpOnly`
  const c2 = 'AuthSession=DE6stHsxYnlDy4YWRtaW46NUU0MTFBMmYxwZEcnXHn4fm5w'
  const cookie2 = `${c2}; Version=1; Expires=Mon, 10-Feb-2050 09:05:21 GMT; Max-Age=600; Path=/; HttpOnly`
  mockPool
    .intercept({
      method: 'post',
      path: '/_session',
      body: 'name=u&password=p',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=utf-8'
      }
    })
    .reply(200, response, {
      headers: {
        'content-type': 'application/json',
        'Set-Cookie': cookie1
      }
    })
  mockPool
    .intercept({
      path: '/_all_dbs',
      headers: {
        cookie: c1
      }
    })
    .reply(200, ['a'], {
      headers: {
        'content-type': 'application/json',
        'Set-Cookie': cookie2
      }
    })
  mockPool
    .intercept({
      path: '/_all_dbs',
      headers: {
        cookie: c2
      }
    })
    .reply(200, ['a'], JSON_HEADERS)

  // test POST /_session
  const p1 = await nano.auth(username, password)
  assert.deepEqual(p1, response)
  const p2 = await nano.db.list()
  assert.deepEqual(p2, ['a'])
  const p3 = await nano.db.list()
  assert.deepEqual(p3, ['a'])
  mockAgent.assertNoPendingInterceptors()
})
