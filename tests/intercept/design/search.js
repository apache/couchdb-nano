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

const nano = require('../../../lib/nano.js')
const fakeRequest = function (r, callback) {
  if (callback) {
    callback(null, { statusCode: 200 }, r)
  } else {
    return r
  }
}
// by passing in a fake Request object, we can intercept the request
// and see how Nano is pre-processing the parameters
const n = nano({url: 'http://localhost:5984', request: fakeRequest})
const db = n.db.use('fake')

it('should allow custom request object to be supplied', function (assert) {
  const p = db.info()
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (data) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(data.method, 'GET')
    assert.equal(typeof data.headers, 'object')
    assert.end()
  }).catch(function () {
    assert.ok(true, 'Promise is rejected')
  })
})

it('should submit all search queries via a POST request', function (assert) {
  const p = db.search('fake', 'fake', { drilldown: [['colour', 'red'], ['category', 'cake']] })
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (data) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(data.method, 'POST')
    assert.equal(typeof data.headers, 'object')
    assert.equal(data.body, '{"drilldown":[["colour","red"],["category","cake"]]}')
    assert.end()
  }).catch(function () {
    assert.ok(true, 'Promise is rejected')
  })
})

it('should allow search results to be streamed', function (assert) {
  const req = db.searchAsStream('fake', 'fake', { q: 'foo:bar' })
  assert.equal(req.method, 'POST')
  assert.equal(typeof req.headers, 'object')
  assert.equal(req.body, '{"q":"foo:bar"}')
  assert.end()
})
