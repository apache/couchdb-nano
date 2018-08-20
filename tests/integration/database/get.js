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

it('should be able to fetch the database', function (assert) {
  const p = nano.db.get('database_get')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (response) {
    assert.equal(response['doc_count'], 0, 'should be empty')
    assert.equal(response['db_name'], 'database_get', 'name')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('resolves db URL correctly for http://app.com/_couchdb', function (assert) {
  const nano = require('../../../lib/nano')

  const couch = nano({
    url: 'http://app.com/_couchdb/',
    parseUrl: false,
    request: function (options) {
      assert.equal(
        options.uri,
        'http://app.com/_couchdb/mydb/mydoc',
        'should get doc at prefixed path'
      )
      assert.end()
    }
  })
  couch.use('mydb').get('mydoc')
})
