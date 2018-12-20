const UrlPattern = require('url-pattern');

const handlerChain = [];

function use(handler) {
    handlerChain.push({ path: new UrlPattern('*'), func: handler, method: '*' });
}
function get(path, handler) {
    handlerChain.push({ path: new UrlPattern(path), func: handler, method: 'GET' });
}
function put(path, handler) {
    handlerChain.push({ path: new UrlPattern(path), func: handler, method: 'PUT' });
}
function post(path, handler) {
    handlerChain.push({ path: new UrlPattern(path), func: handler, method: 'POST' });
}

function handleRequest(event) {

    return new Promise(function(resolve) {

        const url = new URL(event.request.url);
        const context = {
            responseHeaders: { },
            respondWith: response => resolve(response),
            waitUntil: promise => event.waitUntil(promise),
        };
        let chainLink = -1;

        function next() {
            chainLink++;
            if (chainLink < handlerChain.length) {
                handler = handlerChain[chainLink];
                const match = handler.path.match(url.pathname);
                if (match !== null && (handler.method === '*'
                    || handler.method === event.request.method)) {
                    context.requestUrlParams = match;
                    handler.func(event.request, context, next);
                }
                else {
                    next(); // call next middleware handler
                }
            }
            else {
                const errorResponse = new Response("404 - Resource not found\n", {
                    status: 404,
                    headers: {
                        'Content-Type': 'text/html; charset=utf-8'
                    }
                });
                context.respondWith(errorResponse)
            }
        }
        next();
    });
}

exports.removeTrailingSlash = removeTrailingSlash;
exports.removeQueryParams = removeQueryParams;
exports.use = use;
exports.get = get;
exports.put = put;
exports.post = post;
exports.handleRequest = handleRequest;

function removeTrailingSlash(request, context, next) {

    const parsedUrl = new URL(request.url);
    let path = parsedUrl.pathname;

    if (path.endsWith('/')) {
        parsedUrl.pathname = path.slice(0, -1);
        parsedUrl.search = '';
        context.respondWith(new Response(null, {
            status: 301,
            headers: {
                'Location': `${parsedUrl.toString()}`
            }
        }));
    }
    else {
        next();
    }
}

function removeQueryParams(request, context, next) {

    const parsedUrl = new URL(request.url);
    if (parsedUrl.search.length > 0) {
        parsedUrl.search = '';
        context.respondWith(new Response(null, {
            status: 301,
            headers: {
                'Location': `${parsedUrl.toString()}`
            }
        }));
    }
    else {
        next();
    }
}
