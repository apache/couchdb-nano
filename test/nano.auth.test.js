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
const nano = Nano({ url: COUCH_URL, jar: true })
const nano2 = Nano({ url: COUCH_URL, jar: true })
const nock = require('nock')

afterEach(() => {
  nock.cleanAll()
})

test('should be able to authenticate multiple separate sessions - POST /_session - nano.auth', async () => {
  // mocks
  const username = 'u'
  const username2 = 'u2'
  const password = 'p'
  const password2 = 'p2'
  const response = { ok: true, name: 'admin', roles: ['_admin', 'admin'] }
  const response2 = { ok: true, name: 'operator', roles: ['_admin'] }
  const authsession = 'AuthSession=YWRtaW46NUU0MTFBMDE6stHsxYnlDy4mYxwZEcnXHn4fm5w;'
  const authsession2 = 'AuthSession=XYZtaW46NUU0MTFBMDE6stHsxYnlDy4mYxwZEcnXHn4123;'
  const cookie = authsession + ' Version=1; Expires=Mon, 10-Feb-2050 09:03:21 GMT; Max-Age=600; Path=/; HttpOnly'
  const cookie2 = authsession2 + ' Version=1; Expires=Fri Jun 10 2022 20:13:00 GMT; Max-Age=300; Path=/; HttpOnly'
  const scope = nock(COUCH_URL)
    .post('/_session', 'name=u&password=p', { 'content-type': 'application/x-www-form-urlencoded; charset=utf-8' })
    .reply(200, response, { 'Set-Cookie': cookie })
    .get('/_all_dbs')
    .reply(200, ['a'])
    .post('/_session', 'name=u2&password=p2', { 'content-type': 'application/x-www-form-urlencoded; charset=utf-8' })
    .reply(200, response2, { 'Set-Cookie': cookie2 })
    .get('/_all_dbs')
    .reply(200, ['a'])
    .get('/_all_dbs')
    .reply(200, ['a'])

  // test POST /_session
  const p = await nano.auth(username, password)
  expect(p).toStrictEqual(response)
  await nano.db.list()
  expect(nano.config.cookies.length).toBe(1)
  expect(nano.config.cookies[0].toString().startsWith(authsession)).toBe(true)

  // test POST /_session
  const p2 = await nano2.auth(username2, password2)
  expect(p2).toStrictEqual(response2)
  await nano2.db.list()
  expect(nano2.config.cookies.length).toBe(1)
  expect(nano2.config.cookies[0].toString()).toMatch(new RegExp('^' + authsession2))

  await nano.db.list()
  expect(nano.config.cookies.length).toBe(1)
  expect(nano.config.cookies[0].toString()).toMatch(new RegExp('^' + authsession))

  expect(scope.isDone()).toBe(true)
})
