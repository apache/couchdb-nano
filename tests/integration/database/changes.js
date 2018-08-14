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

it('should be able to insert three documents', helpers.insertThree)

it('should be able to receive changes since seq:0', function (assert) {
  const p = db.changes({since: 0})
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (response) {
    assert.equal(response.results.length, 3, 'gets three results')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should be able to receive changes since seq:0 as stream', function (assert) {
  const p = db.changesAsStream({since: 0}, function (error, response) {
    assert.equal(error, null, 'gets response from changes')
    assert.equal(response.results.length, 3, 'gets three results')
    assert.end()
  })
  assert.ok(!helpers.isPromise(p), 'returns Promise')
  assert.equal(p.constructor.name, 'Request', 'returns a Request')
})

it('should be able to receive changes - no params - stream', function (assert) {
  const p = db.changesAsStream(function (error) {
    assert.equal(error, null, 'gets response from changes')
    assert.end()
  })
  assert.ok(!helpers.isPromise(p), 'returns Promise')
  assert.equal(p.constructor.name, 'Request', 'returns a Request')
})
