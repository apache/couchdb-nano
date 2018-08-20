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
const nano = harness.locals.nano

let replica
let replica2

it('should insert a bunch of items', helpers.insertThree)

it('creates a bunch of database replicas', function (assert) {
  async.forEach(['database_replica', 'database_replica2'],
    nano.db.create, function (error) {
      assert.equal(error, null, 'created database(s)')
      assert.end()
    })
})

it('should be able to replicate three docs', function (assert) {
  replica = nano.use('database_replica')
  const p = db.replicate('database_replica')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function () {
    return replica.list()
  }).then(function (list) {
    assert.equal(list['total_rows'], 3, 'and have three documents')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should be able to replicate to a `nano` object', function (assert) {
  replica2 = nano.use('database_replica2')
  let p = nano.db.replicate(db, replica2)
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function () {
    return replica2.list()
  }).then(function (list) {
    assert.equal(list['total_rows'], 3, 'and have three documents')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should be able to replicate with params', function (assert) {
  const p = db.replicate('database_replica', {})
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function () {
    assert.ok(true, 'Promise is resolved')
    assert.end()
  }).catch(function (e) {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should destroy the extra databases', function (assert) {
  async.forEach(['database_replica', 'database_replica2'],
    nano.db.destroy, function (error) {
      assert.equal(error, null, 'deleted databases')
      assert.end()
    })
})
