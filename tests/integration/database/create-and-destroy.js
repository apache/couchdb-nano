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
const nano = harness.locals.nano

it('should be able to create `az09_$()+-/` database', function (assert) {
  nano.db.create('az09_$()+-/').then(function () {
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should be able to use config from a nano object to create a db',
  function (assert) {
    const config = helpers.Nano(
      helpers.couch + '/' + encodeURIComponent('with/slash')).config
    helpers.Nano(config.url).db.create(config.db, function (err) {
      assert.equal(err, null, 'should create database')
      assert.end()
    })
  })

it('must destroy the databases we created', function (assert) {
  async.forEach(['az09_$()+-/', 'with/slash'], nano.db.destroy, function (err) {
    assert.equal(err, null, 'should destroy all dbs')
    assert.end()
  })
})
