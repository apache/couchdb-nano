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
const it = harness.it
const db = harness.locals.db

let rev

it('should insert a document', function (assert) {
  db.insert({'foo': 'baz'}, 'foobaz', function (error, foo) {
    assert.equal(error, null, 'stores foo')
    assert.equal(foo.ok, true, 'ok response')
    assert.ok(foo.rev, 'response with rev')
    rev = foo.rev
    assert.end()
  })
})

it('should not delete a db', function (assert) {
  const p = db.destroy(undefined, undefined)
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function () {
    assert.ok(false, 'Promise is resolved')
    assert.end()
  }).catch(function () {
    assert.ok(true, 'Promise is rejected')
    assert.end()
  })
})

it('should delete a document', function (assert) {
  const p = db.destroy('foobaz', rev)
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (response) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(response.ok, true, 'ok!')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})
