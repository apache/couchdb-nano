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

it('should be able to insert a doc with att', function (assert) {
  const att = {
    name: 'att',
    data: 'Hello World!',
    'content_type': 'text/plain'
  }
  const p = db.multipart.insert({'foo': 'baz'}, [att], 'foobaz')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (foo) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(foo.ok, true, 'response should be ok')
    assert.equal(foo.id, 'foobaz', 'id is foobaz')
    assert.ok(foo.rev, 'has rev')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should be able to get the document with the attachment', function (assert) {
  db.multipart.get('foobaz', function (error, foobaz, headers) {
    assert.equal(error, null, 'should get foobaz')
    if (helpers.unmocked) {
      assert.ok(headers['content-type'], 'should have content type')
      assert.equal(headers['content-type'].split(';')[0], 'multipart/related')
    }
    assert.equal(typeof foobaz, 'object', 'foobaz should be a buffer')
    assert.end()
  })
})
