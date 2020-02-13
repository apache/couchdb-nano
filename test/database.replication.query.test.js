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
  _id: 'rep1',
  _rev: '2-05a9e090e2bb0977c06b870c870153c5',
  source: 'http://localhost:5984/cities',
  target: 'http://localhost:5984/cities2',
  create_target: true,
  continuous: false,
  owner: 'admin',
  _replication_state: 'completed',
  _replication_state_time: '2019-11-06T13:20:17Z',
  _replication_stats: {
    revisions_checked: 23519,
    missing_revisions_found: 23519,
    docs_read: 23519,
    docs_written: 23519,
    changes_pending: 5127,
    doc_write_failures: 0,
    checkpointed_source_seq: '23523-g1AAAACheJzLYWBgYMpgTmEQTM4vTc5ISXLIyU9OzMnILy7JAUklMiTV____PyuDOYmBQU8-FyjGnphilJRqbIpNDx6T8liAJEMDkPoPN1D3CNhAc2NzU1MzI2xaswBdZzGv',
    start_time: '2019-11-06T13:19:39Z'
  }
}
const errResponse = {
  error: 'not_found',
  reason: 'missing'
}

afterEach(() => {
  nock.cleanAll()
})

test('should be able to query a replication - GET /_replicator/id - nano.db.replication.query', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/_replicator/rep1')
    .reply(200, response)

  // test GET /_replicator/id
  const p = await nano.db.replication.query('rep1')
  expect(p).toEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to query a replication with opts - GET /_replicator/id?confilicts=true - nano.db.replication.query', async () => {
  // mocks
  const opts = { conflicts: true }
  const scope = nock(COUCH_URL)
    .get('/_replicator/rep1')
    .query(opts)
    .reply(200, response)

  // test GET /_replicator/id
  const p = await nano.db.replication.query('rep1', opts)
  expect(p).toEqual(response)
  expect(scope.isDone()).toBe(true)
})

test('should be able to query a replication and handle 404 - GET /_replicator/id - nano.db.replication.query', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/_replicator/rep1')
    .reply(404, errResponse)

  // test GET /_replicator/id
  await expect(nano.db.replication.query('rep1')).rejects.toThrow('missing')
  expect(scope.isDone()).toBe(true)
})

test('should not attempt info fetch with invalid parameters - nano.db.replication.query', async () => {
  await expect(nano.db.replication.query('')).rejects.toThrowError('Invalid parameters')
  await expect(nano.db.replication.query()).rejects.toThrowError('Invalid parameters')
})

test('should detect missing parameters (callback) - nano.db.replication.query', () => {
  return new Promise((resolve, reject) => {
    nano.db.replication.query(undefined, undefined, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})

test('should be able to query a replication from db.replication.quey - GET /_replicator/id - db.replication.query', async () => {
  // mocks
  const scope = nock(COUCH_URL)
    .get('/_replicator/rep1')
    .reply(200, response)

  // test GET /_replicator/id
  const db = nano.db.use('db')
  const p = await db.replication.query('rep1')
  expect(p).toEqual(response)
  expect(scope.isDone()).toBe(true)
})
