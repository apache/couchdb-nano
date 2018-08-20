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

it('should insert a one item', helpers.insertOne)

it('should get a status code when you do head - promises', function (assert) {
  const p = db.head('foobaz')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (docs) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(docs['statusCode'], 200, 'and is ok')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should get a status code when you do head - callbacks', function (assert) {
  db.head('foobaz', function (error, body, headers) {
    assert.equal(error, null, 'should get the head of foobaz')
    assert.equal(headers['statusCode'], 200, 'and is ok')
    assert.end()
  })
})
