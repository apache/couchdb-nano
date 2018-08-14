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

const helpers = require('../../helpers/unit')
const test = require('tape')
const debug = require('debug')('nano/tests/unit/shared/error')

const cli = helpers.mockClientFail(debug)
const cli2 = helpers.mockClientUnparsedError(debug)
const cli3 = helpers.mockClientUnparsedError(debug, JSON.stringify({
  error: 'not a reason'
}))

const cli4 = helpers.mockClientUnparsedError(debug, JSON.stringify({
  stack: new Error('foo').stack
}))

test('it should be able to set a jar box', function (assert) {
  cli.relax({}, function (err) {
    assert.equal(err.message, 'error happened in your connection')
    assert.end()
  })
})

test('should be able to deal with html errors bad couches', function (assert) {
  cli2.relax({}, function (err) {
    assert.equal(err.message, '<b> Error happened </b>')
    assert.end()
  })
})

test('should be capable of using `error`', function (assert) {
  cli3.relax({}, function (err) {
    assert.equal(err.message, 'not a reason')
    assert.end()
  })
})

test('should remove cloudant stacktraces', function (assert) {
  cli4.relax({}, function (err) {
    const msg = err.stack.split('\n')[0]
    assert.notEqual(msg, 'Error: foo')
    assert.equal(msg, 'Error: Unspecified error')
    assert.end()
  })
})
