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

it('should serve the root when no path is specified', function (assert) {
  nano.dinosaur('').then(function (response) {
    assert.ok(response.version, 'version is defined')
    return nano.relax()
  }).then(function (response) {
    assert.ok(response.version, 'had version')
    assert.end()
  })
})

it('should be able to parse urls', function (assert) {
  const baseUrl = 'http://someurl.com'
  assert.equal(
    Nano(baseUrl).config.url,
    baseUrl,
    'simple url')

  assert.equal(
    Nano(baseUrl + '/').config.url,
    baseUrl + '/',
    'simple with trailing')

  assert.equal(
    Nano('http://a:b@someurl.com:5984').config.url,
    'http://a:b@someurl.com:5984',
    'with authentication')

  assert.equal(
    Nano('http://a:b%20c%3F@someurl.com:5984/mydb').config.url,
    'http://a:b%20c%3F@someurl.com:5984',
    'with escaped auth')

  assert.equal(
    Nano('http://a:b%20c%3F@someurl.com:5984/my%2Fdb').config.url,
    'http://a:b%20c%3F@someurl.com:5984',
    'with dbname containing encoded slash')

  assert.equal(
    Nano('http://mydb-a:b%20c%3F@someurl.com:5984/mydb').config.url,
    'http://mydb-a:b%20c%3F@someurl.com:5984',
    'with repeating dbname')

  assert.equal(
    Nano('http://a:b%20c%3F@someurl.com:5984/prefix/mydb').config.url,
    'http://a:b%20c%3F@someurl.com:5984/prefix',
    'with subdir')

  assert.equal(
    Nano(baseUrl + ':5984/a').config.url,
    baseUrl + ':5984',
    'with port')

  assert.equal(
    Nano(baseUrl + '/a').config.url,
    baseUrl,
    '`a` database')

  assert.end()
})

it('should not parse urls when parseURL flag set to false', function (assert) {
  const url = 'http://someurl.com/path'

  assert.equal(
    Nano({
      url: url,
      parseUrl: false
    }).config.url,
    url,
    'the untouched url')

  assert.end()
})

it('should accept and handle customer http headers', function (assert) {
  const nanoWithDefaultHeaders = Nano({
    url: helpers.couch,
    defaultHeaders: {
      'x-custom-header': 'custom',
      'x-second-header': 'second'
    }
  })

  const req = nanoWithDefaultHeaders.db.listAsStream(function (err) {
    assert.equal(err, null, 'should list')
    assert.end()
  })

  assert.equal(
    req.headers['x-custom-header'],
    'custom',
    'header `x-second-header` honored')

  assert.equal(
    req.headers['x-second-header'],
    'second',
    'headers `x-second-header` honored')
})

it('should prevent shallow object copies', function (assert) {
  const config = {
    url: 'http://someurl.com'
  }

  assert.equal(
    Nano(config).config.url,
    config.url,
    'simple url')

  assert.ok(
    Nano(config).config.requestDefaults,
    '`requestDefaults` should be set')
  assert.ok(!config.requestDefaults,
    'should not be re-using the same object')

  assert.end()
})
