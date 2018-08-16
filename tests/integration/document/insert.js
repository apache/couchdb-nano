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

let rev

it('should insert one simple document', function (assert) {
  const p = db.insert({'foo': 'baz'}, 'foobaz')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (foo) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(foo.ok, true, 'response should be ok')
    assert.ok(foo.rev, 'response should have rev')
    rev = foo.rev
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should fail to insert again since it already exists', function (assert) {
  const p = db.insert({}, 'foobaz')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function () {
    assert.ok(false, 'Promise is resolved')
  }).catch(function (error) {
    assert.ok(true, 'Promise is rejected')
    assert.equal(error.scope, 'couch', 'scope is couch')
    assert.equal(error.error, 'conflict', 'type is conflict')
    assert.end()
  })
})

it('should be able to use custom params in insert', function (assert) {
  const p = db.insert({
    foo: 'baz',
    _rev: rev
  }, {
    docName: 'foobaz',
    'new_edits': false
  })
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (foo) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(foo.ok, true, 'response should be ok')
    assert.ok(foo.rev, 'response should have rev')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should be able to insert functions in docs', function (assert) {
  db.insert({
    fn: function () { return true },
    fn2: 'function () { return true }'
  }).then(function (fns) {
    assert.equal(fns.ok, true, 'response should be ok')
    assert.ok(fns.rev, 'response should have rev')
    return db.get(fns.id)
  }).then(function (fns) {
    assert.equal(fns.fn, fns.fn2, 'fn matches fn2')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})
