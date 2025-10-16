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

import test from 'node:test'
import assert from 'node:assert/strict'
import Nano from '../lib/nano.js'
const nano = Nano('http://myurl.com')

test('should be able to use a database - nano.db.use', () => {
  const db = nano.db.use('db1')
  assert.equal(typeof db, 'object')
  assert.equal(typeof db.get, 'function')
  assert.equal(typeof db.replication, 'object')
  assert.equal(db.config.db, 'db1')
})

test('should be able to use a database - nano.use', () => {
  const db = nano.use('db2')
  assert.equal(typeof db, 'object')
  assert.equal(typeof db.get, 'function')
  assert.equal(typeof db.replication, 'object')
  assert.equal(db.config.db, 'db2')
})
