import test from 'node:test'
import assert from 'node:assert/strict'
import  MultiPartFactory from '../lib/multipart.js'
const textAttachment = { name: 'test.txt', data: 'Hello\r\nWorld!', content_type: 'text/plain' }
const anotherTextAttachment = { name: 'test2.txt', data: 'the quick brown fox', content_type: 'text/plain' }

test('should return different boundary each time', async () => {
  const mf1 = new MultiPartFactory([])
  const mf2 = new MultiPartFactory([])
  const mf3 = new MultiPartFactory([])

  assert.equal(typeof mf1.boundary, 'string')
  assert.equal(typeof mf2.boundary, 'string')
  assert.equal(typeof mf3.boundary, 'string')
  assert.equal(mf1.boundary.length, 16)
  assert.equal(mf2.boundary.length, 16)
  assert.equal(mf3.boundary.length, 16)
  assert.notEqual(mf1, mf2)
  assert.notEqual(mf1, mf3)
  assert.notEqual(mf2, mf3)
})

test('should return boundary in header', async () => {
  const mf1 = new MultiPartFactory([])
  const boundary = mf1.boundary
  const header = mf1.header
  assert.equal(header, `multipart/related; boundary=${boundary}`)
})

test('should handle single attachments', async () => {
  const mf1 = new MultiPartFactory([textAttachment])

  assert.equal(typeof mf1.data, 'object')
  assert.equal(Buffer.isBuffer(mf1.data), true)
  const lines = mf1.data.toString().split('\r\n')
  assert.equal(lines.includes(`--${mf1.boundary}`), true)
  assert.equal(lines.includes('content-type: text/plain'), true)
  assert.equal(lines.includes('content-length: 13'), true)
  assert.equal(lines.includes(''), true)
  assert.equal(lines.includes('Hello'), true)
  assert.equal(lines.includes('World!'), true)
  assert.equal(lines.includes(`--${mf1.boundary}--`), true)
})

test('should handle two attachments', async () => {
  const mf1 = new MultiPartFactory([textAttachment, anotherTextAttachment])
  assert.equal(typeof mf1.data, 'object')
  assert.equal(Buffer.isBuffer(mf1.data), true)
  const lines = mf1.data.toString().split('\r\n')
  assert.equal(lines.includes(`--${mf1.boundary}`), true)
  assert.equal(lines.includes('content-type: text/plain'), true)
  assert.equal(lines.includes('content-length: 13'), true)
  assert.equal(lines.includes(''), true)
  assert.equal(lines.includes('Hello'), true)
  assert.equal(lines.includes('World!'), true)
  assert.equal(lines.includes('content-length: 19'), true)
  assert.equal(lines.includes('the quick brown fox'), true)
  assert.equal(lines.includes(`--${mf1.boundary}`), true)
})
