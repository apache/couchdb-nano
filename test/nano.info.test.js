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

const Nano = require('../lib/nano')
const COUCH_URL = 'http://localhost:5984'
const nano = Nano(COUCH_URL)
const nock = require('nock')

afterEach(() => {
  nock.cleanAll()
})

test('should be able to get info - GET / - nano.info', async () => {
  // mocks
  // https://docs.couchdb.org/en/stable/api/server/common.html#api-server-root
  const response = {
    couchdb: 'Welcome',
    version: '3.1.0',
    git_sha: 'ff0feea20',
    uuid: '396b43eec08b8827026730270d5fe0ce',
    features: ['access-ready', 'partitioned', 'pluggable-storage-engines', 'reshard', 'scheduler'],
    vendor: { name: 'The Apache Software Foundation' }
  }
  const scope = nock(COUCH_URL)
    .get('/')
    .reply(200, response)

  // test GET /_session
  const p = await nano.info()
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})
