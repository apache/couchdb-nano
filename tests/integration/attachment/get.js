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

it('should be able to fetch an attachment', function (assert) {
  let p = db.attachment.insert('new_string', 'att', 'Hello', 'text/plain')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (hello) {
    assert.equal(hello.ok, true, 'response ok')
    assert.ok(hello.rev, 'should have a revision number')
    return db.attachment.get('new_string', 'att')
  }).then(function (helloWorld) {
    assert.equal('Hello', helloWorld.toString(), 'string is reflexive')
    assert.end()
  })
})

it('should insert and fetch a binary file', function (assert) {
  let p = db.attachment.insert('new_binary', 'att', Buffer.from('123'), 'text/plain')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (hello) {
    assert.equal(hello.ok, true, 'response ok')
    assert.ok(hello.rev, 'should have a revision number')
    return db.attachment.get('new_binary', 'att')
  }).then(function (binaryData) {
    assert.equal('123', binaryData.toString(), 'binary data is reflexive')
    assert.end()
  })
})
