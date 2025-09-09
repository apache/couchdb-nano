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

const Nano = require('..')
const test = require('node:test')
const assert = require('node:assert/strict')

test('should be able to supply HTTP url - nano.config', () => {
  const HTTP_URL = 'http://127.0.0.1:5984'
  const nano = Nano(HTTP_URL)
  assert.equal(nano.config.url, HTTP_URL)
})

test('should be able to supply URL with database name - nano.config', () => {
  const HTTP_URL = 'http://127.0.0.1:5984/db'
  const nano = Nano(HTTP_URL)
  assert.equal(nano.config.url, 'http://127.0.0.1:5984')
  assert.equal(nano.config.db, 'db')
})

test('should be able to supply HTTPS url - nano.config', () => {
  const HTTPS_URL = 'https://mydomain.com'
  const nano = Nano(HTTPS_URL)
  assert.equal(nano.config.url, HTTPS_URL)
})

test('should be able to supply HTTP url with cookie jar - nano.config', () => {
  const HTTP_URL = 'http://127.0.0.1:5984'
  const nano = Nano({ url: HTTP_URL, jar: true })
  assert.equal(nano.config.url, HTTP_URL)
  assert.equal(nano.config.jar, true)
})

test('should be able to supply HTTPS url with auth credentials - nano.config', () => {
  const HTTPS_URL = 'https://myusername:mypassword@mydomain.com'
  const nano = Nano(HTTPS_URL)
  assert.equal(nano.config.url, HTTPS_URL)
})

test('should be able to supply requestDefaults - nano.config', () => {
  const HTTPS_URL = 'https://myusername:mypassword@mydomain.com'
  const defaults = { proxy: 'http://localproxy.com' }
  const nano = Nano({ url: HTTPS_URL, requestDefaults: defaults })
  assert.equal(nano.config.url, HTTPS_URL)
  assert.equal(nano.config.requestDefaults, defaults)
})

test('should be able to supply logging function - nano.config', () => {
  const HTTPS_URL = 'https://myusername:mypassword@mydomain.com'
  const logger = (id, args) => {
    console.log(id, args)
  }
  const nano = Nano({ url: HTTPS_URL, log: logger })
  assert.equal(nano.config.url, HTTPS_URL)
  assert.equal(typeof nano.config.log, 'function')
})

test('should be able to handle missing URL - nano.config', () => {
  try {
    Nano()
  } catch (e) {
    assert(e instanceof assert.AssertionError)
  }
})

test('should be able to handle invalid URL #1 - nano.config', () => {
  const INVALID_URL = 'badurl.com'
  try {
    Nano(INVALID_URL)
  } catch (e) {
    assert(e instanceof assert.AssertionError)
  }
})

test('should be able to handle invalid URL #2 - nano.config', () => {
  const INVALID_URL = 'badurl.com'
  try {
    Nano({ url: INVALID_URL })
  } catch (e) {
    assert(e instanceof assert.AssertionError)
  }
})

test('exercise the parseUrl feature for proxies etc - nano.config', () => {
  const HTTP_URL = 'http://127.0.0.1:5984/prefix'
  const nano = Nano({
    url: HTTP_URL,
    parseUrl: false
  })
  assert.equal(nano.config.url, HTTP_URL)
})
