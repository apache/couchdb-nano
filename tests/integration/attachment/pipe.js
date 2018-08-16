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

const fs = require('fs')
const path = require('path')
const helpers = require('../../helpers/integration')
const harness = helpers.harness(__filename)
const db = harness.locals.db
const it = harness.it
const pixel = helpers.pixel

it('should be able to pipe to a writeStream', function (assert) {
  const buffer = Buffer.from(pixel, 'base64')
  const filename = path.join(__dirname, '.temp.bmp')

  db.attachment.insert('new', 'att', buffer, 'image/bmp')
    .then(function (bmp) {
      const ws = fs.createWriteStream(filename)

      ws.on('close', function () {
        assert.equal(fs.readFileSync(filename).toString('base64'), pixel)
        fs.unlinkSync(filename)
        assert.end()
      })
      db.attachment.getAsStream('new', 'att', {rev: bmp.rev}).pipe(ws)
    })
})

it('should be able to pipe to a writeStream', function (assert) {
  const ws = fs.createWriteStream('/dev/null')
  const rs = db.attachment.getAsStream('new', 'att', function () {})
  rs.pipe(ws)
  rs.on('end', function () {
    assert.end()
  })
})

it('should be able to pipe from a readStream', function (assert) {
  const logo = path.join(__dirname, '..', '..', 'fixtures', 'logo.png')
  const rs = fs.createReadStream(logo)
  const is = db.attachment.insertAsStream('nodejs', 'logo.png', null, 'image/png', function () {
  })

  is.on('end', function () {
    db.attachment.get('nodejs', 'logo.png', function (err, buffer) {
      assert.equal(err, null, 'should get the logo')
      assert.equal(
        fs.readFileSync(logo).toString('base64'), buffer.toString('base64'),
        'logo should remain unchanged')
      assert.end()
    })
  })

  rs.pipe(is)
})
