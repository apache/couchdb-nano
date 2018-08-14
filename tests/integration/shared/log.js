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

const logger = require('../../../lib/logger')
const helpers = require('../../helpers')
const harness = helpers.harness(__filename)
const it = harness.it

it('should be able to instantiate a log', function (assert) {
  const log = logger({
    log: function (id, msg) {
      assert.equal(typeof id, 'string', 'id is set `' + id + '`')
      assert.equal(msg[0], 'testing 1234')
      assert.end()
    }
  })()
  log('testing 1234')
})
