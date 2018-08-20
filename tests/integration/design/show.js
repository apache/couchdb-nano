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

const async = require('async')
const helpers = require('../../helpers/integration')
const harness = helpers.harness(__filename)
const it = harness.it
const db = harness.locals.db

it('should insert a show ddoc', function (assert) {
  db.insert({
    shows: {
      singleDoc: function (doc, req) {
        if (req.query.format === 'json' || !req.query.format) {
          return {
            body: JSON.stringify({
              name: doc.name,
              city: doc.city,
              format: 'json'
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          }
        }
        if (req.query.format === 'html') {
          return {
            body: 'Hello Clemens!',
            headers: {
              'Content-Type': 'text/html'
            }
          }
        }
      }
    }
  }, '_design/people', function (error, response) {
    assert.equal(error, null, 'should start the show')
    assert.equal(response.ok, true, 'response ok')
    async.parallel([
      function (cb) {
        db.insert({
          name: 'Clemens',
          city: 'Dresden'
        }, 'p_clemens', cb)
      },
      function (cb) {
        db.insert({
          name: 'Randall',
          city: 'San Francisco'
        }, 'p_randall', cb)
      }, function (cb) {
        db.insert({
          name: 'Nuno',
          city: 'New York'
        }, 'p_nuno', cb)
      }
    ], function (error) {
      assert.equal(error, null, 'stores docs')
      assert.end()
    })
  })
})

it('should show the amazing clemens in json', function (assert) {
  const p = db.show('people', 'singleDoc', 'p_clemens')
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function (doc) {
    assert.ok(true, 'Promise is resolved')
    assert.equal(doc.name, 'Clemens')
    assert.equal(doc.city, 'Dresden')
    assert.equal(doc.format, 'json')
    assert.end()
  }).catch(function () {
    assert.ok(false, 'Promise is rejected')
  })
})

it('should show the amazing clemens in html', function (assert) {
  db.show('people', 'singleDoc', 'p_clemens', {format: 'html'},
    function (error, doc, rh) {
      assert.equal(error, null, 'should work')
      if (helpers.unmocked) {
        assert.equal(rh['content-type'], 'text/html')
      }
      assert.equal(doc, 'Hello Clemens!')
      assert.end()
    })
})
