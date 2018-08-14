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
const nano = harness.locals.nano
const Nano = helpers.Nano
const it = harness.it

it('should throw when initialize fails', function (assert) {
  try {
    Nano('Not a url')
  } catch (err) {
    assert.ok(err, 'should have throw')
    assert.ok(err.message, 'with a description')
  }
  try {
    Nano({})
  } catch (err2) {
    assert.ok(err2, 'should have throw')
    assert.ok(err2.message, 'with a message')
  }
  assert.end()
})

it('should be able to stream the simplest request', function (assert) {
  const root = nano.request({stream: true})
  root.on('end', function () {
    assert.pass('request worked')
    assert.end()
  })
})

it('should error when destroying a db that does not exist', function (assert) {
  const p = nano.db.destroy('say_wat_wat')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function () {
    assert.ok(false, 'Promise is resolved')
  }).catch(function (error) {
    assert.ok(true, 'Promise is rejected')
    assert.equal(error.message, 'Database does not exist.', 'is missing')
    assert.end()
  })
})
