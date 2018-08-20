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
const pixel = helpers.pixel
const harness = helpers.harness(__filename)
const db = harness.locals.db
const it = harness.it

it('should be able to insert and update attachments', function (assert) {
  const buffer = Buffer.from(pixel, 'base64')
  const p = db.attachment.insert('new', 'att', 'Hello', 'text/plain')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (hello) {
    assert.equal(hello.ok, true, 'response ok')
    assert.ok(hello.rev, 'should have a revision')
    return db.attachment.insert('new', 'att', buffer, 'image/bmp', {rev: hello.rev})
  }).then(function (bmp) {
    assert.ok(bmp.rev, 'should store a revision')
    assert.end()
  })
})

it('should be able to fetch the updated pixel', function (assert) {
  db.get('new').then(function (newDoc) {
    newDoc.works = true
    return db.insert(newDoc, 'new')
  }).then(function (response) {
    assert.equal(response.ok, true, 'response ok')
    assert.end()
  })
})
