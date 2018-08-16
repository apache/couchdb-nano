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

const cli = helpers.mockClientDb(debug)
const db = cli.use('foo')

test('it should not return db info if docName undefined', function (assert) {
  db.get(undefined, function (err) {
    assert.equal(err.toString(), 'Error: Invalid doc id')
    assert.end()
  })
})

test('it should not return db info if docName null', function (assert) {
  db.get(null, function (err) {
    assert.equal(err.toString(), 'Error: Invalid doc id')
    assert.end()
  })
})

test('it should not return db info if docName empty string', function (assert) {
  db.get('', function (err) {
    assert.equal(err.toString(), 'Error: Invalid doc id')
    assert.end()
  })
})
