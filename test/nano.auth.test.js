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

test('should be able to authenticate - POST /_session - nano.auth', async () => {
  // mocks
  const username = 'u'
  const password = 'p'
  const response = { ok: true, name: 'admin', roles: ['_admin', 'admin'] }
  const scope = nock(COUCH_URL)
    .post('/_session', 'name=u&password=p', { 'content-type': 'application/x-www-form-urlencoded; charset=utf-8' })
    .reply(200, response)

  // test GET /_uuids
  const p = await nano.auth(username, password)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})
