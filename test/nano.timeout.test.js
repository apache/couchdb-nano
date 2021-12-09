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
const COUCH_URL = 'http://localhost:59804'
const nano = Nano({
  url: COUCH_URL,
  requestDefaults: {
    timeout: 500
  }
})
const nock = require('nock')

afterEach(() => {
  nock.cleanAll()
})

test('check requests timeout - nano.request', async () => {
  // mocks
  const response = { ok: true }
  nock(COUCH_URL)
    .get('/db?a=1&b=2')
    .delay(1000)
    .reply(200, response)

  // test GET /db?a=1&b=2
  const req = {
    method: 'get',
    db: 'db',
    qs: { a: 1, b: 2 }
  }
  await expect(nano.request(req)).rejects.toThrow('error happened in your connection. Reason: timeout of 500ms exceeded')
})

test('check request timeout (callback) - nano.request', () => {
  // mocks
  const response = { ok: true }
  nock(COUCH_URL)
    .get('/db?a=1&b=2')
    .delay(1000)
    .reply(200, response)

  // test GET /db?a=1&b=2
  const req = {
    method: 'get',
    db: 'db',
    qs: { a: 1, b: 2 }
  }
  return new Promise((resolve, reject) => {
    nano.request(req, (err, data) => {
      expect(err).not.toBeNull()
      resolve()
    })
  })
})
