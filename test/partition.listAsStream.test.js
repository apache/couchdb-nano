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

test('should get a streamed list of documents from a partition- GET /db/_partition/partition/_all_docs - db.partitionedListAsStream', async () => {
  // mocks
  const response = {
    total_rows: 23516,
    offset: 0,
    rows: [
      {
        id: 'partition:1000501',
        key: 'partition:1000501',
        value: {
          rev: '2-46dcf6bf2f8d428504f5290e591aa182'
        }
      },
      {
        id: 'partition:1000543',
        key: 'partition:1000543',
        value: {
          rev: '1-3256046064953e2f0fdb376211fe78ab'
        }
      },
      {
        id: 'partition:100077',
        key: 'partition:100077',
        value: {
          rev: '1-101bff1251d4bd75beb6d3c232d05a5c'
        }
      }
    ]
  }
  const scope = nock(COUCH_URL)
    .get('/db/_partition/partition/_all_docs')
    .reply(200, response)

  return new Promise((resolve, reject) => {
    // test GET /db/_partition/_all_docs
    const db = nano.db.use('db')
    const s = db.partitionedListAsStream('partition')
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

test('should get a streamed list of documents from a partition with opts- GET /db/_all_docs - db.partitionedListAsStream', async () => {
  // mocks
  const response = {
    total_rows: 23516,
    offset: 0,
    rows: [
      {
        id: 'partition:1000501',
        key: 'partition:1000501',
        value: {
          rev: '2-46dcf6bf2f8d428504f5290e591aa182'
        },
        doc: {
          _id: 'partition:1000501',
          _rev: '2-46dcf6bf2f8d428504f5290e591aa182',
          a: 1,
          b: 2
        }
      }
    ]
  }
  const scope = nock(COUCH_URL)
    .get('/db/_partition/partition/_all_docs?limit=1&include_docs=true')
    .reply(200, response)

  return new Promise((resolve, reject) => {
    // test GET /db/_partition/_all_docs
    const db = nano.db.use('db')
    const s = db.partitionedListAsStream('partition', { limit: 1, include_docs: true })
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
