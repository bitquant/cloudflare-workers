var Trouter = require('trouter');

// Webpack exports Trouter as Trouter.default
if (typeof Trouter !== 'function') {
    Trouter = Trouter.default;
}

class WorkerRouter extends Trouter {

    constructor() {
        super();
    }

    use(path, ...handlers) {
        if (typeof path === 'function') {
            handlers.unshift(path);
            super.use('/', ...handlers);
        }
        else {
            super.use(path, ...handlers);
        }
    }
}

WorkerRouter.prototype.handleRequest = async function(event) {

    try {
        const request = event.request;
        const url = new URL(request.url);
        const context = {
            waitUntil: (p) => event.waitUntil(p)
        }

        var result = this.find(request.method, url.pathname);
        context.pathParams = result.params;

        for (let handler of result.handlers) {
            const response = await handler(request, context);
            if (typeof response !== 'undefined') {
                return response;
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

module.exports = new WorkerRouter();
