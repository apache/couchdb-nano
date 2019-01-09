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

'use strict'

const helpers = require('../../helpers/integration')
const harness = helpers.harness(__filename)
const db = harness.locals.db
const nano = harness.locals.nano
const it = harness.it

it('should insert a bunch of items', helpers.insertThree)

it('should list the three documents', function (assert) {
  const p = db.list()
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (docs) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(docs['total_rows'], 3, 'with total three rows')
    assert.ok(docs.rows, 'and the rows themselves')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should be able to list using the `relax` function', function (assert) {
  nano.relax({
    db: 'document_list',
    doc: '_all_docs',
    method: 'GET',
    qs: {limit: 1}
  }, function (error, docs) {
    assert.equal(error, null, 'not relaxed')
    assert.ok(docs.rows, 'got meh rows')
    assert.equal(docs.rows.length, 1, 'but its only one #sadpanda')
    assert.equal(docs['total_rows'], 3, 'out of three')
    assert.end()
  })
})

it('should be able to list with a start_key', function (assert) {
  const p = db.list({start_key: 'c'})
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (docs) {
    assert.ok(true, 'Promise is resolved')
    assert.ok(docs.rows, 'get the rows')
    assert.equal(docs.rows.length, 2, 'starts in row two')
    assert.equal(docs['total_rows'], 3, 'out of three rows')
    assert.equal(docs.offset, 1, 'offset is 1')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should be able to list with a startkey', function (assert) {
  const p = db.list({startkey: 'c'})
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (docs) {
    assert.ok(true, 'Promise is resolved')
    assert.ok(docs.rows, 'get the rows')
    assert.equal(docs.rows.length, 2, 'starts in row two')
    assert.equal(docs['total_rows'], 3, 'out of three rows')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should be able to list with a endkey', function (assert) {
  const p = db.list({endkey: 's'})
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (docs) {
    assert.ok(true, 'Promise is resolved')
    assert.ok(docs.rows, 'get the rows')
    assert.equal(docs.rows.length, 3, 'starts in row two')
    assert.equal(docs['total_rows'], 3, 'out of three rows')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should be able to list with a end_key', function (assert) {
  const p = db.list({end_key: 's'})
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (docs) {
    assert.ok(true, 'Promise is resolved')
    assert.ok(docs.rows, 'get the rows')
    assert.equal(docs.rows.length, 3, 'starts in row two')
    assert.equal(docs['total_rows'], 3, 'out of three rows')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should be able to list as a stream', function (assert) {
  const p = db.listAsStream()
    .on('error', function (error) {
      assert.ifError(error)
    })
    .on('end', function () {
      assert.end()
    })
  assert.ok(!helpers.isPromise(p), 'does not return Promise')
  assert.equal(p.constructor.name, 'Request', 'returns a Request')
})

it('should be able to list with params as a stream', function (assert) {
  const p = db.listAsStream({end_key: 's'})
    .on('error', function (error) {
      assert.ifError(error)
    })
    .on('end', function () {
      assert.end()
    })
  assert.ok(!helpers.isPromise(p), 'does not return Promise')
  assert.equal(p.constructor.name, 'Request', 'returns a Request')
})
