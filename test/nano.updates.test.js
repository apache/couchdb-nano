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
      db_name: 'firehosetarget',
      type: 'updated',
      seq: '1678-g1AAAACheJzLYWBgYMpgTmEQTM4vTc5ISXLIyU9OzMnILy7JAUklMiTV____PyuDOQnIi8gFirGnmKQaJhqZY9ODx6Q8FiDJ0ACk_sMNZDGDGGhubJCWmopNaxYASRExkg'
    },
    {
      db_name: 'bob',
      type: 'created',
      seq: '1679-g1AAAACheJzLYWBgYMpgTmEQTM4vTc5ISXLIyU9OzMnILy7JAUklMiTV____PyuDOQnIi8gFirGnmKQaJhqZY9ODx6Q8FiDJ0ACk_sMNZDGHGGhubJCWmopNaxYASTMxkw'
    },
    {
      db_name: 'bob',
      type: 'updated',
      seq: '1680-g1AAAACheJzLYWBgYMpgTmEQTM4vTc5ISXLIyU9OzMnILy7JAUklMiTV____PyuDOQnIi8gFirGnmKQaJhqZY9ODx6Q8FiDJ0ACk_sMNZLGAGGhubJCWmopNaxYASVUxlA'
    }
  ],
  last_seq: '1680-g1AAAACheJzLYWBgYMpgTmEQTM4vTc5ISXLIyU9OzMnILy7JAUklMiTV____PyuDOQnIi8gFirGnmKQaJhqZY9ODx6Q8FiDJ0ACk_sMNZLGAGGhubJCWmopNaxYASVUxlA'
}
const errResponse = {
  error: 'not_found',
  reason: 'Database does not exist.'
}

afterEach(() => {
  nock.cleanAll()
})

test('should be able to fetch db updates - GET /_db_updates - nano.updates', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/_db_updates')
    .reply(200, response)

  // test GET /_db_updates
  const p = await nano.updates()
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to fetch db updates with options - GET /_db_updates - nano.updates', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/_db_updates?timeout=10000')
    .reply(200, response)

  // test GET /_db_updates
  const p = await nano.updates({ timeout: 10000 })
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should handle 404 - GET /_db_updates - nano.updates', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/_db_updates')
    .reply(404, errResponse)

  // test GET /_db_updates
  await expect(nano.db.updates()).rejects.toThrow('Database does not exist.')
  expect(scope.isDone()).toBe(true)
})
