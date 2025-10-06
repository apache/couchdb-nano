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

import fs from 'node:fs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { COUCH_URL, mockAgent, mockPool, JSON_HEADERS } from './mock.js'
import Nano from '../lib/nano.js'

const nano = Nano(COUCH_URL)
const image = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

test('should be able to insert document attachment - PUT /db/docname/attachment - db.attachment.insert', async () => {
  // mocks
  const response = { ok: true, id: 'docname', rev: '2-456' }
  mockPool.intercept({
    method: 'put',
    path: '/db/docname/transparent.gif?rev=1-150',
    body: (value) => {
      const buff = Buffer.from(value)
      return buff.equals(image)
    },
    headers: {
      'content-type': 'image/gif'
    }
  }).reply(200, response, JSON_HEADERS)

  // test PUT /db/docname/attachment
  const db = nano.db.use('db')
  const p = await db.attachment.insert('docname', 'transparent.gif', image, 'image/gif', { rev: '1-150' })
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to handle 404 - db.attachment.insert', async () => {
  // mocks
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  mockPool.intercept({
    method: 'put',
    path: '/db/docname/transparent.gif?rev=1-150',
    body: (value) => {
      const buff = Buffer.from(value)
      return buff.equals(image)
    },
    headers: {
      'content-type': 'image/gif'
    }
  }).reply(404, response, JSON_HEADERS)

  // test PUT /db/docname/attachment
  const db = nano.db.use('db')
  await assert.rejects(db.attachment.insert('docname', 'transparent.gif', image, 'image/gif', { rev: '1-150' }), { message: 'missing' })
  mockAgent.assertNoPendingInterceptors()
})

test('should detect missing parameters - db.attachment.insert', async () => {
  const db = nano.db.use('db')
  await assert.rejects(db.attachment.insert(), { message: 'Invalid parameters' })
  await assert.rejects(db.attachment.insert('docname'), { message: 'Invalid parameters' })
  await assert.rejects(db.attachment.insert('docname', 't.gif'), { message: 'Invalid parameters' })
  await assert.rejects(db.attachment.insert('docname', 't.gif', image), { message: 'Invalid parameters' })
})

test('should be able to insert document attachment as stream - PUT /db/docname/attachment - db.attachment.insert', async () => {
  // mocks
  const response = { ok: true, id: 'docname', rev: '2-456' }
  mockPool.intercept({
    method: 'put',
    path: '/db/docname/logo.jpg?rev=1-150',
    body: (value) => {
      return true
    },
    headers: {
      'content-type': 'image/jpg'
    }
  }).reply(200, response, JSON_HEADERS)

  // test PUT /db/docname/attachment
  const rs = fs.createReadStream('./test/logo.jpg')
  const db = nano.db.use('db')
  const reply = await db.attachment.insert('docname', 'logo.jpg', rs, 'image/jpg', { rev: '1-150' })
  assert.deepEqual(reply, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to insert document attachment as stream with circular reference - PUT /db/docname/attachment - db.attachment.insert', async () => {
  // mocks
  const response = { ok: true, id: 'docname', rev: '2-456' }
  mockPool.intercept({
    method: 'put',
    path: '/db/docname/logo2.jpg?rev=1-150',
    body: (value) => {
      return true
    },
    headers: {
      'content-type': 'image/jpg'
    }
  }).reply(200, response, JSON_HEADERS)

  // test PUT /db/docname/attachment
  const rs = fs.createReadStream('./test/logo.jpg')
  // create artificial circular reference to make sure nano doesn't trip over on it
  rs.test = rs
  const db = nano.db.use('db')
  const reply = await db.attachment.insert('docname', 'logo2.jpg', rs, 'image/jpg', { rev: '1-150' })
  assert.deepEqual(reply, response)
  mockAgent.assertNoPendingInterceptors()
})
