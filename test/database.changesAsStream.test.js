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
const response = {
  results: [
    {
      seq: '1-nC1J',
      id: 'c42ddf1272c7d05b2dc45b6962000b10',
      changes: [
        {
          rev: '1-23202479633c2b380f79507a776743d5'
        }
      ]
    }
  ],
  last_seq: '1-C1J',
  pending: 0
}

afterEach(() => {
  nock.cleanAll()
})

test('should get a streamed list of changes - GET /_changes - nano.db.changesAsStream', () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/db/_changes')
    .reply(200, response)

  return new Promise((resolve, reject) => {
    // test GET /db/_changes
    const db = nano.db.use('db')
    const s = db.changesAsStream()
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

test('should get a streamed list of changes with opts - GET /_changes - nano.db.changesAsStream', () => {
  // mocks
  const opts = { include_docs: true }
  const scope = nock(COUCH_URL)
    .get('/db/_changes')
    .query(opts)
    .reply(200, response)

  return new Promise((resolve, reject) => {
    // test GET /db/_changes
    const db = nano.db.use('db')
    const s = db.changesAsStream(opts)
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
