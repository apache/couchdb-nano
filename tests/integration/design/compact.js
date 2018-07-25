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

const async = require('async')
const helpers = require('../../helpers/integration')
const harness = helpers.harness(__filename)
const it = harness.it
const db = harness.locals.db

it('should insert `alice` the design doc', function (assert) {
  async.waterfall([
    function (next) {
      db.insert({
        views: {
          'by_id': {
            map: 'function(doc) { emit(doc._id, doc); }'
          }
        }
      }, '_design/alice', next)
    },
    function (data, _, next) {
      db.insert({'foo': 'baz'}, 'foobaz', next)
    },
    function (foo, _, next) {
      db.destroy('foobaz', foo.rev, next)
    }
  ], function (err) {
    assert.equal(err, null, 'it should destroy the foo')
    assert.end()
  })
})
