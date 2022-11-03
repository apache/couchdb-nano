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

test('should be able to fetch a list of document revisions - POST /db/_all_docs - db.fetchRevs', async () => {
  // mocks
  const keys = ['1000501', '1000543', '100077']
  const response = {
    total_rows: 23516,
    offset: 0,
    rows: [
      {
        id: '1000501',
        key: '1000501',
        value: {
          rev: '2-46dcf6bf2f8d428504f5290e591aa182'
        }
      },
      {
        id: '1000543',
        key: '1000543',
        value: {
          rev: '1-3256046064953e2f0fdb376211fe78ab'
        }
      },
      {
        id: '100077',
        key: '100077',
        value: {
          rev: '1-101bff1251d4bd75beb6d3c232d05a5c'
        }
      }
    ]
  }
  const scope = nock(COUCH_URL)
    .post('/db/_all_docs', { keys })
    .reply(200, response)

  // test POST /db/_all_docs
  const db = nano.db.use('db')
  const p = await db.fetchRevs({ keys })
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to fetch a list of document revisions  with opts - POST /db/_all_docs - db.fetchRevs', async () => {
  // mocks
  const keys = ['1000501', '1000543', '100077']
  const response = {
    total_rows: 23516,
    offset: 0,
    rows: [
      {
        id: '1000501',
        key: '1000501',
        value: {
          rev: '2-46dcf6bf2f8d428504f5290e591aa182'
        }
      },
      {
        id: '1000543',
        key: '1000543',
        value: {
          rev: '1-3256046064953e2f0fdb376211fe78ab'
        }
      },
      {
        id: '100077',
        key: '100077',
        value: {
          rev: '1-101bff1251d4bd75beb6d3c232d05a5c'
        }
      }
    ]
  }
  const scope = nock(COUCH_URL)
    .post('/db/_all_docs?descending=true', { keys })
    .reply(200, response)

  // test POST /db/_all_docs
  const db = nano.db.use('db')
  const p = await db.fetchRevs({ keys }, { descending: true })
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to handle 404 - POST /db/_all_docs - db.fetchRevs', async () => {
  // mocks
  const keys = ['1000501', '1000543', '100077']
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  const scope = nock(COUCH_URL)
    .post('/db/_all_docs', { keys })
    .reply(404, response)

  // test POST /db/_all_docs
  const db = nano.db.use('db')
  await expect(db.fetchRevs({ keys })).rejects.toThrow('missing')
  expect(scope.isDone()).toBe(true)
})

test('should detect missing parameters - db.fetchRevs', async () => {
  const db = nano.db.use('db')
  await expect(db.fetchRevs()).rejects.toThrow('Invalid parameters')
  await expect(db.fetchRevs({})).rejects.toThrow('Invalid parameters')
  await expect(db.fetchRevs({ keys: {} })).rejects.toThrow('Invalid parameters')
  await expect(db.fetchRevs({ keys: '123' })).rejects.toThrow('Invalid parameters')
  await expect(db.fetchRevs({ keys: [] })).rejects.toThrow('Invalid parameters')
})

test('should detect missing parameters (callback) - db.fetchRevs', () => {
  return new Promise((resolve, reject) => {
    const db = nano.db.use('db')
    db.fetchRevs(undefined, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
