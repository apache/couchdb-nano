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

const Nano = require('..')
const COUCH_URL = 'http://admin:admin@localhost:5984'
const nano = Nano(COUCH_URL)
const dbName = 'notnocked' + new Date().getTime()
let db
const emit = (k, v) => {
  console.log(k, v)
}

test('should be able to create a database string', () => {
  expect(typeof dbName).toBe('string')
})

// this section only runs if the TRAVIS environment variable is set.
// It is set when running tests in TravisCI, where a CouchDB/Docker container
// should be running. These non-mocked tests are not exhaustive, but serve
// to demonstrate that the library does actually work with real CouchDB.
if (process.env.TRAVIS) {
  test('should be able to create a database - nano.db.create', async () => {
    await nano.db.create(dbName)
    db = nano.db.use(dbName, { n: 1 })
  })

  test('should be able to populate a database - nano.db.bulk', async () => {
    const docs = [
      { _id: 'crookshanks', name: 'Crookshanks', description: 'Hermione Granger\'s pet cat', year: 2004 },
      { _id: 'felix', name: 'Felix', description: 'Cat from the silent film era', year: 1929 },
      { _id: 'garfield', name: 'Garfield', description: 'Large orange cartoon cat', year: 1978 },
      { _id: 'cheshirecat', name: 'Cheshire Cat', description: 'From Alice in Wonderland', year: 1865 },
      { _id: 'snowbell', name: 'Snowbell', description: 'From Stuart Little', year: 1945 },
      { _id: 'catinthehat', name: 'The Cat in the Hat', description: 'Tall cat with red and white striped hat and bow tie', year: 1957 },
      { _id: 'dummy', name: 'to be deleted' }
    ]
    await db.bulk({ docs })
  })

  test('should be able to get database info - nano.db.bulk', async () => {
    const info = await db.info(dbName)
    expect(info.doc_count).toBe(7)
  })

  test('should be able to delete a document', async () => {
    const doc = await db.get('dummy')
    await db.destroy('dummy', doc._rev)
    const info = await db.info(dbName)
    expect(info.doc_count).toBe(6)
    expect(info.doc_del_count).toBe(1)
  })

  test('should be able to update a document', async () => {
    const doc = await db.get('catinthehat')
    doc.newfield = true
    await db.insert(doc)
    const info = await db.info(dbName)
    expect(info.doc_count).toBe(6)
  })

  test('should be able to list documents in a database', async () => {
    const data = await db.list({ limit: 1, descending: true })
    expect(data.rows.length).toBe(1)
    expect(data.rows[0].id).toBe('snowbell')
  })

  test('should be able to create a view', async () => {
    const f = function (doc) {
      emit(doc.year, doc.name)
    }
    const doc = {
      views: {
        byYear: {
          map: f.toString(),
          reduce: '_count'
        }
      }
    }
    await db.insert(doc, '_design/views')
  })

  test('should be able to query a view', async () => {
    const data = await db.view('views', 'byYear', { reduce: false })
    const response = {
      total_rows: 6,
      offset: 0,
      rows: [
        { id: 'cheshirecat', key: 1865, value: 'Cheshire Cat' },
        { id: 'felix', key: 1929, value: 'Felix' },
        { id: 'snowbell', key: 1945, value: 'Snowbell' },
        { id: 'catinthehat', key: 1957, value: 'The Cat in the Hat' },
        { id: 'garfield', key: 1978, value: 'Garfield' },
        { id: 'crookshanks', key: 2004, value: 'Crookshanks' }
      ]
    }
    expect(response).toStrictEqual(data)
  })

  test('should be able to destroy a database - nano.db.destroy', async () => {
    await nano.db.destroy(dbName)
  })
}
