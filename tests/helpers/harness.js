'use strict'

var test = require('tape')

var nextTick = typeof setImmediate !== 'undefined'
  ? setImmediate : process.nextTick

function noop () {}

module.exports = function (opts) {
  var invoked = false
  var id = opts.id
  var testPrefix = id || ''

  var harness = {}

  harness.tests = []
  harness.checkLeaks = typeof opts.checkLeaks === 'boolean'
    ? opts.checkLeaks : true
  harness.globalCount = Object.keys(global).length

  harness.timeout = +(opts.timeout || 200)
  harness.locals = opts.locals || {}

  //
  // locals must be available here
  //
  harness.setup = opts.setup || noop
  harness.teardown = opts.teardown || noop

  function runTest (name, next, onEnd) {
    test(testPrefix + '\n## ' + name, function (assert) {
      nextTick(function () { next.call(harness.locals, assert) })

      var tmout = setTimeout(function () {
        assert.fail('timed out')
        assert.end()
      }, harness.timeout)

      assert.on('end', function () {
        if (onEnd) {
          onEnd(assert)
        }
        clearTimeout(tmout)
      })
    })
  }

  harness.it = function (name, next) {
    harness.tests.push({name: name, next: next})
    if (!invoked) {
      invoked = true
      nextTick(function () {
        runTest('setup', harness.setup)
        harness.tests.forEach(function (elem) {
          runTest(elem.name, elem.next)
        })
        runTest('teardown', harness.teardown, function (assert) {
          if (harness.checkLeaks) {
            assert.deepEqual(Object.keys(global)
              .splice(harness.globalCount, Number.MAX_VALUE),
            [], 'No leaks')
          }
        })
      })
    }
  }

  return harness
}
