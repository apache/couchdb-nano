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
const DBNAME = 'db'

afterEach(() => {
  nock.cleanAll()
})

test('should be able to follow changes feed - db.changesReader.start', async () => {
  const changeURL = `/${DBNAME}/_changes`
  nock(COUCH_URL)
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 60000, since: 'now', limit: 100, include_docs: false })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 })
    .post(changeURL)
    .delay(2000)
    .reply(500)
  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start()
  return new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      // after our initial call with since=now, we should get a reply with last_seq=0-1
      expect(seq).toBe('1-0')
      db.changesReader.stop()
      resolve()
    })
  })
})

test('should respect the fastChanges flag - db.changesReader.start', async () => {
  const changeURL = `/${DBNAME}/_changes`
  nock(COUCH_URL)
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 60000, since: 'now', limit: 100, include_docs: false, seq_interval: 100 })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 })
    .post(changeURL)
    .delay(2000)
    .reply(500)
  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ fastChanges: true })
  return new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      // after our initial call with since=now, we should get a reply with last_seq=0-1
      expect(seq).toBe('1-0')
      db.changesReader.stop()
      resolve()
    })
  })
})

test('should respect the selector parameter - db.changesReader.start', async () => {
  const changeURL = `/${DBNAME}/_changes`
  nock(COUCH_URL)
    .post(changeURL, { selector: { name: 'fred' } })
    .query({ feed: 'longpoll', timeout: 60000, since: 'now', limit: 100, include_docs: false, filter: '_selector' })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 })
    .post(changeURL)
    .delay(2000)
    .reply(500)
  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ selector: { name: 'fred' } })
  return new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      // after our initial call with since=now, we should get a reply with last_seq=0-1
      expect(seq).toBe('1-0')
      db.changesReader.stop()
      resolve()
    })
  })
})

test('should respect the selector parameter - db.changesReader.spool', async () => {
  const changeURL = `/${DBNAME}/_changes`
  nock(COUCH_URL)
    .post(changeURL, { selector: { name: 'fred' } })
    .query({ since: 'now', seq_interval: 100, include_docs: false, filter: '_selector' })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 })

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.spool({ since: 'now', selector: { name: 'fred' } })
  return new Promise((resolve, reject) => {
    cr.on('end', function (data) {
      resolve()
    })
  })
})

test('should emit change and batch events - db.changesReader.start', async () => {
  const changeURL = `/${DBNAME}/_changes`
  const changes = [{ seq: null, id: '1', changes: ['1-1'] },
    { seq: null, id: '2', changes: ['1-1'] },
    { seq: null, id: '3', changes: ['1-1'] },
    { seq: null, id: '4', changes: ['1-1'] },
    { seq: null, id: '5', changes: ['1-1'] }]
  nock(COUCH_URL)
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 60000, since: 'now', limit: 100, include_docs: false })
    .reply(200, { results: changes, last_seq: '1-0', pending: 0 })
    .post(changeURL)
    .delay(2000)
    .reply(500)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start()
  let i = 0
  return new Promise((resolve, reject) => {
    cr.on('change', function (c) {
      expect(c).toStrictEqual(changes[i++])
    }).on('batch', function (b) {
      expect(b).toStrictEqual(changes)
    }).on('seq', function (seq) {
      // after our initial call with since=now, we should get a reply with last_seq=0-1
      expect(seq).toBe('1-0')
      db.changesReader.stop()
      resolve()
    })
  })
})

it('should keep polling the changes feed - db.changesReader.start', async () => {
  const changeURL = `/${DBNAME}/_changes`
  const change = { seq: null, id: 'a', changes: ['1-1'] }
  nock(COUCH_URL)
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 1000, since: 'now', limit: 100, include_docs: false })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 })
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 1000, since: '1-0', limit: 100, include_docs: false })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 })
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 1000, since: '1-0', limit: 100, include_docs: false })
    .reply(200, { results: [change], last_seq: '2-0', pending: 0 })
    .post(changeURL)
    .delay(2000)
    .reply(500)
  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ timeout: 1000 })
  return new Promise((resolve, reject) => {
    cr.on('change', function (c) {
      // ensure we get a change on the third poll
      expect(c).toStrictEqual(change)
      db.changesReader.stop()
      resolve()
    })
  })
}, 10000)

it('should keep polling the changes feed (wait: true) - db.changesReader.start', async () => {
  const changeURL = `/${DBNAME}/_changes`
  const change = { seq: null, id: 'a', changes: ['1-1'] }
  nock(COUCH_URL)
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 1000, since: 'now', limit: 100, include_docs: false })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 })
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 1000, since: '1-0', limit: 100, include_docs: false })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 })
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 1000, since: '1-0', limit: 100, include_docs: false })
    .reply(200, { results: [change], last_seq: '2-0', pending: 0 })
    .post(changeURL)
    .delay(2000)
    .reply(500)
  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ timeout: 1000, wait: true })
  return new Promise((resolve, reject) => {
    cr.on('change', function (c) {
      // ensure we get a change on the third poll
      expect(c).toStrictEqual(change)
      db.changesReader.stop()
      resolve()
    })
      .on('batch', function (data) {
        db.changesReader.resume()
      })
  })
}, 10000)

test('spooling changes - db.changesReader.spool', async () => {
  const changeURL = `/${DBNAME}/_changes`
  const fs = require('fs')
  const reply = fs.readFileSync('./test/changes.json')
  const replyObj = JSON.parse(reply)
  nock(COUCH_URL)
    .post(changeURL)
    .query({ since: '0', include_docs: false, seq_interval: 100 })
    .reply(200, reply)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.spool({ since: 0 })
  return new Promise((resolve, reject) => {
    cr.on('batch', function (batch) {
      expect(JSON.stringify(batch)).toBe(JSON.stringify(replyObj.results))
    }).on('end', (lastSeq) => {
      expect(lastSeq).toBe(replyObj.last_seq)
      resolve()
    })
  })
})

test('spooling changes - numeric seq - db.changesReader.spool', async () => {
  const changeURL = `/${DBNAME}/_changes`
  const fs = require('fs')
  const reply = fs.readFileSync('./test/changes_numeric.json')
  const replyObj = JSON.parse(reply)
  nock(COUCH_URL)
    .post(changeURL)
    .query({ since: 0, include_docs: false, seq_interval: 100 })
    .reply(200, reply)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.spool({ since: 0 })
  return new Promise((resolve, reject) => {
    cr.on('batch', function (batch) {
      expect(JSON.stringify(batch)).toBe(JSON.stringify(replyObj.results))
    }).on('end', (lastSeq) => {
      expect(lastSeq).toBe(replyObj.last_seq)
      resolve()
    })
  })
})

test('should handle the batchSize parameter - db.changesReader.start', async () => {
  const changeURL = `/${DBNAME}/_changes`
  const limit = 44
  nock(COUCH_URL)
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 60000, since: 'now', limit, include_docs: false })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 })
    .post(changeURL)
    .delay(2000)
    .reply(500)

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ batchSize: limit })
  return new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      // after our initial call with since=now, we should get a reply with last_seq=0-1
      expect(seq).toBe('1-0')
      db.changesReader.stop()
      resolve()
    })
  })
})

test('should respect the since parameter db.changesReader.start', async () => {
  const changeURL = `/${DBNAME}/_changes`
  const limit = 44
  const since = 'thedawnoftime'
  nock(COUCH_URL)
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 60000, since, limit, include_docs: false })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 })
    .post(changeURL)
    .delay(2000)
    .reply(500)
  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ batchSize: limit, since })
  return new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      // after our initial call with since=thedawnoftime, we should get a reply with last_seq=0-1
      expect(seq).toBe('1-0')
      db.changesReader.stop()
      resolve()
    })
  })
})

test('should stop on no changes - db.changesReader.get', async () => {
  const changeURL = `/${DBNAME}/_changes`
  const since = 'thedawnoftime'
  const batchSize = 45
  nock(COUCH_URL)
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 60000, since, limit: batchSize, include_docs: false })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 })
    .post(changeURL)
    .delay(2000)
    .reply(500)
  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.get({ batchSize, since })
  return new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      // after our initial call with since=now, we should get a reply with last_seq=0-1
      expect(seq).toBe('1-0')
    }).on('end', function () {
      resolve()
    })
  })
})

test('stop after multiple batches - small batch stop - db.changesReader.get', async () => {
  const changeURL = `/${DBNAME}/_changes`
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
  nock(COUCH_URL)
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 60000, since, limit: batchSize, include_docs: false })
    .reply(200, { results: batch1, last_seq: '45-0', pending: 2 })
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 60000, since: '45-0', limit: batchSize, include_docs: false })
    .reply(200, { results: batch2, last_seq: '50-0', pending: 0 })
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 60000, since: '50-0', limit: batchSize, include_docs: false })
    .reply(200, { results: [], last_seq: '50-0', pending: 0 })

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.get({ batchSize, since })
  let batchCount = 0
  return new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      switch (batchCount) {
        case 0: expect(seq).toBe('45-0'); break
        case 1: expect(seq).toBe('50-0'); break
        case 2: expect(seq).toBe('50-0'); break
      }
      batchCount++
    }).on('end', function (lastSeq) {
      expect(lastSeq).toBe('50-0')
      resolve()
    })
  })
})

test('stop after multiple batches - zero stop - db.changesReader.get', async () => {
  const changeURL = `/${DBNAME}/_changes`
  const since = 'now'
  const batchSize = 45
  const batch1 = []
  const batch2 = []
  for (let i = 0; i < batchSize; i++) {
    batch1.push({ seq: null, id: 'a' + i, changes: ['1-1'] })
  }
  for (let i = 0; i < 5; i++) {
    batch2.push({ seq: null, id: 'b' + i, changes: ['1-1'] })
  }
  nock(COUCH_URL)
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 60000, since, limit: batchSize, include_docs: false })
    .reply(200, { results: batch1, last_seq: '45-0', pending: 2 })
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 60000, since: '45-0', limit: batchSize, include_docs: false })
    .reply(200, { results: batch2, last_seq: '90-0', pending: 0 })
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 60000, since: '90-0', limit: batchSize, include_docs: false })
    .reply(200, { results: [], last_seq: '90-0', pending: 0 })

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.get({ batchSize, since })
  let batchCount = 0
  return new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      if (batchCount === 0) {
        expect(seq).toBe('45-0')
        batchCount++
      } else {
        expect(seq).toBe('90-0')
      }
    }).on('end', function () {
      resolve()
    })
  })
})

test('on bad credentials - db.changesReader.start', async () => {
  const changeURL = `/${DBNAME}/_changes`
  nock(COUCH_URL)
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 60000, since: 'now', limit: 100, include_docs: false })
    .reply(401)
  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start()
  return new Promise((resolve, reject) => {
    cr.on('error', function (err) {
      expect(err.statusCode).toBe(401)
      resolve()
    })
  })
})

test('on bad since value - db.changesReader.start', async () => {
  const changeURL = `/${DBNAME}/_changes`
  nock(COUCH_URL)
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 60000, since: 'badtoken', limit: 100, include_docs: false })
    .reply(400, { error: 'bad_request', reason: 'Malformed sequence supplied in \'since\' parameter.' })

  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ since: 'badtoken' })
  return new Promise((resolve, reject) => {
    cr.on('error', function (err) {
      expect(err.statusCode).toBe(400)
      resolve()
    })
  })
})

test('should survive a HTTP 500 response - db.changesReader.start', async () => {
  const changeURL = `/${DBNAME}/_changes`
  const change = { seq: null, id: 'a', changes: ['1-1'] }
  nock(COUCH_URL)
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 1000, since: 'now', limit: 100, include_docs: false })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 })
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 1000, since: '1-0', limit: 100, include_docs: false })
    .reply(500)
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 1000, since: '1-0', limit: 100, include_docs: false })
    .reply(200, { results: [change], last_seq: '2-0', pending: 0 })
    .post(changeURL)
    .delay(2000)
    .reply(500)
  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ timeout: 1000 })
  return new Promise((resolve, reject) => {
    cr.on('change', function (c) {
      // ensure we get a change on the third poll
      expect(c).toStrictEqual(change)
      db.changesReader.stop()
      resolve()
    }).on('error', function (err) {
      expect(err.statusCode).toBe(500)
    })
  })
}, 10000)

test('should survive HTTP 429 response - db.changesReader.start', async () => {
  const changeURL = `/${DBNAME}/_changes`
  const change = { seq: null, id: 'a', changes: ['1-1'] }
  nock(COUCH_URL)
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 1000, since: 'now', limit: 100, include_docs: false })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 })
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 1000, since: '1-0', limit: 100, include_docs: false })
    .reply(429, { error: 'too_many_requests', reason: 'You\'ve exceeded your current limit of x requests per second for x class. Please try later.', class: 'x', rate: 1 })
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 1000, since: '1-0', limit: 100, include_docs: false })
    .reply(200, { results: [change], last_seq: '2-0', pending: 0 })
    .post(changeURL)
    .delay(2000)
    .reply(500)
  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ timeout: 1000 })
  return new Promise((resolve, reject) => {
    cr.on('change', function (c) {
      // ensure we get a change on the third poll
      expect(c).toStrictEqual(change)
      db.changesReader.stop()
      resolve()
    }).on('error', function (err) {
      expect(err.statusCode).toBe(429)
    })
  })
}, 10000)

test('should survive malformed JSON - db.changesReader.start', async () => {
  const changeURL = `/${DBNAME}/_changes`
  const change = { seq: null, id: 'a', changes: ['1-1'] }
  nock(COUCH_URL)
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 1000, since: 'now', limit: 100, include_docs: false })
    .reply(200, '{ results: [], last_seq: "1-0", pending: 0') // missing bracket } - malformed JSON
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 1000, since: 'now', limit: 100, include_docs: false })
    .reply(200, { results: [change], last_seq: '1-0', pending: 0 })
    .post(changeURL)
    .delay(2000)
    .reply(500)
  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start({ timeout: 1000 })
  return new Promise((resolve, reject) => {
    cr.on('change', function (c) {
      expect(c).toStrictEqual(change)
      db.changesReader.stop()
      resolve()
    }).on('error', function (err) {
      if (err) {
        // shouldn't get here
        expect(true).toBe(false)
      }
    })
  })
}, 10000)

test('should cancel HTTP connection as soon as stop is called', async () => {
  const changeURL = `/${DBNAME}/_changes`
  nock(COUCH_URL)
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 60000, since: 'now', limit: 100, include_docs: false })
    .reply(200, { results: [], last_seq: '1-0', pending: 0 })
    .post(changeURL)
    .query({ feed: 'longpoll', timeout: 60000, since: '1-0', limit: 100, include_docs: false })
    .delay(60000)
    .reply(500)
  const db = nano.db.use(DBNAME)
  const cr = db.changesReader.start()
  await new Promise((resolve, reject) => {
    cr.on('seq', function (seq) {
      setTimeout(function () {
        // give the next http connection a chance to be established
        db.changesReader.stop()
      }, 200)
    })

    cr.on('end', function () {
      resolve()
    })
  })
})
