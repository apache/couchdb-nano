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
const viewDerek = helpers.viewDerek

const opts = {key: ['Derek', 'San Francisco']}

it('should create a ddoc and insert some docs', helpers.prepareAView)

it('should respond with derek when asked for derek', function (assert) {
  viewDerek(db, assert, opts, assert.end)
})

it('should have no cloning issues when doing queries', function (assert) {
  async.waterfall([
    function (next) { viewDerek(db, assert, opts, next) },
    function (next) { viewDerek(db, assert, opts, next) }
  ], function (err) {
    assert.equal(err, null, 'no errors')
    assert.ok(Array.isArray(opts.key))
    assert.equal(opts.key[0], 'Derek')
    assert.equal(opts.key[1], 'San Francisco')
    assert.end()
  })
})

var multipleQueryOpts = {
  queries: [
    {
      keys: [
        ['Derek', 'San Francisco'],
        ['Nuno', 'London']
      ]
    },
    {
      skip: 2,
      limit: 1
    }
  ]
}

var expectedResults =
  [
    {total_rows: 3, offset: 0, rows: [{id: 'p_derek', key: ['Derek', 'San Francisco'], value: 'p_derek'}, {id: 'p_nuno', key: ['Nuno', 'London'], value: 'p_nuno'}]},
    {total_rows: 3, offset: 2, rows: [{id: 'p_randall', key: ['Randall', 'San Francisco'], value: 'p_randall'}]}
  ]

it('should support multiple view queries', function (assert) {
  db.view('people', 'by_name_and_city', multipleQueryOpts, function (error, response) {
    assert.equal(error, null, 'no errors')
    assert.ok(response.results, 'should return query results')
    assert.ok(Array.isArray(response.results), 'query results should be array')
    assert.equal(response.results.length, 2, 'should return results to both queries')
    assert.deepEqual(response.results, expectedResults, 'should be expected query results')
    assert.end()
  })
})
