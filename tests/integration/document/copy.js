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

it('must insert two docs before the tests start', function (assert) {
  db.insert({'foo': 'baz'}, 'foo_src', function (error, src) {
    assert.equal(error, null, 'stores src')
    assert.equal(src.ok, true, 'response ok')
    assert.ok(src.rev, 'haz rev')
    db.insert({'bar': 'qux'}, 'foo_dest', function (error, dest) {
      assert.equal(error, null, 'stores dest')
      assert.equal(dest.ok, true, 'oki doki')
      assert.ok(dest.rev, 'response has rev')
      assert.end()
    })
  })
})

it('should be able to copy and overwrite a document', function (assert) {
  const p = db.copy('foo_src', 'foo_dest', {overwrite: true})
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function () {
    assert.ok(true, 'Promise is resolved')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('copy without overwrite should return conflict for exists docs',
  function (assert) {
    const p = db.copy('foo_src', 'foo_dest')
    assert.ok(helpers.isPromise(p), 'returns Promise')
    p.then(function () {
      assert.ok(false, 'Promise is resolved')
    }).catch(function () {
      assert.ok(true, 'Promise is rejected')
      assert.end()
    })
  })

it('copy to a new destination should work', function (assert) {
  const p = db.copy('foo_src', 'baz_dest')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function () {
    assert.ok(true, 'Promise is resolved')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})
