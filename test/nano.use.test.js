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

test('should be able to use a database - nano.db.use', () => {
  const db = nano.db.use('db1')
  expect(typeof db).toBe('object')
  expect(typeof db.get).toBe('function')
  expect(typeof db.replication).toBe('object')
  expect(db.config.db).toBe('db1')
})

test('should be able to use a database - nano.use', () => {
  const db = nano.use('db2')
  expect(typeof db).toBe('object')
  expect(typeof db.get).toBe('function')
  expect(typeof db.replication).toBe('object')
  expect(db.config.db).toBe('db2')
})
