const tough = require('tough-cookie')
const cookieJar = new tough.CookieJar()

// this is a monkey-patch of toughcookie's cookiejar, as it doesn't handle
// the refreshing of cookies from CouchDB properly
// see https://github.com/salesforce/tough-cookie/issues/154
cookieJar.cloudantPatch = true
// Replace the store's updateCookie function with one that applies a patch to newCookie
const originalUpdateCookieFn = cookieJar.store.updateCookie
cookieJar.store.updateCookie = function (oldCookie, newCookie, cb) {
  // Add current time as an update timestamp to the newCookie
  newCookie.cloudantPatchUpdateTime = new Date()
  // Replace the cookie's expiryTime function with one that uses cloudantPatchUpdateTime
  // in place of creation time to check the expiry.
  const originalExpiryTimeFn = newCookie.expiryTime
  newCookie.expiryTime = function (now) {
    // The original expiryTime check is relative to a time in this order:
    // 1. supplied now argument
    // 2. this.creation (original cookie creation time)
    // 3. current time
    // This patch replaces 2 with an expiry check relative to the cloudantPatchUpdateTime if set instead of
    // the creation time by passing it as the now argument.
    return originalExpiryTimeFn.call(
      newCookie,
      newCookie.cloudantPatchUpdateTime || now
    )
  }
  // Finally delegate back to the original update function or the fallback put (which is set by Cookie
  // when an update function is not present on the store). Since we always set an update function for our
  // patch we need to also provide that fallback.
  if (originalUpdateCookieFn) {
    originalUpdateCookieFn.call(
      cookieJar.store,
      oldCookie,
      newCookie,
      cb
    )
  } else {
    cookieJar.store.putCookie(newCookie, cb)
  }
}
module.exports = {
  tough,
  cookieJar
}
