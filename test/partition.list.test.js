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
const nano = Nano(COUCH_URL)
const db = nano.db.use('db')

const response = {
  total_rows: 1215,
  offset: 0,
  rows: [
    {
      id: 'partition:00003it00tDmkP2Hdlkz1sMOyA12WmDj',
      key: 'partition:00003it00tDmkP2Hdlkz1sMOyA12WmDj',
      value: {
        rev: '1-7feb3dec79cbff2506762ac7c8550c45'
      }
    },
    {
      id: 'partition:0000tvHi1qDnsy2Plek31OG9pw0cG8VG',
      key: 'partition:0000tvHi1qDnsy2Plek31OG9pw0cG8VG',
      value: {
        rev: '1-d0c62e02a18c5b714ed94277c3852cf4'
      }
    },
    {
      id: 'partition:0000vEYK2zb89n1QMdnr1MQ5Ax0wMaUa',
      key: 'partition:0000vEYK2zb89n1QMdnr1MQ5Ax0wMaUa',
      value: {
        rev: '1-42a99d13a33e46b1f37f4f937d167458'
      }
    },
    {
      id: 'partition:0003RAaK16cHJ03fOZYJ3zti9g22ppGr',
      key: 'partition:0003RAaK16cHJ03fOZYJ3zti9g22ppGr',
      value: {
        rev: '1-11929970736f90c3955fda281847bf58'
      }
    },
    {
      id: 'partition:0008Cu6D1LcJm142gadC13KRDD1LNkYw',
      key: 'partition:0008Cu6D1LcJm142gadC13KRDD1LNkYw',
      value: {
        rev: '1-325d1f25f719304b89c64862d2c27832'
      }
    }
  ]
}

test('should be list documents form a partition - GET /db/_partition/_all_docs - db.partitionedList', async () => {
  // mocks
  mockPool
    .intercept({ path: '/db/_partition/partition/_all_docs' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/_partition/_all_docs
  const p = await db.partitionedList('partition')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should be list documents form a partition with opts - GET /db/_partition/_all_docs - db.partitionedList', async () => {
  // mocks
  const optsResponse = {
    total_rows: 1215,
    offset: 0,
    rows: [
      {
        id: 'partition:00003it00tDmkP2Hdlkz1sMOyA12WmDj',
        key: 'partition:00003it00tDmkP2Hdlkz1sMOyA12WmDj',
        value: {
          rev: '1-7feb3dec79cbff2506762ac7c8550c45'
        },
        doc: {
          _id: 'partition:00003it00tDmkP2Hdlkz1sMOyA12WmDj',
          _rev: '1-7feb3dec79cbff2506762ac7c8550c45',
          a: 1,
          b: 2
        }
      }
    ]
  }
  mockPool
    .intercept({ path: '/db/_partition/partition/_all_docs?limit=1&include_docs=true' })
    .reply(200, optsResponse, JSON_HEADERS)

  // test GET /db/_partition/_all_docs
  const p = await db.partitionedList('partition', { limit: 1, include_docs: true })
  assert.deepEqual(p, optsResponse)
  mockAgent.assertNoPendingInterceptors()
})

test('should escape unusual characters - GET /db/_partition/a+b/_all_docs - db.partitionedList', async () => {
  // mocks
  mockPool
    .intercept({ path: '/db/_partition/a%2Bb/_all_docs' })
    .reply(200, response, JSON_HEADERS)

  // test GET /db/_partition/_all_docs
  const p = await db.partitionedList('a+b')
  assert.deepEqual(p, response)
  mockAgent.assertNoPendingInterceptors()
})

test('should handle missing database - GET /db/_partition/_all_docs - db.partitionedList', async () => {
  // mocks
  const errResponse = {
    error: 'not_found',
    reason: 'Database does not exist.'
  }
  mockPool
    .intercept({ path: '/db/_partition/partition/_all_docs' })
    .reply(404, errResponse, JSON_HEADERS)

  // test GET /db/_partition/_all_docs
  await assert.rejects(db.partitionedList('partition'), { message: errResponse.reason })
  mockAgent.assertNoPendingInterceptors()
})

test('should not attempt info fetch with missing parameters - db.partitionedList', async () => {
  await assert.rejects(db.partitionedList(), { message: 'Invalid parameters' })
  await assert.rejects(db.partitionedList(''), { message: 'Invalid parameters' })
})

