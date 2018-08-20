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

const nano = require('nano')
const couch =
    { 'master': 'http://localhost:5984/landing_m',
      'replica': 'http://localhost:5984/landing_r'
    }

function insertWithRetry (db, email, retries, callback) {
  if (typeof retries === 'function') {
    callback = retries
    retries = 0
  }
  callback = callback || function () {}
  db.insert(email, function (err, resp, head) {
    if (err) {
      if (err.message === 'no_db_file' && retries < 1) {
        const dbName = db.config.db
        const server = nano(db.config.url)

        server.db.create(dbName, function (err2, resp2, head2) {
          if (err2) { return callback(err2, resp2, head2) }
          insertWithRetry(db, email, retries + 1, callback)
        })
      } else { return callback(err, resp, head) }
    }
    callback(err, resp, head)
  })
}

function replicateWithRetry (masterUri, replicaUri, retries, callback) {
  if (typeof retries === 'function') {
    callback = retries
    retries = 0
  }
  callback = callback || function () {}
  retries = retries || 0
  var master = nano(couch.master)
  master.replicate(couch.replica, function (err, resp, head) {
    if (err && err['error'] === 'db_not_found' && retries < 1) {
      const replica = nano(couch.replica)
      const dbName = replica.config.db
      const server = nano(replica.config.url)

      server.db.create(dbName, function (err2, resp2, head2) {
        if (err2) { return callback(err2, resp2, head2) }
        replicateWithRetry(masterUri, replicaUri, retries + 1, callback)
      })
    }
    callback(err, resp, head)
  })
}

module.exports = {insert: insertWithRetry, replicate: replicateWithRetry}
