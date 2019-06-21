const UrlPattern = require('url-pattern');

const handlerChain = [];

function use(pathOrHandler, handler) {
    if (typeof pathOrHandler === 'string') {
        // pathOrHandler is a path
        handlerChain.push({ path: new UrlPattern(pathOrHandler), func: handler, method: '*' });
    }
    else {
        // pathOrHandler is a handler
        handlerChain.push({ path: new UrlPattern('*'), func: pathOrHandler, method: '*' });
    }
}
function get(path, handler) {
    handlerChain.push({ path: new UrlPattern(path), func: handler, method: 'GET' });
    handlerChain.push({ path: new UrlPattern(path), func: handler, method: 'HEAD' });
}
function put(path, handler) {
    handlerChain.push({ path: new UrlPattern(path), func: handler, method: 'PUT' });
}
function post(path, handler) {
    handlerChain.push({ path: new UrlPattern(path), func: handler, method: 'POST' });
}
function deleteHandler(path, handler) {
    handlerChain.push({ path: new UrlPattern(path), func: handler, method: 'DELETE' });
}
function head(path, handler) {
    handlerChain.push({ path: new UrlPattern(path), func: handler, method: 'HEAD' });
}

async function handleRequest(event) {

    try {
        const request = event.request;
        const url = new URL(request.url);
        const context = {
            waitUntil: (p) => event.waitUntil(p)
        }

        for (let handler of handlerChain) {

            const match = handler.path.match(url.pathname);

            if (match !== null &&
                (handler.method === '*' || handler.method === event.request.method))
            {
                context.pathParams = match;

                const response = await handler.func(request, context);

                if (typeof response !== 'undefined') {
                    return response;
                }
            }
        }

        return new Response("404 - Resource not found\n", {
            status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8'}
        });
    }
    catch (ex) {
        return new Response(`500 - ${ex.stack}`, {
            status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8'}
        });
    }
}

exports.removeTrailingSlash = removeTrailingSlash;
exports.removeQueryParams = removeQueryParams;
exports.use = use;
exports.get = get;
exports.put = put;
exports.post = post;
exports.delete = deleteHandler;
exports.head = head;
exports.handleRequest = handleRequest;

function removeTrailingSlash(request) {

    const parsedUrl = new URL(request.url);
    let path = parsedUrl.pathname;

    if (path.endsWith('/') && path.length > 1 ) {
        parsedUrl.pathname = path.slice(0, -1);
        parsedUrl.search = '';
        return new Response(null, { status: 301, headers: { 'Location': `${parsedUrl.toString()}`}});
    }
}

function removeQueryParams(request) {

    const parsedUrl = new URL(request.url);

    if (parsedUrl.search.length > 0) {
        parsedUrl.search = '';
        return new Response(null, {status: 301, headers: {'Location': `${parsedUrl.toString()}`}});
    }
}
