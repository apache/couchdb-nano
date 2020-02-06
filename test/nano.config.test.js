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

test('should be able to supply HTTP url - nano.config', () => {
  const HTTP_URL = 'http://localhost:5984'
  const nano = Nano(HTTP_URL)
  expect(nano.config.url).toBe(HTTP_URL)
})

test('should be able to supply URL with database name - nano.config', () => {
  const HTTP_URL = 'http://localhost:5984/db'
  const nano = Nano(HTTP_URL)
  expect(nano.config.url).toBe('http://localhost:5984')
  expect(nano.config.db).toBe('db')
})

test('should be able to supply HTTPS url - nano.config', () => {
  const HTTPS_URL = 'https://mydomain.com'
  const nano = Nano(HTTPS_URL)
  expect(nano.config.url).toBe(HTTPS_URL)
})

test('should be able to supply HTTP url with cookie jar - nano.config', () => {
  const HTTP_URL = 'http://localhost:5984'
  const nano = Nano({ url: HTTP_URL, jar: true })
  expect(nano.config.url).toBe(HTTP_URL)
  expect(nano.config.jar).toBe(true)
})

test('should be able to supply HTTPS url with auth credentials - nano.config', () => {
  const HTTPS_URL = 'https://myusername:mypassword@mydomain.com'
  const nano = Nano(HTTPS_URL)
  expect(nano.config.url).toBe(HTTPS_URL)
})

test('should be able to supply requestDefaults - nano.config', () => {
  const HTTPS_URL = 'https://myusername:mypassword@mydomain.com'
  const defaults = { proxy: 'http://localproxy.com' }
  const nano = Nano({ url: HTTPS_URL, requestDefaults: defaults })
  expect(nano.config.url).toBe(HTTPS_URL)
  expect(nano.config.requestDefaults).toBe(defaults)
})

test('should be able to supply logging function - nano.config', () => {
  const HTTPS_URL = 'https://myusername:mypassword@mydomain.com'
  const logger = (id, args) => {
    console.log(id, args)
  }
  const nano = Nano({ url: HTTPS_URL, log: logger })
  expect(nano.config.url).toBe(HTTPS_URL)
  expect(typeof nano.config.log).toBe('function')
})
