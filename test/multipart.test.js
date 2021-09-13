const MultiPartFactory = require('../lib/multipart.js')
const textAttachment = { name: 'test.txt', data: 'Hello\r\nWorld!', content_type: 'text/plain' }
const anotherTextAttachment = { name: 'test2.txt', data: 'the quick brown fox', content_type: 'text/plain' }

test('should return different boundary each time', async () => {
  const mf1 = new MultiPartFactory([])
  const mf2 = new MultiPartFactory([])
  const mf3 = new MultiPartFactory([])

  expect(typeof mf1.boundary).toBe('string')
  expect(typeof mf2.boundary).toBe('string')
  expect(typeof mf3.boundary).toBe('string')
  expect(mf1.boundary.length).toBe(16)
  expect(mf2.boundary.length).toBe(16)
  expect(mf3.boundary.length).toBe(16)
  expect(mf1).not.toEqual(mf2)
  expect(mf1).not.toEqual(mf3)
  expect(mf2).not.toEqual(mf3)
})

test('should return boundary in header', async () => {
  const mf1 = new MultiPartFactory([])
  const boundary = mf1.boundary
  const header = mf1.header
  expect(header).toEqual(`multipart/related; boundary=${boundary}`)
})

test('should handle single attachments', async () => {
  const mf1 = new MultiPartFactory([textAttachment])
  expect(typeof mf1.data).toEqual('object')
  expect(Buffer.isBuffer(mf1.data)).toEqual(true)
  const lines = mf1.data.toString().split('\r\n')
  expect(lines).toContain(`--${mf1.boundary}`)
  expect(lines).toContain('content-type: text/plain')
  expect(lines).toContain('content-length: 13')
  expect(lines).toContain('')
  expect(lines).toContain('Hello')
  expect(lines).toContain('World!')
  expect(lines).toContain(`--${mf1.boundary}--`)
})

test('should handle two attachments', async () => {
  const mf1 = new MultiPartFactory([textAttachment, anotherTextAttachment])
  expect(typeof mf1.data).toEqual('object')
  expect(Buffer.isBuffer(mf1.data)).toEqual(true)
  const lines = mf1.data.toString().split('\r\n')
  expect(lines).toContain(`--${mf1.boundary}`)
  expect(lines).toContain('content-type: text/plain')
  expect(lines).toContain('content-length: 13')
  expect(lines).toContain('')
  expect(lines).toContain('Hello')
  expect(lines).toContain('World!')
  expect(lines).toContain('content-length: 19')
  expect(lines).toContain('the quick brown fox')
  expect(lines).toContain(`--${mf1.boundary}--`)
})
