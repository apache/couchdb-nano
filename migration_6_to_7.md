# Migration Guide for moving from Nano 6.x to 7.x

Version 7.0.0 saw a major switch in return values from the majority of Nano functions. The version 6 version of Nano always returned a [request](https://www.npmjs.com/package/request) object from any function call that made an HTTP/HTTPS request.


In Nano 6:

```js
// Nano 6
var db = nano.db.use('mydb')
var x = db.get('mydoc') 
// x is a request object
```

In Nano 7:

```js
// Nano 7
const db = nano.db.use('mydb')
const x = await db.get('mydoc') 
// the return value of db.get is a Promise, 
// the 'await' operator waits for the Promise to resolve and 
// x is your requested CouchDB object
```

If you are not using the streaming properties of Nano 6's return value, you may not need to change any code at all. This document outlines the areas that have changed and what you need to do to your code.

## Streaming

If you were using the returned request object to:

- pipe the result to another stream
- listen to HTTP events ( `.on('data', function() {} )` etc)

then **you will need to change your code** to make it work with Nano v7. There are handful of new `..AsStream` function calls the *do* return a request object. They are:

- nano.db.listAsStream - fetch a list of database names
- db.attachment.insertAsStream - insert an attachment from a stream
- db.attachment.getAsStream - retrieve an attachment as a stream
- db.listAsStream - fetch a list of documents 
- db.findAsStream - query a database using a "Mango" selector
- db.searchAsStream - perform a Lucene-style query
- db.viewAsStream - query a MapReduce view
- db.changesAsStream - fetch a database's changes feed

There are non-streaming versions of all of the above functions that return a Promise - simply remove the "AsStream" suffix.

There isn't an `...AsStream` function for every CouchDB operation - only for ones which may result in lots of data being moved around or where binary data is being passed around (attachments). The streaming functions are useful to pipe data data through your app between CouchDB and your client without your app having to buffer all of the data in memory at once. 

## Promises

In Nano 7, most functions return a native [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) instead of a request object.

If you have code in the *callback* style, then Nano 7 will still work:

```js
// Nano 7
db.get('mydoc', (err, data) => {
  console.log(err, data)
})
```

but you have the option of using the returned *Promise* to deal with the return of asynchronous data:

```js
db.get('mydoc').then((doc) => {
  console.log(doc)
}).catch((err) => {
  console.log(err)
})
```

The Promise style of code lets you code sequences of asynchronous calls at the same level of indentation (the callback style forces you to indent further to the right with each call!):

```js
db.get('mydoc').then((doc) => {
  doc.last_updated = new Date().getTime()
  return db.insert(doc)
}.then((response) => {
  console.log('doc updated')
}).catch((err) => {
  console.log(err)
})
```

In a JavaScript [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function), the code becomes even neater with the [await operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await):

```js
let doc = await db.get('mydoc')
doc.last_updated = new Date().getTime()
let response = await db.insert(doc)
```

You may find that using the Promise style of coding helps you create neater, simpler code, but pre-existing code that uses the callback style should still work.

## TypeScript

If you use TypeScript to build your app, then Nano's TypeScript definitions have been updated to reflect the new return values. Having the Nano `get` function, for example, return a Promise which resolves with a `nano.DocumentGetResponse` means that your code editor can give you a helping hand with code completion, type-checking and a sanity checks leading to more accurate code at the first attempt.

