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

it('should handle crazy encodings', function (assert) {
  const att = {
    name: 'att',
    data: 'काचं शक्नोम्यत्तुम् । नोपहिनस्ति माम् ॥',
    'content_type': 'text/plain'
  }
  const p = db.multipart.insert({'foo': 'bar'}, [att], 'foobar')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (foo) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(foo.ok, true, 'response should be ok')
    assert.ok(foo.rev, 'response should have rev')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should test with presence of attachment', function (assert) {
  const att = {
    name: 'two',
    data: 'Hello World!',
    'content_type': 'text/plain'
  }

  db.attachment.insert('mydoc', 'one', 'Hello World!', 'text/plain',
    function (err) {
      assert.equal(err, null, 'should have stored the thingy')
      db.get('mydoc', function (_, doc) {
        db.multipart.insert(doc, [att], 'mydoc', function () {
          db.get('mydoc', function (error, two) {
            assert.equal(error, null, 'should get the doc')
            assert.equal(Object.keys(two._attachments).length, 2,
              'both attachments should be present')
            assert.end()
          })
        })
      })
    })
})

it('should work with attachment as a buffer', function (assert) {
  const att = {
    name: 'att',
    data: Buffer.from('foo'),
    'content_type': 'text/plain'
  }
  const p = db.multipart.insert({'foo': 'bar'}, [att], 'otherdoc')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (foo) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(foo.ok, true, 'response should be ok')
    assert.ok(foo.rev, 'response should have rev')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})
