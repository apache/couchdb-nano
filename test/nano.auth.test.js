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
const nock = require('nock')

afterEach(() => {
  nock.cleanAll()
})

test('should be able to authenticate - POST /_session - nano.auth', async () => {
  // mocks
  const username = 'u'
  const password = 'p'
  const response = { ok: true, name: 'admin', roles: ['_admin', 'admin'] }
  const c = 'AuthSession=YWRtaW46NUU0MTFBMDE6stHsxYnlDy4mYxwZEcnXHn4fm5w'
  const cookie = `${c}; Version=1; Expires=Mon, 10-Feb-2050 09:03:21 GMT; Max-Age=600; Path=/; HttpOnly`
  const scope = nock(COUCH_URL)
    .post('/_session', 'name=u&password=p', { 'content-type': 'application/x-www-form-urlencoded; charset=utf-8' })
    .reply(200, response, { 'Set-Cookie': cookie })
    .get('/_all_dbs')
    .reply(200, ['a'])

  // test POST /_session
  const p = await nano.auth(username, password)
  expect(p).toStrictEqual(response)
  await nano.db.list()
  expect(scope.isDone()).toBe(true)
})
