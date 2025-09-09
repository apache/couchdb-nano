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

const test = require('node:test')
const assert = require('node:assert/strict')
const { COUCH_URL, mockAgent, mockPool, JSON_HEADERS } = require('./mock.js')
const Nano = require('..')
const nano = Nano(COUCH_URL)
const DBNAME = 'db'

test('should be able to follow changes feed - db.changesReader.start', async () => {
  const changesResponse = { results: [], last_seq: '1-0', pending: 0 }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=now&timeout=60000'
    })
    .reply(200, changesResponse, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start()
  await new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      // after our initial call with since=now, we should get a reply with last_seq=0-1
      assert.equal(seq, '1-0')
      db.changesReader.stop()
      mockAgent.assertNoPendingInterceptors()
      resolve()
    })
  })
})

test('should respect the fastChanges flag - db.changesReader.start', async () => {
  const changesResponse = { results: [], last_seq: '1-0', pending: 0 }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=now&timeout=60000&seq_interval=100'
    })
    .reply(200, changesResponse, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ fastChanges: true })
  await new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      // after our initial call with since=now, we should get a reply with last_seq=0-1
      assert.equal(seq, '1-0')
      db.changesReader.stop()
      mockAgent.assertNoPendingInterceptors()
      resolve()
    })
  })
})

test('should respect the selector parameter - db.changesReader.start', async () => {
  const changesResponse = { results: [], last_seq: '1-0', pending: 0 }
  const selector = { name: 'fred' }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&filter=_selector&include_docs=false&limit=100&since=now&timeout=60000',
      body: JSON.stringify({ selector })
    })
    .reply(200, changesResponse, JSON_HEADERS)
  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ selector })
  return new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      // after our initial call with since=now, we should get a reply with last_seq=0-1
      assert.equal(seq, '1-0')
      db.changesReader.stop()
      mockAgent.assertNoPendingInterceptors()
      resolve()
    })
  })
})

test('should respect the selector parameter - db.changesReader.spool', async () => {
  const changesResponse = { results: [], last_seq: '1-0', pending: 0 }
  const selector = { name: 'fred' }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?filter=_selector&include_docs=false&seq_interval=100&since=now',
      body: JSON.stringify({ selector })
    })
    .reply(200, changesResponse, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.spool({ since: 'now', selector })
  await new Promise((resolve, reject) => {
    cr.on('end', function (data) {
      resolve()
    })
  })
})

test('should emit change and batch events - db.changesReader.start', async () => {
  const changes = [
    { seq: null, id: '1', changes: ['1-1'] },
    { seq: null, id: '2', changes: ['1-1'] },
    { seq: null, id: '3', changes: ['1-1'] },
    { seq: null, id: '4', changes: ['1-1'] },
    { seq: null, id: '5', changes: ['1-1'] }
  ]
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=now&timeout=60000'
    })
    .reply(200, { results: changes, last_seq: '1-0', pending: 0 }, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start()
  let i = 0
  await new Promise((resolve, reject) => {
    cr.on('change', function (c) {
      assert.equal(c, changes[i++])
    }).on('batch', function (b) {
      assert.deepEqual(b, changes)
    }).on('seq', function (seq) {
      // after our initial call with since=now, we should get a reply with last_seq=0-1
      assert.equal(seq, '1-0')
      db.changesReader.stop()
      resolve()
    }).on('error', reject)
  })
})

test('should keep polling the changes feed - db.changesReader.start', async () => {
  const change = { seq: null, id: 'a', changes: ['1-1'] }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=now&timeout=1000'
    })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 }, JSON_HEADERS)
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=1-0&timeout=1000'
    })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 }, JSON_HEADERS)
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=1-0&timeout=1000'
    })
    .reply(200, { results: [change], last_seq: '2-0', pending: 0 }, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ timeout: 1000 })
  await new Promise((resolve, reject) => {
    cr.on('change', function (c) {
      // ensure we get a change on the third poll
      assert.deepEqual(c, change)
      db.changesReader.stop()
      resolve()
    })
  })
})

test('should keep polling the changes feed (wait: true) - db.changesReader.start', async () => {
  const change = { seq: null, id: 'a', changes: ['1-1'] }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=now&timeout=1000'
    })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 }, JSON_HEADERS)
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=1-0&timeout=1000'
    })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 }, JSON_HEADERS)
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=1-0&timeout=1000'
    })
    .reply(200, { results: [change], last_seq: '2-0', pending: 0 }, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ timeout: 1000, wait: true })
  await new Promise((resolve, reject) => {
    cr.on('change', function (c) {
      // ensure we get a change on the third poll
      assert.deepEqual(c, change)
      db.changesReader.stop()
      resolve()
    })
      .on('batch', function (data) {
        db.changesReader.resume()
      })
  })
})

test('spooling changes - db.changesReader.spool', async () => {
  const fs = require('fs')
  const reply = fs.readFileSync('./test/changes.json')
  const replyObj = JSON.parse(reply)
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?include_docs=false&seq_interval=100&since=0'
    })
    .reply(200, reply, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.spool({ since: 0 })
  await new Promise((resolve, reject) => {
    cr.on('batch', function (batch) {
      assert.equal(JSON.stringify(batch), JSON.stringify(replyObj.results))
    }).on('end', (lastSeq) => {
      assert.equal(lastSeq, replyObj.last_seq)
      resolve()
    })
  })
})

test('spooling changes - numeric seq - db.changesReader.spool', async () => {
  const fs = require('fs')
  const reply = fs.readFileSync('./test/changes_numeric.json')
  const replyObj = JSON.parse(reply)
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?include_docs=false&seq_interval=100&since=0'
    })
    .reply(200, reply, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.spool({ since: 0 })
  return new Promise((resolve, reject) => {
    cr.on('batch', function (batch) {
      assert.equal(JSON.stringify(batch), JSON.stringify(replyObj.results))
    }).on('end', (lastSeq) => {
      assert.equal(lastSeq, replyObj.last_seq)
      resolve()
    })
  })
})

test('should handle the batchSize parameter - db.changesReader.start', async () => {
  const limit = 44
  mockPool
    .intercept({
      method: 'post',
      path: `/db/_changes?feed=longpoll&include_docs=false&limit=${limit}&since=now&timeout=60000`
    })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 }, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ batchSize: limit })
  await new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      // after our initial call with since=now, we should get a reply with last_seq=0-1
      assert.equal(seq, '1-0')
      db.changesReader.stop()
      resolve()
    })
  })
})

test('should respect the since parameter db.changesReader.start', async () => {
  const limit = 44
  const since = 'thedawnoftime'
  mockPool
    .intercept({
      method: 'post',
      path: `/db/_changes?feed=longpoll&include_docs=false&limit=${limit}&since=${since}&timeout=60000`
    })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 }, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ batchSize: limit, since })
  await new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      // after our initial call with since=thedawnoftime, we should get a reply with last_seq=0-1
      assert.equal(seq, '1-0')
      db.changesReader.stop()
      resolve()
    })
  })
})

test('should stop on no changes - db.changesReader.get', async () => {
  const since = 'thedawnoftime'
  const batchSize = 45
  mockPool
    .intercept({
      method: 'post',
      path: `/db/_changes?feed=longpoll&include_docs=false&limit=${batchSize}&since=${since}&timeout=60000`
    })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 }, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.get({ batchSize, since })
  await new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      // after our initial call with since=now, we should get a reply with last_seq=0-1
      assert.equal(seq, '1-0')
    }).on('end', function () {
      resolve()
    })
  })
})

test('stop after multiple batches - small batch stop - db.changesReader.get', async () => {
  const since = 'now'
  const batchSize = 45
  const batch1 = []
  const batch2 = []
  for (let i = 0; i < batchSize; i++) {
    batch1.push({ seq: (i + 1) + '-0', id: 'a' + i, changes: ['1-1'] })
  }
  for (let i = 0; i < 5; i++) {
    batch2.push({ seq: (45 + i + 1) + '-0', id: 'b' + i, changes: ['1-1'] })
  }
  mockPool
    .intercept({
      method: 'post',
      path: `/db/_changes?feed=longpoll&include_docs=false&limit=${batchSize}&since=${since}&timeout=60000`
    })
    .reply(200, { results: batch1, last_seq: '45-0', pending: 2 }, JSON_HEADERS)
  mockPool
    .intercept({
      method: 'post',
      path: `/db/_changes?feed=longpoll&include_docs=false&limit=${batchSize}&since=45-0&timeout=60000`
    })
    .reply(200, { results: batch2, last_seq: '50-0', pending: 0 }, JSON_HEADERS)
  mockPool
    .intercept({
      method: 'post',
      path: `/db/_changes?feed=longpoll&include_docs=false&limit=${batchSize}&since=50-0&timeout=60000`
    })
    .reply(200, { results: [], last_seq: '50-0', pending: 0 }, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.get({ batchSize, since })
  let batchCount = 0
  await new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      switch (batchCount) {
        case 0:
          assert.equal(seq, '45-0')
          break
        case 1:
          assert.equal(seq, '50-0')
          break
        case 2:
          assert.equal(seq, '50-0')
          break
      }
      batchCount++
    }).on('end', function (lastSeq) {
      assert.equal(lastSeq, '50-0')
      resolve()
    })
  })
})

test('stop after multiple batches - zero stop - db.changesReader.get', async () => {
  const since = 'now'
  const batchSize = 45
  const batch1 = []
  const batch2 = []
  for (let i = 0; i < batchSize; i++) {
    batch1.push({ seq: null, id: 'a' + i, changes: ['1-1'] })
  }
  for (let i = 0; i < batchSize; i++) {
    batch2.push({ seq: null, id: 'b' + i, changes: ['1-1'] })
  }
  mockPool
    .intercept({
      method: 'post',
      path: `/db/_changes?feed=longpoll&include_docs=false&limit=${batchSize}&since=${since}&timeout=60000`
    })
    .reply(200, { results: batch1, last_seq: '45-0', pending: 2 }, JSON_HEADERS)
  mockPool
    .intercept({
      method: 'post',
      path: `/db/_changes?feed=longpoll&include_docs=false&limit=${batchSize}&since=45-0&timeout=60000`
    })
    .reply(200, { results: batch2, last_seq: '90-0', pending: 0 }, JSON_HEADERS)
  mockPool
    .intercept({
      method: 'post',
      path: `/db/_changes?feed=longpoll&include_docs=false&limit=${batchSize}&since=90-0&timeout=60000`
    })
    .reply(200, { results: [], last_seq: '90-0', pending: 0 }, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.get({ batchSize, since })
  let batchCount = 0
  await new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      if (batchCount === 0) {
        assert.equal(seq, '45-0')
        batchCount++
      } else {
        assert.equal(seq, '90-0')
      }
    }).on('end', function () {
      resolve()
    })
  })
})

test('on bad credentials - db.changesReader.start', async () => {
  const response = { error: 'unauthorized', reason: 'You are not authorized to access this db.' }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=now&timeout=60000'
    })
    .reply(401, response, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start()
  await new Promise((resolve, reject) => {
    cr.on('error', function (err) {
      assert.equal(err.statusCode, 401)
      resolve()
    })
  })
})

test('on bad since value - db.changesReader.start', async () => {
  const response = { error: 'bad_request', reason: 'Malformed sequence supplied in \'since\' parameter.' }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=badtoken&timeout=60000'
    })
    .reply(400, response, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ since: 'badtoken' })
  await new Promise((resolve, reject) => {
    cr.on('error', function (err) {
      assert.equal(err.statusCode, 400)
      resolve()
    })
  })
})

test('should survive a HTTP 500 response - db.changesReader.start', async () => {
  const change = { seq: null, id: 'a', changes: ['1-1'] }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=now&timeout=1000'
    })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 }, JSON_HEADERS)
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=1-0&timeout=1000'
    })
    .reply(500)
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=1-0&timeout=1000'
    })
    .reply(200, { results: [change], last_seq: '2-0', pending: 0 }, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ timeout: 1000 })
  await new Promise((resolve, reject) => {
    cr.on('change', function (c) {
      // ensure we get a change on the third poll
      assert.deepEqual(c, change)
      db.changesReader.stop()
      resolve()
    }).on('error', function (err) {
      assert.equal(err.statusCode, 500)
    })
  })
})

test('should survive HTTP 429 response - db.changesReader.start', async () => {
  const change = { seq: null, id: 'a', changes: ['1-1'] }
  const response429 = { error: 'too_many_requests', reason: 'You\'ve exceeded your current limit of x requests per second for x class. Please try later.', class: 'x', rate: 1 }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=now&timeout=1000'
    })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 }, JSON_HEADERS)
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=1-0&timeout=1000'
    })
    .reply(429, response429, JSON_HEADERS)
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=1-0&timeout=1000'
    })
    .reply(200, { results: [change], last_seq: '2-0', pending: 0 }, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ timeout: 1000 })
  await new Promise((resolve, reject) => {
    cr.on('change', function (c) {
      // ensure we get a change on the third poll
      assert.deepEqual(c, change)
      db.changesReader.stop()
      resolve()
    }).on('error', function (err) {
      assert.equal(err.statusCode, 429)
    })
  })
})

test('should survive malformed JSON - db.changesReader.start', async () => {
  const change = { seq: null, id: 'a', changes: ['1-1'] }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=now&timeout=1000'
    })
    .reply(200, '{ results: [], last_seq: "1-0", pending: 0', JSON_HEADERS)
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=now&timeout=1000'
    })
    .reply(200, { results: [change], last_seq: '1-0', pending: 0 }, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ timeout: 1000 })
  await new Promise((resolve, reject) => {
    cr.on('change', function (c) {
      assert.deepEqual(c, change)
      db.changesReader.stop()
      resolve()
    }).on('error', function (err) {
      if (err) {
        // shouldn't get here
        assert(true, false)
      }
    })
  })
})

test('should cancel HTTP connection as soon as stop is called', async () => {
  const response = { results: [], last_seq: '1-0', pending: 0 }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=now&timeout=60000'
    })
    .reply(200, response, JSON_HEADERS)
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_changes?feed=longpoll&include_docs=false&limit=100&since=now&timeout=60000'
    })
    .reply(200, response, JSON_HEADERS)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start()
  await new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      db.changesReader.stop()
    })

    cr.on('end', function () {
      resolve()
    })
  })
})
