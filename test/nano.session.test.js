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

afterEach(() => {
  nock.cleanAll()
})

test('should be able to check your session - GET /_session - nano.auth', async () => {
  // mocks
  const response = { ok: true, userCtx: { name: null, roles: [] }, info: { authentication_db: '_users', authentication_handlers: ['cookie', 'default'] } }
  const scope = nock(COUCH_URL)
    .get('/_session')
    .reply(200, response)

  // test GET /_session
  const p = await nano.session()
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})
