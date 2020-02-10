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

test('should be able to follow changes feed - nano.db.follow', () => {
  const db = nano.db.use('db')
  const feed = db.follow({ since: 'now' })
  expect(feed.constructor.name).toBe('Feed')
  // no need to test the changes feed follower - it has its own tests
})

test('should be able to follow changes feed (callback) - nano.db.follow', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/db')
    .reply(404, {
      error: 'not_found',
      reason: 'Database does not exist.'
    })

  return new Promise((resolve, reject) => {
    const db = nano.db.use('db')
    const feed = db.follow({ since: 'now' }, (err, data) => {
      expect(err).not.toBeNull()
      expect(scope.isDone()).toBe(true)
      resolve()
    })
    expect(feed.constructor.name).toBe('Feed')
  })
  // no need to test the changes feed follower - it has its own tests
})
