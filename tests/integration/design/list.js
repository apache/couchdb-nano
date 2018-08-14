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

it('should create a ddoc and insert some docs', helpers.prepareAView)

it('should get the people by running the ddoc', function (assert) {
  const p = db.viewWithList('people', 'by_name_and_city', 'my_list', {
    key: [
      'Derek',
      'San Francisco'
    ]
  })
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (list) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(list, 'Hello', 'and list should be `hello`')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})
