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

it('should be able to insert a new plain text attachment', function (assert) {
  const p = db.attachment.insert('new', 'att', 'Hello World!', 'text/plain')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (response) {
    assert.equal(response.ok, true, 'response ok')
    assert.ok(response.rev, 'have a revision number')
    return db.attachment.destroy('new', 'att', {rev: response.rev})
  }).then(function (response) {
    assert.equal(response.ok, true, 'response ok')
    assert.equal(response.id, 'new', '`id` should be `new`')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should fail destroying with a bad filename', function (assert) {
  const p = db.attachment.destroy('new', false, true)
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function () {
    assert.ok(false, 'Promise is resolved')
    assert.end()
  }).catch(function () {
    assert.ok(true, 'Promise is rejected')
    assert.end()
  })
})
