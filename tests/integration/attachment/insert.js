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

it('should be able to insert a simple attachment', function (assert) {
  const p = db.attachment.insert('new', 'att', 'Hello World!', 'text/plain')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (att) {
    assert.equal(att.ok, true, 'response ok')
    assert.ok(att.rev, 'should have a revision')
    assert.end()
  })
})
