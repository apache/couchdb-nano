const EventEmitter = require('events').EventEmitter
const stream = require('stream')
const axios = require('axios').default
const pkg = require('../package.json')

// streaming line breaker
const liner = () => {
  const liner = new stream.Transform({ objectMode: true })

  liner._transform = function (chunk, encoding, done) {
    let data = chunk.toString('utf8')
    if (this._lastLineData) {
      data = this._lastLineData + data
      this._lastLineData = null
    }

    const lines = data.split(/\s*\n/)
    this._lastLineData = lines.splice(lines.length - 1, 1)[0]
    lines.forEach(this.push.bind(this))
    done()
  }

  liner._flush = function (done) {
    this.push(this._lastLineData)
    this._lastLineData = null
    done()
  }

  return liner
}

// streaming change processor
const changeProcessor = (ee, batchSize) => {
  const changeProcessor = new stream.Transform({ objectMode: true })
  const buffer = []
  changeProcessor.lastSeq = '0'

  // emit batch of data, record last sequence token
  const emit = (data) => {
    ee.emit('batch', data)
  }

  changeProcessor._transform = function (chunk, encoding, done) {
    // remove last char from string
    if (chunk[chunk.length - 1] === ',') {
      chunk = chunk.slice(0, -1)
    }

    try {
      const j = JSON.parse(chunk)
      buffer.push(j)
      if (buffer.length >= batchSize) {
        emit(buffer.splice(0, batchSize))
      }
      done()
    } catch (e) {
      // look for last_seq
      const match = chunk.match(/"last_seq":"([^"]+)"/)
      if (match) {
        changeProcessor.lastSeq = match[1]
      }
      done()
    }
  }

  changeProcessor._flush = function (done) {
    if (buffer.length > 0) {
      emit(buffer.splice(0, buffer.length))
    }
    done()
  }

  return changeProcessor
}

/**
 * Monitors the changes feed (after calling .start()/.get()) and emits events
 *  - 'change' - per change
 *  - 'batch' - per batch of changes
 *  - 'seq' - per change of sequence number
 *  - 'error' - per 4xx error (except 429)
 *
 * @param {String} db - Name of the database.
 * @param {String} couchURL - The URL (including credentials of the CouchDB service)
 * @param {Object} headers - HTTP headers (optional)
 */
class ChangesReader {
  // constructor
  constructor (db, couchURL, headers) {
    this.db = db
    this.couchURL = couchURL
    this.setDefaults()
    const defaultHeaders = {
      'user-agent': `${pkg.name}/${pkg.version} (Node.js ${process.version})`
    }
    this.headers = Object.assign(defaultHeaders, headers || {})
  }

  // set defaults
  setDefaults () {
    this.ee = new EventEmitter()
    this.batchSize = 100
    this.fastChanges = false
    this.since = 'now'
    this.includeDocs = false
    this.timeout = 60000
    this.started = false
    this.wait = false
    this.stopOnEmptyChanges = false // whether to stop polling if we get an empty set of changes back
    this.continue = true // whether to poll again
    this.qs = {} // extra querystring parameters
    this.selector = null
  }

  // prevent another poll happening
  stop () {
    this.continue = false
  }

  // sleep, promise style
  async sleep (t) {
    return new Promise((resolve, reject) => {
      setTimeout(() => { resolve() }, t)
    })
  }

  // called to start listening to the changes feed. The opts object can contain:
  // - batchSize - the number of records to return per HTTP request
  // - since - the the sequence token to start from (defaults to 'now')
  start (opts) {
    const self = this

    // if we're already listening for changes
    if (self.started) {
      // return the existing event emitter
      return self.ee
    }
    self.started = true

    // handle overidden defaults
    opts = opts || {}
    Object.assign(self, opts)

    // the work function is async and runs in the background
    // with a big do/while loop
    const work = async () => {
      do {
        // formulate changes feed longpoll HTTP request
        let pause = 0
        const req = {
          baseURL: self.couchURL,
          url: encodeURIComponent(self.db) + '/_changes',
          method: 'post',
          params: {
            feed: 'longpoll',
            timeout: self.timeout,
            since: self.since,
            limit: self.batchSize,
            include_docs: self.includeDocs
          },
          data: {},
          headers: this.headers
        }
        if (self.fastChanges) {
          req.params.seq_interval = self.batchSize
        }
        if (self.selector) {
          req.params.filter = '_selector'
          req.data.selector = self.selector
        }
        Object.assign(req.params, opts.qs)

        // make HTTP request to get up to batchSize changes from the feed
        try {
          const response = await axios(req)
          const data = response.data

          // update the since state
          if (data && data.last_seq && data.last_seq !== self.since) {
            self.since = data.last_seq
            self.ee.emit('seq', self.since)
          }

          // stop on empty batch or small batch
          if (self.stopOnEmptyChanges && data && typeof data.results !== 'undefined' && data.results.length < self.batchSize) {
            self.continue = false
          }

          // if we have data
          if (data && data.results && data.results.length > 0) {
            // emit 'change' events
            for (const i in data.results) {
              self.ee.emit('change', data.results[i])
            }

            // batch event
            // emit 'batch' event
            if (self.wait) {
              // in 'wait' mode, we need to wait until the user calls
              // a 'done' function before issuing the next change request
              await new Promise((resolve, reject) => {
                self.ee.emit('batch', data.results, () => {
                  resolve()
                })
              })
            } else {
              // when not in 'wait' mode, we can emit the results
              // and continue immediately, unless there were zero results -
              // we don't want to poll too quickly
              self.ee.emit('batch', data.results)
            }
          }
        } catch (err) {
          // error (wrong password, bad since value etc)
          err.statusCode = (err.response && err.response.status) || 500

          // if the error is fatal
          if (err && err.statusCode && err.statusCode >= 400 && err.statusCode !== 429 && err.statusCode < 500) {
            self.continue = false
          } else {
            // don't immediately retry on error
            pause = 5000
          }

          self.ee.emit('error', err)
        }

        // pause before next request?
        if (self.continue && pause > 0) {
          await self.sleep(pause)
          pause = 0
        }
      } while (self.continue)

      // reset
      self.ee.emit('end', self.since)
      self.setDefaults()
    }
    work()

    // return the event emitter to the caller
    return self.ee
  }

  // called to start listening to the changes feed for a finite number of changes. The opts object can contain:
  // - batchSize - the number of records to return per HTTP request
  // - since - the sequence token to start from (defaults to 'now')
  get (opts) {
    this.stopOnEmptyChanges = true
    return this.start(opts)
  }

  // called to spool through changes to "now" in one long HTTP request
  spool (opts) {
    const self = this
    self.setDefaults()
    opts = opts || {}
    Object.assign(self, opts)
    const req = {
      method: 'post',
      baseURL: self.couchURL,
      url: encodeURIComponent(self.db) + '/_changes',
      params: {
        since: self.since,
        include_docs: self.includeDocs,
        seq_interval: self.batchSize
      },
      responseType: 'stream',
      data: {},
      headers: this.headers
    }
    if (self.selector) {
      req.params.filter = '_selector'
      req.data.selector = self.selector
    }
    const lin = liner()
    const cp = changeProcessor(self.ee, self.batchSize)
    axios(req).then((response) => {
      response.data
        .pipe(lin)
        .pipe(cp)
        .on('finish', (lastSeq) => {
          // the 'end' event was triggering before the last data event
          setTimeout(() => {
            self.ee.emit('end', cp.lastSeq)
          }, 10)
        })
        .on('error', (e) => {
          self.ee.emit('error', e)
        })
    })

    return self.ee
  }
}

module.exports = ChangesReader
