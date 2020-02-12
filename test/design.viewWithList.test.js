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
const COUCH_URL = 'http://localhost:5984'
const nano = Nano(COUCH_URL)
const nock = require('nock')

afterEach(() => {
  nock.cleanAll()
})

test('should be able to access a MapReduce view with a list - GET /db/_design/ddoc/_list/listname/viewname - db.viewWithList', async () => {
  // mocks
  const response = '1,2,3\n4,5,6\n7,8,9\n'
  const scope = nock(COUCH_URL)
    .get('/db/_design/ddoc/_list/listname/viewname')
    .reply(200, response, { 'Content-type': 'text/csv' })

  // test GET /db/_design/ddoc/_list/listname/viewname
  const db = nano.db.use('db')
  const p = await db.viewWithList('ddoc', 'viewname', 'listname')
  expect(p).toStrictEqual(response)
  expect(scope.isDone()).toBe(true)
})
