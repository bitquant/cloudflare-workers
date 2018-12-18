const routeMap = new Map();
const middlewareList = [];

async function removeTrailingSlash(request) {

    const parsedUrl = new URL(request.url);
    let path = parsedUrl.pathname;

    if (path.endsWith('/')) {
        parsedUrl.pathname = path.slice(0, -1);
        parsedUrl.search = '';
        return new Response(null, {
            status: 301,
            headers: {
                'Location': `${parsedUrl.toString()}`
            }
        });
    }
}

async function removeQueryParams(request) {

    const parsedUrl = new URL(request.url);
    if (parsedUrl.search.length > 0) {
        parsedUrl.search = '';
        return new Response(null, {
            status: 301,
            headers: {
                'Location': `${parsedUrl.toString()}`
            }
        });
    }
}

function registerPath(path, handler) {
    routeMap.set(path, handler);
}

function registerMiddleware(handler) {
    middlewareList.push(handler);
}

async function handleRequest(request, waitUntil) {

    // Process middleware
    for (const middleware of middlewareList) {
        const rsp = await middleware(request);
        if (rsp) {
            return rsp;
        }
    }

    return routeRequest(request, waitUntil);
}

exports.removeTrailingSlash = removeTrailingSlash;
exports.removeQueryParams = removeQueryParams;
exports.registerPath = registerPath;
exports.registerMiddleware = registerMiddleware;
exports.handleRequest = handleRequest;

function routeRequest(request, waitUntil) {

    const parsedUrl = new URL(request.url);
    const path = parsedUrl.pathname
    const handler = routeMap.get(path);

    if (handler) {
        return handler(request, waitUntil);
    }
    else {
        return new Response("404 - Resource not found", {
            status: 404,
            headers: {
                'Content-Type': 'text/html; charset=utf-8'
            }
        });
    }
}
