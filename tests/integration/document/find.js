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

it('should be to do a mango query', function (assert) {
  const p = db.find({selector: {foo: 'baz'}})
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (response) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(response.docs.length, 1, 'and get one row')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should be to do a mango query with streams', function (assert) {
  const p = db.findAsStream({selector: {foo: 'baz'}}, function (error, response) {
    assert.equal(error, null, 'should work')
    assert.equal(response.docs.length, 1, 'and get one row')
    assert.end()
  })
  assert.ok(!helpers.isPromise(p), 'does not return Promise')
  assert.equal(p.constructor.name, 'Request', 'returns a Request')
})
