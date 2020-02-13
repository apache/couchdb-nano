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

test('should be able to fetch uuids - GET /_uuids - nano.uuids', async () => {
  // mocks
  const response = {
    uuids: [
      'c42ddf1272c7d05b2dc45b696200145f'
    ]
  }
  const scope = nock(COUCH_URL)
    .get('/_uuids?count=1')
    .reply(200, response)

  // test GET /_uuids
  const p = await nano.uuids()
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to fetch more uuids - GET /_uuids?count=3 - nano.uuids', async () => {
  // mocks
  const response = {
    uuids: [
      'c42ddf1272c7d05b2dc45b69620023df',
      'c42ddf1272c7d05b2dc45b6962002616',
      'c42ddf1272c7d05b2dc45b69620028cf'
    ]
  }
  const scope = nock(COUCH_URL)
    .get('/_uuids?count=3')
    .reply(200, response)

  // test GET /_uuids
  const p = await nano.uuids(3)
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to fetch uuids callback - GET /_uuids - nano.uuids', () => {
  // mocks
  const response = {
    uuids: [
      'c42ddf1272c7d05b2dc45b696200145f'
    ]
  }
  const scope = nock(COUCH_URL)
    .get('/_uuids?count=1')
    .reply(200, response)

  // test GET /_uuids
  return new Promise((resolve, reject) => {
    nano.uuids((err, data) => {
      expect(err).toBe(null)
      expect(data).toStrictEqual(response)
      expect(scope.isDone()).toBe(true)
      resolve()
    })
  })
})
