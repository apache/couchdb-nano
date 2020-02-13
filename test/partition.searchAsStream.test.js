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

test('should get a searched streamed list of documents from a partition- GET /db/_partition/partition/_design/ddoc/_search/searchname - db.partitionedSearchAsStream', async () => {
  // mocks
  const response = {
    total_rows: 100000,
    bookmark: 'g123',
    rows: [
      { a: 1, b: 2 }
    ]
  }
  const params = { q: '*:*' }
  const scope = nock(COUCH_URL)
    .get('/db/_partition/partition/_design/ddoc/_search/searchname?q=*:*')
    .reply(200, response)

  return new Promise((resolve, reject) => {
    // test GET /db/_partition/partition/_design/ddoc/_search/searchname
    const db = nano.db.use('db')
    const s = db.partitionedSearchAsStream('partition', 'ddoc', 'searchname', params)
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
