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

const { URL } = require('url')
const assert = require('assert')
const stream = require('stream')
const Readable = stream.Readable
const ChangesReader = require('./changesreader.js')
const CookieJar = require('./cookie.js')
const MultiPartFactory = require('./multipart.js')
const pkg = require('../package.json')

const SCRUBBED_STR = 'XXXXXX'

function isEmpty (val) {
  return val == null || !(Object.keys(val) || val).length
}

// feed this any number of arguments, it will return true if
// any of them are missing (falsey)
function missing (...params) {
  return params.some(param => !param)
}

// the stock error returned when a call has missing or invalid parameters
const invalidParametersError = new Error('Invalid parameters')

module.exports = exports = function dbScope (cfg) {
  let serverScope = {}

  if (typeof cfg === 'string') {
    cfg = { url: cfg }
  }

  assert.strictEqual(typeof cfg, 'object',
    'You must specify the endpoint url when invoking this module')
  assert.ok(/^https?:/.test(cfg.url), 'url is not valid')

  cfg = Object.assign({}, cfg)
  serverScope.config = cfg
  const dummyLogger = () => {}
  const log = typeof cfg.log === 'function' ? cfg.log : dummyLogger
  const parseUrl = 'parseUrl' in cfg ? cfg.parseUrl : true

  // pre-parse the URL to extract URL without auth details
  cfg.parsedURL = new URL(cfg.url)
  cfg.plainURL = `${cfg.parsedURL.origin}${cfg.parsedURL.pathname}`
  cfg.headers = cfg.headers || {}
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

  function maybeExtractDatabaseComponent () {
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

  function scrubURL (str) {
    if (str) {
      str = str.replace(/\/\/(.*)@/, `//${SCRUBBED_STR}:${SCRUBBED_STR}@`)
    }
    return str
  }

  function scrubRequest (req, cloned) {
    // scrub credentials
    req.url = scrubURL(req.url)
    if (req.headers.cookie) {
      req.headers.cookie = 'XXXXXXX'
    }
    if (req.headers.Authorization) {
      req.headers.Authorization = 'XXXXXXX'
    }
  }

  const responseHandler = async function (response, req, opts, resolve, reject) {
    const statusCode = response.status || 500
    let body = response.body
    response.statusCode = statusCode

    // cookie parsing
    if (response.headers) {
      const h = response.headers.get('set-cookie')
      if (h) {
        cfg.cookieJar.parse(h, req.url)
      }
    }

    const responseHeaders = {
      uri: scrubURL(req.url),
      statusCode,
      ...(response.headers ?? {})
    };
  
    if (!response.status) {
      log({ err: 'socket', body, headers: responseHeaders })
      if (reject) {
        // since #relax might have sent Error rather than Response:
        const statusText = response.cause?.toString() ?? response.message
        reject(new Error(`error happened in your connection. Reason: ${statusText}`))
      }
      return
    }

    delete responseHeaders.server
    delete responseHeaders['content-length']

    if (statusCode >= 200 && statusCode < 400) {
      // collect response
      const contentType = response.headers.get('content-type')
      let retval = ''
      // when doing head requests, we return the response headers, not the response body
      if (req.method === 'head') {
        retval = Object.fromEntries(response.headers)
      } else if (contentType === 'application/json') {
        try {
          retval = await response.json()
        } catch {
          // do nothing
        }
      } else if (contentType && (contentType.startsWith('text/') || contentType.startsWith('multipart/related'))) {
        retval = await response.text()
      } else {
        const ab = await response.arrayBuffer()
        retval = Buffer.from(ab)
      }

      // log
      log({ err: null, retval, headers: responseHeaders })

      // promisey
      if (resolve) {
        resolve(retval)
      }
      return
    }

    // cloudant stacktrace
    try {
      body = await response.json()
    } catch (e) {
      // if we were expecting a JSON response but didn't get one, set the body to a blank string
      // rather than throw an error. This happens when 
      // - we do HEAD /db/docid
      // - or we get a 500 from CouchDB with no body
      // In these cases we expect a rejected promise.
      body = ''
    }

    if (typeof body === 'string') {
      body = { message: body }
    }

    if (body && !body.message && (body.reason || body.error)) {
      body.message = (body.reason || body.error)
    }

    // fix cloudant issues where they give an erlang stacktrace as js
    delete body.stack

    // scrub credentials
    scrubRequest(req)

    log({ err: 'couch', body, headers: responseHeaders })

    const message = body.message || 'couch returned ' + statusCode
    const errors = new Error(message)
    errors.scope = 'couch'
    errors.statusCode = statusCode
    errors.request = req
    errors.headers = responseHeaders
    errors.errid = 'non_200'
    errors.name = 'Error'
    errors.description = message
    // add any attributes from the HTTP response into the
    // Error object (except message, which would overwrite
    // the text message of the Error)
    delete body.message
    Object.assign(errors, body)

    if (reject) {
      reject(errors)
    }
  }

  const streamResponseHandler = function (response, req, stream) {
    const statusCode = response.status || (response.response && response.response.status) || 500
    const message = response.statusText
    scrubRequest(req)
    const responseHeaders = Object.assign({
      uri: req.url,
      statusCode
    }, response.headers ? Object.fromEntries(response.headers) : {})

    const error = new Error(message)
    error.scope = 'couch'
    error.statusCode = statusCode
    error.request = req
    error.headers = responseHeaders
    error.errid = 'non_200'
    error.name = 'Error'
    error.description = message
    error.reason = message

    log({ err: 'couch', body: message, headers: responseHeaders })

    setTimeout(() => {
      stream.emit('error', error)
    }, 10)
  }

  function relax (opts) {
    if (typeof opts === 'function') {
      opts = { path: '' }
    }
    if (typeof opts === 'string') {
      opts = { path: opts }
    }
    if (!opts) {
      opts = { path: '' }
    }

    // the building blocks of the request
    let body, uri

    // construct headers object to be passed in the request
    const headers = {
      accept: 'application/json',
      'user-agent': `${pkg.name}/${pkg.version} (Node.js ${process.version})`,
      'Accept-Encoding': 'deflate, gzip'
    }
    Object.assign(headers, cfg.headers ? cfg.headers : {})
    if (!headers['content-type']) {
      headers['content-type'] = 'application/json'
    }

    // prevent bugs where people set encoding when piping
    if (opts.encoding !== undefined) {
      delete headers['content-type']
      delete headers.accept
    }

    if (opts.contentType) {
      headers['content-type'] = opts.contentType
      delete headers.accept
    }

    if (opts.accept) {
      headers.accept = opts.accept
    }

    // http://guide.couchdb.org/draft/security.html#cookies
    if (cfg.cookie) {
      headers['X-CouchDB-WWW-Authenticate'] = 'Cookie'
      headers.cookie = cfg.cookie
    }

    // form submission
    if (opts.form) {
      headers['content-type'] =
        'application/x-www-form-urlencoded; charset=utf-8'
      body = new URLSearchParams(opts.form)
    }

    // multipart requests
    if (opts.multipart) {
      // generate the multipart/related body, header and boundary to
      // upload multiple binary attachments in one request
      const mp = new MultiPartFactory(opts.multipart)
      headers['content-type'] = mp.header
      body = mp.data
    }

    // construct the URL
    const method = opts.method ? opts.method.toLowerCase() : 'get'
    uri = cfg.plainURL
    if (opts.db) {
      uri = urlResolveFix(uri, encodeURIComponent(opts.db))
    }

    // http://wiki.apache.org/couchdb/HTTP_database_API#Naming_and_Addressing
    if (opts.path) {
      if (!uri.endsWith('/')) {
        uri += '/'
      }
      uri += opts.path
    } else if (opts.doc) {
      if (!/^_design|_local/.test(opts.doc)) {
        // http://wiki.apache.org/couchdb/HTTP_Document_API#Naming.2FAddressing
        uri += '/' + encodeURIComponent(opts.doc)
      } else {
        // http://wiki.apache.org/couchdb/HTTP_Document_API#Document_IDs
        uri += '/' + opts.doc
      }

      // http://wiki.apache.org/couchdb/HTTP_Document_API#Attachments
      if (opts.att) {
        uri += '/' + opts.att
      }
    }

    // http://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options
    const qs = Object.assign({}, opts.qs)
    if (typeof qs === 'object' && !isEmpty(qs)) {
      ['startkey', 'endkey', 'key', 'keys', 'start_key', 'end_key'].forEach(function (key) {
        if (key in qs) {
          qs[key] = JSON.stringify(qs[key])
        }
      })
    }

    // HTTP request body
    if (opts.body) {
      if (Buffer.isBuffer(opts.body) || opts.dontStringify) {
        body = opts.body
      } else {
        body = JSON.stringify(opts.body, function (key, value) {
          // don't encode functions
          if (typeof (value) === 'function') {
            return value.toString()
          } else {
            return value
          }
        })
      }
    }

    // scrub and log
    const scrubbedReq = {
      method,
      headers: JSON.parse(JSON.stringify(headers)),
      url: uri
    }
    scrubRequest(scrubbedReq, true)
    log(scrubbedReq)

    // insert basic auth headers, if present
    Object.assign(headers, cfg.headers)

    // build the options we send to undici.fetch
    const fetchOptions = {
      url: uri,
      method,
      headers,
      credentials: 'include',
      body: method !== 'get' && body ? body : undefined,
      redirect: 'error',
      signal: opts.signal,
      bodyTimeout: 0
    }

    // add custom agent if present
    if (cfg.agent) {
      fetchOptions.dispatcher = cfg.agent
    }

    // add querystring params
    const searchParams = new URLSearchParams(qs)
    const queryString = searchParams.toString()
    if (queryString.length > 0) {
      fetchOptions.url += '?' + queryString
    }

    // if the body is readable stream
    if (fetchOptions.body && fetchOptions.body instanceof stream.Readable) {
      fetchOptions.duplex = 'half'
      fetchOptions.keepalive = false
    }

    // add any cookies for this domain
    const cookie = cfg.cookieJar.getCookieString(uri)
    if (cookie) {
      fetchOptions.headers.cookie = cookie
    }

    // actually do the HTTP request
    if (opts.stream) {
      // return the Request object for streaming
      const outStream = new stream.PassThrough()
      fetch(fetchOptions.url, fetchOptions).then((response) => {
        const readableWebStream = response.body
        const readableNodeStream = Readable.fromWeb ? Readable.fromWeb(readableWebStream) : Readable.from(readableWebStream)
        if (response.status > 300) {
          streamResponseHandler(response, fetchOptions, outStream)
        } else {
          readableNodeStream.pipe(outStream)
        }
      }).catch((e) => {
        streamResponseHandler(e, fetchOptions, outStream)
      })
      return outStream
    } else {
      return new Promise((resolve, reject) => {
        fetch(fetchOptions.url, fetchOptions).then((response) => {
          responseHandler(response, fetchOptions, opts, resolve, reject)
        }).catch((e) => {
          responseHandler(e, fetchOptions, opts, resolve, reject)
        })
      })
    }
  }

  // http://docs.couchdb.org/en/latest/api/server/authn.html#cookie-authentication
  function auth (username, password) {
    return relax({
      method: 'POST',
      db: '_session',
      form: {
        name: username,
        password
      }
    })
  }

  // http://docs.couchdb.org/en/latest/api/server/authn.html#post--_session
  function session () {
    return relax({ db: '_session' })
  }

  // https://docs.couchdb.org/en/latest/api/server/common.html#api-server-root
  function info () {
    return relax({ path: '' })
  }

  // http://docs.couchdb.org/en/latest/api/server/common.html#get--_db_updates
  function updates (qs) {
    return relax({
      db: '_db_updates',
      qs
    })
  }

  // http://docs.couchdb.org/en/latest/api/database/common.html#put--db
  function createDb (dbName, qs) {
    if (missing(dbName)) {
      return Promise.reject(invalidParametersError)
    }
    return relax({ db: dbName, method: 'PUT', qs })
  }

  // http://docs.couchdb.org/en/latest/api/database/common.html#delete--db
  function destroyDb (dbName) {
    if (missing(dbName)) {
      return Promise.reject(invalidParametersError)
    }
    return relax({ db: dbName, method: 'DELETE' })
  }

  // http://docs.couchdb.org/en/latest/api/database/common.html#get--db
  function getDb (dbName) {
    if (missing(dbName)) {
      return Promise.reject(invalidParametersError)
    }
    return relax({ db: dbName })
  }

  // http://docs.couchdb.org/en/latest/api/server/common.html#get--_all_dbs
  function listDbs () {
    return relax({ db: '_all_dbs' })
  }

  // http://docs.couchdb.org/en/latest/api/server/common.html#get--_all_dbs
  function listDbsAsStream () {
    return relax({ db: '_all_dbs', stream: true })
  }

  // http://docs.couchdb.org/en/latest/api/database/compact.html#post--db-_compact
  function compactDb (dbName, ddoc) {
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
  function changesDb (dbName, qs) {
    if (missing(dbName)) {
      return Promise.reject(invalidParametersError)
    }
    return relax({ db: dbName, path: '_changes', qs })
  }

  function changesDbAsStream (dbName, qs) {
    return relax({ db: dbName, path: '_changes', stream: true, qs })
  }

  function _serializeAsUrl (db) {
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
  function replicateDb (source, target, opts) {
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
  function uuids (count) {
    count = count || 1
    return relax({ method: 'GET', path: '_uuids', qs: { count } })
  }

  // http://guide.couchdb.org/draft/replication.html
  function enableReplication (source, target, opts) {

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
  function queryReplication (id, qs) {
    if (missing(id)) {
      return Promise.reject(invalidParametersError)
    }
    return relax({ db: '_replicator', method: 'GET', path: id, qs })
  }

  // http://guide.couchdb.org/draft/replication.html
  function disableReplication (id, rev, opts) {
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

  function docModule (dbName) {
    let docScope = {}
    dbName = decodeURIComponent(dbName)

    // http://docs.couchdb.org/en/latest/api/document/common.html#put--db-docid
    // http://docs.couchdb.org/en/latest/api/database/common.html#post--db
    function insertDoc (doc, qs ) {
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
    function destroyDoc (docName, rev) {
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
    function getDoc (docName, qs) {
      if (missing(docName)) {
        return Promise.reject(invalidParametersError)
      }

      return relax({ db: dbName, doc: docName, qs })
    }

    // http://docs.couchdb.org/en/latest/api/document/common.html#head--db-docid
    function headDoc (docName) {
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
    function listDoc (qs) {
      return relax({ db: dbName, path: '_all_docs', qs })
    }

    // http://docs.couchdb.org/en/latest/api/database/bulk-api.html#get--db-_all_docs
    function listDocAsStream (qs) {
      return relax({ db: dbName, path: '_all_docs', qs, stream: true })
    }

    // http://docs.couchdb.org/en/latest/api/database/bulk-api.html#post--db-_all_docs
    function fetchDocs (docNames, qs) {
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

    function fetchRevs (docNames, qs) {

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

    function view (ddoc, viewName, meta, qs) {
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
    function viewDocs (ddoc, viewName, qs) {
      return view(ddoc, viewName, { type: 'view' }, qs)
    }

    // http://docs.couchdb.org/en/latest/api/ddoc/views.html#post--db-_design-ddoc-_view-view
    function viewDocsAsStream (ddoc, viewName, qs) {
      return view(ddoc, viewName, { type: 'view', stream: true }, qs)
    }

    // cloudant
    function viewSearch (ddoc, viewName, qs) {
      return view(ddoc, viewName, { type: 'search' }, qs)
    }

    // cloudant
    function viewSearchAsStream (ddoc, viewName, qs) {
      return view(ddoc, viewName, { type: 'search', stream: true }, qs)
    }

    // http://docs.couchdb.org/en/latest/api/ddoc/render.html#get--db-_design-ddoc-_show-func
    function showDoc (ddoc, viewName, docName, qs) {
      if (missing(ddoc, viewName, docName)) {
        return Promise.reject(invalidParametersError)
      }

      return view(ddoc, viewName + '/' + docName, { type: 'show' }, qs)
    }

    // http://docs.couchdb.org/en/latest/api/ddoc/render.html#put--db-_design-ddoc-_update-func-docid
    function updateWithHandler (ddoc, viewName, docName, body) {
      if (missing(ddoc, viewName, docName)) {
        return Promise.reject(invalidParametersError)
      }
      return view(ddoc, viewName + '/' + encodeURIComponent(docName), {
        type: 'update',
        method: 'PUT',
        body
      })
    }

    function viewWithList (ddoc, viewName, listName, qs) {
      return view(ddoc, listName + '/' + viewName, {
        type: 'list'
      }, qs)
    }

    function viewWithListAsStream (ddoc, viewName, listName, qs) {
      return view(ddoc, listName + '/' + viewName, {
        type: 'list',
        stream: true
      }, qs)
    }

    // http://docs.couchdb.org/en/latest/api/database/bulk-api.html#post--db-_bulksDoc
    function bulksDoc (docs, qs) {
      return relax({
        db: dbName,
        path: '_bulk_docs',
        body: docs,
        method: 'POST',
        qs
      })
    }

    // http://docs.couchdb.org/en/latest/api/document/common.html#creating-multiple-attachments
    function insertMultipart (doc, attachments, qs) {
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
        contentType: 'multipart/related',
        doc: docName,
        qs,
        multipart
      })
    }

    function getMultipart (docName, qs) {
      qs = qs || {}
      qs.attachments = true

      if (missing(docName)) {
        return Promise.reject(invalidParametersError)
      }

      return relax({
        db: dbName,
        doc: docName,
        encoding: null,
        accept: 'multipart/related',
        qs
      })
    }

    function insertAtt (docName, attName, att, contentType, qs) {
      if (missing(docName, attName, att, contentType)) {
        return Promise.reject(invalidParametersError)
      }

      return relax({
        db: dbName,
        att: attName,
        method: 'PUT',
        contentType,
        doc: docName,
        qs,
        body: att,
        dontStringify: true
      })
    }

    function getAtt (docName, attName, qs) {
  
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

    function getAttAsStream (docName, attName, qs) {
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

    function destroyAtt (docName, attName, qs) {
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

    function find (query) {
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

    function findAsStream (query) {
      return relax({
        db: dbName,
        path: '_find',
        method: 'POST',
        body: query,
        stream: true
      })
    }

    function createIndex (indexDef) {
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

    function partitionInfo (partitionKey) {
      if (missing(partitionKey)) {
        return Promise.reject(invalidParametersError)
      }

      return relax({
        db: dbName,
        path: '_partition/' + encodeURIComponent(partitionKey)
      })
    }

    function partitionedList (partitionKey, qs) {
      if (missing(partitionKey)) {
        return Promise.reject(invalidParametersError)
      }
      return relax({
        db: dbName,
        path: '_partition/' + encodeURIComponent(partitionKey) + '/_all_docs',
        qs
      })
    }

    function partitionedListAsStream (partitionKey, qs) {
      return relax({
        db: dbName,
        path: '_partition/' + encodeURIComponent(partitionKey) + '/_all_docs',
        qs,
        stream: true
      })
    }

    function partitionedFind (partition, query) {
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

    function partitionedFindAsStream (partition, query) {
      return relax({
        db: dbName,
        path: '_partition/' + encodeURIComponent(partition) + '/_find',
        method: 'POST',
        body: query,
        stream: true
      })
    }

    function partitionedSearch (partition, ddoc, searchName, qs) {
      if (missing(partition, ddoc, searchName, qs) || typeof qs !== 'object') {
        return Promise.reject(invalidParametersError)
      }
      return relax({
        db: dbName,
        path: '_partition/' + encodeURIComponent(partition) + '/_design/' + ddoc + '/_search/' + searchName,
        qs
      })
    }

    function partitionedSearchAsStream (partition, ddoc, searchName, qs) {
      return relax({
        db: dbName,
        path: '_partition/' + encodeURIComponent(partition) + '/_design/' + ddoc + '/_search/' + searchName,
        qs,
        stream: true
      })
    }

    function partitionedView (partition, ddoc, viewName, qs) {
      if (missing(partition, ddoc, viewName)) {
        return Promise.reject(invalidParametersError)
      }
      return relax({
        db: dbName,
        path: '_partition/' + encodeURIComponent(partition) + '/_design/' + ddoc + '/_view/' + viewName,
        qs
      })
    }

    function partitionedViewAsStream (partition, ddoc, viewName, qs) {
      return relax({
        db: dbName,
        path: '_partition/' + encodeURIComponent(partition) + '/_design/' + ddoc + '/_view/' + viewName,
        qs,
        stream: true
      })
    }

    // db level exports
    docScope = {
      info: function () {
        return getDb(dbName)
      },
      replicate: function (target, opts) {
        return replicateDb(dbName, target, opts)
      },
      compact: function () {
        return compactDb(dbName)
      },
      changes: function (qs) {
        return changesDb(dbName, qs)
      },
      changesAsStream: function (qs) {
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
        enable: function (target, opts) {
          return enableReplication(dbName, target, opts)
        },
        disable: function (id, revision, opts) {
          return disableReplication(id, revision, opts)
        },
        query: function (id, opts) {
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

    docScope.view.compact = function (ddoc) {
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

function urlResolveFix (couchUrl, dbName) {
  if (/[^/]$/.test(couchUrl)) {
    couchUrl += '/'
  }
  return new URL(dbName, couchUrl).toString()
}
