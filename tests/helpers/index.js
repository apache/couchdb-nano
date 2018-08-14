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

const path = require('path')
const fs = require('fs')
const url = require('url')
const nano = require('../../lib/nano')

const helpers = exports
const cfg = helpers.cfg = require('../fixtures/cfg')
const auth = url.parse(cfg.admin).auth.split(':')

helpers.noopTest = function (t) { t.end() }
helpers.timeout = cfg.timeout
helpers.nano = nano(cfg.couch)
helpers.Nano = nano
helpers.couch = cfg.couch
helpers.admin = cfg.admin
helpers.pixel = 'Qk06AAAAAAAAADYAAAAoAAAAAQAAAP////8BABgAAAAA' +
  'AAAAAAATCwAAEwsAAAAAAAAAAAAAWm2CAA=='

helpers.username = auth[0]
helpers.password = auth[1]

helpers.loadFixture = function helpersLoadFixture (filename, json) {
  const contents = fs.readFileSync(
    path.join(__dirname, '..', 'fixtures', filename), (json ? 'ascii' : null))
  return json ? JSON.parse(contents) : contents
}
