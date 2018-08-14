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
const nano = harness.locals.nano

it('should ensure _replicator and _users are created', function (assert) {
  nano.db.create('_replicator').then(function () {
    return nano.db.destroy('_users')
  }).then(function () {
    return nano.db.create('_users')
  }).then(function () {
    assert.end()
  })
})

it('should list the correct databases', function (assert) {
  const p = nano.db.list()
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (list) {
    const filtered = list.filter(function (e) {
      return e === 'database_list' || e === '_replicator' || e === '_users'
    })
    assert.equal(filtered.length, 3, 'should have exactly 3 dbs')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})
