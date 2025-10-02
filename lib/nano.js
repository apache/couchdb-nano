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

import assert from 'node:assert'
import { Readable } from 'node:stream'
import ChangesReader from './changesreader.js'
import CookieJar from './cookie.js'
import MultiPartFactory from './multipart.js'
import pkg from '../package.json' with { type: 'json' }

const PARAMS_TO_ENCODE = ['startkey', 'endkey', 'key', 'keys', 'start_key', 'end_key']
const MIME_JSON = 'application/json'
const CONTENT_TYPE = 'content-type'
const SET_COOKIE = 'set-cookie'
const SCRUBBED_STR = 'XXXXXX'

// feed this any number of arguments, it will return true if
// any of them are missing (falsey)
function missing(...params) {
  return params.some(param => !param)
}

// the stock error returned when a call has missing or invalid parameters
const invalidParametersError = new Error('Invalid parameters')

export default function Nano(cfg) {
  let serverScope = {}

  if (typeof cfg === 'string') {
    cfg = { url: cfg }
  }

  assert.strictEqual(typeof cfg, 'object',
    'You must specify the endpoint url when invoking this module')
  assert.ok(/^https?:/.test(cfg.url), 'url is not valid')

  cfg = Object.assign({}, cfg)
  serverScope.config = cfg
  const log = typeof cfg.log === 'function' ? cfg.log : () => { }
  const parseUrl = 'parseUrl' in cfg ? cfg.parseUrl : true

  // pre-parse the URL to extract URL without auth details
  cfg.parsedURL = new URL(cfg.url)
  cfg.plainURL = `${cfg.parsedURL.origin}${cfg.parsedURL.pathname}`
  cfg.headers = Object.assign({
    'content-type': 'application/json',
    'user-agent': `${pkg.name}/${pkg.version} (Node.js ${process.version})`,
    'accept-encoding': 'deflate, gzip'
  }, cfg.headers || {})
  if (cfg.parsedURL.username && cfg.parsedURL.password) {
    cfg.headers.Authorization = 'Basic ' + Buffer.from(`${cfg.parsedURL.username}:${cfg.parsedURL.password}`).toString('base64')
  }

  // look for agentOptions
  if (cfg.agentOptions) {
    // if we've been passed a undici.Agent or undici.MockAgent,
    // basically anything inherited from undici.Dispatcher, we
    // can use it
    cfg.agent = cfg.agentOptions
  }

  // warn using still using requestDefaults
  if (cfg.requestDefaults) {
    console.error('WARNING: requestDefaults is no longer supported. See agentOptions.')
  }

  // create cookieJar for this Nano
  cfg.cookieJar = new CookieJar()

  function maybeExtractDatabaseComponent() {
    if (!parseUrl) {
      return
    }

    const path = new URL(cfg.url)
    const pathArray = path.pathname.split('/').filter(function (e) { return e })
    const db = pathArray.pop()
    const rootPath = path.pathname.replace(/\/?$/, '/..')

    if (db) {
      cfg.url = urlResolveFix(cfg.url, rootPath).replace(/\/?$/, '')
      return db
    }
  }

  function scrubURL(str) {
    if (str) {
      str = str.replace(/\/\/(.*)@/, `//${SCRUBBED_STR}:${SCRUBBED_STR}@`)
    }
    return str
  }

  function scrubRequest(req, cloned) {
    // scrub credentials
    req.url = scrubURL(req.url)
    if (req.headers.cookie) {
      req.headers.cookie = 'XXXXXXX'
    }
    if (req.headers.Authorization) {
      req.headers.Authorization = 'XXXXXXX'
    }
  }


  async function relax(relaxOpts) {
    if (typeof relaxOpts === 'string') {
      relaxOpts = { path: relaxOpts }
    }

    // create new set of opts based on our defaults, overridden by those passed in
    const opts = { ...cfg, ...(relaxOpts || {}) }

    // form a new URL from path from our proxy, appended to the origin
    if (opts.doc && !/^_design|_local/.test(opts.doc)) opts.doc = encodeURIComponent(opts.doc)
    opts.path = [opts.db, opts.path || opts.doc, opts.att]
      .filter(Boolean)
      .join('/') || '/'
    const url = new URL(opts.path, cfg.plainURL)

    // if there's a query string object
    if (typeof opts.qs === 'object') {
      for (const [key, value] of Object.entries(opts.qs)) {
        // add each k/v to the URL's seachParams, taking care to JSON.stringify certain items
        url.searchParams.set(key, PARAMS_TO_ENCODE.includes(key) ? JSON.stringify(value) : value)
      }
    }

    // if we've been given a JavaScript object, it needs stringifying
    opts.body = typeof opts.body === 'object' && opts.headers[CONTENT_TYPE].startsWith(MIME_JSON) ? JSON.stringify(opts.body) : opts.body

    // add any cookies for this domain
    const urlStr = url.toString()
    const cookie = cfg.cookieJar.getCookieString(urlStr)
    if (cookie) {
      opts.headers.cookie = cookie
    }

    if (opts.multipart) {
      // generate the multipart/related body, header and boundary to 
      // upload multiple binary attachments in one request
      const mp = new MultiPartFactory(opts.multipart)
      opts.headers['content-type'] = mp.header
      opts.body = mp.data
    }

    // if the body is a readable stream
    if (opts.body && opts.body instanceof Readable) {
      opts.duplex = 'half'
      opts.keepalive = false
    }

    // make the HTTP request
    const response = await fetch(urlStr, opts)

    // scrub and log
    const scrubbedReq = {
      method: opts.method,
      headers: JSON.parse(JSON.stringify(opts.headers)),
      url: urlStr
    }
    scrubRequest(scrubbedReq, true)
    log(scrubbedReq)

    // parse cookies
    const cookieHeader = response.headers.get(SET_COOKIE) || ''
    if (cookieHeader) cfg.cookieJar.parse(cookieHeader, urlStr)

    // extract the mime type from the response
    const contentType = response.headers.get(CONTENT_TYPE) || ''
    let output = ''
    if (opts.method && opts.method.toLowerCase() === 'head') {
      // for HEAD method, we actually output the headers
      output = Object.fromEntries(response.headers)
    } else if (opts.stream) {
      // for streamed output
      return Readable.fromWeb(response.body)
    } else if (contentType === MIME_JSON) {
      // json is json
      output = await response.json()
    } else if (contentType.startsWith('text/') || contentType.startsWith('multipart/related')) {
      // any text mime type is text
      output = await response.text()
    } else {
      // everything else is a Buffer
      output = Buffer.from(await response.arrayBuffer())
    }

    // either return the output
    log({ err: null, body: output, headers: response.headers })
    if (response.ok) return output

    // or throw an Error
    const e = new Error(output?.reason || output?.error || `couch returned ${response.status}`)
    e.statusCode = response.status
    log({ err: 'couch', body: output, headers: response.headers })
    throw e
  }

  // http://docs.couchdb.org/en/latest/api/server/authn.html#cookie-authentication
  function auth(username, password) {
    return relax({
      method: 'POST',
      db: '_session',
      body: {
        name: username,
        password
      }
    })
  }

  // http://docs.couchdb.org/en/latest/api/server/authn.html#post--_session
  function session() {
    return relax({ db: '_session' })
  }

  // https://docs.couchdb.org/en/latest/api/server/common.html#api-server-root
  async function info() {
    return relax({ path: '' })
  }

  // http://docs.couchdb.org/en/latest/api/server/common.html#get--_db_updates
  async function updates(qs) {
    return relax({
      db: '_db_updates',
      qs
    })
  }

  // http://docs.couchdb.org/en/latest/api/database/common.html#put--db
  async function createDb(dbName, qs) {
    if (missing(dbName)) {
      return Promise.reject(invalidParametersError)
    }
    return relax({ db: dbName, method: 'PUT', qs })
  }

  // http://docs.couchdb.org/en/latest/api/database/common.html#delete--db
  async function destroyDb(dbName) {
    if (missing(dbName)) {
      return Promise.reject(invalidParametersError)
    }
    return relax({ db: dbName, method: 'DELETE' })
  }

  // http://docs.couchdb.org/en/latest/api/database/common.html#get--db
  async function getDb(dbName) {
    if (missing(dbName)) {
      return Promise.reject(invalidParametersError)
    }
    return relax({ db: dbName })
  }

  // http://docs.couchdb.org/en/latest/api/server/common.html#get--_all_dbs
  async function listDbs() {
    return relax({ db: '_all_dbs' })
  }

  // http://docs.couchdb.org/en/latest/api/server/common.html#get--_all_dbs
  async function listDbsAsStream() {
    return relax({ db: '_all_dbs', stream: true })
  }

  // http://docs.couchdb.org/en/latest/api/database/compact.html#post--db-_compact
  async function compactDb(dbName, ddoc) {
    if (missing(dbName)) {
      return Promise.reject(invalidParametersError)
    }
    return relax({
      db: dbName,
      doc: '_compact',
      att: ddoc,
      method: 'POST'
    })
  }

  // http://docs.couchdb.org/en/latest/api/database/changes.html#get--db-_changes
  async function changesDb(dbName, qs) {
    if (missing(dbName)) {
      return Promise.reject(invalidParametersError)
    }
    return relax({ db: dbName, path: '_changes', qs })
  }

  async function changesDbAsStream(dbName, qs) {
    return relax({ db: dbName, path: '_changes', stream: true, qs })
  }

  function _serializeAsUrl(db) {
    if (typeof db === 'object' && db.config && db.config.url && db.config.db) {
      return urlResolveFix(db.config.url, encodeURIComponent(db.config.db))
    } else {
      try {
        // if it parses, return it
        const parsed = new URL(db)
        return parsed.toString()
      } catch (e) {
        // otherwise treat it as a database name
        return urlResolveFix(cfg.url, encodeURIComponent(db))
      }
    }
  }

  // http://docs.couchdb.org/en/latest/api/server/common.html#post--_replicate
  async function replicateDb(source, target, opts) {
    if (missing(source, target)) {
      return Promise.reject(invalidParametersError)
    }

    // _replicate
    opts = opts || {}
    opts.source = _serializeAsUrl(source)
    opts.target = _serializeAsUrl(target)

    return relax({ db: '_replicate', body: opts, method: 'POST' })
  }

  // http://docs.couchdb.org/en/latest/api/server/common.html#uuids
  async function uuids(count) {
    count = count || 1
    return relax({ method: 'GET', path: '_uuids', qs: { count } })
  }

  // http://guide.couchdb.org/draft/replication.html
  async function enableReplication(source, target, opts) {

    if (missing(source, target)) {
      return Promise.reject(invalidParametersError)
    }

    // _replicator
    opts = opts || {}
    opts.source = _serializeAsUrl(source)
    opts.target = _serializeAsUrl(target)

    return relax({ db: '_replicator', body: opts, method: 'POST' })
  }

  // http://guide.couchdb.org/draft/replication.html
  async function queryReplication(id, qs) {
    if (missing(id)) {
      return Promise.reject(invalidParametersError)
    }
    return relax({ db: '_replicator', method: 'GET', path: id, qs })
  }

  // http://guide.couchdb.org/draft/replication.html
  async function disableReplication(id, rev, opts) {
    if (missing(id, rev)) {
      return Promise.reject(invalidParametersError)
    }
    opts = opts || {}
    const req = {
      db: '_replicator',
      method: 'DELETE',
      path: id,
      qs: Object.assign(opts, { rev })
    }
    return relax(req)
  }

  function docModule(dbName) {
    let docScope = {}
    dbName = decodeURIComponent(dbName)

    // http://docs.couchdb.org/en/latest/api/document/common.html#put--db-docid
    // http://docs.couchdb.org/en/latest/api/database/common.html#post--db
    async function insertDoc(doc, qs) {
      const req = { db: dbName, body: doc, method: 'POST' }

      if (typeof qs === 'string') {
        qs = { docName: qs }
      }

      if (qs) {
        if (qs.docName) {
          req.doc = qs.docName
          req.method = 'PUT'
          delete qs.docName
        }
        req.qs = qs
      }

      return relax(req)
    }

    // http://docs.couchdb.org/en/latest/api/document/common.html#delete--db-docid
    async function destroyDoc(docName, rev) {
      if (missing(docName)) {
        return Promise.reject(invalidParametersError)
      }

      return relax({
        db: dbName,
        doc: docName,
        method: 'DELETE',
        qs: { rev }
      })
    }

    // http://docs.couchdb.org/en/latest/api/document/common.html#get--db-docid
    async function getDoc(docName, qs) {
      if (missing(docName)) {
        return Promise.reject(invalidParametersError)
      }

      return relax({ db: dbName, doc: docName, qs })
    }

    // http://docs.couchdb.org/en/latest/api/document/common.html#head--db-docid
    async function headDoc(docName) {
      if (missing(docName)) {
        return Promise.reject(invalidParametersError)
      }
      return relax({
        db: dbName,
        doc: docName,
        method: 'HEAD'
      })
    }

    // http://docs.couchdb.org/en/latest/api/database/bulk-api.html#get--db-_all_docs
    async function listDoc(qs) {
      return relax({ db: dbName, path: '_all_docs', qs })
    }

    // http://docs.couchdb.org/en/latest/api/database/bulk-api.html#get--db-_all_docs
    async function listDocAsStream(qs) {
      return relax({ db: dbName, path: '_all_docs', qs, stream: true })
    }

    // http://docs.couchdb.org/en/latest/api/database/bulk-api.html#post--db-_all_docs
    async function fetchDocs(docNames, qs) {
      const opts = qs || {}
      opts.include_docs = true

      if (missing(docNames) || typeof docNames !== 'object' ||
        !docNames.keys || !Array.isArray(docNames.keys) ||
        docNames.keys.length === 0) {
        return Promise.reject(invalidParametersError)
      }

      return relax({
        db: dbName,
        path: '_all_docs',
        method: 'POST',
        qs: opts,
        body: docNames
      })
    }

    async function fetchRevs(docNames, qs) {

      if (missing(docNames) || typeof docNames !== 'object' ||
        !docNames.keys || !Array.isArray(docNames.keys) ||
        docNames.keys.length === 0) {
        return Promise.reject(invalidParametersError)
      }

      return relax({
        db: dbName,
        path: '_all_docs',
        method: 'POST',
        qs,
        body: docNames
      })
    }

    async function view(ddoc, viewName, meta, qs) {
      if (missing(ddoc, viewName) && !meta.viewPath) {
        return Promise.reject(invalidParametersError)
      }

      if (typeof meta.stream !== 'boolean') {
        meta.stream = false
      }

      // prevent mutation of the client qs object by using a clone
      const qs1 = Object.assign({}, qs)

      const viewPath = meta.viewPath || '_design/' + ddoc + '/_' + meta.type +
        '/' + viewName

      if (meta.type === 'search') {
        return relax({
          db: dbName,
          path: viewPath,
          method: 'POST',
          body: qs1,
          stream: meta.stream
        })
      } else if (qs1 && qs1.keys) {
        const body = { keys: qs1.keys }
        delete qs1.keys
        return relax({
          db: dbName,
          path: viewPath,
          method: 'POST',
          qs: qs1,
          body,
          stream: meta.stream
        })
      } else if (qs1 && qs1.queries) {
        const body = { queries: qs1.queries }
        delete qs1.queries
        return relax({
          db: dbName,
          path: viewPath,
          method: 'POST',
          qs: qs1,
          body
        })
      } else {
        const req = {
          db: dbName,
          method: meta.method || 'GET',
          path: viewPath,
          qs: qs1,
          stream: meta.stream
        }

        if (meta.body) {
          req.body = meta.body
        }

        return relax(req)
      }
    }

    // http://docs.couchdb.org/en/latest/api/ddoc/views.html#post--db-_design-ddoc-_view-view
    async function viewDocs(ddoc, viewName, qs) {
      return view(ddoc, viewName, { type: 'view' }, qs)
    }

    // http://docs.couchdb.org/en/latest/api/ddoc/views.html#post--db-_design-ddoc-_view-view
    async function viewDocsAsStream(ddoc, viewName, qs) {
      return view(ddoc, viewName, { type: 'view', stream: true }, qs)
    }

    // cloudant
    async function viewSearch(ddoc, viewName, qs) {
      return view(ddoc, viewName, { type: 'search' }, qs)
    }

    // cloudant
    async function viewSearchAsStream(ddoc, viewName, qs) {
      return view(ddoc, viewName, { type: 'search', stream: true }, qs)
    }

    // http://docs.couchdb.org/en/latest/api/ddoc/render.html#get--db-_design-ddoc-_show-func
    async function showDoc(ddoc, viewName, docName, qs) {
      if (missing(ddoc, viewName, docName)) {
        return Promise.reject(invalidParametersError)
      }

      return view(ddoc, viewName + '/' + docName, { type: 'show' }, qs)
    }

    // http://docs.couchdb.org/en/latest/api/ddoc/render.html#put--db-_design-ddoc-_update-func-docid
    async function updateWithHandler(ddoc, viewName, docName, body) {
      if (missing(ddoc, viewName, docName)) {
        return Promise.reject(invalidParametersError)
      }
      return view(ddoc, viewName + '/' + encodeURIComponent(docName), {
        type: 'update',
        method: 'PUT',
        body
      })
    }

    async function viewWithList(ddoc, viewName, listName, qs) {
      return view(ddoc, listName + '/' + viewName, {
        type: 'list'
      }, qs)
    }

    async function viewWithListAsStream(ddoc, viewName, listName, qs) {
      return view(ddoc, listName + '/' + viewName, {
        type: 'list',
        stream: true
      }, qs)
    }

    // http://docs.couchdb.org/en/latest/api/database/bulk-api.html#post--db-_bulksDoc
    async function bulksDoc(docs, qs) {
      return relax({
        db: dbName,
        path: '_bulk_docs',
        body: docs,
        method: 'POST',
        qs
      })
    }

    // http://docs.couchdb.org/en/latest/api/document/common.html#creating-multiple-attachments
    async function insertMultipart(doc, attachments, qs) {
      if (typeof qs === 'string') {
        qs = { docName: qs }
      }
      qs = qs || {}

      const docName = qs.docName
      delete qs.docName

      if (missing(doc, attachments, docName)) {
        return Promise.reject(invalidParametersError)
      }

      doc = Object.assign({ _attachments: {} }, doc)

      const multipart = []

      attachments.forEach(function (att) {
        doc._attachments[att.name] = {
          follows: true,
          length: Buffer.isBuffer(att.data) ? att.data.length : Buffer.byteLength(att.data),
          /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
          content_type: att.content_type
        }
        multipart.push(att)
      })

      multipart.unshift({
        content_type: 'application/json',
        data: JSON.stringify(doc),
        name: 'document'
      })

      return relax({
        db: dbName,
        method: 'PUT',
        doc: docName,
        qs,
        multipart
      })
    }

    async function getMultipart(docName, qs) {
      qs = qs || {}
      qs.attachments = true

      if (missing(docName)) {
        return Promise.reject(invalidParametersError)
      }

      return relax({
        db: dbName,
        doc: docName,
        headers: {
          accept: 'multipart/related'
        },
        qs
      })
    }

    async function insertAtt(docName, attName, att, contentType, qs) {
      if (missing(docName, attName, att, contentType)) {
        return Promise.reject(invalidParametersError)
      }

      return relax({
        db: dbName,
        att: attName,
        method: 'PUT',
        headers: {
          'content-type': contentType
        },
        doc: docName,
        qs,
        body: att,
        dontStringify: true
      })
    }

    async function getAtt(docName, attName, qs) {

      if (missing(docName, attName)) {
        return Promise.reject(invalidParametersError)
      }

      return relax({
        db: dbName,
        att: attName,
        doc: docName,
        qs,
        encoding: null,
        dontParse: true
      })
    }

    async function getAttAsStream(docName, attName, qs) {
      return relax({
        db: dbName,
        att: attName,
        doc: docName,
        qs,
        stream: true,
        encoding: null,
        dontParse: true
      })
    }

    function destroyAtt(docName, attName, qs) {
      if (missing(docName, attName)) {
        return Promise.reject(invalidParametersError)
      }

      return relax({
        db: dbName,
        att: attName,
        method: 'DELETE',
        doc: docName,
        qs
      })
    }

    async function find(query) {
      if (missing(query) || typeof query !== 'object') {
        return Promise.reject(invalidParametersError)
      }

      return relax({
        db: dbName,
        path: '_find',
        method: 'POST',
        body: query
      })
    }

    async function findAsStream(query) {
      return relax({
        db: dbName,
        path: '_find',
        method: 'POST',
        body: query,
        stream: true
      })
    }

    async function createIndex(indexDef) {
      if (missing(indexDef) || typeof indexDef !== 'object') {
        return Promise.reject(invalidParametersError)
      }

      return relax({
        db: dbName,
        path: '_index',
        method: 'POST',
        body: indexDef
      })
    }

    async function partitionInfo(partitionKey) {
      if (missing(partitionKey)) {
        return Promise.reject(invalidParametersError)
      }

      return relax({
        db: dbName,
        path: '_partition/' + encodeURIComponent(partitionKey)
      })
    }

    async function partitionedList(partitionKey, qs) {
      if (missing(partitionKey)) {
        return Promise.reject(invalidParametersError)
      }
      return relax({
        db: dbName,
        path: '_partition/' + encodeURIComponent(partitionKey) + '/_all_docs',
        qs
      })
    }

    async function partitionedListAsStream(partitionKey, qs) {
      return relax({
        db: dbName,
        path: '_partition/' + encodeURIComponent(partitionKey) + '/_all_docs',
        qs,
        stream: true
      })
    }

    async function partitionedFind(partition, query) {
      if (missing(partition, query) || typeof query !== 'object') {
        return Promise.reject(invalidParametersError)
      }

      return relax({
        db: dbName,
        path: '_partition/' + encodeURIComponent(partition) + '/_find',
        method: 'POST',
        body: query
      })
    }

    async function partitionedFindAsStream(partition, query) {
      return relax({
        db: dbName,
        path: '_partition/' + encodeURIComponent(partition) + '/_find',
        method: 'POST',
        body: query,
        stream: true
      })
    }

    async function partitionedSearch(partition, ddoc, searchName, qs) {
      if (missing(partition, ddoc, searchName, qs) || typeof qs !== 'object') {
        return Promise.reject(invalidParametersError)
      }
      return relax({
        db: dbName,
        path: '_partition/' + encodeURIComponent(partition) + '/_design/' + ddoc + '/_search/' + searchName,
        qs
      })
    }

    async function partitionedSearchAsStream(partition, ddoc, searchName, qs) {
      return relax({
        db: dbName,
        path: '_partition/' + encodeURIComponent(partition) + '/_design/' + ddoc + '/_search/' + searchName,
        qs,
        stream: true
      })
    }

    async function partitionedView(partition, ddoc, viewName, qs) {
      if (missing(partition, ddoc, viewName)) {
        return Promise.reject(invalidParametersError)
      }
      return relax({
        db: dbName,
        path: '_partition/' + encodeURIComponent(partition) + '/_design/' + ddoc + '/_view/' + viewName,
        qs
      })
    }

    async function partitionedViewAsStream(partition, ddoc, viewName, qs) {
      return relax({
        db: dbName,
        path: '_partition/' + encodeURIComponent(partition) + '/_design/' + ddoc + '/_view/' + viewName,
        qs,
        stream: true
      })
    }

    // db level exports
    docScope = {
      info: async function () {
        return getDb(dbName)
      },
      replicate: async function (target, opts) {
        return replicateDb(dbName, target, opts)
      },
      compact: async function () {
        return compactDb(dbName)
      },
      changes: async function (qs) {
        return changesDb(dbName, qs)
      },
      changesAsStream: async function (qs) {
        return changesDbAsStream(dbName, qs)
      },
      changesReader: new ChangesReader(dbName, relax),
      auth,
      session,
      insert: insertDoc,
      get: getDoc,
      head: headDoc,
      destroy: destroyDoc,
      bulk: bulksDoc,
      list: listDoc,
      listAsStream: listDocAsStream,
      fetch: fetchDocs,
      fetchRevs,
      config: { url: cfg.url, db: dbName },
      multipart: {
        insert: insertMultipart,
        get: getMultipart
      },
      attachment: {
        insert: insertAtt,
        get: getAtt,
        getAsStream: getAttAsStream,
        destroy: destroyAtt
      },
      show: showDoc,
      atomic: updateWithHandler,
      updateWithHandler,
      baseView: view,
      search: viewSearch,
      searchAsStream: viewSearchAsStream,
      view: viewDocs,
      viewAsStream: viewDocsAsStream,
      find,
      findAsStream,
      createIndex,
      viewWithList,
      viewWithListAsStream,
      server: serverScope,
      replication: {
        enable: async function (target, opts) {
          return enableReplication(dbName, target, opts)
        },
        disable: async function (id, revision, opts) {
          return disableReplication(id, revision, opts)
        },
        query: async function (id, opts) {
          return queryReplication(id, opts)
        }
      },
      partitionInfo,
      partitionedList,
      partitionedListAsStream,
      partitionedFind,
      partitionedFindAsStream,
      partitionedSearch,
      partitionedSearchAsStream,
      partitionedView,
      partitionedViewAsStream
    }

    docScope.view.compact = async function (ddoc) {
      return compactDb(dbName, ddoc)
    }

    return docScope
  }

  // server level exports
  serverScope = Object.assign(serverScope, {
    db: {
      create: createDb,
      get: getDb,
      destroy: destroyDb,
      list: listDbs,
      listAsStream: listDbsAsStream,
      use: docModule,
      scope: docModule,
      compact: compactDb,
      replicate: replicateDb,
      replication: {
        enable: enableReplication,
        disable: disableReplication,
        query: queryReplication
      },
      changes: changesDb,
      updates
    },
    use: docModule,
    scope: docModule,
    request: relax,
    relax,
    dinosaur: relax,
    auth,
    session,
    updates,
    uuids,
    info
  })

  const db = maybeExtractDatabaseComponent()

  return db ? docModule(db) : serverScope
}

/*
 * and now an ascii dinosaur
 *              _
 *            / _) ROAR! i'm a vegan!
 *     .-^^^-/ /
 *  __/       /
 * /__.|_|-|_|
 *
 * thanks for visiting! come again!
 */

function urlResolveFix(couchUrl, dbName) {
  if (/[^/]$/.test(couchUrl)) {
    couchUrl += '/'
  }
  return new URL(dbName, couchUrl).toString()
}
