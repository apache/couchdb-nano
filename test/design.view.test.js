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

test('should be able to access a MapReduce view - GET /db/_design/ddoc/_view/viewname - db.view', async () => {
  // mocks
  const response = {
    rows: [
      { key: null, value: 23515 }
    ]
  }
  mockPool
    .intercept({ path: '/db/_design/ddoc/_view/viewname' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/_design/ddoc/_view/viewname
  const db = nano.db.use('db')
  const p = await db.view('ddoc', 'viewname')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to access a MapReduce view with opts - GET /db/_design/ddoc/_view/viewname - db.view', async () => {
  // mocks
  const response = {
    rows: [
      { key: 'BA', value: 21 },
      { key: 'BB', value: 1 },
      { key: 'BD', value: 98 },
      { key: 'BE', value: 184 },
      { key: 'BF', value: 32 },
      { key: 'BG', value: 55 },
      { key: 'BH', value: 8 },
      { key: 'BI', value: 10 },
      { key: 'BJ', value: 29 },
      { key: 'BL', value: 1 },
      { key: 'BM', value: 1 },
      { key: 'BN', value: 4 },
      { key: 'BO', value: 27 },
      { key: 'BQ', value: 1 }
    ]
  }
  mockPool
    .intercept({ path: '/db/_design/ddoc/_view/viewname?group=true&startkey="BA"&endkey="BQ"' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/_design/ddoc/_view/viewname
  const db = nano.db.use('db')
  const p = await db.view('ddoc', 'viewname', { group: true, startkey: 'BA', endkey: 'BQ' })
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to access a MapReduce view with keys - POST /db/_design/ddoc/_view/viewname - db.view', async () => {
  // mocks
  const keys = ['BA', 'BD']
  const response = {
    rows: [
      { key: 'BA', value: 21 },
      { key: 'BB', value: 1 }
    ]
  }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_design/ddoc/_view/viewname',
      body: JSON.stringify({ keys })
    })
    .reply(200, response, JSON_HEADERS)

  // test POST /db/_design/ddoc/_view/viewname
  const db = nano.db.use('db')
  const p = await db.view('ddoc', 'viewname', { keys })
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to access a MapReduce view with queries - POST /db/_design/ddoc/_view/viewname - db.view', async () => {
  // mocks
  const opts = {
    queries: [
      {
        keys: [
          'BA',
          'BD'
        ]
      },
      {
        limit: 1,
        skip: 2,
        reduce: false
      }
    ]
  }
  const response = {
    results: [
      {
        rows: [
          { key: 'BA', value: 21 },
          { key: 'BB', value: 1 }
        ]
      },
      {
        total_rows: 23515,
        offset: 2,
        rows: [
          { id: '290594', key: 'AE', value: 1 }
        ]
      }
    ]
  }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_design/ddoc/_view/viewname',
      body: JSON.stringify({ queries: opts.queries })
    })
    .reply(200, response, JSON_HEADERS)

  // test POST /db/_design/ddoc/_view/viewname
  const db = nano.db.use('db')
  const p = await db.view('ddoc', 'viewname', opts)
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to handle 404 - db.view', async () => {
  // mocks
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  mockPool
    .intercept({
      path: '/db/_design/ddoc/_view/viewname?group=true&startkey="BA"&endkey="BQ"'
    })
    .reply(404, response, JSON_HEADERS)

  // test GET /db/_design/ddoc/_view/viewname
  const db = nano.db.use('db')
  await assert.rejects(db.view('ddoc', 'viewname', { group: true, startkey: 'BA', endkey: 'BQ' }), { message: 'missing' })
  mockAgent.assertNoPendingInterceptors()
})

test('should detect missing parameters - db.view', async () => {
  const db = nano.db.use('db')
  await assert.rejects(db.view(), { message: 'Invalid parameters' })
  await assert.rejects(db.view('susan'), { message: 'Invalid parameters' })
  await assert.rejects(db.view('susan', ''), { message: 'Invalid parameters' })
  await assert.rejects(db.view('', 'susan'), { message: 'Invalid parameters' })
})

