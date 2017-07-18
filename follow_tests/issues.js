// Copyright © 2017 IBM Corp. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

var tap = require('tap')
  , test = tap.test
  , util = require('util')
  , request = require('request')

var lib = require('../lib/follow/lib')
  , couch = require('./couch')
  , follow = require('../lib/follow/api.js')

couch.setup(test)

test('Issue #5', function(t) {
  var saw = { loops:0, seqs:{} }

  var saw_change = false
  // -2 means I want to see the last change.
  var feed = follow({'db':couch.DB, since:-2}, function(er, change) {
    t.equal(change.seq, 3, 'Got the latest change, 3')
    t.false(saw_change, 'Only one callback run for since=-2 (assuming no subsequent change')
    saw_change = true

    process.nextTick(function() { feed.stop() })
    feed.on('stop', function() {
      // Test using since=-1 (AKA since="now").
      follow({'db':couch.DB, since:'now'}, function(er, change) {
        t.equal(change.seq, 4, 'Only get changes made after starting the feed')
        t.equal(change.id, "You're in now, now", 'Got the subsequent change')

        this.stop()
        t.end()
      })

      // Let that follower settle in, then send it something
      setTimeout(function() {
        var doc = { _id:"You're in now, now", movie:"Spaceballs" }
        request.post({uri:couch.DB, json:doc}, function(er) {
          if(er) throw er
        })
      }, couch.rtt())
    })
  })
})

couch.setup(test) // Back to the expected documents

test('Issue #6', function(t) {
  // When we see change 1, delete the database. The rest should still come in, then the error indicating deletion.
  var saw = { seqs:{}, redid:false, redo_err:null }

  follow(couch.DB, function(er, change) {
    if(!er) {
      saw.seqs[change.seq] = true
      t.notOk(change.last_seq, 'Change '+change.seq+' ha no .last_seq')
      if(change.seq == 1) {
        couch.delete_db(t, function(er) {
          saw.redid = true
          saw.redo_err = er
        })
      }
    }

    else setTimeout(function() {
      // Give the redo time to finish, then confirm that everything happened as expected.
      // Hopefully this error indicates the database was deleted.
      t.ok(er.message.match(/deleted .* 3$/), 'Got delete error after change 3')
      t.ok(er.deleted, 'Error object indicates database deletion')
      t.equal(er.last_seq, 3, 'Error object indicates the last change number')

      t.ok(saw.seqs[1], 'Change 1 was processed')
      t.ok(saw.seqs[2], 'Change 2 was processed')
      t.ok(saw.seqs[3], 'Change 3 was processed')
      t.ok(saw.redid, 'The redo function ran')
      t.false(saw.redo_err, 'No problem redoing the database')

      return t.end()
    }, couch.rtt() * 2)
  })
})
