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

test('should get a streamed list of documents from a view from  partition - GET /db/_partition/partition/_design/ddoc/_view/viewname - db.partitionedViewAsStream', async () => {
  // mocks
  const response = {
    rows: [
      { key: 'a', value: null }
    ]
  }
  const params = {
    reduce: false,
    startkey: 'a',
    endkey: 'b',
    limit: 1
  }
  const scope = nock(COUCH_URL)
    .get('/db/_partition/partition/_design/ddoc/_view/viewname?reduce=false&startkey=%22a%22&endkey=%22b%22&limit=1')
    .reply(200, response)

  return new Promise((resolve, reject) => {
    // test GET /db/_partition/partition/_design/ddoc/_view/viewnameGET /db/_all_docs
    const db = nano.db.use('db')
    const s = db.partitionedViewAsStream('partition', 'ddoc', 'viewname', params)
    expect(typeof s).toBe('object')
    let buffer = ''
    s.on('data', (chunk) => {
      buffer += chunk.toString()
    })
    s.on('end', () => {
      expect(buffer).toBe(JSON.stringify(response))
      expect(scope.isDone()).toBe(true)
      resolve()
    })
  })
})
