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

const helpers = require('../../helpers/integration');
const harness = helpers.harness(__filename);
const nano = harness.locals.nano;
const Nano = helpers.Nano;
const it = harness.it;

let cookie;
let server;

it('should be able to create a user', function(assert) {
  nano.relax({
    method : 'POST',
    path: '_users',
    body: {
      _id: 'org.couchdb.user:' + helpers.username,
      type: 'user',
      name: helpers.username,
      roles: ['admin'],
      password: helpers.password
    }
  }, function(err) {
    assert.equal(err, null, 'should create admin');
    nano.auth(helpers.username, helpers.password, function(err, _, headers) {
      assert.equal(err, null, 'should have logged in successfully');
      if (helpers.unmocked) {
        assert.ok(headers['set-cookie'],
          'response should have a set-cookie header');
      }
      cookie = headers['set-cookie'];
      assert.end();
    });
  });
});

it('should be able to insert with a cookie', function(assert) {
  server = Nano({
    url: helpers.couch,
    cookie: cookie
  });
  const db = server.use('shared_cookie');

  const p = db.insert({'foo': 'baz'}, null, function(error, response) {
    assert.equal(error, null, 'should have stored value');
    assert.equal(response.ok, true, 'response should be ok');
    assert.ok(response.rev, 'response should have rev');
    assert.end();
  });
  assert.ok(helpers.isPromise(p), 'returns Promise');
  p.then(function(response) {
    assert.ok(true, 'Promise is resolved');
    assert.equal(response.ok, true, 'response should be ok');
    assert.ok(response.rev, 'response should have rev');
  }).catch(function() {
    assert.ok(false, 'Promise is rejected');
  });
});

it('should be able to get the session', function(assert) {
  server.session(function(error, session) {
    assert.equal(error, null, 'should have gotten the session');
    assert.equal(session.userCtx.name, helpers.username);
    assert.end();
  });
});

