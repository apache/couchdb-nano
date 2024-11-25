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

const test = require('node:test')
const assert = require('node:assert/strict')
const { COUCH_URL, mockAgent, mockPool, JSON_HEADERS } = require('./mock.js')
const Nano = require('..')
const nano = Nano({ url: COUCH_URL })

test('should be able to fetch a list of documents - POST /db/_all_docs - db.fetch', async () => {
  // mocks
  const keys = ['1000501', '1000543', '100077']
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
      },
      {
        id: '1000543',
        key: '1000543',
        value: {
          rev: '1-3256046064953e2f0fdb376211fe78ab'
        },
        doc: {
          _id: '1000543',
          _rev: '2-3256046064953e2f0fdb376211fe78ab',
          a: 3,
          b: 4
        }
      },
      {
        id: '100077',
        key: '100077',
        value: {
          rev: '1-101bff1251d4bd75beb6d3c232d05a5c'
        },
        doc: {
          _id: '100077',
          _rev: '2-101bff1251d4bd75beb6d3c232d05a5c',
          a: 5,
          b: 6
        }
      }
    ]
  }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_all_docs?include_docs=true',
      body: JSON.stringify({ keys })
    })
    .reply(200, response, JSON_HEADERS)

  // test POST /db/_all_docs
  const db = nano.db.use('db')
  const p = await db.fetch({ keys })
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to fetch a list of documents with opts - POST /db/_all_docs - db.fetch', async () => {
  // mocks
  const keys = ['1000501', '1000543', '100077']
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
      },
      {
        id: '1000543',
        key: '1000543',
        value: {
          rev: '1-3256046064953e2f0fdb376211fe78ab'
        },
        doc: {
          _id: '1000543',
          _rev: '2-3256046064953e2f0fdb376211fe78ab',
          a: 3,
          b: 4
        }
      },
      {
        id: '100077',
        key: '100077',
        value: {
          rev: '1-101bff1251d4bd75beb6d3c232d05a5c'
        },
        doc: {
          _id: '100077',
          _rev: '2-101bff1251d4bd75beb6d3c232d05a5c',
          a: 5,
          b: 6
        }
      }
    ]
  }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_all_docs?include_docs=true&descending=true',
      body: JSON.stringify({ keys })
    })
    .reply(200, response, JSON_HEADERS)

  // test POST /db/_all_docs
  const db = nano.db.use('db')
  const p = await db.fetch({ keys }, { descending: true })
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be able to handle 404 - POST /db/_all_docs - db.fetch', async () => {
  // mocks
  const keys = ['1000501', '1000543', '100077']
  const response = {
    error: 'not_found',
    reason: 'missing'
  }
  mockPool
    .intercept({
      method: 'post',
      path: '/db/_all_docs?include_docs=true',
      body: JSON.stringify({ keys })
    })
    .reply(404, response, JSON_HEADERS)

  // test POST /db/_all_docs
  const db = nano.db.use('db')
  await assert.rejects(db.fetch({ keys }), { message: 'missing' })
  mockAgent.assertNoPendingInterceptors()
})

test('should detect invalid parameters - db.fetch', async () => {
  const db = nano.db.use('db')
  await assert.rejects(db.fetch(), { message: 'Invalid parameters' })
  await assert.rejects(db.fetch({}), { message: 'Invalid parameters' })
  await assert.rejects(db.fetch({ keys: {} }), { message: 'Invalid parameters' })
  await assert.rejects(db.fetch({ keys: '123' }), { message: 'Invalid parameters' })
  await assert.rejects(db.fetch({ keys: [] }), { message: 'Invalid parameters' })
})

