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

it('should insert one doc', function (assert) {
  const p = db.insert({'foo': 'baz'}, 'foobar')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (foo) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(foo.ok, true, 'response ok')
    assert.ok(foo.rev, 'withs rev')
    rev = foo.rev
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should update the document', function (assert) {
  const p = db.insert({foo: 'bar', '_rev': rev}, 'foobar')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (response) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(response.ok, true, 'response should be ok')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})
