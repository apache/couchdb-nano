# Migrating from Nano 10 to Nano 11

The highlights:

- Nano 11's HTTP client is replaced with the native Node.js _fetch_ function meaning that Nano 11 only works on Node.js 20 and above.
- Nano no longer supports `requestDefaults` to configure the client options.
- Nano no longer supports callbacks.

## Node.js versions

> ** Nano 11 is a breaking change for users of Node.s 20 or earlier **

Nano 10 uses the Axios library as an HTTP/HTTPS client. Keeping up with changes to Axios and its dependencies made maintaining this library a chore, so as of Nano 11 we use Node.js's built-in _fetch_ API as our HTTP client. This makes Nano a _zero dependency_ library which makes for faster installs, easier maintenance and slightly better performance.

Nano 11 is only compatible with Node.js versions 20 and newer, because it is only these Node versions that have the [fetch](https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch) HTTP client baked in. See [Node.js's Long-term Support page](https://nodejs.org/en/about/previous-releases) to see which are the currently supported and maintained versions. In short:

- If you are using Node.js 20 or newer, use Nano 11.
- If you need to use Node.js 18 or older, use Nano 10.

Nano 10 may continue to receive some security fixes for a time, but Nano 11 represents the future of this project and at some point, support for Nano 10 will cease.

## Agent options

> ** Nano 11 no longer supports `requestDefaults` to configure the HTTP client **

None of Nano's API has changed _except_ when a user is supplying non-default connection handling parameters. Gone is `requestDefaults` which dates back to the "request" days and instead an optional `agentOptions` can be provided which is documented in the README and in TypeScript.

```js
const agentOptions = {
  bodyTimeout: 30000,
  headersTimeout: 30000,
  keepAliveMaxTimeout: 600000,
  keepAliveTimeout: 30000,
  keepAliveTimeoutThreshold: 1000,
  maxHeaderSize: 16384,
  maxResponseSize: -1,
  pipelining: 6,
  connect: { 
    timeout: 10000
  },
  strictContentLength: true,
  connections: null,
  maxRedirections: 0
}
const undici = require('undici')
const undiciOptions = new undici.Agent(agentOptions)
const nano = Nano({ url: 'http://127.0.0.1:5984', undiciOptions })
```

> Note: to supply a custom agent, you will need the [undici](https://www.npmjs.com/package/undici) module as a dependency in your own project. Undici is the library that powers Node.js's _fetch_ API but its "Agent" is not programmatically accessible unless undici is imported separately.

## Callbacks

> ** Nano 11 no longer supports callbacks **

In Nano 10 and earlier, the last parameter to most Nano functions was a callback so you could do:

```js
db.list(function(err, data) { 
  console.log('response', err, data)
})
```

This was the way asynchronous activity was handled in the early days of Node.js but as of Nano 11 all callbacks are removed and we expect the use of Promises:

```js
db.list().then((data) => { console.log('response', data )})
```

or more commonly, the `await` pattern:

```js
const data = await db.list()
console.log('response', data)
```

If your code makes use of the callback style then **it will not work with Nano 11**: you will need to rewrite your code to use Promises or await, or remain on Nano 10.
