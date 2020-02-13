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

test('should be able to query an index - POST /db/_find - db.find', async () => {
  // mocks
  const query = {
    selector: {
      $and: {
        date: {
          $gt: '2018'
        },
        name: 'Susan'
      }
    },
    fields: ['name', 'date', 'orderid']
  }
  const response = {
    docs: [
      { name: 'Susan', date: '2019-01-02', orderid: '4411' },
      { name: 'Susan', date: '2019-01-03', orderid: '8523' }
    ]
  }
  const scope = nock(COUCH_URL)
    .post('/db/_find', query)
    .reply(200, response)

  // test POST /db/_find
  const db = nano.db.use('db')
  const p = await db.find(query)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should handle 404 - POST /db/_find - db.find', async () => {
  // mocks
  const query = {
    selector: {
      name: 'Susan'
    }
  }
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  const scope = nock(COUCH_URL)
    .post('/db/_find', query)
    .reply(404, response)

  // test POST /db/_find
  const db = nano.db.use('db')
  await expect(db.find(query)).rejects.toThrow('missing')
  expect(scope.isDone()).toBe(true)
})

test('should detect missing query - db.find', async () => {
  const db = nano.db.use('db')
  await expect(db.find()).rejects.toThrow('Invalid parameters')
  await expect(db.find('susan')).rejects.toThrow('Invalid parameters')
})

test('should detect missing query (callback) - db.find', () => {
  const db = nano.db.use('db')
  return new Promise((resolve, reject) => {
    db.find('', (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
