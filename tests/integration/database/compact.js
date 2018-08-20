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
const it = harness.it
const db = harness.locals.db

it('should store and delete `goofy`', function (assert) {
  let p = db.insert({'foo': 'baz'}, 'goofy')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (foo) {
    assert.equal(foo.ok, true, 'response should be ok')
    return db.destroy('goofy', foo.rev)
  }).then(function (response) {
    assert.equal(response.ok, true, 'response ok')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should have run the compaction', function (assert) {
  const p = db.compact()
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function () {
    return db.info()
  }).then(function (info) {
    assert.equal(info['doc_count'], 0, 'document count is not 3')
    assert.equal(info['doc_del_count'], 1, 'document should be deleted')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should finish compaction before ending', function (assert) {
  function nextWhenFinished () {
    db.info(function (err, info) {
      if (err) {
        return
      }
      if (info['compact_running']) {
        return
      }
      clearTimeout(task)
      assert.pass('compaction is complete')
      assert.end()
    })
  }

  const task = setInterval(nextWhenFinished, 100)
})
