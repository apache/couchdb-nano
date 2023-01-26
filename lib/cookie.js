const { URL } = require('url')

// a simple cookie jar
class CookieJar {
  // create new empty cookie jar
  constructor () {
    this.jar = []
  }

  // remove expired cookies
  clean () {
    const now = new Date().getTime()
    for (let i = 0; i < this.jar.length; i++) {
      const c = this.jar[i]
      if (c.ts < now) {
        this.jar.splice(i, 1)
        i--
      }
    }
  }

  // add a cookie to the jar
  add (cookie, url) {
    // see if we have this cookie already
    const oldCookieIndex = this.findByName(url, cookie.name)

    // if we do, update it
    if (oldCookieIndex >= 0) {
      // update existing cookie
      this.jar[oldCookieIndex].value = cookie.value
      this.jar[oldCookieIndex].expires = cookie.expires
      this.jar[oldCookieIndex].ts = new Date(cookie.expires).getTime()
    } else {
      // otherwise, just add it
      this.jar.push(cookie)
    }
  }

  // locate a cookie by name & url
  findByName (url, name) {
    this.clean()
    const now = new Date().getTime()
    const parsedURL = new URL(url)
    for (let i = 0; i < this.jar.length; i++) {
      const c = this.jar[i]
      if (c.origin === parsedURL.origin &&
          c.name === name &&
          c.ts >= now) {
        return i
      }
    }
    return -1
  }

  // get a list of cookies to send for a supplied URL
  getCookieString (url) {
    let i
    // clean up deceased cookies
    this.clean()

    // find cookies that match the url
    const now = new Date().getTime()
    const parsedURL = new URL(url)
    const retval = []
    for (i = 0; i < this.jar.length; i++) {
      const c = this.jar[i]
      // if match domain name and timestamp
      if ((c.origin === parsedURL.origin ||
          (c.domain && parsedURL.hostname.endsWith(c.domain))) &&
          c.ts >= now) {
        // if cookie has httponly flag and this is not http(s), ignore
        if (c.httponly && !['http:', 'https:'].includes(parsedURL.protocol)) {
          continue
        }

        // if cookie has a path and it doesn't match incoming url, ignore
        if (c.path && !parsedURL.pathname.startsWith(c.path)) {
          continue
        }

        // if cookie has a secure flag and the transport isn't secure, ignore
        if (c.secure && parsedURL.protocol !== 'https:') {
          continue
        }

        // add to list of returned cookies
        retval.push(c.value)
      }
    }
    // if we've got cookies to return
    if (retval.length > 0) {
      // join them with semi-colons
      return retval.join('; ')
    } else {
      // otherwise a blank string
      return ''
    }
  }

  // parse a 'set-cookie' header of the form:
  //   AuthSession=YWRtaW46NjM5ODgzQ0Y6TuB66MczvkZ7axEJq6Fz0gOdhKY; Version=1; Expires=Tue, 13-Dec-2022 13:54:19 GMT; Max-Age=60; Path=/; HttpOnly
  parse (h, url) {
    const parsedURL = new URL(url)

    // split components by ; and remove whitespace
    const bits = h.split(';').map(s => s.trim())

    // extract the cookie's value from the start of the string
    const cookieValue = bits.shift()

    // start a cookie object
    const cookie = {
      name: cookieValue.split('=')[0], // the first part of the value
      origin: parsedURL.origin,
      pathname: parsedURL.pathname,
      protocol: parsedURL.protocol
    }
    bits.forEach((e) => {
      const lr = e.split('=')
      cookie[lr[0].toLowerCase()] = lr[1] || true
    })
    // calculate expiry timestamp
    cookie.ts = new Date(cookie.expires).getTime()
    cookie.value = cookieValue
    this.add(cookie, url)
  }
}

module.exports = CookieJar
