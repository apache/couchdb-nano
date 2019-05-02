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

'use strict'

const u = require('url')
const assert = require('assert')
const querystring = require('querystring')
const request = require('request')
const errs = require('errs')
const follow = require('cloudant-follow')
const logger = require('./logger')

function isEmpty (val) {
  return val == null || !(Object.keys(val) || val).length
}

function getCallback (opts, callback) {
  if (typeof opts === 'function') {
    callback = opts
    opts = {}
  }
  opts = opts || {}
  return {
    opts,
    callback
  }
}

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
  cfg.requestDefaults = cfg.requestDefaults || {}

  const httpAgent = (typeof cfg.request === 'function') ? cfg.request
    : request.defaults(cfg.requestDefaults)
  const followAgent = (typeof cfg.follow === 'function') ? cfg.follow : follow
  const log = typeof cfg.log === 'function' ? cfg.log : logger(cfg)
  const parseUrl = 'parseUrl' in cfg ? cfg.parseUrl : true

  function maybeExtractDatabaseComponent () {
    if (!parseUrl) {
      return
    }

    const path = u.parse(cfg.url)
    let pathArray = path.pathname.split('/').filter(function (e) { return e })
    const db = pathArray.pop()
    const rootPath = path.pathname.replace(/\/?$/, '/..')

    if (db) {
      cfg.url = urlResolveFix(cfg.url, rootPath).replace(/\/?$/, '')
      return db
    }
  }

  function scrub (str) {
    if (str) {
      str = str.replace(/\/\/(.*)@/, '//XXXXXX:XXXXXX@')
    }
    return str
  }
  const responseHandler = function (req, opts, resolve, reject, callback) {
    return function (err, response = { statusCode: 500 }, body = '') {
      let parsed
      const responseHeaders = Object.assign({
        uri: req.uri,
        statusCode: response.statusCode
      }, response.headers)
      if (err) {
        log({ err: 'socket', body: body, headers: responseHeaders })
        const returnError = errs.merge(err, {
          message: 'error happened in your connection',
          scope: 'socket',
          errid: 'request'
        })
        if (reject) {
          reject(returnError)
        }
        if (callback) {
          callback(returnError)
        }
        return
      }

      delete responseHeaders.server
      delete responseHeaders['content-length']

      if (opts.dontParse) {
        parsed = body
      } else {
        try { parsed = JSON.parse(body) } catch (err) { parsed = body }
      }

      if (responseHeaders.statusCode >= 200 && responseHeaders.statusCode < 400) {
        log({ err: null, body: parsed, headers: responseHeaders })
        if (resolve) {
          resolve(parsed)
        }
        if (callback) {
          callback(null, parsed, responseHeaders)
        }
        return
      }

      log({ err: 'couch', body: parsed, headers: responseHeaders })

      // cloudant stacktrace
      if (typeof parsed === 'string') {
        parsed = { message: parsed }
      }

      if (!parsed.message && (parsed.reason || parsed.error)) {
        parsed.message = (parsed.reason || parsed.error)
      }

      // fix cloudant issues where they give an erlang stacktrace as js
      delete parsed.stack

      // scrub credentials
      req.uri = scrub(req.uri)
      responseHeaders.uri = scrub(responseHeaders.uri)
      if (req.headers.cookie) {
        req.headers.cookie = 'XXXXXXX'
      }

      let errors = errs.merge({
        message: 'couch returned ' + responseHeaders.statusCode,
        scope: 'couch',
        statusCode: responseHeaders.statusCode,
        request: req,
        headers: responseHeaders,
        errid: 'non_200'
      }, errs.create(parsed))

      if (reject) {
        reject(errors)
      }
      if (callback) {
        callback(errors)
      }
    }
  }

  function relax (opts, callback) {
    if (typeof opts === 'function') {
      callback = opts
      opts = { path: '' }
    }

    if (typeof opts === 'string') {
      opts = { path: opts }
    }

    if (!opts) {
      opts = { path: '' }
      callback = null
    }

    const qs = Object.assign({}, opts.qs)

    const headers = {
      'content-type': 'application/json',
      accept: 'application/json'
    }

    const req = {
      method: (opts.method || 'GET'),
      headers: headers,
      uri: cfg.url
    }

    // https://github.com/mikeal/request#requestjar
    const isJar = opts.jar || cfg.jar

    if (isJar) {
      req.jar = isJar
    }

    // http://wiki.apache.org/couchdb/HTTP_database_API#Naming_and_Addressing
    if (opts.db) {
      req.uri = urlResolveFix(req.uri, encodeURIComponent(opts.db))
    }

    if (opts.multipart) {
      req.multipart = opts.multipart
    }

    req.headers = Object.assign(req.headers, opts.headers, cfg.defaultHeaders)

    if (opts.path) {
      req.uri += '/' + opts.path
    } else if (opts.doc) {
      if (!/^_design/.test(opts.doc)) {
        // http://wiki.apache.org/couchdb/HTTP_Document_API#Naming.2FAddressing
        req.uri += '/' + encodeURIComponent(opts.doc)
      } else {
        // http://wiki.apache.org/couchdb/HTTP_Document_API#Document_IDs
        req.uri += '/' + opts.doc
      }

      // http://wiki.apache.org/couchdb/HTTP_Document_API#Attachments
      if (opts.att) {
        req.uri += '/' + opts.att
      }
    }

    // prevent bugs where people set encoding when piping
    if (opts.encoding !== undefined && callback) {
      req.encoding = opts.encoding
      delete req.headers['content-type']
      delete req.headers.accept
    }

    if (opts.contentType) {
      req.headers['content-type'] = opts.contentType
      delete req.headers.accept
    }

    if (opts.accept) {
      req.headers['accept'] = opts.accept
    }

    // http://guide.couchdb.org/draft/security.html#cookies
    if (cfg.cookie) {
      req.headers['X-CouchDB-WWW-Authenticate'] = 'Cookie'
      req.headers.cookie = cfg.cookie
    }

    // http://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options
    if (typeof opts.qs === 'object' && !isEmpty(opts.qs)) {
      ['startkey', 'endkey', 'key', 'keys', 'start_key', 'end_key'].forEach(function (key) {
        if (key in opts.qs) {
          qs[key] = JSON.stringify(opts.qs[key])
        }
      })
      req.qs = qs
    }

    if (opts.body) {
      if (Buffer.isBuffer(opts.body) || opts.dontStringify) {
        req.body = opts.body
      } else {
        req.body = JSON.stringify(opts.body, function (key, value) {
          // don't encode functions
          if (typeof (value) === 'function') {
            return value.toString()
          } else {
            return value
          }
        })
      }
    }

    if (opts.form) {
      req.headers['content-type'] =
        'application/x-www-form-urlencoded; charset=utf-8'
      req.body = querystring.stringify(opts.form).toString('utf8')
    }

    // ask request to render query string arrays as repeated values e.g.
    // ?drilldown=["author","Dickens"]&drilldown=["publisher","Penguin"]
    req.qsStringifyOptions = { arrayFormat: 'repeat' }

    log(req)

    if (opts.stream) {
      // return the Request object for streaming
      return httpAgent(req)
    } else {
      if (typeof callback === 'function') {
        // return nothing - feedback via the callback function
        httpAgent(req, responseHandler(req, opts, null, null, callback))
      } else {
        // return a Promise
        return new Promise(function (resolve, reject) {
          httpAgent(req, responseHandler(req, opts, resolve, reject))
        })
      }
    }
  }

  // http://docs.couchdb.org/en/latest/api/server/authn.html#cookie-authentication
  function auth (username, password, callback) {
    return relax({
      method: 'POST',
      db: '_session',
      form: {
        name: username,
        password: password
      }
    }, callback)
  }

  // http://docs.couchdb.org/en/latest/api/server/authn.html#post--_session
  function session (callback) {
    return relax({ db: '_session' }, callback)
  }

  // http://docs.couchdb.org/en/latest/api/server/common.html#get--_db_updates
  function updates (qs0, callback0) {
    const { opts, callback } = getCallback(qs0, callback0)
    return relax({
      db: '_db_updates',
      qs: opts
    }, callback)
  }

  function followUpdates (qs, callback) {
    return followDb('_db_updates', qs, callback)
  }

  // http://docs.couchdb.org/en/latest/api/database/common.html#put--db
  function createDb (dbName, qs0, callback0) {
    const { opts, callback } = getCallback(qs0, callback0)
    return relax({ db: dbName, method: 'PUT', qs: opts }, callback)
  }

  // http://docs.couchdb.org/en/latest/api/database/common.html#delete--db
  function destroyDb (dbName, callback) {
    return relax({ db: dbName, method: 'DELETE' }, callback)
  }

  // http://docs.couchdb.org/en/latest/api/database/common.html#get--db
  function getDb (dbName, callback) {
    return relax({ db: dbName }, callback)
  }

  // http://docs.couchdb.org/en/latest/api/server/common.html#get--_all_dbs
  function listDbs (callback) {
    return relax({ db: '_all_dbs' }, callback)
  }

  // http://docs.couchdb.org/en/latest/api/server/common.html#get--_all_dbs
  function listDbsAsStream () {
    return relax({ db: '_all_dbs', stream: true })
  }

  // http://docs.couchdb.org/en/latest/api/database/compact.html#post--db-_compact
  function compactDb (dbName, ddoc, callback) {
    if (typeof ddoc === 'function') {
      callback = ddoc
      ddoc = null
    }
    return relax({
      db: dbName,
      doc: '_compact',
      att: ddoc,
      method: 'POST'
    }, callback)
  }

  // http://docs.couchdb.org/en/latest/api/database/changes.html#get--db-_changes
  function changesDb (dbName, qs0, callback0) {
    const { opts, callback } = getCallback(qs0, callback0)
    return relax({ db: dbName, path: '_changes', qs: opts }, callback)
  }

  function changesDbAsStream (dbName, opts) {
    return relax({ db: dbName, path: '_changes', stream: true, qs: opts })
  }

  function followDb (dbName, qs0, callback0) {
    const { opts, callback } = getCallback(qs0, callback0)
    opts.db = urlResolveFix(cfg.url, encodeURIComponent(dbName))
    opts.httpAgent = httpAgent
    if (typeof callback === 'function') {
      return followAgent(opts, callback)
    } else {
      return new followAgent.Feed(opts)
    }
  }

  function _serializeAsUrl (db) {
    if (typeof db === 'object' && db.config && db.config.url && db.config.db) {
      return urlResolveFix(db.config.url, encodeURIComponent(db.config.db))
    } else {
      const parsed = u.parse(db)
      if (parsed.protocol) {
        return db
      } else {
        return urlResolveFix(cfg.url, encodeURIComponent(db))
      }
    }
  }

  // http://docs.couchdb.org/en/latest/api/server/common.html#post--_replicate
  function replicateDb (source, target, opts0, callback0) {
    const { opts, callback } = getCallback(opts0, callback0)

    // _replicate
    opts.source = _serializeAsUrl(source)
    opts.target = _serializeAsUrl(target)

    return relax({ db: '_replicate', body: opts, method: 'POST' }, callback)
  }

  // http://docs.couchdb.org/en/latest/api/server/common.html#uuids
  function uuids (count, callback) {
    if (typeof count === 'function') {
      callback = count
      count = 1
    }
    return relax({ method: 'GET', path: '_uuids', qs: { count: count } }, callback)
  }

  // http://guide.couchdb.org/draft/replication.html
  function enableReplication (source, target, opts0, callback0) {
    const { opts, callback } = getCallback(opts0, callback0)

    // _replicator
    opts.source = _serializeAsUrl(source)
    opts.target = _serializeAsUrl(target)

    return relax({ db: '_replicator', body: opts, method: 'POST' }, callback)
  }

  // http://guide.couchdb.org/draft/replication.html
  function queryReplication (id, opts0, callback0) {
    const { opts, callback } = getCallback(opts0, callback0)
    return relax({ db: '_replicator', method: 'GET', path: id, qs: opts }, callback)
  }

  // http://guide.couchdb.org/draft/replication.html
  function disableReplication (id, rev, opts0, callback0) {
    const { opts, callback } = getCallback(opts0, callback0)
    const req = {
      db: '_replicator',
      method: 'DELETE',
      path: id,
      qs: Object.assign(opts, { rev: rev })
    }
    return relax(req, callback)
  }

  function docModule (dbName) {
    let docScope = {}
    dbName = decodeURIComponent(dbName)

    // http://docs.couchdb.org/en/latest/api/document/common.html#put--db-docid
    // http://docs.couchdb.org/en/latest/api/database/common.html#post--db
    function insertDoc (doc, qs0, callback0) {
      const req = { db: dbName, body: doc, method: 'POST' }

      let { opts, callback } = getCallback(qs0, callback0)

      if (typeof opts === 'string') {
        opts = { docName: opts }
      }

      if (opts) {
        if (opts.docName) {
          req.doc = opts.docName
          req.method = 'PUT'
          delete opts.docName
        }
        req.qs = opts
      }

      return relax(req, callback)
    }

    // http://docs.couchdb.org/en/latest/api/document/common.html#delete--db-docid
    function destroyDoc (docName, rev, callback) {
      if (!docName) {
        const msg = 'Invalid doc id'
        if (callback) {
          callback(msg, null)
        } else {
          return Promise.reject(msg)
        }
      } else {
        return relax({
          db: dbName,
          doc: docName,
          method: 'DELETE',
          qs: { rev: rev }
        }, callback)
      }
    }

    // http://docs.couchdb.org/en/latest/api/document/common.html#get--db-docid
    function getDoc (docName, qs0, callback0) {
      const { opts, callback } = getCallback(qs0, callback0)

      if (!docName) {
        if (callback) { callback(new Error('Invalid doc id'), null) }
      } else {
        return relax({ db: dbName, doc: docName, qs: opts }, callback)
      }
    }

    // http://docs.couchdb.org/en/latest/api/document/common.html#head--db-docid
    function headDoc (docName, callback) {
      if (callback) {
        relax({
          db: dbName,
          doc: docName,
          method: 'HEAD',
          qs: {}
        }, callback)
      } else {
        // this function doesn't pass on the Promise from relax because it needs
        // to return the headers when resolving the Promise
        return new Promise(function (resolve, reject) {
          relax({
            db: dbName,
            doc: docName,
            method: 'HEAD',
            qs: {}
          }, function (err, body, headers) {
            if (err) {
              reject(err)
            } else {
              resolve(headers)
            }
          })
        })
      }
    }

    // http://docs.couchdb.org/en/latest/api/document/common.html#copy--db-docid
    function copyDoc (docSrc, docDest, opts0, callback0) {
      const { opts, callback } = getCallback(opts0, callback0)

      const qs = {
        db: dbName,
        doc: docSrc,
        method: 'COPY',
        headers: { 'Destination': docDest }
      }

      if (opts.overwrite) {
        const p = headDoc(docDest).then(
          function (h) {
            if (h.etag) {
              qs.headers.Destination += '?rev=' +
                h.etag.substring(1, h.etag.length - 1)
            }
            relax(qs, callback)
          },
          function (e) {
            if (e && e.statusCode !== 404) {
              if (callback) {
                callback(e)
              } else {
                return Promise.reject(e)
              }
            } else {
              relax(qs, callback)
            }
          }
        )
        if (!callback) {
          return p
        }
      } else {
        return relax(qs, callback)
      }
    }

    // http://docs.couchdb.org/en/latest/api/database/bulk-api.html#get--db-_all_docs
    function listDoc (qs0, callback0) {
      const { opts, callback } = getCallback(qs0, callback0)
      return relax({ db: dbName, path: '_all_docs', qs: opts }, callback)
    }

    // http://docs.couchdb.org/en/latest/api/database/bulk-api.html#get--db-_all_docs
    function listDocAsStream (opts) {
      return relax({ db: dbName, path: '_all_docs', qs: opts, stream: true })
    }

    // http://docs.couchdb.org/en/latest/api/database/bulk-api.html#post--db-_all_docs
    function fetchDocs (docNames, qs0, callback0) {
      const { opts, callback } = getCallback(qs0, callback0)
      opts['include_docs'] = true

      return relax({
        db: dbName,
        path: '_all_docs',
        method: 'POST',
        qs: opts,
        body: docNames
      }, callback)
    }

    function fetchRevs (docNames, qs0, callback0) {
      const { opts, callback } = getCallback(qs0, callback0)
      return relax({
        db: dbName,
        path: '_all_docs',
        method: 'POST',
        qs: opts,
        body: docNames
      }, callback)
    }

    function view (ddoc, viewName, meta, qs0, callback0) {
      const { opts, callback } = getCallback(qs0, callback0)

      if (typeof meta.stream !== 'boolean') {
        meta.stream = false
      }

      // prevent mutation of the client qs object by using a clone
      const qs1 = Object.assign({}, opts)

      const viewPath = meta.viewPath || '_design/' + ddoc + '/_' + meta.type +
            '/' + viewName

      if (meta.type === 'search') {
        return relax({
          db: dbName,
          path: viewPath,
          method: 'POST',
          body: qs1,
          stream: meta.stream
        }, callback)
      } else if (qs1 && qs1.keys) {
        const body = { keys: qs1.keys }
        delete qs1.keys
        return relax({
          db: dbName,
          path: viewPath,
          method: 'POST',
          qs: qs1,
          body: body,
          stream: meta.stream
        }, callback)
      } else if (qs1 && qs1.queries) {
        const body = { queries: qs1.queries }
        delete qs1.queries
        return relax({
          db: dbName,
          path: viewPath,
          method: 'POST',
          qs: qs1,
          body: body
        }, callback)
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

        return relax(req, callback)
      }
    }

    // http://docs.couchdb.org/en/latest/api/ddoc/views.html#post--db-_design-ddoc-_view-view
    function viewDocs (ddoc, viewName, qs, callback) {
      return view(ddoc, viewName, { type: 'view' }, qs, callback)
    }

    // http://docs.couchdb.org/en/latest/api/ddoc/views.html#post--db-_design-ddoc-_view-view
    function viewDocsAsStream (ddoc, viewName, qs) {
      return view(ddoc, viewName, { type: 'view', stream: true }, qs)
    }

    // cloudant
    function viewSearch (ddoc, viewName, qs, callback) {
      return view(ddoc, viewName, { type: 'search' }, qs, callback)
    }

    // cloudant
    function viewSearchAsStream (ddoc, viewName, qs) {
      return view(ddoc, viewName, { type: 'search', stream: true }, qs)
    }

    // http://docs.couchdb.org/en/latest/api/ddoc/render.html#get--db-_design-ddoc-_show-func
    function showDoc (ddoc, viewName, docName, qs, callback) {
      return view(ddoc, viewName + '/' + docName, { type: 'show' }, qs, callback)
    }

    // http://docs.couchdb.org/en/latest/api/ddoc/render.html#put--db-_design-ddoc-_update-func-docid
    function updateWithHandler (ddoc, viewName, docName, body, callback) {
      if (typeof body === 'function') {
        callback = body
        body = undefined
      }
      return view(ddoc, viewName + '/' + encodeURIComponent(docName), {
        type: 'update',
        method: 'PUT',
        body: body
      }, callback)
    }

    function viewWithList (ddoc, viewName, listName, qs, callback) {
      return view(ddoc, listName + '/' + viewName, {
        type: 'list'
      }, qs, callback)
    }

    // http://docs.couchdb.org/en/latest/api/database/bulk-api.html#post--db-_bulksDoc
    function bulksDoc (docs, qs0, callback0) {
      const { opts, callback } = getCallback(qs0, callback0)
      return relax({
        db: dbName,
        path: '_bulk_docs',
        body: docs,
        method: 'POST',
        qs: opts
      }, callback)
    }

    // http://docs.couchdb.org/en/latest/api/document/common.html#creating-multiple-attachments
    function insertMultipart (doc, attachments, qs, callback) {
      if (typeof qs === 'string') {
        qs = { docName: qs }
      }
      qs = qs || {}

      const docName = qs.docName
      delete qs.docName

      doc = Object.assign({ _attachments: {} }, doc)

      const multipart = []

      attachments.forEach(function (att) {
        doc._attachments[att.name] = {
          follows: true,
          length: Buffer.isBuffer(att.data)
            ? att.data.length : Buffer.byteLength(att.data),
          /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
          'content_type': att.content_type
        }
        multipart.push({ body: att.data })
      })

      multipart.unshift({
        'content-type': 'application/json',
        body: JSON.stringify(doc)
      })

      return relax({
        db: dbName,
        method: 'PUT',
        contentType: 'multipart/related',
        doc: docName,
        qs: qs,
        multipart: multipart
      }, callback)
    }

    function getMultipart (docName, qs0, callback0) {
      const { opts, callback } = getCallback(qs0, callback0)
      opts.attachments = true

      return relax({
        db: dbName,
        doc: docName,
        encoding: null,
        accept: 'multipart/related',
        qs: opts
      }, callback)
    }

    function insertAtt (docName, attName, att, contentType, qs0, callback0) {
      const { opts, callback } = getCallback(qs0, callback0)
      return relax({
        db: dbName,
        att: attName,
        method: 'PUT',
        contentType: contentType,
        doc: docName,
        qs: opts,
        body: att,
        dontStringify: true
      }, callback)
    }

    function insertAttAsStream (docName, attName, att, contentType, opts) {
      return relax({
        db: dbName,
        att: attName,
        method: 'PUT',
        contentType: contentType,
        doc: docName,
        qs: opts,
        body: att,
        stream: true,
        dontStringify: true
      })
    }

    function getAtt (docName, attName, qs0, callback0) {
      const { opts, callback } = getCallback(qs0, callback0)
      return relax({
        db: dbName,
        att: attName,
        doc: docName,
        qs: opts,
        encoding: null,
        dontParse: true
      }, callback)
    }

    function getAttAsStream (docName, attName, opts) {
      return relax({
        db: dbName,
        att: attName,
        doc: docName,
        qs: opts,
        stream: true,
        encoding: null,
        dontParse: true
      })
    }

    function destroyAtt (docName, attName, qs, callback) {
      return relax({
        db: dbName,
        att: attName,
        method: 'DELETE',
        doc: docName,
        qs: qs
      }, callback)
    }

    function find (selector, callback) {
      return relax({
        db: dbName,
        path: '_find',
        method: 'POST',
        body: selector
      }, callback)
    }

    function findAsStream (selector) {
      return relax({
        db: dbName,
        path: '_find',
        method: 'POST',
        body: selector,
        stream: true
      })
    }

    function createIndex (indexDef, callback) {
      return relax({
        db: dbName,
        path: '_index',
        method: 'POST',
        body: indexDef
      }, callback)
    }

    // db level exports
    docScope = {
      info: function (cb) {
        return getDb(dbName, cb)
      },
      replicate: function (target, opts, cb) {
        return replicateDb(dbName, target, opts, cb)
      },
      compact: function (cb) {
        return compactDb(dbName, cb)
      },
      changes: function (qs, cb) {
        return changesDb(dbName, qs, cb)
      },
      changesAsStream: function (qs) {
        return changesDbAsStream(dbName, qs)
      },
      follow: function (qs, cb) {
        return followDb(dbName, qs, cb)
      },
      auth: auth,
      session: session,
      insert: insertDoc,
      get: getDoc,
      head: headDoc,
      copy: copyDoc,
      destroy: destroyDoc,
      bulk: bulksDoc,
      list: listDoc,
      listAsStream: listDocAsStream,
      fetch: fetchDocs,
      fetchRevs: fetchRevs,
      config: { url: cfg.url, db: dbName },
      multipart: {
        insert: insertMultipart,
        get: getMultipart
      },
      attachment: {
        insert: insertAtt,
        insertAsStream: insertAttAsStream,
        get: getAtt,
        getAsStream: getAttAsStream,
        destroy: destroyAtt
      },
      show: showDoc,
      atomic: updateWithHandler,
      updateWithHandler: updateWithHandler,
      baseView: view,
      search: viewSearch,
      searchAsStream: viewSearchAsStream,
      view: viewDocs,
      viewAsStream: viewDocsAsStream,
      find: find,
      findAsStream: findAsStream,
      createIndex: createIndex,
      viewWithList: viewWithList,
      server: serverScope,
      replication: {
        enable: function (target, opts, cb) {
          return enableReplication(dbName, target, opts, cb)
        },
        disable: function (id, revision, opts, cb) {
          return disableReplication(id, revision, opts, cb)
        },
        query: function (id, opts, cb) {
          return queryReplication(id, opts, cb)
        }
      }
    }

    docScope.view.compact = function (ddoc, cb) {
      return compactDb(dbName, ddoc, cb)
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
      follow: followDb,
      followUpdates: followUpdates,
      updates: updates
    },
    use: docModule,
    scope: docModule,
    request: relax,
    relax: relax,
    dinosaur: relax,
    auth: auth,
    session: session,
    updates: updates,
    followUpdates: followUpdates,
    uuids: uuids
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
  return u.resolve(couchUrl, dbName)
}
