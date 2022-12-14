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

const test = require('node:test')
const assert = require('node:assert/strict')

const CookieJar = require('../lib/cookie.js')

test('should parse cookies correctly', () => {
  const cj = new CookieJar()
  const expiry = new Date().getTime() + 1000 * 60
  const expiryStr = new Date(expiry).toGMTString()
  const n = 'AuthSession'
  const v = `${n}=YWRtaW46NjM5ODgzQ0Y6TuB66MczvkZ7axEJq6Fz0gOdhKY`
  const sc = `${v}; Version=1; Expires=${expiryStr}; Max-Age=60; Path=/; HttpOnly`
  const url = 'http://mydomain.com/_session'
  cj.parse(sc, url)
  assert.equal(cj.jar.length, 1)
  const cookie = {
    name: 'AuthSession',
    origin: 'http://mydomain.com',
    pathname: '/_session',
    protocol: 'http:',
    version: '1',
    expires: expiryStr,
    'max-age': '60',
    path: '/',
    httponly: true,
    ts: new Date(expiryStr).getTime(),
    value: v
  }
  assert.deepEqual(cj.jar[0], cookie)
})

test('should handle multiple cookies', () => {
  const cj = new CookieJar()
  const expiry = new Date().getTime() + 1000 * 60
  const expiryStr = new Date(expiry).toGMTString()
  const n = 'AuthSession'
  const v1 = 'YWRtaW46NjM5ODgzQ0Y6TuB66MczvkZ7axEJq6Fz0gOdhKY'
  const v2 = 'YWRtaW46NjM5ODgzQ0Y6TuB66MczvkZ7axEJq6Fz0gOdhKY'
  const v3 = 'YWRtaW46NjM5ODgzQ0Y6TuB66MczvkZ7axEJq6Fz0gOdhKY'
  const sc1 = `${n}1=${v1}; Version=1; Expires=${expiryStr}; Max-Age=60; Path=/; HttpOnly`
  const sc2 = `${n}2=${v2}; Version=1; Expires=${expiryStr}; Max-Age=60; Path=/; HttpOnly`
  const sc3 = `${n}3=${v3}; Version=1; Expires=${expiryStr}; Max-Age=60; Path=/; HttpOnly`
  const url = 'http://mydomain.com/_session'
  cj.parse(sc1, url)
  cj.parse(sc2, url)
  cj.parse(sc3, url)
  assert.equal(cj.jar.length, 3)
  let cookie = {
    name: 'AuthSession1',
    origin: 'http://mydomain.com',
    pathname: '/_session',
    protocol: 'http:',
    version: '1',
    expires: expiryStr,
    'max-age': '60',
    path: '/',
    httponly: true,
    ts: new Date(expiryStr).getTime(),
    value: `AuthSession1=${v1}`
  }
  assert.deepEqual(cj.jar[0], cookie)
  cookie = {
    name: 'AuthSession2',
    origin: 'http://mydomain.com',
    pathname: '/_session',
    protocol: 'http:',
    version: '1',
    expires: expiryStr,
    'max-age': '60',
    path: '/',
    httponly: true,
    ts: new Date(expiryStr).getTime(),
    value: `AuthSession2=${v2}`
  }
  assert.deepEqual(cj.jar[1], cookie)
  cookie = {
    name: 'AuthSession3',
    origin: 'http://mydomain.com',
    pathname: '/_session',
    protocol: 'http:',
    version: '1',
    expires: expiryStr,
    'max-age': '60',
    path: '/',
    httponly: true,
    ts: new Date(expiryStr).getTime(),
    value: `AuthSession3=${v3}`
  }
  assert.deepEqual(cj.jar[2], cookie)
})

test('should handle multiple domains', () => {
  const cj = new CookieJar()
  const expiry = new Date().getTime() + 1000 * 60
  const expiryStr = new Date(expiry).toGMTString()
  const n = 'AuthSession'
  const v1 = 'gzQ0Y6TuB66MczYWRtaW46NjM5ODvkZ7axEJq6Fz0gOdhKY'
  const v2 = 'YWRtaWzQ0Y6T46NjM5ODguB66MczvkZ7axEJq6Fz0gOdhKY'
  const v3 = '46NjM5ODgYWRtaW46NjM5ODgzQ0Y6TuB66MczvkZ7axEJq6Fz0gOdhKY'
  const v4 = 'Y6TuB66MczvkZ7axY6TuBxzvkZ7ax46NjM5ODgYWRtaW46NjM5ODgzQ0EJq6Fz0gOdhKY'
  const sc1 = `${n}1=${v1}; Version=1; Expires=${expiryStr}; Max-Age=60; Path=/; HttpOnly`
  const sc2 = `${n}2=${v2}; Version=1; Expires=${expiryStr}; Max-Age=60; Path=/; HttpOnly`
  const sc3 = `${n}3=${v3}; Version=1; Expires=${expiryStr}; Max-Age=60; Path=/; HttpOnly`
  const sc4 = `${n}4=${v4}; Version=1; Expires=${expiryStr}; Max-Age=60; Path=/; HttpOnly`
  const url1 = 'http://mydomain1.com/_session'
  const url2 = 'http://mydomain2.com/_session'
  const url3 = 'http://mydomain3.com/_session'
  cj.parse(sc1, url1)
  cj.parse(sc2, url2)
  cj.parse(sc3, url3)
  cj.parse(sc4, url3)
  assert.equal(cj.jar.length, 4)
  let cookie = {
    name: 'AuthSession1',
    origin: 'http://mydomain1.com',
    pathname: '/_session',
    protocol: 'http:',
    version: '1',
    expires: expiryStr,
    'max-age': '60',
    path: '/',
    httponly: true,
    ts: new Date(expiryStr).getTime(),
    value: `AuthSession1=${v1}`
  }
  assert.deepEqual(cj.jar[0], cookie)
  assert.deepEqual(cj.getCookieString(url1), cookie.value)
  cookie = {
    name: 'AuthSession2',
    origin: 'http://mydomain2.com',
    pathname: '/_session',
    protocol: 'http:',
    version: '1',
    expires: expiryStr,
    'max-age': '60',
    path: '/',
    httponly: true,
    ts: new Date(expiryStr).getTime(),
    value: `AuthSession2=${v2}`
  }
  assert.deepEqual(cj.jar[1], cookie)
  assert.deepEqual(cj.getCookieString(url2), cookie.value)
  const cookie1 = {
    name: 'AuthSession3',
    origin: 'http://mydomain3.com',
    pathname: '/_session',
    protocol: 'http:',
    version: '1',
    expires: expiryStr,
    'max-age': '60',
    path: '/',
    httponly: true,
    ts: new Date(expiryStr).getTime(),
    value: `AuthSession3=${v3}`
  }
  assert.deepEqual(cj.jar[2], cookie1)
  const cookie2 = {
    name: 'AuthSession4',
    origin: 'http://mydomain3.com',
    pathname: '/_session',
    protocol: 'http:',
    version: '1',
    expires: expiryStr,
    'max-age': '60',
    path: '/',
    httponly: true,
    ts: new Date(expiryStr).getTime(),
    value: `AuthSession4=${v4}`
  }
  assert.deepEqual(cj.jar[3], cookie2)
  // multiple cookies - 2 cookies for url3
  assert.equal(cj.getCookieString(url3), `${cookie1.value}; ${cookie2.value}`)

  // check we don't get a cookie for a subdomain
  assert.equal(cj.getCookieString('http://sub.mydomain3.com'), '')
})

const sleep = async (ms) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}

test('should expire cookies correctly', async () => {
  const cj = new CookieJar()
  const expiry = new Date().getTime() + 1000 * 5
  const expiryStr = new Date(expiry).toGMTString()
  const n = 'AuthSession'
  const v = `${n}=YWRtaW46NjM5ODgzQ0Y6TuB66MczvkZ7axEJq6Fz0gOdhKY`
  const sc = `${v}; Version=1; Expires=${expiryStr}; Max-Age=5; Path=/; HttpOnly`
  const url = 'http://mydomain.com/_session'
  cj.parse(sc, url)
  assert.equal(cj.jar.length, 1)
  assert.notEqual(cj.getCookieString(url).length, 0)
  await sleep(5000)
  assert.equal(cj.getCookieString(url).length, 0)
  assert.equal(cj.getCookieString(url).length, 0)
})

test('should respect path', () => {
  const cj = new CookieJar()
  const expiry = new Date().getTime() + 1000 * 60
  const expiryStr = new Date(expiry).toGMTString()
  const n = 'AuthSession'
  const v1 = `${n}1=YWRtaW46NjM5ODgzQ0Y6TuB66MczvkZ7axEJq6Fz0gOdhKY`
  const sc1 = `${v1}; Version=1; Expires=${expiryStr}; Max-Age=60; Path=/my/path; HttpOnly`
  const v2 = `${n}2=YczvkZ7axEJq6Fz0gOdhKYWRtaW46NjM5ODgzQ0Y6TuB66M`
  const sc2 = `${v2}; Version=1; Expires=${expiryStr}; Max-Age=60; Path=/; HttpOnly`

  const url = 'http://mydomain.com/_session'
  cj.parse(sc1, url)
  cj.parse(sc2, url)
  assert.equal(cj.jar.length, 2)
  const cookie1 = {
    name: 'AuthSession1',
    origin: 'http://mydomain.com',
    pathname: '/_session',
    protocol: 'http:',
    version: '1',
    expires: expiryStr,
    'max-age': '60',
    path: '/my/path',
    httponly: true,
    ts: new Date(expiryStr).getTime(),
    value: v1
  }
  assert.deepEqual(cj.jar[0], cookie1)
  const cookie2 = {
    name: 'AuthSession2',
    origin: 'http://mydomain.com',
    pathname: '/_session',
    protocol: 'http:',
    version: '1',
    expires: expiryStr,
    'max-age': '60',
    path: '/',
    httponly: true,
    ts: new Date(expiryStr).getTime(),
    value: v2
  }
  assert.deepEqual(cj.jar[1], cookie2)

  // one cookies for path=/
  let cs = cj.getCookieString('http://mydomain.com/')
  assert.equal(cs, `${cookie2.value}`)
  // two cookies for path=/my/path
  cs = cj.getCookieString('http://mydomain.com/my/path')
  assert.equal(cs, `${cookie1.value}; ${cookie2.value}`)
  // two cookies for path=/my/path/extra
  cs = cj.getCookieString('http://mydomain.com/my/path/extra')
  assert.equal(cs, `${cookie1.value}; ${cookie2.value}`)
  // zero cookies for different domain
  cs = cj.getCookieString('http://myotherdomain.com/my/path/extra')
  assert.equal(cs, '')
})

test('should renew cookies', () => {
  const cj = new CookieJar()
  const n = 'AuthSession'
  const expiry1 = new Date().getTime() + 1000 * 60
  const expiryStr1 = new Date(expiry1).toGMTString()

  const v1 = `${n}=YWRtaW46NjM5ODgzQ0Y6TuB66MczvkZ7axEJq6Fz0gOdhKY`
  const sc1 = `${v1}; Version=1; Expires=${expiryStr1}; Max-Age=60; Path=/; HttpOnly`

  const expiry2 = new Date().getTime() + 1000 * 120
  const expiryStr2 = new Date(expiry2).toGMTString()
  const v2 = `${n}=gOdhKYWRtaW46NjM5ODgzQ0Y6TuB66MYczvkZ7axEJq6Fz0`
  const sc2 = `${v2}; Version=1; Expires=${expiryStr2}; Max-Age=60; Path=/; HttpOnly`

  const url = 'http://mydomain.com/_session'

  // parse first cookie string
  cj.parse(sc1, url)
  assert.equal(cj.jar.length, 1)
  const cookie1 = {
    name: 'AuthSession',
    origin: 'http://mydomain.com',
    pathname: '/_session',
    protocol: 'http:',
    version: '1',
    expires: expiryStr1,
    'max-age': '60',
    path: '/',
    httponly: true,
    ts: new Date(expiryStr1).getTime(),
    value: v1
  }
  assert.deepEqual(cj.jar[0], cookie1)

  // then refresh the cookie
  cj.parse(sc2, url)
  const cookie2 = {
    name: 'AuthSession',
    origin: 'http://mydomain.com',
    pathname: '/_session',
    protocol: 'http:',
    version: '1',
    expires: expiryStr2,
    'max-age': '60',
    path: '/',
    httponly: true,
    ts: new Date(expiryStr2).getTime(),
    value: v2
  }

  // ensure it updates the same cookie
  assert.equal(cj.jar.length, 1)
  assert.deepEqual(cj.jar[0], cookie2)
})

test('should send cookies to authorised subdomains', () => {
  const cj = new CookieJar()
  const expiry = new Date().getTime() + 1000 * 60
  const expiryStr = new Date(expiry).toGMTString()
  const n = 'AuthSession'
  const v = `${n}=YWRtaW46NjM5ODgzQ0Y6TuB66MczvkZ7axEJq6Fz0gOdhKY`
  const sc = `${v}; Version=1; Expires=${expiryStr}; Max-Age=60; Path=/; HttpOnly; Domain=.mydomain.com`
  const url = 'http://test.mydomain.com/_session'
  cj.parse(sc, url)
  assert.equal(cj.jar.length, 1)
  const cookie = {
    name: 'AuthSession',
    origin: 'http://test.mydomain.com',
    pathname: '/_session',
    protocol: 'http:',
    version: '1',
    expires: expiryStr,
    'max-age': '60',
    path: '/',
    httponly: true,
    domain: '.mydomain.com',
    ts: new Date(expiryStr).getTime(),
    value: v
  }
  assert.deepEqual(cj.jar[0], cookie)

  // check we get a cookie for the same domain
  let cs = cj.getCookieString('http://test.mydomain.com/my/path/extra')
  assert.equal(cs, `${cookie.value}`)

  // check we get a cookie for the different domain
  cs = cj.getCookieString('http://different.mydomain.com/my/path/extra')
  assert.equal(cs, `${cookie.value}`)
  cs = cj.getCookieString('http://sub.different.mydomain.com/my/path/extra')
  assert.equal(cs, `${cookie.value}`)

  // check we get no cookies for the different domain
  cs = cj.getCookieString('http://mydomain1.com/my/path/extra')
  assert.equal(cs, '')
})

test('should not send http-only cookies to https', () => {
  const cj = new CookieJar()
  const expiry = new Date().getTime() + 1000 * 60
  const expiryStr = new Date(expiry).toGMTString()
  const n = 'AuthSession'
  const v = `${n}=YWRtaW46NjM5ODgzQ0Y6TuB66MczvkZ7axEJq6Fz0gOdhKY`
  const sc = `${v}; Version=1; Expires=${expiryStr}; Max-Age=60; Path=/; HttpOnly; Domain=.mydomain.com`
  const url = 'http://test.mydomain.com/_session'
  cj.parse(sc, url)
  assert.equal(cj.jar.length, 1)
  const cookie = {
    name: 'AuthSession',
    origin: 'http://test.mydomain.com',
    pathname: '/_session',
    protocol: 'http:',
    version: '1',
    expires: expiryStr,
    'max-age': '60',
    path: '/',
    httponly: true,
    domain: '.mydomain.com',
    ts: new Date(expiryStr).getTime(),
    value: v
  }
  assert.deepEqual(cj.jar[0], cookie)

  // check we get a cookie for the same domain (http)
  let cs = cj.getCookieString('http://test.mydomain.com/my/path/extra')
  assert.equal(cs, `${cookie.value}`)

  // but not https
  cs = cj.getCookieString('https://test.mydomain.com/my/path/extra')
  assert.equal(cs, '')
})

test('should not send secure-only cookies to http', () => {
  const cj = new CookieJar()
  const expiry = new Date().getTime() + 1000 * 60
  const expiryStr = new Date(expiry).toGMTString()
  const n = 'AuthSession'
  const v = `${n}=YWRtaW46NjM5ODgzQ0Y6TuB66MczvkZ7axEJq6Fz0gOdhKY`
  const sc = `${v}; Version=1; Expires=${expiryStr}; Max-Age=60; Path=/; Secure; Domain=.mydomain.com`
  const url = 'https://test.mydomain.com/_session'
  cj.parse(sc, url)
  assert.equal(cj.jar.length, 1)
  const cookie = {
    name: 'AuthSession',
    origin: 'https://test.mydomain.com',
    pathname: '/_session',
    protocol: 'https:',
    version: '1',
    expires: expiryStr,
    'max-age': '60',
    path: '/',
    secure: true,
    domain: '.mydomain.com',
    ts: new Date(expiryStr).getTime(),
    value: v
  }
  assert.deepEqual(cj.jar[0], cookie)

  // check we get a cookie for the same domain (http)
  let cs = cj.getCookieString('https://test.mydomain.com/my/path/extra')
  assert.equal(cs, `${cookie.value}`)

  // but not http
  cs = cj.getCookieString('http://test.mydomain.com/my/path/extra')
  assert.equal(cs, '')
})
