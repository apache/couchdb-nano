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
const nano = require('../../../lib/nano.js')({url: 'http://localhost:5984', requestDefaults: {jar: true}})
const it = harness.it

it('should be able to create a user', function (assert) {
  nano.relax({
    method: 'POST',
    path: '_users',
    body: {
      _id: 'org.couchdb.user:' + helpers.username,
      type: 'user',
      name: helpers.username,
      roles: ['admin'],
      password: helpers.password
    }
  }).then(function () {
    return nano.auth(helpers.username, helpers.password)
  }).then(function (data) {
    assert.ok(data.ok)
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should be able to insert with a cookie', function (assert) {
  const db = nano.db.use('shared_cookie')
  const p = db.insert({'foo': 'baz'})
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (response) {
    assert.equal(response.ok, true, 'response should be ok')
    assert.ok(response.rev, 'response should have rev')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should be able to get the session', function (assert) {
  nano.session().then(function (session) {
    assert.equal(session.userCtx.name, helpers.username)
    assert.end()
  })
})
