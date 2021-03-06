# cloudflare-workers
Routing for Cloudflare Workers.  Modeled after the ExpressJS framework to easily handle multiple paths in your worker.

## Install
```
$ npm install cloudflare-workers
```

## Usage
```javascript
const worker = require('cloudflare-workers');

worker.get('/', (request) => new Response('Welcome\n'))
worker.get('/hello', (request) => new Response('Hi there\n'))
worker.get('/goodbye', (request) => new Response('See you later\n'))

addEventListener('fetch', function(event) {
    event.respondWith(worker.handleRequest(event));
});
```
See ['Using NPM modules'](https://developers.cloudflare.com/workers/writing-workers/using-npm-modules/) to `require` the package in your worker.

## Supported Operations
`worker.use(handler)`  Add a handler that executes on every path

`worker.use(path, handler)`  Add a handler that executes on a specific path

`worker.get(path, handler)`  Executes a handler on GETs for a specific path

`worker.put(path, handler)`  Executes a handler on PUTs for a specific path

`worker.post(path, handler)`  Executes a handler on POSTs for a specific path

`worker.delete(path, handler)`  Executes a handler on DELETEs for a specific path

`worker.head(path, handler)`  Executes a handler on HEAD for a specific path

## Wildcard Paths
Use wildcard `*` to handle multiple routes with one handler.  For example
```javascript
worker.get('/public/css/*', (request) => fetch(request))
```

## Handler Order
Handlers are executed in the order in which they are registered.  If a handler returns `undefined` the next matching handler will be invoked.  Execution of handlers stops
once a handler returns a `Response` object.

## Request Context
 A request context is created for each request. It can be used to store
 any data needed during handing of an inbound request. The following handler
 just saves some header information which can be retrieved later
 by another handler.
 ```javascript
worker.use((request, context) => {
    context.responseHeaders = {
        'Cache-Control': 'private, max-age=0'
    }
})

worker.get('/some/path', (request, context) => {
    return new Response(`response with headers set in context data\n`, {
        headers: context.responseHeaders
    });
})
```

## Path Parameters
Path parameters are supported and can be accessed in the context `pathParams` value.

```javascript
worker.get('/user/:name/:account', (request, context) => {
    let username = context.pathParams.name;
    let accountId = context.pathParams.account;
    return new Response(`Hello ${username}. Your account number is ${accountId}\n`)
})
```

## Context waitUntil()
If background processing needs to be performed use `context.waitUntil` to
wait for a background task to complete.  Calling `waitUntil` will invoke `event.waitUntil` on the original fetch event.

## Special Handlers
Special handlers can be setup for additional control of the request/response
flow.  If the special handler returns a `Response` object normal route processing
will stop and the response will be sent out.

The `ingressHandler` executes prior to any route handlers.
```javascript
worker.ingressHandler = (request, context) => { context.startTime = new Date(); }
```

The `egressHandler` executes right before sending a response from a route handler.
```javascript
worker.egressHandler = (request, context, response) => {
    let endTime = new Date();
    let duration = endTime.valueOf() - context.startTime.valueOf();
    // do something with duration data
}
```

The `notFoundHandler` executes if the incoming request does not match any routes.
```javascript
worker.notFoundHandler = (request, context) => {
    return new Response('page not found!', { status: 404 });
}
```

The `errorHandler` executes if any error is thrown during processing of the request.
```javascript
worker.errorHandler = (request, context, err) => {
    return new Response(`internal error: ${err}`, { status: 500 })
}
```

## License
MIT license; see [LICENSE](./LICENSE).
