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

module.exports = function () {
  const nano = require('nano')('http://localhost:5984')
  const users = nano.use('users')
  const VIEWS = { by_twitter_id:
    { 'map': 'function(doc) { emit(doc.twitter.screen_name, doc); }' } }

  /*****************************************************************************
 * user.get()
 ****************************************************************************/
  function userGet (id, callback) {
    return users.get(id, callback)
  }

  /*****************************************************************************
 * user.new()
 ****************************************************************************/
  function userNew (id, body, callback) {
    return users.insert(body, id, callback)
  }

  /*****************************************************************************
 * user.create()
 ****************************************************************************/
  function createUsersDatabase (emailAddress, secret, name, retries) {
    nano.db.create('users', function (e, b, h) {
      userCreate(emailAddress, secret, name, retries + 1)
    })
  }

  function userCreate (emailAddress, secret, name, retries) {
    if (!retries) {
      retries = 0
    }
    users.insert({emailAddress: emailAddress, secret: secret, name: name}, secret,
      function (e, b, h) {
        if (e && e.message === 'no_db_file' && retries < 1) {
          return createUsersDatabase(emailAddress, secret, name, retries)
        }
        (function () { })(e, b, h)
      })
  }

  /*****************************************************************************
 * user.find()
 ****************************************************************************/
  //
  // some more logic needed
  // what if design document exists but view doesnt, we cant just overwrite it
  //
  // we need a way to fectch and build on
  // and thats the reason why im not doing this at 5am

  function userFind (view, id, opts, tried, callback) {
    if (typeof tried === 'function') {
      callback = tried
      tried = {tried: 0, max_retries: 2}
    }
    users.view('users', view, opts, function (e, b, h) {
      if (e) {
        var currentView = VIEWS[view]
        if (!currentView) {
          e.message = 'View is not available'
          return callback(e, b, h)
        }
        if (tried.tried < tried.max_retries) {
          if (e.message === 'missing' || e.message === 'deleted') { // create design document
            var designDoc = {views: {}}
            designDoc.views[view] = currentView
            return users.insert(designDoc, '_design/users', function () {
              tried.tried += 1
              userFind(view, id, opts, tried, callback)
            })
          }
          if (e.message === 'missing_named_view') {
            users.get('_design/users', function (e, b, h) { // create view
              tried.tried += 1
              if (e) { return userFind(view, id, opts, tried, callback) }
              b.views[view] = currentView
              users.insert(b, '_design/users', function (e, b, h) {
                return userFind(view, id, opts, tried, callback)
              })
            })
            return
          }
        } else { return callback(e, b, h) }
      }
      return callback(null, b, h)
    })
  }

  function userFirst (view, id, callback) {
    return userFind(view, id, {startkey: ('"' + id + '"'), limit: 1}, callback)
  }

  return {
    new: userNew,
    get: userGet,
    create: userCreate,
    first: userFirst
  }
}
