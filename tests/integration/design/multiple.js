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

'use strict';

var helpers = require('../../helpers/integration');
var harness = helpers.harness(__filename);
var it = harness.it;
var db = harness.locals.db;

it('should be able to insert docs and design doc', function(assert) {
  var p = db.insert({
    views: {
      'by_id': {
        map: 'function(doc) { emit(doc._id, doc); }'
      }
    }
  }, '_design/alice', function(error, response) {
    assert.equal(error, null, 'should create views');
    assert.equal(response.ok, true, 'response ok');
    assert.end();
  });
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function(response) {
    assert.ok(true, 'Promise is resolved');
    assert.equal(error, null, 'should create views');
    assert.equal(response.ok, true, 'response ok');
  }).catch(function(error) {
    assert.ok(false, 'Promise is rejected');
  });
});

it('should insert a bunch of items', helpers.insertThree);

it('get multiple docs with a composed key', function(assert) {
  var p = db.view('alice', 'by_id', {
    keys: ['foobar', 'barfoo'],
    'include_docs': true
  }, function(err, view) {
    assert.equal(err, null, 'should response');
    assert.equal(view.rows.length, 2, 'has more or less than two rows');
    assert.equal(view.rows[0].id, 'foobar', 'foo is not the first id');
    assert.equal(view.rows[1].id, 'barfoo', 'bar is not the second id');
    assert.end();
  });
  assert.ok(helpers.isPromise(p), 'returns Promise')
  p.then(function(view) {
    assert.ok(true, 'Promise is resolved');
    assert.equal(view.rows.length, 2, 'has more or less than two rows');
    assert.equal(view.rows[0].id, 'foobar', 'foo is not the first id');
    assert.equal(view.rows[1].id, 'barfoo', 'bar is not the second id');
  }).catch(function(error) {
    assert.ok(false, 'Promise is rejected');
  });
});

it('get multiple docs with a composed key as a stream', function(assert) {
  var p = db.viewAsStream('alice', 'by_id', {
    keys: ['foobar', 'barfoo'],
    'include_docs': true
  }, function(err, view) {
    assert.equal(err, null, 'should response');
    assert.equal(view.rows.length, 2, 'has more or less than two rows');
    assert.equal(view.rows[0].id, 'foobar', 'foo is not the first id');
    assert.equal(view.rows[1].id, 'barfoo', 'bar is not the second id');
    assert.end();
  });
  assert.ok(!helpers.isPromise(p), 'does not returns Promise')
  assert.equal(p.constructor.name, 'Request', 'returns a Request')
});
