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

const nock = require('nock')
const Nano = require('..')
const COUCH_URL = 'http://localhost:5984'
const http = require('http')
const httpAgent = new http.Agent()

afterEach(() => {
  nock.cleanAll()
})

test('should be able to log output with a user-supplied http agent', async () => {
  // setup Nano with custom logger
  const logs = []
  const nano = Nano({
    url: COUCH_URL,
    log: (data) => {
      logs.push(data)
    },
    requestDefaults: {
      agent: httpAgent
    }
  })

  // mocks
  const response = { _id: 'id', rev: '1-123', a: 1, b: 'two', c: true }
  const scope = nock(COUCH_URL)
    .get('/db/id')
    .reply(200, response)

  // test GET /db/id
  const db = nano.db.use('db')
  const p = await db.get('id')
  expect(p).toStrictEqual(response)
  expect(logs.length).toBe(2)
  expect(scope.isDone()).toBe(true)
})
