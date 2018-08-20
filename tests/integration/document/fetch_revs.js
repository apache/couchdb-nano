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
const it = harness.it

it('should insert a bunch of items', helpers.insertThree)

it('should be able to fetch with one key', function (assert) {
  const p = db.fetchRevs({keys: ['foobar']})
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (docs) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(docs.rows.length, 1, 'and get one row')
    assert.equal(docs['total_rows'], 3, 'out of 3')
    assert.equal(docs.rows[0].doc, undefined, 'rev should not return key')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should be able to fetch with multiple keys', function (assert) {
  const p = db.fetchRevs({keys: ['foobar', 'barfoo']})
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (docs) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(docs.rows.length, 2, 'two rows')
    assert.equal(docs['total_rows'], 3, 'out of 3')
    assert.equal(docs.rows[0].doc, undefined, 'no doc in 1')
    assert.equal(docs.rows[1].doc, undefined, 'no doc in 2')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should be able to fetch with params', function (assert) {
  const p = db.fetchRevs({keys: ['foobar']}, {still: 'no'})
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (docs) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(docs.rows.length, 1, 'and get one row')
    assert.equal(docs['total_rows'], 3, 'out of 3')
    assert.equal(docs.rows[0].doc, undefined, 'rev should not return key')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})
