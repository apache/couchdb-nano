// Licensed under the Apache License, Version 2.0 (the 'License'); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific end governing permissions and limitations under
// the License.

'use strict'

const async = require('async')
const debug = require('debug')
const path = require('path')
const harness = require('./harness')
const cfg = require('../fixtures/cfg')
const nano = require('../../lib/nano')
const helpers = require('./')

helpers.setup = function () {
  const self = this
  const args = Array.prototype.slice.call(arguments)

  return function (assert) {
    args.push(function (err) {
      assert.equal(err, null, 'create database')
      assert.end()
    })

    self.nano.db.create.apply(this, args)
  }
}

helpers.teardown = function () {
  const self = this
  const args = Array.prototype.slice.call(arguments)

  return function (assert) {
    args.push(function (err) {
      assert.equal(err, null, 'destroy database')
      assert.ok(self.mock.isDone(), 'mocks didn\'t run')
      assert.end()
    })

    self.nano.db.destroy.apply(this, args)
  }
}

helpers.harness = function (name, setup, teardown) {
  const parent = name || module.parent.filename
  const fileName = path.basename(parent).split('.')[0]
  const parentDir = path.dirname(parent)
    .split(path.sep).reverse()[0]
  const shortPath = path.join(parentDir, fileName)
  const log = debug(path.join('nano', 'tests', 'integration', shortPath))
  const dbName = shortPath.replace('/', '_')
  const nanoLog = nano({
    url: cfg.couch,
    log: log
  })

  const mock = helpers.nock(helpers.couch, shortPath, log)
  const db = nanoLog.use(dbName)
  const locals = {
    mock: mock,
    db: db,
    nano: nanoLog
  }

  return harness({
    id: shortPath,
    timeout: helpers.timeout,
    checkLeaks: !!process.env.LEAKS,
    locals: locals,
    setup: setup || helpers.setup.call(locals, dbName),
    teardown: teardown || helpers.teardown.call(locals, dbName)
  })
}

helpers.nock = function helpersNock (url, fixture, log) {
  const nock = require('nock')
  const nockDefs = require('../fixtures/' + fixture + '.json')

  nockDefs.forEach(function (n) {
    let headers = n.headers || {}
    const response = n.buffer ? n.buffer.endsWith('.png')
      ? helpers.loadFixture(n.buffer) : Buffer.from(n.buffer, 'base64')
      : n.response || ''
    const body = n.base64 ? Buffer.from(n.base64, 'base64').toString()
      : n.body || ''

    if (typeof headers === 'string' && headers.endsWith('.json')) {
      headers = require(path.join(fixture, headers))
    }

    n.method = n.method || 'get'
    n.options = {log: log}
    n.scope = url
    n.headers = headers
    n.response = response
    n.body = body

    return n
  })

  nock.define(nockDefs)

  return nock(url)
}

helpers.prepareAView = function (assert, search, db) {
  search = search || ''
  db = db || this.db

  db.insert({
    views: {
      by_name_and_city: {
        map: 'function(doc) { emit([doc.name, doc.city], doc._id); }'
      }
    },
    lists: {
      'my_list': 'function(head, req) { send(\'Hello\'); }'
    }
  }, '_design/people' + search, function (error, response) {
    assert.equal(error, null, 'should create view')
    assert.equal(response.ok, true, 'response is good')
    async.parallel([
      function (cb) {
        db.insert({
          name: 'Derek',
          city: 'San Francisco'
        }, 'p_derek', cb)
      }, function (cb) {
        db.insert({
          name: 'Randall',
          city: 'San Francisco'
        }, 'p_randall', cb)
      }, function (cb) {
        db.insert({
          name: 'Nuno',
          city: 'London'
        }, 'p_nuno', cb)
      }
    ], function (error) {
      assert.equal(error, null, 'store the peeps')
      assert.end()
    })
  })
}

helpers.viewDerek = function viewDerek (db, assert, opts, next, method) {
  method = method || 'view'
  db[method]('people', 'by_name_and_city', opts, function (error, view) {
    assert.equal(error, null, 'no errors')
    assert.equal(view.rows.length, 1)
    assert.equal(view.rows.length, 1)
    assert.equal(view.rows[0].id, 'p_derek')
    assert.equal(view.rows[0].key[0], 'Derek')
    assert.equal(view.rows[0].key[1], 'San Francisco')
    next(error)
  })
}

helpers.insertOne = function (assert) {
  const db = this.db
  db.insert({'foo': 'baz'}, 'foobaz', function (err) {
    assert.equal(err, null, 'should store docs')
    assert.end()
  })
}

helpers.insertThree = function (assert) {
  const db = this.db
  async.parallel([
    function (cb) { db.insert({'foo': 'bar'}, 'foobar', cb) },
    function (cb) { db.insert({'bar': 'foo'}, 'barfoo', cb) },
    function (cb) { db.insert({'foo': 'baz'}, 'foobaz', cb) }
  ], function (error) {
    assert.equal(error, null, 'should store docs')
    assert.end()
  })
}

helpers.unmocked = (process.env.NOCK_OFF === 'true')
helpers.mocked = !helpers.unmocked

helpers.isPromise = function (p) {
  return (p && typeof p === 'object' && typeof p.then === 'function')
}

module.exports = helpers
