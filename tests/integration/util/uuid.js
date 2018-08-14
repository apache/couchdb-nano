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
const nano = helpers.nano
const it = harness.it

it('should generate three uuids', function (assert) {
  const p = nano.uuids(3)
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (data) {
    assert.ok(true, 'Promise is resolved')
    assert.ok(data, 'got response')
    assert.ok(data.uuids, 'got uuids')
    assert.equal(data.uuids.length, 3, 'got 3')
    assert.end()
  }).catch(function () {
    assert.ok(true, 'Promise is rejected')
  })
})

it('should generate one uuid', function (assert) {
  const p = nano.uuids()
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (data) {
    assert.ok(true, 'Promise is resolved')
    assert.ok(data, 'got response')
    assert.ok(data.uuids, 'got uuid')
    assert.equal(data.uuids.length, 1, 'got 1')
    assert.end()
  }).catch(function () {
    assert.ok(true, 'Promise is rejected')
  })
})
