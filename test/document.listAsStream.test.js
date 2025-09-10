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

import test from 'node:test'
import assert from 'node:assert/strict'
import { COUCH_URL, mockAgent, mockPool, JSON_HEADERS } from './mock.js'
import Nano from '../lib/nano.js'
const nano = Nano(COUCH_URL)

test('should get a streamed list of documents - GET /db/_all_docs - db.listAsStream', async () => {
  // mocks
  const response = {
    total_rows: 23516,
    offset: 0,
    rows: [
      {
        id: '1000501',
        key: '1000501',
        value: {
          rev: '2-46dcf6bf2f8d428504f5290e591aa182'
        }
      },
      {
        id: '1000543',
        key: '1000543',
        value: {
          rev: '1-3256046064953e2f0fdb376211fe78ab'
        }
      },
      {
        id: '100077',
        key: '100077',
        value: {
          rev: '1-101bff1251d4bd75beb6d3c232d05a5c'
        }
      }
    ]
  }
  mockPool
    .intercept({ path: '/db/_all_docs' })
    .reply(200, response, JSON_HEADERS)

  await new Promise((resolve, reject) => {
    // test GET /db/_all_docs
    const db = nano.db.use('db')
    const s = db.listAsStream()
    assert.equal(typeof s, 'object')
    let buffer = ''
    s.on('data', (chunk) => {
      buffer += chunk.toString()
    })
    s.on('end', () => {
      assert.equal(buffer, JSON.stringify(response))
      mockAgent.assertNoPendingInterceptors()
      resolve()
    })
  })
})

test('should get a streamed list of documents with opts- GET /db/_all_docs - db.listAsStream', async () => {
  // mocks
  const response = {
    total_rows: 23516,
    offset: 0,
    rows: [
      {
        id: '1000501',
        key: '1000501',
        value: {
          rev: '2-46dcf6bf2f8d428504f5290e591aa182'
        },
        doc: {
          _id: '1000501',
          _rev: '2-46dcf6bf2f8d428504f5290e591aa182',
          a: 1,
          b: 2
        }
      }
    ]
  }
  mockPool
    .intercept({ path: '/db/_all_docs?limit=1&include_docs=true' })
    .reply(200, response, JSON_HEADERS)

  await new Promise((resolve, reject) => {
    // test GET /db/_all_docs
    const db = nano.db.use('db')
    const s = db.listAsStream({ limit: 1, include_docs: true })
    assert.equal(typeof s, 'object')
    let buffer = ''
    s.on('data', (chunk) => {
      buffer += chunk.toString()
    })
    s.on('end', () => {
      assert.equal(buffer, JSON.stringify(response))
      mockAgent.assertNoPendingInterceptors()
      resolve()
    })
  })
})
